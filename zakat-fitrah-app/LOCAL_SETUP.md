# 🚀 Quick Start Guide - Local Development

## Current Issue: Internet Connection Required

The error you encountered occurs because the application is trying to connect to Supabase online but there's no internet connection:
```
net::ERR_INTERNET_DISCONNECTED
```

## ✅ Solution: Two Options

### Option 1: Run with Internet Connection (Recommended for Production)

Simply connect to the internet and the app will work with your Supabase backend.

### Option 2: Run in Offline Mode (Development/Testing)

I've added offline development mode support. Follow these steps:

## 🔧 Setup for Offline Development

### Step 1: Enable Offline Mode

Edit your `.env` file and change:

```env
VITE_OFFLINE_MODE=true
```

### Step 2: Restart Development Server

```powershell
# Stop the current server (Ctrl+C if running)
# Then start again:
npm run dev
```

### Step 3: Login with Mock Credentials

The login page will show available credentials. You can use:

**Admin Account:**
- Email: `admin@masjid.com`
- Password: `admin123`

**Bendahara Account:**
- Email: `bendahara@masjid.com`
- Password: `bendahara123`

**Panitia Account:**
- Email: `panitia@masjid.com`
- Password: `panitia123`

## 🎯 What Works in Offline Mode

✅ Authentication (login/logout)
✅ UI Navigation
✅ Component rendering
✅ Role-based access control
✅ Session management

⚠️ Database operations will need additional mocking (not implemented yet)

## 📝 Summary of Changes Made

I've implemented the following:

1. **Added offline mode support** - New environment variable `VITE_OFFLINE_MODE`
2. **Created mock authentication service** - `src/lib/mockAuth.ts` with 3 test users
3. **Updated auth provider** - `src/lib/auth.tsx` now supports both online and offline modes
4. **Enhanced login page** - Shows offline mode indicator and credentials
5. **Added documentation** - `OFFLINE_MODE.md` with detailed instructions

## 🔄 Switching Between Modes

**To go back online:**
```env
VITE_OFFLINE_MODE=false
```

**To work offline:**
```env
VITE_OFFLINE_MODE=true
```

Always restart the dev server after changing the environment variable.

## 🛠️ Commands Reference

```powershell
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

## 📦 Project Status

✅ Dependencies installed (481 packages)
✅ Environment configured
✅ Offline mode implemented
✅ Ready to run locally

## ⚠️ Security Note

The `xlsx` package has a known vulnerability (Prototype Pollution). For production:
- Limit Excel exports to trusted users
- Monitor for package updates
- Consider alternative libraries if needed

## 🎉 You're All Set!

Your application is now ready to run both online and offline. Choose the mode that works best for your current situation.
