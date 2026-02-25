import { observer } from "mobx-react";
// components
import { useTranslation } from "@plane/i18n";
// assets (Retro specific assets use korben)
import AllFiltersImage from "@/app/assets/empty-state/cycle/all-filters.svg?url"; 
import NameFilterImage from "@/app/assets/empty-state/cycle/name-filter.svg?url";
// components
import { RetrosList } from "@/components/retros/list"; 
import { RetroModuleListLayoutLoader } from "@/components/ui/loader/retro-module-list-loader";
// hooks
import { useRetro } from "@/hooks/store/use-retro";
import { useRetroFilter } from "@/hooks/store/use-retro-filter";

export interface IRetrosView {
  workspaceSlug: string;
  projectId: string;
}

export const RetrosView = observer(function RetrosView(props: IRetrosView) {
  const { workspaceSlug, projectId } = props;
  
  // store hooks
  const { currentProjectRetros, loader } = useRetro();
  const { searchQuery, currentProjectDisplayFilters, currentProjectFilters } = useRetroFilter();
  const { t } = useTranslation();

  // derived values - filter retros based on filters
  const filteredRetros = (currentProjectRetros ?? []).filter((retro) => {
    // Apply search query filter
    if (searchQuery.trim() !== "" && !retro.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    // Apply status filters if any
    if (currentProjectFilters?.status && currentProjectFilters.status.length > 0) {
      return currentProjectFilters.status.includes(retro.status);
    }
    return true;
  });

  // Separate retros by status
  const activeRetros = filteredRetros.filter((retro) => retro.status === "active");
  const completedRetros = filteredRetros.filter((retro) => retro.status === "completed");

  if (loader || !currentProjectRetros) return <RetroModuleListLayoutLoader />;

  // Filter apply korar por jodi kichu na paowa jay
  if (filteredRetros.length === 0)
    return (
      <div className="grid h-full w-full place-items-center">
        <div className="text-center">
          <img
            src={searchQuery.trim() === "" ? AllFiltersImage : NameFilterImage}
            className="mx-auto h-36 w-36 sm:h-48 sm:w-48 object-contain"
            alt="No matching retrospectives"
          />
          <h5 className="mb-1 mt-7 text-18 font-medium">
            {t("project_retros.no_matching_retros")}
          </h5>
          <p className="text-14 text-placeholder">
            {searchQuery.trim() === ""
              ? t("project_retros.remove_filters_to_see_all_retros")
              : t("project_retros.remove_search_criteria_to_see_all_retros")}
          </p>
        </div>
      </div>
    );

  return (
    <RetrosList
      completedRetros={completedRetros}
      activeRetros={activeRetros}
      workspaceSlug={workspaceSlug}
      projectId={projectId}
    />
  );
});