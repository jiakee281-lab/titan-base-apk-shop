const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// Middleware
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Database connection
const dbPath = path.join(__dirname, 'data', 'titan-base.db');
const db = new sqlite3.Database(dbPath);

// Ensure directories exist
const uploadsDir = path.join(__dirname, 'uploads');
const dataDir = path.join(__dirname, 'data');
fs.ensureDirSync(uploadsDir);
fs.ensureDirSync(dataDir);

// Authentication middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
}

// Admin middleware
function requireAdmin(req, res, next) {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
}

// API key authentication
function authenticateAPIKey(req, res, next) {
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
        return res.status(401).json({ error: 'API key required' });
    }

    db.get('SELECT * FROM users WHERE api_key = ? AND is_active = 1', [apiKey], (err, user) => {
        if (err || !user) {
            return res.status(403).json({ error: 'Invalid API key' });
        }
        req.user = user;
        next();
    });
}

// Log API access
function logAPIAccess(req, res, next) {
    const startTime = Date.now();
    
    res.on('finish', () => {
        const responseTime = Date.now() - startTime;
        const logData = {
            user_id: req.user ? req.user.id : null,
            endpoint: req.originalUrl,
            method: req.method,
            ip_address: req.ip,
            user_agent: req.get('User-Agent'),
            request_body: req.method !== 'GET' ? JSON.stringify(req.body) : null,
            response_status: res.statusCode,
            response_time_ms: responseTime
        };

        db.run(`
            INSERT INTO api_access_logs 
            (user_id, endpoint, method, ip_address, user_agent, request_body, response_status, response_time_ms)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, Object.values(logData));
    });

    next();
}

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

// Routes

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        features: ['authentication', 'versioning', 'analytics', 'api-access', 'bulk-operations']
    });
});

// Authentication routes
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const apiKey = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

        db.run(`
            INSERT INTO users (username, email, password_hash, api_key)
            VALUES (?, ?, ?, ?)
        `, [username, email, hashedPassword, apiKey], function(err) {
            if (err) {
                if (err.code === 'SQLITE_CONSTRAINT') {
                    return res.status(400).json({ error: 'Username or email already exists' });
                }
                return res.status(500).json({ error: 'Registration failed' });
            }

            const token = jwt.sign({ id: this.lastID, username, role: 'user' }, JWT_SECRET);
            res.json({
                success: true,
                message: 'User registered successfully',
                token,
                apiKey
            });
        });
    } catch (error) {
        res.status(500).json({ error: 'Registration failed' });
    }
});

app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }

    db.get('SELECT * FROM users WHERE username = ? AND is_active = 1', [username], async (err, user) => {
        if (err || !user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Update last login
        db.run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);

        const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET);
        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                apiKey: user.api_key
            }
        });
    });
});

// APK Management routes
app.post('/api/apks/upload', authenticateToken, upload.single('apk'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const { name, version, description } = req.body;
        
        if (!name || !version || !description) {
            return res.status(400).json({ error: 'APK name, version, and description are required' });
        }

        // Calculate file hash
        const fileBuffer = fs.readFileSync(req.file.path);
        const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

        // Check if version already exists
        db.get('SELECT id FROM apks WHERE name = ? AND version = ? AND user_id = ?', 
            [name, version, req.user.id], (err, existing) => {
                if (err) {
                    return res.status(500).json({ error: 'Database error' });
                }
                if (existing) {
                    return res.status(400).json({ error: 'Version already exists for this APK' });
                }

                // Get previous version for rollback capability
                db.get('SELECT id FROM apks WHERE name = ? AND user_id = ? ORDER BY upload_date DESC LIMIT 1', 
                    [name, req.user.id], (err, previousVersion) => {
                        if (err) {
                            return res.status(500).json({ error: 'Database error' });
                        }

                        const apkData = {
                            user_id: req.user.id,
                            name: name.trim(),
                            version: version.trim(),
                            description: description.trim(),
                            filename: req.file.filename,
                            original_name: req.file.originalname,
                            file_size: req.file.size,
                            file_hash: fileHash,
                            previous_version_id: previousVersion ? previousVersion.id : null
                        };

                        db.run(`
                            INSERT INTO apks 
                            (user_id, name, version, description, filename, original_name, file_size, file_hash, previous_version_id)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                        `, Object.values(apkData), function(err) {
                            if (err) {
                                return res.status(500).json({ error: 'Upload failed' });
                            }

                            res.json({
                                success: true,
                                message: 'APK uploaded successfully!',
                                apkId: this.lastID,
                                fileHash
                            });
                        });
                    });
            });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Upload failed' });
    }
});

// Get APKs with versioning
app.get('/api/apks', authenticateToken, (req, res) => {
    const { name, version, limit = 50, offset = 0 } = req.query;
    
    let query = `
        SELECT a.*, u.username as uploader_name,
               (SELECT COUNT(*) FROM download_analytics WHERE apk_id = a.id) as download_count
        FROM apks a
        JOIN users u ON a.user_id = u.id
        WHERE a.is_active = 1
    `;
    const params = [];

    if (name) {
        query += ' AND a.name LIKE ?';
        params.push(`%${name}%`);
    }
    if (version) {
        query += ' AND a.version LIKE ?';
        params.push(`%${version}%`);
    }

    query += ' ORDER BY a.upload_date DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    db.all(query, params, (err, apks) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to fetch APKs' });
        }
        res.json(apks);
    });
});

// Get APK versions for rollback
app.get('/api/apks/:id/versions', authenticateToken, (req, res) => {
    const apkId = req.params.id;
    
    db.get('SELECT name, user_id FROM apks WHERE id = ?', [apkId], (err, apk) => {
        if (err || !apk) {
            return res.status(404).json({ error: 'APK not found' });
        }

        if (apk.user_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied' });
        }

        db.all(`
            SELECT id, version, description, upload_date, is_active, is_rollback
            FROM apks 
            WHERE name = ? AND user_id = ?
            ORDER BY upload_date DESC
        `, [apk.name, apk.user_id], (err, versions) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to fetch versions' });
            }
            res.json(versions);
        });
    });
});

// Rollback to previous version
app.post('/api/apks/:id/rollback', authenticateToken, (req, res) => {
    const apkId = req.params.id;
    
    db.get('SELECT * FROM apks WHERE id = ?', [apkId], (err, currentApk) => {
        if (err || !currentApk) {
            return res.status(404).json({ error: 'APK not found' });
        }

        if (currentApk.user_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied' });
        }

        if (!currentApk.previous_version_id) {
            return res.status(400).json({ error: 'No previous version available for rollback' });
        }

        // Mark current version as rollback
        db.run('UPDATE apks SET is_rollback = 1 WHERE id = ?', [apkId], (err) => {
            if (err) {
                return res.status(500).json({ error: 'Rollback failed' });
            }

            // Activate previous version
            db.run('UPDATE apks SET is_active = 1 WHERE id = ?', [currentApk.previous_version_id], (err) => {
                if (err) {
                    return res.status(500).json({ error: 'Rollback failed' });
                }

                res.json({
                    success: true,
                    message: 'Rollback successful',
                    previousVersionId: currentApk.previous_version_id
                });
            });
        });
    });
});

// Download APK with analytics
app.get('/api/apks/:id/download', authenticateToken, (req, res) => {
    const apkId = req.params.id;
    
    db.get('SELECT * FROM apks WHERE id = ? AND is_active = 1', [apkId], (err, apk) => {
        if (err || !apk) {
            return res.status(404).json({ error: 'APK not found' });
        }

        // Log download analytics
        const analyticsData = {
            apk_id: apkId,
            user_id: req.user.id,
            ip_address: req.ip,
            user_agent: req.get('User-Agent'),
            file_size_downloaded: apk.file_size
        };

        db.run(`
            INSERT INTO download_analytics 
            (apk_id, user_id, ip_address, user_agent, file_size_downloaded)
            VALUES (?, ?, ?, ?, ?)
        `, Object.values(analyticsData));

        const filePath = path.join(uploadsDir, apk.filename);
        res.download(filePath, apk.original_name);
    });
});

// Analytics endpoints
app.get('/api/analytics/downloads', authenticateToken, requireAdmin, (req, res) => {
    const { startDate, endDate, apkId } = req.query;
    
    let query = `
        SELECT 
            da.*,
            a.name as apk_name,
            a.version as apk_version,
            u.username as downloader_name
        FROM download_analytics da
        JOIN apks a ON da.apk_id = a.id
        LEFT JOIN users u ON da.user_id = u.id
        WHERE 1=1
    `;
    const params = [];

    if (startDate) {
        query += ' AND da.download_date >= ?';
        params.push(startDate);
    }
    if (endDate) {
        query += ' AND da.download_date <= ?';
        params.push(endDate);
    }
    if (apkId) {
        query += ' AND da.apk_id = ?';
        params.push(apkId);
    }

    query += ' ORDER BY da.download_date DESC';

    db.all(query, params, (err, analytics) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to fetch analytics' });
        }
        res.json(analytics);
    });
});

// Bulk operations
app.post('/api/apks/bulk-upload', authenticateToken, upload.array('apks', 10), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }

        const results = [];
        const errors = [];

        for (const file of req.files) {
            try {
                // Extract metadata from filename or use defaults
                const name = req.body[`${file.fieldname}_name`] || path.parse(file.originalname).name;
                const version = req.body[`${file.fieldname}_version`] || '1.0.0';
                const description = req.body[`${file.fieldname}_description`] || 'Bulk uploaded APK';

                // Calculate file hash
                const fileBuffer = fs.readFileSync(file.path);
                const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

                const apkData = {
                    user_id: req.user.id,
                    name: name.trim(),
                    version: version.trim(),
                    description: description.trim(),
                    filename: file.filename,
                    original_name: file.originalname,
                    file_size: file.size,
                    file_hash: fileHash
                };

                // Insert into database
                await new Promise((resolve, reject) => {
                    db.run(`
                        INSERT INTO apks 
                        (user_id, name, version, description, filename, original_name, file_size, file_hash)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    `, Object.values(apkData), function(err) {
                        if (err) reject(err);
                        else resolve(this.lastID);
                    });
                });

                results.push({ filename: file.originalname, success: true });
            } catch (error) {
                errors.push({ filename: file.originalname, error: error.message });
            }
        }

        res.json({
            success: true,
            message: `Bulk upload completed. ${results.length} successful, ${errors.length} failed.`,
            results,
            errors
        });
    } catch (error) {
        res.status(500).json({ error: 'Bulk upload failed' });
    }
});

// External API endpoints (with API key authentication)
app.get('/api/external/apks', authenticateAPIKey, logAPIAccess, (req, res) => {
    const { name, version, limit = 20 } = req.query;
    
    let query = 'SELECT id, name, version, description, file_size, upload_date FROM apks WHERE is_active = 1';
    const params = [];

    if (name) {
        query += ' AND name LIKE ?';
        params.push(`%${name}%`);
    }
    if (version) {
        query += ' AND version LIKE ?';
        params.push(`%${version}%`);
    }

    query += ' ORDER BY upload_date DESC LIMIT ?';
    params.push(parseInt(limit));

    db.all(query, params, (err, apks) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to fetch APKs' });
        }
        res.json(apks);
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
    console.log(`🚀 Titan Base Enterprise APK Shop running on http://localhost:${PORT}`);
    console.log(`📁 Uploads directory: ${uploadsDir}`);
    console.log(`🗄️ Database: ${dbPath}`);
    console.log(`🔐 JWT Secret: ${JWT_SECRET === 'your-super-secret-jwt-key-change-in-production' ? 'DEFAULT (CHANGE IN PRODUCTION)' : 'configured'}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔌 Port: ${PORT}`);
    console.log(`✨ Features: Authentication, Versioning, Analytics, API Access, Bulk Operations`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down gracefully...');
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err);
        } else {
            console.log('✅ Database connection closed');
        }
        process.exit(0);
    });
});
