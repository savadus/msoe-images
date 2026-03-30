require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const cloudinary = require('cloudinary').v2;

const app = express();
const PORT = process.env.PORT || 3000;

// --- CLOUD CONFIGURATION ---
const requiredKeys = [
    'SUPABASE_URL', 
    'SUPABASE_SERVICE_ROLE_KEY', 
    'CLOUDINARY_CLOUD_NAME', 
    'CLOUDINARY_API_KEY', 
    'CLOUDINARY_API_SECRET'
];

requiredKeys.forEach(key => {
    if (!process.env[key]) {
        console.error(`CRITICAL: Missing environment variable ${key}`);
    }
});

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
let supabase = null;

if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
}

if (process.env.CLOUDINARY_CLOUD_NAME) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });
}

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// --- MULTER CLOUD STORAGE ---
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 100 * 1024 * 1024 }
}).array('images', 5000);

// --- API ENDPOINTS (SUPABASE + CLOUDINARY) ---

// Admin: Create a folder (Stack)
app.post('/api/folders', async (req, res) => {
    if (req.body.adminPassword !== '656565') return res.status(401).json({ success: false, msg: 'Unauthorized' });
    const { name, password, category, parentId } = req.body;
    if (!name) return res.status(400).json({ success: false, msg: 'Folder name required' });
    
    try {
        const { data, error } = await supabase.from('folders').insert([{
            name,
            password: password || '',
            category: category || 'images',
            parentId: (parentId === 'root' || !parentId) ? null : parentId,
            isPinned: false
        }]).select().single();

        if (error) throw error;
        res.json({ success: true, folder: data });
    } catch (err) {
        res.status(500).json({ success: false, msg: err.message });
    }
});

// Admin: Get Cloudinary Config (Safe for Browser)
app.get('/api/cloudinary-config', (req, res) => {
    res.json({ 
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        uploadPreset: 'msoe_preset' // The one we created in Step 1
    });
});

// Admin: Save Image Metadata (After Direct-to-Cloud Upload)
app.post('/api/image-metadata', async (req, res) => {
    if (req.body.adminPassword !== '656565') return res.status(401).json({ success: false, msg: 'Unauthorized' });
    const { folderId, name, url, publicId } = req.body;
    
    try {
        const { data, error } = await supabase.from('images').insert([{
            folderId,
            name,
            url,
            publicId
        }]).select();

        if (error) throw error;
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, msg: err.message });
    }
});

// [LEGACY/FALLBACK] Admin: Upload to Cloudinary & Save to Supabase
// Note: This still has the Vercel 4.5MB limit. Use the new metadata flow for large files!
app.post('/api/upload', async (req, res) => {
    upload(req, res, async (err) => {
        if (err) return res.status(400).json({ success: false, msg: err.toString() });
        if (req.body.password !== '656565') return res.status(401).json({ success: false, msg: 'Unauthorized!' });
        if (!req.files || req.files.length === 0) return res.status(400).json({ success: false, msg: 'No Files Selected!' });
        
        const folderId = req.body.folderId || 'default';
        const uploadPromises = req.files.map(file => {
            return new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    { folder: `msoe-images/${folderId}`, resource_type: 'auto' },
                    async (error, result) => {
                        if (error) return reject(error);
                        
                        const { error: dbErr } = await supabase.from('images').insert([{
                            folderId,
                            name: file.originalname,
                            url: result.secure_url,
                            publicId: result.public_id
                        }]);
                        
                        if (dbErr) return reject(dbErr);
                        resolve(result.secure_url);
                    }
                );
                stream.end(file.buffer);
            });
        });

        try {
            const results = await Promise.all(uploadPromises);
            res.status(200).json({ success: true, msg: `${req.files.length} Files Uploaded Seamlessly!`, files: results });
        } catch (uploadErr) {
            res.status(500).json({ success: false, msg: uploadErr.message });
        }
    });
});

// Public: Get all folders (Stacks)
app.get('/api/folders', async (req, res) => {
    try {
        const { data: folders, error: fErr } = await supabase.from('folders').select('*');
        if (fErr) throw fErr;

        // Get file counts for each folder
        const { data: counts, error: cErr } = await supabase.rpc('get_file_counts');
        const countMap = (counts || []).reduce((acc, c) => ({ ...acc, [c.folderId]: c.count }), {});

        const sorted = folders.sort((a,b) => {
            if (a.isPinned !== b.isPinned) return b.isPinned ? -1 : 1;
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

        res.json({ success: true, folders: sorted.map(f => ({
            id: f.id,
            name: f.name,
            category: f.category,
            parentId: f.parentId,
            hasPassword: !!f.password,
            isPinned: f.isPinned,
            fileCount: countMap[f.id] || 0
        })) });
    } catch (err) {
        res.status(500).json({ success: false, msg: err.message });
    }
});

// Public: Get images from folder
app.post('/api/folders/:id/images', async (req, res) => {
    const folderId = req.params.id;
    const { password } = req.body;
    
    try {
        const { data: folder, error: fErr } = await supabase.from('folders').select('*').eq('id', folderId).single();
        if (fErr || !folder) throw new Error('Stack not found');
        
        // Admin Access Bypass: If Admin Password is provided, ignore folder password
        const isAdmin = req.body.adminPassword === '656565';
        if (!isAdmin && folder.password && folder.password !== password) {
            return res.status(401).json({ success: false, msg: 'Incorrect password' });
        }

        const { data: images, error: iErr } = await supabase.from('images').select('*').eq('folderId', folderId);
        if (iErr) throw iErr;

        res.json({ success: true, images: images.map(img => ({ name: img.name, url: img.url })), folderName: folder.name });
    } catch (err) {
        res.status(500).json({ success: false, msg: err.message });
    }
});

// Public: Feedback/Chat
app.post('/api/chat', async (req, res) => {
    const { name, feedback, mediaUrl } = req.body;
    if (!name || !feedback) return res.status(400).json({ success: false, msg: 'Missing info' });
    
    try {
        const { data, error } = await supabase.from('chats').insert([{
            name,
            feedback,
            mediaUrl: mediaUrl || null,
            viewed: false
        }]).select().single();

        if (error) throw error;
        res.json({ success: true, chat: data });
    } catch (err) {
        res.status(500).json({ success: false, msg: err.message });
    }
});

// --- ADMIN CONTROLS (DELETE/RENAME) ---

app.post('/api/folders/:id/pin', async (req, res) => {
    if (req.body.adminPassword !== '656565') return res.status(401).json({ success: false, msg: 'Unauthorized' });
    try {
        const { data: folder, error: gErr } = await supabase.from('folders').select('isPinned').eq('id', req.params.id).single();
        if (gErr) throw gErr;

        const { error: sErr } = await supabase.from('folders').update({ isPinned: !folder.isPinned }).eq('id', req.params.id);
        if (sErr) throw sErr;
        res.json({ success: true, isPinned: !folder.isPinned });
    } catch (err) { res.status(500).json({ success: false, msg: err.message }); }
});

app.post('/api/folders/:id/rename', async (req, res) => {
    if (req.body.adminPassword !== '656565') return res.status(401).json({ success: false, msg: 'Unauthorized' });
    const { newName, newPassword } = req.body;
    try {
        const updateData = {};
        if (newName) updateData.name = newName;
        // If newPassword is provided (even an empty string), update it.
        if (typeof newPassword !== 'undefined') updateData.password = newPassword;

        const { error } = await supabase.from('folders').update(updateData).eq('id', req.params.id);
        if (error) throw error;
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false, msg: err.message }); }
});

app.post('/api/folders/:id/move', async (req, res) => {
    if (req.body.adminPassword !== '656565') return res.status(401).json({ success: false, msg: 'Unauthorized' });
    try {
        const { error } = await supabase.from('folders').update({ parentId: req.body.parentId === 'root' ? null : req.body.parentId }).eq('id', req.params.id);
        if (error) throw error;
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false, msg: err.message }); }
});

app.delete('/api/folders/:id', async (req, res) => {
    if (req.body.adminPassword !== '656565') return res.status(401).json({ success: false, msg: 'Unauthorized' });
    try {
        // Delete all images from Cloudinary first
        const { data: imgs } = await supabase.from('images').select('publicId').eq('folderId', req.params.id);
        if (imgs && imgs.length > 0) {
            await Promise.all(imgs.map(img => cloudinary.uploader.destroy(img.publicId)));
        }
        
        // Delete from DB (Images cascade or manual delete)
        await supabase.from('images').delete().eq('folderId', req.params.id);
        await supabase.from('folders').delete().eq('id', req.params.id);
        
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false, msg: err.message }); }
});

app.delete('/api/images', async (req, res) => {
    if (req.body.adminPassword !== '656565') return res.status(401).json({ success: false, msg: 'Unauthorized' });
    try {
        const { data: img } = await supabase.from('images').select('publicId').eq('name', req.body.filename).eq('folderId', req.body.folderId).single();
        if (img) await cloudinary.uploader.destroy(img.publicId);
        await supabase.from('images').delete().eq('name', req.body.filename).eq('folderId', req.body.folderId);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false, msg: err.message }); }
});

// Admin: Get all chats
app.post('/api/admin/chats', async (req, res) => {
    if (req.body.adminPassword !== '656565') return res.status(401).json({ success: false, msg: 'Unauthorized' });
    try {
        const { data: chats, error } = await supabase.from('chats').select('*').order('createdAt', { ascending: false });
        if (error) throw error;
        res.json({ success: true, chats });
    } catch (err) { res.status(500).json({ success: false, msg: err.message }); }
});

app.post('/api/admin/chat/mark-viewed', async (req, res) => {
    if (req.body.adminPassword !== '656565') return res.status(401).json({ success: false, msg: 'Unauthorized' });
    try {
        await supabase.from('chats').update({ viewed: true }).eq('id', req.body.chatId);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false, msg: err.message }); }
});

// Server Start
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
});
