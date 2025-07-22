<div align="center">
  <a href="https://github.com/alexermolov/chesskit-pro">
    <img width="120" height="120" src="https://github.com/alexermolov/chesskit-pro/blob/main/public/android-chrome-192x192.png" alt="Logo">
  </a>

<h3 align="center">Chesskit</h3>
  <p align="center">
    The Ultimate Chess Web and Desktop App
  </p>
</div>
<br />

Chesskit is a comprehensive open-source chess platform that combines powerful analysis tools with an intuitive interface. Analyze your games with world-class Stockfish engines, play against AI opponents, and track your chess improvement - all for free on any device.

## ✨ Key Highlights

- 🧠 **Professional Analysis** - Multiple Stockfish engines (11, 16, 16.1, 17) with up to 75MB neural networks
- 🎯 **Smart Move Classification** - Automatic detection of brilliant, excellent, good, and blunder moves  
- 📊 **Advanced Metrics** - Player accuracy calculation, ELO estimation, and performance tracking
- 🔄 **Platform Integration** - Import games directly from Chess.com and Lichess
- 🎮 **Adaptive AI** - Play against Stockfish at any skill level from beginner to grandmaster
- 💻 **Cross-Platform** - Web app + native desktop applications for Windows, macOS, and Linux
- 🔒 **Privacy-First** - Local storage with optional cloud sync, your data stays yours
- 🎨 **Highly Customizable** - 40+ piece sets, multiple themes, and extensive configuration options

## Mission

Chesskit aims to offer all the chess related features it can, while being free and open-source. It is designed to be easy to use, fast, and reliable.

## Features

### 🎯 Game Analysis
- **Deep Engine Analysis** with multiple Stockfish versions (11, 16, 16.1, 17) up to 75MB for maximum strength
- **Multi-PV Analysis** - See up to 10 best variations for each position simultaneously
- **Real-time Engine Evaluation** with depth and nodes display
- **Move Classification System** - Brilliant, Excellent, Best, Good, Okay, Inaccuracy, Mistake, Blunder moves
- **Evaluation Graph** showing advantage progression throughout the game
- **Opening Recognition** with comprehensive opening database
- **Accuracy Calculation** for players based on engine analysis
- **ELO Estimation** based on game performance

### ♟️ Game Import & Review  
- **Chess.com Integration** - Import and analyze your chess.com games
- **Lichess Integration** - Import and analyze your lichess.org games
- **PGN Support** - Load games from PGN files with full metadata
- **Game Database** - Store and organize your analyzed games locally
- **Player Statistics** - Track performance across multiple games

### 🎮 Play Mode
- **Play vs Stockfish** at any ELO level (300-3000+)
- **Adjustable Engine Strength** - Choose from multiple Stockfish versions
- **Custom Starting Positions** - Play from any FEN or PGN position
- **Color Selection** - Play as White or Black
- **Game State Persistence** - Continue games across sessions

### 🎨 Customization
- **Multiple Piece Sets** - 40+ different piece designs (Alpha, California, Celtic, etc.)
- **Board Themes** - Customizable board colors and hue adjustment
- **Sound Effects** - Move, capture, and error sounds
- **Responsive Design** - Works on desktop, tablet, and mobile devices
- **Dark/Light Theme** support

### 🔧 Advanced Features
- **Multi-threading Support** - Utilizes WebAssembly and SharedArrayBuffer for maximum performance  
- **Engine Configuration** - Adjust depth (1-30), workers count, and analysis parameters
- **Arrow Visualization** - Show best moves, threats, and custom analysis arrows
- **Branch Analysis** - Explore alternative variations and lines
- **Position Editor** - Set up custom positions for analysis
- **Offline Capability** - Full functionality without internet connection (Electron app)

### 💾 Data & Storage
- **Local Database** - IndexedDB for storing games and analysis
- **Firebase Integration** - Optional cloud sync for game data
- **Export Capabilities** - Save games and analysis in standard formats
- **Browser Storage** - Persistent settings and preferences

<img src="https://github.com/alexermolov/chesskit-pro/blob/main/assets/showcase.png" />

## 🖥️ Desktop App

ChessKit is available as a native desktop application built with Electron:

- **Cross-platform** - Available for Windows, macOS, and Linux
- **Offline Analysis** - Full Stockfish analysis without internet connection  
- **Native Performance** - Optimized for desktop with native menus and shortcuts
- **File Integration** - Open PGN files directly from your file system
- **Auto-updater** - Stay up to date with the latest features

### Download
- **Windows**: Download the installer from the [releases page](https://github.com/alexermolov/chesskit-pro/releases)
- **Portable Version**: Available in `dist/win-unpacked/` folder

## Stack

**Frontend Framework:**
- [Next.js 15](https://nextjs.org/docs) - React framework with SSG/SSR support
- [React 18](https://react.dev/learn/describing-the-ui) - UI library with concurrent features  
- [TypeScript](https://www.typescriptlang.org/docs/handbook/typescript-from-scratch.html) - Type-safe JavaScript

**UI & Design:**
- [Material-UI (MUI) v6](https://mui.com/material-ui/getting-started/overview/) - React component library
- [Emotion](https://emotion.sh/) - CSS-in-JS styling solution
- [Iconify](https://iconify.design/) - Icon framework

**Chess Logic & Engine:**
- [Chess.js](https://github.com/jhlywa/chess.js) - Chess move generation/validation
- [React-Chessboard](https://github.com/Clariity/react-chessboard) - Interactive chess board component
- **Multiple Stockfish Versions** - 11, 16, 16.1, 17 (WebAssembly)
- **WebAssembly** - High-performance chess engine execution
- **Web Workers** - Multi-threaded analysis for better performance

**State Management:**
- [Jotai](https://jotai.org/) - Primitive and flexible state management
- [TanStack Query](https://tanstack.com/query) - Server state management

**Data & Storage:**
- [Firebase](https://firebase.google.com/) - Authentication and cloud database
- [IndexedDB (via IDB)](https://github.com/jakearchibald/idb) - Local browser database
- **Local Storage** - Settings and preferences persistence

**Desktop:**
- [Electron](https://www.electronjs.org/) - Cross-platform desktop app framework
- [Electron Builder](https://www.electron.build/) - Application packaging and distribution

**Development & Deployment:**
- [AWS CDK](https://docs.aws.amazon.com/cdk/v2/guide/home.html) - Infrastructure as Code
- [ESLint](https://eslint.org/) - Code linting and formatting
- [Sentry](https://sentry.io/) - Error monitoring and performance tracking

**Deployed on AWS** - See it live at [chesskit.org](https://chesskit.org)

## Running the app in dev mode

> [!IMPORTANT]  
> At least [Node.js](https://nodejs.org) 22.11 is required.

Install the dependencies:

```bash
npm i
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in the browser to see the app running.

The app will automatically refresh on any source file change.

## 📱 Browser Compatibility

**Recommended Browsers:**
- **Chrome/Edge 80+** - Full WebAssembly and SharedArrayBuffer support
- **Firefox 79+** - Complete multi-threading capabilities  
- **Safari 14+** - Basic functionality (single-threaded analysis)

**Engine Requirements:**
- **WebAssembly support** required for Stockfish 16+ engines
- **SharedArrayBuffer** recommended for multi-threaded analysis
- **Web Workers** for non-blocking UI during analysis

## 🚀 Performance

**Engine Performance:**
- **Multi-threading** - Up to 8 worker threads for faster analysis
- **Progressive Analysis** - Real-time evaluation updates as depth increases  
- **Smart Caching** - Positions analyzed once are stored for instant retrieval
- **Memory Optimization** - Efficient handling of large game databases

**Hardware Recommendations:**
- **CPU**: Modern multi-core processor (4+ cores recommended)
- **RAM**: 4GB+ for smooth operation with large engines
- **Storage**: 200MB+ for full engine package and game storage

## 🛠️ Development

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server with Turbo
npm run build        # Build production version
npm run start        # Start production server

# Code Quality  
npm run lint         # Run ESLint and TypeScript checks
npm run lint:fix     # Auto-fix linting issues

# Desktop App (Electron)
npm run electron-dev     # Development with hot reload
npm run electron-build   # Build and run production desktop app  
npm run dist            # Create platform-specific installer
npm run dist-all        # Create installers for all platforms

# Deployment
npm run deploy      # Build and deploy to AWS
```

### Architecture

The application follows a modern React architecture with:

- **Component-based Design** - Reusable UI components in `src/components/`
- **Hook-based Logic** - Custom hooks in `src/hooks/` for chess operations  
- **Atomic State Management** - Jotai atoms for granular state control
- **Section-based Organization** - Feature modules in `src/sections/`
- **Type Safety** - Full TypeScript coverage with strict mode enabled

## Contribute

See [CONTRIBUTING.md](CONTRIBUTING.md) for details on how to contribute to the project.

We welcome contributions of all kinds - from bug fixes and feature additions to documentation improvements and design enhancements!

## 📄 License

This project is licensed under the **GNU Affero General Public License v3.0** (AGPL-3.0).

This means:
- ✅ **Free to use** - Personal and commercial use allowed
- ✅ **Open Source** - Source code must remain available  
- ✅ **Modifications allowed** - Fork and modify as needed
- ⚠️ **Network use = Distribution** - If you run a modified version as a web service, you must provide the source code

For more details, see the [LICENSE](LICENSE) file.

## 🙏 Acknowledgments

- **Stockfish Team** - For the incredible chess engine
- **Chess.com & Lichess** - For providing APIs and inspiration
- **Open Source Community** - For the amazing tools and libraries that make this project possible

---

**ChessKit** - *Elevating your chess game, one move at a time* ♟️
