export interface HistoryItem {
  id: string;
  timestamp: number;
  title: string;
  description: string;
  shielded: boolean;
  tags?: string[];
  tracks?: number;
}

export const mockShieldHistory: HistoryItem[] = [
  {
    id: "history1",
    timestamp: Date.now() - 3600000, // 1 hour ago
    title: "Morning Commute",
    description: "Shield activated manually",
    shielded: true,
    tags: ["Commute", "Morning"],
    tracks: 8,
  },
  {
    id: "history2",
    timestamp: Date.now() - 7200000, // 2 hours ago
    title: "Workout Session",
    description: "Shield activated by time rule",
    shielded: true,
    tags: ["Workout", "Focus"],
    tracks: 12,
  },
  {
    id: "history3",
    timestamp: Date.now() - 10800000, // 3 hours ago
    title: "Listening Session",
    description: "Regular listening without shield",
    shielded: false,
    tracks: 5,
  },
  {
    id: "history4",
    timestamp: Date.now() - 86400000, // 1 day ago
    title: "Family Time",
    description: "Shield activated by device rule (Living Room Speaker)",
    shielded: true,
    tags: ["Family", "Relaxation"],
    tracks: 15,
  },
  {
    id: "history5",
    timestamp: Date.now() - 86400000 - 3600000, // 1 day and 1 hour ago
    title: "Deep Work",
    description: "Shield activated manually",
    shielded: true,
    tags: ["Work", "Focus"],
    tracks: 20,
  },
  {
    id: "history6",
    timestamp: Date.now() - 86400000 - 7200000, // 1 day and 2 hours ago
    title: "Evening Relaxation",
    description: "Regular listening without shield",
    shielded: false,
    tags: ["Evening", "Relaxation"],
    tracks: 7,
  },
];