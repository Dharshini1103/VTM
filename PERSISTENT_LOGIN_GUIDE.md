# Persistent Login Feature

## Overview
The application now supports persistent login with "Remember Me" functionality. Users can register once and login multiple times without needing to re-register with the same credentials.

## Features

### 1. Auto-Save Credentials After Registration
- When a user registers successfully, their email and password are **automatically saved** in browser's local storage
- Users can immediately login on future visits without re-entering credentials
- This eliminates the need to register again with the same email/password

### 2. "Remember Me" Checkbox on Login
- Users can check the "Remember Me" checkbox during login
- If checked, credentials are saved for future logins
- Form auto-fills with saved credentials on next visit

### 3. Smart Session Management
- **Authentication Token**: Stored in local storage and automatically sent with API requests
- **User Data**: Stored in local storage for quick access
- **Saved Credentials**: Encrypted storage of email/password (requires `Remember Me` to be enabled)

### 4. Secure Logout
- Logout clears the authentication session
- If "Remember Me" is enabled, credentials are preserved for future login
- If "Remember Me" is not enabled, all credentials are cleared

## How It Works

### Registration Flow
```
User Registration
    ↓
Credentials Validated & User Created on Backend
    ↓
Email & Password Auto-Saved to Local Storage
    ↓
Authentication Token Stored
    ↓
User Redirected to Dashboard (Auto-Logged In)
```

### Login Flow (with Saved Credentials)
```
User Visits Login Page
    ↓
Form Auto-Filled with Saved Credentials
    ↓
User Checks "Remember Me" (Optional)
    ↓
Submit Login
    ↓
Token Stored, User Logged In
    ↓
Future Logins Auto-Fill Again
```

### Logout Flow
```
User Clicks Logout
    ↓
Authentication Token Removed
    ↓
If "Remember Me" Enabled → Credentials Preserved
    ↓
If "Remember Me" Disabled → All Data Cleared
    ↓
User Redirected to Login Page
```

## Local Storage Structure

The app stores the following in browser's local storage:

```javascript
{
  authToken: "jwt_token_here",           // JWT authentication token
  user: {                                 // User data object
    id: "...",
    email: "user@example.com",
    firstName: "John",
    lastName: "Doe",
    ...
  },
  rememberMe: "true",                    // "Remember Me" flag
  savedEmail: "user@example.com",        // Saved email
  savedPassword: "password123"           // Saved password
}
```

## Storage Manager Utility

A dedicated `storageManager` utility handles all local storage operations:

**Location**: `src/utils/storageManager.js`

### Available Methods:
- `setAuthToken(token)` - Store authentication token
- `getAuthToken()` - Retrieve authentication token
- `removeAuthToken()` - Remove authentication token
- `setUser(user)` - Store user data
- `getUser()` - Retrieve user data
- `removeUser()` - Remove user data
- `setCredentials(email, password)` - Store email/password
- `getCredentials()` - Retrieve saved credentials
- `removeCredentials()` - Remove credentials
- `clearSession()` - Clear auth session (keeps credentials if remember me enabled)
- `clearAll()` - Clear all stored data
- `hasSavedCredentials()` - Check if credentials are saved
- `isAuthenticated()` - Check if user is logged in

## Security Considerations

⚠️ **Important**: The current implementation stores passwords in plain text in local storage. For production:

1. **Consider token-based approach**: Only store JWT token, use refresh tokens
2. **Encrypted storage**: Encrypt sensitive data before storing
3. **HTTPS only**: Always use HTTPS to prevent man-in-the-middle attacks
4. **Secure credentials**: Use OAuth/SSO for enterprise applications
5. **User awareness**: Warn users about storing passwords on shared computers

### Recommended Improvements for Production:
```javascript
// Use a library like crypto-js for encryption
import CryptoJS from 'crypto-js';

// Encrypt before storing
const encrypted = CryptoJS.AES.encrypt(password, secretKey).toString();

// Decrypt when retrieving
const decrypted = CryptoJS.AES.decrypt(encrypted, secretKey).toString(CryptoJS.enc.Utf8);
```

## Testing the Feature

### Test Case 1: Registration & Auto-Save
1. Go to Register page
2. Fill in all details and click Register
3. You'll be logged in immediately
4. Log out from dashboard
5. Go to Login page
6. Form should be auto-filled with your registered email/password ✓

### Test Case 2: Remember Me on Login
1. Go to Login page
2. Enter credentials and check "Remember Me"
3. Click Login
4. Log out
5. Go to Login page
6. Credentials should be auto-filled ✓

### Test Case 3: Without Remember Me
1. Go to Login page
2. Clear any saved credentials (if present)
3. Enter email/password WITHOUT checking "Remember Me"
4. Log out
5. Go to Login page
6. Form should be empty ✓

### Test Case 4: Clear Saved Credentials
1. Go to Registration page
2. Register a new account
3. Log out
4. Go to Settings (if available) or use browser DevTools
5. Clear localStorage for saved credentials
6. Go to Login page
7. Form should be empty ✓

## Redux Integration

The Redux store (`authSlice.js`) manages:
- Authentication state
- Current user information
- Loading and error states
- Saved credentials status

### State Structure:
```javascript
{
  auth: {
    isAuthenticated: boolean,
    user: object | null,
    token: string | null,
    rememberMe: boolean,
    savedEmail: string,
    savedPassword: string,
    loading: boolean,
    error: string | null
  }
}
```

## API Endpoints Used

The authentication flows use these backend endpoints:

- **POST** `/api/auth/register` - User registration
- **POST** `/api/auth/login` - User login
- **GET** `/api/users/me` - Get current user info (optional)

All requests include JWT token in Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Future Enhancements

1. **Biometric Authentication**: Support fingerprint/face recognition
2. **Two-Factor Authentication**: Add 2FA for enhanced security
3. **Session Timeout**: Auto-logout after inactivity
4. **Device Management**: View and manage logged-in devices
5. **Encrypted Storage**: Use IndexedDB with encryption
6. **SSO Integration**: Support single sign-on services

## Troubleshooting

### Problem: Credentials not auto-filling
**Solution**: Check browser's local storage in DevTools (F12 → Application → Local Storage)

### Problem: "Remember Me" not working
**Solution**: Ensure "Save Credentials" action is being dispatched with `rememberMe: true`

### Problem: Session expires after browser close
**Solution**: Current design preserves credentials even after browser close. For session-only storage, use `sessionStorage` instead

### Problem: Want to clear saved credentials
**Solution**: 
- Uncheck "Remember Me" before logging out
- Or clear browser's local storage manually
- Add a "Clear Saved Credentials" button in user settings

## References

- Redux Documentation: https://redux.js.org/
- Local Storage API: https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage
- JWT Authentication: https://jwt.io/
- Best Practices: https://owasp.org/

