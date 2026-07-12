# WaveLab Mobile

Expo + React Native public dashboard app for viewing published WaveLab charts.

## Current prototype screens

- Latest published charts
- Chart detail
- Publication history
- About and guidance

The current screens use placeholder chart data. Live WaveLab API integration is the next implementation step.

## Requirements

- Node.js 20 LTS or newer
- pnpm
- Android Studio for the Android emulator
- macOS and Xcode for the iOS Simulator

## Install

From the repository root:

```powershell
cd mobile
pnpm install
npx expo install --fix
```

Copy the environment template:

```powershell
Copy-Item .env.example .env
```

The UI prototype does not require the backend yet. The environment variable will be used when live API integration is enabled.

## Run in an Android emulator on Windows

### First-time Android Studio setup

1. Install Android Studio with the Android SDK, Platform Tools, and Android Emulator.
2. Open **More Actions → Virtual Device Manager**.
3. Create a virtual device. A recent Pixel device is a reasonable default.
4. Download a recent Android system image and finish creating the device.
5. Start the emulator with the Play button.
6. Confirm that `adb` is available:

```powershell
adb --version
```

If PowerShell cannot find `adb`, add these folders to your user `Path`:

```text
%LOCALAPPDATA%\Android\Sdk\platform-tools
%LOCALAPPDATA%\Android\Sdk\emulator
```

Also create an `ANDROID_HOME` user environment variable pointing to:

```text
%LOCALAPPDATA%\Android\Sdk
```

### Start WaveLab Mobile

With the Android emulator already running:

```powershell
cd mobile
pnpm install
pnpm android
```

Equivalent command:

```powershell
npx expo start --android
```

You can also run:

```powershell
pnpm start
```

Then press `a` in the Expo terminal to open Android.

## Run on a physical Android phone

1. Install Expo Go from Google Play.
2. Make sure the phone and computer are on the same Wi-Fi network.
3. Run:

```powershell
cd mobile
pnpm start
```

4. Scan the QR code with Expo Go.

When live backend integration is enabled, replace `10.0.2.2` in `.env` with your computer's LAN IP address for physical-device testing.

## Run in the iOS Simulator

The iOS Simulator is only available on macOS.

1. Install Xcode.
2. Install an iOS Simulator runtime from Xcode settings.
3. Run:

```bash
cd mobile
pnpm install
pnpm ios
```

Equivalent command:

```bash
npx expo start --ios
```

You can also run `pnpm start` and press `i` in the terminal.

On Windows, use an Android emulator or a physical iPhone with Expo Go. Windows cannot run the iOS Simulator.

## Useful commands

```powershell
pnpm start
pnpm android
pnpm ios
pnpm web
pnpm typecheck
npx expo doctor
```

## Troubleshooting

### Emulator does not open

Start the virtual device manually from Android Studio, wait until Android finishes booting, and then run `pnpm android` again.

### `adb` is not recognized

Verify `ANDROID_HOME` and add the SDK `platform-tools` folder to your Windows user `Path`. Restart PowerShell afterward.

### Expo cache problems

```powershell
npx expo start --clear
```

### Dependency versions do not match Expo

```powershell
npx expo install --fix
npx expo doctor
```

### Local backend cannot be reached from Android emulator

Use `10.0.2.2` instead of `localhost` in `.env`:

```text
EXPO_PUBLIC_API_URL=http://10.0.2.2:5000
```

Adjust port `5000` to match the actual WaveLab backend port.
