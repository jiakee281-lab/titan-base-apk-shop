@echo off
echo 🚀 Deploying Simple APK Shop to Render...
echo.

echo 📦 Building CSS...
npm run build-css

echo.
echo 🔄 Committing changes...
git add .
git commit -m "Deploy simplified APK shop - no authentication, simple upload system"

echo.
echo 🚀 Pushing to Render...
git push origin main

echo.
echo ✅ Deployment initiated! 
echo 🌐 Your app will be available at: https://titan-base-apk-shop.onrender.com
echo.
echo 📱 Simple APK Shop Features:
echo    • Upload APK files (no login required)
echo    • View all uploaded APKs
echo    • Download APKs directly
echo    • Delete unwanted APKs
echo.
echo ⏳ Please wait a few minutes for Render to build and deploy...
pause
