# mdviewer

A fast, native Markdown viewer and editor for Linux. Opens instantly when you click a `.md` file in your file manager.

> **Linux only.** Built with Tauri + WebKit2GTK — no bundled browser, no Electron. The binary is ~10 MB and starts in under a second.

---

## Features

- **Three view modes** — Editor, Preview, or side-by-side Split (resizable)
- **Syntax highlighting** — Shiki with GitHub Light theme, 20+ languages
- **Mermaid diagrams** — rendered live in the preview pane
- **Tabbed workflow** — open multiple files, middle-click or `×` to close
- **Left sidebar** — recent files and folder tree, drag to resize
- **Right outline panel** — collapsible heading tree, click to scroll preview (Preview/Split modes)
- **Find in preview** — `Ctrl+F` highlights and navigates matches
- **Find & replace in editor** — CodeMirror's built-in `Ctrl+F` / `Ctrl+H`
- **File watching** — auto-reloads when a file is edited externally
- **Single instance** — opening a second `.md` file focuses the existing window and opens a new tab
- **File association** — set as default app for `.md` files via `xdg-mime`

---

## Prerequisites

Install these before building:

```bash
# Rust toolchain
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source "$HOME/.cargo/env"

# Node.js 18+ (via nvm or your distro's package manager)
# e.g. on Ubuntu/Kubuntu:
sudo apt install nodejs npm

# Tauri system dependencies (WebKit2GTK + build tools)
sudo apt install -y \
  libwebkit2gtk-4.1-dev \
  libgtk-3-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev \
  patchelf \
  build-essential \
  curl \
  wget \
  file \
  libssl-dev \
  libxdo-dev
```

---

## Installation

### Quick install (recommended)

Clone the repo and run the install script. It builds the app, installs the `.deb`, and registers the file association — all in one step.

```bash
git clone https://github.com/darahask/mdviewer.git
cd mdviewer
npm install
./install.sh
```

After this, double-clicking any `.md` file in Dolphin (or any XDG-compliant file manager) will open mdviewer.

### Reinstall / rebuild flags

```bash
./install.sh --rebuild     # Force a fresh Tauri build even if sources haven't changed
./install.sh --reinstall   # Force reinstall the .deb even if version matches
./install.sh --rebuild --reinstall  # Both
```

### Uninstall

```bash
sudo apt remove mdviewer
rm -f ~/.local/share/applications/mdviewer.desktop
update-desktop-database ~/.local/share/applications
```

---

## Development

```bash
# Install JS dependencies
npm install

# Start dev server with hot reload
npm run tauri dev
```

The app launches with Vite HMR — frontend changes reflect instantly. Rust backend changes trigger a recompile.

---

## Keyboard shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+1` | Switch to Editor mode |
| `Ctrl+2` | Switch to Preview mode |
| `Ctrl+3` | Switch to Split mode |
| `Ctrl+S` | Save current file |
| `Ctrl+W` | Close current tab |
| `Ctrl+T` | Open file picker |
| `Ctrl+B` | Toggle sidebar |
| `Ctrl+F` | Find in preview / Find in editor |
| `Ctrl+H` | Find & replace in editor |

---

## Stack

| Layer | Technology |
|---|---|
| App shell | [Tauri v2](https://tauri.app) |
| Frontend | React 18 + TypeScript + Vite |
| Markdown | markdown-it + markdown-it-anchor + markdown-it-task-lists |
| Syntax highlighting | Shiki (GitHub Light) |
| Diagrams | Mermaid.js |
| Editor | CodeMirror 6 |
| State | Zustand |
| File watching | notify (Rust) |
