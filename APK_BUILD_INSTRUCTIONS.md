# Dr. Paws - APK Build Instructions

## Overview

This document provides step-by-step instructions for building a deployable APK file for the Dr. Paws application. The Android project has been properly configured with Capacitor, and all security vulnerabilities have been fixed.

## Prerequisites

Before building the APK, ensure you have the following installed:

1. **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
2. **Android Studio** (latest version) - [Download](https://developer.android.com/studio)
3. **Java Development Kit (JDK)** 11 or higher - Usually bundled with Android Studio
4. **Android SDK** - Installed via Android Studio

## Security Fixes Applied

✅ **Fixed Security Vulnerabilities:**
- Upgraded `jspdf` from 2.5.1 to 3.0.4
- Resolved XSS vulnerability in dompurify dependency (GHSA-vhxf-7vqr-mrjg)
- Fixed command injection vulnerability in glob (GHSA-5j98-mcp5-4vw2)
- All npm audit issues resolved (0 vulnerabilities)

## Step-by-Step Build Instructions

### 1. Install Dependencies

```bash
cd drpaws-app
npm install
```

### 2. Configure API Key

Create or update the `.env.local` file in the `drpaws-app` directory:

```bash
echo "GEMINI_API_KEY=your_api_key_here" > .env.local
```

Replace `your_api_key_here` with your actual Gemini API key from [Google AI Studio](https://aistudio.google.com/).

### 3. Build the Web Application

```bash
npm run build
```

This creates an optimized production build in the `dist` directory.

### 4. Sync with Capacitor

```bash
npx cap sync android
```

This copies the web assets to the Android project and updates native dependencies.

### 5. Open in Android Studio

```bash
npx cap open android
```

This will launch Android Studio with the Android project.

### 6. Build the APK

#### Option A: Debug APK (for testing)

In Android Studio:
1. Go to **Build > Build Bundle(s) / APK(s) > Build APK(s)**
2. Wait for the build to complete
3. The APK will be located at: `drpaws-app/android/app/build/outputs/apk/debug/app-debug.apk`

#### Option B: Using Command Line (if Android SDK is configured)

```bash
cd android
./gradlew assembleDebug
```

The APK will be at: `android/app/build/outputs/apk/debug/app-debug.apk`

### 7. Install APK on Your Phone

#### Method 1: Direct Installation
1. Copy the APK file to your phone
2. Enable "Install from Unknown Sources" in your phone's settings
3. Open the APK file and install

#### Method 2: ADB Installation
```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

## Building a Release APK (for Production)

For a production-ready APK that can be distributed via Google Play Store:

### 1. Generate Signing Key

```bash
keytool -genkey -v -keystore drpaws-release-key.keystore -alias drpaws -keyalg RSA -keysize 2048 -validity 10000
```

**IMPORTANT:** Store this keystore file and passwords securely. You'll need them for all future updates.

### 2. Configure Signing in Android Studio

1. In Android Studio, go to **Build > Generate Signed Bundle / APK**
2. Select **Android App Bundle** (for Play Store) or **APK**
3. Select your keystore file
4. Enter keystore password and key alias
5. Select **release** build variant
6. Click **Finish**

### 3. Locate the Release Build

- **AAB (for Play Store):** `android/app/build/outputs/bundle/release/app-release.aab`
- **APK:** `android/app/build/outputs/apk/release/app-release.apk`

## Troubleshooting

### Build Fails with "SDK location not found"

**Solution:** Set the Android SDK location in `android/local.properties`:

```bash
cd android
echo "sdk.dir=/path/to/your/Android/Sdk" > local.properties
```

Common SDK locations:
- **Windows:** `C:\Users\YourUsername\AppData\Local\Android\Sdk`
- **macOS:** `~/Library/Android/sdk`
- **Linux:** `~/Android/Sdk`

### Gradle Build Fails

1. Clean the project:
   ```bash
   cd android
   ./gradlew clean
   ```

2. Rebuild:
   ```bash
   ./gradlew assembleDebug
   ```

### Capacitor Sync Issues

```bash
# Remove and re-add Android platform
npx cap remove android
npx cap add android
npx cap sync android
```

### API Key Not Working

1. Verify the API key is set in `.env.local`
2. Rebuild the web app: `npm run build`
3. Sync with Capacitor: `npx cap sync android`
4. Rebuild the APK

## App Configuration

- **Package ID:** `de.tklengineering.drpaws`
- **App Name:** Dr. Paws
- **Version:** 0.0.0 (update in `package.json` before release)

## Required Permissions

The app requires the following Android permissions (already configured):
- `INTERNET` - For API calls to Gemini
- `POST_NOTIFICATIONS` - For local notifications (Android 13+)
- `CAMERA` - For taking pet photos
- `READ_EXTERNAL_STORAGE` - For selecting photos from gallery
- `WRITE_EXTERNAL_STORAGE` - For saving reports

## Testing Checklist

Before distributing the APK, test the following:

- [ ] App launches successfully
- [ ] Pet profile creation works
- [ ] Photo/video upload works
- [ ] AI analysis generates reports
- [ ] Notifications work correctly
- [ ] App doesn't crash on rotation
- [ ] Back button navigation works
- [ ] All features work as expected

## Additional Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Android Developer Guide](https://developer.android.com/guide)
- [Google Play Console](https://play.google.com/console)
- [Detailed Android Deployment Guide](./ANDROID_DEPLOYMENT.md)

## Support

For issues or questions:
- Email: thomaskuempfel@tklengineering.de
- Repository: https://github.com/thomaskuempfel-ai/swipe141125

## Notes

- The debug APK is suitable for testing but should not be distributed publicly
- For production release, always use a signed release build
- Keep your keystore file and passwords secure
- Update the version number in `package.json` before each release
- Test thoroughly on multiple Android devices and versions before public release
