import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useNavigate } from "react-router";
// plane imports
import { EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EmptyStateDetailed } from "@plane/propel/empty-state";
import { EUserProjectRoles } from "@plane/types";
import { Button, Loader } from "@plane/ui";
import { Plus, Trash2 } from "lucide-react";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
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
  const [createModal, setCreateModal] = useState(false);
  const navigate = useNavigate();
  
  const { getProjectById } = useProject();
  const { allowPermissions } = useUserPermissions();
  const { fetchBoards, currentProjectRetros, deleteBoard } = useRetro();
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
  
  const hasMemberLevelPermission = allowPermissions(
    [EUserProjectRoles.ADMIN, EUserProjectRoles.MEMBER],
    EUserPermissionsLevel.PROJECT
  );

  const handleDeleteBoard = async (boardId: string) => {
    if (confirm("Are you sure you want to delete this retro board?")) {
      try {
        await deleteBoard(workspaceSlug, projectId, boardId);
          // await fetchBoards(workspaceSlug, projectId, "");
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
      }
    }
  };
  console.log("cycle id in retros list page:", currentProjectRetros?.[0]?.cycle_id);
  console.log("project id in retros list page:", projectId);
  console.log("board id in retros list page:", currentProjectRetros?.[0]?.id);

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
      <div className="w-full h-full flex flex-col bg-white">
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
                title="No retro found"
                description="Use retro to reflect on your team's performance."
                actions={[
                  {
                    label: "Create Retros",
                    onClick: () => setCreateModal(true),
                    variant: "primary",
                    disabled: !hasMemberLevelPermission,
                  },
                ]}
              />
            </div>
          ) : (
            <div className="flex flex-col">
              <div className="flex items-center gap-2 px-6 py-2 text-13 font-medium hover:bg-[#EAEAEA] block border-b border-strong transition-colors duration-150 text-left">
                <h3 className="font-semibold text-custom-text-100 text-sm">
                  Retro Boards ({totalRetros})
                </h3>
              </div>

              {currentProjectRetros?.map((board, index) => {
                const boardProgress = calculateBoardProgress(board);
                const boardStatus = calculateBoardStatus(boardProgress);
                
                return (
                  <div 
                    key={board.id} 
                    className="flex items-center gap-2 px-6 py-2 text-13 font-medium hover:bg-[#EAEAEA] block border-b border-strong transition-colors duration-150 text-left"
                    onClick={() => handleBoardClick(board.id)}
                  >
                    <div className="w-[100px] shrink-0 text-[11px] text-[#8E8E8E] uppercase">
                      {project?.identifier}-{board.sequence_id || (index + 1)}
                    </div>

                    <div className="flex-1 min-w-[200px]">
                      <h4 className="text-sm text-custom-text-100 truncate">{board.name}</h4>
                    </div>

                    <div className="w-[180px] shrink-0 text-sm text-custom-text-200 truncate text-left px-4">
                      {board.cycle_name || "-"}
                    </div>

                    <div className="w-[80px] shrink-0 text-sm text-custom-text-100 text-left px-4 font-medium">
                      {boardProgress}%
                    </div>

                    <div className={`w-[100px] shrink-0 text-sm font-medium text-left ${boardStatus === "Success" ? "text-green-500" : "text-red-500"}`}>
                      {boardStatus}
                    </div>

                    <div className="w-10 flex justify-end">
                      {hasMemberLevelPermission && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteBoard(board.id);
                          }}
                          className="p-1.5 group-hover:text-custom-text-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              <button 
                onClick={() => setCreateModal(true)}
                disabled={!hasMemberLevelPermission}
                className="flex items-center gap-2 px-6 py-3 text-13 font-medium hover:bg-[#EAEAEA] block border-b border-strong transition-colors duration-150 text-left"
              >
                <Plus size={14} />
                <span>New Retro</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default observer(ProjectRetrosPage);