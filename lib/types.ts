export type WorkStatus =
  | "not_started"
  | "in_progress"
  | "completed"
  | "delayed"
  | "on_hold";

export type Priority = "low" | "medium" | "high" | "critical";

export type ExpenseCategory =
  | "materials"
  | "labor"
  | "contractors"
  | "equipment"
  | "transport"
  | "overhead";

export type DocCategory =
  | "architecture"
  | "structure"
  | "mep"
  | "contract"
  | "invoice"
  | "technical";

export type ActivityKind = "operation" | "floor" | "cost" | "image" | "stage";

export interface ProjectInfo {
  name: string;
  phase: string;
  code: string;
  address: string;
  client: string;
  contractor: string;
  consultant: string;
  startDate: string;
  endDate: string;
  status: WorkStatus;
  budget: number;
  description: string;
}

export interface Floor {
  id: string;
  level: number;
  name: string;
  program: string;
  area: number;
  height: number;
  units: number;
  status: WorkStatus;
  progress: number;
  structure: number;
  masonry: number;
  mep: number;
  finishing: number;
  notes: string;
}

export interface Stage {
  id: string;
  order: number;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  progress: number;
  status: WorkStatus;
  priority: Priority;
  dependsOn: string[];
  delayDays: number;
}

export interface Expense {
  id: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  floorId: string | null;
  stageId: string | null;
  vendor: string;
  note: string;
}

export interface MaterialItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  required: number;
  purchased: number;
  consumed: number;
  unitPrice: number;
  supplier: string;
  purchaseDate: string;
}

export interface Activity {
  id: string;
  kind: ActivityKind;
  title: string;
  detail: string;
  date: string;
  at: number;
}

export interface DocItem {
  id: string;
  title: string;
  category: DocCategory;
  revision: string;
  date: string;
  size: string;
  author: string;
  summary: string;
  fileName?: string;
  dataUrl?: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  floorId: string | null;
  stageId: string | null;
  date: string;
  caption: string;
  seed: number;
  pairId: string | null;
  phase: "before" | "after" | "progress";
  src?: string;
}

export interface DailyLog {
  id: string;
  date: string;
  weather: string;
  crew: number;
  summary: string;
  issues: string;
}

export interface ProjectState {
  project: ProjectInfo;
  floors: Floor[];
  stages: Stage[];
  expenses: Expense[];
  materials: MaterialItem[];
  activities: Activity[];
  documents: DocItem[];
  gallery: GalleryItem[];
  logs: DailyLog[];
}
