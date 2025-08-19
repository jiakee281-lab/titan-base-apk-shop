# 🚀 Deploy Titan Base APK Shop Online

This guide will help you deploy your Titan Base APK Shop to the internet so others can access it from anywhere!

## 🌐 **Option 1: Render (Recommended - Free)**

Render offers free hosting for Node.js applications with automatic deployments from GitHub.

### **Step 1: Prepare Your Code**
1. **Initialize Git** (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Titan Base APK Shop"
   ```

2. **Push to GitHub**:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/titan-base-apk-shop.git
   git branch -M main
   git push -u origin main
   ```

### **Step 2: Deploy on Render**
1. **Go to [render.com](https://render.com)** and sign up/login
2. **Click "New +"** → **"Web Service"**
3. **Connect your GitHub repository**
4. **Configure the service**:
   - **Name**: `titan-base-apk-shop`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build-css`
   - **Start Command**: `npm start`
   - **Plan**: `Free`

5. **Click "Create Web Service"**
6. **Wait for deployment** (usually 2-5 minutes)

### **Step 3: Access Your Website**
Your website will be available at:
```
https://titan-base-apk-shop.onrender.com
```

---

## ☁️ **Option 2: Railway (Alternative - Free Tier)**

Railway is another excellent platform with a generous free tier.

### **Step 1: Deploy on Railway**
1. **Go to [railway.app](https://railway.app)** and sign up
2. **Click "New Project"** → **"Deploy from GitHub repo"**
3. **Select your repository**
4. **Add environment variables**:
   - `NODE_ENV`: `production`
   - `PORT`: `3000`

5. **Deploy automatically**

---

## 🐳 **Option 3: Docker + Any VPS**

For more control, deploy using Docker on any VPS provider.

### **Step 1: Create Dockerfile**
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build-css

EXPOSE 3000

CMD ["npm", "start"]
```

### **Step 2: Deploy Commands**
```bash
# Build image
docker build -t titan-base-apk-shop .

# Run container
docker run -d -p 3000:3000 --name titan-base titan-base-apk-shop
```

---

## 🔧 **Production Optimizations**

### **1. Environment Variables**
Create a `.env` file for production:
```bash
NODE_ENV=production
PORT=3000
```

### **2. Process Manager (PM2)**
Install PM2 for production:
```bash
npm install -g pm2
pm2 start server.js --name "titan-base-apk-shop"
pm2 startup
pm2 save
```

### **3. Reverse Proxy (Nginx)**
For better performance, use Nginx:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 📱 **Custom Domain Setup**

### **1. Get a Domain**
- **Freenom**: Free domains (.tk, .ml, .ga)
- **Namecheap**: Affordable domains
- **GoDaddy**: Popular choice

### **2. Configure DNS**
Point your domain to your hosting provider:
- **Render**: Add CNAME record pointing to `your-app.onrender.com`
- **Railway**: Add CNAME record pointing to `your-app.railway.app`

### **3. SSL Certificate**
Most platforms provide free SSL automatically. For custom setups:
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com
```

---

## 🚀 **Quick Deploy Commands**

### **For Render (Recommended)**
```bash
# 1. Initialize git
git init
git add .
git commit -m "Initial commit"

# 2. Push to GitHub
git remote add origin https://github.com/YOUR_USERNAME/titan-base-apk-shop.git
git push -u origin main

# 3. Deploy on Render (via web interface)
# Your site will be live in 5 minutes!
```

### **For Railway**
```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login and deploy
railway login
railway init
railway up
```

---

## 🔒 **Security Considerations**

### **1. File Upload Limits**
- APK files limited to 100MB
- Only .apk files accepted
- File type validation enabled

### **2. Environment Variables**
- Never commit `.env` files
- Use platform-specific secret management
- Rotate API keys regularly

### **3. HTTPS Only**
- Force HTTPS in production
- Use secure headers
- Implement rate limiting

---

## 📊 **Monitoring & Analytics**

### **1. Uptime Monitoring**
- **UptimeRobot**: Free uptime monitoring
- **Pingdom**: Professional monitoring
- **StatusCake**: Comprehensive monitoring

### **2. Performance Monitoring**
- **Google PageSpeed Insights**: Free performance analysis
- **GTmetrix**: Detailed performance reports
- **WebPageTest**: Advanced testing

---

## 🆘 **Troubleshooting**

### **Common Issues**

1. **Build Fails**
   - Check Node.js version (requires 16+)
   - Verify all dependencies in package.json
   - Check build commands

2. **App Won't Start**
   - Verify PORT environment variable
   - Check for port conflicts
   - Review server logs

3. **File Uploads Don't Work**
   - Ensure uploads directory has write permissions
   - Check file size limits
   - Verify file type validation

### **Get Help**
- Check platform-specific documentation
- Review server logs in your hosting dashboard
- Use platform support channels

---

## 🎯 **Next Steps After Deployment**

1. **Test Your Website**: Upload a test APK file
2. **Share Your URL**: Let others know about your APK shop
3. **Monitor Performance**: Check uptime and speed
4. **Customize Further**: Add your own branding and features
5. **Scale Up**: Consider paid plans for more traffic

---

## 🌟 **Success!**

Once deployed, your Titan Base APK Shop will be accessible worldwide at:
```
https://your-app-name.onrender.com
```

**Your APK shop is now online and ready to share with the world!** 🚀

---

*Need help? Check the platform-specific documentation or reach out to their support teams.*
