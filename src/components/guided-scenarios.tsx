"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import {
  CheckCircle,
  Clock,
  Users,
  Target,
  Play,
  RotateCcw,
  Info,
  BookOpen,
  ArrowRight,
  Lightbulb,
  ArrowLeft,
  PartyPopper,
} from "lucide-react"
import { ProcessSchedulingSimulation } from "./process-scheduling-simulation"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface GuidedScenario {
  id: string
  title: string
  description: string
  difficulty: "beginner" | "intermediate" | "advanced"
  estimatedTime: number
  objectives: string[]
  steps: GuidedStep[]
  initialProcesses: Array<{
    id: string
    arrivalTime: number
    burstTime: number
    priority?: number
  }>
}

interface GuidedStep {
  id: string
  title: string
  description: string
  instruction: string
  hint?: string
  expectedAction: string
  validation: (state: any) => boolean
  feedback: {
    success: string
    error: string
  }
}

const GUIDED_SCENARIOS: GuidedScenario[] = [
  // ── Scenario 0: Tutorial – Introduction to Process Life Cycle ────────────────────
  {
    id: "s0-tutorial",
    title: "Scenario 0: Tutorial – Introduction to Process Life Cycle",
    description: "A step-by-step guided introduction to all process states and transitions. Start here.",
    difficulty: "beginner",
    estimatedTime: 10,
    objectives: [
      "Understand the five process states: Infant, Ready, CPU, I/O Wait, and Terminated",
      "Create a process using a create_request event",
      "Move a process through Ready → CPU → Ready → CPU → I/O → Ready → CPU → Terminated",
      "Learn that processes can only be terminated from the CPU (Running) state",
    ],
    steps: [
      {
        id: "s0-intro",
        title: "Welcome: Process States",
        description: "Read the state descriptions before you begin",
        instruction: "Look at the simulation panel. Processes start as Infant, become Ready when admitted, move to CPU when scheduled, may block in I/O Wait, and are terminated only from the CPU state. Click ‘Check & Complete Step’ when you are ready to continue.",
        hint: "No action required — just read the state descriptions in the simulation panel, then click the button below.",
        expectedAction: "read_intro",
        validation: () => true,
        feedback: {
          success: "You understand the five process states. Let’s create a process.",
          error: "Click ‘Check & Complete Step’ to continue.",
        },
      },
      {
        id: "s0-create",
        title: "Step 1: Create a Process (Infant → Ready)",
        description: "Admit a process into the system",
        instruction: "Click ‘Advance Clock’ until a create_request event appears in Event Requests. Select it, then click ‘Create Process’ to admit the process into the Ready state.",
        hint: "Look for the purple create_request event in the Event Requests panel. Select it first, then use the action button.",
        expectedAction: "create_process",
        validation: (state: any) => state.processes?.some((p: any) => p.state === "ready"),
        feedback: {
          success: "The process is now in the Ready state — it is waiting to be assigned to the CPU.",
          error: "Select a create_request event from Event Requests, then click ‘Create Process’.",
        },
      },
      {
        id: "s0-to-cpu",
        title: "Step 2: Allocate CPU (Ready → CPU)",
        description: "Schedule the process for execution",
        instruction: "Click on the process badge in the Ready queue, then click ‘→ CPU’ to dispatch it to the CPU.",
        hint: "The process badge appears in the Ready section. Select it to see action buttons.",
        expectedAction: "move_to_cpu",
        validation: (state: any) => state.processes?.some((p: any) => p.state === "running"),
        feedback: {
          success: "The process is now on the CPU and executing. Only one process can be on the CPU at a time.",
          error: "Select the Ready process and click ‘→ CPU’.",
        },
      },
      {
        id: "s0-preempt",
        title: "Step 3: Preemption (CPU → Ready)",
        description: "Move the process back to Ready to simulate preemption",
        instruction: "Select the running process on the CPU, then click ‘→ Ready’ to preempt it back to the Ready queue. In real systems, the OS scheduler can preempt a process to share the CPU with others.",
        hint: "Click the process badge in the CPU section to select it, then use the ‘→ Ready’ button.",
        expectedAction: "preempt_process",
        validation: (state: any) => state.processes?.some((p: any) => p.state === "ready" && p.history?.includes("running")),
        feedback: {
          success: "The process is back in Ready. It retains its context and can be dispatched to CPU again.",
          error: "Select the running process and click ‘→ Ready’.",
        },
      },
      {
        id: "s0-to-cpu-2",
        title: "Step 4: Allocate CPU Again (Ready → CPU)",
        description: "Dispatch the process back to the CPU for its next burst",
        instruction: "Select the Ready process and click ‘→ CPU’ to dispatch it again. A process can be dispatched to CPU multiple times during its life cycle.",
        hint: "Same action as Step 2 — select the Ready process, then click ‘→ CPU’.",
        expectedAction: "move_to_cpu",
        validation: (state: any) => state.processes?.some((p: any) => p.state === "running"),
        feedback: {
          success: "Back on the CPU. Now let’s simulate an I/O request.",
          error: "Select the Ready process and click ‘→ CPU’.",
        },
      },
      {
        id: "s0-to-io",
        title: "Step 5: I/O Request (CPU → I/O Wait)",
        description: "Simulate the process requesting an I/O operation",
        instruction: "Advance the clock until an io_needed event appears for the running process. Select that event, then click ‘→ I/O’ to move the process to the I/O Wait state.",
        hint: "An io_needed event appears after a few clock advances while the process is on CPU. Select the event first, then move to I/O.",
        expectedAction: "move_to_io",
        validation: (state: any) => state.processes?.some((p: any) => p.state === "blocked"),
        feedback: {
          success: "The process is now waiting for I/O. It cannot use the CPU while blocked in I/O Wait.",
          error: "Wait for an io_needed event, select it, then click ‘→ I/O’.",
        },
      },
      {
        id: "s0-io-done",
        title: "Step 6: I/O Completion (I/O Wait → Ready)",
        description: "Return the process to Ready when I/O finishes",
        instruction: "Advance the clock until an io_done event appears for the blocked process. Select it, then click ‘→ Ready’ to return the process to the Ready queue.",
        hint: "io_done signals that the I/O operation has completed. The process can now be scheduled for CPU again.",
        expectedAction: "move_to_ready",
        validation: (state: any) => state.processes?.some((p: any) => p.state === "ready" && p.history?.includes("blocked")),
        feedback: {
          success: "The process is back in Ready after completing its I/O operation.",
          error: "Wait for io_done event, select it, then click ‘→ Ready’.",
        },
      },
      {
        id: "s0-to-cpu-final",
        title: "Step 7: Allocate CPU for Final Execution (Ready → CPU)",
        description: "Schedule the process for its final CPU burst",
        instruction: "Select the Ready process and click ‘→ CPU’ to dispatch it for its final execution. Important: a process can only be terminated from the CPU state, so it must be on the CPU before it can finish.",
        hint: "Move the process from Ready to CPU one more time. Termination requires the process to be actively running.",
        expectedAction: "move_to_cpu",
        validation: (state: any) => state.processes?.some((p: any) => p.state === "running" && p.history?.includes("blocked")),
        feedback: {
          success: "The process is on the CPU for its final execution. Now wait for the terminate event.",
          error: "Select the Ready process and click ‘→ CPU’.",
        },
      },
      {
        id: "s0-terminate",
        title: "Step 8: Terminate (CPU → Terminated)",
        description: "End the process from the CPU state",
        instruction: "Advance the clock until a terminate event appears for the running process. Select it, then click ‘Terminate’. A process can only be terminated when it is actively executing on the CPU — never from Ready or I/O.",
        hint: "The terminate event appears after the process has been on the CPU long enough. Select it first, then use the Terminate button.",
        expectedAction: "terminate_process",
        validation: (state: any) => state.processes?.some((p: any) => p.state === "terminated"),
        feedback: {
          success: "The process has been terminated from the CPU state. Full life cycle complete!",
          error: "Wait for the terminate event while the process is on the CPU, select it, then click Terminate.",
        },
      },
      {
        id: "s0-summary",
        title: "Tutorial Complete",
        description: "Reflect on the key rules you have learned",
        instruction: "Key rules: (1) Processes enter Ready after creation. (2) Only one process can occupy the CPU at a time. (3) I/O blocks only the requesting process. (4) Processes can ONLY be terminated from the CPU state. Click ‘Check & Complete Step’ to finish the tutorial.",
        hint: "No action required — click ‘Check & Complete Step’ to finish.",
        expectedAction: "read_summary",
        validation: () => true,
        feedback: {
          success: "Tutorial complete! You are ready for the guided scenarios. Proceed to Scenario 1.",
          error: "Click ‘Check & Complete Step’ to finish.",
        },
      },
    ],
    initialProcesses: [{ id: "P0", arrivalTime: 0, burstTime: 10 }],
  },

  // ── Scenario 1: Single Process – Normal Execution ────────────────
  {
    id: "s1-single-normal",
    title: "Scenario 1: Single Process – Normal Execution",
    description: "Move a single process through its complete life cycle: Ready → CPU → Terminated",
    difficulty: "beginner",
    estimatedTime: 5,
    objectives: [
      "Allocate CPU to a ready process",
      "Terminate the process from CPU state when a terminate event appears",
    ],
    steps: [
      {
        id: "s1-create",
        title: "Create the Process",
        description: "Admit the process into the system",
        instruction: "Advance the clock until a create_request event appears, select it, then click ‘Create Process’",
        hint: "Look for the purple create_request event in Event Requests",
        expectedAction: "create_process",
        validation: (state: any) => state.processes?.some((p: any) => p.state === "ready"),
        feedback: {
          success: "The process is now in the Ready state, waiting for CPU allocation.",
          error: "Select a create_request event and click ‘Create Process’.",
        },
      },
      {
        id: "s1-to-cpu",
        title: "Allocate CPU (Ready → CPU)",
        description: "Dispatch the process to the CPU for execution",
        instruction: "Select the process in Ready and click ‘→ CPU’",
        hint: "Click on the process badge in Ready, then use the action button",
        expectedAction: "move_to_cpu",
        validation: (state: any) => state.processes?.some((p: any) => p.state === "running"),
        feedback: {
          success: "The process is now executing on the CPU.",
          error: "Select the Ready process and move it to CPU.",
        },
      },
      {
        id: "s1-terminate",
        title: "Terminate (CPU → Terminated)",
        description: "End the process from the CPU state using a terminate event",
        instruction: "Advance the clock until a terminate event appears for the running process. Select it, then click ‘Terminate’. Processes can only be terminated from the CPU state.",
        hint: "The terminate event appears after the process has been running for a while. Select the terminate event first, then use the Terminate button.",
        expectedAction: "terminate_process",
        validation: (state: any) => state.processes?.some((p: any) => p.state === "terminated"),
        feedback: {
          success: "Excellent! You completed a valid life cycle: Ready → CPU → Terminated.",
          error: "Wait for the terminate event while the process is on the CPU, select it, then terminate.",
        },
      },
    ],
    initialProcesses: [{ id: "P0", arrivalTime: 0, burstTime: 4 }],
  },

  // ── Scenario 2: CPU Exclusivity with Two Processes ───────────
  {
    id: "s2-cpu-exclusivity",
    title: "Scenario 2: CPU Exclusivity with Two Processes",
    description: "Only one process may occupy the CPU at a time. The second attempt is blocked.",
    difficulty: "beginner",
    estimatedTime: 8,
    objectives: [
      "Understand that the CPU is a single exclusive slot",
      "Observe the error when a second process tries to enter CPU",
      "Learn to free the CPU before dispatching another process",
    ],
    steps: [
      {
        id: "s2-create-two",
        title: "Create Two Processes",
        description: "Admit two processes into the system",
        instruction: "Advance the clock and create two processes from create_request events",
        hint: "You need two processes in Ready to demonstrate exclusivity",
        expectedAction: "create_multiple_processes",
        validation: (state: any) => (state.processes?.filter((p: any) => p.state !== "infant" && p.state !== "terminated").length ?? 0) >= 2,
        feedback: {
          success: "Two processes are now in Ready.",
          error: "Create at least 2 processes using create_request events.",
        },
      },
      {
        id: "s2-first-cpu",
        title: "Move First Process to CPU",
        description: "Dispatch one process to CPU",
        instruction: "Select any Ready process and click ‘→ CPU’",
        hint: "Only one process can be in CPU. Choose either one.",
        expectedAction: "move_to_cpu",
        validation: (state: any) => state.processes?.some((p: any) => p.state === "running"),
        feedback: {
          success: "One process is running on CPU. The other remains in Ready.",
          error: "Select a Ready process and move it to CPU.",
        },
      },
      {
        id: "s2-try-second",
        title: "Attempt Second CPU Allocation (Blocked)",
        description: "Try to move the second process to CPU and observe the rejection",
        instruction: "Select the second Ready process and try to move it to CPU. You will see an error because CPU is occupied. This demonstrates CPU exclusivity.",
        hint: "The system will reject the attempt with an error message explaining that only one process can run at a time.",
        expectedAction: "demonstrate_cpu_exclusivity",
        validation: () => true,
        feedback: {
          success: "You observed CPU exclusivity. The CPU only accepts one process at a time. Free the CPU first (preempt to Ready or move to I/O) to dispatch another.",
          error: "Try moving the second process to CPU to see the error.",
        },
      },
    ],
    initialProcesses: [
      { id: "P0", arrivalTime: 0, burstTime: 4 },
      { id: "P1", arrivalTime: 0, burstTime: 4 },
    ],
  },

  // ── Scenario 3: I/O Blocking and Return ──────────────────
  {
    id: "s3-io-blocking",
    title: "Scenario 3: I/O Blocking and Return",
    description: "Complete the full I/O cycle: Ready → CPU → I/O → Ready → CPU → Terminated",
    difficulty: "intermediate",
    estimatedTime: 10,
    objectives: [
      "Understand I/O as a blocking wait state",
      "Use io_needed to move a process from CPU to I/O",
      "Use io_done to return a process from I/O to Ready",
      "Allocate CPU again after I/O completes, then terminate from CPU",
    ],
    steps: [
      {
        id: "s3-create",
        title: "Create the Process",
        description: "Admit a process into the system",
        instruction: "Advance the clock and create a process from a create_request event",
        hint: "Look for the purple create_request event",
        expectedAction: "create_process",
        validation: (state: any) => state.processes?.some((p: any) => p.state === "ready"),
        feedback: {
          success: "Process is in Ready state.",
          error: "Create a process using a create_request event.",
        },
      },
      {
        id: "s3-to-cpu",
        title: "Allocate CPU",
        description: "Move the process to CPU",
        instruction: "Select the Ready process and click ‘→ CPU’",
        hint: "The process must be in CPU before it can request I/O",
        expectedAction: "move_to_cpu",
        validation: (state: any) => state.processes?.some((p: any) => p.state === "running"),
        feedback: {
          success: "Process is executing on CPU.",
          error: "Move the process from Ready to CPU.",
        },
      },
      {
        id: "s3-to-io",
        title: "I/O Request (CPU → I/O Wait)",
        description: "When the io_needed event appears, move the process to I/O",
        instruction: "Advance the clock until an io_needed event appears, select it, then move the process to I/O",
        hint: "io_needed appears after 2 clock advances in CPU. I/O is a blocking state — the process cannot execute while waiting for I/O.",
        expectedAction: "move_to_io",
        validation: (state: any) => state.processes?.some((p: any) => p.state === "blocked"),
        feedback: {
          success: "Process is now waiting for I/O completion. It is blocked and cannot use the CPU.",
          error: "Wait for io_needed event, select it, then move the process to I/O.",
        },
      },
      {
        id: "s3-io-done",
        title: "I/O Completion (I/O Wait → Ready)",
        description: "Return the process to Ready when I/O completes",
        instruction: "Advance the clock until an io_done event appears, select it, then move the process to Ready",
        hint: "io_done signals that the I/O operation has finished. Select the event first, then use ‘→ Ready’.",
        expectedAction: "move_to_ready",
        validation: (state: any) => state.processes?.some((p: any) => p.history?.includes("blocked") && p.state === "ready"),
        feedback: {
          success: "I/O cycle complete. The process is back in Ready for another CPU allocation.",
          error: "Select the io_done event and move the process from I/O to Ready.",
        },
      },
      {
        id: "s3-to-cpu-again",
        title: "Allocate CPU Again (Ready → CPU)",
        description: "Dispatch the process back to CPU for its final execution",
        instruction: "Select the Ready process and click ‘→ CPU’. The process must be on the CPU before it can be terminated.",
        hint: "After I/O, the process returns to Ready. Move it to CPU again for its final burst.",
        expectedAction: "move_to_cpu",
        validation: (state: any) => state.processes?.some((p: any) => p.state === "running" && p.history?.includes("blocked")),
        feedback: {
          success: "Process is back on the CPU. Now wait for the terminate event.",
          error: "Select the Ready process and click ‘→ CPU’.",
        },
      },
      {
        id: "s3-terminate",
        title: "Terminate (CPU → Terminated)",
        description: "Complete the life cycle by terminating from CPU state",
        instruction: "Advance the clock until a terminate event appears for the running process. Select it, then terminate the process. Termination is only valid from the CPU state.",
        hint: "The full path was: Ready → CPU → I/O → Ready → CPU → Terminated",
        expectedAction: "terminate_process",
        validation: (state: any) => state.processes?.some((p: any) => p.state === "terminated"),
        feedback: {
          success: "Excellent! Full I/O life cycle completed: Ready → CPU → I/O → Ready → CPU → Terminated.",
          error: "Select the terminate event and terminate the process from CPU state.",
        },
      },
    ],
    initialProcesses: [{ id: "P0", arrivalTime: 0, burstTime: 8 }],
  },

  // ── Scenario 4: Invalid Transition Exploration ───────────────
  {
    id: "s4-invalid-transitions",
    title: "Scenario 4: Invalid Transition Exploration",
    description: "Discover which transitions are invalid and understand why they are rejected.",
    difficulty: "beginner",
    estimatedTime: 8,
    objectives: [
      "Attempt Ready → I/O and observe the rejection",
      "Attempt Ready → Terminated and observe the rejection",
      "Understand the valid transition diagram",
      "Complete the process via the correct path (CPU → Terminated)",
    ],
    steps: [
      {
        id: "s4-create",
        title: "Create a Process",
        description: "Admit a process into Ready state",
        instruction: "Create a process so it enters the Ready state",
        hint: "Advance the clock and use a create_request event",
        expectedAction: "create_process",
        validation: (state: any) => state.processes?.some((p: any) => p.state === "ready"),
        feedback: {
          success: "Process is in Ready. Now try some invalid transitions.",
          error: "Create a process first.",
        },
      },
      {
        id: "s4-try-ready-io",
        title: "Try Ready → I/O (Invalid)",
        description: "Attempt to move a Ready process directly to I/O",
        instruction: "Select the Ready process and try to move it to I/O. The system will reject this because a process must go through CPU before entering I/O.",
        hint: "Ready → I/O is not a valid transition. A process can only enter I/O from the CPU state.",
        expectedAction: "test_invalid_transition",
        validation: () => true,
        feedback: {
          success: "You observed that Ready → I/O is invalid. A process must be executing on CPU to request I/O.",
          error: "Try moving the Ready process to I/O to see the error.",
        },
      },
      {
        id: "s4-try-ready-term",
        title: "Try Ready → Terminated (Invalid)",
        description: "Attempt to terminate a process directly from Ready state",
        instruction: "Select the Ready process and try to terminate it. The system will reject this because termination only happens from the CPU (Running) state, not from Ready.",
        hint: "Ready → Terminated is not a valid transition. A process must be actively executing on the CPU to be terminated.",
        expectedAction: "test_invalid_transition",
        validation: () => true,
        feedback: {
          success: "You observed that Ready → Terminated is invalid. Termination only works from the CPU state.",
          error: "Try terminating the Ready process to see the error.",
        },
      },
      {
        id: "s4-correct-path",
        title: "Complete via Correct Path",
        description: "Now complete the process using valid transitions",
        instruction: "Move the process to CPU using ‘→ CPU’. Once on the CPU, advance the clock until a terminate event appears, select it, and terminate the process from CPU state.",
        hint: "The valid path is: Ready → CPU → Terminated. Move to CPU first, then wait for the terminate event.",
        expectedAction: "terminate_process",
        validation: (state: any) => state.processes?.some((p: any) => p.state === "terminated"),
        feedback: {
          success: "You completed the process via the correct path: Ready → CPU → Terminated.",
          error: "Move the process to CPU, wait for the terminate event, then terminate.",
        },
      },
    ],
    initialProcesses: [{ id: "P0", arrivalTime: 0, burstTime: 6 }],
  },

  // ── Scenario 5: Multiple Processes with I/O Interleaving ─────
  {
    id: "s5-io-interleaving",
    title: "Scenario 5: Multiple Processes with I/O Interleaving",
    description: "Manage three processes with independent life cycles and concurrent I/O.",
    difficulty: "intermediate",
    estimatedTime: 15,
    objectives: [
      "Understand that I/O does not block other processes globally",
      "Interleave CPU and I/O across multiple processes",
      "Complete all three process life cycles",
    ],
    steps: [
      {
        id: "s5-create-all",
        title: "Create Three Processes",
        description: "Admit three processes into Ready",
        instruction: "Advance the clock and create 3 processes from create_request events",
        hint: "Create_request events appear every 2-4 clock advances",
        expectedAction: "create_all_processes",
        validation: (state: any) => (state.processes?.filter((p: any) => p.state !== "infant" && p.state !== "terminated").length ?? 0) >= 3,
        feedback: {
          success: "Three processes are active.",
          error: "Continue creating processes until you have 3.",
        },
      },
      {
        id: "s5-io-one",
        title: "Send One Process to I/O",
        description: "Move a process through CPU to I/O while others wait",
        instruction: "Move a process to CPU, advance clock until io_needed appears, then move it to I/O",
        hint: "After this process enters I/O, the CPU is free for another process",
        expectedAction: "move_to_io",
        validation: (state: any) => state.processes?.some((p: any) => p.state === "blocked"),
        feedback: {
          success: "One process is in I/O. The CPU is now free. I/O is per-process: other processes are not blocked.",
          error: "Move a process to CPU, then to I/O using io_needed.",
        },
      },
      {
        id: "s5-interleave",
        title: "CPU Continues with Another Process",
        description: "Demonstrate that I/O does not block CPU globally",
        instruction: "While one process is in I/O, move another Ready process to CPU. This shows that I/O only blocks the requesting process, not the entire system.",
        hint: "Select a different Ready process and move it to CPU",
        expectedAction: "move_to_cpu",
        validation: (state: any) => state.processes?.some((p: any) => p.state === "running") && state.processes?.some((p: any) => p.state === "blocked"),
        feedback: {
          success: "One process is in I/O, another is on CPU. Each process has an independent life cycle.",
          error: "Move another Ready process to CPU while the first is in I/O.",
        },
      },
      {
        id: "s5-complete",
        title: "Complete All Life Cycles",
        description: "Terminate all three processes",
        instruction: "Manage all processes through their life cycles and terminate each from CPU state using terminate events",
        hint: "Return I/O processes to Ready using io_done, then dispatch to CPU, then terminate from CPU when terminate events appear",
        expectedAction: "terminate_all",
        validation: (state: any) => (state.processes?.filter((p: any) => p.state === "terminated").length ?? 0) >= 3,
        feedback: {
          success: "All three processes terminated with independent life cycles!",
          error: "Continue managing processes until all 3 are terminated.",
        },
      },
    ],
    initialProcesses: [
      { id: "P0", arrivalTime: 0, burstTime: 6 },
      { id: "P1", arrivalTime: 0, burstTime: 4 },
      { id: "P2", arrivalTime: 0, burstTime: 8 },
    ],
  },

  // ── Scenario 6: Invalid Event Triggering ─────────────────
  {
    id: "s6-invalid-events",
    title: "Scenario 6: Invalid Event Triggering",
    description: "Events are state-dependent. Triggering an event on a process in the wrong state fails.",
    difficulty: "intermediate",
    estimatedTime: 8,
    objectives: [
      "Understand that events are tied to specific process states",
      "Observe that I/O completion fails if the process is not in I/O",
      "Learn the correct event-to-state mapping",
    ],
    steps: [
      {
        id: "s6-setup",
        title: "Get a Process to CPU",
        description: "Create a process and move it to CPU",
        instruction: "Create a process and move it to CPU",
        hint: "Standard flow: create_request, then Ready → CPU",
        expectedAction: "move_to_cpu",
        validation: (state: any) => state.processes?.some((p: any) => p.state === "running"),
        feedback: {
          success: "Process is on CPU. Now observe state-dependent event behaviour.",
          error: "Create a process and move it to CPU.",
        },
      },
      {
        id: "s6-wrong-event",
        title: "Attempt Wrong Event",
        description: "Try to trigger io_done on a running process",
        instruction: "If an io_done event were available, trying to use it on a running process would fail because the process is not in I/O state. Events only work when the process is in the matching state.",
        hint: "io_done only applies to processes in I/O state. io_needed only applies to processes in CPU state.",
        expectedAction: "test_invalid_event",
        validation: () => true,
        feedback: {
          success: "You understand that events are state-dependent. Each event only applies to a specific process state.",
          error: "Observe how events are tied to specific states.",
        },
      },
      {
        id: "s6-correct",
        title: "Use Correct Events",
        description: "Complete the process using proper event sequence",
        instruction: "Use the correct events for each transition: io_needed when in CPU to request I/O, terminate when in CPU to end the process",
        hint: "Wait for the correct event to appear and select it before performing the transition",
        expectedAction: "terminate_process",
        validation: (state: any) => state.processes?.some((p: any) => p.state === "terminated"),
        feedback: {
          success: "Process completed with correct event usage.",
          error: "Use the correct events to complete the life cycle.",
        },
      },
    ],
    initialProcesses: [{ id: "P0", arrivalTime: 0, burstTime: 6 }],
  },

  // ── Scenario 7: Extended Ready State Waiting ─────────────
  {
    id: "s7-ready-waiting",
    title: "Scenario 7: Extended Ready State Waiting",
    description: "One process waits in Ready while another executes. Ready = waiting for CPU.",
    difficulty: "beginner",
    estimatedTime: 8,
    objectives: [
      "Understand that Ready means ‘waiting for CPU allocation’",
      "Observe a process staying in Ready while another runs",
      "Terminate both processes from CPU state",
    ],
    steps: [
      {
        id: "s7-create-two",
        title: "Create Two Processes",
        description: "Get two processes into Ready state",
        instruction: "Advance the clock and create 2 processes",
        hint: "Both processes will enter Ready and wait for CPU",
        expectedAction: "create_two",
        validation: (state: any) => (state.processes?.filter((p: any) => p.state === "ready").length ?? 0) >= 2,
        feedback: {
          success: "Two processes in Ready. Only one can go to CPU.",
          error: "Create two processes using create_request events.",
        },
      },
      {
        id: "s7-first-runs",
        title: "Dispatch First Process",
        description: "One process runs while the other waits in Ready",
        instruction: "Move one process to CPU. The other stays in Ready — it is waiting for CPU allocation. Ready is not idle; the process is queued and waiting.",
        hint: "The waiting process remains in Ready until the CPU is free and you dispatch it",
        expectedAction: "move_to_cpu",
        validation: (state: any) => state.processes?.some((p: any) => p.state === "running") && state.processes?.some((p: any) => p.state === "ready"),
        feedback: {
          success: "One process runs on CPU. The other waits in Ready. Ready = waiting for CPU.",
          error: "Move one process to CPU while the other stays in Ready.",
        },
      },
      {
        id: "s7-terminate-both",
        title: "Terminate Both Processes from CPU",
        description: "Dispatch and terminate both processes from the CPU state",
        instruction: "Wait for a terminate event for the running process, select it, and terminate it from CPU. Then dispatch the second process from Ready to CPU, wait for its terminate event, and terminate it. Both must be terminated from CPU state.",
        hint: "Termination only works from the CPU state. Each process must be dispatched to CPU, then terminated using the terminate event.",
        expectedAction: "terminate_all",
        validation: (state: any) => (state.processes?.filter((p: any) => p.state === "terminated").length ?? 0) >= 2,
        feedback: {
          success: "Both processes terminated from CPU state. Each had to be dispatched to CPU before it could be terminated.",
          error: "Dispatch processes to CPU and terminate them using terminate events.",
        },
      },
    ],
    initialProcesses: [
      { id: "P0", arrivalTime: 0, burstTime: 4 },
      { id: "P1", arrivalTime: 0, burstTime: 4 },
    ],
  },

  // ── Scenario 8: Different Lifecycle Lengths ────────────────
  {
    id: "s8-different-lifecycles",
    title: "Scenario 8: Different Lifecycle Lengths",
    description: "Two processes with different life cycle paths: one terminates directly from CPU, the other uses I/O first.",
    difficulty: "intermediate",
    estimatedTime: 12,
    objectives: [
      "Terminate one process directly from CPU (short life cycle)",
      "Move the other through I/O before terminating from CPU (long life cycle)",
      "Understand that processes can have varying life cycle lengths",
    ],
    steps: [
      {
        id: "s8-create",
        title: "Create Both Processes",
        description: "Admit two processes into the system",
        instruction: "Create two processes using create_request events",
        hint: "These two processes will follow different life cycle paths",
        expectedAction: "create_two",
        validation: (state: any) => (state.processes?.filter((p: any) => p.state !== "infant" && p.state !== "terminated").length ?? 0) >= 2,
        feedback: {
          success: "Two processes ready. They will take different paths.",
          error: "Create 2 processes.",
        },
      },
      {
        id: "s8-short-terminate",
        title: "Short Life Cycle: Terminate from CPU",
        description: "Move the first process to CPU and terminate it directly",
        instruction: "Move the first process to CPU, then advance the clock until its terminate event appears. Select the terminate event and terminate the process directly from CPU state. No preemption needed.",
        hint: "Ready → CPU → Terminated is the short path. The terminate event appears for running processes.",
        expectedAction: "terminate_process",
        validation: (state: any) => state.processes?.some((p: any) => p.state === "terminated"),
        feedback: {
          success: "First process terminated directly from CPU. Now the second will take a longer path through I/O.",
          error: "Move to CPU, wait for the terminate event, then terminate from CPU.",
        },
      },
      {
        id: "s8-long-io",
        title: "Long Life Cycle: I/O Detour then Terminate from CPU",
        description: "Move the second process through I/O before terminating",
        instruction: "Move the second process to CPU, then to I/O (io_needed), then back to Ready (io_done), then to CPU again, and finally terminate from CPU using the terminate event.",
        hint: "Follow: Ready → CPU → I/O → Ready → CPU → Terminated",
        expectedAction: "complete_io_cycle",
        validation: (state: any) => (state.processes?.filter((p: any) => p.state === "terminated").length ?? 0) >= 2,
        feedback: {
          success: "Both processes completed with different lifecycle lengths. Process life cycles vary depending on I/O needs.",
          error: "Complete the second process through the I/O cycle, then terminate from CPU.",
        },
      },
    ],
    initialProcesses: [
      { id: "P0", arrivalTime: 0, burstTime: 3 },
      { id: "P1", arrivalTime: 0, burstTime: 8 },
    ],
  },

  // ── Scenario 9: Free Exploration (Mixed Actions) ─────────
  {
    id: "s9-free-exploration",
    title: "Scenario 9: Free Exploration (Mixed Actions)",
    description: "Three processes in mixed states. Explore valid and invalid actions freely with minimal guidance.",
    difficulty: "advanced",
    estimatedTime: 15,
    objectives: [
      "Explore all valid transitions from various starting states",
      "Test invalid transitions to reinforce understanding",
      "Terminate all processes through valid paths",
    ],
    steps: [
      {
        id: "s9-explore",
        title: "Explore Freely",
        description: "Use the sandbox to explore any transitions you like",
        instruction: "Create processes, try all kinds of transitions — both valid and invalid. Observe how the system responds. There is minimal guidance here; rely on what you have learned.",
        hint: "This is an open-ended exploration. Try anything and observe the results.",
        expectedAction: "free_exploration",
        validation: () => true,
        feedback: {
          success: "Continue exploring, or mark the next step when you are ready.",
          error: "Keep exploring the simulation.",
        },
      },
      {
        id: "s9-complete",
        title: "Complete All Processes",
        description: "Terminate all processes you have created",
        instruction: "Terminate at least 2 processes from CPU state to demonstrate your understanding",
        hint: "Each process must be on the CPU to be terminated. Dispatch processes to CPU, then wait for terminate events.",
        expectedAction: "terminate_all",
        validation: (state: any) => (state.processes?.filter((p: any) => p.state === "terminated").length ?? 0) >= 2,
        feedback: {
          success: "You have demonstrated free-form mastery of process life cycle management.",
          error: "Terminate at least 2 processes from CPU state.",
        },
      },
    ],
    initialProcesses: [
      { id: "P0", arrivalTime: 0, burstTime: 6 },
      { id: "P1", arrivalTime: 0, burstTime: 4 },
      { id: "P2", arrivalTime: 0, burstTime: 8 },
    ],
  },
]

interface GuidedScenariosProps {
  persistedCompletedScenarios?: string[]
  onCompletedScenariosChange?: (completed: string[]) => void
}

export function GuidedScenarios({ persistedCompletedScenarios, onCompletedScenariosChange }: GuidedScenariosProps = {}) {
  const [selectedScenario, setSelectedScenario] = useState<GuidedScenario | null>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<string[]>([])
  const [completedScenarios, setCompletedScenarios] = useState<string[]>(persistedCompletedScenarios ?? [])
  const [isScenarioActive, setIsScenarioActive] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [showHint, setShowHint] = useState(false)
  const [showCompletion, setShowCompletion] = useState(false)
  const latestSimState = useRef<any>(null)

  // Sync persisted state on mount
  useEffect(() => {
    if (persistedCompletedScenarios && persistedCompletedScenarios.length > 0) {
      setCompletedScenarios(persistedCompletedScenarios)
    }
  }, [persistedCompletedScenarios])

  // Notify parent when completedScenarios changes
  useEffect(() => {
    onCompletedScenariosChange?.(completedScenarios)
  }, [completedScenarios, onCompletedScenariosChange])

  const handleSimStateChange = useCallback((state: any) => {
    latestSimState.current = state
  }, [])

  useEffect(() => {
    if (!isScenarioActive) return

    const interval = setInterval(() => {
      setElapsedTime((prev) => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [isScenarioActive])

  useEffect(() => {
    if (selectedScenario && completedSteps.length === selectedScenario.steps.length && !showCompletion) {
      setShowCompletion(true)
      setIsScenarioActive(false)
      if (!completedScenarios.includes(selectedScenario.id)) {
        setCompletedScenarios((prev) => [...prev, selectedScenario.id])
      }
    }
  }, [completedSteps, selectedScenario, showCompletion, completedScenarios])

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "bg-green-100 text-green-800 border-green-200"
      case "intermediate":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "advanced":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const startScenario = (scenario: GuidedScenario) => {
    setSelectedScenario(scenario)
    setCurrentStep(0)
    setCompletedSteps([])
    setIsScenarioActive(true)
    setElapsedTime(0)
    setShowHint(false)
    setShowCompletion(false)
  }

  const [stepAlert, setStepAlert] = useState<{ message: string; type: "success" | "error" } | null>(null)

  const completeStep = (stepId: string, simulationState?: any) => {
    if (completedSteps.includes(stepId)) return

    const step = selectedScenario?.steps.find((s) => s.id === stepId)
    if (!step) return

    // Run validation against the simulation state
    if (step.validation && simulationState) {
      const isValid = step.validation(simulationState)
      if (!isValid) {
        setStepAlert({ message: step.feedback.error, type: "error" })
        setTimeout(() => setStepAlert(null), 5000)
        return
      }
    }

    setStepAlert({ message: step.feedback.success, type: "success" })
    setTimeout(() => setStepAlert(null), 5000)

    setCompletedSteps((prev) => [...prev, stepId])
    if (selectedScenario && currentStep < selectedScenario.steps.length - 1) {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const resetScenario = () => {
    setSelectedScenario(null)
    setCurrentStep(0)
    setCompletedSteps([])
    setIsScenarioActive(false)
    setElapsedTime(0)
    setShowHint(false)
    setShowCompletion(false)
  }

  const goBackToScenarios = () => {
    resetScenario()
  }

  const goToNextScenario = () => {
    if (!selectedScenario) return

    const currentIndex = GUIDED_SCENARIOS.findIndex((s) => s.id === selectedScenario.id)
    const nextIndex = currentIndex + 1

    if (nextIndex < GUIDED_SCENARIOS.length) {
      const nextScenario = GUIDED_SCENARIOS[nextIndex]
      startScenario(nextScenario)
    }
  }

  const allScenariosCompleted = completedScenarios.length === GUIDED_SCENARIOS.length

  if (showCompletion && selectedScenario) {
    const currentIndex = GUIDED_SCENARIOS.findIndex((s) => s.id === selectedScenario.id)
    const isLastScenario = currentIndex === GUIDED_SCENARIOS.length - 1

    return (
      <div className="space-y-6">
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-green-700">
              <PartyPopper className="h-6 w-6" />
              Congratulations!
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-lg text-green-800">
              Excellent work! You have successfully completed the <strong>{selectedScenario.title}</strong> guided
              scenario.
            </p>
            <p className="text-muted-foreground">
              Time taken: {Math.floor(elapsedTime / 60)}m {elapsedTime % 60}s
            </p>

            {allScenariosCompleted ? (
              <Alert className="border-blue-200 bg-blue-50">
                <PartyPopper className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong>Outstanding achievement!</strong> You have completed all guided scenarios. You're now ready to
                  test your knowledge in the <strong>Evaluation</strong> section and demonstrate what you've learned
                  about the process life cycle.
                </AlertDescription>
              </Alert>
            ) : (
              <p className="text-muted-foreground">
                Progress: {completedScenarios.length + 1} of {GUIDED_SCENARIOS.length} scenarios completed
              </p>
            )}

            <div className="flex justify-center gap-3">
              <Button onClick={goBackToScenarios} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Scenarios
              </Button>

              <Button onClick={resetScenario} variant="outline">
                <RotateCcw className="h-4 w-4 mr-2" />
                Retry Scenario
              </Button>

              {!isLastScenario && (
                <Button onClick={goToNextScenario} className="bg-green-600 hover:bg-green-700">
                  Next Scenario
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (selectedScenario && isScenarioActive) {
    const currentStepData = selectedScenario.steps[currentStep]
    const progress = (completedSteps.length / selectedScenario.steps.length) * 100

    return (
      <div className="space-y-6">
        {/* Scenario Header */}
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  {selectedScenario.title}
                </CardTitle>
                <p className="text-muted-foreground mt-1">{selectedScenario.description}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-600">
                  {Math.floor(elapsedTime / 60)}:{String(elapsedTime % 60).padStart(2, "0")}
                </div>
                <div className="text-sm text-muted-foreground">Elapsed Time</div>
              </div>
            </div>
            <Progress value={progress} className="mt-2" />
            <div className="text-sm text-muted-foreground">
              Step {currentStep + 1} of {selectedScenario.steps.length} completed
            </div>
          </CardHeader>
        </Card>

        {/* Current Step */}
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              {currentStepData.title}
            </CardTitle>
            <p className="text-muted-foreground">{currentStepData.description}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-blue-200 bg-blue-50">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>Instruction:</strong> {currentStepData.instruction}
              </AlertDescription>
            </Alert>

            {currentStepData.hint && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowHint(!showHint)}
                  className="flex items-center gap-2"
                >
                  <Lightbulb className="h-4 w-4" />
                  {showHint ? "Hide Hint" : "Show Hint"}
                </Button>
                {showHint && (
                  <Alert className="border-yellow-200 bg-yellow-50 flex-1">
                    <Lightbulb className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-800">
                      <strong>Hint:</strong> {currentStepData.hint}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {stepAlert && (
              <Alert className={`${stepAlert.type === "error" ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}`}>
                <Info className={`h-4 w-4 ${stepAlert.type === "error" ? "text-red-600" : "text-green-600"}`} />
                <AlertDescription className={stepAlert.type === "error" ? "text-red-800" : "text-green-800"}>
                  {stepAlert.message}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button onClick={() => completeStep(currentStepData.id, latestSimState.current)} className="bg-green-600 hover:bg-green-700">
                <CheckCircle className="h-4 w-4 mr-2" />
                Check & Complete Step
              </Button>
              <Button onClick={resetScenario} variant="outline">
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset Simulation
              </Button>
              <Button onClick={goBackToScenarios} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Simulation */}
        <ProcessSchedulingSimulation onStateChange={handleSimStateChange} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Guided Learning Scenarios
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-blue-600 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    Step-by-step guided scenarios to learn process life cycle management with hands-on practice and
                    immediate feedback.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
          <p className="text-muted-foreground">
            Learn process life cycle management through interactive, step-by-step guided scenarios with immediate
            feedback and hints.
          </p>
        </CardHeader>
      </Card>

      <div className="grid gap-4">
        {GUIDED_SCENARIOS.map((scenario) => {
          const isCompleted = completedScenarios.includes(scenario.id)

          return (
            <Card key={scenario.id} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{scenario.title}</CardTitle>
                      <Badge className={getDifficultyColor(scenario.difficulty)}>{scenario.difficulty}</Badge>
                      {isCompleted && (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Completed
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground">{scenario.description}</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />~{scenario.estimatedTime}m
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Learning Objectives:
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    {scenario.objectives.map((objective, index) => (
                      <li key={index}>{objective}</li>
                    ))}
                  </ul>
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {scenario.initialProcesses.length} processes
                  </div>
                  <div className="flex items-center gap-1">
                    <ArrowRight className="h-4 w-4" />
                    {scenario.steps.length} guided steps
                  </div>
                </div>

                <Button onClick={() => startScenario(scenario)} className="bg-green-600 hover:bg-green-700">
                  <Play className="h-4 w-4 mr-2" />
                  {isCompleted ? "Restart Guided Learning" : "Start Guided Learning"}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
