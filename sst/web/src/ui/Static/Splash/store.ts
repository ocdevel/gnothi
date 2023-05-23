import {create} from "zustand";

type AuthTab = "signIn"|"signUp"|undefined
export const useLocalStore = create<{
  authTab: AuthTab
  setAuthTab: (authTab: AuthTab) => void
}>((set) => ({
  authTab: undefined,
  setAuthTab: (authTab) => set({authTab}),
}))
