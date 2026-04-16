import { action, makeObservable, observable, runInAction } from "mobx";
import { CycleService } from "@plane/services";
import type { ICycle } from "@plane/types";
import type { CoreRootStore } from "./root.store";

export interface ICycleStore {
  cycles: ICycle[] | undefined;
  getCycleById: (cycleId: string | undefined) => ICycle | undefined;
  fetchCycles: (workspaceSlug: string, projectId: string) => Promise<ICycle[]>;
  patchCycle: (
    workspaceSlug: string, 
    projectId: string, 
    cycleId: string, 
    data: Partial<ICycle>
  ) => Promise<any>;
}

export class CycleStore implements ICycleStore {
  cycles: ICycle[] | undefined = undefined;
  cycleService: CycleService;
  rootStore: CoreRootStore;

  constructor(_rootStore: CoreRootStore) {
    makeObservable(this, {
      cycles: observable,
      fetchCycles: action,
      patchCycle: action,
    });
    this.cycleService = new CycleService();
    this.rootStore = _rootStore;
  }

  getCycleById = (cycleId: string | undefined) => 
    this.cycles?.find((cycle) => cycle.id === cycleId);

  fetchCycles = async (workspaceSlug: string, projectId: string) => {
    const cyclesResponse = await this.cycleService.getWithParams(workspaceSlug, projectId);
    runInAction(() => {
      this.cycles = cyclesResponse;
    });
    return cyclesResponse;
  };

  patchCycle = async (
    workspaceSlug: string,
    projectId: string,
    cycleId: string,
    data: Partial<ICycle>
  ) => {
    try {
      const response = await this.cycleService.update(workspaceSlug, projectId, cycleId, data);
      runInAction(() => {
        if (this.cycles) {
          const index = this.cycles.findIndex((c) => c.id === cycleId);
          if (index !== -1) {
            this.cycles[index] = { ...this.cycles[index], ...response };
          }
        }
      });
      return response;
    } catch (error) {
      throw error;
    }
  };
}