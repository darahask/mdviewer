import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ViewMode = 'editor' | 'preview' | 'split';

export interface Tab {
  id: string;
  path: string;
  filename: string;
  content: string;
  isDirty: boolean;
}

interface Store {
  tabs: Tab[];
  activeTabId: string | null;
  viewMode: ViewMode;
  sidebarOpen: boolean;
  recentFiles: string[];

  openTab: (path: string, content: string) => void;
  closeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  updateTabContent: (id: string, content: string) => void;
  markTabSaved: (id: string) => void;
  setViewMode: (mode: ViewMode) => void;
  toggleSidebar: () => void;
  addRecentFile: (path: string) => void;
}

function pathToFilename(path: string): string {
  return path.split('/').pop() ?? path;
}

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      tabs: [],
      activeTabId: null,
      viewMode: 'split',
      sidebarOpen: true,
      recentFiles: [],

      openTab: (path, content) => {
        const existing = get().tabs.find((t) => t.path === path);
        if (existing) {
          set({ activeTabId: existing.id });
          return;
        }
        const id = `tab-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const tab: Tab = {
          id,
          path,
          filename: pathToFilename(path),
          content,
          isDirty: false,
        };
        set((s) => ({ tabs: [...s.tabs, tab], activeTabId: id }));
        get().addRecentFile(path);
      },

      closeTab: (id) => {
        const { tabs, activeTabId } = get();
        const idx = tabs.findIndex((t) => t.id === id);
        const next = tabs.filter((t) => t.id !== id);
        let nextActive = activeTabId;
        if (activeTabId === id) {
          nextActive = next[Math.min(idx, next.length - 1)]?.id ?? null;
        }
        set({ tabs: next, activeTabId: nextActive });
      },

      setActiveTab: (id) => set({ activeTabId: id }),

      updateTabContent: (id, content) =>
        set((s) => ({
          tabs: s.tabs.map((t) =>
            t.id === id ? { ...t, content, isDirty: true } : t
          ),
        })),

      markTabSaved: (id) =>
        set((s) => ({
          tabs: s.tabs.map((t) => (t.id === id ? { ...t, isDirty: false } : t)),
        })),

      setViewMode: (mode) => set({ viewMode: mode }),

      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

      addRecentFile: (path) =>
        set((s) => ({
          recentFiles: [
            path,
            ...s.recentFiles.filter((f) => f !== path),
          ].slice(0, 20),
        })),
    }),
    {
      name: 'mdviewer-store',
      partialize: (s) => ({
        viewMode: s.viewMode,
        sidebarOpen: s.sidebarOpen,
        recentFiles: s.recentFiles,
      }),
    }
  )
);
