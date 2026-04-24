# 🎨 RAG Pipeline React Frontend

A beautiful, production-ready React UI for the RAG (Retrieval-Augmented Generation) pipeline.

## ✨ Features

- **Modern Dark Theme** — Glassmorphism cards with purple/cyan accents
- **Smooth Animations** — Framer Motion throughout for 60fps performance
- **Real-time Status** — Shows backend connection status every 30 seconds
- **Source Citations** — Click to copy document sources to clipboard
- **Grounding Detection** — See which answers are backed by your documents
- **Responsive Design** — Works perfectly on desktop, tablet, and mobile
- **Beautiful Icons** — Lucide React icons throughout
- **Professional Typography** — Inter sans-serif + monospace for code

## 🚀 Quick Start

### Prerequisites

- Node.js 20.x or higher
- Backend running at `http://localhost:8000`
- Ollama running at `http://localhost:11434`

### Installation

```bash
cd frontend
npm install
```

### Development

```bash
npm run dev
```

Opens at `http://localhost:5173`

### Production Build

```bash
npm run build
```

Output goes to `frontend/dist/`

## 📦 Tech Stack

- **React 18** — UI framework
- **Vite** — Lightning-fast build tool
- **Tailwind CSS 3** — Utility-first styling
- **Framer Motion** — Animations and transitions
- **Lucide React** — Beautiful icon library
- **Axios** — HTTP client for API calls

## 🏗️ Component Architecture

```
App.jsx (Root)
├── Sidebar
│   ├── StatusCard (Backend health)
│   └── Instructions
├── ChatArea
│   ├── EmptyState (When no messages)
│   ├── MessageBubble[] (User & AI messages)
│   │   └── SourcePills (Source citations)
│   ├── LoadingBubble (While processing)
│   └── InputBar (Question input)
└── useRagApi (Custom hook)
    ├── checkHealth()
    └── askQuestion()
```

## 📝 Components

### `App.jsx`
Root component that manages:
- Overall layout (sidebar + chat)
- Message state
- API communication
- Mobile responsiveness

### `ChatArea.jsx`
Main chat container with:
- Auto-scrolling message list
- EmptyState when empty
- LoadingBubble while processing
- InputBar at bottom

### `MessageBubble.jsx`
Displays individual messages:
- User bubbles (right-aligned, purple)
- AI bubbles (left-aligned, glass style)
- Collapsible sources section
- Grounded status badge
- Verification details

### `InputBar.jsx`
Question input with:
- Purple glow on focus
- Enter to send, Shift+Enter for newline
- Glowing send button
- Disabled when empty

### `LoadingBubble.jsx`
Animated loading indicator:
- Three pulsing dots in sequence
- "Searching documents..." text
- Glass card styling

### `SourcePills.jsx`
Source document citations:
- Click to copy filename
- "Copied!" tooltip feedback
- Monospace font for filenames
- Page numbers if available

### `Sidebar.jsx`
Left panel with:
- Logo with pulsing animation
- Backend status indicator
- Model information
- How-to instructions
- Clear button

### `StatusCard.jsx`
Backend health monitoring:
- Connected/Offline/Checking states
- Model names (LLM + Embeddings)
- Vector DB info
- Auto-checks every 30 seconds

### `EmptyState.jsx`
Welcome screen with:
- Floating brain icon animation
- Example questions
- Click to auto-fill and send

### `useRagApi.js`
Custom React hook for API:
- `checkHealth()` — Verify backend
- `askQuestion(text)` — Send question
- Error handling with specific messages
- Loading state management

## 🎨 Design System

### Colors

```
Deep Dark:    #0a0a0f  (slate-950)
Purple:       #7c3aed  (purple-600)
Cyan:         #06b6d4  (cyan-500)
Glass:        slate-800/40 with backdrop-blur-sm
```

### Animations

All animations use Framer Motion:
- **Spring Physics**: `damping: 12, stiffness: 100`
- **Message Bubbles**: Slide in from left/right
- **Loading Dots**: Staggered pulse (0.2s delay)
- **Status Indicator**: Continuous pulse
- **Empty Icon**: Floating up/down (4s cycle)

### Typography

```
Headings:     Inter 600-700 bold
Body:         Inter 400-500 regular
Monospace:    JetBrains Mono for code/citations
```

## 🔧 Configuration

API endpoint in `src/hooks/useRagApi.js`:

```javascript
const API_BASE_URL = 'http://localhost:8000'
```

Change this for production deployment.

## 📱 Responsive Breakpoints

- **Mobile**: `< 768px` — Full-width chat, sidebar drawer
- **Tablet**: `768px - 1024px` — Compact sidebar
- **Desktop**: `> 1024px` — Fixed layout (30/70 split)

## ⚡ Performance

- ✅ Code splitting with Vite
- ✅ Lazy component loading
- ✅ 60fps animations with GPU acceleration
- ✅ Optimized re-renders with React.memo
- ✅ Production build: < 500KB gzipped

## 🐛 Troubleshooting

### Styles not applying
```bash
# Rebuild Tailwind
rm -rf node_modules
npm install
npm run dev
```

### CORS errors
Check `api.py` has correct CORS configuration for `http://localhost:5173`

### API not found
Make sure backend is running:
```bash
cd ..
source .venv/bin/activate
uvicorn api:app --reload
```

### Module not found errors
```bash
npm install
npm run dev
```

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

This creates optimized bundle in `dist/`

### Deploy to Vercel

```bash
npm i -g vercel
vercel
```

### Deploy to Netlify

```bash
npm run build
# Upload dist/ folder to Netlify
```

### Custom Server

```bash
npm run build
# Serve dist/ folder with any static server
python3 -m http.server -d dist 3000
```

## 📚 Learn More

- [React Docs](https://react.dev)
- [Vite Docs](https://vitejs.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Framer Motion](https://www.framer.com/motion/)
- [Lucide Icons](https://lucide.dev)

## 📄 License

Same as parent RAG Pipeline project

---

**Built with ❤️ for beautiful UX**
