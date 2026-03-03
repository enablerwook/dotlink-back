"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import type { ContentCard } from "@/domains/library/types"

// libraryCards는 각 페이지에서 useLibraryCards()로 직접 fetch
// AppContext는 페이지 간 selectedCardA 공유만 담당
interface AppContextType {
  selectedCardA: ContentCard | null
  setSelectedCardA: (card: ContentCard | null) => void
}

const AppContext = createContext<AppContextType | null>(null)

export function useAppContext() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error("useAppContext must be used within AppProvider")
  return ctx
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [selectedCardA, setSelectedCardA] = useState<ContentCard | null>(null)

  return (
    <AppContext.Provider value={{ selectedCardA, setSelectedCardA }}>
      {children}
    </AppContext.Provider>
  )
}
