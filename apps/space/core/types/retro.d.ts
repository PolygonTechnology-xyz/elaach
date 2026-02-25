// Retro types for elaach retro features
export interface IRetroItem {
  id: string;
  retro_board: string;
  glad: string | null;
  sad: string | null;
  mad: string | null;
  action_point: string | null;
  created_at: string;
  updated_at: string;
}

export interface IRetroBoard {
  id: string;
  name: string;
  description: string;
  project: string;
  cycle: string;
  cycle_id: string;
  cycle_name: string;
  progress_details: {
    total_issues: number;
    completed_issues: number;
    percentage_completed: string;
    status: "success" | "failed";
  };
  details: IRetroItem[];
}