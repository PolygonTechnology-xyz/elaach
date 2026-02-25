"use client";

import React, { useState, useEffect, useCallback } from "react";
import { observer } from "mobx-react";
import { ArrowLeft, Plus, X, GripVertical, Trash2, ThumbsUp, ThumbsDown } from "lucide-react";
// components
import { PageHead } from "@/components/core/page-title";
// hooks
import { useRetro } from "@/hooks/store/use-retro";
import { useProject } from "@/hooks/store/use-project";
import { useAppRouter } from "@/hooks/use-app-router";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";

// services
import { RetroService } from "@/services/retro.service"; 
import type { Route } from "./+types/page";

const retroService = new RetroService();

function RetroDetailPage({ params }: Route.ComponentProps) {
  const router = useAppRouter();
  const { workspaceSlug, projectId, retroId } = params;

  const { currentProjectRetros } = useRetro();
  const { getProjectById } = useProject();

  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [retroItems, setRetroItems] = useState<any[]>([]);

  const currentBoard = currentProjectRetros?.find((b) => b.id === retroId);
  const project = getProjectById(projectId);
  const cycleId = currentBoard?.cycle_id;
  
  const pageTitle = project?.name && currentBoard?.name ? `${project?.name} - ${currentBoard?.name}` : "Retro Board";
  const progress = currentBoard?.progress_details || { percentage_completed: "0%", status: "failed" };

  const fetchItems = useCallback(async () => {
    if (!workspaceSlug || !projectId || !cycleId) return;
    try {
      const response = await retroService.getRetroItems(workspaceSlug, projectId, cycleId);
      const initializedItems = response.map((item: any) => ({
        ...item,
        likes: item.likes || 0,
        dislikes: item.dislikes || 0,
      }));
      setRetroItems(initializedItems);
    } catch (error) {
      console.error("Fetch items error:", error);
    }
  }, [workspaceSlug, projectId, cycleId]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleDeleteItem = async (itemId: string) => {
    if (!workspaceSlug || !projectId || !cycleId) return;
    try {
      await retroService.deleteRetroItem(workspaceSlug, projectId, cycleId, itemId);
      setRetroItems((prev) => prev.filter((item) => item.id !== itemId));
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success!",
        message: "Retro Item deleted successfully.",
      });
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  const handleVote = async (itemId: string, type: "likes" | "dislikes") => {

    setRetroItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, [type]: (item[type] || 0) + 1 } : item
      )
    );

  };

  const handleSave = async (category: string) => {
    if (!content.trim() || !currentBoard || !cycleId) return;
    setIsSaving(true);
    try {
      await retroService.createRetroItem(workspaceSlug, projectId, cycleId, {
        retro_board: retroId,
        [category]: content,
      });
      await fetchItems();
      setContent("");
      setActiveCategory(null);
      setToast({ type: TOAST_TYPE.SUCCESS, title: "Success!", message: "Retro item added successfully." });
    } catch (error) {
      setToast({ type: TOAST_TYPE.ERROR, title: "Error!", message: "Failed to save item." });
    } finally {
      setIsSaving(false);
    }
  };
  
  const columns = [
    { id: "glad", title: "Glad"},
    { id: "sad", title: "Sad"},
    { id: "mad", title: "Mad"},
    { id: "action_point", title: "Action Items"},
  ];

  return (
    <>
      <PageHead title={pageTitle} />
      
      <div className="flex h-full w-full flex-col bg-white overflow-hidden text-custom-text-100">
        <header className="flex items-center justify-between border-b border-custom-border-200 px-4 py-3 bg-white">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push(`/${workspaceSlug}/projects/${projectId}/retros`)} className="p-1 hover:bg-custom-background-90 rounded">
              <ArrowLeft size={18} className="text-custom-text-200" />
            </button>
            <h1 className="text-base leading-none">{currentBoard?.name}</h1>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end pr-4 border-r border-custom-border-200">
              <span className="text-[10px] text-custom-text-400 uppercase font-medium">Progress</span>
              <span className="text-xs text-orange-500">{progress.percentage_completed} Completed</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-custom-text-400 uppercase font-medium">Status</span>
              <span className={`text-xs uppercase ${progress.status === "success" ? "text-green-600" : "text-red-600"}`}>
                {progress.status}
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 bg-gray-50/20 overflow-hidden">
          <div className="grid h-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 overflow-y-auto pb-10 custom-scrollbar">
            {columns.map((col) => (
              <div key={col.id} className="flex flex-col gap-2 min-h-0">
                <div className="flex items-center gap-1.5 px-1 py-1 sticky top-0 bg-gray-50/5 z-10">
                  <GripVertical size={14} className="text-custom-text-400" />
                  <span className="text-sm font-medium">{col.title}</span>
                </div>

                <button 
                  onClick={() => { setActiveCategory(col.id); setContent(""); }}
                  className="w-full flex items-center justify-center py-1.5 bg-[#006699] hover:bg-[#005580] text-white rounded shadow-sm transition-all shrink-0"
                >
                  <Plus size={16} strokeWidth={3} />
                </button>

                {activeCategory === col.id && (
                  <div className={`flex flex-col p-3 bg-white rounded border-2 border-[#006699]/50 shadow-md mb-2 shrink-0`}>
                    <textarea 
                      autoFocus
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Type something..."
                      className="w-full bg-transparent border-none text-sm outline-none min-h-[60px] resize-none"
                    />
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                       <X size={14} className="cursor-pointer text-gray-400 hover:text-red-500" onClick={() => setActiveCategory(null)} />
                       <button 
                         disabled={isSaving}
                         onClick={() => handleSave(col.id)}
                         className="px-4 py-1 bg-[#006699] text-white text-[11px] font-bold rounded hover:bg-[#005580]"
                       >
                         {isSaving ? "Saving..." : "Save"}
                       </button>
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-3">
                  {retroItems
                    ?.filter((item: any) => item[col.id] && item[col.id].trim() !== "")
                    .map((item: any) => (
                      <div key={item.id} className="group relative p-3 bg-white rounded border border-custom-border-200 shadow-sm transition-all flex flex-col justify-between min-h-[80px]">
                        
                        
                        <button 
                          onClick={() => handleDeleteItem(item.id)}
                          className="absolute top-2 right-2 p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={14} />
                        </button>

                        
                        <div className="flex-1">
                          <p className="text-sm text-custom-text-100 whitespace-pre-wrap pr-5">{item[col.id]}</p>
                        </div>

                        <div className="mt-3 flex items-center justify-between border-t border-gray-50 pt-2">
                          <div className="text-[9px] text-custom-text-400">
                            {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>

                          <div className="flex items-center gap-3">
                            <button 
                              onClick={() => handleVote(item.id, "likes")}
                              className="flex items-center gap-1 text-gray-400 transition-colors"
                            >
                              <ThumbsUp size={14} />
                              <span className="text-[11px] font-medium">{item.likes || 0}</span>
                            </button>

                            <button 
                              onClick={() => handleVote(item.id, "dislikes")}
                              className="flex items-center gap-1 text-gray-400 hover:text-orange-600 transition-colors"
                            >
                              <ThumbsDown size={14} />
                              <span className="text-[11px] font-medium">{item.dislikes || 0}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </>
  );
}

export default observer(RetroDetailPage);