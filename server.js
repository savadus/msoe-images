const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
// --- Hosting Compatibility Layer (Persistent Storage) ---
const uploadDir = path.join(__dirname, 'uploads');

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(uploadDir));
app.use(express.json());

// Ensure base directories exist
try {
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
} catch (e) { console.warn('Directory check failed, but continuing...'); }

const foldersFile = path.join(uploadDir, 'folders.json');
const chatFile = path.join(uploadDir, 'chat.json');

// Initialize data files if missing
if (!fs.existsSync(foldersFile)) try { fs.writeFileSync(foldersFile, JSON.stringify([])); } catch(e){}
if (!fs.existsSync(chatFile)) try { fs.writeFileSync(chatFile, JSON.stringify([])); } catch(e){}

function getFolders() {
    try {
        const content = fs.readFileSync(foldersFile, 'utf8');
        return content ? JSON.parse(content) : [];
    } catch(e) { return []; }
}
function saveFolders(folders) {
    try {
        fs.writeFileSync(foldersFile, JSON.stringify(folders, null, 2));
    } catch(e) { console.error('Save folders failed:', e); }
}

function getChats() {
    try {
        const content = fs.readFileSync(chatFile, 'utf8');
        return content ? JSON.parse(content) : [];
    } catch(e) { return []; }
}
function saveChats(chats) {
    try {
        fs.writeFileSync(chatFile, JSON.stringify(chats, null, 2));
    } catch(e) { console.error('Save chats failed:', e); }
}

// Multer Config
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const folderId = req.body.folderId || 'default';
        const dest = path.join(uploadDir, folderId);
        if (!fs.existsSync(dest)) try { fs.mkdirSync(dest, { recursive: true }); } catch(e){}
        cb(null, dest);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
    }
});
const upload = multer({
    storage: storage,
    limits: { fileSize: 100 * 1024 * 1024 },
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png|gif|webp|heic|svg|tiff|mp4|mov|avi|mkv|webm/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const isImage = file.mimetype.startsWith('image/');
        const isVideo = file.mimetype.startsWith('video/');
        
        if (extname && (isImage || isVideo)) return cb(null, true);
        cb(null, false);
    }
}).array('images', 5000);

// Admin: Create a folder
app.post('/api/folders', (req, res) => {
    if (req.body.adminPassword !== '222879') return res.status(401).json({ success: false, msg: 'Unauthorized' });
    const { name, password, category, parentId } = req.body;
    if (!name) return res.status(400).json({ success: false, msg: 'Folder name required' });
    
    const folders = getFolders();
    const newFolder = { 
        id: Date.now().toString(), 
        name, 
        password: password || '', 
        category: category || 'images',
        parentId: (parentId === 'root' || !parentId) ? null : parentId,
        isPinned: false, 
        createdAt: Date.now() 
    };
    folders.push(newFolder);
    saveFolders(folders);
    
    // Create physical dir
    const dir = path.join(uploadDir, newFolder.id);
    if (!fs.existsSync(dir)) try { fs.mkdirSync(dir, { recursive: true }); } catch(e){}
    
    res.json({ success: true, folder: newFolder });
});

// Admin: Upload multiple images to a folder
app.post('/api/upload', (req, res) => {
    upload(req, res, (err) => {
        if (err) return res.status(400).json({ success: false, msg: err.toString() });
        if (req.body.password !== '222879') return res.status(401).json({ success: false, msg: 'Unauthorized!' });
        if (!req.files || req.files.length === 0) return res.status(400).json({ success: false, msg: 'No Files Selected!' });
        
        const folderId = req.body.folderId || 'default';
        const filesDeployed = req.files.map(f => `/uploads/${folderId}/${f.filename}`);
        res.status(200).json({ success: true, msg: `${req.files.length} Files Uploaded Successfully!`, files: filesDeployed });
    });
});

// Admin: Rename Folder
app.post('/api/folders/:id/rename', (req, res) => {
    const { adminPassword, newName } = req.body;
    if (adminPassword !== '222879') return res.status(401).json({ success: false, msg: 'Unauthorized' });
    
    if (!newName || newName.trim() === '') return res.status(400).json({ success: false, msg: 'New name is required' });

    const folders = getFolders();
    const folder = folders.find(f => f.id === req.params.id);
    if (!folder) return res.status(404).json({ success: false, msg: 'Folder not found' });
    
    folder.name = newName.trim();
    saveFolders(folders);
    res.json({ success: true, folder });
});

// Admin: Update Folder (Relocate/Move to new parent)
app.post('/api/folders/:id/move', (req, res) => {
    const { adminPassword, parentId } = req.body;
    if (adminPassword !== '222879') return res.status(401).json({ success: false, msg: 'Unauthorized' });
    
    const folders = getFolders();
    const folder = folders.find(f => f.id === req.params.id);
    if (!folder) return res.status(404).json({ success: false, msg: 'Folder not found' });
    
    if (parentId === req.params.id) {
        return res.status(400).json({ success: false, msg: 'Cannot move folder into itself' });
    }

    folder.parentId = (parentId === 'root' || !parentId) ? null : parentId;
    saveFolders(folders);
    res.json({ success: true, folder });
});

// Admin: Mark all folders as read/sync (for UI refresh)
app.post('/api/folders/sync', (req, res) => {
    res.json({ success: true });
});

// Public: Get all folders with file counts
app.get('/api/folders', (req, res) => {
    console.log(`[API] GET /api/folders called by ${req.ip}`);
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    const folders = getFolders();
    const sorted = folders.sort((a,b) => {
        if (a.isPinned !== b.isPinned) return b.isPinned ? 1 : -1;
        return b.createdAt - a.createdAt;
    });
    res.json({ success: true, folders: sorted.map(f => {
        const folderPath = path.join(uploadDir, f.id);
        let count = 0;
        if (fs.existsSync(folderPath)) {
            count = fs.readdirSync(folderPath).filter(file => !file.startsWith('.')).length;
        }
        return { 
            id: f.id, 
            name: f.name, 
            category: f.category || 'images',
            parentId: f.parentId || null,
            hasPassword: !!f.password, 
            isPinned: !!f.isPinned,
            fileCount: count
        };
    }) });
});

// Admin: Toggle Pin Folder
app.post('/api/folders/:id/pin', (req, res) => {
    const { adminPassword } = req.body;
    if (adminPassword !== '222879') return res.status(401).json({ success: false, msg: 'Unauthorized' });
    
    const folders = getFolders();
    const folder = folders.find(f => f.id === req.params.id);
    if (!folder) return res.status(404).json({ success: false, msg: 'Not found' });
    
    folder.isPinned = !folder.isPinned;
    saveFolders(folders);
    res.json({ success: true, isPinned: folder.isPinned });
});

// Public: Get images from folder
app.post('/api/folders/:id/images', (req, res) => {
    const folderId = req.params.id;
    const { password } = req.body;
    const folder = getFolders().find(f => f.id === folderId);
    if (!folder) return res.status(404).json({ success: false, msg: 'Folder not found' });
    if (folder.password && folder.password !== password) return res.status(401).json({ success: false, msg: 'Incorrect password' });
    
    const folderPath = path.join(uploadDir, folderId);
    if (!fs.existsSync(folderPath)) return res.json({ success: true, images: [], folderName: folder.name });
    
    const files = fs.readdirSync(folderPath).filter(f => !f.startsWith('.'));
    res.json({ success: true, images: files.map(file => ({ name: file, url: `/uploads/${folderId}/${file}` })), folderName: folder.name });
});

// Public: Feedback/Chat
app.post('/api/chat', (req, res) => {
    try {
        const { name, feedback, mediaUrl } = req.body;
        if (!name || !feedback) return res.status(400).json({ success: false, msg: 'Missing info' });
        
        const chats = getChats();
        const newChat = { 
            id: Date.now().toString(), 
            name, 
            feedback, 
            mediaUrl: mediaUrl || null,
            viewed: false,
            createdAt: Date.now() 
        };
        chats.push(newChat);
        saveChats(chats);
        res.json({ success: true, chat: newChat });
    } catch (err) {
        console.error('Feedback error:', err);
        res.status(500).json({ success: false, msg: 'Server storage error' });
    }
});

// Admin: Mark chat as viewed
app.post('/api/admin/chat/mark-viewed', (req, res) => {
    const { adminPassword, chatId } = req.body;
    if (adminPassword !== '222879') return res.status(401).json({ success: false, msg: 'Unauthorized' });
    
    let chats = getChats();
    const chatIndex = chats.findIndex(c => c.id == chatId);
    if (chatIndex !== -1) {
        chats[chatIndex].viewed = true;
        saveChats(chats);
        res.json({ success: true });
    } else {
        res.status(404).json({ success: false, msg: 'Chat not found' });
    }
});

// Admin: Delete an image
app.delete('/api/images', (req, res) => {
    const { adminPassword, folderId, filename } = req.body;
    if (adminPassword !== '222879') return res.status(401).json({ success: false, msg: 'Unauthorized' });
    if (!folderId || !filename) return res.status(400).json({ success: false, msg: 'Missing info' });
    
    const filePath = path.join(uploadDir, folderId, filename);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        res.json({ success: true, msg: 'Image deleted' });
    } else {
        res.status(404).json({ success: false, msg: 'Image not found' });
    }
});

// Admin: Delete an entire folder
app.delete('/api/folders/:id', (req, res) => {
    const { adminPassword } = req.body;
    const { id } = req.params;

    if (adminPassword !== '222879') return res.status(401).json({ success: false, msg: 'Unauthorized' });
    
    try {
        let folders = getFolders();
        const folderIndex = folders.findIndex(f => f.id === id);
        if (folderIndex === -1) return res.status(404).json({ success: false, msg: 'Folder not found' });
        
        const folderId = folders[folderIndex].id;
        folders.splice(folderIndex, 1);
        saveFolders(folders);
        
        const folderPath = path.join(uploadDir, folderId);
        if (fs.existsSync(folderPath)) {
            fs.rmSync(folderPath, { recursive: true, force: true });
        }
        res.json({ success: true, msg: 'Folder and contents deleted' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, msg: 'Server error' });
    }
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
});
