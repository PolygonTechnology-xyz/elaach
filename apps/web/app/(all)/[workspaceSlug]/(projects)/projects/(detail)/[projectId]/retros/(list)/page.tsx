import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useNavigate } from "react-router";
// plane imports
import { EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EmptyStateDetailed } from "@plane/propel/empty-state";
import { EUserProjectRoles } from "@plane/types";
import { Button, Loader, AlertModalCore } from "@plane/ui";
import { Plus, Trash2 } from "lucide-react";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { useTheme } from "next-themes";
import darkRetrosAsset from "@/app/assets/empty-state/disabled-feature/pages-dark.webp?url"; 
import lightRetrosAsset from "@/app/assets/empty-state/disabled-feature/pages-light.webp?url";

// components
import { PageHead } from "@/components/core/page-title";
import { RetroService } from "@/services/retro.service";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user";
import { useRetro } from "@/hooks/store/use-retro";
import type { Route } from "./+types/page";
import { RetroCreateUpdateModal } from "@/components/retros/modal";

function ProjectRetrosPage({ params }: Route.ComponentProps) {
  // states
  const [createModal, setCreateModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [selectedBoard, setSelectedBoard] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const navigate = useNavigate();
  
  const { getProjectById } = useProject();
  const { allowPermissions } = useUserPermissions();
  const { fetchBoards, currentProjectRetros, deleteBoard } = useRetro();
  const { resolvedTheme } = useTheme();
  
  const { t } = useTranslation();
  const { workspaceSlug, projectId } = params;

  const handleRefresh = () => {
    if (workspaceSlug && projectId) {
      fetchBoards(workspaceSlug, projectId, "");
    }
  }

  useEffect(() => {
    if (workspaceSlug && projectId) {
      fetchBoards(workspaceSlug, projectId, "");
    }
  }, [workspaceSlug, projectId, fetchBoards]);

  const project = getProjectById(projectId);
  const pageTitle = project?.name ? `${project?.name} - Retro` : "Retro";
  const resolvedPath = resolvedTheme === "dark" ? darkRetrosAsset : lightRetrosAsset;
  
  const hasMemberLevelPermission = allowPermissions(
    [EUserProjectRoles.ADMIN, EUserProjectRoles.MEMBER],
    EUserPermissionsLevel.PROJECT
  );

  const handleCloseDeleteModal = () => {
    setDeleteModal(false);
    setSelectedBoard(null);
    setIsDeleting(false);
  };

  const handleConfirmDelete = async () => {
    if (!selectedBoard || !workspaceSlug || !projectId) return;
    setIsDeleting(true);
    try {
      await deleteBoard(workspaceSlug, projectId, selectedBoard.id);
      handleRefresh();
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success!",
        message: "Retro board deleted successfully.",
      });
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Failed to delete retro board.",
      });
    } finally {
      handleCloseDeleteModal();
    }
  };

  const handleBoardClick = (boardId: string) => {
    navigate(`/${workspaceSlug}/projects/${projectId}/retros/${boardId}`);
  };

  const totalRetros = currentProjectRetros?.length || 0;

  const calculateBoardProgress = (board: any) => {
    const progressDetails = board.progress_details || {};
    const totalIssues = progressDetails.total_issues || 0;
    const completedIssues = progressDetails.completed_issues || 0;
    return totalIssues > 0 ? Math.round((completedIssues / totalIssues) * 100) : 0;
  };

  const calculateBoardStatus = (percent: number) => percent >= 80 ? "Success" : "Failed";
  
 return (
  <>
    <PageHead title={pageTitle} />
    
    <AlertModalCore
      isOpen={deleteModal}
      handleClose={handleCloseDeleteModal}
      handleSubmit={handleConfirmDelete}
      isSubmitting={isDeleting}
      title="Delete Retro Board"
      content={
        <>
          Are you sure you want to delete retro board{" "}
          <span className="break-words font-medium text-custom-text-100">
            {project?.identifier}-{selectedBoard?.sequence_id}
          </span>
          ? This action cannot be undone.
        </>
      }
    />

    <div className="w-full h-full flex flex-col bg-white dark:bg-[#0d0e10]">
      <RetroCreateUpdateModal 
        isOpen={createModal} 
        handleClose={() => setCreateModal(false)}
        workspaceSlug={workspaceSlug}
        projectId={projectId}
      />

      <div className="flex-1 overflow-y-auto">
        {totalRetros === 0 ? (
          <div className="h-full grid place-items-center">
            <EmptyStateDetailed
              assetKey="cycle"
              assetPath={resolvedPath}
              title="Reflect and improve with Retrospectives."
              description="Review your team's progress through Glad, Sad, and Mad buckets. Identify blockers in real-time, turn feedback into actionable points, and evolve your workflow after every cycle."
              actions={[
                {
                  label: "Add retro board",
                  onClick: () => setCreateModal(true),
                  className: "bg-[#006699] hover:bg-[#005580] text-white transition-colors",
                  disabled: !hasMemberLevelPermission,
                },
              ]}
            />
          </div>
        ) : (
          <div className="flex flex-col">
            <div className="flex items-center px-4 py-2.5 bg-white dark:bg-[#0d0e10] border-b border-[#F0F0F0] dark:border-white/5">
              <h3 className="text-[17px] font-medium text-gray-500 dark:text-custom-text-200">
                All retro boards ({totalRetros})
              </h3>
            </div>

            {currentProjectRetros?.map((board, index) => {
              const boardProgress = calculateBoardProgress(board);
              const boardStatus = calculateBoardStatus(boardProgress);
              
              return (
                <div 
                  key={board.id} 
                  className="group flex items-center gap-2 px-4 py-2 border-b border-[#F0F0F0] dark:border-white/5 bg-white dark:bg-[#0d0e10] hover:bg-[#F0F0F0] dark:hover:bg-white/[0.06] transition-all duration-200 cursor-pointer"
                  onClick={() => handleBoardClick(board.id)}
                >
                  {/* ID section */}
                  <div className="w-[120px] shrink-0 text-[11px] dark:text-custom-text-400  font-sm">
                    {project?.identifier}-{board.sequence_id || (index + 1)}
                  </div>

                  {/* Title section */}
                  <div className="flex-1 min-w-[200px]">
                    <h4 className="text-[13px] text-gray-900 dark:text-custom-text-100 truncate">
                      {board.name}
                    </h4>
                  </div>

                  {/* Metadata section */}
                  <div className="w-[150px] shrink-0 text-[13px] text-gray-500 dark:text-custom-text-300">
                    {board.cycle_name || "-"}
                  </div>

                  {/* Stats section */}
                  <div className="flex items-center gap-6 w-[220px] justify-end">
                    <span className="text-[11px] text-gray-400 dark:text-custom-text-400 font-medium">{boardProgress}%</span>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border uppercase tracking-tight ${
                      boardStatus === "Success" 
                        ? "bg-green-500/10 text-green-500 border-green-500/20" 
                        : "bg-red-500/10 text-red-500 border-red-500/20"
                    }`}>
                      {boardStatus}
                    </span>
                  </div>

                  <div className="w-10 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedBoard(board);
                        setDeleteModal(true);
                      }}
                      className="p-1.5 text-gray-400 dark:text-custom-text-400 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}

            <button 
              onClick={() => setCreateModal(true)}
              disabled={!hasMemberLevelPermission}
              className="group flex items-center gap-2 px-4 py-3 text-[13px] font-medium border-b border-[#F0F0F0] dark:border-white/5 bg-white dark:bg-[#0d0e10] hover:bg-[#F0F0F0] dark:hover:bg-white/[0.06] transition-all duration-200 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New retro board</span>
            </button>
          </div>
        )}
      </div>
    </div>
  </>
);
}

export default observer(ProjectRetrosPage);