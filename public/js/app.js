// Titan Base APK Shop - Enhanced JavaScript with Animations
class TitanBaseAPKShop {
    constructor() {
        this.currentFile = null;
        this.apks = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadAPKs();
        this.setupSmoothScrolling();
        this.setupIntersectionObserver();
        this.setupParallaxEffects();
    }

    setupEventListeners() {
        // File input and upload area
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        const uploadBtn = document.getElementById('uploadBtn');

        uploadArea.addEventListener('click', () => fileInput.click());
        uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
        uploadArea.addEventListener('dragleave', this.handleDragLeave.bind(this));
        uploadArea.addEventListener('drop', this.handleDrop.bind(this));
        fileInput.addEventListener('change', this.handleFileSelect.bind(this));
        uploadBtn.addEventListener('click', this.uploadAPK.bind(this));

        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', this.handleNavigation.bind(this));
        });

        // Form validation
        ['apkName', 'apkVersion', 'apkDescription'].forEach(id => {
            const element = document.getElementById(id);
            element.addEventListener('input', this.validateForm.bind(this));
        });
    }

    setupSmoothScrolling() {
        // Smooth scroll to sections
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
        // Animate elements when they come into view
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

        // Observe all sections and cards
        document.querySelectorAll('.section, .apk-card, .about-card').forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(el);
        });
    }

    setupParallaxEffects() {
        // Subtle parallax effect on scroll
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
        
        // Animate the upload area
        const uploadArea = document.getElementById('uploadArea');
        uploadArea.style.transform = 'scale(1.05)';
        setTimeout(() => {
            uploadArea.style.transform = 'scale(1)';
        }, 200);
    }

    validateForm() {
        const name = document.getElementById('apkName').value.trim();
        const version = document.getElementById('apkVersion').value.trim();
        const description = document.getElementById('apkDescription').value.trim();
        const uploadBtn = document.getElementById('uploadBtn');

        if (name && version && description && this.currentFile) {
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
            
            // Simulate progress for better UX
            let progress = 0;
            const progressInterval = setInterval(() => {
                progress += Math.random() * 15;
                if (progress > 90) progress = 90;
                progressFill.style.width = `${progress}%`;
            }, 200);

            const response = await fetch('/upload', {
                method: 'POST',
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
        document.getElementById('apkName').value = '';
        document.getElementById('apkVersion').value = '';
        document.getElementById('apkDescription').value = '';
        document.getElementById('fileInput').value = '';
        this.currentFile = null;
        this.validateForm();
    }

    async loadAPKs() {
        try {
            const response = await fetch('/apks');
            if (response.ok) {
                this.apks = await response.json();
                this.renderAPKs();
            }
        } catch (error) {
            console.error('Error loading APKs:', error);
        }
    }

    renderAPKs() {
        const apkList = document.getElementById('apkList');
        const emptyState = document.getElementById('emptyState');

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
        const size = this.formatFileSize(apk.size);
        const date = new Date(apk.uploadDate).toLocaleDateString();
        
        // Handle cases where metadata might be missing (for backward compatibility)
        const apkName = apk.name || apk.originalName || 'Unnamed APK';
        const apkVersion = apk.version || 'Unknown Version';
        const apkDescription = apk.description || 'No description available';
        
        return `
            <div class="apk-card" data-id="${apk.id || apk.filename}">
                <div class="card-header">
                    <div class="apk-info">
                        <h3>${this.escapeHtml(apkName)}</h3>
                        <span class="version">v${this.escapeHtml(apkVersion)}</span>
                    </div>
                    <div class="card-actions">
                        <button class="btn btn-success" onclick="app.downloadAPK('${apk.id || apk.filename}')">
                            <i class="fas fa-download"></i> Download
                        </button>
                        <button class="btn btn-danger" onclick="app.deleteAPK('${apk.id || apk.filename}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    <p class="description">${this.escapeHtml(apkDescription)}</p>
                    <div class="apk-details">
                        <span class="size">${size}</span>
                        <span class="date">${date}</span>
                    </div>
                </div>
            </div>
        `;
    }

    async downloadAPK(id) {
        try {
            const response = await fetch(`/download/${id}`);
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
            } else {
                throw new Error('Download failed');
            }
        } catch (error) {
            this.showToast('Download failed. Please try again.', 'error');
            console.error('Download error:', error);
        }
    }

    async deleteAPK(id) {
        this.showConfirmModal(
            'Are you sure you want to delete this APK? This action cannot be undone.',
            async () => {
                try {
                    const response = await fetch(`/apks/${id}`, { method: 'DELETE' });
                    if (response.ok) {
                        this.showToast('APK deleted successfully!', 'success');
                        this.loadAPKs();
                    } else {
                        throw new Error('Delete failed');
                    }
                } catch (error) {
                    this.showToast('Delete failed. Please try again.', 'error');
                    console.error('Delete error:', error);
                }
            }
        );
    }

    showConfirmModal(message, onConfirm) {
        const modal = document.getElementById('confirmModal');
        const confirmMessage = document.getElementById('confirmMessage');
        const confirmBtn = document.getElementById('confirmBtn');
        const cancelBtn = document.getElementById('cancelBtn');

        confirmMessage.textContent = message;
        modal.classList.remove('hidden');

        const handleConfirm = () => {
            modal.classList.add('hidden');
            onConfirm();
            confirmBtn.removeEventListener('click', handleConfirm);
            cancelBtn.removeEventListener('click', handleCancel);
        };

        const handleCancel = () => {
            modal.classList.add('hidden');
            confirmBtn.removeEventListener('click', handleConfirm);
            cancelBtn.removeEventListener('click', handleCancel);
        };

        confirmBtn.addEventListener('click', handleConfirm);
        cancelBtn.addEventListener('click', handleCancel);
    }

    showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toastContainer');
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

        // Auto-remove after 5 seconds
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
        
        // Remove active class from all links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        // Add active class to clicked link
        e.target.classList.add('active');
        
        // Smooth scroll to section
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
document.addEventListener('DOMContentLoaded', function() {
    const uploadForm = document.getElementById('uploadForm');
    const uploadStatus = document.getElementById('uploadStatus');
    const apkList = document.getElementById('apkList');

    // Load APKs on page load
    loadAPKs();

    // Handle form submission
    uploadForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(uploadForm);
        const apkFile = document.getElementById('apkFile').files[0];
        
        if (!apkFile) {
            showStatus('Please select an APK file', 'error');
            return;
        }

        // Show uploading status
        showStatus('Uploading APK...', 'info');
        
        // Upload the file
        fetch('/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showStatus('APK uploaded successfully!', 'success');
                uploadForm.reset();
                loadAPKs(); // Refresh the list
            } else {
                showStatus(data.error || 'Upload failed', 'error');
            }
        })
        .catch(error => {
            console.error('Upload error:', error);
            showStatus('Upload failed. Please try again.', 'error');
        });
    });

    // Function to show status messages
    function showStatus(message, type) {
        uploadStatus.textContent = message;
        uploadStatus.className = `status-message ${type}`;
        
        // Auto-hide success messages after 5 seconds
        if (type === 'success') {
            setTimeout(() => {
                uploadStatus.textContent = '';
                uploadStatus.className = 'status-message';
            }, 5000);
        }
    }

    // Function to load APKs
    function loadAPKs() {
        apkList.innerHTML = '<div class="loading">Loading APKs...</div>';
        
        fetch('/apks')
            .then(response => response.json())
            .then(apks => {
                if (apks.length === 0) {
                    apkList.innerHTML = `
                        <div class="empty-state">
                            <h3>No APKs uploaded yet</h3>
                            <p>Upload your first APK to get started!</p>
                        </div>
                    `;
                } else {
                    displayAPKs(apks);
                }
            })
            .catch(error => {
                console.error('Error loading APKs:', error);
                apkList.innerHTML = `
                    <div class="empty-state">
                        <h3>Error loading APKs</h3>
                        <p>Please refresh the page to try again.</p>
                    </div>
                `;
            });
    }

    // Function to display APKs
    function displayAPKs(apks) {
        apkList.innerHTML = apks.map(apk => `
            <div class="apk-card">
                <h3>${apk.name}</h3>
                <div class="apk-info">
                    <span><strong>Version:</strong> ${apk.version}</span>
                    <span><strong>Description:</strong> ${apk.description || 'No description'}</span>
                    <span><strong>Size:</strong> ${formatFileSize(apk.size)}</span>
                    <span><strong>Uploaded:</strong> ${formatDate(apk.uploadDate)}</span>
                </div>
                <div class="apk-actions">
                    <a href="/download/${apk.filename}" class="btn btn-download">📥 Download</a>
                    <button class="btn btn-delete" onclick="deleteAPK('${apk.filename}')">🗑️ Delete</button>
                </div>
            </div>
        `).join('');
    }

    // Function to format file size
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Function to format date
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    }

    // Function to delete APK (make it global)
    window.deleteAPK = function(filename) {
        if (confirm('Are you sure you want to delete this APK?')) {
            fetch(`/apks/${filename}`, {
                method: 'DELETE'
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showStatus('APK deleted successfully!', 'success');
                    loadAPKs(); // Refresh the list
                } else {
                    showStatus(data.error || 'Delete failed', 'error');
                }
            })
            .catch(error => {
                console.error('Delete error:', error);
                showStatus('Delete failed. Please try again.', 'error');
            });
        }
    };
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
