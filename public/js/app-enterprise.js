// Titan Base Enterprise APK Shop - Advanced JavaScript with Enterprise Features
class TitanBaseEnterpriseAPKShop {
    constructor() {
        this.currentFile = null;
        this.apks = [];
        this.currentUser = null;
        this.authToken = localStorage.getItem('authToken');
        this.apiKey = localStorage.getItem('apiKey');
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupSmoothScrolling();
        this.setupIntersectionObserver();
        this.setupParallaxEffects();
        
        // Check authentication status
        if (this.authToken) {
            this.checkAuthStatus();
        } else {
            this.showLoginForm();
        }
    }

    setupEventListeners() {
        // Authentication forms
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        
        if (loginForm) {
            loginForm.addEventListener('submit', this.handleLogin.bind(this));
        }
        if (registerForm) {
            registerForm.addEventListener('submit', this.handleRegister.bind(this));
        }

        // File input and upload area
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        const uploadBtn = document.getElementById('uploadBtn');

        if (uploadArea) {
            uploadArea.addEventListener('click', () => fileInput.click());
            uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
            uploadArea.addEventListener('dragleave', this.handleDragLeave.bind(this));
            uploadArea.addEventListener('drop', this.handleDrop.bind(this));
        }
        
        if (fileInput) {
            fileInput.addEventListener('change', this.handleFileSelect.bind(this));
        }
        
        if (uploadBtn) {
            uploadBtn.addEventListener('click', this.uploadAPK.bind(this));
        }

        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', this.handleNavigation.bind(this));
        });

        // Form validation
        ['apkName', 'apkVersion', 'apkDescription'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('input', this.validateForm.bind(this));
            }
        });

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', this.handleLogout.bind(this));
        }
    }

    async checkAuthStatus() {
        try {
            const response = await fetch('/api/apks', {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                }
            });

            if (response.ok) {
                this.currentUser = JSON.parse(atob(this.authToken.split('.')[1]));
                this.showMainInterface();
                this.loadAPKs();
            } else {
                this.authToken = null;
                localStorage.removeItem('authToken');
                this.showLoginForm();
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            this.showLoginForm();
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const username = formData.get('username');
        const password = formData.get('password');

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            if (response.ok) {
                const data = await response.json();
                this.authToken = data.token;
                this.apiKey = data.user.apiKey;
                this.currentUser = data.user;
                
                localStorage.setItem('authToken', this.authToken);
                localStorage.setItem('apiKey', this.apiKey);
                
                this.showMainInterface();
                this.loadAPKs();
                this.showToast('Login successful!', 'success');
            } else {
                const error = await response.json();
                this.showToast(error.error, 'error');
            }
        } catch (error) {
            this.showToast('Login failed. Please try again.', 'error');
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const username = formData.get('username');
        const email = formData.get('email');
        const password = formData.get('password');

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, email, password })
            });

            if (response.ok) {
                const data = await response.json();
                this.authToken = data.token;
                this.apiKey = data.apiKey;
                this.currentUser = { username, role: 'user' };
                
                localStorage.setItem('authToken', this.authToken);
                localStorage.setItem('apiKey', this.apiKey);
                
                this.showMainInterface();
                this.showToast('Registration successful!', 'success');
            } else {
                const error = await response.json();
                this.showToast(error.error, 'error');
            }
        } catch (error) {
            this.showToast('Registration failed. Please try again.', 'error');
        }
    }

    handleLogout() {
        this.authToken = null;
        this.apiKey = null;
        this.currentUser = null;
        this.apks = [];
        
        localStorage.removeItem('authToken');
        localStorage.removeItem('apiKey');
        
        this.showLoginForm();
        this.showToast('Logged out successfully', 'info');
    }

    showLoginForm() {
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.innerHTML = `
                <div class="auth-container">
                    <div class="auth-tabs">
                        <button class="auth-tab active" onclick="app.switchAuthTab('login')">Login</button>
                        <button class="auth-tab" onclick="app.switchAuthTab('register')">Register</button>
                    </div>
                    
                    <div id="loginForm" class="auth-form">
                        <h2>Welcome Back</h2>
                        <form>
                            <div class="form-group">
                                <label for="loginUsername">Username</label>
                                <input type="text" id="loginUsername" name="username" required>
                            </div>
                            <div class="form-group">
                                <label for="loginPassword">Password</label>
                                <input type="password" id="loginPassword" name="password" required>
                            </div>
                            <button type="submit" class="btn btn-primary">Login</button>
                        </form>
                    </div>
                    
                    <div id="registerForm" class="auth-form hidden">
                        <h2>Create Account</h2>
                        <form>
                            <div class="form-group">
                                <label for="registerUsername">Username</label>
                                <input type="text" id="registerUsername" name="username" required>
                            </div>
                            <div class="form-group">
                                <label for="registerEmail">Email</label>
                                <input type="email" id="registerEmail" name="email" required>
                            </div>
                            <div class="form-group">
                                <label for="registerPassword">Password</label>
                                <input type="password" id="registerPassword" name="password" required>
                            </div>
                            <button type="submit" class="btn btn-primary">Register</button>
                        </form>
                    </div>
                </div>
            `;
        }
        
        // Re-setup event listeners for new forms
        this.setupEventListeners();
    }

    switchAuthTab(tab) {
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        const tabs = document.querySelectorAll('.auth-tab');
        
        tabs.forEach(t => t.classList.remove('active'));
        event.target.classList.add('active');
        
        if (tab === 'login') {
            loginForm.classList.remove('hidden');
            registerForm.classList.add('hidden');
        } else {
            registerForm.classList.remove('hidden');
            loginForm.classList.add('hidden');
        }
    }

    showMainInterface() {
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.innerHTML = `
                <section id="upload" class="section">
                    <div class="section-header">
                        <h2><i class="fas fa-cloud-upload-alt"></i> Upload Your APK</h2>
                        <p>Share your Titan Base APK with the world. Enterprise-grade APK management with versioning, analytics, and security.</p>
                    </div>
                    
                    <div class="upload-container">
                        <div class="upload-area" id="uploadArea">
                            <div class="upload-icon">
                                <i class="fas fa-mobile-alt"></i>
                            </div>
                            <h3>Drop your APK here</h3>
                            <p>or click to browse files</p>
                            <input type="file" id="fileInput" accept=".apk" hidden>
                        </div>
                        
                        <div class="upload-form">
                            <div class="form-group">
                                <label for="apkName">APK Name</label>
                                <input type="text" id="apkName" placeholder="e.g., Titan Base v1.0" required>
                            </div>
                            
                            <div class="form-group">
                                <label for="apkVersion">Version</label>
                                <input type="text" id="apkVersion" placeholder="e.g., 1.0.0" required>
                            </div>
                            
                            <div class="form-group">
                                <label for="apkDescription">Description</label>
                                <textarea id="apkDescription" placeholder="Describe your APK features, improvements, and what makes it special..." rows="3"></textarea>
                            </div>
                            
                            <button type="button" id="uploadBtn" class="btn btn-primary" disabled>
                                <i class="fas fa-upload"></i> Upload APK
                            </button>
                        </div>
                    </div>
                    
                    <div id="uploadProgress" class="upload-progress hidden">
                        <div class="progress-bar">
                            <div class="progress-fill" id="progressFill"></div>
                        </div>
                        <p id="progressText">Uploading your APK...</p>
                    </div>
                </section>

                <section id="library" class="section">
                    <div class="section-header">
                        <h2><i class="fas fa-folder-open"></i> APK Library</h2>
                        <p>Manage and organize all your uploaded applications. Enterprise APK versioning and distribution platform.</p>
                    </div>
                    
                    <div class="library-container">
                        <div class="library-controls">
                            <div class="search-controls">
                                <input type="text" id="searchName" placeholder="Search by name..." class="search-input">
                                <input type="text" id="searchVersion" placeholder="Search by version..." class="search-input">
                                <button id="searchBtn" class="btn btn-secondary">Search</button>
                            </div>
                            <div class="bulk-controls">
                                <button id="bulkUploadBtn" class="btn btn-success">
                                    <i class="fas fa-upload"></i> Bulk Upload
                                </button>
                                <button id="exportBtn" class="btn btn-info">
                                    <i class="fas fa-download"></i> Export Data
                                </button>
                            </div>
                        </div>
                        
                        <div id="apkList" class="apk-grid">
                            <!-- APK cards will be populated here -->
                        </div>
                        
                        <div id="emptyState" class="empty-state">
                            <i class="fas fa-box-open"></i>
                            <h3>No APKs uploaded yet</h3>
                            <p>Upload your first APK to get started with enterprise APK management!</p>
                        </div>
                    </div>
                </section>

                <section id="analytics" class="section">
                    <div class="section-header">
                        <h2><i class="fas fa-chart-bar"></i> Analytics Dashboard</h2>
                        <p>Track downloads, user engagement, and APK performance metrics.</p>
                    </div>
                    
                    <div class="analytics-container">
                        <div class="analytics-filters">
                            <input type="date" id="startDate" class="date-input">
                            <input type="date" id="endDate" class="date-input">
                            <button id="generateReportBtn" class="btn btn-primary">Generate Report</button>
                        </div>
                        
                        <div id="analyticsContent" class="analytics-content">
                            <div class="analytics-summary">
                                <div class="metric-card">
                                    <h3>Total Downloads</h3>
                                    <p id="totalDownloads">0</p>
                                </div>
                                <div class="metric-card">
                                    <h3>Active APKs</h3>
                                    <p id="activeAPKs">0</p>
                                </div>
                                <div class="metric-card">
                                    <h3>Total Users</h3>
                                    <p id="totalUsers">0</p>
                                </div>
                            </div>
                            
                            <div id="analyticsChart" class="analytics-chart">
                                <!-- Chart will be rendered here -->
                            </div>
                        </div>
                    </div>
                </section>
            `;
        }
        
        // Re-setup event listeners for new interface
        this.setupEventListeners();
    }

    async loadAPKs() {
        try {
            const response = await fetch('/api/apks', {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                }
            });
            
            if (response.ok) {
                this.apks = await response.json();
                this.renderAPKs();
            } else {
                throw new Error('Failed to load APKs');
            }
        } catch (error) {
            console.error('Error loading APKs:', error);
            this.showToast('Failed to load APKs', 'error');
        }
    }

    renderAPKs() {
        const apkList = document.getElementById('apkList');
        const emptyState = document.getElementById('emptyState');

        if (!apkList || !emptyState) return;

        if (this.apks.length === 0) {
            apkList.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';
        apkList.innerHTML = this.apks.map(apk => this.createAPKCard(apk)).join('');
        
        // Add staggered animation to cards
        const cards = apkList.querySelectorAll('.apk-card');
        cards.forEach((card, index) => {
            card.style.animationDelay = `${index * 0.1}s`;
        });
    }

    createAPKCard(apk) {
        const size = this.formatFileSize(apk.file_size);
        const date = new Date(apk.upload_date).toLocaleDateString();
        const downloadCount = apk.download_count || 0;
        
        return `
            <div class="apk-card" data-id="${apk.id}">
                <div class="card-header">
                    <div class="apk-info">
                        <h3>${this.escapeHtml(apk.name)}</h3>
                        <span class="version">v${this.escapeHtml(apk.version)}</span>
                        <span class="uploader">by ${this.escapeHtml(apk.uploader_name)}</span>
                    </div>
                    <div class="card-actions">
                        <button class="btn btn-success" onclick="app.downloadAPK('${apk.id}')">
                            <i class="fas fa-download"></i> Download
                        </button>
                        <button class="btn btn-info" onclick="app.showVersions('${apk.id}')">
                            <i class="fas fa-code-branch"></i> Versions
                        </button>
                        ${apk.user_id === this.currentUser.id || this.currentUser.role === 'admin' ? 
                            `<button class="btn btn-danger" onclick="app.deleteAPK('${apk.id}')">
                                <i class="fas fa-trash"></i> Delete
                            </button>` : ''
                        }
                    </div>
                </div>
                <div class="card-body">
                    <p class="description">${this.escapeHtml(apk.description)}</p>
                    <div class="apk-details">
                        <span class="size">${size}</span>
                        <span class="date">${date}</span>
                        <span class="downloads">${downloadCount} downloads</span>
                    </div>
                    <div class="apk-metadata">
                        <span class="hash">Hash: ${apk.file_hash.substring(0, 8)}...</span>
                        <span class="status ${apk.is_active ? 'active' : 'inactive'}">
                            ${apk.is_active ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                </div>
            </div>
        `;
    }

    async downloadAPK(id) {
        try {
            const response = await fetch(`/api/apks/${id}/download`, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                }
            });
            
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `titan-base-${id}.apk`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                
                this.showToast('Download started!', 'success');
                this.loadAPKs(); // Refresh to update download count
            } else {
                throw new Error('Download failed');
            }
        } catch (error) {
            this.showToast('Download failed. Please try again.', 'error');
            console.error('Download error:', error);
        }
    }

    async showVersions(apkId) {
        try {
            const response = await fetch(`/api/apks/${apkId}/versions`, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                }
            });
            
            if (response.ok) {
                const versions = await response.json();
                this.showVersionsModal(versions);
            } else {
                throw new Error('Failed to fetch versions');
            }
        } catch (error) {
            this.showToast('Failed to fetch versions', 'error');
        }
    }

    showVersionsModal(versions) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>APK Versions</h3>
                <div class="versions-list">
                    ${versions.map(version => `
                        <div class="version-item ${version.is_active ? 'active' : ''} ${version.is_rollback ? 'rollback' : ''}">
                            <div class="version-info">
                                <span class="version-number">v${version.version}</span>
                                <span class="version-date">${new Date(version.upload_date).toLocaleDateString()}</span>
                                <span class="version-status">
                                    ${version.is_active ? 'Active' : 'Inactive'}
                                    ${version.is_rollback ? ' (Rollback)' : ''}
                                </span>
                            </div>
                            <div class="version-actions">
                                ${version.is_active ? '' : 
                                    `<button class="btn btn-success btn-sm" onclick="app.rollbackToVersion('${version.id}')">
                                        Activate
                                    </button>`
                                }
                            </div>
                        </div>
                    `).join('')}
                </div>
                <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">Close</button>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    async rollbackToVersion(versionId) {
        try {
            const response = await fetch(`/api/apks/${versionId}/rollback`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                }
            });
            
            if (response.ok) {
                this.showToast('Rollback successful!', 'success');
                this.loadAPKs();
                document.querySelector('.modal').remove();
            } else {
                throw new Error('Rollback failed');
            }
        } catch (error) {
            this.showToast('Rollback failed. Please try again.', 'error');
        }
    }

    async deleteAPK(id) {
        this.showConfirmModal(
            'Are you sure you want to delete this APK? This action cannot be undone.',
            async () => {
                try {
                    const response = await fetch(`/api/apks/${id}`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${this.authToken}`
                        }
                    });
                    
                    if (response.ok) {
                        this.showToast('APK deleted successfully!', 'success');
                        this.loadAPKs();
                    } else {
                        throw new Error('Delete failed');
                    }
                } catch (error) {
                    this.showToast('Delete failed. Please try again.', 'error');
                }
            }
        );
    }

    // ... existing utility methods (setupSmoothScrolling, setupIntersectionObserver, etc.)
    setupSmoothScrolling() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    setupIntersectionObserver() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);

        document.querySelectorAll('.section, .apk-card, .about-card').forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(el);
        });
    }

    setupParallaxEffects() {
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const parallaxElements = document.querySelectorAll('.section-header h2 i');
            
            parallaxElements.forEach((element, index) => {
                const speed = 0.5 + (index * 0.1);
                element.style.transform = `translateY(${scrolled * speed * 0.1}px)`;
            });
        });
    }

    handleDragOver(e) {
        e.preventDefault();
        e.currentTarget.classList.add('drag-over');
        e.currentTarget.style.transform = 'scale(1.02)';
    }

    handleDragLeave(e) {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over');
        e.currentTarget.style.transform = 'scale(1)';
    }

    handleDrop(e) {
        e.preventDefault();
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.handleFile(files[0]);
        }
        e.currentTarget.classList.remove('drag-over');
        e.currentTarget.style.transform = 'scale(1)';
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.handleFile(file);
        }
    }

    handleFile(file) {
        if (!file.name.toLowerCase().endsWith('.apk')) {
            this.showToast('Please select an APK file', 'error');
            return;
        }

        this.currentFile = file;
        this.showToast(`Selected: ${file.name}`, 'success');
        this.validateForm();
        
        const uploadArea = document.getElementById('uploadArea');
        if (uploadArea) {
            uploadArea.style.transform = 'scale(1.05)';
            setTimeout(() => {
                uploadArea.style.transform = 'scale(1)';
            }, 200);
        }
    }

    validateForm() {
        const name = document.getElementById('apkName');
        const version = document.getElementById('apkVersion');
        const description = document.getElementById('apkDescription');
        const uploadBtn = document.getElementById('uploadBtn');

        if (!name || !version || !description || !uploadBtn) return;

        if (name.value.trim() && version.value.trim() && description.value.trim() && this.currentFile) {
            uploadBtn.disabled = false;
            uploadBtn.style.transform = 'scale(1.05)';
            setTimeout(() => {
                uploadBtn.style.transform = 'scale(1)';
            }, 200);
        } else {
            uploadBtn.disabled = true;
        }
    }

    async uploadAPK() {
        if (!this.currentFile) return;

        const formData = new FormData();
        formData.append('apk', this.currentFile);
        formData.append('name', document.getElementById('apkName').value.trim());
        formData.append('version', document.getElementById('apkVersion').value.trim());
        formData.append('description', document.getElementById('apkDescription').value.trim());

        const progressBar = document.getElementById('uploadProgress');
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');

        try {
            progressBar.classList.remove('hidden');
            
            let progress = 0;
            const progressInterval = setInterval(() => {
                progress += Math.random() * 15;
                if (progress > 90) progress = 90;
                progressFill.style.width = `${progress}%`;
            }, 200);

            const response = await fetch('/api/apks/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                },
                body: formData
            });

            clearInterval(progressInterval);

            if (response.ok) {
                progressFill.style.width = '100%';
                progressText.textContent = 'Upload complete!';
                
                setTimeout(() => {
                    progressBar.classList.add('hidden');
                    this.resetForm();
                    this.loadAPKs();
                    this.showToast('APK uploaded successfully!', 'success');
                }, 1000);
            } else {
                throw new Error('Upload failed');
            }
        } catch (error) {
            progressBar.classList.add('hidden');
            this.showToast('Upload failed. Please try again.', 'error');
            console.error('Upload error:', error);
        }
    }

    resetForm() {
        const name = document.getElementById('apkName');
        const version = document.getElementById('apkVersion');
        const description = document.getElementById('apkDescription');
        const fileInput = document.getElementById('fileInput');
        
        if (name) name.value = '';
        if (version) version.value = '';
        if (description) description.value = '';
        if (fileInput) fileInput.value = '';
        
        this.currentFile = null;
        this.validateForm();
    }

    showConfirmModal(message, onConfirm) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Confirm Action</h3>
                <p>${message}</p>
                <div class="modal-actions">
                    <button class="btn btn-danger" onclick="this.closest('.modal').remove(); ${onConfirm.toString()}()">Confirm</button>
                    <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">Cancel</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toastContainer') || this.createToastContainer();
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        toast.innerHTML = `
            <div class="toast-header">
                <h4>${this.getToastTitle(type)}</h4>
                <button class="close-btn" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <p>${message}</p>
        `;

        toastContainer.appendChild(toast);

        setTimeout(() => {
            if (toast.parentElement) {
                toast.style.opacity = '0';
                toast.style.transform = 'translateX(100%)';
                setTimeout(() => {
                    if (toast.parentElement) {
                        toast.remove();
                    }
                }, 300);
            }
        }, 5000);
    }

    createToastContainer() {
        const container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
        return container;
    }

    getToastTitle(type) {
        const titles = {
            success: 'Success!',
            error: 'Error!',
            warning: 'Warning!',
            info: 'Info'
        };
        return titles[type] || 'Info';
    }

    handleNavigation(e) {
        e.preventDefault();
        
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        e.target.classList.add('active');
        
        const targetId = e.target.getAttribute('href').substring(1);
        const targetSection = document.getElementById(targetId);
        
        if (targetSection) {
            targetSection.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new TitanBaseEnterpriseAPKShop();
    
    // Add loading animation
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.5s ease';
    
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);
});

// Add scroll-based animations
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const header = document.querySelector('.header');
    
    if (header) {
        if (scrolled > 100) {
            header.style.background = 'rgba(26, 26, 26, 0.95)';
            header.style.backdropFilter = 'blur(10px)';
        } else {
            header.style.background = 'linear-gradient(135deg, #1a1a1a 0%, #000000 100%)';
            header.style.backdropFilter = 'none';
        }
    }
});
