import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type AppMode = 'zakat' | 'qurban' | 'data-master'

interface AppStore {
  activeApp: AppMode
  setActiveApp: (app: AppMode) => void
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      activeApp: 'zakat',
      setActiveApp: (app) => set({ activeApp: app }),
    }),
    { name: 'al-fajar-active-app' }
  )
)
