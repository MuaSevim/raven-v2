---
description: Setup Android Emulator for React Native Development
---

# Setup Android Emulator for React Native Development

## Prerequisites
This guide will help you set up Android Studio and the Android SDK to run your React Native app in an Android emulator.

## Steps

### 1. Download and Install Android Studio
- Go to https://developer.android.com/studio
- Download Android Studio for Windows
- Run the installer and follow the setup wizard
- Choose "Standard" installation type
- Wait for all components to download and install

### 2. Install Android SDK Components
After Android Studio is installed:
- Open Android Studio
- Click on "More Actions" → "SDK Manager"
- In the "SDK Platforms" tab, check:
  - ✅ Android 13.0 (Tiramisu) - API Level 33
  - ✅ Android 12.0 (S) - API Level 31
- In the "SDK Tools" tab, check:
  - ✅ Android SDK Build-Tools
  - ✅ Android SDK Platform-Tools
  - ✅ Android Emulator
  - ✅ Android SDK Tools (Obsolete) - if available
- Click "Apply" and wait for installation

### 3. Set Environment Variables
Add the following environment variables to your Windows system:

**ANDROID_HOME**
```
C:\Users\jumpe\AppData\Local\Android\Sdk
```

**Add to PATH**
```
C:\Users\jumpe\AppData\Local\Android\Sdk\platform-tools
C:\Users\jumpe\AppData\Local\Android\Sdk\emulator
C:\Users\jumpe\AppData\Local\Android\Sdk\tools
C:\Users\jumpe\AppData\Local\Android\Sdk\tools\bin
```

**To set environment variables:**
1. Press `Win + X` and select "System"
2. Click "Advanced system settings"
3. Click "Environment Variables"
4. Under "User variables", click "New"
5. Add `ANDROID_HOME` with the SDK path
6. Edit the "Path" variable and add the SDK paths above
7. Click "OK" on all dialogs
8. **Restart your terminal/IDE** for changes to take effect

### 4. Create an Android Virtual Device (AVD)
- Open Android Studio
- Click "More Actions" → "Virtual Device Manager"
- Click "Create Device"
- Select a device (e.g., "Pixel 5")
- Select a system image (e.g., "Tiramisu" - API 33)
- Download the system image if needed
- Click "Next" and then "Finish"

### 5. Verify Installation
Open a new terminal and run:
```powershell
adb --version
```

You should see the Android Debug Bridge version.

### 6. Run Your App
In your Expo terminal, press **`a`** to open the app in the Android emulator.

## Alternative: Use Web Instead
If you don't want to install Android Studio, you can run your React Native app in a web browser:
- Press **`w`** in the Expo terminal
- The app will open in your default browser

## Alternative: Use Physical Device
Install **Expo Go** on your Android/iOS device and scan the QR code shown in the terminal.
