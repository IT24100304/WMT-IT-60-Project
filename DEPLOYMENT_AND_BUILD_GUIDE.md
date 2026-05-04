# Lifeline Project - Deployment & Build Guide

## Table of Contents
1. [Backend Deployment](#backend-deployment)
2. [Mobile App Testing with Expo Go](#mobile-app-testing-with-expo-go)
3. [Building APK with EAS](#building-apk-with-eas)
4. [Complete Workflow](#complete-workflow)
5. [Troubleshooting](#troubleshooting)

---

## Backend Deployment

### Step 1: Update GitHub Repository

#### 1.1 Initialize Git (if not already done)
```bash
cd lifeline-backend-deploy

# Initialize git repository
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Lab file upload implementation"

# Add remote repository
git remote add origin https://github.com/YOUR_USERNAME/lifeline-backend.git

# Push to GitHub
git branch -M main
git push -u origin main
```

#### 1.2 Update Existing Repository
```bash
cd lifeline-backend-deploy

# Check git status
git status

# Add new/modified files
git add .

# Commit changes with descriptive message
git commit -m "feat: Add lab file upload with attachments and positive details tracking"

# Push to GitHub
git push origin main
```

#### 1.3 Commit Messages Convention
Use meaningful commit messages:
```bash
# Lab implementation
git commit -m "feat: Add file attachment support to lab test results

- Support PDF and image uploads for lab tests
- Track technician name and test severity
- Add positive marker details (HIV, Hepatitis, Malaria)
- Enable admins to view full lab details from inventory

Breaking changes: None
Closes #42"
```

---

### Step 2: Redeploy Backend

The redeployment process depends on your hosting platform. Below are instructions for the most common platforms:

#### **Option A: Render.com** (Recommended for ease)

1. **Link GitHub Repository to Render:**
   - Go to [render.com](https://render.com)
   - Click "New +" → "Web Service"
   - Select "Connect Repository"
   - Authorize GitHub and select `lifeline-backend` repo
   - Configure:
     - **Name:** lifeline-backend
     - **Environment:** Node
     - **Build Command:** `npm install`
     - **Start Command:** `npm start`
   - Click "Create Web Service"

2. **Set Environment Variables:**
   - In Render dashboard, go to your service
   - Click "Environment"
   - Add these variables:
     ```
     PORT=8080
     CLIENT_URL=https://your-frontend-url.com
     MONGODB_URI=your-mongodb-atlas-uri
     JWT_SECRET=your-super-secret-key
     JWT_EXPIRES_IN=7d
     GROQ_API_KEY=your-groq-key
     GROQ_MODEL=llama-3.1-8b-instant
     NODE_ENV=production
     ```

3. **Enable Auto-Deploy:**
   - Render automatically redeploys on every `git push` to main
   - Your backend will be live at `https://lifeline-backend-xxxxx.onrender.com`

#### **Option B: Railway.app**

1. **Connect Repository:**
   - Go to [railway.app](https://railway.app)
   - Click "New Project" → "Deploy from GitHub Repo"
   - Authorize and select your backend repository

2. **Configure Variables:**
   - Railway reads `.env` file automatically
   - Add environment variables in Railway dashboard
   - Same variables as Render above

3. **Deploy:**
   - Railway automatically deploys on git push
   - Backend URL will be shown in dashboard

#### **Option C: AWS (DigitalOcean, etc.)**

Follow the specific platform's deployment guide for Node.js applications.

---

### Step 3: Verify Backend Deployment

After deployment, test your backend:

```bash
# Test health endpoint
curl https://your-backend-url.com/api/health

# Expected response:
# {
#   "success": true,
#   "message": "LifeLine API is running"
# }
```

Update your mobile app's API endpoint to point to the deployed backend:

**File:** `lifeline-mobile/src/services/api.js`
```javascript
const API_URL = "https://your-backend-url.com/api";
```

---

## Mobile App Testing with Expo Go

### Prerequisites

1. **Install Node.js & npm:**
   ```bash
   # Check if installed
   node --version
   npm --version
   ```

2. **Install Expo CLI:**
   ```bash
   npm install -g expo-cli
   ```

3. **Download Expo Go App:**
   - iOS: [App Store](https://apps.apple.com/app/expo-go/id1234234235)
   - Android: [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)

---

### Step 1: Start Development Server

```bash
# Navigate to mobile app directory
cd lifeline-mobile

# Install dependencies (if not already done)
npm install

# Start Expo development server
npm start
# OR
expo start
```

**Expected output:**
```
Starting Expo CLI...

Expo DevTools is running at: http://localhost:19002/
Tunnel ready. On your phone, press:
  • s - open source code in your editor
  • c - open Expo DevTools
  • a - open Android
  • i - open iOS
  • w - open web
  • r - reload app
  • m - toggle menu
  • shift+m - more menu options
  • ? - show all commands
```

---

### Step 2: Connect with Expo Go

#### **Option A: Using QR Code (Easiest)**

1. **On Your Phone:**
   - Open Expo Go app
   - Tap "Scan QR code"
   - Scan the QR code from terminal/DevTools

2. **The app will load** on your phone in ~30 seconds

#### **Option B: Using Connection Type**

1. **In Expo CLI, press `c`** to open DevTools
2. **Select connection type:**
   - `LAN` - Local network (fastest, both devices on same WiFi)
   - `Tunnel` - Internet tunnel (slower, works anywhere)
   - `localhost` - Only if testing on same machine

3. **Copy the URL** and manually open in Expo Go

#### **Option C: Manual URL Entry**

1. **In Expo Go app, tap "Enter URL manually"**
2. **Paste the URL** from terminal (e.g., `exp://192.168.1.100:19000`)

---

### Step 3: Test Lab File Upload Feature

Once the app is running in Expo Go:

1. **Navigate to Lab Module** (Admin/LAB role required)
2. **Create Lab Test Result:**
   - Select blood unit
   - Input test results (HIV, Hepatitis, Malaria)
   - **Tap "Upload Files"** → Select from gallery:
     - Test report (PDF)
     - Photos of test kit
     - Any supporting documents
   - Input technician name and notes
   - Submit

3. **Verify in Admin Dashboard:**
   - Go to Inventory
   - Click blood unit to expand
   - See full lab details with downloaded files

---

### Step 4: Debug in Development

**Common Development Commands:**

```bash
# In Expo CLI terminal:
r     # Reload app
c     # Open DevTools
a     # Open Android simulator
i     # Open iOS simulator
?     # Show all commands
```

**View Logs:**
```bash
# In another terminal
npm run dev    # Watch for changes
```

**Enable Debug Mode:**
- Shake phone → Press "Debug remote JS"
- Opens Chrome DevTools for debugging

---

## Building APK with EAS

### Prerequisites

1. **Install EAS CLI:**
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo Account:**
   ```bash
   eas login
   # Enter your Expo credentials
   ```

3. **Verify Project ID:**
   ```bash
   cd lifeline-mobile
   cat eas.json
   ```
   Should show:
   ```json
   "projectId": "633deb33-0a46-449c-8663-1bb36b611dd8"
   ```

---

### Step 1: Build APK (Internal/Preview)

For testing on Android before production:

```bash
cd lifeline-mobile

# Build APK for internal distribution (testing)
eas build --platform android --profile preview

# Or build development client
eas build --platform android --profile development --dev-client
```

**This will:**
- Build APK on EAS servers (~10-15 minutes)
- Return a download link
- Create a QR code

**Download & Test:**
```bash
# Download APK from link
# Or scan QR code on Android phone
# Install the APK directly
```

---

### Step 2: Production APK Build

```bash
cd lifeline-mobile

# Build production APK (optimized)
eas build --platform android --profile production

# Expected output:
# Build ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
# Download URL: https://eas.expo.dev/...
```

**Build takes 10-15 minutes.**

---

### Step 3: Download & Distribute APK

```bash
# Option 1: Download directly from link
# Option 2: Scan QR code and download

# Installation on Android:
# 1. Download APK to phone
# 2. Enable "Unknown Sources" (Settings > Security)
# 3. Open APK file to install
# 4. Grant permissions as needed
```

---

### Step 4: Configure for Google Play (Optional)

If you want to publish on Google Play Store:

```bash
# Build for Google Play
eas build --platform android

# When prompted:
# - Select keystore creation option
# - Choose "generate new keystore"
# - EAS will store credentials securely

# After building:
# - Download APK
# - Go to Google Play Console
# - Create app → Upload APK
# - Fill in store listing details
# - Submit for review
```

---

## Complete Workflow

### Development Workflow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Update Backend Code (Lab Upload Implementation)           │
├─────────────────────────────────────────────────────────────┤
│   cd lifeline-backend-deploy                                │
│   git add .                                                  │
│   git commit -m "feat: Lab file upload"                     │
│   git push origin main                                       │
│                                                              │
│ → Render/Railway auto-deploys                              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Test Backend Deployment                                   │
├─────────────────────────────────────────────────────────────┤
│   curl https://your-backend-url.com/api/health             │
│   → Verify 200 OK response                                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Update Mobile App API Endpoint                            │
├─────────────────────────────────────────────────────────────┤
│   src/services/api.js → Update API_URL                      │
│   git add . && git commit && git push                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Start Expo Development Server                             │
├─────────────────────────────────────────────────────────────┤
│   cd lifeline-mobile                                         │
│   npm start                                                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Open in Expo Go (QR Code or Manual URL)                  │
├─────────────────────────────────────────────────────────────┤
│   - On phone: Scan QR code or enter URL                    │
│   - App loads and hot-reloads on file changes              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. Test Lab Upload Feature                                   │
├─────────────────────────────────────────────────────────────┤
│   - Upload test result with files                          │
│   - View in inventory with expanded details                │
│   - Verify API calls in backend logs                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. Build Production APK with EAS                             │
├─────────────────────────────────────────────────────────────┤
│   eas login                                                  │
│   eas build --platform android --profile production        │
│   → Download APK (10-15 minutes)                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 8. Install & Test APK on Android Device                      │
├─────────────────────────────────────────────────────────────┤
│   - Download APK                                            │
│   - Enable "Unknown Sources"                                │
│   - Install APK                                             │
│   - Test all features                                       │
└─────────────────────────────────────────────────────────────┘
```

---

## Troubleshooting

### Backend Issues

#### **Issue: Deployment fails on Render/Railway**
**Solution:**
```bash
# Check logs in platform dashboard
# Common causes:
# 1. Missing environment variables - add them in dashboard
# 2. MongoDB connection issue - verify MONGODB_URI
# 3. Dependencies not installing - check package.json
```

#### **Issue: API returns 404 for new routes**
**Solution:**
```bash
# 1. Make sure backend is redeployed (check deployment log)
# 2. Clear mobile app cache:
#    - Close Expo Go
#    - Press 'r' in Expo CLI to reload
# 3. Verify API endpoint URL in mobile app
```

#### **Issue: File uploads not working**
**Solution:**
```bash
# 1. Check /uploads folder exists on backend server
# 2. Verify multer middleware is installed: npm list multer
# 3. Check file size limits in uploadMiddleware.js
# 4. Verify Content-Type is multipart/form-data
```

---

### Mobile App Issues

#### **Issue: Expo Go shows "Unable to load script"**
**Solution:**
```bash
# 1. Restart Expo CLI: Press Ctrl+C, then npm start again
# 2. Clear cache: expo start --clear
# 3. Check WiFi connection (both devices on same network)
# 4. Use different connection type: press 'c' → select 'tunnel'
```

#### **Issue: App crashes when uploading files**
**Solution:**
```bash
# 1. Check file size (must be < 10MB)
# 2. Check file type (only JPEG, PNG, PDF allowed)
# 3. View error logs: Press 'm' in Expo for more options
# 4. Check backend logs for API errors
```

#### **Issue: Images not loading from backend**
**Solution:**
```bash
# 1. Verify /uploads route is served: curl http://backend/uploads/filename
# 2. Check CORS settings in backend (src/app.js)
# 3. Update API endpoint to use correct domain
```

---

### Build Issues with EAS

#### **Issue: "EAS Build failed"**
**Solution:**
```bash
# 1. Check eas.json configuration
# 2. Ensure all dependencies are in package.json
# 3. Run locally first: expo start --dev-client
# 4. Check EAS build logs for specific error

# View detailed logs:
eas build --platform android --profile preview --verbose
```

#### **Issue: "Could not find matching credentials"**
**Solution:**
```bash
# Create keystore for Android:
eas credentials -p android

# Or use existing keystore:
eas credentials -p android --clear
eas build --platform android
```

---

### Network Issues

#### **Issue: "Connection timeout" in Expo Go**
**Solution:**
```bash
# 1. Check firewall settings
# 2. Enable port forwarding if on different networks
# 3. Use tunnel instead of LAN: press 'c' → select 'tunnel'
# 4. Restart router/WiFi

# Test connection:
ping <your-development-machine-ip>
```

---

## Environment Variables

### Backend (.env)
```env
# Server
PORT=8080
NODE_ENV=production

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/lifeline_db

# Auth
JWT_SECRET=your-super-secret-random-key-min-32-chars
JWT_EXPIRES_IN=7d

# Frontend
CLIENT_URL=https://your-frontend-url.com

# AI (Optional)
GROQ_API_KEY=your-groq-api-key
GROQ_MODEL=llama-3.1-8b-instant
```

### Mobile App (API endpoint)
**File:** `lifeline-mobile/src/services/api.js`
```javascript
const API_URL = process.env.REACT_APP_API_URL || "https://your-backend-url.com/api";
```

---

## Useful Commands Reference

### Backend
```bash
# Development
cd lifeline-backend-deploy
npm install
npm run dev          # Watch mode

# Deployment
git add .
git commit -m "message"
git push origin main

# Testing
curl https://backend-url.com/api/health
```

### Mobile (Expo Go)
```bash
# Development
cd lifeline-mobile
npm install
npm start            # Start Expo server

# Commands in Expo:
# r - reload
# c - connection menu
# a - open Android
# i - open iOS
# ? - show all commands
```

### Mobile (EAS Build)
```bash
# Setup
npm install -g eas-cli
eas login

# Building
eas build --platform android --profile preview
eas build --platform android --profile production

# Managing builds
eas build:list
eas build:view <BUILD_ID>
```

---

## Deployment Checklist

### Before Backend Deployment
- [ ] All code changes committed and tested locally
- [ ] Dependencies updated in package.json
- [ ] Environment variables documented
- [ ] README updated with new features
- [ ] API endpoints documented

### Backend Deployment
- [ ] Push code to GitHub
- [ ] Verify auto-deployment on Render/Railway
- [ ] Test API health endpoint
- [ ] Check backend logs for errors
- [ ] Verify file upload directory exists

### Before Mobile Build
- [ ] Update API_URL to deployed backend
- [ ] Test all features in Expo Go
- [ ] Verify file upload works end-to-end
- [ ] Check error handling and edge cases
- [ ] Update version numbers if needed

### Mobile Build & Distribution
- [ ] Build APK with EAS
- [ ] Test APK on physical device
- [ ] Verify file uploads work in APK
- [ ] Document known issues
- [ ] Get team testing feedback

---

## Support & Resources

- **Expo Documentation:** https://docs.expo.dev/
- **EAS Build Guide:** https://docs.expo.dev/build/introduction/
- **Express.js Docs:** https://expressjs.com/
- **MongoDB Atlas:** https://www.mongodb.com/cloud/atlas
- **Render Deploy:** https://render.com/docs
- **Railway Deploy:** https://railway.app/docs

---

**Last Updated:** May 3, 2026
**Version:** 1.0
