export type TRetroTabOptions = "active" | "all";

export type TRetroLayoutOptions = "list" | "board";

export type TRetroDisplayFilters = {
  active_tab?: TRetroTabOptions;
  layout?: TRetroLayoutOptions;
};

export type TRetroFilters = {
  status?: string[] | null;
  cycle_id?: string[] | null;
  created_by?: string[] | null;
};

export type TRetroFiltersByState = {
  default: TRetroFilters;
  completed: TRetroFilters;
  draft: TRetroFilters;
};

export type TRetroStoredFilters = {
  display_filters?: TRetroDisplayFilters;
  filters?: TRetroFilters;
};

