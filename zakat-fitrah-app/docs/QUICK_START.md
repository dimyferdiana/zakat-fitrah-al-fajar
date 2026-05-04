# 🎯 Quick Reference - Offline Mode

## Enable Offline Mode
```env
# .env file
VITE_OFFLINE_MODE=true
```

## Login Credentials

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@masjid.com | admin123 |
| **Bendahara** | bendahara@masjid.com | bendahara123 |
| **Panitia** | panitia@masjid.com | panitia123 |

## Quick Commands
```powershell
# Start dev server
npm run dev

# Build
npm run build

# Run linter
npm run lint
```

## Files Created/Modified

### New Files:
- `src/lib/mockAuth.ts` - Mock authentication service
- `OFFLINE_MODE.md` - Detailed offline mode guide
- `LOCAL_SETUP.md` - Complete setup instructions
- `QUICK_START.md` - This file

### Modified Files:
- `.env` - Added VITE_OFFLINE_MODE variable
- `.env.example` - Added offline mode example
- `src/lib/auth.tsx` - Added offline mode support
- `src/pages/Login.tsx` - Added offline mode indicator

## Troubleshooting

**Can't login?**
- Make sure `VITE_OFFLINE_MODE=true` in `.env`
- Restart the dev server
- Check you're using the correct credentials

**Still showing connection errors?**
- Clear browser cache and localStorage
- Hard refresh (Ctrl+Shift+R)
- Check console for errors

## Switch Back to Online
```env
# .env file
VITE_OFFLINE_MODE=false
```
Then restart dev server.
