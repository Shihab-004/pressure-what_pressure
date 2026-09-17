import { calculateDynamicPriority } from "../src/lib/engine/priorityEngine";
import { recommendNextTask, isTaskBlocked } from "../src/lib/engine/recommendationEngine";
import { calculateDailyWorkload, autoBalanceDay } from "../src/lib/engine/workloadBalancer";
import { parseSingleQuickAdd, parseBrainDumpText } from "../src/lib/engine/brainDumpParser";
import { analyzeEstimationPatterns } from "../src/lib/engine/estimationIntelligence";
import { ITask } from "../src/types";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASSED: ${message}`);
  }
}

console.log("=== Testing Deterministic Priority & Recommendation Engine ===");

// 1. Test Task Dependencies & Blocked Status
const taskPrereq: ITask = {
  _id: "task-1",
  userId: "user-1",
  title: "Sensor Wiring",
  category: "Rover",
  priority: "high",
  status: "in_progress",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const taskBlockedDownstream: ITask = {
  _id: "task-2",
  userId: "user-1",
  title: "ROS2 Obstacle Avoidance Node",
  category: "Learning",
  priority: "critical", // Even though critical, it's blocked by task-1!
  status: "today",
  dependencies: ["task-1"],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const allTasks = [taskPrereq, taskBlockedDownstream];

assert(
  isTaskBlocked(taskBlockedDownstream, allTasks) === true,
  "taskBlockedDownstream is blocked because prerequisite task-1 is not completed"
);

assert(
  isTaskBlocked(taskPrereq, allTasks) === false,
  "taskPrereq is unblocked"
);

// Recommendation engine MUST NEVER recommend a blocked task
const rec = recommendNextTask(allTasks);
assert(
  rec !== null && rec.task._id === "task-1",
  "Recommendation Engine correctly recommended unblocked task-1, ignoring blocked critical task-2"
);

// Now mark prerequisite completed and re-evaluate
taskPrereq.status = "completed";
assert(
  isTaskBlocked(taskBlockedDownstream, allTasks) === false,
  "taskBlockedDownstream is now unblocked after prerequisite completion"
);

const rec2 = recommendNextTask(allTasks);
assert(
  rec2 !== null && rec2.task._id === "task-2",
  "Recommendation Engine now recommends task-2 once unblocked"
);

console.log("\n=== Testing Workload Balancer & Auto-Balance ===");
const dayTasks: ITask[] = [
  {
    _id: "t-hard-deadline",
    userId: "user-1",
    title: "Control Systems Lab Report",
    category: "University",
    priority: "high",
    status: "today",
    estimatedMinutes: 90,
    deadline: new Date(Date.now() + 12 * 3600 * 1000).toISOString(), // Due in 12 hours!
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: "t-flex-1",
    userId: "user-1",
    title: "Clean up CAD files",
    category: "Rover",
    priority: "low",
    status: "today",
    estimatedMinutes: 120,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: "t-flex-2",
    userId: "user-1",
    title: "Read AWS IoT docs",
    category: "Learning",
    priority: "medium",
    status: "today",
    estimatedMinutes: 120,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Capacity: 4 hours = 240 min. Planned: 90 + 120 + 120 = 330 min. (Overloaded by 90 min)
const workload = calculateDailyWorkload(dayTasks, 4.0);
assert(workload.isOverloaded === true, "Correctly flagged day as overloaded (330m > 240m)");
assert(workload.overloadMinutes === 90, "Overload duration correctly calculated as 90m");

// Run Auto-Balance
const todayStr = new Date().toISOString().split("T")[0];
const balanceResult = autoBalanceDay(dayTasks, todayStr, 4.0);

assert(
  balanceResult.keptTasks.some((t) => t._id === "t-hard-deadline"),
  "Hard-deadline task was strictly preserved on today's schedule"
);
assert(
  balanceResult.rescheduledTasks.length > 0,
  "Flexible low-priority tasks were automatically rescheduled to prevent burnout"
);

console.log("\n=== Testing Brain Dump & Natural Language Parsing ===");
const parsedQuick1 = parseSingleQuickAdd("Finish OSI assignment tomorrow 8 PM");
assert(parsedQuick1.category === "University", "Detected University category for OSI assignment");
assert(parsedQuick1.deadline !== undefined, "Extracted tomorrow 8 PM deadline");

const parsedQuick2 = parseSingleQuickAdd("Fix Rover admin bug tonight, 1 hour");
assert(parsedQuick2.category === "Rover", "Detected Rover category");
assert(parsedQuick2.estimatedMinutes === 60, "Detected 1 hour duration (60 min)");

const multilineText = `কালকে MTE lab আছে
OSI assignment শেষ করতে হবে
Rover admin bug fix করতে হবে
AWS IoT শুরু করতে চাই`;

const dumpCandidates = parseBrainDumpText(multilineText);
assert(dumpCandidates.length === 4, `Extracted 4 tasks from multi-line text (got ${dumpCandidates.length})`);
assert(dumpCandidates[0].category === "University", "Category University detected for MTE lab");
assert(dumpCandidates[2].category === "Rover", "Category Rover detected for Rover admin bug");

console.log("\n=== Testing Estimation Intelligence ===");
const historicalTasks: ITask[] = [
  {
    _id: "h1",
    userId: "u1",
    title: "Quick Fix",
    category: "Rover",
    priority: "medium",
    status: "completed",
    estimatedMinutes: 20,
    actualMinutes: 22,
    createdAt: "",
    updatedAt: "",
  },
  {
    _id: "h2",
    userId: "u1",
    title: "Lab Report",
    category: "University",
    priority: "high",
    status: "completed",
    estimatedMinutes: 70,
    actualMinutes: 98, // +40%
    createdAt: "",
    updatedAt: "",
  },
  {
    _id: "h3",
    userId: "u1",
    title: "Robot Telemetry",
    category: "Rover",
    priority: "high",
    status: "completed",
    estimatedMinutes: 80,
    actualMinutes: 110, // +37.5%
    createdAt: "",
    updatedAt: "",
  },
];

const estReport = analyzeEstimationPatterns(historicalTasks);
assert(estReport.over60Min.count === 2, "Grouped >60 min tasks into bucket");
assert(estReport.over60Min.averageDiffPercentage > 20, "Calculated factual estimation underestimation percentage");
assert(estReport.insights.length > 0, "Generated actionable planning advice without fake life score");

console.log("\n🎉 ALL DETERMINISTIC ENGINE TESTS PASSED PERFECTLY!\n");
