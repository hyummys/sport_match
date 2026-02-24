import { create } from 'zustand';
import { SkillLevel } from '../lib/types';

interface FilterState {
  date: string | null;
  region: string | null;
  skillLevel: SkillLevel | null;
  setDate: (date: string | null) => void;
  setRegion: (region: string | null) => void;
  setSkillLevel: (level: SkillLevel | null) => void;
  resetFilters: () => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  date: null,
  region: null,
  skillLevel: null,
  setDate: (date) => set({ date }),
  setRegion: (region) => set({ region }),
  setSkillLevel: (skillLevel) => set({ skillLevel }),
  resetFilters: () => set({ date: null, region: null, skillLevel: null }),
}));
