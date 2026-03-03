"use client"

import { useState, useEffect, useCallback } from "react"
import type { AnalysisResult, ContentCard } from "@/lib/types"

export function useLibraryCards() {
  const [cards, setCards] = useState<ContentCard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCards = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/library")
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "라이브러리를 불러오지 못했습니다.")
      } else {
        setCards(data.cards ?? [])
      }
    } catch {
      setError("서버에 연결할 수 없습니다.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCards()
  }, [fetchCards])

  async function deleteCard(id: string) {
    const res = await fetch(`/api/library/${id}`, { method: "DELETE" })
    if (res.ok) {
      setCards((prev) => prev.filter((c) => c.id !== id))
    }
    return res.ok
  }

  async function toggleFavorite(id: string, current: boolean) {
    const res = await fetch(`/api/library/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isFavorite: !current }),
    })
    if (res.ok) {
      setCards((prev) =>
        prev.map((c) => (c.id === id ? { ...c, isFavorite: !current } : c)),
      )
    }
    return res.ok
  }

  async function updateAnalysis(id: string, analysis: AnalysisResult) {
    const res = await fetch(`/api/library/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ analysis }),
    })
    if (res.ok) {
      setCards((prev) =>
        prev.map((c) => (c.id === id ? { ...c, analysis } : c)),
      )
    }
    return res.ok
  }

  return { cards, loading, error, refetch: fetchCards, deleteCard, toggleFavorite, updateAnalysis }
}
