import { useCallback } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { EIssuesStoreType } from "@plane/types";
import { useIssues } from "@/hooks/store/use-issues";

interface IRetroDetailsProps {
  workspaceSlug: string;
  projectId: string;
  retroId?: string | null;
}

const useRetroDetails = (props: IRetroDetailsProps) => {
  const { workspaceSlug, projectId, retroId } = props;
  const router = useRouter();

  // const {
  //   issues: { getActiveCycleById: getRetroByIdFromIssue },
  // } = useIssues(EIssuesStoreType.CYCLE);

  const handleRetroNavigation = useCallback(
    (id: string) => {
      if (!workspaceSlug || !projectId || !id) return;
      router.push(`/${workspaceSlug}/projects/${projectId}/retros/${id}`);
    },
    [workspaceSlug, projectId, router]
  );

  const { data: retroData, mutate: mutateRetro } = useSWR(
    workspaceSlug && projectId && retroId ? `PROJECT_RETRO_${projectId}_${retroId}` : null,
    null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  const handleBackToBoards = useCallback(() => {
    router.push(`/${workspaceSlug}/projects/${projectId}/retros/`);
  }, [workspaceSlug, projectId, router]);

  return {
    retroId,
    retroData,
    router,
    handleRetroNavigation,
    handleBackToBoards,
    mutateRetro,
  };
};

export default useRetroDetails;