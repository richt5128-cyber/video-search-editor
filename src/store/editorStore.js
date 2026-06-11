/**
 * editorStore.js
 * Zustand store for the timeline editor state.
 */
import { create } from 'zustand';
import { v4 as uuid } from 'uuid';

const useEditorStore = create((set, get) => ({
  /* ── Project ─────────────────────────────── */
  project: null,
  setProject: (project) => set({ project }),

  /* ── Timeline clips ──────────────────────── */
  clips: [],        // ordered array of clip objects in timeline
  selected: [],     // array of clip IDs currently selected

  /* ── Playback ────────────────────────────── */
  currentTime: 0,
  playing: false,
  setCurrentTime: (t) => set({ currentTime: t }),
  setPlaying: (v) => set({ playing: v }),

  /* ── Clip CRUD ───────────────────────────── */

  addClip: (clipData) => set(state => ({
    clips: [...state.clips, {
      id: uuid(),
      title: clipData.title || 'Untitled',
      url: clipData.downloadUrl || clipData.url,
      thumbnail: clipData.thumbnail,
      duration: clipData.duration || 0,
      source: clipData.source,
      start_trim: 0,
      end_trim: clipData.duration || 0,
      fade_in: 0,
      fade_out: 0,
      text_overlays: [],
      screen_overlays: [],
      order: state.clips.length,
      volume: 1,
    }]
  })),

  removeClip: (id) => set(state => ({
    clips: state.clips.filter(c => c.id !== id).map((c, i) => ({ ...c, order: i })),
    selected: state.selected.filter(s => s !== id),
  })),

  replaceClip: (id, newClipData) => set(state => ({
    clips: state.clips.map(c => c.id === id ? {
      ...c,
      title: newClipData.title || c.title,
      url: newClipData.downloadUrl || newClipData.url || c.url,
      thumbnail: newClipData.thumbnail || c.thumbnail,
      duration: newClipData.duration || c.duration,
      start_trim: 0,
      end_trim: newClipData.duration || c.duration,
    } : c)
  })),

  updateClip: (id, patch) => set(state => ({
    clips: state.clips.map(c => c.id === id ? { ...c, ...patch } : c)
  })),

  reorderClips: (newOrder) => set({ clips: newOrder.map((c, i) => ({ ...c, order: i })) }),

  /* ── Selection ───────────────────────────── */

  selectClip: (id, multi = false) => set(state => {
    if (multi) {
      return state.selected.includes(id)
        ? { selected: state.selected.filter(s => s !== id) }
        : { selected: [...state.selected, id] };
    }
    return { selected: [id] };
  }),

  selectRange: (fromId, toId) => set(state => {
    const ids = state.clips.map(c => c.id);
    const a = ids.indexOf(fromId), b = ids.indexOf(toId);
    if (a === -1 || b === -1) return {};
    const [lo, hi] = [Math.min(a, b), Math.max(a, b)];
    return { selected: ids.slice(lo, hi + 1) };
  }),

  clearSelection: () => set({ selected: [] }),

  removeSelected: () => set(state => ({
    clips: state.clips.filter(c => !state.selected.includes(c.id)).map((c, i) => ({ ...c, order: i })),
    selected: [],
  })),

  /* ── Trim ────────────────────────────────── */

  setTrim: (id, start_trim, end_trim) => set(state => ({
    clips: state.clips.map(c => c.id === id ? { ...c, start_trim, end_trim } : c)
  })),

  /* ── Fades ───────────────────────────────── */

  setFadeIn:  (id, val) => set(state => ({ clips: state.clips.map(c => c.id === id ? { ...c, fade_in:  val } : c) })),
  setFadeOut: (id, val) => set(state => ({ clips: state.clips.map(c => c.id === id ? { ...c, fade_out: val } : c) })),

  /* ── Text Overlays ───────────────────────── */

  addTextOverlay: (clipId, overlay) => set(state => ({
    clips: state.clips.map(c => c.id === clipId ? {
      ...c,
      text_overlays: [...c.text_overlays, { id: uuid(), ...overlay }]
    } : c)
  })),

  updateTextOverlay: (clipId, overlayId, patch) => set(state => ({
    clips: state.clips.map(c => c.id === clipId ? {
      ...c,
      text_overlays: c.text_overlays.map(o => o.id === overlayId ? { ...o, ...patch } : o)
    } : c)
  })),

  removeTextOverlay: (clipId, overlayId) => set(state => ({
    clips: state.clips.map(c => c.id === clipId ? {
      ...c,
      text_overlays: c.text_overlays.filter(o => o.id !== overlayId)
    } : c)
  })),

  /* ── Screen Overlays ─────────────────────── */

  addScreenOverlay: (clipId, overlay) => set(state => ({
    clips: state.clips.map(c => c.id === clipId ? {
      ...c,
      screen_overlays: [...(c.screen_overlays || []), { id: uuid(), ...overlay }]
    } : c)
  })),

  removeScreenOverlay: (clipId, overlayId) => set(state => ({
    clips: state.clips.map(c => c.id === clipId ? {
      ...c,
      screen_overlays: (c.screen_overlays || []).filter(o => o.id !== overlayId)
    } : c)
  })),

  /* ── Cut / Copy / Paste (clipboard) ─────── */

  clipboard: null,

  cutClip: (id) => set(state => {
    const clip = state.clips.find(c => c.id === id);
    return {
      clipboard: clip ? { ...clip } : state.clipboard,
      clips: state.clips.filter(c => c.id !== id).map((c, i) => ({ ...c, order: i })),
    };
  }),

  copyClip: (id) => set(state => {
    const clip = state.clips.find(c => c.id === id);
    return { clipboard: clip ? { ...clip } : state.clipboard };
  }),

  pasteClip: (afterId) => set(state => {
    if (!state.clipboard) return {};
    const newClip = { ...state.clipboard, id: uuid() };
    const idx = state.clips.findIndex(c => c.id === afterId);
    const next = [...state.clips];
    next.splice(idx + 1, 0, newClip);
    return { clips: next.map((c, i) => ({ ...c, order: i })) };
  }),

  /* ── Total duration ──────────────────────── */

  getTotalDuration: () => {
    return get().clips.reduce((sum, c) => sum + ((c.end_trim || 0) - (c.start_trim || 0)), 0);
  },
}));

export default useEditorStore;
