document.addEventListener('DOMContentLoaded', function() {
    console.log('Titan Base APK Shop loaded!');
    
    // Initialize elements
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const uploadBtn = document.getElementById('uploadBtn');
    const uploadProgress = document.getElementById('uploadProgress');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const apkList = document.getElementById('apkList');
    const emptyState = document.getElementById('emptyState');
    const confirmModal = document.getElementById('confirmModal');
    const confirmBtn = document.getElementById('confirmBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const confirmMessage = document.getElementById('confirmMessage');
    const toastContainer = document.getElementById('toastContainer');
    
    // Form elements
    const apkName = document.getElementById('apkName');
    const apkVersion = document.getElementById('apkVersion');
    const apkDescription = document.getElementById('apkDescription');
    
    // Load APKs on page load
    loadAPKs();
    
    // Upload area click
    uploadArea.addEventListener('click', function() {
        fileInput.click();
    });
    
    // File selection
    fileInput.addEventListener('change', function(e) {
        if (e.target.files.length > 0) {
            handleFileSelection(e.target.files[0]);
        }
    });
    
    // Also handle when user manually types in form fields
    apkName.addEventListener('input', function() {
        validateForm();
    });
    
    apkVersion.addEventListener('input', function() {
        validateForm();
    });
    
    apkDescription.addEventListener('input', function() {
        // Description is optional, so we don't need to validate for it
    });
    
    // Upload button
    uploadBtn.addEventListener('click', function() {
        uploadAPK();
    });
    
    // Modal events
    confirmBtn.addEventListener('click', function() {
        if (window.currentAction) {
            window.currentAction();
        }
        hideModal();
    });
    
    cancelBtn.addEventListener('click', hideModal);
    
    // Navigation
    document.querySelectorAll('.nav-link').forEach(function(link) {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            navigateToSection(e.target.getAttribute('href').substring(1));
        });
    });
    
    // Drag and drop
    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        uploadArea.classList.add('drag-over');
    });
    
    uploadArea.addEventListener('dragleave', function() {
        uploadArea.classList.remove('drag-over');
    });
    
    uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileSelection(files[0]);
        }
    });
    
    function handleFileSelection(file) {
        if (!file) return;
        
        if (file.type !== 'application/vnd.android.package-archive' && 
            !file.name.toLowerCase().endsWith('.apk')) {
            showToast('Please select a valid APK file', 'error');
            return;
        }
        
        // Auto-fill name from filename
        const nameWithoutExt = file.name.replace('.apk', '');
        apkName.value = nameWithoutExt;
        
        // Show file status
        const fileStatus = document.getElementById('fileStatus');
        if (fileStatus) {
            fileStatus.style.display = 'flex';
        }
        
        // Enable upload button if form is valid
        validateForm();
        
        showToast('APK file selected: ' + file.name, 'success');
    }
    
    function validateForm() {
        const hasFile = fileInput.files.length > 0;
        const hasName = apkName.value.trim() !== '';
        const hasVersion = apkVersion.value.trim() !== '';
        
        const isValid = hasFile && hasName && hasVersion;
        
        // Update button state
        uploadBtn.disabled = !isValid;
        
        // Add visual feedback
        if (hasFile) {
            uploadArea.classList.add('has-file');
        } else {
            uploadArea.classList.remove('has-file');
        }
        
        return isValid;
    }
    
    function uploadAPK() {
        if (!validateForm()) {
            showToast('Please fill in all required fields', 'error');
            return;
        }
        
        const file = fileInput.files[0];
        const formData = new FormData();
        formData.append('apk', file);
        formData.append('name', apkName.value.trim());
        formData.append('version', apkVersion.value.trim());
        formData.append('description', apkDescription.value.trim());
        
        // Show progress
        showUploadProgress();
        uploadBtn.disabled = true;
        
        fetch('/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showToast('APK uploaded successfully!', 'success');
                resetForm();
                loadAPKs();
                simulateProgress(100);
            } else {
                showToast(data.error || 'Upload failed', 'error');
            }
        })
        .catch(error => {
            console.error('Upload error:', error);
            showToast('Upload failed. Please try again.', 'error');
        })
        .finally(function() {
            setTimeout(function() {
                hideUploadProgress();
                uploadBtn.disabled = false;
            }, 1000);
        });
    }
    
    function showUploadProgress() {
        uploadProgress.classList.remove('hidden');
        simulateProgress(0);
    }
    
    function hideUploadProgress() {
        uploadProgress.classList.add('hidden');
    }
    
    function simulateProgress(targetPercent) {
        let currentPercent = 0;
        const interval = setInterval(function() {
            currentPercent += Math.random() * 15;
            if (currentPercent >= targetPercent) {
                currentPercent = targetPercent;
                clearInterval(interval);
            }
            progressFill.style.width = currentPercent + '%';
            progressText.textContent = 'Uploading your APK... ' + Math.round(currentPercent) + '%';
        }, 200);
    }
    
    function resetForm() {
        fileInput.value = '';
        apkName.value = '';
        apkVersion.value = '';
        apkDescription.value = '';
        uploadBtn.disabled = true;
        
        // Hide file status
        const fileStatus = document.getElementById('fileStatus');
        if (fileStatus) {
            fileStatus.style.display = 'none';
        }
        
        // Remove has-file class
        uploadArea.classList.remove('has-file');
    }
    
    function loadAPKs() {
        fetch('/apks')
            .then(response => response.json())
            .then(apks => {
                displayAPKs(apks);
            })
            .catch(error => {
                console.error('Error loading APKs:', error);
                showToast('Error loading APKs', 'error');
            });
    }
    
    function displayAPKs(apks) {
        if (apks.length === 0) {
            apkList.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }
        
        emptyState.style.display = 'none';
        apkList.innerHTML = apks.map(function(apk) {
            return createAPKCard(apk);
        }).join('');
    }
    
    function createAPKCard(apk) {
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
                        <button class="btn btn-danger" onclick="deleteAPK('${apk.filename}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    <div class="description">${apk.description || 'No description provided'}</div>
                    <div class="apk-details">
                        <span class="size">${formatFileSize(apk.size)}</span>
                        <span class="date">${formatDate(apk.uploadDate)}</span>
                    </div>
                </div>
            </div>
        `;
    }
    
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    }
    
    function deleteAPK(filename) {
        showConfirmModal(
            'Delete APK',
            'Are you sure you want to delete this APK? This action cannot be undone.',
            function() {
                performDelete(filename);
            }
        );
    }
    
    function performDelete(filename) {
        fetch('/apks/' + filename, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showToast('APK deleted successfully!', 'success');
                loadAPKs();
            } else {
                showToast(data.error || 'Delete failed', 'error');
            }
        })
        .catch(error => {
            console.error('Delete error:', error);
            showToast('Delete failed. Please try again.', 'error');
        });
    }
    
    function showConfirmModal(title, message, onConfirm) {
        confirmMessage.textContent = message;
        confirmModal.classList.remove('hidden');
        window.currentAction = onConfirm;
    }
    
    function hideModal() {
        confirmModal.classList.add('hidden');
        window.currentAction = null;
    }
    
    function navigateToSection(sectionId) {
        // Remove active class from all nav links
        document.querySelectorAll('.nav-link').forEach(function(link) {
            link.classList.remove('active');
        });
        
        // Add active class to clicked link
        const activeLink = document.querySelector('[href="#' + sectionId + '"]');
        if (activeLink) {
            activeLink.classList.add('active');
        }
        
        // Scroll to section
        const section = document.getElementById(sectionId);
        if (section) {
            section.scrollIntoView({ behavior: 'smooth' });
        }
    }
    
    function showToast(message, type) {
        const toast = document.createElement('div');
        toast.className = 'toast toast-' + type;
        
        toast.innerHTML = `
            <div class="toast-header">
                <h4>${type.charAt(0).toUpperCase() + type.slice(1)}</h4>
                <button class="close-btn" onclick="this.parentElement.parentElement.remove()">&times;</button>
            </div>
            <p>${message}</p>
        `;
        
        toastContainer.appendChild(toast);
        
        // Auto-remove after 5 seconds
        setTimeout(function() {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 5000);
    }
    
    // Make deleteAPK global
    window.deleteAPK = deleteAPK;
});
