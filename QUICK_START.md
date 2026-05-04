# Quick Start - Deploy & Build Summary

## 🚀 Quick Reference (5-Minute Steps)

---

## 1️⃣ Update Backend & Deploy

```bash
# Navigate to backend
cd lifeline-backend-deploy

# Commit changes
git add .
git commit -m "feat: Lab file upload implementation"
git push origin main

# ✅ Done! Render/Railway auto-deploys
# Your backend is live at: https://lifeline-backend-xxxxx.onrender.com
```

**What happens:**
- GitHub receives your push
- Render/Railway detects changes
- Auto-builds and deploys in ~2-3 minutes
- Your API is updated instantly

---

## 2️⃣ Test with Expo Go (Development)

```bash
# Navigate to mobile app
cd lifeline-mobile

# Start development server
npm start

# On your phone:
# 1. Open Expo Go app
# 2. Scan QR code from terminal
# 3. App loads in 30 seconds
# 4. Changes hot-reload automatically!
```

**Key shortcuts in Expo:**
- `r` = Reload app
- `c` = Change connection type
- `m` = Menu options
- `?` = Help

---

## 3️⃣ Build APK with EAS (Production)

```bash
# Setup (one time)
npm install -g eas-cli
eas login

# Navigate to mobile app
cd lifeline-mobile

# Build APK
eas build --platform android --profile production

# Wait 10-15 minutes
# Download APK from link or scan QR code
# Install on Android phone
```

---

## 📋 Complete Workflow

```
Backend Code Change
    ↓
    → git push to GitHub
    ↓
    → Render auto-deploys (2-3 min)
    ↓
Update Mobile API Endpoint
    ↓
    → git push
    ↓
npm start (Expo Development)
    ↓
Scan QR Code in Expo Go
    ↓
Test features in real-time
    ↓
    → Make changes, see them instantly
    ↓
When ready: eas build for production APK
    ↓
Download APK → Install on phone
    ↓
Final testing & distribution
```

---

## 🔗 API Endpoint Configuration

**File:** `lifeline-mobile/src/services/api.js`

```javascript
// Development (Expo)
const API_URL = "http://localhost:8080/api";

// Production
const API_URL = "https://lifeline-backend-xxxxx.onrender.com/api";
```

---

## ⚡ Common Issues & Quick Fixes

| Issue | Fix |
|-------|-----|
| App won't load in Expo | Press `r` to reload, or restart: `npm start` |
| "Can't find backend" | Update API_URL in api.js |
| File upload fails | Check file size < 10MB and type is JPEG/PNG/PDF |
| Deployment stuck | Check Render/Railway dashboard logs |
| Different WiFi on PC & phone | Use tunnel: press `c` in Expo → select `tunnel` |

---

## 📱 Testing Checklist

### Expo Go Testing
- [ ] App loads in < 30 seconds
- [ ] Login works
- [ ] Can upload lab test files
- [ ] Files visible in inventory details
- [ ] Changes hot-reload (edit code, `r` to reload)

### APK Testing
- [ ] APK installs on Android
- [ ] App launches
- [ ] Login works
- [ ] File upload works
- [ ] Offline mode works (if implemented)
- [ ] No crashes on navigation

---

## 📊 Deployment Status

**Backend:**
- Live at: `https://lifeline-backend-xxxxx.onrender.com`
- Auto-deploys on `git push`
- Check logs at: Render Dashboard

**Mobile (Expo):**
- Development: `npm start` then scan QR code
- Production: `eas build --platform android`

---

## 🎯 Lab File Upload Feature - Test Flow

1. **Login** as LAB role
2. **Go to Lab Module**
3. **Create Test Result:**
   - Select blood unit
   - Set test results (HIV, Hepatitis, Malaria)
   - **Tap "Upload Files"**
   - Select from gallery:
     - Photos of test
     - PDFs of reports
   - Enter technician name
   - Submit
4. **Verify in Inventory:**
   - Go to Inventory
   - Click blood unit
   - **Expand to see:**
     - Test results
     - Uploaded files
     - Download links
     - Technician info
     - Severity details

---

## 📞 Need Help?

### Backend Issues
- Check Render dashboard logs
- Verify MONGODB_URI and JWT_SECRET are set
- Run locally: `npm run dev`

### Mobile Issues
- Check Expo console logs
- Shake phone → Debug remote JS
- Clear cache: `expo start --clear`

### Build Issues
- View detailed logs: `eas build --verbose`
- Check eas.json configuration
- Ensure `projectId` matches your Expo project

---

## 🔐 Important: Environment Variables

### Backend (.env file)
```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/lifeline_db
JWT_SECRET=very-long-random-secret-key
CLIENT_URL=https://your-frontend-url.com
PORT=8080
```

### Mobile (api.js)
```javascript
const API_URL = "https://your-deployed-backend.com/api";
```

---

## ✅ After Deployment Checklist

- [ ] Backend health check passes: `curl https://your-backend/api/health`
- [ ] Mobile app connects to deployed backend
- [ ] Lab file upload works end-to-end
- [ ] Admin can view files in inventory
- [ ] Team tested on physical device
- [ ] No errors in backend logs
- [ ] APK tested on Android phone

---

**You're all set! 🎉**

Your backend is deployed and your mobile app is ready for testing!

For detailed instructions, see: `DEPLOYMENT_AND_BUILD_GUIDE.md`
