export interface Note {
  id: string;
  content: string;
  createdAt: number;
  tags: string[];
  aiReflection?: string; // Optional AI insight
}

export interface DayGroup {
  date: string; // YYYY-MM-DD
  notes: Note[];
}

export interface Stats {
  totalNotes: number;
  totalTags: number;
  dayCount: number;
}