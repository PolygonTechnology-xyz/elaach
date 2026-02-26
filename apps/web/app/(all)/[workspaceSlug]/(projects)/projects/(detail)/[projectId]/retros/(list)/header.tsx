import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// ui
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { RefreshCcw } from "lucide-react"; 
import { Breadcrumbs, Header } from "@plane/ui";
// components
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user";
import { useAppRouter } from "@/hooks/use-app-router";
// plane web imports
import { CommonProjectBreadcrumbs } from "@/plane-web/components/breadcrumbs/common";

type Props = {
  onCreateClick: () => void;
};

export const RetroListHeader = observer(function RetroListHeader({ onCreateClick }: Props) {
  // router
  const router = useAppRouter();
  const { workspaceSlug, projectId } = useParams(); 
  const { allowPermissions } = useUserPermissions();
  const { currentProjectDetails, loader } = useProject();
  const { t } = useTranslation();

  const canUserCreateRetro = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.PROJECT
  );

  return (
    <Header>
      <Header.LeftItem>
        <Breadcrumbs onBack={router.back} isLoading={loader === "init-loader"}>
          <CommonProjectBreadcrumbs 
            workspaceSlug={workspaceSlug?.toString()} 
            projectId={projectId?.toString()} 
          />
          <Breadcrumbs.Item
            component={
              <BreadcrumbLink
                label="Retros" 
                href={`/${workspaceSlug}/projects/${currentProjectDetails?.id}/retros/`}
                icon={<RefreshCcw className="h-4 w-4 text-tertiary" />}
                isLast
              />
            }
            isLast
          />
        </Breadcrumbs>
      </Header.LeftItem>
      
      {canUserCreateRetro && currentProjectDetails ? (
        <Header.RightItem>
          <Button
            variant="primary"
            size="lg"
            className="bg-[#006699] hover:bg-[#005580] text-white transition-colors"
            onClick={onCreateClick}
          >
            <div className="sm:hidden block">{t("add")}</div>
            <div className="hidden sm:block">Add retro board</div>
          </Button>
        </Header.RightItem>
      ) : null}
    </Header>
  );
});