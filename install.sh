#!/usr/bin/env bash
# Build, install, and register mdviewer as default for .md files.
# Idempotent — safe to run multiple times.
#
# Flags:
#   --reinstall   Force reinstall even if version matches
#   --rebuild     Force rebuild even if source hasn't changed

set -e

REINSTALL=false
REBUILD=false
for arg in "$@"; do
  case $arg in
    --reinstall) REINSTALL=true ;;
    --rebuild)   REBUILD=true ;;
    *) echo "Unknown flag: $arg"; echo "Usage: $0 [--reinstall] [--rebuild]"; exit 1 ;;
  esac
done

DEB="src-tauri/target/release/bundle/deb/mdviewer_0.1.0_amd64.deb"
DESKTOP_DEST="$HOME/.local/share/applications/mdviewer.desktop"
INSTALLED_BIN="/usr/bin/mdviewer"

# Step 1 — build only if deb is missing, source is newer, or --rebuild
needs_build() {
  $REBUILD && return 0
  [ ! -f "$DEB" ] && return 0
  find src src-tauri/src src-tauri/Cargo.toml src-tauri/tauri.conf.json \
    -newer "$DEB" -print -quit 2>/dev/null | grep -q . && return 0
  return 1
}

if needs_build; then
  echo "Building mdviewer..."
  npm run tauri build
else
  echo "Build is up to date, skipping build."
fi

# Step 2 — install only if not installed, version differs, or --reinstall
INSTALLED_VERSION=$(dpkg-query -W -f='${Version}' mdviewer 2>/dev/null || echo "none")
DEB_VERSION=$(dpkg-deb -f "$DEB" Version 2>/dev/null || echo "unknown")

if $REINSTALL || [ "$INSTALLED_VERSION" != "$DEB_VERSION" ]; then
  echo "Installing mdviewer $DEB_VERSION..."
  sudo apt install -y "./$DEB"
else
  echo "mdviewer $INSTALLED_VERSION already installed, skipping."
fi

# Step 3 — write .desktop file (overwrite is safe — same content)
mkdir -p "$(dirname "$DESKTOP_DEST")"
cat > "$DESKTOP_DEST" <<EOF
[Desktop Entry]
Name=mdviewer
Comment=Markdown Viewer and Editor
Exec=$INSTALLED_BIN %f
Icon=mdviewer
Terminal=false
Type=Application
MimeType=text/markdown;text/x-markdown;
Categories=Office;TextEditor;Viewer;
StartupNotify=true
EOF

# Step 4 — register MIME types (xdg-mime is idempotent)
update-desktop-database "$HOME/.local/share/applications" 2>/dev/null || true
xdg-mime default mdviewer.desktop text/markdown
xdg-mime default mdviewer.desktop text/x-markdown

echo ""
echo "Done! mdviewer $DEB_VERSION is installed and set as default for .md files."
echo "Double-click any .md file in Dolphin to open it."
