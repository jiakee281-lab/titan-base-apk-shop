// Titan Base APK Shop - Enhanced JavaScript with Animations
class TitanBaseAPKShop {
    constructor() {
        this.initializeElements();
        this.bindEvents();
        this.loadAPKs();
        this.setupDragAndDrop();
    }

    initializeElements() {
        this.uploadArea = document.getElementById('uploadArea');
        this.fileInput = document.getElementById('fileInput');
        this.uploadBtn = document.getElementById('uploadBtn');
        this.uploadProgress = document.getElementById('uploadProgress');
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
        this.apkList = document.getElementById('apkList');
        this.emptyState = document.getElementById('emptyState');
        this.confirmModal = document.getElementById('confirmModal');
        this.confirmBtn = document.getElementById('confirmBtn');
        this.cancelBtn = document.getElementById('cancelBtn');
        this.confirmMessage = document.getElementById('confirmMessage');
        this.toastContainer = document.getElementById('toastContainer');
        
        // Form elements
        this.apkName = document.getElementById('apkName');
        this.apkVersion = document.getElementById('apkVersion');
        this.apkDescription = document.getElementById('apkDescription');
    }

    bindEvents() {
        // Upload area click
        this.uploadArea.addEventListener('click', () => {
            this.fileInput.click();
        });

        // File selection
        this.fileInput.addEventListener('change', (e) => {
            this.handleFileSelection(e.target.files[0]);
        });

        // Upload button
        this.uploadBtn.addEventListener('click', () => {
            this.uploadAPK();
        });

        // Form input changes
        this.apkName.addEventListener('input', () => this.validateForm());
        this.apkVersion.addEventListener('input', () => this.validateForm());
        this.apkDescription.addEventListener('input', () => this.validateForm());

        // Modal events
        this.confirmBtn.addEventListener('click', () => {
            this.confirmAction();
        });

        this.cancelBtn.addEventListener('click', () => {
            this.hideModal();
        });

        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigateToSection(e.target.getAttribute('href').substring(1));
            });
        });
    }

    setupDragAndDrop() {
        this.uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.uploadArea.classList.add('drag-over');
        });

        this.uploadArea.addEventListener('dragleave', () => {
            this.uploadArea.classList.remove('drag-over');
        });

        this.uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            this.uploadArea.classList.remove('drag-over');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFileSelection(files[0]);
            }
        });
    }

    handleFileSelection(file) {
        if (!file) return;

        if (file.type !== 'application/vnd.android.package-archive' && 
            !file.name.toLowerCase().endsWith('.apk')) {
            this.showToast('Please select a valid APK file', 'error');
            return;
        }

        // Auto-fill name from filename
        const nameWithoutExt = file.name.replace('.apk', '');
        this.apkName.value = nameWithoutExt;
        
        // Enable upload button
        this.uploadBtn.disabled = false;
        
        this.showToast(`APK file selected: ${file.name}`, 'success');
    }

    validateForm() {
        const isValid = this.apkName.value.trim() && 
                       this.apkVersion.value.trim() && 
                       this.fileInput.files.length > 0;
        
        this.uploadBtn.disabled = !isValid;
        return isValid;
    }

    async uploadAPK() {
        if (!this.validateForm()) {
            this.showToast('Please fill in all required fields', 'error');
            return;
        }

        const file = this.fileInput.files[0];
        const formData = new FormData();
        formData.append('apk', file);
        formData.append('name', this.apkName.value.trim());
        formData.append('version', this.apkVersion.value.trim());
        formData.append('description', this.apkDescription.value.trim());

        // Show progress
        this.showUploadProgress();
        this.uploadBtn.disabled = true;

        try {
            const response = await fetch('/upload', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                this.showToast('APK uploaded successfully!', 'success');
                this.resetForm();
                this.loadAPKs();
                this.simulateProgress(100);
            } else {
                this.showToast(data.error || 'Upload failed', 'error');
            }
        } catch (error) {
            console.error('Upload error:', error);
            this.showToast('Upload failed. Please try again.', 'error');
        } finally {
            setTimeout(() => {
                this.hideUploadProgress();
                this.uploadBtn.disabled = false;
            }, 1000);
        }
    }

    showUploadProgress() {
        this.uploadProgress.classList.remove('hidden');
        this.simulateProgress(0);
    }

    hideUploadProgress() {
        this.uploadProgress.classList.add('hidden');
    }

    simulateProgress(targetPercent) {
        let currentPercent = 0;
        const interval = setInterval(() => {
            currentPercent += Math.random() * 15;
            if (currentPercent >= targetPercent) {
                currentPercent = targetPercent;
                clearInterval(interval);
            }
            this.progressFill.style.width = `${currentPercent}%`;
            this.progressText.textContent = `Uploading your APK... ${Math.round(currentPercent)}%`;
        }, 200);
    }

    resetForm() {
        this.fileInput.value = '';
        this.apkName.value = '';
        this.apkVersion.value = '';
        this.apkDescription.value = '';
        this.uploadBtn.disabled = true;
    }

    async loadAPKs() {
        try {
            const response = await fetch('/apks');
            const apks = await response.json();
            this.displayAPKs(apks);
        } catch (error) {
            console.error('Error loading APKs:', error);
            this.showToast('Error loading APKs', 'error');
        }
    }

    displayAPKs(apks) {
        if (apks.length === 0) {
            this.apkList.innerHTML = '';
            this.emptyState.style.display = 'block';
            return;
        }

        this.emptyState.style.display = 'none';
        this.apkList.innerHTML = apks.map(apk => this.createAPKCard(apk)).join('');
    }

    createAPKCard(apk) {
        return `
            <div class="apk-card">
                <div class="card-header">
                    <div class="apk-info">
                        <h3>${apk.name}</h3>
                        <span class="version">${apk.version}</span>
                    </div>
                    <div class="card-actions">
                        <a href="/download/${apk.filename}" class="btn btn-success">
                            <i class="fas fa-download"></i> Download
                        </a>
                        <button class="btn btn-danger" onclick="app.deleteAPK('${apk.filename}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    <div class="description">${apk.description || 'No description provided'}</div>
                    <div class="apk-details">
                        <span class="size">${this.formatFileSize(apk.size)}</span>
                        <span class="date">${this.formatDate(apk.uploadDate)}</span>
                    </div>
                </div>
            </div>
        `;
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    }

    async deleteAPK(filename) {
        this.showConfirmModal(
            'Delete APK',
            'Are you sure you want to delete this APK? This action cannot be undone.',
            () => this.performDelete(filename)
        );
    }

    async performDelete(filename) {
        try {
            const response = await fetch(`/apks/${filename}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (data.success) {
                this.showToast('APK deleted successfully!', 'success');
                this.loadAPKs();
            } else {
                this.showToast(data.error || 'Delete failed', 'error');
            }
        } catch (error) {
            console.error('Delete error:', error);
            this.showToast('Delete failed. Please try again.', 'error');
        }

        this.hideModal();
    }

    showConfirmModal(title, message, onConfirm) {
        this.confirmMessage.textContent = message;
        this.confirmModal.classList.remove('hidden');
        this.currentAction = onConfirm;
    }

    hideModal() {
        this.confirmModal.classList.add('hidden');
        this.currentAction = null;
    }

    confirmAction() {
        if (this.currentAction) {
            this.currentAction();
        }
    }

    navigateToSection(sectionId) {
        // Remove active class from all nav links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });

        // Add active class to clicked link
        document.querySelector(`[href="#${sectionId}"]`).classList.add('active');

        // Scroll to section
        const section = document.getElementById(sectionId);
        if (section) {
            section.scrollIntoView({ behavior: 'smooth' });
        }
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        toast.innerHTML = `
            <div class="toast-header">
                <h4>${type.charAt(0).toUpperCase() + type.slice(1)}</h4>
                <button class="close-btn" onclick="this.parentElement.parentElement.remove()">&times;</button>
            </div>
            <p>${message}</p>
        `;

        this.toastContainer.appendChild(toast);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 5000);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new TitanBaseAPKShop();
    
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
    
    if (scrolled > 100) {
        header.style.background = 'rgba(26, 26, 26, 0.95)';
        header.style.backdropFilter = 'blur(10px)';
    } else {
        header.style.background = 'linear-gradient(135deg, #1a1a1a 0%, #000000 100%)';
        header.style.backdropFilter = 'none';
    }
});
