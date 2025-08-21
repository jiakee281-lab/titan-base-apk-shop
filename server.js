const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));

// Ensure directories exist
const uploadsDir = path.join(__dirname, 'uploads');
fs.ensureDirSync(uploadsDir);

// Configure multer for APK uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const timestamp = Date.now();
        const originalName = file.originalname.replace(/\s+/g, '_');
        cb(null, `${timestamp}_${originalName}`);
    }
});

const upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        if (file.mimetype === 'application/vnd.android.package-archive' || 
            path.extname(file.originalname).toLowerCase() === '.apk') {
            cb(null, true);
        } else {
            cb(new Error('Only APK files are allowed!'), false);
        }
    },
    limits: {
        fileSize: 500 * 1024 * 1024 // 500MB limit
    }
});

// Simple APK upload route (no authentication)
app.post('/upload', upload.single('apk'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const { name, version, description } = req.body;
        
        // Create simple APK info
        const apkInfo = {
            id: Date.now(),
            name: name || 'Unnamed APK',
            version: version || '1.0.0',
            description: description || 'No description provided',
            filename: req.file.filename,
            originalName: req.file.originalname,
            size: req.file.size,
            uploadDate: new Date().toISOString()
        };

        // Save APK info to files.json
        const filesPath = path.join(uploadsDir, 'files.json');
        let files = [];
        
        if (fs.existsSync(filesPath)) {
            try {
                files = JSON.parse(fs.readFileSync(filesPath, 'utf8'));
            } catch (error) {
                console.error('Error reading files.json:', error);
                files = [];
            }
        }

        files.push(apkInfo);
        fs.writeFileSync(filesPath, JSON.stringify(files, null, 2));

        res.json({
            success: true,
            message: 'APK uploaded successfully!',
            apk: apkInfo
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Upload failed' });
    }
});

// Get all APKs
app.get('/apks', (req, res) => {
    const filesPath = path.join(uploadsDir, 'files.json');
    
    if (fs.existsSync(filesPath)) {
        try {
            const files = JSON.parse(fs.readFileSync(filesPath, 'utf8'));
            res.json(files);
        } catch (error) {
            console.error('Error reading files:', error);
            res.json([]);
        }
    } else {
        res.json([]);
    }
});

// Download APK
app.get('/download/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(uploadsDir, filename);
    
    if (fs.existsSync(filePath)) {
        res.download(filePath);
    } else {
        res.status(404).json({ error: 'File not found' });
    }
});

// Delete APK
app.delete('/apks/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(uploadsDir, filename);
    const filesJsonPath = path.join(uploadsDir, 'files.json');
    
    try {
        if (fs.existsSync(filePath)) {
            fs.removeSync(filePath);
        }
        
        if (fs.existsSync(filesJsonPath)) {
            const files = JSON.parse(fs.readFileSync(filesJsonPath, 'utf8'));
            const updatedFiles = files.filter(file => file.filename !== filename);
            fs.writeFileSync(filesJsonPath, JSON.stringify(updatedFiles, null, 2));
        }
        
        res.json({ success: true, message: 'APK deleted successfully' });
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ error: 'Delete failed' });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        port: PORT,
        uploads: uploadsDir
    });
});

// Simple test route
app.get('/test', (req, res) => {
    res.json({
        message: 'Simple APK Shop is running!',
        status: 'Ready for APK uploads'
    });
});

// Error handling middleware
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File too large. Maximum size is 500MB.' });
        }
    }
    
    if (error.message === 'Only APK files are allowed!') {
        return res.status(400).json({ error: error.message });
    }
    
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Simple APK Shop running on http://localhost:${PORT}`);
    console.log(`📁 Uploads directory: ${uploadsDir}`);
    console.log(`🔌 Port: ${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down gracefully...');
    process.exit(0);
});
