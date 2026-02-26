import { set } from "lodash-es";
import { action, computed, observable, makeObservable, runInAction, reaction } from "mobx";
import { computedFn } from "mobx-utils";
// types
import type { TRetroDisplayFilters, TRetroFilters, TRetroFiltersByState } from "@plane/types";
// store
import type { CoreRootStore } from "./root.store";

export interface IRetroFilterStore {
  // observables
  displayFilters: Record<string, TRetroDisplayFilters>;
  filters: Record<string, TRetroFiltersByState>;
  searchQuery: string;
  // computed
  currentProjectDisplayFilters: TRetroDisplayFilters | undefined;
  currentProjectFilters: TRetroFilters | undefined;
  currentProjectCompletedFilters: TRetroFilters | undefined;
  // computed functions
  getDisplayFiltersByProjectId: (projectId: string) => TRetroDisplayFilters | undefined;
  getFiltersByProjectId: (projectId: string) => TRetroFilters | undefined;
  getCompletedFiltersByProjectId: (projectId: string) => TRetroFilters | undefined;
  // actions
  updateDisplayFilters: (projectId: string, displayFilters: TRetroDisplayFilters) => void;
  updateFilters: (projectId: string, filters: TRetroFilters, state?: keyof TRetroFiltersByState) => void;
  updateSearchQuery: (query: string) => void;
  clearAllFilters: (projectId: string, state?: keyof TRetroFiltersByState) => void;
}

export class RetroFilterStore implements IRetroFilterStore {
  // observables
  displayFilters: Record<string, TRetroDisplayFilters> = {};
  filters: Record<string, TRetroFiltersByState> = {};
  searchQuery: string = "";
  // root store
  rootStore: CoreRootStore;

  constructor(_rootStore: CoreRootStore) {
    makeObservable(this, {
      // observables
      displayFilters: observable,
      filters: observable,
      searchQuery: observable.ref,
      // computed
      currentProjectDisplayFilters: computed,
      currentProjectFilters: computed,
      currentProjectCompletedFilters: computed,
      // actions
      updateDisplayFilters: action,
      updateFilters: action,
      updateSearchQuery: action,
      clearAllFilters: action,
    });
    // root store
    this.rootStore = _rootStore;
    // initialize display filters of the current project
    reaction(
      () => this.rootStore.router.projectId,
      (projectId) => {
        if (!projectId) return;
        this.initProjectRetroFilters(projectId);
        this.searchQuery = "";
      }
    );
  }

  /**
   * @description get display filters of the current project
   */
  get currentProjectDisplayFilters() {
    const projectId = this.rootStore.router.projectId;
    if (!projectId) return;
    return this.displayFilters[projectId];
  }

  /**
   * @description get filters of the current project
   */
  get currentProjectFilters() {
    const projectId = this.rootStore.router.projectId;
    if (!projectId) return;
    return this.filters[projectId]?.default ?? {};
  }

  /**
   * @description get completed filters of the current project
   */
  get currentProjectCompletedFilters() {
    const projectId = this.rootStore.router.projectId;
    if (!projectId) return;
    return this.filters[projectId].completed;
  }

  /**
   * @description get display filters of a project by projectId
   * @param {string} projectId
   */
  getDisplayFiltersByProjectId = computedFn((projectId: string) => this.displayFilters[projectId]);

  /**
   * @description get filters of a project by projectId
   * @param {string} projectId
   */
  getFiltersByProjectId = computedFn((projectId: string) => this.filters[projectId]?.default ?? {});

  /**
   * @description get completed filters of a project by projectId
   * @param {string} projectId
   */
  getCompletedFiltersByProjectId = computedFn((projectId: string) => this.filters[projectId].completed);

  /**
   * @description initialize display filters and filters of a project
   * @param {string} projectId
   */
  initProjectRetroFilters = (projectId: string) => {
    const displayFilters = this.getDisplayFiltersByProjectId(projectId);
    runInAction(() => {
      this.displayFilters[projectId] = {
        active_tab: displayFilters?.active_tab || "active",
        layout: displayFilters?.layout || "list",
      };
      this.filters[projectId] = this.filters[projectId] ?? {
        default: {},
        completed: {},
        draft: {},
      };
    });
  };

  /**
   * @description update display filters of a project
   * @param {string} projectId
   * @param {TRetroDisplayFilters} displayFilters
   */
  updateDisplayFilters = (projectId: string, displayFilters: TRetroDisplayFilters) => {
    runInAction(() => {
      Object.keys(displayFilters).forEach((key) => {
        set(this.displayFilters, [projectId, key], displayFilters[key as keyof TRetroDisplayFilters]);
      });
    });
  };

  /**
   * @description update filters of a project
   * @param {string} projectId
   * @param {TRetroFilters} filters
   */
  updateFilters = (projectId: string, filters: TRetroFilters, state: keyof TRetroFiltersByState = "default") => {
    runInAction(() => {
      Object.keys(filters).forEach((key) => {
        set(this.filters, [projectId, state, key], filters[key as keyof TRetroFilters]);
      });
    });
  };

  /**
   * @description update search query
   * @param {string} query
   */
  updateSearchQuery = (query: string) => (this.searchQuery = query);

  /**
   * @description clear all filters of a project
   * @param {string} projectId
   */
  clearAllFilters = (projectId: string, state: keyof TRetroFiltersByState = "default") => {
    runInAction(() => {
      this.filters[projectId][state] = {};
    });
  };
}
