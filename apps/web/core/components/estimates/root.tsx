import { useState, useEffect } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
// plane imports
import { useTranslation } from "@plane/i18n";
// hooks
import { EmptyStateCompact } from "@plane/propel/empty-state";
import { useProjectEstimates } from "@/hooks/store/estimates";
import { useProject } from "@/hooks/store/use-project";
// plane web components
import { UpdateEstimateModal } from "@/plane-web/components/estimates";
// local imports
import { SettingsHeading } from "../settings/heading";
import { CreateEstimateModal } from "./create/modal";
import { DeleteEstimateModal } from "./delete/modal";
import { EstimateList } from "./estimate-list";
import { EstimateLoaderScreen } from "./loader-screen";

type TEstimateRoot = {
  workspaceSlug: string;
  projectId: string;
  isAdmin: boolean;
};

export const EstimateRoot = observer(function EstimateRoot(props: TEstimateRoot) {
  const { workspaceSlug, projectId, isAdmin } = props;
  
  // hooks
  const { currentProjectDetails } = useProject();
  const { loader, currentActiveEstimateId, archivedEstimateIds, getProjectEstimates } = useProjectEstimates();
  
  // states
  const [isEstimateCreateModalOpen, setIsEstimateCreateModalOpen] = useState(false);
  const [estimateToUpdate, setEstimateToUpdate] = useState<string | undefined>();
  const [estimateToDelete, setEstimateToDelete] = useState<string | undefined>();

  const { t } = useTranslation();

  const { isLoading: isSWRLoading } = useSWR(
    workspaceSlug && projectId ? `PROJECT_ESTIMATES_${workspaceSlug}_${projectId}` : null,
    async () => workspaceSlug && projectId && getProjectEstimates(workspaceSlug, projectId)
  );

  

  return (
    <div className="container mx-auto">
      {loader === "init-loader" || isSWRLoading ? (
        <EstimateLoaderScreen />
      ) : (
        <div className="space-y-6">
          {/* header */}
          <SettingsHeading
            title={t("project_settings.estimates.heading")}
            description={t("project_settings.estimates.description")}
          />

          {currentActiveEstimateId ? (
            <div className="space-y-4">
              <div className="border-b border-subtle pb-4">
                <h3 className="text-16 font-medium text-primary">
                  {t("project_settings.estimates.title")}
                </h3>
                <p className="text-13 text-secondary">
                  {t("project_settings.estimates.enable_description")}
                </p>
              </div>

              {/* active estimates section */}
              <EstimateList
                estimateIds={[currentActiveEstimateId]}
                isAdmin={isAdmin}

                // make by default true hardcoded 
                isEstimateEnabled={true} 
                isEditable
                onEditClick={(estimateId: string) => setEstimateToUpdate(estimateId)}
                onDeleteClick={(estimateId: string) => setEstimateToDelete(estimateId)}
              />
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

          {/* archived estimates section */}
          {archivedEstimateIds && archivedEstimateIds.length > 0 && (
            <div className="pt-6">
              <div className="border-b border-subtle space-y-1 pb-4">
                <h3 className="text-16 font-medium text-primary">Archived estimates</h3>
                <p className="text-13 text-secondary">
                  These are estimates from older versions not currently in use.
                </p>
              </div>
              <EstimateList estimateIds={archivedEstimateIds} isAdmin={isAdmin} />
            </div>
          )}
        </div>
      )}

      {/* CRUD modals */}
      <CreateEstimateModal
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        isOpen={isEstimateCreateModalOpen}
        handleClose={() => setIsEstimateCreateModalOpen(false)}
      />
      <UpdateEstimateModal
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        estimateId={estimateToUpdate ? estimateToUpdate : undefined}
        isOpen={!!estimateToUpdate}
        handleClose={() => setEstimateToUpdate(undefined)}
      />
      <DeleteEstimateModal
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        estimateId={estimateToDelete ? estimateToDelete : undefined}
        isOpen={!!estimateToDelete}
        handleClose={() => setEstimateToDelete(undefined)}
      />
    </div>
  );
});