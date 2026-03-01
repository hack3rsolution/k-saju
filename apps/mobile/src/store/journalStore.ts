import { create } from 'zustand';
import type { LifeEvent } from '../types/journal';

interface JournalState {
  events:    LifeEvent[];
  setEvents: (list: LifeEvent[]) => void;
  addEvent:  (event: LifeEvent) => void;
  removeEvent: (id: string) => void;
  clear:     () => void;
}

export const useJournalStore = create<JournalState>((set) => ({
  events: [],

  setEvents: (list) => set({ events: list }),

  addEvent: (event) =>
    set((s) => ({ events: [event, ...s.events] })),

  removeEvent: (id) =>
    set((s) => ({ events: s.events.filter((e) => e.id !== id) })),

  clear: () => set({ events: [] }),
}));
