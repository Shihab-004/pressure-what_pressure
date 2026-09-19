export type TaskPriority = "low" | "medium" | "high" | "critical";

export type TaskStatus =
  | "inbox"
  | "planned"
  | "today"
  | "in_progress"
  | "completed"
  | "paused"
  | "cancelled";

export type TaskCategory =
  | "University"
  | "Rover"
  | "Career"
  | "Learning"
  | "Business"
  | "Personal"
  | string;

export interface ITask {
  _id: string;
  userId: string;
  title: string;
  description?: string;
  category: TaskCategory;
  projectId?: string;
  goalId?: string;
  courseId?: string;
  priority: TaskPriority;
  dynamicScore?: number;
  status: TaskStatus;
  deadline?: string;
  estimatedMinutes?: number;
  actualMinutes?: number;
  scheduledDate?: string;
  dependencies?: string[]; // Task IDs that must be completed before this task
  isRecurring?: boolean;
  recurrence?: {
    frequency: "daily" | "weekly" | "monthly" | "custom";
    daysOfWeek?: number[];
  };
  carryOverCount?: number;
  carryOverReason?: "not_enough_time" | "too_difficult" | "distracted" | "no_longer_important" | "other";
  source?: "quick_add" | "brain_dump" | "manual" | "planner";
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface IUserPreferences {
  workDays: number[]; // 0=Sunday, 1=Monday, etc.
  dailyWorkHours: number; // e.g. 5.5
  notificationSettings: {
    overloadWarning: boolean;
    urgentDeadline: boolean;
    idleGoalAlert: boolean;
  };
  theme: "light" | "dark" | "system";
}

export interface IUser {
  _id: string;
  firebaseUid: string;
  email: string;
  name: string;
  avatar?: string;
  timezone: string;
  preferences: IUserPreferences;
  createdAt: string;
  updatedAt: string;
}

export interface IProject {
  _id: string;
  userId: string;
  name: string;
  description?: string;
  category: TaskCategory;
  status: "active" | "paused" | "completed";
  startDate?: string;
  deadline?: string;
  goalId?: string;
  createdAt: string;
  updatedAt: string;
  // Computed client-side / aggregation
  taskStats?: {
    total: number;
    completed: number;
    pending: number;
  };
}

export interface IGoal {
  _id: string;
  userId: string;
  title: string;
  description?: string;
  type: "long_term" | "year" | "month" | "week" | "today";
  parentGoalId?: string;
  status: "active" | "achieved" | "paused";
  progress: number; // 0-100
  createdAt: string;
  updatedAt: string;
}

export interface ICourse {
  _id: string;
  userId: string;
  code: string; // e.g. "MTE 3101"
  name: string; // e.g. "Control Systems"
  semester: string; // e.g. "Fall 2026"
  color: string;
  instructor?: string;
  credits?: number;
  modules?: Array<{
    name: string;
    type: "assignment" | "lab" | "exam" | "quiz" | "presentation" | "note";
    completed: boolean;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface ILearningTopic {
  _id?: string;
  title: string;
  status: "not_started" | "in_progress" | "completed";
  notes?: string;
  subtopics?: Array<{
    title: string;
    completed: boolean;
  }>;
}

export interface ILearningRoadmap {
  _id: string;
  userId: string;
  title: string; // e.g. "ROS2 & Autonomous Navigation"
  category: string;
  status: "active" | "backlog" | "completed";
  topics: ILearningTopic[];
  progress: number; // 0-100
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IFocusSession {
  _id: string;
  userId: string;
  taskId: string;
  startedAt: string;
  endedAt?: string;
  durationMinutes: number;
  completed: boolean;
  interruptions?: number;
  notes?: string;
  createdAt: string;
}

export interface IWeeklyPlan {
  _id: string;
  userId: string;
  weekStart: string; // YYYY-MM-DD
  weekEnd: string;   // YYYY-MM-DD
  tasks: Array<{
    taskId: string;
    scheduledDate: string;
    plannedMinutes: number;
  }>;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IDailyReview {
  _id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  completedCount: number;
  missedCount: number;
  focusTimeMinutes: number;
  mood: "good" | "normal" | "overloaded";
  notes?: string;
  createdAt: string;
}

export interface INotification {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: "deadline" | "overload" | "inactivity" | "system";
  read: boolean;
  createdAt: string;
}

export interface ITaskRecommendation {
  task: ITask;
  reasons: string[];
  score: number;
  alternativeTasks: ITask[];
}

export type IdeaStage = "spark" | "exploring" | "validated";

export interface IIdea {
  _id: string;
  userId: string;
  title: string;
  description?: string;
  category: string;
  stage: IdeaStage;
  tags?: string[];
  isPinned?: boolean;
  createdAt: string;
  updatedAt: string;
}
