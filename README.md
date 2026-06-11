# 🎬 Video Search & Compilation Editor

A powerful browser-based platform for searching, downloading, and editing compilation-style videos.

## Features

### 🔍 Advanced Search Engine
- Multi-source video search (Pixabay, Pexels, YouTube, Vimeo, Internet Archive)
- Boolean operator support: `AND`, `OR`, `NOT`, `"exact phrase"`, `site:`, `filetype:`
- Category filters: Nature, Sports, Music, Gaming, News, Cinematic, Drone, Animation, and custom types
- Search history with saved queries
- Operator enhancement suggestions as you type

### ✂️ Compilation Editor
- **Timeline editor** — drag-and-drop clip arrangement
- **Cut / Paste / Copy** — precise clip manipulation
- **Trim** — set custom in/out points per clip
- **Fade In / Fade Out** — smooth audio & video transitions
- **Text Overlays** — custom fonts, colors, positions, and timing
- **Screen Overlays** — color tints, watermarks, lower thirds
- **Replace Clip** — swap any clip without losing surrounding edits
- **Remove Clip** — delete with automatic gap-fill or keep gap
- **Clip Range Selection** — multi-select and batch operations
- **Preview Player** — real-time playback of the timeline

### 📁 Project Management
- Save projects with categories and tags
- Export timeline as EDL / project manifest
- Organize clips in a personal library

## Tech Stack

- **Frontend:** React 18 + Tailwind CSS
- **State:** Zustand
- **Player:** Video.js / native HTML5
- **APIs:** Pixabay API, Pexels API, Internet Archive API
- **Backend:** Base44 (entities, automations, file storage)
- **Auth:** Base44 Auth

## Project Structure

```
video-search-editor/
├── src/
│   ├── components/
│   │   ├── search/
│   │   │   ├── SearchBar.jsx          # Advanced search with operator hints
│   │   │   ├── SearchFilters.jsx      # Category, duration, license filters
│   │   │   ├── SearchResults.jsx      # Grid/list results with thumbnails
│   │   │   └── OperatorHelper.jsx     # Operator suggestion dropdown
│   │   ├── editor/
│   │   │   ├── Timeline.jsx           # Main drag-drop timeline
│   │   │   ├── ClipCard.jsx           # Individual clip in timeline
│   │   │   ├── TrimEditor.jsx         # In/out point scrubber
│   │   │   ├── FadeEditor.jsx         # Fade in/out controls
│   │   │   ├── TextOverlay.jsx        # Text overlay editor
│   │   │   ├── ScreenOverlay.jsx      # Screen overlay controls
│   │   │   └── PreviewPlayer.jsx      # Live preview window
│   │   ├── library/
│   │   │   ├── ClipLibrary.jsx        # Saved clips grid
│   │   │   └── ProjectList.jsx        # Saved projects
│   │   └── ui/
│   │       ├── Toolbar.jsx            # Main editor toolbar
│   │       └── CategoryPicker.jsx     # Custom category manager
│   ├── pages/
│   │   ├── SearchPage.jsx
│   │   ├── EditorPage.jsx
│   │   └── LibraryPage.jsx
│   ├── store/
│   │   ├── searchStore.js             # Search state & history
│   │   └── editorStore.js             # Timeline & clip state
│   ├── api/
│   │   ├── videoSearch.js             # Multi-source search aggregator
│   │   └── entities.js                # Base44 entity client
│   └── App.jsx
├── public/
├── package.json
└── vite.config.js
```

## Getting Started

```bash
npm install
npm run dev
```

Set your API keys in `.env`:
```
VITE_PIXABAY_API_KEY=your_key
VITE_PEXELS_API_KEY=your_key
```

## License

MIT © richt5128-cyber
