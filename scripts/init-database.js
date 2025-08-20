const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

// Database path
const dbPath = path.join(__dirname, '..', 'data', 'titan-base.db');

// Ensure data directory exists
const fs = require('fs-extra');
fs.ensureDirSync(path.dirname(dbPath));

// Create database connection
const db = new sqlite3.Database(dbPath);

// Initialize database tables
async function initDatabase() {
    console.log('🚀 Initializing Titan Base Enterprise Database...');
    
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            // Users table
            db.run(`
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT UNIQUE NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL,
                    role TEXT DEFAULT 'user',
                    is_active BOOLEAN DEFAULT 1,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    last_login DATETIME,
                    api_key TEXT UNIQUE
                )
            `);

            // APKs table with versioning
            db.run(`
                CREATE TABLE IF NOT EXISTS apks (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    name TEXT NOT NULL,
                    version TEXT NOT NULL,
                    description TEXT,
                    filename TEXT NOT NULL,
                    original_name TEXT NOT NULL,
                    file_size INTEGER NOT NULL,
                    file_hash TEXT NOT NULL,
                    signature_verified BOOLEAN DEFAULT 0,
                    is_active BOOLEAN DEFAULT 1,
                    is_rollback BOOLEAN DEFAULT 0,
                    previous_version_id INTEGER,
                    upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id),
                    FOREIGN KEY (previous_version_id) REFERENCES apks (id)
                )
            `);

            // Download analytics table
            db.run(`
                CREATE TABLE IF NOT EXISTS download_analytics (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    apk_id INTEGER NOT NULL,
                    user_id INTEGER,
                    ip_address TEXT,
                    user_agent TEXT,
                    download_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                    download_success BOOLEAN DEFAULT 1,
                    file_size_downloaded INTEGER,
                    FOREIGN KEY (apk_id) REFERENCES apks (id),
                    FOREIGN KEY (user_id) REFERENCES users (id)
                )
            `);

            // API access logs
            db.run(`
                CREATE TABLE IF NOT EXISTS api_access_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER,
                    endpoint TEXT NOT NULL,
                    method TEXT NOT NULL,
                    ip_address TEXT,
                    user_agent TEXT,
                    request_body TEXT,
                    response_status INTEGER,
                    response_time_ms INTEGER,
                    access_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id)
                )
            `);

            // Cloud storage configuration
            db.run(`
                CREATE TABLE IF NOT EXISTS cloud_storage_config (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    provider TEXT NOT NULL,
                    bucket_name TEXT,
                    region TEXT,
                    access_key_id TEXT,
                    secret_access_key TEXT,
                    is_active BOOLEAN DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Create indexes for better performance
            db.run('CREATE INDEX IF NOT EXISTS idx_apks_user_id ON apks(user_id)');
            db.run('CREATE INDEX IF NOT EXISTS idx_apks_version ON apks(version)');
            db.run('CREATE INDEX IF NOT EXISTS idx_apks_name ON apks(name)');
            db.run('CREATE INDEX IF NOT EXISTS idx_downloads_apk_id ON download_analytics(apk_id)');
            db.run('CREATE INDEX IF NOT EXISTS idx_downloads_date ON download_analytics(download_date)');

            // Insert default admin user
            const adminPassword = 'admin123'; // Change this in production
            bcrypt.hash(adminPassword, 10, (err, hash) => {
                if (err) {
                    console.error('Error hashing admin password:', err);
                    return;
                }

                db.run(`
                    INSERT OR IGNORE INTO users (username, email, password_hash, role, api_key)
                    VALUES (?, ?, ?, ?, ?)
                `, [
                    'admin',
                    'admin@titanbase.com',
                    hash,
                    'admin',
                    'admin_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
                ], function(err) {
                    if (err) {
                        console.error('Error creating admin user:', err);
                    } else {
                        console.log('✅ Admin user created/updated');
                    }
                });
            });

            console.log('✅ Database tables created successfully');
            resolve();
        });
    });
}

// Close database connection
function closeDatabase() {
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err);
        } else {
            console.log('✅ Database connection closed');
        }
    });
}

// Run initialization
initDatabase()
    .then(() => {
        console.log('🎉 Database initialization completed successfully!');
        closeDatabase();
    })
    .catch((error) => {
        console.error('❌ Database initialization failed:', error);
        closeDatabase();
        process.exit(1);
    });
