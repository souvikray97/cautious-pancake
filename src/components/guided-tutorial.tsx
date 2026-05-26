"use client"

import { useState, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { ChevronLeft, ChevronRight, CheckCircle, Info, Target, Lightbulb } from "lucide-react"
import { SimulationEngine } from "@/lib/simulation-engine"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ProcessSchedulingSimulation } from "@/components/process-scheduling-simulation"

interface TutorialStep {
  id: number
  title: string
  description: string
  instruction: string
  objective: string
  hint?: string
  completed: boolean
  interactive: boolean
  validation?: (engine: SimulationEngine) => { success: boolean; message: string }
}

export function GuidedTutorial() {
  const [currentStep, setCurrentStep] = useState(0)
  const engineRef = useRef<SimulationEngine | null>(null)
  const [tutorialAlert, setTutorialAlert] = useState<{ message: string; type: "info" | "success" | "error" } | null>(
    null,
  )

  const [simulationState, setSimulationState] = useState<ReturnType<SimulationEngine["getState"]> | null>(null)

  const handleEngineReady = useCallback((engine: SimulationEngine) => {
    engineRef.current = engine
    setSimulationState(engine.getState())
  }, [])

  const handleStateChange = useCallback((state: ReturnType<SimulationEngine["getState"]>) => {
    setSimulationState(state)
  }, [])

  const [steps, setSteps] = useState<TutorialStep[]>([
    {
      id: 1,
      title: "Understanding Process States",
      description: "Learn about the different states a process can be in during its life cycle.",
      instruction:
        "Observe the process visualization. Each process can be in one of four active states: Ready (blue, waiting for CPU), CPU (green, executing), I/O (yellow, waiting for I/O completion), or Terminated (dark gray). Processes start as Not Created (gray) before being initialized.",
      objective: "Identify the different process states in the legend and understand their meanings",
      hint: "Look at the legend in the controls panel to see all possible process states and their color coding",
      completed: false,
      interactive: false,
    },
    {
      id: 2,
      title: "Manual Clock Control",
      description: "Learn how time advances in the simulation through manual control.",
      instruction:
        "Click the 'Advance Clock' button to move time forward by one unit. Notice how the current time increases and new events may be generated. The clock only advances when you explicitly click the button.",
      objective: "Successfully advance the clock and observe time progression",
      hint: "Use the 'Advance Clock' button in the controls section. Watch the current time display change.",
      completed: false,
      interactive: true,
      validation: (engine) => {
        const state = engine.getState()
        if (state.currentTime > 0) {
          return { success: true, message: "Great! You've successfully advanced the simulation clock." }
        }
        return { success: false, message: "Click 'Advance Clock' to move time forward in the simulation." }
      },
    },
    {
      id: 3,
      title: "Creating Your First Process",
      description: "Learn how to create and initialize a new process in the system.",
      instruction:
        "First, advance the clock until you see a 'create_request' event appear in the Event Requests. Then select this event by clicking on it, and finally click 'Create Process' to add a new process to the Ready state. This simulates a new program being loaded into memory.",
      objective: "Successfully create a process using a create_request event",
      hint: "Look for purple-colored 'create_request' events in the Event Requests. Select the event first, then use the 'Create Process' button.",
      completed: false,
      interactive: true,
      validation: (engine) => {
        const state = engine.getState()
        const readyProcesses = state.processes.filter((p) => p.state === "ready")
        if (readyProcesses.length > 0) {
          return {
            success: true,
            message: "Excellent! You've successfully created your first process using the event system.",
          }
        }
        return {
          success: false,
          message: "Select a 'create_request' event and click 'Create Process' to add a process to Ready.",
        }
      },
    },
    {
      id: 4,
      title: "Moving Process to CPU",
      description: "Understand how processes transition from Ready to CPU (Running) state.",
      instruction:
        "Click on a process in the Ready area to select it, then use the '\u2192 CPU' button to allocate CPU to it. Only one process can run on the CPU at a time - this is a single-process CPU execution model.",
      objective: "Move a Ready process to the CPU (Running state)",
      hint: "First select a process by clicking on it in Ready, then use the process action buttons that appear in the controls.",
      completed: false,
      interactive: true,
      validation: (engine) => {
        const state = engine.getState()
        const runningProcesses = state.processes.filter((p) => p.state === "running")
        if (runningProcesses.length > 0) {
          return {
            success: true,
            message: "Perfect! The process is now executing on the CPU.",
          }
        }
        return {
          success: false,
          message: "No processes are currently running. Select a Ready process and move it to CPU.",
        }
      },
    },
    {
      id: 5,
      title: "Understanding Events",
      description: "Learn how system events drive process state changes.",
      instruction:
        "Look at the Event Requests section to see active events. Events are generated when you advance the clock. 'create_request' events (purple) create new processes, 'io_needed' events require moving processes to I/O, 'io_done' events signal I/O completion, and 'terminate' events end processes. Events appear after specific conditions are met.",
      objective: "Explore the Event Requests and understand different event types",
      hint: "External events (red background) come from outside the system, while internal events (blue background) are generated by processes.",
      completed: false,
      interactive: false,
    },
    {
      id: 6,
      title: "Process I/O Operations",
      description: "Learn how processes handle input/output operations (CPU -> I/O transition).",
      instruction:
        "Advance the clock until an 'io_needed' event appears for your running process (appears after 2 clock advances in CPU). Select this event by clicking on it, then move the running process to I/O using the '\u2192 I/O' button. This simulates a process needing to wait for disk or network operations.",
      objective: "Successfully handle an I/O request by moving a process from CPU to I/O",
      hint: "I/O events are generated for running processes after 2 clock advances. Select the 'io_needed' event first, then use the process controls.",
      completed: false,
      interactive: true,
      validation: (engine) => {
        const state = engine.getState()
        const blockedProcesses = state.processes.filter((p) => p.state === "blocked")
        if (blockedProcesses.length > 0) {
          return {
            success: true,
            message: "Excellent! The process is now waiting for I/O completion.",
          }
        }
        return {
          success: false,
          message: "Select an 'io_needed' event and move the corresponding process to I/O.",
        }
      },
    },
    {
      id: 7,
      title: "I/O Completion (I/O -> Ready)",
      description: "Learn how processes return from I/O operations back to Ready state.",
      instruction:
        "Continue advancing the clock until an 'io_done' event appears for your I/O process. Select this event, then move the process back to Ready using the '\u2192 Ready' button. This completes the I/O cycle and the process is ready for CPU again.",
      objective: "Move a process from I/O back to Ready state using an io_done event",
      hint: "I/O completion events are generated automatically for processes in I/O state. Select the event first, then use the controls.",
      completed: false,
      interactive: true,
      validation: (engine) => {
        const state = engine.getState()
        const hasIOHistory = state.processes.some(
          (p) => p.history && p.history.includes("blocked") && p.state === "ready",
        )
        if (hasIOHistory) {
          return {
            success: true,
            message: "Outstanding! You've completed the full I/O cycle - from CPU to I/O to Ready.",
          }
        }
        return {
          success: false,
          message: "Select an 'io_done' event and move the process from I/O back to Ready.",
        }
      },
    },
    {
      id: 8,
      title: "Process Termination (Ready -> Terminated)",
      description: "Understand how processes complete their execution. Termination only happens from the Ready state.",
      instruction:
        "First, if the process is on CPU, preempt it back to Ready (CPU -> Ready). Once the process is in Ready, a 'terminate' event will appear. Select the terminate event and use the 'Terminate' button. Termination can only happen from the Ready state - this represents the OS deciding to end the process while it is waiting for CPU.",
      objective: "Successfully terminate a process from Ready state using a terminate event",
      hint: "Terminate events appear for processes in the Ready state. If your process is on CPU, preempt it to Ready first, then select the 'terminate' event and use the 'Terminate' button.",
      completed: false,
      interactive: true,
      validation: (engine) => {
        const state = engine.getState()
        const terminatedProcesses = state.processes.filter((p) => p.state === "terminated")
        if (terminatedProcesses.length > 0) {
          return {
            success: true,
            message:
              "Fantastic! You've successfully completed the full process life cycle from creation to termination.",
          }
        }
        return {
          success: false,
          message: "Move the process to Ready state, then select a 'terminate' event and use 'Terminate' to complete the process life cycle.",
        }
      },
    },
    {
      id: 9,
      title: "Understanding Metrics",
      description: "Learn about the transition metrics and state time tracking.",
      instruction:
        "Observe the metrics panel showing Valid Transitions (correct state changes you performed), Invalid Attempts (incorrect actions taken), Completed Processes, and State Presence (qualitative time each process spent in Ready, CPU, and I/O). These metrics help you understand the process life cycle behavior, not optimize scheduling performance.",
      objective: "Understand how different actions affect transition metrics and state time tracking",
      hint: "Valid transitions count your correct moves, invalid attempts track errors, and state time shows how long processes wait in each state.",
      completed: false,
      interactive: false,
    },
  ])

  // Check if current step's validation passes (for interactive steps)
  const isStepReady = useCallback(() => {
    const step = steps[currentStep]
    if (!step.interactive) {
      // Non-interactive steps are always ready to be marked complete
      return true
    }
    if (step.validation && engineRef.current) {
      const result = step.validation(engineRef.current)
      return result.success
    }
    return true
  }, [currentStep, steps, simulationState])

  const showTutorialAlert = useCallback((message: string, type: "info" | "success" | "error" = "info") => {
    setTutorialAlert({ message, type })
    setTimeout(() => setTutorialAlert(null), 7000)
  }, [])

  const handleStepComplete = () => {
    const currentStepData = steps[currentStep]

    if (currentStepData.interactive && currentStepData.validation && engineRef.current) {
      const validation = currentStepData.validation(engineRef.current)
      if (!validation.success) {
        showTutorialAlert(validation.message, "error")
        return
      }
      showTutorialAlert(validation.message, "success")
    }

    setSteps((prev) => prev.map((step) => (step.id === currentStep + 1 ? { ...step, completed: true } : step)))

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      showTutorialAlert(
        "Congratulations! You've completed the guided tutorial and mastered the process life cycle!",
        "success",
      )
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleNext = () => {
    // Can only advance to next step if current step is completed
    if (currentStep < steps.length - 1 && steps[currentStep].completed) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleSkipToStep = (stepIndex: number) => {
    // Can only navigate to a step if all previous steps are completed
    const canNavigate = stepIndex <= currentStep || steps.slice(0, stepIndex).every((s) => s.completed)
    if (canNavigate) {
      setCurrentStep(stepIndex)
    }
  }

  const resetTutorial = () => {
    engineRef.current?.reset()
    setCurrentStep(0)
    setSteps((prev) => prev.map((step) => ({ ...step, completed: false })))
    setTutorialAlert(null)
  }

  const currentStepData = steps[currentStep]
  const completedSteps = steps.filter((step) => step.completed).length
  const progressPercentage = (completedSteps / steps.length) * 100

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Tutorial Alert */}
        {tutorialAlert && (
          <Alert
            className={`${
              tutorialAlert.type === "error"
                ? "border-red-200 bg-red-50"
                : tutorialAlert.type === "success"
                  ? "border-green-200 bg-green-50"
                  : "border-blue-200 bg-blue-50"
            }`}
          >
            <Info
              className={`h-4 w-4 ${
                tutorialAlert.type === "error"
                  ? "text-red-600"
                  : tutorialAlert.type === "success"
                    ? "text-green-600"
                    : "text-blue-600"
              }`}
            />
            <AlertDescription
              className={`${
                tutorialAlert.type === "error"
                  ? "text-red-800"
                  : tutorialAlert.type === "success"
                    ? "text-green-800"
                    : "text-blue-800"
              }`}
            >
              {tutorialAlert.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Progress Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Guided Tutorial - Process Life Cycle</span>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {completedSteps}/{steps.length} Complete
                </Badge>
                <Button onClick={resetTutorial} variant="outline" size="sm">
                  Reset Tutorial
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Progress value={progressPercentage} className="w-full" />

              {/* Step Navigation */}
              <div className="flex flex-wrap gap-2">
                {steps.map((step, index) => {
                  const canNavigate = index <= currentStep || steps.slice(0, index).every((s) => s.completed)
                  return (
                    <Tooltip key={step.id}>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => handleSkipToStep(index)}
                          disabled={!canNavigate}
                          className={`w-8 h-8 rounded-full text-xs font-bold transition-all flex items-center justify-center ${
                            step.completed
                              ? "bg-green-500 text-white"
                              : index === currentStep
                                ? "bg-blue-500 text-white"
                                : canNavigate
                                  ? "bg-gray-200 text-gray-600 hover:bg-gray-300"
                                  : "bg-gray-100 text-gray-400 cursor-not-allowed opacity-50"
                          }`}
                        >
                          {step.completed ? <CheckCircle className="h-4 w-4" /> : step.id}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{step.title}{!canNavigate ? " (complete previous steps first)" : ""}</p>
                      </TooltipContent>
                    </Tooltip>
                  )
                })}
              </div>

              <div className="text-sm text-muted-foreground">
                Progress: {Math.round(progressPercentage)}% | Step {currentStep + 1} of {steps.length}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Current Step Instructions - 25% width */}
          <Card className="xl:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Step {currentStep + 1}: {currentStepData.title}
                {currentStepData.completed && <CheckCircle className="h-5 w-5 text-green-500" />}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">{currentStepData.description}</p>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Objective:
                </h4>
                <p className="text-green-800 text-sm">{currentStepData.objective}</p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Instructions:
                </h4>
                <p className="text-blue-800 text-sm">{currentStepData.instruction}</p>
              </div>

              {currentStepData.hint && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
                    <Lightbulb className="h-4 w-4" />
                    Hint:
                  </h4>
                  <p className="text-yellow-800 text-sm">{currentStepData.hint}</p>
                </div>
              )}

              <div className="flex flex-col gap-3 pt-4">
                {/* First line: Check Progress / Mark Complete */}
                <div className="w-full">
                  {currentStepData.interactive ? (
                    <Button
                      onClick={handleStepComplete}
                      disabled={!isStepReady()}
                      className={`w-full ${isStepReady() ? "bg-green-600 hover:bg-green-700" : "bg-gray-400 cursor-not-allowed"}`}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Check Progress
                    </Button>
                  ) : (
                    <Button onClick={handleStepComplete} className="w-full bg-blue-600 hover:bg-blue-700">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark Complete
                    </Button>
                  )}
                </div>

                {/* Second line: Previous and Next */}
                <div className="flex gap-2 w-full">
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={currentStep === 0}
                    className="flex-1 flex items-center justify-center gap-1 bg-transparent"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>

                  <Button
                    onClick={handleNext}
                    disabled={currentStep === steps.length - 1 || !currentStepData.completed}
                    className="flex-1 flex items-center justify-center gap-1"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Interactive Practice Area - Full Simulation - 75% width */}
          <div className="xl:col-span-3">
            <ProcessSchedulingSimulation onEngineReady={handleEngineReady} onStateChange={handleStateChange} />
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
