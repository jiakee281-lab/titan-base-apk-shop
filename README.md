# 🚀 Titan Base APK Shop

A modern, responsive web application for managing and sharing your personal APK builds. Built specifically for developers who want to host and distribute their Android applications.

## ✨ Features

- **📱 APK Upload System** - Drag & drop or click to upload your APK files
- **🔒 Secure Storage** - Your APKs are stored locally with complete privacy
- **📚 APK Library** - Organize and manage all your uploaded applications
- **⬇️ Easy Download** - One-click download for your APKs
- **🎨 Modern UI** - Beautiful, responsive design that works on all devices
- **📱 Mobile Friendly** - Optimized for both desktop and mobile use
- **⚡ Fast Performance** - Built with modern web technologies for speed

## 🛠️ Technology Stack

- **Backend**: Node.js + Express.js
- **Frontend**: Vanilla JavaScript (ES6+)
- **Styling**: SCSS with modern CSS features
- **File Handling**: Multer for APK uploads
- **UI Components**: Custom-built with Font Awesome icons

## 📋 Requirements

- Node.js 16.0 or higher
- npm or yarn package manager
- Modern web browser

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Build CSS (Optional)

If you want to modify the SCSS files:

```bash
npm run build-css
```

Or watch for changes:

```bash
npm run watch-css
```

### 3. Start the Server

```bash
npm start
```

For development with auto-restart:

```bash
npm run dev
```

### 4. Access the Application

Open your browser and navigate to:
```
http://localhost:3000
```

## 📁 Project Structure

```
titan-base-apk-shop/
├── public/                 # Frontend assets
│   ├── css/               # Compiled CSS
│   ├── js/                # JavaScript files
│   └── index.html         # Main HTML file
├── src/
│   └── styles/            # SCSS source files
├── uploads/               # APK storage directory (auto-created)
├── server.js              # Express server
├── package.json           # Dependencies and scripts
└── README.md              # This file
```

## 🔧 Configuration

### Port Configuration
The server runs on port 3000 by default. You can change this by setting the `PORT` environment variable:

```bash
PORT=8080 npm start
```

### File Size Limits
APK files are limited to 100MB by default. You can modify this in `server.js`:

```javascript
limits: {
  fileSize: 100 * 1024 * 1024 // 100MB limit
}
```

## 📱 Usage

### Uploading APKs

1. **Navigate to the Upload section**
2. **Drag & drop your APK file** or click to browse
3. **Fill in the details**:
   - APK Name (required)
   - Version (required)
   - Description (optional)
4. **Click Upload** and wait for completion

### Managing Your Library

- **View all uploaded APKs** in the Library section
- **Download APKs** with the download button
- **Delete APKs** with the trash button (with confirmation)

### Navigation

- **Upload**: Add new APK files
- **Library**: View and manage existing APKs
- **About**: Learn more about the platform

## 🎨 Customization

### Colors and Styling
Modify the SCSS variables in `src/styles/main.scss`:

```scss
$primary-color: #6366f1;      // Main brand color
$primary-dark: #4f46e5;       // Darker shade
$background-color: #f8fafc;   // Background color
$surface-color: #ffffff;      // Card/surface color
```

### Branding
Update the logo and title in `public/index.html`:

```html
<div class="logo">
    <i class="fas fa-rocket"></i>
    <h1>Your Brand Name</h1>
    <span class="subtitle">APK Manager</span>
</div>
```

## 🔒 Security Features

- **File Type Validation**: Only APK files are accepted
- **File Size Limits**: Prevents abuse with large files
- **Local Storage**: Files are stored on your server only
- **Input Sanitization**: All user inputs are validated

## 📱 Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## 🚀 Deployment

### Local Development
```bash
npm run dev
```

### Production
```bash
npm start
```

### Environment Variables
```bash
PORT=3000                    # Server port
NODE_ENV=production         # Environment mode
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

If you encounter any issues:

1. Check the console for error messages
2. Verify all dependencies are installed
3. Ensure the uploads directory has write permissions
4. Check that port 3000 is available

## 🔮 Future Enhancements

- [ ] User authentication system
- [ ] APK versioning and rollback
- [ ] Download analytics
- [ ] APK signing verification
- [ ] Cloud storage integration
- [ ] API endpoints for external access
- [ ] Bulk upload/download operations

## 📞 Contact

For questions or support, please open an issue on the repository.

---

**Built with ❤️ for developers who love building amazing Android apps!**
