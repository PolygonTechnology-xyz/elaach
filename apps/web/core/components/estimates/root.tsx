"use client";

import { useState, useMemo } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { useTranslation } from "@plane/i18n";
import { EmptyStateCompact } from "@plane/propel/empty-state";
import { useProjectEstimates } from "@/hooks/store/estimates";
import { UpdateEstimateModal } from "@/plane-web/components/estimates";
import { CreateEstimateModal } from "./create/modal";
import { DeleteEstimateModal } from "./delete/modal";
import { EstimateList } from "./estimate-list";
import { EstimateLoaderScreen } from "./loader-screen";
// import { Button } from "@plane/propel/button";
type TEstimateRoot = {
  workspaceSlug: string;
  projectId: string;
  isAdmin: boolean;
};

export const EstimateRoot = observer(function EstimateRoot(props: TEstimateRoot) {
  const { workspaceSlug, projectId, isAdmin } = props;
  
  const { 
    loader, 
    estimateIdsByProjectId, 
    getEstimateById, 
    getProjectEstimates 
  } = useProjectEstimates();
  
  const [isEstimateCreateModalOpen, setIsEstimateCreateModalOpen] = useState(false);
  const [estimateToUpdate, setEstimateToUpdate] = useState<string | undefined>();
  const [estimateToDelete, setEstimateToDelete] = useState<string | undefined>();

  const { t } = useTranslation();

  const { isLoading: isSWRLoading } = useSWR(
    workspaceSlug && projectId ? `PROJECT_ESTIMATES_${workspaceSlug}_${projectId}` : null,
    async () => workspaceSlug && projectId && getProjectEstimates(workspaceSlug, projectId)
  );

  const allProjectEstimateIds = estimateIdsByProjectId(projectId) || [];

  const pointsEstimateIds = useMemo(() => 
    allProjectEstimateIds.filter((id) => getEstimateById(id)?.type?.toLowerCase() === "points"),
    [allProjectEstimateIds, getEstimateById]
  );

  const timeEstimateIds = useMemo(() => 
    allProjectEstimateIds.filter((id) => getEstimateById(id)?.type?.toLowerCase() === "time"),
    [allProjectEstimateIds, getEstimateById]
  );

  const hasEstimates = allProjectEstimateIds.length > 0;

  return (
    <div className="container mx-auto">
      {loader === "init-loader" || isSWRLoading ? (
        <EstimateLoaderScreen />
      ) : (
        <div className="space-y-6">
          {hasEstimates ? (
            <div className="py-6 space-y-8">
              <div className=" pb-4 flex justify-between items-end">
                <div>
                  <h3 className="text-16 font-medium text-primary">
                    {t("project_settings.estimates.title")}
                  </h3>
                  <p className="text-13 text-secondary">
                    {t("project_settings.estimates.enable_description")}
                  </p>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => setIsEstimateCreateModalOpen(true)}
                    className="inline-flex items-center justify-center gap-1 whitespace-nowrap transition-colors focus-visible:outline-none disabled:pointer-events-none bg-accent-primary hover:bg-accent-primary-hover active:bg-accent-primary-active disabled:bg-layer-disabled text-on-color disabled:text-on-color-disabled h-6 px-2 text-body-xs-medium rounded-md"
                  >
                    + Add More
                  </button>
                )}
              </div>

              <div className="space-y-8">
                {pointsEstimateIds.length > 0 && (
                  <div className="space-y-3">
                    {/* <h4 className="text-14 font-semibold text-primary uppercase tracking-wider">Points System</h4> */}
                    <EstimateList
                      estimateIds={pointsEstimateIds}
                      isAdmin={isAdmin}
                      isEstimateEnabled={true} 
                      isEditable
                      onEditClick={(id) => setEstimateToUpdate(id)}
                      onDeleteClick={(id) => setEstimateToDelete(id)}
                    />
                  </div>
                )}

                {timeEstimateIds.length > 0 && (
                  <div className="space-y-3">
                    {/* <h4 className="text-14 font-semibold text-primary uppercase tracking-wider">Time System</h4> */}
                    <EstimateList
                      estimateIds={timeEstimateIds}
                      isAdmin={isAdmin}
                      isEstimateEnabled={true} 
                      isEditable
                      onEditClick={(id) => setEstimateToUpdate(id)}
                      onDeleteClick={(id) => setEstimateToDelete(id)}
                    />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <EmptyStateCompact
              assetKey="estimate"
              assetClassName="size-20"
              title={t("settings_empty_state.estimates.title")}
              description={t("settings_empty_state.estimates.description")}
              actions={[
                {
                  label: t("settings_empty_state.estimates.cta_primary"),
                  onClick: () => setIsEstimateCreateModalOpen(true),
                },
              ]}
              align="start"
              rootClassName="py-20"
            />
          )}
        </div>
      )}

      <CreateEstimateModal
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        isOpen={isEstimateCreateModalOpen}
        handleClose={() => setIsEstimateCreateModalOpen(false)}
      />
      <UpdateEstimateModal
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        estimateId={estimateToUpdate}
        isOpen={!!estimateToUpdate}
        handleClose={() => setEstimateToUpdate(undefined)}
      />
      <DeleteEstimateModal
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        estimateId={estimateToDelete}
        isOpen={!!estimateToDelete}
        handleClose={() => setEstimateToDelete(undefined)}
      />
    </div>
  );
});