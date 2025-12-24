# Offline Development Mode

This project supports offline development mode for testing without an internet connection or Supabase access.

## Enabling Offline Mode

1. Edit the `.env` file in the project root
2. Set `VITE_OFFLINE_MODE=true`
3. Restart the development server

```env
# .env
VITE_OFFLINE_MODE=true
```

## Mock User Credentials

When running in offline mode, you can log in with these mock accounts:

### Admin Account
- **Email:** `admin@masjid.com`
- **Password:** `admin123`
- **Role:** Admin (full access)

### Bendahara Account
- **Email:** `bendahara@masjid.com`
- **Password:** `bendahara123`
- **Role:** Bendahara (treasurer)

### Panitia Account
- **Email:** `panitia@masjid.com`
- **Password:** `panitia123`
- **Role:** Panitia (committee)

## Features in Offline Mode

✅ **Available:**
- Authentication (login/logout)
- Session management
- Role-based access control
- UI testing and development
- Component development

❌ **Not Available:**
- Database operations (viewing/editing data)
- Real-time data synchronization
- File uploads
- Reports with real data

## Switching Back to Online Mode

1. Edit the `.env` file
2. Set `VITE_OFFLINE_MODE=false`
3. Ensure your Supabase credentials are correct
4. Restart the development server

```env
# .env
VITE_OFFLINE_MODE=false
```

## Use Cases

Offline mode is perfect for:
- 🎨 UI/UX development and testing
- 🧪 Component development
- 🚂 Working during internet outages
- 🏠 Development without Supabase access
- 📱 Mobile/responsive testing

## Notes

- Mock sessions expire after 8 hours (same as online mode)
- Session data is stored in browser's localStorage
- No actual data persistence - refreshing clears all state
- All database queries will need to be mocked separately if needed
