// src/store/contextStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

type AppContext =
  | { type: "personal" }
  | { type: "org"; orgId: string; role: string };

interface ContextStore {
  context: AppContext;
  setPersonal: () => void;
  setOrg: (orgId: string, role: string) => void;
}

export const useContextStore = create<ContextStore>()(
  persist(
    (set) => ({
      context: { type: "personal" },

      setPersonal: () =>
        set({
          context: { type: "personal" }
        }),

      setOrg: (orgId, role) =>
        set({
          context: { type: "org", orgId, role }
        })
    }),
    {
      name: "app-context" 
    }
  )
);
