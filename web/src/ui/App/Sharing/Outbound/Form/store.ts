import {create} from "zustand";
import {ShareProfileField} from "../../../../../../../schemas/shares.ts";

// excluding 'profile' for now since that's a client-side toggle of other fields. Revisit, need to account
// for other options we add
type ShareField = ShareProfileField & 'fields'

interface UseLocalStore {
  share: Record<ShareField, boolean>
  setShare: (share: Record<ShareField, boolean>) => void
  users: Record<string, boolean>
  setUsers: (users: Record<string, boolean>) => void
  tags: Record<string, boolean>
  setTags: (tags: Record<string, boolean>) => void
  groups: Record<string, boolean>
  setGroups: (groups: Record<string, boolean>) => void
}
export const useLocalStore = create<UseLocalStore>((set, get) => ({
  share: {},
  setShare: (share) => set({share}),
  users: {},
  setUsers: (users) => set({users}),
  tags: {},
  setTags: (tags) => set({tags}),
  groups: {},
  setGroups: (groups) => set({groups}),
}))