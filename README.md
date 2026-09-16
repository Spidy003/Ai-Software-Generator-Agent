# 🚀 NETRUNNER-Ai (AI Software Generator)

> **Design. Generate. Build. Instantly.**

A premium, production-quality AI-powered Software Engineering Workspace that lets you generate complete software projects from a single natural language prompt. Powered by NETRUNNER-Ai.

---

## ✨ Features

- **AI Chat Interface** — ChatGPT-style conversation with streaming UI
- **Monaco Code Editor** — Full VS Code-grade editor with custom dark theme
- **Live Preview** — Instant HTML/CSS/JS rendering in embedded iframe
- **File Explorer** — Tree-view with folder expand/collapse and file search
- **ZIP Download** — Download complete project as a ZIP archive
- **Chat History** — Search, pin, rename, and delete conversation history
- **Animated Background** — Particle system with interactive mouse repulsion
- **Voice Input** — Speak your prompts using the Web Speech API
- **Responsive** — Works on desktop, tablet, and mobile
- **Dark/Light Theme** — Toggle with localStorage persistence

---

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| HTML5 | Structure & Semantics |
| CSS3 | Glassmorphism, Animations |
| Vanilla JavaScript | Logic, Modules |
| Google Gemini API | AI Code Generation |
| Monaco Editor | Code editing |
| JSZip | ZIP file creation |
| Marked.js | Markdown rendering |
| Highlight.js | Syntax highlighting |

---

## 🚀 Getting Started

### 1. Get a Gemini API Key
1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create a new API key
3. Copy the key (starts with `AIza...`)

### 2. Open the App
Simply open `index.html` in a modern browser — no build step required!

```bash
# If you have a local server (recommended):
npx serve .
# or
python -m http.server 8080
```

### 3. Enter Your API Key
In the right panel of the workspace, paste your Gemini API key and click **Save Key**.

### 4. Start Generating!
Type a prompt like:
- `Create a modern Netflix clone with dark theme`
- `Build a banking management dashboard`
- `Create a restaurant website with menu and reservations`

---

## 📁 Project Structure

```
ai-software-generator/
├── index.html          # Main entry point
├── styles.css          # Core stylesheet (design tokens, layout)
├── app.js              # Main orchestrator
├── api.js              # Gemini API integration
├── chat.js             # Chat history management
├── editor.js           # Monaco Editor integration
├── explorer.js         # File tree explorer
├── preview.js          # Live HTML preview
├── zip.js              # ZIP download
├── animations.js       # Particle system, scroll reveal
├── theme.js            # Dark/light theme toggle
├── utils.js            # Shared utilities
└── assets/
    └── animations.css  # Micro-animations & keyframes
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Enter` | Send prompt |
| `Shift+Enter` | New line in prompt |
| `Escape` | Close IDE workspace |
| `Ctrl+K` | Focus prompt input |
| `Ctrl+Shift+D` | Download project ZIP |

---

## 🎨 Design System

- **Background**: `#050816` (deep space)
- **Primary**: `#5B8CFF` (electric blue)
- **Secondary**: `#7A5CFF` (violet)
- **Accent**: `#00F5FF` (cyan)
- **Success**: `#36FF8B` (green)
- **Error**: `#FF5D7A` (red)
- **Font**: Inter, Space Grotesk, JetBrains Mono

---

## 📄 License

MIT License — Built with ❤️ and Gemini AI
