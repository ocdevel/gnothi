import {create} from "zustand";

interface UseLocalStore {
  users: Record<string, boolean>
  setUsers: (users: Record<string, boolean>) => void
  tags: Record<string, boolean>
  setTags: (tags: Record<string, boolean>) => void
  groups: Record<string, boolean>
  setGroups: (groups: Record<string, boolean>) => void
}
export const useLocalStore = create<UseLocalStore>((set, get) => ({
  users: {},
  setUsers: (users) => set({users}),
  tags: {},
  setTags: (tags) => set({tags}),
  groups: {},
  setGroups: (groups) => set({groups}),
}))