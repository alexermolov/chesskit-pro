# Contributing to ChessKit

Thank you for your interest in the ChessKit project! We welcome all forms of contributions - from bug fixes to adding new features.

## 🚀 Quick Start

1. **Fork the repository**
   ```bash
   git clone https://github.com/alexermolov/chesskit-pro.git
   cd chesskit-pro
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the dev server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Go to [http://localhost:3000](http://localhost:3000)

## 📋 Requirements

- **Node.js** version 22.11 or higher
- **npm** for package management
- Basic knowledge of **TypeScript** and **React**

## 🔧 Tech Stack

The project is built with modern technologies:

- **Frontend**: Next.js 15, React 18, TypeScript
- **UI**: Material-UI (MUI)
- **State Management**: Jotai
- **Chess Logic**: chess.js
- **Database**: Firebase + IndexedDB
- **Desktop**: Electron
- **Deployment**: AWS CDK

## 🎯 How to Contribute

### 1. Choose a task
- Browse [Issues](https://github.com/alexermolov/chesskit-pro/issues)
- Look for tasks labeled `good first issue` or `help wanted`
- Or suggest your own improvement idea

### 2. Create a branch
```bash
git checkout -b feature/feature-name
# or
git checkout -b fix/bug-description
```

### 3. Development
- Follow existing code patterns
- Write readable and documented code
- Test changes locally

### 4. Commits
Use clear commit messages:
```bash
git commit -m "feat: add opening analysis"
git commit -m "fix: correct rating calculation error"
git commit -m "docs: update README"
```

### 5. Pull Request
- Create a PR to the main repository
- Describe changes and their purpose
- Attach screenshots if necessary

## 📁 Project Structure

```
src/
├── components/          # React components
├── hooks/              # Custom hooks
├── lib/                # Utilities and libraries
├── pages/              # Next.js pages
├── sections/           # Page sections
└── types/              # TypeScript types

electron/
├── main.js             # Electron main process
└── preload.js          # Preload script

public/
├── engines/            # Stockfish engines
└── sounds/            # Sound effects
```

## 🎨 Code Style

### TypeScript
- Use strict typing
- Avoid `any`, prefer typed interfaces
- Export types from `src/types/`

### React Components
- Functional components with hooks
- Use `React.memo` for optimization
- Props destructuring

### Naming
- **Files**: camelCase for utilities, PascalCase for components
- **Variables**: camelCase
- **Constants**: UPPER_SNAKE_CASE
- **Types**: PascalCase

## 🧪 Testing

Before submitting a PR:

```bash
# Type checking and linting
npm run lint

# Build the project
npm run build

# Test Electron version
npm run electron-build
```

## 📦 Areas for Contribution

### 🎯 Priority Areas
- **Game Analysis**: improving evaluation algorithms
- **UI/UX**: enhancing interface usability
- **Performance**: optimizing engine performance
- **Mobile Version**: tablet adaptation

### 🔧 Technical Improvements
- Test coverage
- Bundle optimization
- Accessibility (a11y)
- Internationalization (i18n)

### 🎨 Design and Content
- Themes
- Sound effects
- Piece sets
- Translations

## 🐛 Bug Reports

When you find bugs:

1. Check if the bug has already been reported
2. Create a [new Issue](https://github.com/alexermolov/chesskit-pro/issues/new)
3. Include:
   - Problem description
   - Steps to reproduce
   - Expected behavior
   - Screenshots (if applicable)
   - System information

## 💡 Feature Suggestions

Have an idea for a new feature?

1. Check existing [Issues](https://github.com/alexermolov/chesskit-pro/issues)
2. Create a Feature Request
3. Describe:
   - The problem the feature solves
   - Proposed solution
   - Usage examples
   - Alternative options

## 📞 Contact

- **Issues**: for bugs and suggestions
- **Discussions**: for general questions
- **Email**: for private communication with maintainers

## 📜 License

By contributing to the project, you agree that your code will be distributed under the GNU AGPL v3 license.

---

Thank you for your contribution to ChessKit development! 🎯♟️
