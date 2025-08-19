// Titan Base APK Shop - Main Application
class TitanBaseApp {
    constructor() {
        this.currentFile = null;
        this.apks = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupNavigation();
        this.loadAPKs();
        this.setupDragAndDrop();
    }

    setupEventListeners() {
        // File input change
        const fileInput = document.getElementById('fileInput');
        const uploadArea = document.getElementById('uploadArea');
        const uploadBtn = document.getElementById('uploadBtn');

        fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        uploadArea.addEventListener('click', () => fileInput.click());
        uploadBtn.addEventListener('click', () => this.uploadAPK());

        // Form inputs
        const apkName = document.getElementById('apkName');
        const apkVersion = document.getElementById('apkVersion');
        const apkDescription = document.getElementById('apkDescription');

        [apkName, apkVersion, apkDescription].forEach(input => {
            input.addEventListener('input', () => this.validateForm());
        });
    }

    setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        const sections = document.querySelectorAll('.section');

        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                
                // Update active nav link
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');

                // Show target section
                sections.forEach(section => {
                    section.style.display = 'none';
                });
                document.getElementById(targetId).style.display = 'block';
            });
        });
    }

    setupDragAndDrop() {
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            uploadArea.addEventListener(eventName, () => {
                uploadArea.classList.add('drag-over');
            });
        });

        ['dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, () => {
                uploadArea.classList.remove('drag-over');
            });
        });

        uploadArea.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                fileInput.files = files;
                this.handleFileSelect({ target: fileInput });
            }
        });
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.name.toLowerCase().endsWith('.apk')) {
            this.showToast('Please select an APK file', 'error');
            return;
        }

        // Validate file size (100MB limit)
        if (file.size > 100 * 1024 * 1024) {
            this.showToast('File size must be less than 100MB', 'error');
            return;
        }

        this.currentFile = file;
        this.validateForm();
        
        // Update upload area
        const uploadArea = document.getElementById('uploadArea');
        uploadArea.innerHTML = `
            <div class="upload-icon">
                <i class="fas fa-check-circle" style="color: #10b981;"></i>
            </div>
            <h3>${file.name}</h3>
            <p>Size: ${this.formatFileSize(file.size)}</p>
        `;
    }

    validateForm() {
        const apkName = document.getElementById('apkName').value.trim();
        const apkVersion = document.getElementById('apkVersion').value.trim();
        const uploadBtn = document.getElementById('uploadBtn');

        const isValid = apkName && apkVersion && this.currentFile;
        uploadBtn.disabled = !isValid;
    }

    async uploadAPK() {
        if (!this.currentFile) return;

        const formData = new FormData();
        formData.append('apk', this.currentFile);

        // Add metadata
        const apkName = document.getElementById('apkName').value.trim();
        const apkVersion = document.getElementById('apkVersion').value.trim();
        const apkDescription = document.getElementById('apkDescription').value.trim();

        // Show progress
        this.showUploadProgress();

        try {
            const response = await fetch('/upload', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                this.showToast('APK uploaded successfully!', 'success');
                this.resetUploadForm();
                this.loadAPKs(); // Refresh the library
            } else {
                this.showToast(result.error || 'Upload failed', 'error');
            }
        } catch (error) {
            console.error('Upload error:', error);
            this.showToast('Upload failed. Please try again.', 'error');
        } finally {
            this.hideUploadProgress();
        }
    }

    showUploadProgress() {
        const progress = document.getElementById('uploadProgress');
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');

        progress.classList.remove('hidden');
        
        // Simulate progress
        let width = 0;
        const interval = setInterval(() => {
            if (width >= 90) {
                clearInterval(interval);
                return;
            }
            width += Math.random() * 10;
            progressFill.style.width = width + '%';
        }, 200);

        this.progressInterval = interval;
    }

    hideUploadProgress() {
        const progress = document.getElementById('uploadProgress');
        const progressFill = document.getElementById('progressFill');
        
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
        }
        
        progressFill.style.width = '100%';
        setTimeout(() => {
            progress.classList.add('hidden');
            progressFill.style.width = '0%';
        }, 500);
    }

    resetUploadForm() {
        this.currentFile = null;
        document.getElementById('fileInput').value = '';
        document.getElementById('apkName').value = '';
        document.getElementById('apkVersion').value = '';
        document.getElementById('apkDescription').value = '';
        
        const uploadArea = document.getElementById('uploadArea');
        uploadArea.innerHTML = `
            <div class="upload-icon">
                <i class="fas fa-mobile-alt"></i>
            </div>
            <h3>Drop your APK here</h3>
            <p>or click to browse</p>
        `;
        
        this.validateForm();
    }

    async loadAPKs() {
        try {
            const response = await fetch('/apks');
            this.apks = await response.json();
            this.renderAPKList();
        } catch (error) {
            console.error('Error loading APKs:', error);
            this.showToast('Failed to load APKs', 'error');
        }
    }

    renderAPKList() {
        const apkList = document.getElementById('apkList');
        const emptyState = document.getElementById('emptyState');

        if (this.apks.length === 0) {
            apkList.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        apkList.style.display = 'grid';
        emptyState.style.display = 'none';

        apkList.innerHTML = this.apks.map(apk => this.createAPKCard(apk)).join('');
    }

    createAPKCard(apk) {
        const uploadDate = new Date(apk.uploadDate).toLocaleDateString();
        const fileSize = this.formatFileSize(apk.size);
        
        return `
            <div class="apk-card" data-filename="${apk.filename}">
                <div class="card-header">
                    <div class="apk-info">
                        <h3>${apk.originalName}</h3>
                        <span class="version">v1.0</span>
                    </div>
                    <div class="card-actions">
                        <button class="btn btn-success" onclick="app.downloadAPK('${apk.filename}')">
                            <i class="fas fa-download"></i>
                        </button>
                        <button class="btn btn-danger" onclick="app.deleteAPK('${apk.filename}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    <div class="description">
                        Personal APK build - ${apk.originalName}
                    </div>
                    <div class="apk-details">
                        <span class="size">${fileSize}</span>
                        <span class="date">${uploadDate}</span>
                    </div>
                </div>
            </div>
        `;
    }

    async downloadAPK(filename) {
        try {
            window.open(`/download/${filename}`, '_blank');
            this.showToast('Download started', 'success');
        } catch (error) {
            console.error('Download error:', error);
            this.showToast('Download failed', 'error');
        }
    }

    async deleteAPK(filename) {
        const confirmed = await this.showConfirmModal(
            'Are you sure you want to delete this APK?',
            'This action cannot be undone.'
        );

        if (!confirmed) return;

        try {
            const response = await fetch(`/apks/${filename}`, {
                method: 'DELETE'
            });

            const result = await response.json();

            if (result.success) {
                this.showToast('APK deleted successfully', 'success');
                this.loadAPKs(); // Refresh the list
            } else {
                this.showToast(result.error || 'Delete failed', 'error');
            }
        } catch (error) {
            console.error('Delete error:', error);
            this.showToast('Delete failed. Please try again.', 'error');
        }
    }

    async showConfirmModal(title, message) {
        return new Promise((resolve) => {
            const modal = document.getElementById('confirmModal');
            const confirmMessage = document.getElementById('confirmMessage');
            const confirmBtn = document.getElementById('confirmBtn');
            const cancelBtn = document.getElementById('cancelBtn');

            confirmMessage.innerHTML = `<strong>${title}</strong><br>${message}`;

            modal.classList.remove('hidden');

            const handleConfirm = () => {
                modal.classList.add('hidden');
                cleanup();
                resolve(true);
            };

            const handleCancel = () => {
                modal.classList.add('hidden');
                cleanup();
                resolve(false);
            };

            const cleanup = () => {
                confirmBtn.removeEventListener('click', handleConfirm);
                cancelBtn.removeEventListener('click', handleCancel);
            };

            confirmBtn.addEventListener('click', handleConfirm);
            cancelBtn.addEventListener('click', handleCancel);
        });
    }

    showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const icon = this.getToastIcon(type);
        
        toast.innerHTML = `
            <div class="toast-header">
                <h4>${icon} ${this.getToastTitle(type)}</h4>
                <button class="close-btn" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <p>${message}</p>
        `;

        toastContainer.appendChild(toast);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 5000);
    }

    getToastIcon(type) {
        const icons = {
            success: '<i class="fas fa-check-circle" style="color: #10b981;"></i>',
            error: '<i class="fas fa-exclamation-circle" style="color: #ef4444;"></i>',
            warning: '<i class="fas fa-exclamation-triangle" style="color: #f59e0b;"></i>',
            info: '<i class="fas fa-info-circle" style="color: #6366f1;"></i>'
        };
        return icons[type] || icons.info;
    }

    getToastTitle(type) {
        const titles = {
            success: 'Success',
            error: 'Error',
            warning: 'Warning',
            info: 'Info'
        };
        return titles[type] || 'Info';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new TitanBaseApp();
});

// Handle navigation hash changes
window.addEventListener('hashchange', () => {
    const hash = window.location.hash || '#upload';
    const targetSection = document.querySelector(hash);
    const navLink = document.querySelector(`[href="${hash}"]`);
    
    if (targetSection && navLink) {
        // Hide all sections
        document.querySelectorAll('.section').forEach(section => {
            section.style.display = 'none';
        });
        
        // Show target section
        targetSection.style.display = 'block';
        
        // Update active nav
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        navLink.classList.add('active');
    }
});

// Initialize with current hash or default to upload
window.addEventListener('load', () => {
    const hash = window.location.hash || '#upload';
    window.location.hash = hash;
});
