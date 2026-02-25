
export type TRetroStatus = "active" | "completed" | "draft";

export type TRetroItemType = "glad" | "sad" | "mad" | "action_point";

export type TRetroDistributionBase = {
  total_items: number;
  glad_count: number;
  sad_count: number;
  mad_count: number;
  action_points_count: number;
};

export type TRetroItemDistribution = {
  [key in TRetroItemType]: number;
};

export type TRetroProgressSnapshot = {
  total_items: number;
  resolved_action_points: number;
  pending_action_points: number;
  completion_percentage: number;
  cycle_status: "success" | "failed";
  distribution: TRetroItemDistribution;
  
};

export interface IRetroBoard extends TRetroProgressSnapshot {
  progress_snapshot: TRetroProgressSnapshot | undefined;

  id: string;
  name: string;
  description: string;
  status: TRetroStatus;
  
  // Relationships
  project_id: string;
  workspace_id: string;
  cycle_id: string;
  
  // Metadata
  created_at: string;
  updated_at: string;
  created_by: string;
  owned_by_id: string;
  
  // UI Props
  is_favorite?: boolean;
  view_props: {
    filters: TRetroFilters;
  };
  
  items?: IRetroItem[];
}

export interface IRetroItem {
  id: string;
  retro_board_id: string;
  type: TRetroItemType;
  content: string;
  
  // Meta
  created_at: string;
  updated_at: string;
  created_by: string;
  
  is_completed?: boolean;
  assigned_to?: string[]; 
}

export type SelectRetroType = (IRetroBoard & { actionType: "edit" | "delete" | "add-item" }) | undefined;

export type TRetroTabOptions = "active" | "all";

export type TRetroFilters = {
  status?: TRetroStatus[] | null;
  cycle_id?: string[] | null;
  created_by?: string[] | null;
};

export type TRetroStoredFilters = {
  display_filters?: {
    active_tab?: TRetroTabOptions;
    layout?: "list" | "board";
  };
  filters?: TRetroFilters;
};