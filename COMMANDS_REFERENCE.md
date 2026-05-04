# Commands Reference - Copy & Paste Ready

## 🔧 Backend Commands

### Initial Setup
```bash
# Navigate to backend
cd lifeline-backend-deploy

# Install dependencies
npm install

# Create .env from template (if exists)
cp .env.example .env

# Edit .env with your values
nano .env
# Or use your IDE to edit
```

### Git Setup (First Time)
```bash
# Initialize git if not already done
git init

# Configure git user
git config user.name "Your Name"
git config user.email "your.email@example.com"

# Add all files
git add .

# Initial commit
git commit -m "Initial commit: Lifeline backend with lab file upload"

# Add GitHub remote
git remote add origin https://github.com/YOUR_USERNAME/lifeline-backend.git

# Push to main
git branch -M main
git push -u origin main
```

### Git Workflow (After Changes)
```bash
# Check status
git status

# Add files
git add .

# Commit
git commit -m "feat: Description of changes"

# Push
git push origin main
```

### Local Development
```bash
# Start development server with watch
npm run dev

# Start production server
npm start

# Seed database (if script exists)
npm run seed

# Check syntax (if Node available)
node -c src/controllers/inventoryController.js
```

### Database
```bash
# Verify MongoDB connection by checking logs
tail -f server-logs.txt

# Or make a test request
curl http://localhost:8080/api/health
```

---

## 📱 Mobile App Commands

### Initial Setup
```bash
# Navigate to mobile app
cd lifeline-mobile

# Install dependencies
npm install

# Install Expo CLI globally
npm install -g expo-cli

# Install EAS CLI globally
npm install -g eas-cli
```

### Development with Expo Go
```bash
# Start Expo development server
npm start
# OR
expo start

# Clear cache and restart
expo start --clear

# Start with dev client
expo start --dev-client
```

### Expo CLI Shortcuts (Press During Running)
```
r     - Reload app
c     - Change connection type (LAN/Tunnel/Localhost)
a     - Open Android simulator
i     - Open iOS simulator
w     - Open web
m     - More menu options
?     - Show all commands
```

### EAS Build Setup
```bash
# Login to Expo account
eas login

# View credentials
eas credentials -p android

# Create/update keystore
eas credentials -p android --clear

# Check project configuration
cat eas.json
```

### Build APK
```bash
# Preview/Development build
eas build --platform android --profile preview

# Production build
eas build --platform android --profile production

# Build with verbose logs
eas build --platform android --profile production --verbose

# Build for development client
eas build --platform android --profile development --dev-client

# View build history
eas build:list

# View specific build
eas build:view BUILD_ID
```

---

## 🌐 Backend Deployment

### Render.com Setup
```bash
# 1. Push code to GitHub
git push origin main

# 2. Go to render.com and connect repository
# 3. Set environment variables in Render dashboard

# 4. Test after deployment
curl https://lifeline-backend-xxxxx.onrender.com/api/health

# 5. View logs
# Dashboard → Service → Logs
```

### Railway.app Setup
```bash
# 1. Push code to GitHub
git push origin main

# 2. Go to railway.app and connect repository
# 3. Add environment variables

# 4. Test deployment
curl https://your-railway-url.com/api/health

# 5. View logs in Railway dashboard
```

### AWS/DigitalOcean
```bash
# SSH into server
ssh -i key.pem ubuntu@your-server-ip

# Navigate to backend directory
cd lifeline-backend

# Pull latest code
git pull origin main

# Install/update dependencies
npm install

# Restart service
sudo systemctl restart lifeline-backend

# View logs
journalctl -u lifeline-backend -f
```

---

## 🔗 API Testing

### Test Backend Health
```bash
# Development
curl http://localhost:8080/api/health

# Production
curl https://your-backend-url.com/api/health
```

### Get Inventory (Test Authentication)
```bash
# Replace TOKEN with actual JWT token
curl -H "Authorization: Bearer TOKEN" \
  https://your-backend-url.com/api/inventory

# Or with localhost
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:8080/api/inventory
```

### Create Lab Test Result
```bash
curl -X PUT \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "hiv": false,
    "hep": true,
    "malaria": false,
    "reason": "Hepatitis marker detected",
    "testTechnician": "Dr. Smith"
  }' \
  https://your-backend-url.com/api/inventory/INVENTORY_ID/test
```

### Upload Files to Lab Test
```bash
curl -X POST \
  -H "Authorization: Bearer TOKEN" \
  -F "files=@test_report.pdf" \
  -F "files=@sample_photo.jpg" \
  https://your-backend-url.com/api/inventory/INVENTORY_ID/lab-files
```

---

## 📁 File Management

### Backend File Structure
```bash
# Check uploads folder
ls -la lifeline-backend-deploy/uploads/

# View file
cat lifeline-backend-deploy/uploads/filename.pdf

# Delete old files
rm lifeline-backend-deploy/uploads/old_file.pdf

# Create uploads folder if missing
mkdir -p lifeline-backend-deploy/uploads
```

### Mobile Configuration Files
```bash
# View app.json
cat lifeline-mobile/app.json

# View eas.json
cat lifeline-mobile/eas.json

# View API configuration
cat lifeline-mobile/src/services/api.js

# Edit API endpoint
nano lifeline-mobile/src/services/api.js
```

---

## 🐛 Debugging Commands

### Backend Logs
```bash
# View server logs
tail -f server.log

# View logs with error filter
grep -i error server.log

# Clear logs
> server.log

# Watch for changes
nodemon --exec "node server.js"
```

### Mobile App Logs
```bash
# In another terminal, watch for app logs
expo start

# In Expo terminal:
# Press 'c' to see connection type and IP
# Shake phone → Open debugger menu

# Or use:
adb logcat | grep ReactNativeJS
```

### Git Logs
```bash
# View commit history
git log --oneline

# View specific commit
git show COMMIT_ID

# View changes not yet committed
git diff

# View staged changes
git diff --staged
```

---

## ⚠️ Common Fix Commands

### If Expo Won't Connect
```bash
# Option 1: Reload
# Press 'r' in Expo CLI

# Option 2: Clear cache and restart
cd lifeline-mobile
expo start --clear

# Option 3: Use tunnel mode
# In Expo CLI, press 'c' → select 'tunnel'
```

### If Node Modules Are Broken
```bash
# Backend
cd lifeline-backend-deploy
rm -rf node_modules package-lock.json
npm install

# Mobile
cd lifeline-mobile
rm -rf node_modules package-lock.json
npm install
```

### If Git Has Issues
```bash
# Check git status
git status

# Reset changes
git reset HEAD .

# Discard all changes
git checkout -- .

# Force pull latest
git fetch origin
git reset --hard origin/main
```

### If Backend Won't Start
```bash
# Check if port is in use (Linux/Mac)
lsof -i :8080

# Kill process on port
kill -9 PID

# On Windows:
netstat -ano | findstr :8080
taskkill /PID PID_NUMBER /F
```

### If File Upload Fails
```bash
# Verify uploads folder exists
mkdir -p lifeline-backend-deploy/uploads

# Check permissions
chmod -R 755 lifeline-backend-deploy/uploads

# Clear old uploads
rm -rf lifeline-backend-deploy/uploads/*

# Restart backend
npm start
```

---

## 📊 Database Commands

### MongoDB Atlas (Cloud)
```bash
# Connect to MongoDB Atlas
# Copy connection string from Atlas dashboard

# Test connection with mongo shell
mongosh "mongodb+srv://username:password@cluster.mongodb.net/lifeline_db"

# View databases
show dbs

# Use specific database
use lifeline_db

# View collections
show collections

# View first document
db.inventories.findOne()

# Count documents
db.inventories.countDocuments()
```

### Local MongoDB (if running locally)
```bash
# Start MongoDB
mongod

# In another terminal
mongo

# Connect to database
use lifeline_db

# Check collections
show collections
```

---

## 🚀 Full Deployment Sequence (Copy & Paste Order)

```bash
# 1. BACKEND - Update and deploy
cd ~/path/to/lifeline-backend-deploy
git add .
git commit -m "feat: Lab file upload implementation"
git push origin main
# Wait 2-3 minutes for auto-deploy

# 2. BACKEND - Verify deployment
curl https://lifeline-backend-xxxxx.onrender.com/api/health

# 3. MOBILE - Update API endpoint
# Edit lifeline-mobile/src/services/api.js
# Change API_URL to your deployed backend

# 4. MOBILE - Start development server
cd ~/path/to/lifeline-mobile
npm start

# 5. MOBILE - Open Expo Go on phone and scan QR code

# 6. MOBILE - Test features in real-time

# 7. MOBILE - When ready, build APK
eas build --platform android --profile production

# 8. MOBILE - Download APK and install on device

# 9. FINAL - Test all features on physical device
```

---

## 📞 Emergency Commands

### If Everything Breaks
```bash
# Start fresh backend
cd lifeline-backend-deploy
rm -rf node_modules package-lock.json .env
npm install
cp .env.example .env
# Edit .env with correct values
npm run dev

# Start fresh mobile
cd lifeline-mobile
rm -rf node_modules package-lock.json
npm install
expo start --clear
```

### If You Need to Rollback Deployment
```bash
# Find previous commit
git log --oneline | head -5

# Go back to previous version
git revert COMMIT_ID

# Or force reset (CAREFUL!)
git reset --hard HEAD~1

# Push changes
git push origin main --force-with-lease
```

---

## 💡 Pro Tips

```bash
# Alias for faster development
alias runbackend="cd ~/path/to/lifeline-backend-deploy && npm run dev"
alias runmobile="cd ~/path/to/lifeline-mobile && npm start"

# Quick deployment
deploy_backend() {
    cd ~/path/to/lifeline-backend-deploy
    git add . && git commit -m "$1" && git push origin main
}

# Use it: deploy_backend "feat: New feature"
```

---

**Last Updated:** May 3, 2026
**Ready to Copy & Paste:** Yes ✅
