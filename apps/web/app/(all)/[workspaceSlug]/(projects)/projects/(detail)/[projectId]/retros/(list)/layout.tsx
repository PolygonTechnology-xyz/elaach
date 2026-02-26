import { useState, useEffect } from "react";
import { Outlet } from "react-router";
// components
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
import { RetroListHeader } from "./header";
import { RetroListMobileHeader } from "./mobile-header";
import { RetroCreateUpdateModal } from "@/components/retros/modal";
import { useParams, useSearchParams } from "next/navigation";
// hooks
import { useRetro } from "@/hooks/store/use-retro";

export default function ProjectRetrosListLayout() {
  const [createModal, setCreateModal] = useState(false);
  const { workspaceSlug, projectId } = useParams();
  const { fetchBoards } = useRetro();
  const searchParams = useSearchParams();
  const cycleId = searchParams.get("cycleId") || "";

  useEffect(() => {
    if (createModal && workspaceSlug && projectId && cycleId) {

      fetchBoards(workspaceSlug as string, projectId as string, cycleId);
    }
  }, [createModal, workspaceSlug, projectId, cycleId, fetchBoards]);

  return (
    <>
      <RetroCreateUpdateModal 
        isOpen={createModal} 
        handleClose={() => setCreateModal(false)}
        workspaceSlug={workspaceSlug as string}
        projectId={projectId as string}
        cycleId={cycleId}
      />
      <AppHeader 
        header={<RetroListHeader onCreateClick={() => setCreateModal(true)} />} 
        mobileHeader={<RetroListMobileHeader />} 
      />
      <ContentWrapper>
        <Outlet />
      </ContentWrapper>
    </>
  );
}