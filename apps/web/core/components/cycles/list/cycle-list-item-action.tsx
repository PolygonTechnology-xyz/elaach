import type { FC, MouseEvent } from "react";
import React, { useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react";
import { useParams, usePathname, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { Eye, ArrowRight, CalendarDays } from "lucide-react";
// plane imports
import {
  CYCLE_TRACKER_EVENTS,
  EUserPermissions,
  EUserPermissionsLevel,
  IS_FAVORITE_MENU_OPEN,
  CYCLE_TRACKER_ELEMENTS,
} from "@plane/constants";
import { useLocalStorage } from "@plane/hooks";
import { useTranslation } from "@plane/i18n";
import { TransferIcon, WorkItemsIcon, MembersPropertyIcon } from "@plane/propel/icons";
import { setPromiseToast } from "@plane/propel/toast";
import { Tooltip } from "@plane/propel/tooltip";
import type { ICycle, TCycleGroups } from "@plane/types";
import { Avatar, AvatarGroup, FavoriteStar, CustomSelect } from "@plane/ui";
import { getDate, getFileURL, generateQueryParams } from "@plane/utils";
// components
import { DateRangeDropdown } from "@/components/dropdowns/date-range";
import { ButtonAvatars } from "@/components/dropdowns/member/avatar";
import { MergedDateDisplay } from "@/components/dropdowns/merged-date";
// hooks
import { captureError, captureSuccess } from "@/helpers/event-tracker.helper";
import { useCycle } from "@/hooks/store/use-cycle";
import { useMember } from "@/hooks/store/use-member";
import { useUserPermissions } from "@/hooks/store/user";
import { useAppRouter } from "@/hooks/use-app-router";
import { usePlatformOS } from "@/hooks/use-platform-os";
import { useTimeZoneConverter } from "@/hooks/use-timezone-converter";
import { CycleAdditionalActions } from "@/plane-web/components/cycles";
import { CycleQuickActions } from "../quick-actions";
import { TransferIssuesModal } from "../transfer-issues-modal";

type Props = {
  workspaceSlug: string;
  projectId: string;
  cycleId: string;
  cycleDetails: ICycle;
  parentRef: React.RefObject<HTMLDivElement>;
  isActive?: boolean;
};

const UAT_S_OPTIONS = [
  { key: "#000000", label: "Black" },
  { key: "#D32F2F", label: "Red" },
  { key: "#388E3C", label: "Green" },
  { key: "#FBC02D", label: "Amber" },
];

export const CycleListItemAction = observer((props: Props) => {
  const { workspaceSlug, projectId, cycleId, cycleDetails, parentRef, isActive = false } = props;
  const {
    status,
    total_issues,
    cancelled_issues,
    completed_issues,
    start_date,
    end_date,
    created_by,
    assignee_ids,
    is_favorite,
    archived_at,
    uat_status,
  } = cycleDetails;

  // hooks & router
  const { projectId: routerProjectId } = useParams();
  const router = useAppRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { isMobile } = usePlatformOS();
  const { t } = useTranslation();

  // store hooks
  const { addCycleToFavorites, removeCycleFromFavorites, updateCycleDetails } = useCycle();
  const { allowPermissions } = useUserPermissions();
  const { getUserDetails } = useMember();
  const { isProjectTimeZoneDifferent, getProjectUTCOffset, renderFormattedDateInUserTimezone } =
    useTimeZoneConverter(projectId);

  // states
  const [transferIssuesModal, setTransferIssuesModal] = useState(false);
  const [isUpdatingUat, setIsUpdatingUat] = useState(false);

  const { setValue: toggleFavoriteMenu, storedValue: isFavoriteMenuOpen } = useLocalStorage<boolean>(
    IS_FAVORITE_MENU_OPEN,
    false
  );
  const { reset } = useForm({ defaultValues: { start_date: null, end_date: null } });

  // derived values
  const cycleStatus = status ? (status.toLocaleLowerCase() as TCycleGroups) : "draft";
  const showIssueCount = cycleStatus === "draft" || cycleStatus === "upcoming";
  const transferableIssuesCount = total_issues - (cancelled_issues + completed_issues);
  const showTransferIssues = routerProjectId && transferableIssuesCount > 0 && cycleStatus === "completed";
  const isEditingAllowed = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.PROJECT,
    workspaceSlug,
    projectId
  );
  const createdByDetails = created_by ? getUserDetails(created_by) : undefined;

  useEffect(() => {
    if (cycleDetails) reset({ ...cycleDetails });
  }, [cycleDetails, reset]);

  // Handlers
  const handleUatStatusChange = async (val: string) => {
    if (!workspaceSlug || !projectId || !cycleId) return;
    setIsUpdatingUat(true);
    const updatePromise = updateCycleDetails(workspaceSlug, projectId, cycleId, { uat_status: val });
    setPromiseToast(updatePromise, {
      loading: "Updating UAT status...",
      success: { title: "Success", message: () => "UAT status updated successfully." },
      error: { title: "Error", message: () => "Failed to update UAT status." },
    });
    setIsUpdatingUat(false);
  };

  const handleFavoriteToggle = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const action = is_favorite ? removeCycleFromFavorites : addCycleToFavorites;
    const trackerEvent = is_favorite ? CYCLE_TRACKER_EVENTS.unfavorite : CYCLE_TRACKER_EVENTS.favorite;

    const promise = action(workspaceSlug, projectId, cycleId)
      .then(() => {
        if (!is_favorite && !isFavoriteMenuOpen) toggleFavoriteMenu(true);
        captureSuccess({ eventName: trackerEvent, payload: { id: cycleId } });
      })
      .catch((error) => captureError({ eventName: trackerEvent, payload: { id: cycleId }, error }));

    setPromiseToast(promise, {
      loading: t(`project_cycles.action.${is_favorite ? "unfavorite" : "favorite"}.loading`),
      success: { title: t(`project_cycles.action.${is_favorite ? "unfavorite" : "favorite"}.success.title`) },
      error: { title: t(`project_cycles.action.${is_favorite ? "unfavorite" : "favorite"}.failed.title`) },
    });
  };

  const openCycleOverview = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const query = generateQueryParams(searchParams, ["peekCycle"]);
    const isPeeked = searchParams.get("peekCycle") === cycleId;
    router.push(isPeeked ? `${pathname}?${query}` : `${pathname}?${query ? `${query}&` : ""}peekCycle=${cycleId}`);
  };

  return (
    <>
      <TransferIssuesModal
        handleClose={() => setTransferIssuesModal(false)}
        isOpen={transferIssuesModal}
        cycleId={cycleId}
      />

      <button
        onClick={openCycleOverview}
        className={`z-[1] flex text-accent-secondary text-11 gap-1 flex-shrink-0 ${isMobile || (isActive && !searchParams.has("peekCycle")) ? "flex" : "hidden group-hover:flex"}`}
      >
        <Eye className="h-4 w-4 my-auto text-accent-secondary" />
        <span>{t("project_cycles.more_details")}</span>
      </button>

      <div className="flex items-center gap-1 mx-1">
        <CustomSelect
          value={uat_status || "#000000"}
          onChange={handleUatStatusChange}
          disabled={!isEditingAllowed || isUpdatingUat}
          buttonClassName="border-none p-0 bg-transparent"
          optionsClassName="min-w-[80px] w-fit"
          noChevron
          label={
            <div className="flex items-center gap-1.5 px-1.5 py-1 rounded hover:bg-custom-background-80 transition-all">
              <div
                className={`h-5 w-5 rounded-full border border-custom-border-200 ${isUpdatingUat ? "animate-pulse opacity-50" : ""}`}
                style={{ backgroundColor: uat_status || "#000000" }}
              />
            </div>
          }
        >
          {UAT_S_OPTIONS.map((opt) => (
            <CustomSelect.Option key={opt.key} value={opt.key}>
              <div className="flex items-center gap-2 py-1">
                <div className="h-5 w-5 rounded-full" style={{ backgroundColor: opt.key }} />
              </div>
            </CustomSelect.Option>
          ))}
        </CustomSelect>
      </div>

      {showIssueCount && (
        <div className="flex items-center gap-1">
          <WorkItemsIcon className="h-4 w-4 text-tertiary" />
          <span className="text-11 text-tertiary">{total_issues}</span>
        </div>
      )}

      <CycleAdditionalActions cycleId={cycleId} projectId={projectId} />

      {showTransferIssues && (
        <div
          className="px-2 h-6 text-accent-secondary flex items-center gap-1 cursor-pointer"
          onClick={() => setTransferIssuesModal(true)}
        >
          <TransferIcon className="fill-accent-primary w-4" />
          <span>{t("project_cycles.transfer_work_items", { count: transferableIssuesCount })}</span>
        </div>
      )}

      {isActive ? (
        <div className="flex gap-2">
          <Tooltip
            tooltipHeading={t("project_cycles.in_your_timezone")}
            disabled={!isProjectTimeZoneDifferent()}
            tooltipContent={
              <span className="flex gap-1">
                {renderFormattedDateInUserTimezone(start_date ?? "")}{" "}
                <ArrowRight className="h-3 w-3 flex-shrink-0 my-auto" />{" "}
                {renderFormattedDateInUserTimezone(end_date ?? "")}
              </span>
            }
          >
            <div className="flex gap-1 text-11 text-tertiary font-medium items-center">
              <CalendarDays className="h-3 w-3 flex-shrink-0 my-auto" />
              <MergedDateDisplay startDate={start_date} endDate={end_date} />
            </div>
          </Tooltip>
          {getProjectUTCOffset() && (
            <span className="rounded-md text-11 px-2 py-1 bg-layer-1 text-tertiary">{getProjectUTCOffset()}</span>
          )}
          {createdByDetails && <ButtonAvatars showTooltip={false} userIds={createdByDetails.id} />}
        </div>
      ) : (
        start_date && (
          <DateRangeDropdown
            buttonVariant="transparent-with-text"
            buttonContainerClassName="h-6 w-full cursor-auto flex items-center gap-1.5 text-tertiary rounded-sm text-11"
            buttonClassName="p-0"
            value={{ from: getDate(start_date), to: getDate(end_date) }}
            disabled
            mergeDates
            hideIcon={{ from: false, to: false }}
          />
        )
      )}

      {!isActive && (
        <>
          {createdByDetails && <ButtonAvatars showTooltip={false} userIds={createdByDetails.id} />}
          <Tooltip tooltipContent={`${assignee_ids?.length} Members`} isMobile={isMobile}>
            <div className="flex w-min cursor-default items-center justify-center">
              {assignee_ids && assignee_ids.length > 0 ? (
                <AvatarGroup showTooltip={false}>
                  {assignee_ids.map((id) => {
                    const m = getUserDetails(id);
                    return <Avatar key={id} name={m?.display_name} src={getFileURL(m?.avatar_url ?? "")} />;
                  })}
                </AvatarGroup>
              ) : (
                <MembersPropertyIcon className="h-4 w-4 text-tertiary" />
              )}
            </div>
          </Tooltip>
        </>
      )}

      {isEditingAllowed && !archived_at && (
        <FavoriteStar
          data-ph-element={CYCLE_TRACKER_ELEMENTS.LIST_ITEM}
          onClick={handleFavoriteToggle}
          selected={!!is_favorite}
        />
      )}

      <div className="hidden md:block">
        <CycleQuickActions
          parentRef={parentRef}
          cycleId={cycleId}
          projectId={projectId}
          workspaceSlug={workspaceSlug}
        />
      </div>
    </>
  );
});
