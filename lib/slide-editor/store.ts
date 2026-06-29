import { create } from "zustand";
import { Slide, DesignSystem, SlideElement, CanvasFormat, CANVAS_FORMATS } from "./types";

type HistoryEntry = { past: Slide[][]; future: Slide[][] };

interface SlideEditorState {
  slides: Slide[];
  activeSlideIndex: number;
  activeElementId: string | null;
  theme: DesignSystem | null;
  canvasFormat: CanvasFormat;
  history: HistoryEntry;
  addSlide: (slide: Slide) => void;
  removeSlide: (index: number) => void;
  reorderSlides: (from: number, to: number) => void;
  setActiveSlide: (index: number) => void;
  setActiveElement: (id: string | null) => void;
  updateSlide: (index: number, updates: Partial<Slide>) => void;
  updateElement: (slideIndex: number, elementId: string, props: Record<string, unknown>) => void;
  addElement: (slideIndex: number, element: SlideElement) => void;
  removeElement: (slideIndex: number, elementId: string) => void;
  setTheme: (theme: DesignSystem) => void;
  setSlides: (slides: Slide[]) => void;
  setCanvasFormat: (format: CanvasFormat) => void;
  undo: () => void;
  redo: () => void;
  duplicateElement: (slideIndex: number, elementId: string) => void;
}

const STORAGE_KEY = "slide-editor-state";
const PROJECTS_KEY = "slide-editor-projects";

export type SavedProject = {
  id: string;
  name: string;
  savedAt: string;
  slides: Slide[];
  canvasFormat: CanvasFormat;
  theme: DesignSystem | null;
  thumbnail?: string; // first slide background
};

export function saveProject(name: string): SavedProject | null {
  if (typeof window === "undefined") return null;
  const state = useSlideEditorStore.getState();
  const project: SavedProject = {
    id: `proj_${Date.now()}`,
    name: name.trim() || `Projeto ${new Date().toLocaleDateString("pt-BR")}`,
    savedAt: new Date().toISOString(),
    slides: state.slides,
    canvasFormat: state.canvasFormat,
    theme: state.theme,
    thumbnail: state.slides[0]?.backgroundImage || state.slides[0]?.background,
  };
  const projects = listProjects();
  projects.unshift(project);
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  return project;
}

export function listProjects(): SavedProject[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(PROJECTS_KEY) || "[]");
  } catch {
    return [];
  }
}

export function loadProject(id: string): boolean {
  if (typeof window === "undefined") return false;
  const projects = listProjects();
  const project = projects.find((p) => p.id === id);
  if (!project) return false;
  useSlideEditorStore.setState({
    slides: project.slides,
    canvasFormat: project.canvasFormat,
    theme: project.theme,
    activeSlideIndex: 0,
    activeElementId: null,
    history: { past: [], future: [] },
  });
  return true;
}

export function deleteProject(id: string) {
  if (typeof window === "undefined") return;
  const projects = listProjects().filter((p) => p.id !== id);
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
}

function loadFromStorage(): Partial<SlideEditorState> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      return {
        slides: data.slides || [],
        activeSlideIndex: data.activeSlideIndex || 0,
        theme: data.theme || null,
        canvasFormat: data.canvasFormat || CANVAS_FORMATS[0],
      };
    }
  } catch {}
  return {};
}

// Hydrate store after mount to avoid hydration mismatch
let _hydrated = false;
export function hydrateStore() {
  if (_hydrated || typeof window === "undefined") return;
  _hydrated = true;
  const saved = loadFromStorage();
  if (saved.slides?.length) {
    useSlideEditorStore.setState({
      slides: saved.slides,
      activeSlideIndex: saved.activeSlideIndex || 0,
      theme: saved.theme || null,
      canvasFormat: saved.canvasFormat || CANVAS_FORMATS[0],
    });
  }
}

function saveToStorage(state: SlideEditorState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        slides: state.slides,
        activeSlideIndex: state.activeSlideIndex,
        theme: state.theme,
        canvasFormat: state.canvasFormat,
      })
    );
  } catch {}
}

function pushHistory(state: SlideEditorState): HistoryEntry {
  return {
    past: [...state.history.past.slice(-50), state.slides],
    future: [],
  };
}

export const useSlideEditorStore = create<SlideEditorState>((set) => ({
  slides: [],
  activeSlideIndex: 0,
  activeElementId: null,
  theme: null,
  canvasFormat: CANVAS_FORMATS[0],
  history: { past: [], future: [] },

  addSlide: (slide) =>
    set((s) => {
      const next = {
        slides: [...s.slides, slide],
        activeSlideIndex: s.slides.length,
        history: pushHistory(s),
      };
      setTimeout(() => saveToStorage({ ...s, ...next }), 0);
      return next;
    }),

  removeSlide: (index) =>
    set((s) => {
      if (s.slides.length <= 1) return s;
      const next = s.slides.filter((_, i) => i !== index);
      const result = {
        slides: next,
        activeSlideIndex: Math.min(s.activeSlideIndex, next.length - 1),
        history: pushHistory(s),
      };
      setTimeout(() => saveToStorage({ ...s, ...result }), 0);
      return result;
    }),

  reorderSlides: (from, to) =>
    set((s) => {
      const next = [...s.slides];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      const result = { slides: next, activeSlideIndex: to, history: pushHistory(s) };
      setTimeout(() => saveToStorage({ ...s, ...result }), 0);
      return result;
    }),

  setActiveSlide: (index) => set({ activeSlideIndex: index, activeElementId: null }),
  setActiveElement: (id) => set({ activeElementId: id }),

  updateSlide: (index, updates) =>
    set((s) => {
      const newSlides = s.slides.map((sl, i) => {
        if (i !== index) return sl;
        const merged = { ...sl };
        if (updates.background !== undefined) merged.background = updates.background;
        if (updates.backgroundGradient !== undefined) merged.backgroundGradient = updates.backgroundGradient;
        if (updates.backgroundImage !== undefined) merged.backgroundImage = updates.backgroundImage;
        if (updates.elements !== undefined) merged.elements = updates.elements;
        if (updates.type !== undefined) merged.type = updates.type;
        return merged;
      });
      const result = { slides: newSlides, history: pushHistory(s) };
      setTimeout(() => saveToStorage({ ...s, ...result }), 0);
      return result;
    }),

  updateElement: (slideIndex, elementId, props) =>
    set((s) => {
      const newSlides = s.slides.map((sl, i) => {
        if (i !== slideIndex) return sl;
        return {
          ...sl,
          elements: sl.elements.map((el) => {
            if (el.id !== elementId) return el;
            return { ...el, props: { ...el.props, ...props } } as typeof el;
          }),
        };
      });
      const result = { slides: newSlides, history: pushHistory(s) };
      setTimeout(() => saveToStorage({ ...s, ...result }), 0);
      return result;
    }),

  addElement: (slideIndex, element) =>
    set((s) => {
      const result = {
        slides: s.slides.map((sl, i) =>
          i === slideIndex ? { ...sl, elements: [...sl.elements, element] } : sl
        ),
        history: pushHistory(s),
      };
      setTimeout(() => saveToStorage({ ...s, ...result }), 0);
      return result;
    }),

  removeElement: (slideIndex, elementId) =>
    set((s) => {
      const result = {
        slides: s.slides.map((sl, i) =>
          i === slideIndex
            ? { ...sl, elements: sl.elements.filter((el) => el.id !== elementId) }
            : sl
        ),
        activeElementId: s.activeElementId === elementId ? null : s.activeElementId,
        history: pushHistory(s),
      };
      setTimeout(() => saveToStorage({ ...s, ...result }), 0);
      return result;
    }),

  setTheme: (theme) =>
    set((s) => {
      setTimeout(() => saveToStorage({ ...s, theme }), 0);
      return { theme };
    }),

  setSlides: (slides) =>
    set((s) => {
      const result = { slides, activeSlideIndex: 0 };
      setTimeout(() => saveToStorage({ ...s, ...result }), 0);
      return result;
    }),

  setCanvasFormat: (format) =>
    set((s) => {
      setTimeout(() => saveToStorage({ ...s, canvasFormat: format }), 0);
      return { canvasFormat: format };
    }),

  undo: () =>
    set((s) => {
      if (s.history.past.length === 0) return s;
      const prev = s.history.past[s.history.past.length - 1];
      const result = {
        slides: prev,
        history: {
          past: s.history.past.slice(0, -1),
          future: [s.slides, ...s.history.future],
        },
      };
      setTimeout(() => saveToStorage({ ...s, ...result }), 0);
      return result;
    }),

  redo: () =>
    set((s) => {
      if (s.history.future.length === 0) return s;
      const next = s.history.future[0];
      const result = {
        slides: next,
        history: {
          past: [...s.history.past, s.slides],
          future: s.history.future.slice(1),
        },
      };
      setTimeout(() => saveToStorage({ ...s, ...result }), 0);
      return result;
    }),

  duplicateElement: (slideIndex, elementId) =>
    set((s) => {
      const slide = s.slides[slideIndex];
      const el = slide?.elements.find((e) => e.id === elementId);
      if (!el) return s;
      const dup = {
        ...el,
        id: `el_dup_${Date.now()}`,
        x: el.x + 20,
        y: el.y + 20,
      };
      const result = {
        slides: s.slides.map((sl, i) =>
          i === slideIndex ? { ...sl, elements: [...sl.elements, dup] } : sl
        ),
        history: pushHistory(s),
      };
      setTimeout(() => saveToStorage({ ...s, ...result }), 0);
      return result;
    }),
}));

export function setupKeyboardShortcuts() {
  if (typeof window === "undefined") return;

  window.addEventListener("keydown", (e) => {
    const store = useSlideEditorStore.getState();
    const target = e.target as HTMLElement;
    const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;

    if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
      e.preventDefault();
      store.undo();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === "z" && e.shiftKey) {
      e.preventDefault();
      store.redo();
    }
    if (e.key === "Delete" && !isInput && store.activeElementId) {
      e.preventDefault();
      store.removeElement(store.activeSlideIndex, store.activeElementId);
    }
    if ((e.ctrlKey || e.metaKey) && e.key === "d" && store.activeElementId) {
      e.preventDefault();
      store.duplicateElement(store.activeSlideIndex, store.activeElementId);
    }
  });
}
