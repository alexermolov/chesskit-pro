# ChessKit Electron App

This is the Electron version of the ChessKit chess application, which allows you to run the web application as a native desktop application on Windows, macOS, and Linux.

## Features

- 🎯 **Native application** - Runs as a regular program on your computer
- 🔒 **Security** - Configured secure runtime environment with disabled nodeIntegration
- 🌐 **Offline operation** - Does not require internet connection after installation
- 🎨 **Native menu** - Full-featured application menu with hotkeys
- 📱 **Adaptability** - Support for window resizing and fullscreen mode

## Development

### Installing dependencies

```bash
npm install
```

### Running in development mode

```bash
# Automatically starts Next.js dev server and Electron
npm run electron-dev
```

### Running production version

```bash
# First build the application
npm run build

# Then run Electron with the production build
npm run electron-build
```

## Building distributables

### Creating an installer for the current platform

```bash
npm run dist
```

### Creating installers for all platforms

```bash
npm run dist-all
```

## Available scripts

- `npm run electron` - Run Electron with already built application
- `npm run electron-dev` - Run in development mode
- `npm run electron-build` - Build and run production version
- `npm run dist` - Create a distributable for the current platform
- `npm run dist-all` - Create distributables for Windows, macOS, and Linux

## File structure

```
electron/
├── main.js          # Electron main process
└── preload.js       # Preload script for security

out/                 # Static export of Next.js application
└── ...

dist/                # Ready distributables
├── ChessKit Setup 0.1.0.exe  # Windows installer
├── win-unpacked/              # Portable version
└── ...
```

## Installation and usage

### Windows

1. Download `ChessKit Setup 0.1.0.exe` from the `dist/` folder
2. Run the installer and follow the instructions
3. Launch ChessKit from the Start menu or desktop shortcut

### Portable version

1. Copy the `dist/win-unpacked/` folder to any location
2. Run `ChessKit.exe`

## Configuration

Electron settings can be changed in the `"build"` section of the `package.json` file:

- `appId` - Unique application identifier
- `productName` - Product name
- `directories.output` - Folder for distributables
- `files` - Files to include in the build
- `win`, `mac`, `linux` - Platform-specific settings

## Security

The application is configured with Electron security best practices:

- ✅ `nodeIntegration: false` - Disabled access to Node.js from the renderer
- ✅ `contextIsolation: true` - Context isolation
- ✅ `enableRemoteModule: false` - Disabled remote module
- ✅ Preload script for secure API
- ✅ Proper handling of external links
- ✅ Navigation validation

## Supported platforms

- ✅ **Windows** x64 (NSIS installer)
- 🚧 **macOS** x64/ARM64 (DMG) - configured but not tested
- 🚧 **Linux** x64 (AppImage) - configured but not tested

## Known issues

1. **Slow file system** - During development, it's recommended to exclude the project folder from antivirus scanning
2. **Sentry warnings** - In dev mode with Turbopack, there are warnings that don't affect functionality
3. **Distributable size** - Final size around 150MB due to Chromium inclusion

## Troubleshooting

### Problems with launching in dev mode

```bash
# If wait-on hangs, try:
npm run dev  # in one terminal
npm run electron  # in another terminal after the dev server starts
```

### Build errors

```bash
# Clear cache and rebuild
rm -rf .next dist out
npm run build
npm run dist
```

## Contributing to the project

When making changes to the Electron part of the application:

1. Test in dev mode: `npm run electron-dev`
2. Test the production build: `npm run electron-build`
3. Create and test a distributable: `npm run dist`
4. Update documentation if necessary
