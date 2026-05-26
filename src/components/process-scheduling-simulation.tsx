"use client"

import { useState, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Play, Pause, RotateCcw, AlertCircle, Clock, Cpu, Activity, Info, BookOpen, History, Download } from "lucide-react"
import { exportActionLogCSV, exportActionLogJSON, exportStateHistoryCSV, exportStateHistoryJSON } from "@/lib/export-utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { SimulationEngine, type SimulationProcess, type SimulationEvent } from "@/lib/simulation-engine"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface ProcessSchedulingSimulationProps {
  onEngineReady?: (engine: SimulationEngine) => void
  onStateChange?: (state: ReturnType<SimulationEngine["getState"]>) => void
}

export function ProcessSchedulingSimulation({ onEngineReady, onStateChange }: ProcessSchedulingSimulationProps = {}) {
  const [engine] = useState(() => new SimulationEngine())
  const [simulationState, setSimulationState] = useState(() => engine.getState())

  useEffect(() => {
    onEngineReady?.(engine)
  }, [engine, onEngineReady])
  const [isRunning, setIsRunning] = useState(false)
  const [alert, setAlert] = useState<{ message: string; type: "error" | "success" | "info" } | null>(null)
  const [selectedProcess, setSelectedProcess] = useState<number | null>(null)

  const refreshState = useCallback(() => {
    const newState = engine.getState()
    setSimulationState(newState)
    onStateChange?.(newState)
  }, [engine, onStateChange])

  const showAlert = useCallback((message: string, type: "error" | "success" | "info" = "error", force = false) => {
    if (type === "error" || force) {
      setAlert({ message, type })
      const duration = type === "error" ? 4000 : 3000
      setTimeout(() => setAlert(null), duration)
    }
  }, [])

  const handleStart = () => {
    setIsRunning(true)
    showAlert("Simulation started - processes will advance automatically", "success", true)
  }

  const handlePause = () => {
    setIsRunning(false)
    showAlert("Simulation paused - use manual controls to continue", "info", true)
  }

  const handleReset = () => {
    setIsRunning(false)
    engine.reset()
    refreshState()
    setAlert(null)
    setSelectedProcess(null)
    showAlert("Simulation reset - all processes and events cleared", "info", true)
  }

  const handleAdvanceClock = () => {
    const result = engine.advanceClock()
    refreshState()
    if (!result.success) {
      showAlert(`Clock advance failed: ${result.message}.`, "error")
    } else {
      showAlert(`Clock advanced to time ${result.message.split(" ").pop()}`, "success", true)
    }
  }

  const handleCreateProcess = () => {
    const result = engine.createProcess()
    refreshState()
    if (!result.success) {
      showAlert(`Process creation failed: ${result.message}`, "error")
    } else {
      showAlert(`New process created and added to Ready`, "success", true)
    }
  }

  const handleEventSelect = (eventId: number) => {
    engine.selectEvent(eventId)
    refreshState()
  }

  const handleProcessMove = (processId: number, destination: SimulationProcess["state"]) => {
    const result = engine.moveProcess(processId, destination)
    refreshState()
    if (!result.success) {
      showAlert(result.message, "error")
    } else {
      showAlert(`Process P${processId} successfully moved to ${destination} state`, "success", true)
    }
    setSelectedProcess(null)
  }

  const getProcessColor = (state: SimulationProcess["state"]) => {
    switch (state) {
      case "ready":
        return "bg-blue-500 hover:bg-blue-600"
      case "running":
        return "bg-green-500 hover:bg-green-600"
      case "blocked":
        return "bg-yellow-500 hover:bg-yellow-600"
      case "terminated":
        return "bg-gray-500 hover:bg-gray-600"
      default:
        return "bg-gray-300 hover:bg-gray-400"
    }
  }

  const getStateLabel = (state: SimulationProcess["state"]) => {
    switch (state) {
      case "ready":
        return "Ready"
      case "running":
        return "Running"
      case "blocked":
        return "I/O"
      case "terminated":
        return "Terminated"
      case "infant":
        return "Not Created"
      default:
        return "Unknown"
    }
  }

  const getEventColor = (event: SimulationEvent) => {
    if (event.name === "create_request") {
      return "bg-purple-50 text-purple-800 border-purple-200"
    }

    switch (event.type) {
      case "external":
        return "bg-red-100 text-red-800 border-red-200"
      case "internal":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  useEffect(() => {
    const logContainer = document.querySelector(".action-log-container")
    if (logContainer) {
      logContainer.scrollTop = logContainer.scrollHeight
    }

    const eventContainer = document.querySelector(".event-queue-container")
    if (eventContainer) {
      eventContainer.scrollTop = eventContainer.scrollHeight
    }
  }, [simulationState.actionLog, simulationState.events])

  const readyProcesses = simulationState.processes.filter((p) => p.state === "ready")
  const runningProcesses = simulationState.processes.filter((p) => p.state === "running")
  const blockedProcesses = simulationState.processes.filter((p) => p.state === "blocked")
  const terminatedProcesses = simulationState.processes.filter((p) => p.state === "terminated")
  const activeEvents = simulationState.events.filter((e) => e.state === "active")

  return (
    <TooltipProvider>
      <div className="space-y-4 sm:space-y-6 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {/* Controls Section */}
          <Card className="lg:col-span-1 xl:col-span-1 order-1">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                <Activity className="h-4 w-4 flex-shrink-0" />
                <span>Controls</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 cursor-help flex-shrink-0" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>
                      Use these controls to manage the simulation. Create processes and move them between states to learn
                      the process life cycle.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-col gap-2">
                {!isRunning ? (
                  <Button
                    onClick={handleStart}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm w-full"
                  >
                    <Play className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    Start
                  </Button>
                ) : (
                  <Button
                    onClick={handlePause}
                    variant="outline"
                    className="flex items-center gap-2 bg-transparent text-xs sm:text-sm w-full"
                  >
                    <Pause className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    Pause
                  </Button>
                )}
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="flex items-center gap-2 bg-transparent text-xs sm:text-sm w-full"
                >
                  <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 flex-shrink-0" />
                  Reset
                </Button>
                <Button
                  onClick={handleAdvanceClock}
                  variant="outline"
                  className="flex items-center gap-2 bg-transparent text-xs sm:text-sm w-full"
                >
                  <Clock className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="hidden sm:inline">Advance Clock</span>
                  <span className="sm:hidden">Clock</span>
                </Button>
                <Button
                  onClick={handleCreateProcess}
                  className="bg-green-600 hover:bg-green-700 text-xs sm:text-sm w-full"
                >
                  <span className="hidden sm:inline">Create Process</span>
                  <span className="sm:hidden">Create</span>
                </Button>
              </div>

              {selectedProcess !== null && (
                <div className="border rounded-lg p-2 sm:p-3 bg-blue-50">
                  <h4 className="font-semibold mb-2 text-xs sm:text-sm">Move Process P{selectedProcess}:</h4>
                  <div className="grid grid-cols-2 gap-1">
                    <Button
                      size="sm"
                      onClick={() => handleProcessMove(selectedProcess, "running")}
                      className="bg-green-600 hover:bg-green-700 text-xs px-1 py-1"
                    >
                      {"→ CPU"}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleProcessMove(selectedProcess, "ready")}
                      className="bg-blue-600 hover:bg-blue-700 text-xs px-1 py-1"
                    >
                      {"→ Ready"}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleProcessMove(selectedProcess, "blocked")}
                      className="bg-yellow-600 hover:bg-yellow-700 text-xs px-1 py-1"
                    >
                      {"→ I/O"}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleProcessMove(selectedProcess, "terminated")}
                      variant="destructive"
                      className="text-xs px-1 py-1"
                    >
                      Terminate
                    </Button>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedProcess(null)}
                    className="w-full mt-2 text-xs"
                  >
                    Cancel
                  </Button>
                </div>
              )}

              <div className="space-y-2">
                <div className="text-xs sm:text-sm font-medium">Current Time:</div>
                <div className="text-lg sm:text-xl lg:text-2xl font-mono font-bold text-blue-600">
                  {simulationState.currentTime}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs sm:text-sm font-medium">Selected Process:</div>
                <div className="text-sm sm:text-base lg:text-lg font-mono">
                  {selectedProcess !== null ? `P${selectedProcess}` : "None"}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs sm:text-sm font-medium flex items-center gap-2">
                  Legend
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 cursor-help flex-shrink-0" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Color coding for different process states</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-gray-400 rounded-full flex-shrink-0"></div>
                    <span className="text-xs sm:text-sm">Not Created</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-500 rounded-full flex-shrink-0"></div>
                    <span className="text-xs sm:text-sm">Ready (waiting for CPU)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full flex-shrink-0"></div>
                    <span className="text-xs sm:text-sm">CPU (executing)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-yellow-500 rounded-full flex-shrink-0"></div>
                    <span className="text-xs sm:text-sm">I/O (waiting for I/O)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-gray-500 rounded-full flex-shrink-0"></div>
                    <span className="text-xs sm:text-sm">Terminated</span>
                  </div>
                </div>
              </div>

              <div className="border-t pt-3">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 flex-shrink-0" />
                  <span className="text-xs sm:text-sm font-medium">Valid Transitions</span>
                </div>
                <div className="text-xs space-y-1 text-muted-foreground">
                  <div>{"Ready → CPU (CPU allocation)"}</div>
                  <div>{"CPU → Ready (preemption)"}</div>
                  <div>{"CPU → I/O (I/O request)"}</div>
                  <div>{"I/O → Ready (I/O completion)"}</div>
                  <div>{"Ready → Terminated (process completes)"}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Simulation Area */}
          <Card className="lg:col-span-1 xl:col-span-2 border-2 border-green-200 relative overflow-hidden order-2 lg:order-2">
            {alert && (
              <div className="absolute top-2 sm:top-4 left-2 sm:left-4 right-2 sm:right-4 z-10">
                <Alert
                  className={`border-2 shadow-lg ${
                    alert.type === "error"
                      ? "border-red-200 bg-red-50"
                      : alert.type === "success"
                        ? "border-green-200 bg-green-50"
                        : "border-blue-200 bg-blue-50"
                  }`}
                >
                  <AlertCircle
                    className={`h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 ${
                      alert.type === "error"
                        ? "text-red-600"
                        : alert.type === "success"
                          ? "text-green-600"
                          : "text-blue-600"
                    }`}
                  />
                  <AlertDescription
                    className={`text-xs sm:text-sm break-words ${
                      alert.type === "error"
                        ? "text-red-800"
                        : alert.type === "success"
                          ? "text-green-800"
                          : "text-blue-800"
                    }`}
                  >
                    {alert.message}
                  </AlertDescription>
                </Alert>
              </div>
            )}

            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                <Cpu className="h-4 w-4 flex-shrink-0" />
                <span className="break-words flex-1 min-w-0">Process Life Cycle Simulation</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 cursor-help flex-shrink-0" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>
                      Interactive visualization of process states and event-driven transitions. Click processes to select
                      and move them between states.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-hidden">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 h-full">
                <div className="space-y-3 overflow-hidden flex flex-col h-full">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-xs sm:text-sm">Event Requests</h3>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 cursor-help flex-shrink-0" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          Events that drive process state changes - I/O requests, completions, and termination
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>

                  <div className="border rounded-lg p-2 bg-gray-50 overflow-hidden flex-1 flex flex-col">
                    <div className="flex-1 overflow-y-auto space-y-2 event-queue-container border-2 border-dashed border-gray-300 rounded-lg p-2">
                      {activeEvents.length === 0 ? (
                        <div className="text-center text-muted-foreground py-4 sm:py-8 text-xs">No active events</div>
                      ) : (
                        activeEvents.map((event) => (
                          <div
                            key={event.id}
                            className={`p-2 rounded-lg border cursor-pointer transition-all hover:shadow-md text-xs flex-shrink-0 ${getEventColor(event)} ${
                              simulationState.selectedEvent === event.id ? "ring-2 ring-blue-500 ring-inset" : ""
                            }`}
                            onClick={() => handleEventSelect(event.id)}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <div className="font-semibold text-xs break-words">{event.name}</div>
                                <div className="text-xs break-words">
                                  Process: P{event.processId} | Time: {event.time}
                                </div>
                              </div>
                              <Badge variant="outline" className="text-xs flex-shrink-0">
                                {event.type}
                              </Badge>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-3 overflow-hidden">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-xs sm:text-sm">Processes</h3>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-blue-600 cursor-help flex-shrink-0" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          Visual representation of processes in different states - Ready, CPU, I/O, and Terminated
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>

                  <div className="border rounded-lg p-2 bg-gray-50 overflow-hidden">
                    <h4 className="font-medium mb-2 flex items-center gap-2 text-xs sm:text-sm">
                      <Cpu className="h-3 w-3 flex-shrink-0" />
                      CPU (single slot)
                    </h4>
                    <div className="min-h-8 sm:min-h-10 border-2 border-dashed border-gray-300 rounded-lg p-1 sm:p-2 flex flex-wrap gap-1 overflow-hidden">
                      {runningProcesses.length === 0 ? (
                        <div className="text-muted-foreground text-xs">No process running</div>
                      ) : (
                        runningProcesses.map((process) => (
                          <div
                            key={process.id}
                            className={`px-1 sm:px-2 py-1 rounded text-white font-bold cursor-pointer transition-all hover:scale-105 text-xs flex-shrink-0 ${getProcessColor(process.state)} ${selectedProcess === process.id ? "ring-2 ring-offset-1 ring-blue-500" : ""}`}
                            onClick={() => setSelectedProcess(process.id)}
                          >
                            {process.name}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="border rounded-lg p-2 bg-gray-50 overflow-hidden">
                    <h4 className="font-medium mb-2 text-xs sm:text-sm">Ready</h4>
                    <div className="min-h-8 sm:min-h-10 border-2 border-dashed border-gray-300 rounded-lg p-1 sm:p-2 flex flex-wrap gap-1 overflow-hidden">
                      {readyProcesses.length === 0 ? (
                        <div className="text-muted-foreground text-xs">No processes ready</div>
                      ) : (
                        readyProcesses.map((process) => (
                          <div
                            key={process.id}
                            className={`px-1 sm:px-2 py-1 rounded text-white font-bold cursor-pointer transition-all hover:scale-105 text-xs flex-shrink-0 ${getProcessColor(process.state)} ${selectedProcess === process.id ? "ring-2 ring-offset-1 ring-blue-500" : ""}`}
                            onClick={() => setSelectedProcess(process.id)}
                          >
                            {process.name}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="border rounded-lg p-2 bg-gray-50 overflow-hidden">
                    <h4 className="font-medium mb-2 text-xs sm:text-sm">I/O</h4>
                    <div className="min-h-8 sm:min-h-10 border-2 border-dashed border-gray-300 rounded-lg p-1 sm:p-2 flex flex-wrap gap-1 overflow-hidden">
                      {blockedProcesses.length === 0 ? (
                        <div className="text-muted-foreground text-xs">No processes in I/O</div>
                      ) : (
                        blockedProcesses.map((process) => (
                          <div
                            key={process.id}
                            className={`px-1 sm:px-2 py-1 rounded text-white font-bold cursor-pointer transition-all hover:scale-105 text-xs flex-shrink-0 ${getProcessColor(process.state)} ${selectedProcess === process.id ? "ring-2 ring-offset-1 ring-blue-500" : ""}`}
                            onClick={() => setSelectedProcess(process.id)}
                          >
                            {process.name}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="border rounded-lg p-2 bg-gray-50 overflow-hidden">
                    <h4 className="font-medium mb-2 text-xs sm:text-sm">Terminated</h4>
                    <div className="min-h-8 sm:min-h-10 border-2 border-dashed border-gray-300 rounded-lg p-1 sm:p-2 flex flex-wrap gap-1 overflow-hidden">
                      {terminatedProcesses.length === 0 ? (
                        <div className="text-muted-foreground text-xs">No terminated processes</div>
                      ) : (
                        terminatedProcesses.map((process) => (
                          <div
                            key={process.id}
                            className={`px-1 sm:px-2 py-1 rounded text-white font-bold cursor-pointer transition-all hover:scale-105 text-xs flex-shrink-0 ${getProcessColor(process.state)} ${selectedProcess === process.id ? "ring-2 ring-offset-1 ring-blue-500" : ""}`}
                            onClick={() => setSelectedProcess(process.id)}
                          >
                            {process.name}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Metrics & Log */}
          <Card className="lg:col-span-2 xl:col-span-1 order-3">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                <span className="break-words flex-1 min-w-0">Metrics & Log</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 cursor-help flex-shrink-0" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>
                      Transition counts and qualitative state time tracking for learning analysis.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Valid Transitions</span>
                  <span className="font-mono font-semibold text-green-600">{simulationState.metrics.validTransitions}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Invalid Attempts</span>
                  <span className="font-mono font-semibold text-red-600">{simulationState.metrics.invalidAttempts}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Completed Processes</span>
                  <span className="font-mono font-semibold text-blue-600">{simulationState.metrics.completedProcesses}</span>
                </div>
              </div>

              {/* State Presence (Relative) - always visible */}
              <div className="space-y-2 border-t pt-3">
                <div className="text-xs sm:text-sm font-medium flex items-center gap-2">
                  State Presence (Relative)
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 text-blue-600 cursor-help flex-shrink-0" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Relative time each process has spent in each state, measured in simulation ticks. This is a qualitative indicator, not a performance measure.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                {Object.keys(simulationState.metrics.stateTimeTracking).length > 0 ? (
                  <div className="space-y-2 text-xs">
                    {Object.entries(simulationState.metrics.stateTimeTracking).map(([processName, times]) => {
                      const t = times as { ready: number; running: number; blocked: number }
                      const total = t.ready + t.running + t.blocked
                      return (
                        <div key={processName} className="border rounded p-2 bg-gray-50">
                          <div className="font-semibold mb-1">{processName}</div>
                          {total > 0 && (
                            <div className="w-full h-3 rounded-full overflow-hidden flex mb-1">
                              {t.ready > 0 && (
                                <div className="bg-blue-500 h-full" style={{ width: `${(t.ready / total) * 100}%` }} />
                              )}
                              {t.running > 0 && (
                                <div className="bg-green-500 h-full" style={{ width: `${(t.running / total) * 100}%` }} />
                              )}
                              {t.blocked > 0 && (
                                <div className="bg-yellow-500 h-full" style={{ width: `${(t.blocked / total) * 100}%` }} />
                              )}
                            </div>
                          )}
                          <div className="grid grid-cols-3 gap-1">
                            <div className="text-center">
                              <div className="text-blue-600 font-mono">{t.ready}</div>
                              <div className="text-muted-foreground">Ready</div>
                            </div>
                            <div className="text-center">
                              <div className="text-green-600 font-mono">{t.running}</div>
                              <div className="text-muted-foreground">CPU</div>
                            </div>
                            <div className="text-center">
                              <div className="text-yellow-600 font-mono">{t.blocked}</div>
                              <div className="text-muted-foreground">I/O</div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No process data yet. Create a process and advance the clock to see state presence tracking.</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="text-xs sm:text-sm font-medium flex items-center gap-2">
                  Action Log
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 cursor-help flex-shrink-0" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Chronological log of user actions and system events</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="max-h-32 sm:max-h-48 overflow-y-auto space-y-1 action-log-container border rounded-lg p-2 bg-gray-50">
                  {simulationState.actionLog.length === 0 ? (
                    <div className="text-center text-muted-foreground py-4 text-xs sm:text-sm">
                      No activity yet. Start the simulation to see logs.
                    </div>
                  ) : (
                    simulationState.actionLog
                      .slice(-20)
                      .reverse()
                      .map((log, index) => (
                        <div
                          key={index}
                          className={`text-xs p-2 rounded overflow-hidden ${
                            log.type === "error"
                              ? "bg-red-50 text-red-800 border border-red-200"
                              : log.type === "success"
                                ? "bg-green-50 text-green-800 border border-green-200"
                                : "bg-white text-gray-800 border border-gray-200"
                          }`}
                        >
                          <span className="font-mono">[{log.time}]</span>{" "}
                          <span className="break-words">{log.message}</span>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        {/* System States Panel */}
        <Card className="mt-4">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <History className="h-4 w-4 flex-shrink-0" />
              <span className="flex-1">System States</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 cursor-help flex-shrink-0" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Current snapshot of all process states and their transition history through the life cycle.</p>
                </TooltipContent>
              </Tooltip>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1" aria-label="Export data">
                    <Download className="h-3 w-3" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel className="text-xs">Action Log</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => exportActionLogCSV(simulationState.actionLog)} className="text-xs">
                    Action Log (CSV)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => exportActionLogJSON(simulationState.actionLog)} className="text-xs">
                    Action Log (JSON)
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-xs">State History</DropdownMenuLabel>
                  <DropdownMenuItem
                    onClick={() =>
                      exportStateHistoryCSV(
                        simulationState.processes.filter((p: SimulationProcess) => p.history.length > 0),
                      )
                    }
                    className="text-xs"
                  >
                    State History (CSV)
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      exportStateHistoryJSON(
                        simulationState.processes.filter((p: SimulationProcess) => p.history.length > 0),
                      )
                    }
                    className="text-xs"
                  >
                    State History (JSON)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Current State Summary */}
              <div>
                <h4 className="text-xs sm:text-sm font-semibold mb-2">Current State Summary</h4>
                <div className="border rounded-lg p-3 bg-gray-50 space-y-2 max-h-48 overflow-y-auto">
                  {simulationState.processes.filter((p: SimulationProcess) => p.state !== "infant").length === 0 ? (
                    <p className="text-xs text-muted-foreground">No active processes. Create a process to see state information.</p>
                  ) : (
                    simulationState.processes
                      .filter((p: SimulationProcess) => p.state !== "infant")
                      .map((p: SimulationProcess) => (
                        <div key={p.id} className="flex items-center justify-between text-xs border-b border-gray-200 pb-1 last:border-b-0 last:pb-0">
                          <span className="font-mono font-semibold">{p.name}</span>
                          <Badge className={`text-xs ${getProcessColor(p.state)} text-white border-0`}>
                            {getStateLabel(p.state)}
                          </Badge>
                        </div>
                      ))
                  )}
                  <div className="pt-2 border-t text-xs text-muted-foreground grid grid-cols-2 gap-1">
                    <div>Ready: <span className="font-mono font-semibold text-blue-600">{readyProcesses.length}</span></div>
                    <div>CPU: <span className="font-mono font-semibold text-green-600">{runningProcesses.length}</span></div>
                    <div>I/O: <span className="font-mono font-semibold text-yellow-600">{blockedProcesses.length}</span></div>
                    <div>Terminated: <span className="font-mono font-semibold text-gray-600">{terminatedProcesses.length}</span></div>
                  </div>
                </div>
              </div>

              {/* State Transition History */}
              <div>
                <h4 className="text-xs sm:text-sm font-semibold mb-2">State Transition History</h4>
                <div className="border rounded-lg p-3 bg-gray-50 space-y-2 max-h-48 overflow-y-auto">
                  {simulationState.processes.filter((p: SimulationProcess) => p.history.length > 0).length === 0 ? (
                    <p className="text-xs text-muted-foreground">No transitions recorded yet. Interact with the simulation to see history.</p>
                  ) : (
                    simulationState.processes
                      .filter((p: SimulationProcess) => p.history.length > 0)
                      .map((p: SimulationProcess) => (
                        <div key={p.id} className="text-xs border-b border-gray-200 pb-2 last:border-b-0 last:pb-0">
                          <div className="font-mono font-semibold mb-1">{p.name}</div>
                          <div className="flex flex-wrap items-center gap-1">
                            {p.history.map((state, i) => (
                              <span key={i} className="flex items-center gap-1">
                                <span className={`px-1.5 py-0.5 rounded text-white text-xs ${
                                  state === "ready" ? "bg-blue-500" :
                                  state === "running" ? "bg-green-500" :
                                  state === "blocked" ? "bg-yellow-500" :
                                  state === "terminated" ? "bg-gray-500" : "bg-gray-300"
                                }`}>
                                  {state === "ready" ? "Ready" : state === "running" ? "CPU" : state === "blocked" ? "I/O" : state === "terminated" ? "Term" : state}
                                </span>
                                {i < p.history.length - 1 && <span className="text-gray-400">{"\u2192"}</span>}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  )
}
