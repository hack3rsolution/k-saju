import { create } from 'zustand';
import type { Relationship } from '../types/relationship';

interface RelationshipState {
  relationships: Relationship[];
  setRelationships: (list: Relationship[]) => void;
  addRelationship:  (rel: Relationship) => void;
  removeRelationship: (id: string) => void;
  updateRelationship: (id: string, patch: Partial<Relationship>) => void;
  clear: () => void;
}

export const useRelationshipStore = create<RelationshipState>((set) => ({
  relationships: [],

  setRelationships: (list) => set({ relationships: list }),

  addRelationship: (rel) =>
    set((s) => ({ relationships: [rel, ...s.relationships] })),

  removeRelationship: (id) =>
    set((s) => ({ relationships: s.relationships.filter((r) => r.id !== id) })),

  updateRelationship: (id, patch) =>
    set((s) => ({
      relationships: s.relationships.map((r) =>
        r.id === id ? { ...r, ...patch } : r,
      ),
    })),

  clear: () => set({ relationships: [] }),
}));
