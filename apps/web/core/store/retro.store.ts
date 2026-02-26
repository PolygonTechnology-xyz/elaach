import { observable, action, makeObservable, runInAction, computed } from "mobx";
// Types and Services import
import type { IRetroBoard, IRetroItem } from "@plane/types";
import { RetroService } from "@/services/retro.service";
import { CoreRootStore } from "./root.store";

export class IRetroStore {
  
  loader: boolean = false;
  retroBoardMap: Record<string, IRetroBoard> = {}; 
  retroItemsMap: Record<string, IRetroItem[]> = {}; 
  rootStore: CoreRootStore;
  retroService: RetroService;
  retroDetails: IRetroBoard | null = null;
  

  constructor(_rootStore: CoreRootStore) {
    makeObservable(this, {
      loader: observable,
      retroBoardMap: observable,
      retroItemsMap: observable,
      currentProjectRetros: computed,
      fetchBoards: action,
      createBoard: action,
      updateBoard: action,
      deleteBoard: action,
      addRetroItem: action,
      updateRetroItem: action,
      deleteRetroItem: action,
    });
    this.rootStore = _rootStore;
    this.retroService = new RetroService();
  }

  get currentProjectRetros() {
    const projectId = this.rootStore.router.projectId;
    return Object.values(this.retroBoardMap).filter((b) => b.project === projectId);
  }

  fetchBoards = async (workspaceSlug: string, projectId: string, cycleId: string) => {
    this.loader = true;
    try {
      const response = await this.retroService.getRetroBoards(workspaceSlug, projectId, cycleId);
      runInAction(() => {
        response.forEach((board) => {
          this.retroBoardMap[board.id] = board;
          if (board.details) {
            this.retroItemsMap[board.id] = board.details;
          }
        });
        this.loader = false;
      });
    } catch (error) {
      runInAction(() => (this.loader = false));
      throw error;
    }
  };

  createBoard = async (workspaceSlug: string, projectId: string, cycleId: string, data: { name: string; description?: string }) => {
    try {
      const response = await this.retroService.createRetroBoard(workspaceSlug, projectId, cycleId, data);
      runInAction(() => {
        this.retroBoardMap[response.id] = response;
      });
      return response;
    } catch (error) {
      throw error;
    }
  };

  updateBoard = async (workspaceSlug: string, projectId: string, boardId: string, data: Partial<IRetroBoard>) => {
    try {
      const response = await this.retroService.updateRetroBoard(workspaceSlug, projectId, boardId, data);
      runInAction(() => {
        this.retroBoardMap[boardId] = response;
      });
      return response;
    } catch (error) {
      throw error;
    }
  };

  deleteBoard = async (workspaceSlug: string, projectId: string, boardId: string) => {
    try {
      await this.retroService.deleteRetroBoard(workspaceSlug, projectId, boardId);
      runInAction(() => {
        delete this.retroBoardMap[boardId];
        delete this.retroItemsMap[boardId];
      });
    } catch (error) {
      throw error;
    }
  };

  addRetroItem = async (workspaceSlug: string, projectId: string, cycleId: string, boardId: string, data: Partial<IRetroItem>) => {
    try {
      const response = await this.retroService.createRetroItem(workspaceSlug, projectId, cycleId, { ...data, retro_board: boardId });
      runInAction(() => {
        if (!this.retroItemsMap[boardId]) this.retroItemsMap[boardId] = [];
        this.retroItemsMap[boardId].push(response);
      });
      return response;
    } catch (error) {
      throw error;
    }
  };

  updateRetroItem = async (workspaceSlug: string, projectId: string, cycleId: string, boardId: string, itemId: string, data: Partial<IRetroItem>) => {
    try {
      const response = await this.retroService.updateRetroItem(workspaceSlug, projectId, cycleId, itemId, data);
      runInAction(() => {
        const index = this.retroItemsMap[boardId]?.findIndex((i) => i.id === itemId);
        if (index !== -1) this.retroItemsMap[boardId][index] = response;
      });
      return response;
    } catch (error) {
      throw error;
    }
  };

  // Delete a note
  deleteRetroItem = async (workspaceSlug: string, projectId: string, cycleId: string, boardId: string, itemId: string) => {
    try {
      await this.retroService.deleteRetroItem(workspaceSlug, projectId, cycleId, itemId);
      runInAction(() => {
        this.retroItemsMap[boardId] = this.retroItemsMap[boardId]?.filter((i) => i.id !== itemId);
      });
    } catch (error) {
      throw error;
    }
  };
}