document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements (Unified Integrated View) ---
    const integratedGrid = document.getElementById('integratedGrid');
    const pageMainTitle = document.getElementById('pageMainTitle');
    const pageMainSubtitle = document.getElementById('pageMainSubtitle');
    const galleryBreadcrumbs = document.getElementById('galleryBreadcrumbs');
    const footerNavBtn = document.getElementById('footerNavBtn');
    const footerNavIcon = document.getElementById('footerNavIcon');
    const loaderFolders = document.getElementById('loaderFolders');
    const emptyStateFolders = document.getElementById('empty-state-folders');
    
    // Auth Modals
    const passwordModal = document.getElementById('passwordModal');
    const folderPasswordInput = document.getElementById('folderPasswordInput');
    const folderAuthError = document.getElementById('folderAuthError');
    const cancelModalBtn = document.getElementById('cancelModalBtn');
    const submitFolderPasswordBtn = document.getElementById('submitFolderPasswordBtn');
    
    // --- Global State ---
    let allFolders = [];
    let currentImagesList = [];
    let currentLightboxIndex = 0;
    let currentCategory = 'images';
    let currentParentId = 'root';
    let currentActiveFolderId = null;
    let navigationPath = [{ id: 'root', name: 'Home' }];

    // --- Core Master Initialization ---
    initGallery();

    async function initGallery() {
        showLoader(true);
        try {
            const res = await fetch('/api/folders');
            const data = await res.json();
            if (data.success) {
                allFolders = data.folders;
                applyMasterFilter();
            } else {
                showEmptyState(true);
            }
        } catch (e) {
            console.error('Boot error', e);
        } finally {
            showLoader(false);
        }
    }

    // --- The Master Filter (Zero Disappearance Strategy) ---
    function applyMasterFilter() {
        integratedGrid.innerHTML = '';
        
        // 1. Filter Sub-Folders
        const subFolders = allFolders.filter(f => {
            // Hide the system folder from lists
            if (f.name === '__POSTER_ROOT__') return false; 
            
            if (currentParentId === 'root') {
                return (!f.parentId) && (f.category === currentCategory);
            } else {
                return f.parentId === currentParentId;
            }
        });

        // 2. Render Folders First
        renderFolders(subFolders);

        // 3. Render Images Second
        if (currentParentId !== 'root') {
            renderGallery(currentImagesList);
        } else if (currentCategory === 'posters') {
            // Special: If we are at root of posters, check if we need to load direct posters
            const magicFolder = allFolders.find(f => f.name === '__POSTER_ROOT__' && f.category === 'posters');
            if (magicFolder && currentImagesList.length === 0) {
                // This is first load of root posters, fetch them
                loadContent(magicFolder.id, '');
            } else if (currentImagesList.length > 0) {
                renderGallery(currentImagesList);
            }
        }

        updatePageTitle();
        updateFooterNav();
        updateBreadcrumbs();

        // Empty state check
        const hasContent = subFolders.length > 0 || currentImagesList.length > 0;
        showEmptyState(!hasContent);
    }

    function renderFolders(folders) {
        folders.forEach((folder, idx) => {
            const card = document.createElement('div');
            card.className = 'card fade-in folder-card';
            card.style.animationDelay = `${idx * 0.05}s`;
            card.style.cursor = 'pointer';
            
            const icon = document.createElement('ion-icon');
            icon.setAttribute('name', folder.hasPassword ? 'folder-open' : 'folder-open-outline');
            icon.className = 'folder-icon';
            icon.style.color = folder.hasPassword ? 'var(--accent-color)' : 'var(--text-secondary)';
            
            const title = document.createElement('h3');
            title.textContent = folder.name;
            title.className = 'folder-title';
            
            if (folder.isPinned) {
                const pin = document.createElement('ion-icon');
                pin.setAttribute('name', 'pin');
                pin.className = 'pin-badge';
                card.appendChild(pin);
            }

            if (folder.hasPassword) {
                const badge = document.createElement('span');
                badge.className = 'lock-badge';
                badge.innerHTML = '<ion-icon name="lock-closed"></ion-icon> Protected';
                card.appendChild(badge);
            }
            
            card.appendChild(icon);
            card.appendChild(title);
            card.addEventListener('click', () => handleFolderClick(folder));
            integratedGrid.appendChild(card);
        });
    }

    function renderGallery(images) {
        images.forEach((img, index) => {
            const card = document.createElement('div');
            card.className = 'card fade-in img-card' + (currentCategory === 'posters' ? ' poster-card' : '');
            card.style.animationDelay = `${(index + 5) * 0.05}s`;
            card.style.padding = '0';
            card.style.overflow = 'hidden';
            card.dataset.url = img.url;
            card.dataset.name = img.name;

            const selectIndicator = document.createElement('div');
            selectIndicator.className = 'select-indicator';
            selectIndicator.innerHTML = '<ion-icon name="checkmark-outline"></ion-icon>';
            card.appendChild(selectIndicator);

            const mediaEl = renderMedia(img, index);
            
            const downloadBtn = document.createElement('button');
            downloadBtn.className = 'btn-icon dl-btn-glass';
            downloadBtn.innerHTML = '<ion-icon name="arrow-down-circle-outline"></ion-icon>';
            downloadBtn.onclick = (e) => {
                e.stopPropagation();
                forceDownload(img.url, img.name);
            };
            
            card.appendChild(mediaEl);
            card.appendChild(downloadBtn);
            card.onclick = () => openLightbox(index);

            selectIndicator.onclick = (e) => {
                e.stopPropagation();
                card.classList.toggle('selected');
                updateBatchBar();
            };

            integratedGrid.appendChild(card);
        });
    }

    // --- Authentication & Deep Scan ---
    function handleFolderClick(folder) {
        currentActiveFolderId = folder.id;
        if (folder.hasPassword) {
            folderPasswordInput.value = '';
            folderAuthError.style.display = 'none';
            passwordModal.style.display = 'flex';
            setTimeout(() => folderPasswordInput.focus(), 100);
            
            const handleAuth = async () => {
                const pass = folderPasswordInput.value;
                if (pass) await attemptAuthAndNavigate(folder, pass);
            };

            submitFolderPasswordBtn.onclick = handleAuth;
            folderPasswordInput.onkeydown = (e) => {
                if (e.key === 'Enter') handleAuth();
            };
        } else {
            navigationPath.push({ id: folder.id, name: folder.name });
            navigate(navigationPath.length - 1);
        }
    }

    async function attemptAuthAndNavigate(folder, password) {
        showLoader(true);
        try {
            const res = await fetch(`/api/folders/${folder.id}/images`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });
            const data = await res.json();
            if (data.success) {
                // 1. Instantly Update State
                currentImagesList = data.images;
                navigationPath.push({ id: folder.id, name: folder.name, password });
                currentParentId = folder.id;

                // 2. Hide Modal Immediately
                passwordModal.style.display = 'none';

                // 3. Render Content Without Second Fetch
                applyMasterFilter();
            } else {
                folderAuthError.style.display = 'block';
            }
        } catch (e) {
             console.error(e);
        } finally {
            showLoader(false);
        }
    }

    async function navigate(index) {
        if (!navigationPath[index]) return;
        const item = navigationPath[index];
        navigationPath = navigationPath.slice(0, index + 1);
        currentParentId = item.id;
        
        if (item.id === 'root') {
            currentImagesList = [];
            applyMasterFilter();
        } else {
            // Load content for this folder using saved password
            showLoader(true);
            try {
                const res = await fetch(`/api/folders/${item.id}/images`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ password: item.password || '' })
                });
                const data = await res.json();
                if (data.success) {
                    currentImagesList = data.images;
                    applyMasterFilter();
                } else {
                    navigate(0);
                }
            } catch (e) {
                console.error(e);
            } finally {
                showLoader(false);
            }
        }
    }

    // --- Helpers & UI ---
    function updatePageTitle() {
        if (currentParentId === 'root') {
            const catFolders = allFolders.filter(f => (f.category || 'images') === currentCategory);
            const total = catFolders.reduce((acc, f) => acc + (f.fileCount || 0), 0);
            pageMainTitle.innerHTML = `Isha'th Images <span class="title-count">${total}</span>`;
            if (pageMainSubtitle) pageMainSubtitle.style.display = 'block';
        } else {
            const currentFolder = allFolders.find(f => f.id === currentParentId);
            if (currentFolder) {
                pageMainTitle.innerHTML = `${currentFolder.name} <span class="title-count">${currentFolder.fileCount || 0}</span>`;
            }
            if (pageMainSubtitle) pageMainSubtitle.style.display = 'none';
        }
    }

    function updateBreadcrumbs() {
        galleryBreadcrumbs.innerHTML = '';
        navigationPath.forEach((item, index) => {
            const isLast = index === navigationPath.length - 1;
            const span = document.createElement('span');
            span.className = 'breadcrumb-item';
            span.innerHTML = index === 0 ? '<ion-icon name="home-outline"></ion-icon> Home' : item.name;
            span.style.color = isLast ? 'var(--text-primary)' : 'var(--accent-color)';
            if (!isLast) {
                span.onclick = () => navigate(index);
                const slash = document.createElement('ion-icon');
                slash.setAttribute('name', 'chevron-forward-outline');
                slash.className = 'breadcrumb-slash';
                galleryBreadcrumbs.appendChild(span);
                galleryBreadcrumbs.appendChild(slash);
            } else {
                galleryBreadcrumbs.appendChild(span);
            }
        });
    }

    function updateFooterNav() {
        if (!footerNavIcon) return;
        footerNavIcon.setAttribute('name', currentParentId === 'root' ? 'home-outline' : 'arrow-back-outline');
    }

    if (footerNavBtn) {
        footerNavBtn.onclick = (e) => {
            if (currentParentId !== 'root') {
                e.preventDefault();
                navigate(navigationPath.length - 2);
            }
        };
    }

    document.querySelectorAll('.category-tab').forEach(tab => {
        tab.onclick = () => {
            document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentCategory = tab.dataset.category;
            navigate(0);
        };
    });

    cancelModalBtn.onclick = () => passwordModal.style.display = 'none';

    function showLoader(visible) {
        if (loaderFolders) loaderFolders.style.display = visible ? 'block' : 'none';
    }

    function showEmptyState(visible) {
        if (emptyStateFolders) emptyStateFolders.style.display = visible ? 'block' : 'none';
    }

    function isVideo(url) {
        return /\.(mp4|mov|avi|mkv|webm)$/i.test(url);
    }

    function renderMedia(img, index) {
        const container = document.createElement('div');
        container.className = 'media-container';
        if (isVideo(img.url)) {
            const vid = document.createElement('video');
            vid.src = img.url;
            vid.muted = vid.loop = vid.playsInline = true;
            container.onmouseenter = () => vid.play();
            container.onmouseleave = () => { vid.pause(); vid.currentTime = 0; };
            container.appendChild(vid);
            const badge = document.createElement('div');
            badge.className = 'video-badge';
            badge.innerHTML = '<ion-icon name="videocam"></ion-icon> VIDEO';
            container.appendChild(badge);
        } else {
            const el = document.createElement('img');
            el.src = img.url;
            el.loading = 'lazy';
            container.appendChild(el);
        }
        return container;
    }

    function forceDownload(url, name) {
        fetch(url).then(res => res.blob()).then(blob => {
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        });
    }

    // --- Lightbox Logic ---
    window.openLightbox = function(index) {
        currentLightboxIndex = index;
        const lightboxModal = document.getElementById('lightboxModal');
        const lightboxImg = document.getElementById('lightboxImg');
        const img = currentImagesList[index];
        if (img) {
            lightboxImg.src = img.url;
            lightboxModal.style.display = 'flex';
        }
    };

    const lightboxClose = document.getElementById('lightboxClose');
    if (lightboxClose) lightboxClose.onclick = () => document.getElementById('lightboxModal').style.display = 'none';

    const lightboxPrev = document.getElementById('lightboxPrev');
    const lightboxNext = document.getElementById('lightboxNext');

    if (lightboxPrev) {
        lightboxPrev.onclick = () => {
            if (currentLightboxIndex > 0) openLightbox(currentLightboxIndex - 1);
        };
    }
    if (lightboxNext) {
        lightboxNext.onclick = () => {
            if (currentLightboxIndex < currentImagesList.length - 1) openLightbox(currentLightboxIndex + 1);
        };
    }

    // --- Batch Download Logic ---
    function updateBatchBar() {
        const batchBar = document.getElementById('batchActionsBar');
        const batchText = document.getElementById('batchCountText');
        const selected = document.querySelectorAll('.img-card.selected');
        if (selected.length > 0) {
            batchText.textContent = `${selected.length} Selected`;
            batchBar.classList.add('visible');
        } else {
            batchBar.classList.remove('visible');
        }
    }

    const batchClearBtn = document.getElementById('batchClearBtn');
    if (batchClearBtn) {
        batchClearBtn.onclick = () => {
            document.querySelectorAll('.img-card.selected').forEach(c => c.classList.remove('selected'));
            updateBatchBar();
        };
    }

    const batchDownloadBtn = document.getElementById('batchDownloadBtn');
    if (batchDownloadBtn) {
        batchDownloadBtn.onclick = () => {
            const selected = document.querySelectorAll('.img-card.selected');
            selected.forEach((card, i) => {
                setTimeout(() => forceDownload(card.dataset.url, card.dataset.name), i * 350);
            });
            setTimeout(() => {
                document.querySelectorAll('.img-card.selected').forEach(c => c.classList.remove('selected'));
                updateBatchBar();
            }, selected.length * 350 + 500);
        };
    }

    // --- QR Modal Logic ---
    const qrCodeBtn = document.getElementById('qrCodeBtn');
    const qrModal = document.getElementById('qrModal');
    const closeQrModalBtn = document.getElementById('closeQrModalBtn');
    const qrLinkInput = document.getElementById('qrLinkInput');
    const qrPreview = document.getElementById('qrPreview');
    const qrImage = document.getElementById('qrImage');

    if (qrCodeBtn) {
        qrCodeBtn.onclick = () => {
            qrLinkInput.value = window.location.href;
            qrModal.style.display = 'flex';
        };
    }
    if (closeQrModalBtn) closeQrModalBtn.onclick = () => qrModal.style.display = 'none';

    if (qrLinkInput) {
        qrLinkInput.oninput = () => {
            if (qrLinkInput.value.trim()) {
                qrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrLinkInput.value)}`;
                qrPreview.style.display = 'block';
            }
        };
    }

    // --- Feedback Logic ---
    const chatModeBtn = document.getElementById('chatModeBtn');
    const feedbackModal = document.getElementById('feedbackModal');
    const cancelFeedbackBtn = document.getElementById('cancelFeedbackBtn');
    const submitFeedbackBtn = document.getElementById('submitFeedbackBtn');

    if (chatModeBtn) chatModeBtn.onclick = () => feedbackModal.style.display = 'flex';
    if (cancelFeedbackBtn) cancelFeedbackBtn.onclick = () => feedbackModal.style.display = 'none';

    if (submitFeedbackBtn) {
        submitFeedbackBtn.onclick = async () => {
            const name = document.getElementById('feedbackName').value;
            const text = document.getElementById('feedbackText').value;
            if (!name || !text) return;

            submitFeedbackBtn.disabled = true;
            try {
                const res = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, feedback: text })
                });
                if (res.ok) {
                    feedbackModal.style.display = 'none';
                    alert('Feedback sent! Thank you.');
                }
            } catch (e) {} finally {
                submitFeedbackBtn.disabled = false;
            }
        };
    }

    // --- Theme Logic ---
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    if (themeToggleBtn) {
        themeToggleBtn.onclick = () => {
            document.body.classList.toggle('light-theme');
            const icon = document.getElementById('themeIcon');
            icon.setAttribute('name', document.body.classList.contains('light-theme') ? 'moon-outline' : 'sunny-outline');
        };
    }
});
