const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
fs.ensureDirSync(uploadsDir);

// Configure multer for APK uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const originalName = file.originalname.replace(/\s+/g, '_');
    cb(null, `${timestamp}_${originalName}`);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    // Only allow APK files
    if (file.mimetype === 'application/vnd.android.package-archive' || 
        path.extname(file.originalname).toLowerCase() === '.apk') {
      cb(null, true);
    } else {
      cb(new Error('Only APK files are allowed!'), false);
    }
  },
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
});

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Upload APK
app.post('/upload', upload.single('apk'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileInfo = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      uploadDate: new Date().toISOString(),
      path: req.file.path
    };

    // Save file info to a JSON file for persistence
    const filesListPath = path.join(uploadsDir, 'files.json');
    let filesList = [];
    
    if (fs.existsSync(filesListPath)) {
      filesList = JSON.parse(fs.readFileSync(filesListPath, 'utf8'));
    }
    
    filesList.push(fileInfo);
    fs.writeFileSync(filesListPath, JSON.stringify(filesList, null, 2));

    res.json({
      success: true,
      message: 'APK uploaded successfully!',
      file: fileInfo
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Get list of uploaded APKs
app.get('/apks', (req, res) => {
  try {
    const filesListPath = path.join(uploadsDir, 'files.json');
    let filesList = [];
    
    if (fs.existsSync(filesListPath)) {
      filesList = JSON.parse(fs.readFileSync(filesListPath, 'utf8'));
    }
    
    res.json(filesList);
  } catch (error) {
    console.error('Error reading files:', error);
    res.status(500).json({ error: 'Failed to read files' });
  }
});

// Download APK
app.get('/download/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(uploadsDir, filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    res.download(filePath);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Download failed' });
  }
});

// Delete APK
app.delete('/apks/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(uploadsDir, filename);
    const filesListPath = path.join(uploadsDir, 'files.json');
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Remove file
    fs.removeSync(filePath);
    
    // Update files list
    let filesList = [];
    if (fs.existsSync(filesListPath)) {
      filesList = JSON.parse(fs.readFileSync(filesListPath, 'utf8'));
      filesList = filesList.filter(file => file.filename !== filename);
      fs.writeFileSync(filesListPath, JSON.stringify(filesList, null, 2));
    }
    
    res.json({ success: true, message: 'APK deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Delete failed' });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 100MB.' });
    }
  }
  
  if (error.message === 'Only APK files are allowed!') {
    return res.status(400).json({ error: error.message });
  }
  
  console.error('Server error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 Titan Base APK Shop running on http://localhost:${PORT}`);
  console.log(`📁 Uploads directory: ${uploadsDir}`);
});
