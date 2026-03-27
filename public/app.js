document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements - Integrated View
    const integratedGrid = document.getElementById('integratedGrid');
    const publicBackBtn = document.getElementById('publicBackBtn');
    const pageMainTitle = document.getElementById('pageMainTitle');
    const pageMainSubtitle = document.getElementById('pageMainSubtitle');
    const galleryBreadcrumbs = document.getElementById('galleryBreadcrumbs');
    const footerNavBtn = document.getElementById('footerNavBtn');
    const footerNavIcon = document.getElementById('footerNavIcon');
    
    // Loaders and States
    const loaderFolders = document.getElementById('loaderFolders');
    const emptyStateFolders = document.getElementById('empty-state-folders');
    
    // Modals
    const passwordModal = document.getElementById('passwordModal');
    const folderPasswordInput = document.getElementById('folderPasswordInput');
    const folderAuthError = document.getElementById('folderAuthError');
    const cancelModalBtn = document.getElementById('cancelModalBtn');
    const submitFolderPasswordBtn = document.getElementById('submitFolderPasswordBtn');
    
    // Global State
    let currentActiveFolderId = null;
    let currentImagesList = [];
    let currentLightboxIndex = 0;
    let currentCategory = 'images';
    let allFolders = [];
    let currentParentId = 'root';
    let navigationPath = [{ id: 'root', name: 'Home' }];

    // --- Core Initialization ---
    fetchFolders();

    async function fetchFolders() {
        try {
            const res = await fetch('/api/folders');
            const data = await res.json();
            
            if (loaderFolders) loaderFolders.style.display = 'none';
            if (data.success && data.folders) {
                allFolders = data.folders;
                applyCategoryFilter();
            } else {
                if (emptyStateFolders) emptyStateFolders.style.display = 'block';
            }
        } catch (e) {
            console.error('Failed to fetch folders', e);
            if (loaderFolders) loaderFolders.style.display = 'none';
        }
    }

    function applyCategoryFilter() {
        const filtered = allFolders.filter(f => {
            const category = f.category || 'images';
            const parentId = f.parentId || 'root';
            return category === currentCategory && parentId === currentParentId;
        });
        
        renderIntegratedContent(filtered);
        
        // Update Title with Count
        updatePageTitle();
        
        if (filtered.length === 0 && currentParentId === 'root') {
            if (emptyStateFolders) emptyStateFolders.style.display = 'block';
        } else {
            if (emptyStateFolders) emptyStateFolders.style.display = 'none';
        }
    }

    function updatePageTitle() {
        if (currentParentId === 'root') {
            const catFolders = allFolders.filter(f => (f.category || 'images') === currentCategory);
            const total = catFolders.reduce((acc, f) => acc + (f.fileCount || 0), 0);
            
            pageMainTitle.innerHTML = `Isha'th Images <span class="title-count">${total}</span>`;
        } else {
            const currentFolder = allFolders.find(f => f.id === currentParentId);
            if (currentFolder) {
                pageMainTitle.innerHTML = `Isha'th Images <span class="title-count">${currentFolder.fileCount || 0}</span>`;
            }
        }
    }

    // --- Hierarchical Navigation ---
    function updateBreadcrumbs() {
        if (!galleryBreadcrumbs) return;
        galleryBreadcrumbs.innerHTML = '';
        navigationPath.forEach((item, index) => {
            const isLast = index === navigationPath.length - 1;
            
            const span = document.createElement('span');
            span.className = 'breadcrumb-item';
            span.style.cursor = 'pointer';
            span.style.color = isLast ? 'var(--text-primary)' : 'var(--accent-color)';
            span.style.fontWeight = isLast ? '600' : '500';
            span.style.display = 'flex';
            span.style.alignItems = 'center';
            span.style.gap = '0.3rem';
            
            if (index === 0) {
                span.innerHTML = '<ion-icon name="home-outline"></ion-icon> Home';
            } else {
                span.textContent = item.name;
            }
            
            if (!isLast) {
                span.addEventListener('click', () => {
                    navigate(index);
                });
                
                const separator = document.createElement('ion-icon');
                separator.setAttribute('name', 'chevron-forward-outline');
                separator.style.fontSize = '0.8rem';
                separator.style.opacity = '0.5';
                
                galleryBreadcrumbs.appendChild(span);
                galleryBreadcrumbs.appendChild(separator);
            } else {
                galleryBreadcrumbs.appendChild(span);
            }
        });
    }

    async function navigate(index) {
        if (!navigationPath[index]) return;
        const item = navigationPath[index];
        navigationPath = navigationPath.slice(0, index + 1);
        currentParentId = item.id;
        updateBreadcrumbs();
        updateFooterNav();
        updatePageTitle();
        
        if (item.id === 'root') {
            if (pageMainSubtitle) pageMainSubtitle.style.display = 'block';
            currentImagesList = [];
            applyCategoryFilter();
        } else {
            if (pageMainSubtitle) pageMainSubtitle.style.display = 'none';
            await loadIntegratedContent(item.id, item.password || '');
        }
    }

    function updateFooterNav() {
        if (!footerNavBtn || !footerNavIcon) return;
        if (currentParentId === 'root') {
            footerNavIcon.setAttribute('name', 'home-outline');
            footerNavBtn.setAttribute('title', 'Back to Details');
        } else {
            footerNavIcon.setAttribute('name', 'arrow-back-outline');
            footerNavBtn.setAttribute('title', 'Go Back');
        }
    }

    if (footerNavBtn) {
        footerNavBtn.addEventListener('click', (e) => {
            if (currentParentId !== 'root') {
                e.preventDefault();
                if (navigationPath.length > 1) {
                    navigate(navigationPath.length - 2);
                }
            }
        });
    }



    // --- Content Rendering ---
    function applyCategoryFilter() {
        // Filter folders based on hierarchy and current category (if at root)
        let filteredFolders = allFolders.filter(f => {
            if (currentParentId === 'root') {
                return (!f.parentId) && (f.category === currentCategory);
            } else {
                return f.parentId === currentParentId;
            }
        });

        // Use the integrated renderer to show both folders and current image list
        renderIntegratedContent(filteredFolders);
    }

    function renderIntegratedContent(folders) {
        integratedGrid.innerHTML = '';
        
        // --- Dynamic Mobile View Defaults ---
        if (window.innerWidth <= 768) {
            // Remove previous view class overrides if no user-set override is present
            // For now, we'll force the defaults the user requested:
            // Root (Folders) -> 3 Columns | Inside Stacks (Files) -> 2 Columns
            integratedGrid.classList.remove('grid-view-1', 'grid-view-2', 'grid-view-3', 'grid-view-4', 'grid-view-5');
            if (currentParentId === 'root') {
                integratedGrid.classList.add('grid-view-3');
            } else {
                integratedGrid.classList.add('grid-view-2');
            }
        }
        // 1. Folders
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
            title.style.color = 'var(--text-primary)';

            if (folder.isPinned) {
                const pinIcon = document.createElement('ion-icon');
                pinIcon.setAttribute('name', 'pin');
                pinIcon.style.position = 'absolute';
                pinIcon.style.top = '10px';
                pinIcon.style.left = '10px';
                pinIcon.style.color = 'var(--accent-color)';
                pinIcon.style.fontSize = '1rem';
                card.appendChild(pinIcon);
            }

            const badge = document.createElement('span');
            if (folder.hasPassword) {
                badge.innerHTML = '<ion-icon name="lock-closed" style="vertical-align: middle; font-size: 0.8rem;"></ion-icon> Protected';
                badge.style.background = 'rgba(255, 255, 255, 0.1)';
                badge.style.padding = '0.2rem 0.5rem';
                badge.style.borderRadius = '4px';
                badge.style.fontSize = '0.75rem';
                badge.style.marginTop = '0.5rem';
                badge.style.color = 'var(--text-secondary)';
            }
            
            card.appendChild(icon);
            card.appendChild(title);
            if(folder.hasPassword) card.appendChild(badge);
            
            card.addEventListener('click', () => handleFolderClick(folder));
            integratedGrid.appendChild(card);
        });

        // 2. Images
        if (currentParentId !== 'root') {
            renderGallery(currentImagesList);
        }
    }

    async function loadIntegratedContent(folderId, password) {
        if (loaderFolders) loaderFolders.style.display = 'block';
        integratedGrid.innerHTML = ''; // Clear grid before loading new content
        try {
            const res = await fetch(`/api/folders/${folderId}/images`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });
            const data = await res.json();
            
            if (loaderFolders) loaderFolders.style.display = 'none';
            if (data.success) {
                currentImagesList = data.images;
                currentActiveFolderId = folderId;
                applyCategoryFilter(); // This will render sub-folders and images
                
                if (data.images.length === 0 && allFolders.filter(f => f.parentId === folderId).length === 0) {
                    if (emptyStateFolders) emptyStateFolders.style.display = 'block';
                } else {
                    if (emptyStateFolders) emptyStateFolders.style.display = 'none';
                }
            } else {
                if (password) folderAuthError.style.display = 'block';
            }
        } catch (e) {
            console.error('Load error', e);
            if (loaderFolders) loaderFolders.style.display = 'none';
        }
    }

    function handleFolderClick(folder) {
        currentActiveFolderId = folder.id;
        if (folder.hasPassword) {
            folderPasswordInput.value = '';
            folderAuthError.style.display = 'none';
            passwordModal.style.display = 'flex';
            setTimeout(() => folderPasswordInput.focus(), 100);
            
            submitFolderPasswordBtn.onclick = async () => {
                const pass = folderPasswordInput.value;
                await attemptAuthAndNavigate(folder, pass);
            };
        } else {
            navigationPath.push({ id: folder.id, name: folder.name });
            navigate(navigationPath.length - 1);
        }
    }

    async function attemptAuthAndNavigate(folder, password) {
        try {
            const res = await fetch(`/api/folders/${folder.id}/images`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });
            const data = await res.json();
            if (data.success) {
                passwordModal.style.display = 'none';
                navigationPath.push({ id: folder.id, name: folder.name, password: password });
                navigate(navigationPath.length - 1);
            } else {
                folderAuthError.style.display = 'block';
            }
        } catch (e) { console.error(e); }
    }

    // --- UI Interactions ---
    document.querySelectorAll('.category-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentCategory = tab.dataset.category;
            navigate(0); // Go back to Home
        });
    });

    cancelModalBtn.addEventListener('click', () => {
        passwordModal.style.display = 'none';
    });

    folderPasswordInput.addEventListener('input', () => {
        if (folderPasswordInput.value.length >= 4) { 
            attemptAutoUnlock(folderPasswordInput.value);
        }
    });

    async function attemptAutoUnlock(password) {
        try {
            const res = await fetch(`/api/folders/${currentActiveFolderId}/images`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });
            const data = await res.json();
            if (data.success) {
                passwordModal.style.display = 'none';
                const folder = allFolders.find(f => f.id === currentActiveFolderId);
                navigationPath.push({ id: folder.id, name: folder.name });
                navigate(navigationPath.length - 1);
            } else if (password.length > 5) { // Only show error if password is long enough to be a serious attempt
                folderAuthError.style.display = 'block';
            }
        } catch (e) {}
    }

    function isVideo(filename) {
        if (!filename) return false;
        return /\.(mp4|mov|avi|mkv|webm)$/i.test(filename);
    }

    async function loadFolderImages(folderId, password) {
        // UI shifts
        if (passwordModal.style.display === 'flex') {
            submitFolderPasswordBtn.textContent = 'Verifying...';
            submitFolderPasswordBtn.disabled = true;
        } else {
            // Keep foldersView visible if there are subfolders, but imagesView is for the gallery
            // Actually, for "Integrated View", we show both. 
            // In public app, imagesView is a separate section. 
            // We'll show imagesView ABOVE the foldersGrid when inside a folder.
            imagesView.style.display = 'block';
            loaderImages.style.display = 'block';
            gallery.innerHTML = '';
            emptyStateImages.style.display = 'none';
        }

        try {
            const res = await fetch(`/api/folders/${folderId}/images`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });
            const data = await res.json();
            
            if (passwordModal.style.display === 'flex') {
                submitFolderPasswordBtn.textContent = 'Unlock';
                submitFolderPasswordBtn.disabled = false;
            }

            if (data.success) {
                // Hide modal if open
                passwordModal.style.display = 'none';
                foldersView.style.display = 'none';
                imagesView.style.display = 'block';
                loaderImages.style.display = 'none';
                folderTitle.textContent = data.folderName || 'Stack Images';
                
                if (data.images.length === 0) {
                    emptyStateImages.style.display = 'block';
                } else {
                    renderGallery(data.images);
                }
            } else {
                if (data.msg === 'Incorrect folder password') {
                    folderAuthError.style.display = 'block';
                    folderAuthError.textContent = 'Incorrect password, please try again.';
                } else {
                    alert('Error: ' + data.msg);
                    if (passwordModal.style.display !== 'flex') goBackToFolders();
                }
            }
        } catch(e) {
            console.error('Failed to load images', e);
            alert('Failed to connect to server.');
            if (passwordModal.style.display !== 'flex') goBackToFolders();
        }
    }

    function isVideo(filename) {
        if (!filename) return false;
        return /\.(mp4|mov|avi|mkv|webm)$/i.test(filename);
    }

    function renderMedia(img, index) {
        const container = document.createElement('div');
        container.className = 'media-container';
        
        if (isVideo(img.url)) {
            const video = document.createElement('video');
            video.src = img.url;
            video.muted = true;
            video.loop = true;
            video.playsInline = true;
            video.preload = 'metadata';
            
            // Autoplay on hover
            container.onmouseenter = () => video.play();
            container.onmouseleave = () => {
                video.pause();
                video.currentTime = 0;
            };
            
            const badge = document.createElement('div');
            badge.className = 'video-badge';
            badge.innerHTML = '<ion-icon name="videocam"></ion-icon> VIDEO';
            
            container.appendChild(video);
            container.appendChild(badge);
            
            // Open lightbox on video click too
            video.style.cursor = 'zoom-in';
            video.onclick = (e) => {
                e.stopPropagation();
                openLightbox(index);
            };
        } else {
            const imgEl = document.createElement('img');
            imgEl.src = img.url;
            imgEl.alt = img.name;
            imgEl.loading = 'lazy';
            imgEl.style.cursor = 'zoom-in';
            imgEl.onclick = (e) => {
                e.stopPropagation();
                openLightbox(index);
            };
            container.appendChild(imgEl);
        }
        
        return container;
    }

    function renderGallery(images) {
        // We no longer clear here because renderIntegratedContent handles it
        currentImagesList = images; 
        images.forEach((img, index) => {
            const card = document.createElement('div');
            card.className = 'card fade-in img-card' + (currentCategory === 'posters' ? ' poster-card' : '');
            card.style.animationDelay = `${(index + 5) * 0.05}s`; // Offset slightly for folders
            card.style.padding = '0';
            card.style.overflow = 'hidden';

            const selectIndicator = document.createElement('div');
            selectIndicator.className = 'select-indicator';
            selectIndicator.innerHTML = '<ion-icon name="checkmark-outline"></ion-icon>';
            card.appendChild(selectIndicator);

            const mediaEl = renderMedia(img, index);
            
            const downloadBtn = document.createElement('a');
            downloadBtn.className = 'btn-icon dl-btn-glass';
            downloadBtn.style.position = 'absolute';
            downloadBtn.style.bottom = '12px';
            downloadBtn.style.right = '12px';
            downloadBtn.style.zIndex = '10';
            downloadBtn.style.background = 'rgba(0, 0, 0, 0.25)';
            downloadBtn.style.backdropFilter = 'blur(10px)';
            downloadBtn.style.webkitBackdropFilter = 'blur(10px)';
            downloadBtn.style.color = '#fff';
            downloadBtn.style.borderRadius = '8px';
            downloadBtn.style.width = '38px';
            downloadBtn.style.height = '38px';
            downloadBtn.style.display = 'flex';
            downloadBtn.style.alignItems = 'center';
            downloadBtn.style.justifyContent = 'center';
            downloadBtn.style.border = '1px solid rgba(255, 255, 255, 0.15)';
            downloadBtn.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';
            downloadBtn.style.transition = 'all 0.2s ease';
            downloadBtn.href = img.url;
            downloadBtn.download = img.name;
            downloadBtn.title = 'Download File';
            downloadBtn.innerHTML = '<ion-icon name="arrow-down-circle-outline" style="font-size: 1.4rem;"></ion-icon>';
            downloadBtn.onclick = (e) => {
                e.stopPropagation();
                e.preventDefault();
                forceDownload(img.url, img.name);
            };
            
            card.appendChild(mediaEl);
            card.appendChild(downloadBtn);

            selectIndicator.onclick = (e) => {
                e.stopPropagation();
                card.classList.toggle('selected');
                updateBatchBar();
            };

            integratedGrid.appendChild(card);
        });
    }

    function forceDownload(url, filename) {
        fetch(url)
            .then(res => res.blob())
            .then(blob => {
                const blobUrl = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = blobUrl;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(blobUrl);
                document.body.removeChild(a);
            })
            .catch(err => console.error('Download err:', err));
    }

    backBtn.addEventListener('click', goBackToFolders);

    function goBackToFolders() {
        imagesView.style.display = 'none';
        foldersView.style.display = 'block';
    }

    // --- Footer Logic ---
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const themeIcon = document.getElementById('themeIcon');
    const chatModeBtn = document.getElementById('chatModeBtn');
    const feedbackModal = document.getElementById('feedbackModal');
    const cancelFeedbackBtn = document.getElementById('cancelFeedbackBtn');
    const submitFeedbackBtn = document.getElementById('submitFeedbackBtn');
    const feedbackName = document.getElementById('feedbackName');
    const feedbackText = document.getElementById('feedbackText');
    const feedbackStatus = document.getElementById('feedbackStatus');

    // --- Grid Toggle Logic (Bubble Selector) ---
    const cycleBtns = document.querySelectorAll('.cycle-view-btn');
    const viewSelectorBubble = document.getElementById('viewSelectorBubble');
    const viewOptions = document.querySelectorAll('.view-option');
    let currentActiveGridId = null;

    if (cycleBtns.length > 0 && viewSelectorBubble) {
        cycleBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                currentActiveGridId = btn.getAttribute('data-target');
                const targetGrid = document.getElementById(currentActiveGridId);
                
                // Position below the button
                const rect = btn.getBoundingClientRect();
                viewSelectorBubble.style.left = `${rect.left + rect.width/2}px`;
                viewSelectorBubble.style.top = `${rect.bottom}px`;
                viewSelectorBubble.style.display = 'flex';
                
                // Highlight current active view
                viewOptions.forEach(opt => {
                    const view = opt.getAttribute('data-view');
                    const className = view === 'list' ? 'grid-view-list' : `grid-view-${view}`;
                    const isActive = (view === 'auto' && !targetGrid.className.includes('grid-view-')) || 
                                   (view !== 'auto' && targetGrid.classList.contains(className));
                    opt.classList.toggle('active', isActive);
                });
            });
        });

        viewOptions.forEach(opt => {
            opt.addEventListener('click', (e) => {
                e.stopPropagation();
                if (!currentActiveGridId) return;
                const targetGrid = document.getElementById(currentActiveGridId);
                const viewType = opt.getAttribute('data-view');
                
                targetGrid.classList.remove('grid-view-4', 'grid-view-3', 'grid-view-1', 'grid-view-list');
                if (viewType !== 'auto') {
                    const className = viewType === 'list' ? 'grid-view-list' : `grid-view-${viewType}`;
                    targetGrid.classList.add(className);
                }
                
                viewSelectorBubble.style.display = 'none';
            });
        });

        document.addEventListener('click', () => {
            viewSelectorBubble.style.display = 'none';
        });
    }

    // Theme logic
    themeToggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('light-theme');
        if (document.body.classList.contains('light-theme')) {
            themeIcon.setAttribute('name', 'moon-outline');
        } else {
            themeIcon.setAttribute('name', 'sunny-outline');
        }
    });

    // --- Batch Download Overlay Logic ---
    function updateBatchBar() {
        const batchBar = document.getElementById('batchActionsBar');
        const batchText = document.getElementById('batchCountText');
        const selected = document.querySelectorAll('.img-card.selected');
        if (selected.length > 0) {
            batchText.textContent = `${selected.length} Item${selected.length > 1 ? 's' : ''}`;
            batchBar.classList.add('visible');
        } else {
            batchBar.classList.remove('visible');
        }
    }

    document.getElementById('batchClearBtn').addEventListener('click', () => {
        document.querySelectorAll('.img-card.selected').forEach(c => c.classList.remove('selected'));
        updateBatchBar();
    });

    document.getElementById('batchDownloadBtn').addEventListener('click', () => {
        const selected = document.querySelectorAll('.img-card.selected');
        const originalText = document.getElementById('batchDownloadBtn').innerHTML;
        document.getElementById('batchDownloadBtn').innerHTML = '<ion-icon name="sync-outline" style="animation: spin 1s linear infinite; margin-right: 0.5rem;"></ion-icon> Packaging...';
        
        selected.forEach((card, i) => {
            const url = card.dataset.url;
            const name = card.dataset.name;
            setTimeout(() => {
                const a = document.createElement('a');
                a.href = url;
                a.download = name;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            }, i * 300);
        });
        
        setTimeout(() => {
            document.querySelectorAll('.img-card.selected').forEach(c => c.classList.remove('selected'));
            updateBatchBar();
            document.getElementById('batchDownloadBtn').innerHTML = originalText;
        }, selected.length * 300 + 500);
    });

    // Chat logic
    chatModeBtn.addEventListener('click', () => {
        feedbackName.value = '';
        feedbackText.value = '';
        feedbackStatus.style.display = 'none';
        feedbackModal.style.display = 'flex';
    });
    
    cancelFeedbackBtn.addEventListener('click', () => {
        feedbackModal.style.display = 'none';
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
                showSuccessModal();
                // Reset form
                feedbackName.value = '';
                feedbackText.value = '';
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

    function showSuccessModal() {
        const successModal = document.getElementById('successModal');
        if (successModal) {
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

    // --- Lightbox Modal Logic ---
    const lightboxModal = document.getElementById('lightboxModal');
    const lightboxImg = document.getElementById('lightboxImg');
    const lightboxClose = document.getElementById('lightboxClose');
    const lightboxPrev = document.getElementById('lightboxPrev');
    const lightboxNext = document.getElementById('lightboxNext');
    const lightboxSelectBtn = document.getElementById('lightboxSelectBtn');
    const lightboxReplyBtn = document.getElementById('lightboxReplyBtn');
    const replyModal = document.getElementById('replyModal');
    const replyForm = document.getElementById('replyForm');
    const replyThumb = document.getElementById('replyThumb');
    const replyNameInput = document.getElementById('replyNameInput');
    const replyTextInput = document.getElementById('replyTextInput');
    const closeReplyModalBtn = document.getElementById('closeReplyModalBtn');
    const replyStatusMessage = document.getElementById('replyStatusMessage');

    window.openLightbox = function(index) {
        currentLightboxIndex = index;
        lightboxModal.style.display = 'flex';
        updateLightbox();
    };

    function updateLightbox() {
        if (!currentImagesList || currentImagesList.length === 0) return;
        const img = currentImagesList[currentLightboxIndex];
        
        // Dynamic media switch
        const oldImg = document.getElementById('lightboxImg');
        const oldVid = document.getElementById('lightboxVid');
        if (oldVid) oldVid.remove();
        
        if (isVideo(img.url)) {
            oldImg.style.display = 'none';
            const vid = document.createElement('video');
            vid.id = 'lightboxVid';
            vid.src = img.url;
            vid.controls = true;
            vid.autoplay = true;
            vid.style.maxWidth = '90vw';
            vid.style.maxHeight = '80vh';
            vid.style.borderRadius = '8px';
            vid.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5)';
            oldImg.parentNode.insertBefore(vid, oldImg.nextSibling);
        } else {
            oldImg.style.display = 'block';
            oldImg.src = img.url;
            oldImg.alt = img.name;
        }

        lightboxPrev.disabled = currentLightboxIndex === 0;
        lightboxNext.disabled = currentLightboxIndex === currentImagesList.length - 1;

        // Sync with underlying grid card
        const targetCard = gallery.children[currentLightboxIndex];
        if (targetCard && targetCard.classList.contains('selected')) {
            lightboxSelectBtn.innerHTML = '<ion-icon name="checkmark-circle"></ion-icon> Selected';
            lightboxSelectBtn.style.color = 'var(--accent-color)';
            lightboxSelectBtn.style.borderColor = 'var(--accent-color)';
        } else {
            lightboxSelectBtn.innerHTML = '<ion-icon name="ellipse-outline"></ion-icon> Select';
            lightboxSelectBtn.style.color = '';
            lightboxSelectBtn.style.borderColor = '';
        }

        // Update download icon to match new style
        lightboxDownloadBtn.innerHTML = '<ion-icon name="arrow-down-circle-outline"></ion-icon> Download';
    }

    // --- Reply Modal Logic ---
    lightboxReplyBtn.addEventListener('click', () => {
        const img = currentImagesList[currentLightboxIndex];
        const container = document.getElementById('replyMediaContainer');
        container.innerHTML = '';
        
        if (isVideo(img.url)) {
            const vid = document.createElement('video');
            vid.src = img.url;
            vid.muted = true;
            vid.style.width = '100%';
            vid.style.height = '100%';
            vid.style.objectFit = 'cover';
            container.appendChild(vid);
        } else {
            const thumb = document.createElement('img');
            thumb.src = img.url;
            thumb.style.width = '100%';
            thumb.style.height = '100%';
            thumb.style.objectFit = 'cover';
            container.appendChild(thumb);
        }

        replyStatusMessage.style.display = 'none';
        replyTextInput.value = '';
        replyModal.style.display = 'flex';
    });

    closeReplyModalBtn.addEventListener('click', () => {
        replyModal.style.display = 'none';
    });

    replyForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const img = currentImagesList[currentLightboxIndex];
        const name = replyNameInput.value.trim();
        const text = replyTextInput.value.trim();

        if (!name || !text) return;

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    name, 
                    feedback: text, 
                    mediaUrl: img.url 
                })
            });
            const data = await res.json();
            if (data.success) {
                replyStatusMessage.textContent = 'Reply sent successfully!';
                replyStatusMessage.style.display = 'block';
                replyStatusMessage.style.color = '#7ee787';
                setTimeout(() => {
                    replyModal.style.display = 'none';
                }, 1500);
            }
        } catch(e) {
            replyStatusMessage.textContent = 'Error sending reply';
            replyStatusMessage.style.display = 'block';
            replyStatusMessage.style.color = '#ff7b72';
        }
    });

    lightboxClose.addEventListener('click', () => {
        lightboxModal.style.display = 'none';
        lightboxImg.src = '';
    });

    lightboxPrev.addEventListener('click', () => {
        if (currentLightboxIndex > 0) {
            currentLightboxIndex--;
            updateLightbox();
        }
    });

    lightboxNext.addEventListener('click', () => {
        if (currentLightboxIndex < currentImagesList.length - 1) {
            currentLightboxIndex++;
            updateLightbox();
        }
    });

    lightboxSelectBtn.addEventListener('click', () => {
        const targetCard = gallery.children[currentLightboxIndex];
        if (targetCard) {
            targetCard.classList.toggle('selected');
            updateBatchBar();
            updateLightbox();
        }
    });

    lightboxDownloadBtn.addEventListener('click', () => {
        const img = currentImagesList[currentLightboxIndex];
        forceDownload(img.url, img.name);
    });

    document.addEventListener('keydown', (e) => {
        if (lightboxModal.style.display === 'flex') {
            if (e.key === 'ArrowLeft') lightboxPrev.click();
            if (e.key === 'ArrowRight') lightboxNext.click();
            if (e.key === 'Escape') lightboxClose.click();
        }
    });

    // ======= QR Code Generator =======
    const qrCodeBtn = document.getElementById('qrCodeBtn');
    const qrModal = document.getElementById('qrModal');
    const qrLinkInput = document.getElementById('qrLinkInput');
    const qrImage = document.getElementById('qrImage');
    const qrPreview = document.getElementById('qrPreview');
    const qrDownPNG = document.getElementById('qrDownPNG');
    const qrDownJPG = document.getElementById('qrDownJPG');
    const qrDownPDF = document.getElementById('qrDownPDF');
    const closeQrModalBtn = document.getElementById('closeQrModalBtn');

    let currentQrLink = '';

    qrCodeBtn.addEventListener('click', () => {
        qrModal.style.display = 'flex';
        qrLinkInput.value = '';
        qrPreview.style.display = 'none';
        setTimeout(() => qrLinkInput.focus(), 100);
    });

    closeQrModalBtn.addEventListener('click', () => {
        qrModal.style.display = 'none';
    });

    qrModal.addEventListener('click', (e) => {
        if (e.target === qrModal) qrModal.style.display = 'none';
    });

    let qrDebounce;
    qrLinkInput.addEventListener('input', () => {
        clearTimeout(qrDebounce);
        const link = qrLinkInput.value.trim();
        if (!link) { qrPreview.style.display = 'none'; return; }
        qrDebounce = setTimeout(() => {
            currentQrLink = encodeURIComponent(link);
            const apiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${currentQrLink}&margin=10`;
            qrImage.src = apiUrl;
            qrPreview.style.display = 'block';
        }, 600);
    });

    async function downloadQR(format) {
        if (!currentQrLink) return;
        
        // Use PNG to build the PDF internally
        const fetchFormat = format === 'pdf' ? 'png' : format;
        const apiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&format=${fetchFormat}&data=${currentQrLink}&margin=20`;
        
        // Grab correct button based on format ID
        let btnId = 'qrDown' + (format === 'jpeg' ? 'JPG' : format.toUpperCase());
        const btn = document.getElementById(btnId);
        
        const originalText = btn.innerHTML;
        btn.innerHTML = `<ion-icon name="hourglass-outline"></ion-icon> Loading...`;
        btn.disabled = true;

        try {
            const res = await fetch(apiUrl);
            if (!res.ok) throw new Error('Network response was not ok');
            const blob = await res.blob();
            
            if (format === 'pdf') {
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: [100, 100] });
                
                const reader = new FileReader();
                reader.readAsDataURL(blob);
                reader.onloadend = () => {
                    const base64data = reader.result;
                    doc.addImage(base64data, 'PNG', 10, 10, 80, 80);
                    doc.save(`QRCode.pdf`);
                    btn.innerHTML = originalText;
                    btn.disabled = false;
                }
            } else {
                const blobUrl = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = blobUrl;
                a.download = `QRCode.${format}`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(blobUrl);
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        } catch (err) {
            console.error('Download error:', err);
            btn.innerHTML = `<ion-icon name="alert-circle-outline"></ion-icon> Failed`;
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }, 2000);
        }
    }

    qrDownPNG.addEventListener('click', () => downloadQR('png'));
    qrDownJPG.addEventListener('click', () => downloadQR('jpeg'));
    qrDownPDF.addEventListener('click', () => downloadQR('pdf'));

});
