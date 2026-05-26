"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { ProcessSchedulingSimulation } from "@/components/process-scheduling-simulation"
import { GuidedTutorial } from "@/components/guided-tutorial"
import { GuidedScenarios } from "@/components/guided-scenarios"
import { ScenarioEvaluation } from "@/components/scenario-evaluation"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { KeyboardShortcutsDialog } from "@/components/keyboard-shortcuts-dialog"
import { useKeyboardShortcuts, type ShortcutAction } from "@/hooks/use-keyboard-shortcuts"
import {
  loadPersistedState,
  savePersistedState,
  clearPersistedState,
  type PersistedState,
} from "@/hooks/use-persistence"
import { RotateCcw } from "lucide-react"

export default function OSVirtualLab() {
  const [hydrated, setHydrated] = useState(false)
  const [currentTab, setCurrentTab] = useState("simulation")
  const [shortcutsEnabled, setShortcutsEnabled] = useState(true)
  const [evaluationResults, setEvaluationResults] = useState<any[]>([])
  const [completedScenarios, setCompletedScenarios] = useState<string[]>([])

  // Hydrate from localStorage on mount
  useEffect(() => {
    const saved = loadPersistedState()
    if (saved) {
      setCurrentTab(saved.currentTab)
      setShortcutsEnabled(saved.shortcutsEnabled)
      setEvaluationResults(saved.evaluationResults ?? [])
      setCompletedScenarios(saved.guidedScenariosProgress?.completedScenarios ?? [])
    }
    setHydrated(true)
  }, [])

  // Auto-save on meaningful state changes (debounced)
  const getStateForSave = useCallback((): PersistedState => ({
    storageVersion: 1,
    currentTab,
    shortcutsEnabled,
    evaluationResults,
    tutorialProgress: { currentStep: 0, completedSteps: [] },
    guidedScenariosProgress: { completedScenarios },
    savedAt: new Date().toISOString(),
  }), [currentTab, shortcutsEnabled, evaluationResults, completedScenarios])

  useEffect(() => {
    if (!hydrated) return
    const timer = setTimeout(() => {
      savePersistedState(getStateForSave())
    }, 500)
    return () => clearTimeout(timer)
  }, [hydrated, getStateForSave])

  const handleResetAll = () => {
    if (window.confirm("This will clear all saved data including evaluation results, scenario progress, and preferences. Continue?")) {
      clearPersistedState()
      setCurrentTab("simulation")
      setShortcutsEnabled(true)
      setEvaluationResults([])
      setCompletedScenarios([])
    }
  }

  const shortcuts: ShortcutAction[] = useMemo(
    () => [
      {
        key: "1",
        alt: true,
        label: "Simulation Tab",
        description: "Switch to Simulation tab",
        category: "Navigation",
        action: () => setCurrentTab("simulation"),
      },
      {
        key: "2",
        alt: true,
        label: "Tutorial Tab",
        description: "Switch to Tutorial tab",
        category: "Navigation",
        action: () => setCurrentTab("manual"),
      },
      {
        key: "3",
        alt: true,
        label: "Scenarios Tab",
        description: "Switch to Guided Scenarios tab",
        category: "Navigation",
        action: () => setCurrentTab("guided-scenarios"),
      },
      {
        key: "4",
        alt: true,
        label: "Evaluation Tab",
        description: "Switch to Evaluation tab",
        category: "Navigation",
        action: () => setCurrentTab("evaluation"),
      },
    ],
    [],
  )

  useKeyboardShortcuts(shortcuts, shortcutsEnabled)

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border bg-card">
          <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-4">
            <div className="flex items-center justify-between gap-2">
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">
                Process Life Cycle Management
              </h1>
              <div className="flex items-center gap-2">
                <KeyboardShortcutsDialog
                  shortcuts={shortcuts}
                  enabled={shortcutsEnabled}
                  onToggle={setShortcutsEnabled}
                />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" onClick={handleResetAll} className="text-xs sm:text-sm gap-1" aria-label="Reset all saved data">
                      <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">Reset All</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Clear all saved data and return to initial state</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 max-w-7xl">
          <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-4 sm:mb-6 h-auto">
              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger
                    value="simulation"
                    className={`text-xs sm:text-sm px-1 sm:px-3 py-2 break-words transition-colors ${
                      currentTab === "simulation"
                        ? "bg-white text-black border border-blue-200 shadow-sm"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <span className="hidden sm:inline">Simulation</span>
                    <span className="sm:hidden">Sim</span>
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Interactive process life cycle simulation (Alt+1)</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger
                    value="manual"
                    className={`text-xs sm:text-sm px-1 sm:px-3 py-2 break-words transition-colors ${
                      currentTab === "manual"
                        ? "bg-white text-black border border-blue-200 shadow-sm"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <span className="hidden sm:inline">Tutorial</span>
                    <span className="sm:hidden">Guide</span>
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Comprehensive tutorial with hands-on practice (Alt+2)</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger
                    value="guided-scenarios"
                    className={`text-xs sm:text-sm px-1 sm:px-3 py-2 break-words transition-colors ${
                      currentTab === "guided-scenarios"
                        ? "bg-white text-black border border-blue-200 shadow-sm"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <span className="hidden sm:inline">Scenarios</span>
                    <span className="sm:hidden">Guided</span>
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Step-by-step guided learning scenarios (Alt+3)</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <TabsTrigger
                    value="evaluation"
                    className={`text-xs sm:text-sm px-1 sm:px-3 py-2 break-words transition-colors ${
                      currentTab === "evaluation"
                        ? "bg-white text-black border border-blue-200 shadow-sm"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <span className="hidden sm:inline">Evaluation</span>
                    <span className="sm:hidden">Eval</span>
                  </TabsTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Scenario-based assessment and evaluation (Alt+4)</p>
                </TooltipContent>
              </Tooltip>
            </TabsList>

            <div className="overflow-hidden">
              <TabsContent value="simulation" className="mt-0" forceMount>
                <div className={currentTab !== "simulation" ? "hidden" : ""}>
                  <ProcessSchedulingSimulation />
                </div>
              </TabsContent>

              <TabsContent value="manual" className="mt-0" forceMount>
                <div className={currentTab !== "manual" ? "hidden" : ""}>
                  <GuidedTutorial />
                </div>
              </TabsContent>

              <TabsContent value="guided-scenarios" className="mt-0" forceMount>
                <div className={currentTab !== "guided-scenarios" ? "hidden" : ""}>
                  <GuidedScenarios
                    persistedCompletedScenarios={completedScenarios}
                    onCompletedScenariosChange={setCompletedScenarios}
                  />
                </div>
              </TabsContent>

              <TabsContent value="evaluation" className="mt-0" forceMount>
                <div className={currentTab !== "evaluation" ? "hidden" : ""}>
                  <ScenarioEvaluation
                    persistedResults={evaluationResults}
                    onResultsChange={setEvaluationResults}
                  />
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </main>
      </div>
    </TooltipProvider>
  )
}
