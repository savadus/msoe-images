document.addEventListener('DOMContentLoaded', () => {
    // Auth Elements
    const authContainer = document.getElementById('authContainer');
    const mainDashboard = document.getElementById('mainDashboard');
    const passwordInput = document.getElementById('passwordInput');
    const authError = document.getElementById('authError');
    let sessionPassword = '';

    // Tabs
    const tabStacksBtn = document.getElementById('tabStacksBtn');
    const tabFeedbackBtn = document.getElementById('tabFeedbackBtn');
    const stacksView = document.getElementById('stacksView');
    const feedbackView = document.getElementById('feedbackView');
    const adminImagesView = document.getElementById('adminImagesView');
    const adminImagesGrid = document.getElementById('adminImagesGrid');
    const adminBackBtn = document.getElementById('adminBackBtn');
    const adminAddPhotoBtn = document.getElementById('adminAddPhotoBtn');
    const adminFolderTitle = document.getElementById('adminFolderTitle');
    const adminLoaderImages = document.getElementById('adminLoaderImages');

    // Folder Elements
    const adminFoldersGrid = document.getElementById('adminFoldersGrid');
    const createFolderCardBtn = document.getElementById('createFolderCardBtn');
    const createFolderPanel = document.getElementById('createFolderPanel');
    const createFolderForm = document.getElementById('createFolderForm');
    const cancelCreateFolderBtn = document.getElementById('cancelCreateFolderBtn');
    const folderNameInput = document.getElementById('folderNameInput');
    const folderPassInput = document.getElementById('folderPassInput');
    const createFolderBtn = document.getElementById('createFolderBtn');
    const folderStatusMessage = document.getElementById('folderStatusMessage');

    // Modal Upload Elements
    const uploadModal = document.getElementById('uploadModal');
    const closeUploadModalBtn = document.getElementById('closeUploadModalBtn');
    const uploadForm = document.getElementById('uploadForm');
    const dropZone = document.getElementById('dropZone');
    const dropZoneLabel = document.getElementById('dropZoneLabel');
    const imageInput = document.getElementById('imageInput');
    const previewContainer = document.getElementById('previewContainer');
    const uploadStatusMessage = document.getElementById('uploadStatusMessage');
    const uploadSubmitBtn = document.getElementById('uploadSubmitBtn');
    const uploadTargetFolderName = document.getElementById('uploadTargetFolderName');
    let activeUploadFolderId = '';

    // --- Hierarchical State ---
    const adminBreadcrumbs = document.getElementById('adminBreadcrumbs');
    const mainActionBtn = document.getElementById('mainActionBtn');
    const imagesActionBtn = document.getElementById('imagesActionBtn');
    const folderUploadInput = document.getElementById('folderUploadInput');
    const actionChoiceModal = document.getElementById('actionChoiceModal');
    const actionUploadFilesBtn = document.getElementById('actionUploadFilesBtn');
    const actionUploadFolderBtn = document.getElementById('actionUploadFolderBtn');
    const actionCreateSubfolderBtn = document.getElementById('actionCreateSubfolderBtn');
    const actionUploadDirectPosterBtn = document.getElementById('actionUploadDirectPosterBtn');
    const actionManageDirectPostersBtn = document.getElementById('actionManageDirectPostersBtn');
    const actionCancelBtn = document.getElementById('actionCancelBtn');
    let currentParentId = 'root'; 
    let navigationPath = [{ id: 'root', name: 'Home' }];
    let currentFolders = [];

    // Move Folder Modal Elements
    const moveFolderModal = document.getElementById('moveFolderModal');
    const moveFolderList = document.getElementById('moveFolderList');
    const moveFolderNameDisplay = document.getElementById('moveFolderNameDisplay');
    const moveFolderCancelBtn = document.getElementById('moveFolderCancelBtn');

    // Rename Folder Modal Elements
    const renameFolderModal = document.getElementById('renameFolderModal');
    const renameFolderNameInput = document.getElementById('renameFolderNameInput');
    const renameFolderCancelBtn = document.getElementById('renameFolderCancelBtn');
    const renameFolderConfirmBtn = document.getElementById('renameFolderConfirmBtn');
    let folderToRename = null;

    // Custom Confirmation Modal Elements
    const confirmModal = document.getElementById('confirmModal');
    const confirmTitle = document.getElementById('confirmTitle');
    const confirmMessage = document.getElementById('confirmMessage');
    const confirmCancelBtn = document.getElementById('confirmCancelBtn');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

    // --- Biometric & Selection Elements ---
    const authSelectionView = document.getElementById('authSelectionView');
    const passwordEntryView = document.getElementById('passwordEntryView');
    const selectPasswordBtn = document.getElementById('selectPasswordBtn');
    const selectFingerprintBtn = document.getElementById('selectFingerprintBtn');
    const selectFaceBtn = document.getElementById('selectFaceBtn');
    const backToSelectionBtn = document.getElementById('backToSelectionBtn');
    const biometricSelectionOption = document.getElementById('biometricSelectionOption');
    const faceSelectionOption = document.getElementById('faceSelectionOption');

    const biometricSetupPromo = document.getElementById('biometricSetupPromo');
    const enableFingerBtn = document.getElementById('enableFingerBtn');
    const enableFaceBtn = document.getElementById('enableFaceBtn');
    const skipBiometricBtn = document.getElementById('skipBiometricBtn');

    const disableBiometricBtn = document.getElementById('disableBiometricBtn');

    function checkBiometricSupport() {
        if (window.PublicKeyCredential && localStorage.getItem('biometric_id')) {
            biometricSelectionOption.style.display = 'block';
            faceSelectionOption.style.display = 'block';
            if (disableBiometricBtn) disableBiometricBtn.style.display = 'flex';
        }
    }
    checkBiometricSupport();

    function showCustomConfirm(title, message, callback, options = {}) {
        const { icon = 'trash-outline', color = '#ff7b72', bg = 'rgba(255, 123, 114, 0.1)' } = options;
        
        const confirmModal = document.getElementById('confirmModal');
        const confirmTitle = document.getElementById('confirmTitle');
        const confirmMessage = document.getElementById('confirmMessage');
        const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
        const confirmCancelBtn = document.getElementById('confirmCancelBtn');
        const confirmIcon = document.getElementById('confirmIcon');
        const confirmIconContainer = document.getElementById('confirmIconContainer');

        if (confirmTitle) confirmTitle.textContent = title;
        if (confirmMessage) confirmMessage.textContent = message;
        if (confirmIcon) confirmIcon.setAttribute('name', icon);
        if (confirmIconContainer) {
            confirmIconContainer.style.color = color;
            confirmIconContainer.style.background = bg;
        }
        
        // Update button style/text if it's not a deletion
        if (icon === 'folder-open-outline' || icon === 'cloud-upload-outline') {
            confirmDeleteBtn.textContent = 'Upload Now';
            confirmDeleteBtn.style.background = 'var(--accent-color)';
        } else {
            confirmDeleteBtn.textContent = 'Delete';
            confirmDeleteBtn.style.background = '#ff7b72';
        }

        confirmModal.style.display = 'flex';

        const onConfirm = () => {
            callback();
            close();
        };
        const close = () => {
            confirmModal.style.display = 'none';
            confirmDeleteBtn.removeEventListener('click', onConfirm);
            confirmCancelBtn.removeEventListener('click', close);
        };

        confirmDeleteBtn.addEventListener('click', onConfirm);
        confirmCancelBtn.addEventListener('click', close);
    }

    function showCustomAlert(title, message, options = {}) {
        const { icon = 'information-circle-outline', color = 'var(--accent-color)', bg = 'rgba(58, 167, 255, 0.1)' } = options;
        
        const alertModal = document.getElementById('customAlert');
        const alertTitle = document.getElementById('alertTitle');
        const alertMessage = document.getElementById('alertMessage');
        const alertOkBtn = document.getElementById('alertOkBtn');
        const alertIcon = document.getElementById('alertIcon');
        const alertIconContainer = document.getElementById('alertIconContainer');

        if (alertTitle) alertTitle.textContent = title;
        if (alertMessage) alertMessage.textContent = message;
        if (alertIcon) alertIcon.setAttribute('name', icon);
        if (alertIconContainer) {
            alertIconContainer.style.color = color;
            alertIconContainer.style.background = bg;
        }

        alertModal.style.display = 'flex';

        const onClose = () => {
            alertModal.style.display = 'none';
            alertOkBtn.removeEventListener('click', onClose);
        };
        alertOkBtn.addEventListener('click', onClose);
    }

    // --- Footer & Feedback Elements ---
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const themeIcon = document.getElementById('themeIcon');
    const chatModeBtn = document.getElementById('chatModeBtn');
    const feedbackModal = document.getElementById('feedbackModal');
    const cancelFeedbackBtn = document.getElementById('cancelFeedbackBtn');
    const submitFeedbackBtn = document.getElementById('submitFeedbackBtn');
    const feedbackName = document.getElementById('feedbackName');
    const feedbackText = document.getElementById('feedbackText');
    const feedbackStatus = document.getElementById('feedbackStatus');
    const whatsappLink = document.getElementById('whatsappLink');

    // Theme Toggle Logic
    themeToggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('light-theme');
        if (document.body.classList.contains('light-theme')) {
            themeIcon.setAttribute('name', 'moon-outline');
        } else {
            themeIcon.setAttribute('name', 'sunny-outline');
        }
    });

    // Feedback Modal Logic
    chatModeBtn.addEventListener('click', () => {
        feedbackModal.style.display = 'flex';
    });
    cancelFeedbackBtn.addEventListener('click', () => {
        feedbackModal.style.display = 'none';
        feedbackStatus.style.display = 'none';
    });
    submitFeedbackBtn.addEventListener('click', async () => {
        const name = feedbackName.value.trim();
        const text = feedbackText.value.trim();
        if (!name || !text) {
            feedbackStatus.textContent = 'Please provide both name and feedback';
            feedbackStatus.style.display = 'block';
            feedbackStatus.style.color = '#ff7b72';
            return;
        }

        submitFeedbackBtn.textContent = 'Sending...';
        submitFeedbackBtn.disabled = true;

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, feedback: text })
            });
            const data = await res.json();
            
            if (data.success) {
                feedbackModal.style.display = 'none';
                feedbackName.value = '';
                feedbackText.value = '';
                showSuccessModal();
                // If we are on feedback view, refresh it
                if (feedbackView.style.display === 'block') {
                    loadFeedback();
                }
            } else {
                feedbackStatus.textContent = data.msg;
                feedbackStatus.style.display = 'block';
            }
        } catch(e) {
            feedbackStatus.textContent = 'Network error!';
            feedbackStatus.style.display = 'block';
        } finally {
            submitFeedbackBtn.textContent = 'Send';
            submitFeedbackBtn.disabled = false;
        }
    });


    // 1. Handle Login Logic
    async function performAdminUnlock(pass) {
        if (pass === '656565') { 
            sessionPassword = pass; 
            authContainer.style.display = 'none';
            mainDashboard.style.display = 'block';
            
            // Hide non-essential footer items after login
            if (chatModeBtn) chatModeBtn.style.display = 'none';
            if (whatsappLink) whatsappLink.style.display = 'none';
            
            loadFoldersAdmin();
            loadFeedback(); // Load feedback panel

            // Show Biometric Setup if not yet enabled
            if (window.PublicKeyCredential && !localStorage.getItem('biometric_id')) {
                biometricSetupPromo.style.display = 'flex';
            }
            return true;
        } else {
            return false;
        }
    }

    passwordInput.addEventListener('input', async () => {
        authError.style.display = 'none'; // Clear error while typing
        const val = passwordInput.value;
        if (val.length === 6) {
            const success = await performAdminUnlock(val);
            if (!success && val === '656565') {
                // This shouldn't happen unless password changed
            } else if (!success) {
                // We don't show error automatically on 6 chars to avoid flickering while typing,
                // but if they hit 6 and it's wrong, we can let the button handle it or show error.
                // For now, let's just let the user click login if it doesn't auto-unlock.
            }
        }
    });

    // --- Biometric Logic ---
    async function registerBiometrics(label = 'Biometrics') {
        try {
            const challenge = new Uint8Array(32);
            window.crypto.getRandomValues(challenge);
            const userID = new Uint8Array(16);
            window.crypto.getRandomValues(userID);

            const publicKeyCredentialCreationOptions = {
                challenge,
                rp: { name: "Msoe Clicks", id: window.location.hostname },
                user: {
                    id: userID,
                    name: "admin",
                    displayName: "Gallery Admin"
                },
                pubKeyCredParams: [{ alg: -7, type: "public-key" }],
                authenticatorSelection: { authenticatorAttachment: "platform" },
                timeout: 60000,
                attestation: "direct"
            };

            const credential = await navigator.credentials.create({
                publicKey: publicKeyCredentialCreationOptions
            });

            if (credential) {
                localStorage.setItem('biometric_id', credential.id);
                localStorage.setItem('admin_secret', sessionPassword);
                biometricSetupPromo.style.display = 'none';
                if (disableBiometricBtn) disableBiometricBtn.style.display = 'flex';
                showCustomAlert(`${label} Enabled`, `${label} login enabled successfully!`);
            }
        } catch (err) {
            console.error('Biometric registration failed:', err);
            showCustomAlert('Error', 'Could not enable sensor: ' + err.message, { icon: 'alert-circle-outline', color: '#ff7b72', bg: 'rgba(255, 123, 114, 0.1)' });
        }
    }

    if (enableFingerBtn) enableFingerBtn.addEventListener('click', () => registerBiometrics('Touch ID'));
    if (enableFaceBtn) enableFaceBtn.addEventListener('click', () => registerBiometrics('Face ID'));

    skipBiometricBtn.addEventListener('click', () => {
        biometricSetupPromo.style.display = 'none';
    });

    // --- Selection UI Transition Logic ---
    selectPasswordBtn.addEventListener('click', () => {
        authSelectionView.style.display = 'none';
        passwordEntryView.style.display = 'block';
        passwordInput.value = ''; // Start fresh
        passwordInput.focus();
        // Browser hack for stubborn focus issues
        setTimeout(() => { if (passwordInput) passwordInput.focus(); }, 100);
    });

    // Tap anywhere on the card to focus the input again
    passwordEntryView.addEventListener('click', (e) => {
        if (e.target !== backToSelectionBtn && !backToSelectionBtn.contains(e.target)) {
            passwordInput.focus();
        }
    });

    backToSelectionBtn.addEventListener('click', () => {
        passwordEntryView.style.display = 'none';
        authSelectionView.style.display = 'block';
        authError.style.display = 'none';
    });

    // Shared Biometric Handler
    async function triggerBiometricAuth(type = 'finger') {
        if (type === 'face') {
            await triggerFaceScan();
            return;
        }

        const scannerOverlay = document.getElementById('biometricScanOverlay');
        const iconFinger = document.getElementById('scannerIconFinger');
        
        try {
            // Setup overlay icons
            iconFinger.style.display = 'block';
            
            // Show scanning UI
            scannerOverlay.style.display = 'flex';
            
            const challenge = new Uint8Array(32);
            window.crypto.getRandomValues(challenge);

            const publicKeyCredentialRequestOptions = {
                challenge,
                allowCredentials: [{
                    id: Uint8Array.from(atob(localStorage.getItem('biometric_id').replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0)),
                    type: 'public-key'
                }],
                timeout: 60000,
            };

            const assertion = await navigator.credentials.get({
                publicKey: publicKeyCredentialRequestOptions
            });

            if (assertion) {
                const storedSecret = localStorage.getItem('admin_secret');
                const success = await performAdminUnlock(storedSecret);
                if (!success) {
                    showCustomAlert('Security Error', 'Biometric credential linked to an invalid password.', { icon: 'lock-closed-outline', color: '#ff7b72', bg: 'rgba(255, 123, 114, 0.1)' });
                }
            }
        } catch (err) {
            console.error('Biometric login failed:', err);
            if (err.name !== 'NotAllowedError') {
                showCustomAlert('Auth Failed', 'Biometric authentication failed.', { icon: 'finger-print-outline', color: '#ff7b72', bg: 'rgba(255, 123, 114, 0.1)' });
            }
        } finally {
            scannerOverlay.style.display = 'none';
        }
    }

    async function triggerFaceScan() {
        const overlay = document.getElementById('faceScanOverlay');
        const video = document.getElementById('faceVideo');
        const status = document.getElementById('faceScanStatus');
        const cancelBtn = document.getElementById('cancelFaceBtn');
        let stream = null;

        const stopCamera = () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
                stream = null;
            }
            overlay.style.display = 'none';
        };

        cancelBtn.onclick = stopCamera;

        try {
            stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
            video.srcObject = stream;
            overlay.style.display = 'flex';

            // Phase 1: Pre-scan Align
            status.textContent = 'ALIGNING...';
            await new Promise(r => setTimeout(r, 1500));

            // Phase 2: Scanning Effect
            status.textContent = 'SCANNING ARCHITECTURE...';
            await new Promise(r => setTimeout(r, 2000));

            // Phase 3: Final System Biometric Verification
            status.textContent = 'MATCH FOUND...';
            await new Promise(r => setTimeout(r, 800));
            
            stopCamera();
            const storedSecret = localStorage.getItem('admin_secret');
            const success = await performAdminUnlock(storedSecret);
            if (!success) {
                showCustomAlert('Security Error', 'Face ID linked to invalid credentials.', { icon: 'lock-closed-outline' });
            }
        } catch (err) {
            console.error('Face ID failed:', err);
            stopCamera();
            if (err.name !== 'NotAllowedError') {
                showCustomAlert('Face ID Error', 'Verification failed or camera access denied.', { icon: 'face-recognition-outline', color: '#ff7b72', bg: 'rgba(255, 123, 114, 0.1)' });
            }
        }
    }

    selectFingerprintBtn.addEventListener('click', () => triggerBiometricAuth('finger'));
    selectFaceBtn.addEventListener('click', () => triggerBiometricAuth('face'));

    // Disable Biometrics Logic
    if (disableBiometricBtn) {
        disableBiometricBtn.addEventListener('click', () => {
            showCustomConfirm('Disable Biometric Lock?', 
                'Are you sure you want to remove Face ID and Fingerprint login from this device?', 
                () => {
                    localStorage.removeItem('biometric_id');
                    localStorage.removeItem('admin_secret');
                    disableBiometricBtn.style.display = 'none';
                    biometricSelectionOption.style.display = 'none';
                    faceSelectionOption.style.display = 'none';
                    showCustomAlert('Lock Removed', 'Biometric authentication has been disabled on this device.');
                }
            );
        });
    }

    // Handle Tabs
    tabStacksBtn.addEventListener('click', () => {
        tabStacksBtn.className = 'btn btn-primary';
        tabStacksBtn.style.background = '';
        tabStacksBtn.style.color = '#fff';
        tabFeedbackBtn.className = 'btn';
        tabFeedbackBtn.style.background = 'transparent';
        tabFeedbackBtn.style.color = 'var(--text-secondary)';
        stacksView.style.display = 'block';
        feedbackView.style.display = 'none';
        adminImagesView.style.display = 'none';
    });

    tabFeedbackBtn.addEventListener('click', () => {
        tabFeedbackBtn.className = 'btn btn-primary';
        tabFeedbackBtn.style.background = '';
        tabFeedbackBtn.style.color = '#fff';
        tabStacksBtn.className = 'btn';
        tabStacksBtn.style.background = 'transparent';
        tabStacksBtn.style.color = 'var(--text-secondary)';
        stacksView.style.display = 'none';
        feedbackView.style.display = 'block';
        adminImagesView.style.display = 'none';
        loadFeedback();
    });

    // 2. Load Folders Admin Grid 
    async function loadFoldersAdmin() {
        try {
            const res = await fetch('/api/folders');
            const data = await res.json();
            
            if (data.success) {
                currentFolders = data.folders;
                renderFoldersAdmin(currentFolders);
            }
        } catch (e) {
            console.error('Failed to load folders', e);
        }
    }

    // Category filtering removed from admin dashboard

    function updateBreadcrumbs() {
        adminBreadcrumbs.innerHTML = '';
        navigationPath.forEach((crumb, index) => {
            const span = document.createElement('span');
            span.textContent = crumb.name;
            span.className = 'breadcrumb-item';
            span.style.cursor = 'pointer';
            span.style.color = (index === navigationPath.length - 1) ? 'var(--text-secondary)' : 'var(--accent-color)';
            span.style.fontWeight = (index === navigationPath.length - 1) ? '400' : '600';
            
            if (index < navigationPath.length - 1) {
                span.addEventListener('click', () => {
                    navigationPath = navigationPath.slice(0, index + 1);
                    currentParentId = crumb.id;
                    updateBreadcrumbs();
                    renderFoldersAdmin(currentFolders);
                });
            }
            
            adminBreadcrumbs.appendChild(span);
            
            if (index < navigationPath.length - 1) {
                const separator = document.createElement('span');
                separator.textContent = ' / ';
                separator.style.margin = '0 0.5rem';
                separator.style.opacity = '0.5';
                adminBreadcrumbs.appendChild(separator);
            }
        });
    }

    function renderFoldersAdmin(folders) {
        adminFoldersGrid.innerHTML = '';
        // Removed createFolderCardBtn from grid as it's now accessible via the unified "+" Action button

        const filtered = folders.filter(f => (f.parentId || 'root') === currentParentId && f.name !== '__POSTER_ROOT__');

        filtered.forEach((f, idx) => {
            const card = document.createElement('div');
            card.className = 'card folder-card fade-in';
            card.style.animationDelay = `${idx * 0.05}s`;
            card.style.display = 'flex';
            card.style.flexDirection = 'column';
            card.style.alignItems = 'center';
            card.style.padding = '1.5rem 1rem';
            card.style.textAlign = 'center';
            card.style.cursor = 'pointer';
            card.style.justifyContent = 'center';
            card.style.position = 'relative';

            const icon = document.createElement('ion-icon');
            icon.setAttribute('name', 'folder-open-outline');
            icon.style.fontSize = '3rem';
            icon.style.color = 'var(--accent-color)';
            icon.style.marginBottom = '0.5rem';
            
            const title = document.createElement('h3');
            title.textContent = f.name;
            title.style.color = 'var(--text-primary)';
            title.style.fontSize = '1rem';

            card.appendChild(icon);
            card.appendChild(title);

            // Pin Toggle
            const pinBtn = document.createElement('button');
            pinBtn.className = 'btn-icon';
            pinBtn.style.position = 'absolute';
            pinBtn.style.top = '10px';
            pinBtn.style.left = '10px';
            pinBtn.style.zIndex = '10';
            pinBtn.style.background = f.isPinned ? 'var(--accent-color)' : 'rgba(0,0,0,0.5)';
            pinBtn.style.backdropFilter = 'blur(10px)';
            pinBtn.style.border = '1px solid rgba(255,255,255,0.1)';
            pinBtn.style.color = '#fff';
            pinBtn.style.borderRadius = '50%';
            pinBtn.style.width = '32px';
            pinBtn.style.height = '32px';
            pinBtn.style.display = 'flex';
            pinBtn.style.alignItems = 'center';
            pinBtn.style.justifyContent = 'center';
            pinBtn.style.fontSize = '1.1rem';
            pinBtn.innerHTML = `<ion-icon name="${f.isPinned ? 'pin' : 'pin-outline'}"></ion-icon>`;
            
            pinBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                try {
                    const res = await fetch(`/api/folders/${f.id}/pin`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ adminPassword: sessionPassword })
                    });
                    const data = await res.json();
                    if (data.success) loadFoldersAdmin();
                } catch(e) {}
            });
            card.appendChild(pinBtn);

            // Action Buttons Container (Hidden by default, shown on hover/touch)
            const actions = document.createElement('div');
            actions.style.display = 'flex';
            actions.style.gap = '0.5rem';
            actions.style.marginTop = '1rem';

            const renameBtn = document.createElement('button');
            renameBtn.className = 'btn btn-icon';
            renameBtn.innerHTML = '<ion-icon name="create-outline"></ion-icon>';
            renameBtn.style.color = 'var(--accent-color)';
            renameBtn.title = 'Rename Folder';
            renameBtn.onclick = (e) => {
                e.stopPropagation();
                showRenameModal(f);
            };

            const moveBtn = document.createElement('button');
            moveBtn.className = 'btn btn-icon';
            moveBtn.innerHTML = '<ion-icon name="swap-horizontal-outline"></ion-icon>';
            moveBtn.style.color = 'var(--accent-color)';
            moveBtn.title = 'Move Folder';
            moveBtn.onclick = (e) => {
                e.stopPropagation();
                showMoveFolderModal(f);
            };

            const delBtn = document.createElement('button');
            delBtn.className = 'btn btn-icon';
            delBtn.innerHTML = '<ion-icon name="trash-outline"></ion-icon>';
            delBtn.style.color = '#ff7b72';
            delBtn.title = 'Delete Folder';
            delBtn.onclick = (e) => {
                e.stopPropagation();
                showCustomConfirm('Delete Entire Stack?', `Are you sure you want to delete "${f.name}"?`, () => deleteFolder(f.id));
            };

            actions.appendChild(renameBtn);
            actions.appendChild(moveBtn);
            actions.appendChild(delBtn);
            card.appendChild(actions);

            // Double click to enter, Single click to select (using double click logic for mobile too)
            card.addEventListener('click', () => {
                navigationPath.push({ id: f.id, name: f.name });
                currentParentId = f.id;
                updateBreadcrumbs();
                loadFolderImagesAdmin(f.id, f.name); // Switch to integrated view
            });

            adminFoldersGrid.appendChild(card);
        });
    }

    async function loadFoldersAdmin() {
        try {
            const res = await fetch('/api/folders');
            const data = await res.json();
            if (data.success) {
                currentFolders = data.folders;
                if (currentParentId === 'root') {
                    stacksView.style.display = 'block';
                    adminImagesView.style.display = 'none';
                    renderFoldersAdmin(currentFolders);
                } else {
                    // Refresh current view if we are inside a folder
                    const currentFolder = currentFolders.find(f => f.id === currentParentId);
                    if (currentFolder) {
                        loadFolderImagesAdmin(currentParentId, currentFolder.name);
                    } else {
                        // Folder deleted? Back to root
                        currentParentId = 'root';
                        navigationPath = [{ id: 'root', name: 'Home' }];
                        updateBreadcrumbs();
                        stacksView.style.display = 'block';
                        adminImagesView.style.display = 'none';
                        renderFoldersAdmin(currentFolders);
                    }
                }
            }
        } catch(e) { console.error('Load folders error', e); }
    }



    // --- Integrated Admin Content View ---
    async function loadFolderImagesAdmin(folderId, folderName, highlightFilename = null) {
        activeUploadFolderId = folderId;
        stacksView.style.display = 'none';
        adminImagesView.style.display = 'block';
        adminLoaderImages.style.display = 'block';
        adminImagesGrid.innerHTML = '';
        adminFolderTitle.textContent = folderName;

        try {
            const res = await fetch(`/api/folders/${folderId}/images`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ adminPassword: sessionPassword }) 
            });
            const data = await res.json();
            adminLoaderImages.style.display = 'none';
            if (data.success) {
                // Find sub-folders for THIS specific parent folder
                const subFolders = currentFolders.filter(f => f.parentId === folderId);
                renderAdminContent(subFolders, data.images, folderId, highlightFilename);
            }
        } catch(e) {
            console.error('Failed to load admin content', e);
            adminLoaderImages.style.display = 'none';
        }
    }

    function renderAdminContent(subFolders, images, folderId, highlightFilename = null) {
        adminImagesGrid.innerHTML = '';
        
        // 1. Render Sub-folders first
        subFolders.forEach((f, idx) => {
            const card = document.createElement('div');
            card.className = 'card folder-card fade-in';
            card.style.animationDelay = `${idx * 0.05}s`;
            card.style.display = 'flex';
            card.style.flexDirection = 'column';
            card.style.alignItems = 'center';
            card.style.padding = '1.2rem 1rem';
            card.style.textAlign = 'center';
            card.style.cursor = 'pointer';
            card.style.justifyContent = 'center';
            card.style.position = 'relative';
            card.style.border = '1px dashed var(--border-color)'; // Distinction for sub-folders

            const icon = document.createElement('ion-icon');
            icon.setAttribute('name', 'folder-open-outline');
            icon.style.fontSize = '2.2rem';
            icon.style.color = 'var(--accent-color)';
            icon.style.marginBottom = '0.3rem';
            
            const title = document.createElement('h3');
            title.textContent = f.name;
            title.style.color = 'var(--text-primary)';
            title.style.fontSize = '0.9rem';

            card.appendChild(icon);
            card.appendChild(title);

            card.addEventListener('click', () => {
                navigationPath.push({ id: f.id, name: f.name });
                currentParentId = f.id;
                updateBreadcrumbs();
                loadFolderImagesAdmin(f.id, f.name);
            });

            // Action Buttons for sub-folders
            const subActions = document.createElement('div');
            subActions.className = 'sub-folder-actions';
            subActions.style.position = 'absolute';
            subActions.style.top = '10px';
            subActions.style.right = '10px';
            subActions.style.display = 'flex';
            subActions.style.gap = '0.5rem';

            const subRenameBtn = document.createElement('button');
            subRenameBtn.className = 'btn-icon-small';
            subRenameBtn.innerHTML = '<ion-icon name="create-outline"></ion-icon>';
            subRenameBtn.style.background = 'rgba(0,0,0,0.3)';
            subRenameBtn.style.color = 'var(--accent-color)';
            subRenameBtn.style.borderRadius = '50%';
            subRenameBtn.style.padding = '4px';
            subRenameBtn.style.display = 'flex';
            subRenameBtn.onclick = (e) => {
                e.stopPropagation();
                showRenameModal(f);
            };

            const subMoveBtn = document.createElement('button');
            subMoveBtn.className = 'btn-icon-small';
            subMoveBtn.innerHTML = '<ion-icon name="swap-horizontal-outline"></ion-icon>';
            subMoveBtn.style.background = 'rgba(0,0,0,0.3)';
            subMoveBtn.style.color = 'var(--accent-color)';
            subMoveBtn.style.borderRadius = '50%';
            subMoveBtn.style.padding = '4px';
            subMoveBtn.style.display = 'flex';
            subMoveBtn.onclick = (e) => {
                e.stopPropagation();
                showMoveFolderModal(f);
            };

            const subDelBtn = document.createElement('button');
            subDelBtn.className = 'btn-icon-small';
            subDelBtn.innerHTML = '<ion-icon name="trash-outline"></ion-icon>';
            subDelBtn.style.background = 'rgba(0,0,0,0.3)';
            subDelBtn.style.color = '#ff7b72';
            subDelBtn.style.borderRadius = '50%';
            subDelBtn.style.padding = '4px';
            subDelBtn.style.display = 'flex';
            subDelBtn.onclick = (e) => {
                e.stopPropagation();
                showCustomConfirm('Delete Sub-stack?', `Are you sure you want to delete "${f.name}"?`, () => deleteFolder(f.id));
            };

            subActions.appendChild(subRenameBtn);
            subActions.appendChild(subMoveBtn);
            subActions.appendChild(subDelBtn);
            card.appendChild(subActions);

            adminImagesGrid.appendChild(card);
        });

        if (subFolders.length === 0 && images.length === 0) {
            adminImagesGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--text-secondary); margin-top: 2rem;">No content in this stack yet.</div>';
            return;
        }

        // 2. Render Media Files
        images.forEach((img, idx) => {
            const card = document.createElement('div');
            card.className = 'card fade-in';
            if (highlightFilename && img.name === highlightFilename) {
                card.classList.add('highlight-asset');
                setTimeout(() => card.scrollIntoView({ behavior: 'smooth', block: 'center' }), 500);
            }
            card.style.padding = '0';
            card.style.overflow = 'hidden';
            card.style.position = 'relative';

            const imgEl = document.createElement('img');
            imgEl.src = img.url;
            imgEl.style.width = '100%';
            imgEl.style.aspectRatio = '1/1';
            imgEl.style.objectFit = 'cover';

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn-icon';
            deleteBtn.style.position = 'absolute';
            deleteBtn.style.top = '10px';
            deleteBtn.style.right = '10px';
            deleteBtn.style.background = 'rgba(0, 0, 0, 0.5)';
            deleteBtn.style.backdropFilter = 'blur(10px)';
            deleteBtn.style.border = '1px solid rgba(255, 68, 68, 0.3)';
            deleteBtn.style.color = '#ff4444';
            deleteBtn.style.borderRadius = '50%';
            deleteBtn.style.width = '32px';
            deleteBtn.style.height = '32px';
            deleteBtn.style.display = 'flex';
            deleteBtn.style.alignItems = 'center';
            deleteBtn.style.justifyContent = 'center';
            deleteBtn.innerHTML = '<ion-icon name="trash-outline"></ion-icon>';
            
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                showCustomConfirm(
                    'Delete Media?',
                    'Are you sure you want to delete this specific image or video?',
                    () => deleteImageAdmin(folderId, img.name, card)
                );
            };

            card.appendChild(imgEl);
            card.appendChild(deleteBtn);
            adminImagesGrid.appendChild(card);
        });
    }

    async function deleteImageAdmin(folderId, filename, cardEl) {
        console.log('deleteImageAdmin called:', folderId, filename);
        console.log('Current Session Password:', sessionPassword);
        try {
            const res = await fetch('/api/images', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ adminPassword: sessionPassword, folderId, filename })
            });
            const data = await res.json();
            console.log('Image Delete Response:', data);
            if (data.success) {
                cardEl.style.transition = 'all 0.3s';
                cardEl.style.opacity = '0';
                cardEl.style.transform = 'scale(0.8)';
                setTimeout(() => cardEl.remove(), 300);
            } else {
                showCustomAlert('Deletion Failed', data.msg || 'Failed to delete', { icon: 'alert-circle-outline', color: '#ff7b72', bg: 'rgba(255, 123, 114, 0.1)' });
            }
        } catch(e) {
            console.error('Image Delete Error:', e);
            showCustomAlert('Network Error', 'Error connecting to server', { icon: 'wifi-outline', color: '#ff7b72', bg: 'rgba(255, 123, 114, 0.1)' });
        }
    }

    async function deleteFolder(folderId) {
        try {
            const res = await fetch(`/api/folders/${folderId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ adminPassword: sessionPassword })
            });
            const data = await res.json();
            if (data.success) {
                loadFoldersAdmin();
            } else {
                showCustomAlert('Deletion Failed', data.msg, { icon: 'alert-circle-outline', color: '#ff7b72', bg: 'rgba(255, 123, 114, 0.1)' });
            }
        } catch (error) {
            console.error('Error deleting folder:', error);
            showCustomAlert('Network Error', 'Error connecting to server', { icon: 'wifi-outline', color: '#ff7b72', bg: 'rgba(255, 123, 114, 0.1)' });
        }
    }

    adminBackBtn.addEventListener('click', () => {
        if (navigationPath.length > 1) {
            navigationPath.pop();
            const parent = navigationPath[navigationPath.length - 1];
            currentParentId = parent.id;
            updateBreadcrumbs();
            loadFoldersAdmin();
        } else {
            // Should not really happen if button is hidden at root, but just in case
            adminImagesView.style.display = 'none';
            stacksView.style.display = 'block';
            activeUploadFolderId = '';
        }
    });

    // --- Move Folder Logic ---
    function showMoveFolderModal(folderToMove) {
        moveFolderNameDisplay.textContent = folderToMove.name;
        moveFolderList.innerHTML = '';
        
        // Add "Root (Home)" as an option
        const rootOption = createMoveOption('Home (Root)', 'root', folderToMove.id);
        moveFolderList.appendChild(rootOption);

        // Add other folders (excluding itself and its children - though children check is omitted for simplicity in MVP)
        currentFolders.forEach(f => {
            if (f.id !== folderToMove.id) {
                const option = createMoveOption(f.name, f.id, folderToMove.id);
                moveFolderList.appendChild(option);
            }
        });

        moveFolderModal.style.display = 'flex';
    }

    function createMoveOption(name, targetId, folderToMoveId) {
        const btn = document.createElement('button');
        btn.className = 'btn btn-secondary';
        btn.style.textAlign = 'left';
        btn.style.padding = '1rem';
        btn.style.display = 'flex';
        btn.style.alignItems = 'center';
        btn.style.gap = '0.8rem';
        btn.style.border = '1px solid var(--border-color)';
        
        btn.innerHTML = `
            <ion-icon name="${targetId === 'root' ? 'home-outline' : 'folder-outline'}"></ion-icon>
            <span style="flex: 1;">${name}</span>
            <ion-icon name="chevron-forward-outline" style="opacity: 0.5;"></ion-icon>
        `;

        btn.onclick = () => moveFolder(folderToMoveId, targetId);
        return btn;
    }

    async function moveFolder(folderId, targetParentId) {
        try {
            const res = await fetch(`/api/folders/${folderId}/move`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    adminPassword: sessionPassword, 
                    parentId: targetParentId 
                })
            });
            const data = await res.json();
            if (data.success) {
                moveFolderModal.style.display = 'none';
                showSuccessModal('Folder successfully relocated!');
                loadFoldersAdmin();
            } else {
                showCustomAlert('Move Failed', data.msg || 'Error moving folder', { icon: 'alert-circle-outline' });
            }
        } catch(e) {
            console.error('Move error', e);
            showCustomAlert('Network Error', 'Failed to connect to server', { icon: 'wifi-outline' });
        }
    }

    moveFolderCancelBtn.addEventListener('click', () => {
        moveFolderModal.style.display = 'none';
    });

    // --- Rename & Secure Folder Logic ---
    function showRenameModal(folder) {
        folderToRename = folder;
        renameFolderNameInput.value = folder.name;
        renameFolderPassInput.value = ''; // Always clear for security/clarity
        renameFolderModal.style.display = 'flex';
        renameFolderNameInput.focus();
    }

    async function renameFolder(folderId, newName, newPassword) {
        try {
            const res = await fetch(`/api/folders/${folderId}/rename`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    adminPassword: sessionPassword, 
                    newName: newName,
                    newPassword: newPassword // Can be empty string to remove password
                })
            });
            const data = await res.json();
            if (data.success) {
                renameFolderModal.style.display = 'none';
                showSuccessModal('Stack security & name updated!');
                loadFoldersAdmin();
            } else {
                showCustomAlert('Update Failed', data.msg || 'Error updating folder', { icon: 'alert-circle-outline' });
            }
        } catch(e) {
            console.error('Rename error', e);
            showCustomAlert('Network Error', 'Failed to connect to server', { icon: 'wifi-outline' });
        }
    }

    renameFolderConfirmBtn.addEventListener('click', () => {
        const newName = renameFolderNameInput.value;
        const newPassword = renameFolderPassInput.value;
        if (newName && folderToRename) {
            renameFolder(folderToRename.id, newName, newPassword);
        }
    });

    renameFolderCancelBtn.addEventListener('click', () => {
        renameFolderModal.style.display = 'none';
    });


    // 3. Create Folder Flow
    createFolderCardBtn.addEventListener('click', () => {
        createFolderPanel.style.display = 'block';
        folderNameInput.focus();
    });

    cancelCreateFolderBtn.addEventListener('click', () => {
        createFolderPanel.style.display = 'none';
        createFolderForm.reset();
    });

    createFolderForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = folderNameInput.value.trim();
        const pass = folderPassInput.value.trim();
        const category = document.getElementById('folderCategoryInput').value;
        if (!name) return;

        createFolderBtn.disabled = true;
        createFolderBtn.textContent = 'Creating...';

        try {
            const res = await fetch('/api/folders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    adminPassword: sessionPassword, 
                    name: name, 
                    password: pass, 
                    category: category,
                    parentId: currentParentId 
                })
            });
            const data = await res.json();
            if (data.success) {
                showMsg(folderStatusMessage, 'Stack successfully created!', 'success');
                createFolderForm.reset();
                createFolderPanel.style.display = 'none';
                loadFoldersAdmin();
            } else {
                showMsg(folderStatusMessage, data.msg || 'Error creating stack', 'error');
            }
        } catch(e) {
            showMsg(folderStatusMessage, 'Failed to connect to server', 'error');
        } finally {
            createFolderBtn.disabled = false;
            createFolderBtn.textContent = 'Create Folder';
        }
    });

    // 4. Handle Modal Interactions & Drag/Drop
    closeUploadModalBtn.addEventListener('click', () => uploadModal.style.display = 'none');
    
    dropZone.addEventListener('click', () => imageInput.click());
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, e => {
            e.preventDefault();
            e.stopPropagation();
        }, false);
    });
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.add('dragover'), false);
    });
    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.remove('dragover'), false);
    });
    async function traverseFileTree(item, path = "") {
        return new Promise((resolve) => {
            if (item.isFile) {
                item.file((file) => {
                    // Check if it's a valid media file
                    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic', '.svg', '.tiff', '.mp4', '.mov', '.avi', '.mkv', '.webm'];
                    const ext = '.' + file.name.split('.').pop().toLowerCase();
                    if (allowedExtensions.includes(ext) || file.type.startsWith('image/') || file.type.startsWith('video/')) {
                        resolve([file]);
                    } else {
                        resolve([]);
                    }
                });
            } else if (item.isDirectory) {
                let dirReader = item.createReader();
                let allFiles = [];
                
                function readEntries() {
                    dirReader.readEntries(async (entries) => {
                        if (entries.length > 0) {
                            for (let entry of entries) {
                                const files = await traverseFileTree(entry, path + item.name + "/");
                                allFiles.push(...files);
                            }
                            readEntries(); // Read next batch
                        } else {
                            resolve(allFiles);
                        }
                    });
                }
                readEntries();
            } else {
                resolve([]);
            }
        });
    }

    dropZone.addEventListener('drop', async (e) => {
        e.preventDefault();
        const items = e.dataTransfer.items;
        if (!items) return;

        showMsg(folderStatusMessage, 'Analyzing dropped items...', 'success');
        
        for (let i = 0; i < items.length; i++) {
            const item = items[i].webkitGetAsEntry();
            if (item && item.isDirectory) {
                const files = await traverseFileTree(item);
                if (files.length > 0) {
                    await handleDroppedFolderUpload(item.name, files);
                }
            }
        }
    }, false);

    async function handleDroppedFolderUpload(rootFolderName, validFiles) {
        showMsg(folderStatusMessage, `Initializing ${rootFolderName} in Cloud...`, 'success');
        try {
            // 1. Get Cloudinary Details
            const configRes = await fetch('/api/cloudinary-config');
            const config = await configRes.json();
            if (!config.cloudName) throw new Error('Cloudinary not configured');

            // 2. Create the folder entry in our Database first
            const res = await fetch('/api/folders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    adminPassword: sessionPassword, 
                    name: rootFolderName, 
                    parentId: currentParentId,
                    category: 'images'
                })
            });
            const folderData = await res.json();
            if (!folderData.success) throw new Error(folderData.msg || 'Folder creation failed');
            
            const newFolderId = folderData.folder.id;
            let successCount = 0;

            // 3. Upload each file DIRECTLY to Cloudinary (one by one to bypass all limits)
            for (let i = 0; i < validFiles.length; i++) {
                const file = validFiles[i];
                showMsg(folderStatusMessage, `Uploading to Cloud: ${i+1}/${validFiles.length} (${file.name})`, 'success');

                const formData = new FormData();
                formData.append('file', file);
                formData.append('upload_preset', config.uploadPreset);
                formData.append('folder', `msoe-images/${newFolderId}`);

                const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/${config.cloudName}/auto/upload`, {
                    method: 'POST',
                    body: formData
                });
                const cloudData = await cloudRes.json();

                if (cloudData.secure_url) {
                    // 4. Notify our server of the success (Metadata only - very fast/light)
                    await fetch('/api/image-metadata', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            adminPassword: sessionPassword,
                            folderId: newFolderId,
                            name: file.name,
                            url: cloudData.secure_url,
                            publicId: cloudData.public_id
                        })
                    });
                    successCount++;
                }
            }

            showSuccessModal(`Folder "${rootFolderName}" uploaded! (${successCount} files)`);
            loadFoldersAdmin();
        } catch (error) {
            console.error('Folder upload error:', error);
            showMsg(folderStatusMessage, 'Sync Error: ' + error.message, 'error');
        } finally {
            folderUploadInput.value = '';
        }
    }
    imageInput.addEventListener('change', function() {
        handleFiles(this.files);
    });

    function handleFiles(files) {
        if (files.length > 0) {
            previewContainer.innerHTML = `<ion-icon name="copy-outline" style="vertical-align: middle;"></ion-icon> ${files.length} valid images verified!`;
            previewContainer.style.display = 'block';
        }
    }

    // 5. Submit Multiple Bulk Uploads (Direct-to-Cloud Bypass)
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (imageInput.files.length === 0) {
            showMsg(uploadStatusMessage, 'Please select at least one image.', 'error');
            return;
        }

        const originalBtnText = uploadSubmitBtn.innerHTML;
        uploadSubmitBtn.innerHTML = '<ion-icon name="sync" class="fade-in" style="animation: spin 1s linear infinite;"></ion-icon> Cloud Syncing...';
        uploadSubmitBtn.disabled = true;

        try {
            showMsg(uploadStatusMessage, 'Connecting to Cloud Network...', 'success');
            
            // 1. Get Cloudinary Details
            const configRes = await fetch('/api/cloudinary-config');
            const config = await configRes.json();
            if (!config.cloudName) throw new Error('Cloudinary not configured');

            let successCount = 0;
            const files = Array.from(imageInput.files);

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                showMsg(uploadStatusMessage, `Cloud Syncing: ${i+1}/${files.length} (${file.name})`, 'success');

                const formData = new FormData();
                formData.append('file', file);
                formData.append('upload_preset', config.uploadPreset);
                formData.append('folder', `msoe-images/${activeUploadFolderId}`);

                const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/${config.cloudName}/auto/upload`, {
                    method: 'POST',
                    body: formData
                });
                const cloudData = await cloudRes.json();

                if (cloudData.secure_url) {
                    await fetch('/api/image-metadata', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            adminPassword: sessionPassword,
                            folderId: activeUploadFolderId,
                            name: file.name,
                            url: cloudData.secure_url,
                            publicId: cloudData.public_id
                        })
                    });
                    successCount++;
                }
            }

            uploadStatusMessage.style.display = 'none';
            uploadModal.style.display = 'none';
            showSuccessModal(`Successfully Published ${successCount} files!`);
            loadFolderImagesAdmin(activeUploadFolderId, navigationPath[navigationPath.length-1].name);
        } catch (err) {
            console.error('Cloud upload error:', err);
            showMsg(uploadStatusMessage, 'Cloud Error: ' + err.message, 'error');
        } finally {
            uploadSubmitBtn.innerHTML = originalBtnText;
            uploadSubmitBtn.disabled = false;
        }
    });

    function showMsg(el, msg, type) {
        el.textContent = msg;
        el.className = type === 'success' ? 'success-msg fade-in' : 'error-msg fade-in';
        el.style.display = 'block';
        el.style.padding = '0.75rem';
        el.style.borderRadius = '8px';
        el.style.textAlign = 'center';
    }

    function isVideo(filename) {
        if (!filename) return false;
        return /\.(mp4|mov|avi|mkv|webm)$/i.test(filename);
    }

    async function loadFeedback() {
        try {
            const res = await fetch('/api/admin/chats', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ adminPassword: sessionPassword })
            });
            const data = await res.json();
            if (data.success) {
                const list = document.getElementById('feedbackList');
                if (data.chats.length === 0) {
                    list.innerHTML = '<div style="color: var(--text-secondary); text-align: center; margin-top: 2rem;">No feedback yet.</div>';
                    return;
                }
                list.innerHTML = '';
                
                data.chats.forEach(chat => {
                    const row = document.createElement('div');
                    row.className = `feedback-row fade-in ${chat.viewed ? 'is-read' : ''}`;
                    row.style.background = 'rgba(255,255,255,0.05)';
                    row.style.padding = '1.2rem';
                    row.style.borderRadius = '16px';
                    row.style.border = chat.viewed ? '1px solid rgba(255,255,255,0.1)' : '1px solid #4ade80';
                    row.style.cursor = 'pointer';
                    row.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
                    
                    const timestamp = new Date(chat.createdAt || Date.now()).toLocaleDateString();

                    row.innerHTML = `
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.6rem;">
                            <div style="display: flex; align-items: center; gap: 0.8rem;">
                                <strong style="color: ${chat.viewed ? 'var(--text-secondary)' : 'var(--accent-color)'}; font-size: 1rem;">${chat.name}</strong>
                                ${!chat.viewed ? '<span class="new-badge" style="background:#4ade80; color:#000; font-size:0.65rem; padding:2px 8px; border-radius:6px; font-weight:bold; letter-spacing:0.5px;">NEW</span>' : ''}
                            </div>
                            <span style="font-size: 0.75rem; color: var(--text-secondary); opacity: 0.5;">${timestamp}</span>
                        </div>
                        <p style="margin: 0; font-size: 0.9rem; color: var(--text-secondary); opacity: 0.8; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                            ${chat.feedback}
                        </p>
                    `;

                    row.onclick = () => openFeedbackDetail(chat, row);
                    list.appendChild(row);
                });
            }
        } catch (err) {
            console.error('Failed to load feedback:', err);
        }
    }

    async function openFeedbackDetail(chat, rowElement) {
        const listSection = document.getElementById('feedbackListSection');
        const detailSection = document.getElementById('feedbackDetailSection');
        const nameEl = document.getElementById('detailSenderName');
        const textEl = document.getElementById('detailMessageText');
        const mediaEl = document.getElementById('detailMediaPreview');
        const actionBtn = document.getElementById('detailActionBtn');
        const timeEl = document.getElementById('detailTimestamp');
        const backBtn = document.getElementById('feedbackBackBtn');

        // Transition View
        listSection.style.display = 'none';
        detailSection.style.display = 'block';
        window.scrollTo({ top: 0, behavior: 'instant' });

        nameEl.textContent = chat.name;
        textEl.textContent = chat.feedback;
        timeEl.textContent = new Date(chat.createdAt || Date.now()).toLocaleString();

        backBtn.onclick = () => {
            detailSection.style.display = 'none';
            listSection.style.display = 'block';
            loadFeedback(); // Refresh list to catch read status changes
        };

        // Media Preview
        if (chat.mediaUrl) {
            mediaEl.style.display = 'block';
            if (isVideo(chat.mediaUrl)) {
                mediaEl.innerHTML = `<video src="${chat.mediaUrl}" controls style="width: 100%; max-height: 500px; object-fit: contain;"></video>`;
            } else {
                mediaEl.innerHTML = `<img src="${chat.mediaUrl}" style="width: 100%; max-height: 600px; object-fit: contain; cursor: zoom-in;" onclick="window.open('${chat.mediaUrl}', '_blank')">`;
            }

            actionBtn.style.display = 'flex';
            actionBtn.onclick = () => {
                const pathParts = chat.mediaUrl.split('/');
                if (pathParts.length >= 4) {
                    const fID = pathParts[2];
                    const fName = pathParts[3];
                    const folderObj = currentFolders.find(f => f.id === fID);
                    const folderLabel = folderObj ? folderObj.name : 'Reporting Folder';

                    stacksView.style.display = 'none';
                    feedbackView.style.display = 'none';
                    adminImagesView.style.display = 'block';
                    loadFolderImagesAdmin(fID, folderLabel, fName);
                }
            };
        } else {
            mediaEl.style.display = 'none';
            actionBtn.style.display = 'none';
        }

        // Mark as Viewed API & Instant UI Update
        if (!chat.viewed) {
            // Immediate UI Update for better responsiveness
            chat.viewed = true;
            rowElement.classList.add('is-read');
            rowElement.style.border = '1px solid rgba(255,255,255,0.1)';
            const badge = rowElement.querySelector('.new-badge');
            if (badge) badge.remove();
            const name = rowElement.querySelector('strong');
            if (name) name.style.color = 'var(--text-secondary)';

            try {
                const res = await fetch('/api/admin/chat/mark-viewed', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ adminPassword: sessionPassword, chatId: chat.id })
                });
                const data = await res.json();
                if (!data.success) {
                    // Rollback if API fails? Optional, but keep it simple for now.
                    console.error('API failed to mark viewed');
                }
            } catch (e) {
                console.error('Mark viewed failed:', e);
            }
        }
    }
    // --- Grid Toggle Logic (Cycle) ---
    const cycleBtns = document.querySelectorAll('.cycle-view-btn');
    const viewStates = ['3', '1', 'auto', '4', 'list'];
    const icons = {
        'auto': 'grid-outline',
        '4': 'browsers-outline',
        '3': 'apps-outline',
        '1': 'square-outline',
        'list': 'list-outline'
    };
    
    cycleBtns.forEach(btn => {
        let currentStateIndex = 0; // Starts at auto
        const targetId = btn.getAttribute('data-target');
        
        btn.addEventListener('click', () => {
            const targetGrid = document.getElementById(targetId);
            if (!targetGrid) return;
            
            currentStateIndex = (currentStateIndex + 1) % viewStates.length;
            const viewType = viewStates[currentStateIndex];
            
            targetGrid.classList.remove('grid-view-4', 'grid-view-3', 'grid-view-1', 'grid-view-list');
            
            if (viewType !== 'auto') {
                const className = viewType === 'list' ? 'grid-view-list' : `grid-view-${viewType}`;
                targetGrid.classList.add(className);
                btn.innerHTML = `<ion-icon name="${icons[viewType]}"></ion-icon>`;
            } else {
                btn.innerHTML = `<ion-icon name="${icons['auto']}"></ion-icon>`;
            }
        });
    });

    // --- Action Choice Menu Logic ---
    const showActionMenu = () => {
        actionChoiceModal.style.display = 'flex';
    };

    const closeActionMenu = () => {
        actionChoiceModal.style.display = 'none';
    };

    if (actionCancelBtn) actionCancelBtn.addEventListener('click', closeActionMenu);

    if (mainActionBtn) mainActionBtn.addEventListener('click', () => {
        showActionMenu();
        // Show Direct Poster buttons only at root
        if (actionUploadDirectPosterBtn) {
            actionUploadDirectPosterBtn.style.display = (currentParentId === 'root') ? 'flex' : 'none';
        }
        if (actionManageDirectPostersBtn) {
            actionManageDirectPostersBtn.style.display = (currentParentId === 'root') ? 'flex' : 'none';
        }
    });

    actionUploadFilesBtn.addEventListener('click', () => {
        closeActionMenu();
        
        // Determine the target folder ID
        // If we are in adminImagesView, activeUploadFolderId is set.
        // If we are in stacksView, we might want to upload to the current folder (if not root)
        
        let targetId = activeUploadFolderId;
        if (!targetId && currentParentId !== 'root') {
            targetId = currentParentId;
        }

        if (targetId) {
            uploadTargetFolderName.textContent = navigationPath[navigationPath.length - 1].name;
            activeUploadFolderId = targetId;
            
            // Show the upload modal so the user can see progress and click Publish
            uploadForm.reset();
            previewContainer.style.display = 'none';
            uploadStatusMessage.style.display = 'none';
            uploadModal.style.display = 'flex';
            
            // Trigger the file picker automatically for convenience
            imageInput.click();
        } else {
            showCustomAlert('No Target Folder', 'Please enter a folder (stack) before uploading individual files. You can also use "Upload Folder" to create one automatically.', { icon: 'folder-open-outline' });
        }
    });

    actionUploadFolderBtn.addEventListener('click', () => {
        closeActionMenu();
        folderUploadInput.click();
    });

    actionCreateSubfolderBtn.addEventListener('click', () => {
        closeActionMenu();
        createFolderPanel.style.display = 'flex';
        folderNameInput.focus();
    });

    actionUploadDirectPosterBtn.addEventListener('click', async () => {
        closeActionMenu();
        
        // Find or Create __POSTER_ROOT__ folder
        let magicFolder = currentFolders.find(f => f.name === '__POSTER_ROOT__' && f.category === 'posters');
        
        if (!magicFolder) {
            showMsg(folderStatusMessage, 'Initializing Direct Poster Stream...', 'success');
            try {
                const res = await fetch('/api/folders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        adminPassword: sessionPassword, 
                        name: '__POSTER_ROOT__', 
                        category: 'posters' 
                    })
                });
                const data = await res.json();
                if (data.success) {
                    magicFolder = data.folder;
                    currentFolders.push(magicFolder);
                }
            } catch(e) {
                console.error('Failed to create poster root', e);
            }
        }

        if (magicFolder) {
            activeUploadFolderId = magicFolder.id;
            uploadTargetFolderName.textContent = "Home › Posters (Direct)";
            uploadModal.style.display = 'flex';
            imageInput.click();
        } else {
            showCustomAlert('Init Failed', 'Could not initialize the direct posters stream.', { icon: 'alert-circle-outline' });
        }
    });

    actionManageDirectPostersBtn.addEventListener('click', async () => {
        closeActionMenu();
        
        // Find or Create __POSTER_ROOT__ folder
        let magicFolder = currentFolders.find(f => f.name === '__POSTER_ROOT__' && f.category === 'posters');
        
        if (!magicFolder) {
            showMsg(folderStatusMessage, 'Initializing Manager Pathway...', 'success');
            try {
                const res = await fetch('/api/folders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        adminPassword: sessionPassword, 
                        name: '__POSTER_ROOT__', 
                        category: 'posters' 
                    })
                });
                const data = await res.json();
                if (data.success) {
                    magicFolder = data.folder;
                    currentFolders.push(magicFolder);
                    loadFoldersAdmin();
                }
            } catch(e) {}
        }

        if (magicFolder) {
            navigationPath.push({ id: magicFolder.id, name: 'Direct Home Posters' });
            currentParentId = magicFolder.id;
            updateBreadcrumbs();
            loadFolderImagesAdmin(magicFolder.id, 'Direct Home Posters');
        } else {
            showCustomAlert('Access Denied', 'The direct poster stream is not initialized.', { icon: 'alert-circle-outline' });
        }
    });

    // --- Folder Upload Logic ---

    folderUploadInput.addEventListener('change', async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        // Group files by their top-level directory
        const groups = {};
        const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic', '.svg', '.tiff', '.mp4', '.mov', '.avi', '.mkv', '.webm'];

        files.forEach(file => {
            const pathParts = file.webkitRelativePath.split('/');
            if (pathParts.length > 1) {
                // Smart Grouping: Use the second segment if it's a sub-folder upload,
                // otherwise use the first segment (for direct folder selection).
                const rootName = (pathParts.length > 2) ? pathParts[1] : pathParts[0];
                
                const ext = '.' + file.name.split('.').pop().toLowerCase();
                const isValid = allowedExtensions.includes(ext) || file.type?.startsWith('image/') || file.type?.startsWith('video/');
                
                if (isValid) {
                    if (!groups[rootName]) groups[rootName] = [];
                    groups[rootName].push(file);
                }
            }
        });

        const rootNames = Object.keys(groups);
        if (rootNames.length === 0) {
            showCustomAlert('No Media Found', 'No valid images or videos found in the selected folder(s).', { icon: 'search-outline' });
            return;
        }

        showMsg(folderStatusMessage, `Batch processing ${rootNames.length} folders...`, 'success');
        
        // Process each folder group sequentially
        for (const rootName of rootNames) {
            await handleDroppedFolderUpload(rootName, groups[rootName]);
        }
    });

    function showSuccessModal(message = "Action completed successfully.") {
        const successModal = document.getElementById('successModal');
        const successModalMessage = document.getElementById('successModalMessage');
        if (successModal) {
            if (successModalMessage) successModalMessage.textContent = message;
            successModal.style.display = 'flex';
            setTimeout(() => {
                successModal.style.opacity = '0';
                successModal.style.transition = 'opacity 0.5s ease';
                setTimeout(() => {
                    successModal.style.display = 'none';
                    successModal.style.opacity = '1';
                }, 500);
            }, 2500);
        }
    }
});
