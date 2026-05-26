"use client"

import { useEffect, useRef, useCallback } from "react"

const STORAGE_KEY = "os-virtual-lab-state"
const STORAGE_VERSION = 1
const DEBOUNCE_MS = 500

export interface PersistedState {
  storageVersion: number
  currentTab: string
  shortcutsEnabled: boolean
  evaluationResults: any[]
  tutorialProgress: {
    currentStep: number
    completedSteps: number[]
  }
  guidedScenariosProgress: {
    completedScenarios: string[]
  }
  savedAt: string
}

function getDefaultState(): PersistedState {
  return {
    storageVersion: STORAGE_VERSION,
    currentTab: "simulation",
    shortcutsEnabled: true,
    evaluationResults: [],
    tutorialProgress: {
      currentStep: 0,
      completedSteps: [],
    },
    guidedScenariosProgress: {
      completedScenarios: [],
    },
    savedAt: new Date().toISOString(),
  }
}

export function loadPersistedState(): PersistedState | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed.storageVersion !== STORAGE_VERSION) {
      // Schema mismatch - clear and start fresh
      localStorage.removeItem(STORAGE_KEY)
      return null
    }
    return parsed as PersistedState
  } catch {
    return null
  }
}

export function savePersistedState(state: PersistedState) {
  if (typeof window === "undefined") return
  try {
    state.savedAt = new Date().toISOString()
    state.storageVersion = STORAGE_VERSION
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Storage full or unavailable - fail silently
  }
}

export function clearPersistedState() {
  if (typeof window === "undefined") return
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // fail silently
  }
}

export function useDebouncedSave(getState: () => PersistedState) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const save = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      savePersistedState(getState())
    }, DEBOUNCE_MS)
  }, [getState])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return save
}
