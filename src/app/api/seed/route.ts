import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth/serverAuth";
import { connectToDatabase } from "@/lib/db";
import { Task } from "@/models/Task";
import { Project } from "@/models/Project";
import { Goal } from "@/models/Goal";
import { Course } from "@/models/Course";
import { LearningRoadmap } from "@/models/LearningRoadmap";
import { FocusSession } from "@/models/FocusSession";
import { addDays, subDays } from "date-fns";

export async function POST(req: NextRequest) {
  const authUser = await getAuthenticatedUser(req);
  if (!authUser) return unauthorizedResponse();

  try {
    await connectToDatabase();
    const userId = authUser.id;

    // Clean existing data for this user to ensure fresh, clean seed
    await Promise.all([
      Task.deleteMany({ userId }),
      Project.deleteMany({ userId }),
      Goal.deleteMany({ userId }),
      Course.deleteMany({ userId }),
      LearningRoadmap.deleteMany({ userId }),
      FocusSession.deleteMany({ userId }),
    ]);

    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const tomorrowStr = addDays(now, 1).toISOString().split("T")[0];
    const yesterdayStr = subDays(now, 1).toISOString().split("T")[0];

    // 1. Create Goals
    const longTermGoal = await Goal.create({
      userId,
      title: "Become Strong in Robotics + Embedded Systems",
      type: "long_term",
      status: "active",
      progress: 45,
    });

    const monthGoal = await Goal.create({
      userId,
      title: "Autonomous Rover Capability (ROS2 + Navigation)",
      parentGoalId: longTermGoal._id,
      type: "month",
      status: "active",
      progress: 60,
    });

    // 2. Create Projects
    const roverProject = await Project.create({
      userId,
      name: "Mars Rover Competition Platform",
      description: "Embedded motor control and ROS2 autonomous navigation stack",
      category: "Rover",
      status: "active",
      deadline: addDays(now, 30),
      goalId: monthGoal._id,
    });

    const careerProject = await Project.create({
      userId,
      name: "Robotics Industry Portfolio",
      description: "GitHub technical showcase & embedded system designs",
      category: "Career",
      status: "active",
    });

    // 3. Create Courses
    const mte3101 = await Course.create({
      userId,
      code: "MTE 3101",
      name: "Control Systems",
      semester: "Fall 2026",
      color: "#2563eb",
      instructor: "Dr. Rahman",
      credits: 4,
      modules: [
        { name: "Lab Report 1: PID Tuning", type: "lab", completed: true },
        { name: "Control Systems Lab Report", type: "lab", completed: false },
        { name: "Midterm Exam", type: "exam", completed: false },
      ],
    });

    const mte3103 = await Course.create({
      userId,
      code: "MTE 3103",
      name: "Microprocessors & Embedded Systems",
      semester: "Fall 2026",
      color: "#059669",
      instructor: "Dr. Karim",
      credits: 3,
      modules: [
        { name: "Assignment 1: OSI & Network Layers", type: "assignment", completed: false },
        { name: "Lab 2: STM32 Timers & Interrupts", type: "lab", completed: false },
      ],
    });

    // 4. Create Learning Roadmaps
    await LearningRoadmap.create({
      userId,
      title: "ROS2 & Autonomous Navigation Stack",
      category: "Engineering",
      status: "active",
      progress: 65,
      topics: [
        {
          title: "Nodes & Execution Model",
          status: "completed",
          subtopics: [
            { title: "Lifecycle nodes", completed: true },
            { title: "Multi-threaded executors", completed: true },
          ],
        },
        {
          title: "Topic Communication & QoS",
          status: "completed",
          subtopics: [
            { title: "Custom message types", completed: true },
            { title: "Reliability & Transient Local QoS", completed: true },
          ],
        },
        {
          title: "TF2 Transforms",
          status: "in_progress",
          subtopics: [
            { title: "Broadcasting static & dynamic transforms", completed: true },
            { title: "Transform listener & buffer", completed: false },
          ],
        },
        {
          title: "Nav2 Basics",
          status: "not_started",
          subtopics: [
            { title: "Costmap configuration", completed: false },
            { title: "Behavior trees for navigation", completed: false },
          ],
        },
      ],
    });

    // Backlog roadmaps (untouched for 18 days to test Forgotten Work Detector!)
    const eighteenDaysAgo = subDays(now, 18);
    const stm32Roadmap = new LearningRoadmap({
      userId,
      title: "STM32 Bare-Metal Embedded C",
      category: "Embedded",
      status: "active",
      progress: 15,
      topics: [
        { title: "Clock configuration & PLL", status: "completed" },
        { title: "GPIO registers directly", status: "in_progress" },
        { title: "USART DMA transfers", status: "not_started" },
      ],
    });
    (stm32Roadmap as any).updatedAt = eighteenDaysAgo;
    await stm32Roadmap.save();

    await LearningRoadmap.create({
      userId,
      title: "AWS IoT Core & Fleet Management",
      category: "Cloud",
      status: "backlog",
      progress: 0,
      topics: [
        { title: "MQTT broker setup", status: "not_started" },
        { title: "Device shadows & certificates", status: "not_started" },
      ],
    });

    // 5. Create Tasks with Dependencies, Deadlines & Historical Planned vs Actual
    // Task A: Sensor Wiring (Completed prerequisite)
    const taskSensor = await Task.create({
      userId,
      title: "Wire ultrasonic & IMU sensors on Rover chassis",
      category: "Rover",
      projectId: roverProject._id,
      goalId: monthGoal._id,
      priority: "high",
      status: "completed",
      estimatedMinutes: 60,
      actualMinutes: 75, // +15 min difference
      completedAt: yesterdayStr,
      scheduledDate: yesterdayStr,
    });

    // Task B: Control Lab Report (DO THIS NOW candidate: deadline tomorrow, high priority, estimated 70m)
    const taskLabReport = await Task.create({
      userId,
      title: "Finish Control Systems Lab Report",
      description: "Analyze step response and Bode plot for second-order motor system",
      category: "University",
      courseId: mte3101._id,
      priority: "high",
      status: "today",
      deadline: addDays(now, 1),
      estimatedMinutes: 70,
      actualMinutes: 0,
      scheduledDate: todayStr,
      dependencies: [],
    });

    // Task C: OSI Assignment (Urgent academic task)
    const taskOSI = await Task.create({
      userId,
      title: "Complete OSI assignment & network protocols summary",
      category: "University",
      courseId: mte3103._id,
      priority: "high",
      status: "today",
      deadline: addDays(now, 2),
      estimatedMinutes: 45,
      actualMinutes: 0,
      scheduledDate: todayStr,
    });

    // Task D: Rover Admin Bug Fix
    const taskRoverBug = await Task.create({
      userId,
      title: "Fix Rover telemetry admin bug in WebSocket listener",
      category: "Rover",
      projectId: roverProject._id,
      goalId: monthGoal._id,
      priority: "medium",
      status: "today",
      estimatedMinutes: 60,
      scheduledDate: todayStr,
      dependencies: [taskSensor._id], // Dependent on completed sensor wiring (unblocked!)
    });

    // Task E: ROS2 Practice (Downstream task, blocked by another task)
    const taskNav2 = await Task.create({
      userId,
      title: "Implement obstacle avoidance node in ROS2",
      category: "Learning",
      projectId: roverProject._id,
      goalId: monthGoal._id,
      priority: "high",
      status: "planned",
      estimatedMinutes: 90,
      scheduledDate: tomorrowStr,
      dependencies: [taskRoverBug._id], // Blocked until Rover bug fix is completed!
    });

    // Task F: Carried-over flexible task (for testing Auto-balance and carry-over)
    await Task.create({
      userId,
      title: "Clean up CAD schematics and organize component datasheets",
      category: "Rover",
      projectId: roverProject._id,
      priority: "low",
      status: "planned",
      estimatedMinutes: 50,
      scheduledDate: todayStr,
      carryOverCount: 2,
      carryOverReason: "not_enough_time",
    });

    // Task G: Overdue Task (for testing Overdue Manager)
    await Task.create({
      userId,
      title: "Review MTE 3103 Lecture 3 notes on DMA buffers",
      category: "University",
      courseId: mte3103._id,
      priority: "medium",
      status: "planned",
      deadline: subDays(now, 2),
      estimatedMinutes: 30,
      carryOverCount: 1,
    });

    // Task H: Forgotten Inactive Task (>14 days)
    const forgottenTask = new Task({
      userId,
      title: "Order spare motor drivers and 12V LiPo battery clips",
      category: "Rover",
      projectId: roverProject._id,
      priority: "medium",
      status: "inbox",
      estimatedMinutes: 20,
    });
    (forgottenTask as any).updatedAt = eighteenDaysAgo;
    await forgottenTask.save();

    // 6. Create Focus Sessions (Historical data for Estimation Intelligence)
    await FocusSession.create({
      userId,
      taskId: taskSensor._id,
      startedAt: yesterdayStr,
      durationMinutes: 75,
      completed: true,
      interruptions: 1,
      notes: "Motor driver pins required re-crimping",
    });

    return NextResponse.json({
      success: true,
      message: "Workspace successfully populated with realistic engineering & academic seed data!",
      stats: {
        tasks: 7,
        projects: 2,
        courses: 2,
        goals: 2,
        roadmaps: 3,
      },
    });
  } catch (err: any) {
    console.error("POST /api/seed error:", err);
    return NextResponse.json({ error: err.message || "Failed to seed data" }, { status: 500 });
  }
}
