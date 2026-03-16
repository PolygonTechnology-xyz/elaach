import { unset, orderBy, set } from "lodash-es";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// types
import type { IEstimate as IEstimateType, IEstimateFormData, TEstimateSystemKeys } from "@plane/types";
// services
import estimateService from "@/plane-web/services/project/estimate.service";
// store
import type { IEstimate } from "@/plane-web/store/estimates/estimate";
import { Estimate } from "@/plane-web/store/estimates/estimate";
import type { CoreRootStore } from "../root.store";

type TEstimateLoader = "init-loader" | "mutation-loader" | undefined;
type TErrorCodes = {
  status: string;
  message?: string;
};

export interface IProjectEstimateStore {
  // observables
  loader: TEstimateLoader;
  estimates: Record<string, IEstimate>;
  error: TErrorCodes | undefined;
  // computed
  currentActiveEstimateId: string | undefined;
  currentActiveEstimate: IEstimate | undefined;
  archivedEstimateIds: string[] | undefined;
  currentProjectEstimateType: TEstimateSystemKeys | undefined;
  projectTimeEstimates: IEstimate[] | undefined;
  areEstimateEnabledByProjectId: (projectId: string) => boolean;
  estimateIdsByProjectId: (projectId: string) => string[] | undefined;
  currentActiveEstimateIdByProjectId: (projectId: string) => string | undefined;
  estimateById: (estimateId: string) => IEstimate | undefined;
  // actions
  getWorkspaceEstimates: (workspaceSlug: string, loader?: TEstimateLoader) => Promise<IEstimateType[] | undefined>;
  getProjectEstimates: (
    workspaceSlug: string,
    projectId: string,
    loader?: TEstimateLoader
  ) => Promise<IEstimateType[] | undefined>;
  getEstimateById: (estimateId: string) => IEstimate | undefined;
  createEstimate: (
    workspaceSlug: string,
    projectId: string,
    data: IEstimateFormData
  ) => Promise<IEstimateType | undefined>;
  createProjectEstimatePoints: (
    workspaceSlug: string,
    projectId: string,
    data: Partial<IEstimateFormData>
  ) => Promise<IEstimateType | undefined>;
  createProjectEstimateTime: (
    workspaceSlug: string,
    projectId: string,
    data: Partial<IEstimateFormData>
  ) => Promise<IEstimateType | undefined>;
  deleteEstimate: (workspaceSlug: string, projectId: string, estimateId: string) => Promise<void>;
}

export class ProjectEstimateStore implements IProjectEstimateStore {
  // observables
  loader: TEstimateLoader = undefined;
  estimates: Record<string, IEstimate> = {};
  error: TErrorCodes | undefined = undefined;

  constructor(private store: CoreRootStore) {
    makeObservable(this, {
      // observables
      loader: observable.ref,
      estimates: observable,
      error: observable,
      // computed
      currentActiveEstimateId: computed,
      currentActiveEstimate: computed,
      archivedEstimateIds: computed,
      currentProjectEstimateType: computed,
      projectTimeEstimates: computed,
      // actions
      getWorkspaceEstimates: action,
      getProjectEstimates: action,
      getEstimateById: action,
      createEstimate: action,
      createProjectEstimatePoints: action,
      createProjectEstimateTime: action,
      deleteEstimate: action,
    });
  }

  // computed

  get currentProjectEstimateType(): TEstimateSystemKeys | undefined {
    const activeEstimate = this.currentActiveEstimate;
    return activeEstimate?.type ? (activeEstimate.type.toLowerCase() as TEstimateSystemKeys) : undefined;
  }

  get projectTimeEstimates(): IEstimate[] | undefined {
    const { projectId } = this.store.router;
    if (!projectId) return undefined;
    return Object.values(this.estimates || {}).filter(
      (e) => e.project === projectId && e.type === "time"
    );
  }

  get currentActiveEstimateId(): string | undefined {
    const { projectId } = this.store.router;
    if (!projectId) return undefined;
    const currentActiveEstimate = Object.values(this.estimates || {}).find(
      (p) => p.project === projectId && p.last_used
    );
    return currentActiveEstimate?.id ?? undefined;
  }

  get currentActiveEstimate(): IEstimate | undefined {
    const { projectId } = this.store.router;
    if (!projectId) return undefined;
    const currentActiveEstimate = Object.values(this.estimates || {}).find(
      (p) => p.project === projectId && p.last_used
    );
    return currentActiveEstimate ?? undefined;
  }

  get archivedEstimateIds(): string[] | undefined {
    const { projectId } = this.store.router;
    if (!projectId) return undefined;
    const archivedEstimates = orderBy(
      Object.values(this.estimates || {}).filter((p) => p.project === projectId && !p.last_used),
      ["created_at"],
      "desc"
    );
    return archivedEstimates.map((p) => p.id) as string[];
  }

  areEstimateEnabledByProjectId = computedFn((projectId: string) => {
    if (!projectId) return false;
    const projectDetails = this.store.projectRoot.project.getProjectById(projectId);
    return Boolean(projectDetails?.estimate);
  });

  estimateIdsByProjectId = computedFn((projectId: string) => {
    if (!projectId) return undefined;
    return Object.values(this.estimates || {})
      .filter((p) => p.project === projectId)
      .map((p) => p.id) as string[];
  });

  currentActiveEstimateIdByProjectId = computedFn((projectId: string): string | undefined => {
    if (!projectId) return undefined;
    const currentActiveEstimate = Object.values(this.estimates || {}).find(
      (p) => p.project === projectId && p.last_used
    );
    return currentActiveEstimate?.id ?? undefined;
  });

  estimateById = computedFn((estimateId: string) => {
    if (!estimateId) return undefined;
    return this.estimates[estimateId] ?? undefined;
  });

  // actions

  getWorkspaceEstimates = async (
    workspaceSlug: string,
    loader: TEstimateLoader = "mutation-loader"
  ): Promise<IEstimateType[] | undefined> => {
    try {
      this.error = undefined;
      if (Object.keys(this.estimates || {}).length <= 0) this.loader = loader ? loader : "init-loader";

      const estimates = await estimateService.fetchWorkspaceEstimates(workspaceSlug);
      if (estimates && estimates.length > 0) {
        runInAction(() => {
          estimates.forEach((estimate) => {
            if (estimate.id)
              set(
                this.estimates,
                [estimate.id],
                new Estimate(this.store, { ...estimate, type: estimate.type?.toLowerCase() as TEstimateSystemKeys })
              );
          });
          this.loader = undefined;
        });
      }
      return estimates;
    } catch (error) {
      runInAction(() => {
        this.loader = undefined;
        this.error = { status: "error", message: "Error fetching estimates" };
      });
      throw error;
    }
  };

  getProjectEstimates = async (
    workspaceSlug: string,
    projectId: string,
    loader: TEstimateLoader = "mutation-loader"
  ): Promise<IEstimateType[] | undefined> => {
    try {
      this.error = undefined;
      if (!this.estimateIdsByProjectId(projectId)) this.loader = loader ? loader : "init-loader";

      const estimates = await estimateService.fetchProjectEstimates(workspaceSlug, projectId);
      if (estimates && estimates.length > 0) {
        runInAction(() => {
          estimates.forEach((estimate) => {
            if (estimate.id)
              set(
                this.estimates,
                [estimate.id],
                new Estimate(this.store, { ...estimate, type: estimate.type?.toLowerCase() as TEstimateSystemKeys })
              );
          });
          this.loader = undefined;
        });
      }
      return estimates;
    } catch (error) {
      runInAction(() => {
        this.loader = undefined;
        this.error = { status: "error", message: "Error fetching estimates" };
      });
      throw error;
    }
  };

  getEstimateById = (estimateId: string): IEstimate | undefined => this.estimates[estimateId];

  createEstimate = async (
    workspaceSlug: string,
    projectId: string,
    payload: IEstimateFormData
  ): Promise<IEstimateType | undefined> => {
    try {
      this.error = undefined;
      const estimate = await estimateService.createEstimate(workspaceSlug, projectId, payload);
      if (estimate && estimate.id) {
        runInAction(() => {
          set(
            this.estimates,
            [estimate.id],
            new Estimate(this.store, { ...estimate, type: estimate.type?.toLowerCase() as TEstimateSystemKeys })
          );
        });
      }
      return estimate;
    } catch (error) {
      runInAction(() => {
        this.error = { status: "error", message: "Error creating estimate" };
      });
      throw error;
    }
  };

  createProjectEstimatePoints = async (
    workspaceSlug: string,
    projectId: string,
    payload: Partial<IEstimateFormData>
  ): Promise<IEstimateType | undefined> => {
    try {
      this.error = undefined;
      const estimate = await estimateService.createProjectEstimatePoints(workspaceSlug, projectId, payload);
      if (estimate && estimate.id) {
        runInAction(() => {
          set(
            this.estimates,
            [estimate.id],
            new Estimate(this.store, { ...estimate, type: estimate.type?.toLowerCase() as TEstimateSystemKeys })
          );
        });
      }
      return estimate;
    } catch (error) {
      runInAction(() => {
        this.error = { status: "error", message: "Error creating point estimate" };
      });
      throw error;
    }
  };

  createProjectEstimateTime = async (
    workspaceSlug: string,
    projectId: string,
    payload: Partial<IEstimateFormData>
  ): Promise<IEstimateType | undefined> => {
    try {
      this.error = undefined;
      const estimate = await estimateService.createProjectEstimateTime(workspaceSlug, projectId, payload);
      if (estimate && estimate.id) {
        runInAction(() => {
          set(
            this.estimates,
            [estimate.id],
            new Estimate(this.store, { ...estimate, type: estimate.type?.toLowerCase() as TEstimateSystemKeys })
          );
        });
      }
      return estimate;
    } catch (error) {
      runInAction(() => {
        this.error = { status: "error", message: "Error creating time estimate" };
      });
      throw error;
    }
  };

  deleteEstimate = async (workspaceSlug: string, projectId: string, estimateId: string) => {
    try {
      await estimateService.deleteEstimate(workspaceSlug, projectId, estimateId);
      runInAction(() => estimateId && unset(this.estimates, [estimateId]));
    } catch (error) {
      runInAction(() => {
        this.error = { status: "error", message: "Error deleting estimate" };
      });
      throw error;
    }
  };
}