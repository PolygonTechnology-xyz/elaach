"use client";
import { FC, useState, useEffect, useRef } from "react";
import { observer } from "mobx-react";
import {
  Signal,
  Tag,
  Triangle,
  LayoutPanelTop,
  CalendarClock,
  CalendarCheck2,
  Users,
  UserCircle2,
  Timer,
  Layout, 
} from "lucide-react";
import { API_BASE_URL } from "@plane/constants";

import { useTranslation } from "@plane/i18n";
import { DiceIcon, DoubleCircleIcon, ContrastIcon } from "@plane/propel/icons";
import { cn, getDate, renderFormattedPayloadDate, shouldHighlightIssueDueDate } from "@plane/utils";

import { DateDropdown } from "@/components/dropdowns/date";
import { PointEstimateDropdown, TimeEstimateDropdown } from "@/components/dropdowns/estimate";
import { ButtonAvatars } from "@/components/dropdowns/member/avatar";
import { MemberDropdown } from "@/components/dropdowns/member/dropdown";
import { PriorityDropdown } from "@/components/dropdowns/priority";
import { StateDropdown } from "@/components/dropdowns/state/dropdown";

import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useMember } from "@/hooks/store/use-member";
import { useProject } from "@/hooks/store/use-project";
import { useProjectState } from "@/hooks/store/use-project-state";

import { WorkItemAdditionalSidebarProperties } from "@/plane-web/components/issues/issue-details/additional-properties";
import { IssueParentSelectRoot } from "@/plane-web/components/issues/issue-details/parent-select-root";
import { IssueWorklogProperty } from "@/plane-web/components/issues/worklog/property";
import type { TIssueOperations } from "../issue-detail";
import { IssueCycleSelect } from "../issue-detail/cycle-select";
import { IssueLabel } from "../issue-detail/label";
import { IssueModuleSelect } from "../issue-detail/module-select";

const PropertyIcon: FC<{ icon: any; isCustom?: boolean }> = ({ icon: Icon, isCustom }) => (
  <div className="h-4 w-4 flex items-center justify-center flex-shrink-0">
    <Icon className={cn("flex-shrink-0", isCustom ? "h-3.5 w-3.5" : "h-4 w-4")} />
  </div>
);

const ISSUE_PROPERTIES_LIST = [
  { key: "state", label: "State", icon: DoubleCircleIcon, isCustom: true },
  { key: "assignees", label: "Assignees", icon: Users },
  { key: "priority", label: "Priority", icon: Signal },
  { key: "start_date", label: "Start Date", icon: CalendarClock },
  { key: "due_date", label: "Due Date", icon: CalendarCheck2 },
  { key: "estimate_time", label: "Estimate Time", icon: Timer },
  { key: "story_point", label: "Story Point", icon: Triangle },
  { key: "modules", label: "Modules", icon: DiceIcon, isCustom: true },
  { key: "cycle", label: "Cycle", icon: ContrastIcon, isCustom: true },
  { key: "parent", label: "Parent", icon: LayoutPanelTop },
  { key: "labels", label: "Labels", icon: Tag },
  { key: "tracked_time", label: "Tracked Time", icon: Timer },
];

interface IPeekOverviewProperties {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  disabled: boolean;
  issueOperations: TIssueOperations;
}

export const PeekOverviewProperties: FC<IPeekOverviewProperties> = observer((props) => {
  const { workspaceSlug, projectId, issueId, issueOperations, disabled } = props;
  const { t } = useTranslation();
  
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [isPropertyModalOpen, setIsPropertyModalOpen] = useState(false);
  const [visibleProperties, setVisibleProperties] = useState<string[]>([
    "state", "assignees", "priority", "due_date", "estimate_time", "story_point"
  ]);

  // Ref for handling outside click
  const menuRef = useRef<HTMLDivElement>(null);

  // Outside click effect logic
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsPropertyModalOpen(false);
      }
    };
    if (isPropertyModalOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isPropertyModalOpen]);

  useEffect(() => {
    if (!workspaceSlug || !projectId || !issueId) return;

    const fetchTrackedTime = async () => {
      try {
        const url = `${API_BASE_URL}/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/tracked-times/total/`;
        const response = await fetch(url, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          const total = data.total_seconds || data.total_tracked_time_seconds || 0;
          setTotalSeconds(total);
        }
      } catch (error) {
        console.error("Error fetching time:", error);
      }
    };

    fetchTrackedTime();
  }, [workspaceSlug, projectId, issueId]);

  const { getProjectById } = useProject();
  const { issue: { getIssueById } } = useIssueDetail();
  const { getStateById } = useProjectState();
  const { getUserDetails } = useMember();

  const issue = getIssueById(issueId);
  if (!issue) return <></>;

  const createdByDetails = getUserDetails(issue?.created_by);
  const projectDetails = getProjectById(issue.project_id);
  const stateDetails = getStateById(issue.state_id);
  const minDate = getDate(issue.start_date);
  const maxDate = getDate(issue.target_date);

  const toggleProperty = (key: string) => {
    setVisibleProperties((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h6 className="text-sm font-medium">{t("common.properties")}</h6>
        
        {/* Toggle Menu Wrapper with Ref */}
        <div className="relative" ref={menuRef}>
          <button 
            type="button"
            onClick={() => setIsPropertyModalOpen(!isPropertyModalOpen)}
            className="p-1.5 hover:bg-custom-background-80 rounded-md text-custom-text-300 transition-colors"
          >
            <Layout size={16} />
          </button>

          {isPropertyModalOpen && (
            <div className="absolute right-0 top-full mt-2 z-[100] w-52 p-2 
              bg-white dark:bg-[#18181b] border border-custom-border-200 
              shadow-xl rounded-lg text-left"
            >
              <p className="text-[10px] font-bold text-custom-text-400 mb-2 px-2 tracking-wider">
                Select Properties
              </p>
              <div className="max-h-64 overflow-y-auto custom-scrollbar">
                {ISSUE_PROPERTIES_LIST.map((prop) => (
                  <label 
                    key={prop.key} 
                    className="flex items-center gap-2 px-2 py-1.5 hover:bg-custom-background-90 cursor-pointer rounded transition-colors"
                  >
                    <input 
                      type="checkbox" 
                      checked={visibleProperties.includes(prop.key)}
                      onChange={() => toggleProperty(prop.key)}
                      className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <PropertyIcon icon={prop.icon} isCustom={prop.isCustom} />
                    <span className="text-xs text-custom-text-200">{prop.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={`w-full space-y-2 mt-3 ${disabled ? "opacity-60" : ""}`}>
        
        {/* State */}
        {visibleProperties.includes("state") && (
          <div className="flex w-full items-center gap-3 h-8">
            <div className="flex items-center gap-1 w-1/4 flex-shrink-0 text-sm text-custom-text-300">
              <PropertyIcon icon={DoubleCircleIcon} isCustom />
              <span>{t("common.state")}</span>
            </div>
            <StateDropdown
              value={issue?.state_id}
              onChange={(val) => issueOperations.update(workspaceSlug, projectId, issueId, { state_id: val })}
              projectId={projectId}
              disabled={disabled}
              buttonVariant="transparent-with-text"
              className="w-3/4 flex-grow group"
              buttonContainerClassName="w-full text-left"
              buttonClassName="text-sm"
              dropdownArrow
              dropdownArrowClassName="h-3.5 w-3.5 hidden group-hover:inline"
            />
          </div>
        )}

        {/* Assignees */}
        {visibleProperties.includes("assignees") && (
          <div className="flex w-full items-center gap-3 h-8">
            <div className="flex items-center gap-1 w-1/4 flex-shrink-0 text-sm text-custom-text-300">
              <PropertyIcon icon={Users} />
              <span>{t("common.assignees")}</span>
            </div>
            <MemberDropdown
              value={issue?.assignee_ids ?? undefined}
              onChange={(val) => issueOperations.update(workspaceSlug, projectId, issueId, { assignee_ids: val })}
              disabled={disabled}
              projectId={projectId}
              placeholder={t("issue.add.assignee")}
              multiple
              buttonVariant={issue?.assignee_ids?.length > 1 ? "transparent-without-text" : "transparent-with-text"}
              className="w-3/4 flex-grow group"
              buttonContainerClassName="w-full text-left"
              buttonClassName={`text-sm justify-between ${issue?.assignee_ids?.length > 0 ? "" : "text-custom-text-400"}`}
              hideIcon={issue.assignee_ids?.length === 0}
              dropdownArrow
              dropdownArrowClassName="h-3.5 w-3.5 hidden group-hover:inline"
            />
          </div>
        )}

        {/* Priority */}
        {visibleProperties.includes("priority") && (
          <div className="flex w-full items-center gap-3 h-8">
            <div className="flex items-center gap-1 w-1/4 flex-shrink-0 text-sm text-custom-text-300">
              <PropertyIcon icon={Signal} />
              <span>{t("common.priority")}</span>
            </div>
            <PriorityDropdown
              value={issue?.priority}
              onChange={(val) => issueOperations.update(workspaceSlug, projectId, issueId, { priority: val })}
              disabled={disabled}
              buttonVariant="border-with-text"
              className="w-3/4 flex-grow rounded px-2 hover:bg-custom-background-80 group"
              buttonContainerClassName="w-full text-left"
              buttonClassName="w-min h-auto whitespace-nowrap"
            />
          </div>
        )}

        {/* Created By */}
        {createdByDetails && (
          <div className="flex w-full items-center gap-3 h-8">
            <div className="flex items-center gap-1 w-1/4 flex-shrink-0 text-sm text-custom-text-300">
              <PropertyIcon icon={UserCircle2} />
              <span>{t("common.created_by")}</span>
            </div>
            <div className="w-full h-full flex items-center gap-1.5 rounded px-2 py-0.5 text-sm justify-between cursor-not-allowed">
              <ButtonAvatars
                showTooltip
                userIds={createdByDetails?.display_name.includes("-intake") ? null : createdByDetails?.id}
              />
              <span className="flex-grow truncate leading-5">
                {createdByDetails?.display_name.includes("-intake") ? "Plane" : createdByDetails?.display_name}
              </span>
            </div>
          </div>
        )}

        {/* Start Date */}
        {visibleProperties.includes("start_date") && (
          <div className="flex w-full items-center gap-3 h-8">
            <div className="flex items-center gap-1 w-1/4 flex-shrink-0 text-sm text-custom-text-300">
              <PropertyIcon icon={CalendarClock} />
              <span>{t("common.order_by.start_date")}</span>
            </div>
            <DateDropdown
              value={issue.start_date}
              onChange={(val) =>
                issueOperations.update(workspaceSlug, projectId, issueId, {
                  start_date: val ? renderFormattedPayloadDate(val) : null,
                })
              }
              placeholder={t("issue.add.start_date")}
              buttonVariant="transparent-with-text"
              maxDate={maxDate ?? undefined}
              disabled={disabled}
              className="w-3/4 flex-grow group"
              buttonContainerClassName="w-full text-left"
              buttonClassName={`text-sm ${issue?.start_date ? "" : "text-custom-text-400"}`}
              hideIcon
              clearIconClassName="h-3 w-3 hidden group-hover:inline"
            />
          </div>
        )}

        {/* Due Date */}
        {visibleProperties.includes("due_date") && (
          <div className="flex w-full items-center gap-3 h-8">
            <div className="flex items-center gap-1 w-1/4 flex-shrink-0 text-sm text-custom-text-300">
              <PropertyIcon icon={CalendarCheck2} />
              <span>{t("common.order_by.due_date")}</span>
            </div>
            <DateDropdown
              value={issue.target_date}
              onChange={(val) =>
                issueOperations.update(workspaceSlug, projectId, issueId, {
                  target_date: val ? renderFormattedPayloadDate(val) : null,
                })
              }
              placeholder={t("issue.add.due_date")}
              buttonVariant="transparent-with-text"
              minDate={minDate ?? undefined}
              disabled={disabled}
              className="w-3/4 flex-grow group"
              buttonContainerClassName="w-full text-left"
              buttonClassName={cn("text-sm", {
                "text-custom-text-400": !issue.target_date,
                "text-red-500": shouldHighlightIssueDueDate(issue.target_date, stateDetails?.group),
              })}
              hideIcon
              clearIconClassName="h-3 w-3 hidden group-hover:inline !text-custom-text-100"
            />
          </div>
        )}

        {/* Estimate Time */}
        {visibleProperties.includes("estimate_time") && (
          <div className="flex w-full items-center gap-3 h-8">
            <div className="flex items-center gap-1 w-1/4 flex-shrink-0 text-sm text-custom-text-300">
              <PropertyIcon icon={Timer} />
              <span>Estimate Time</span>
            </div>
            <TimeEstimateDropdown
              value={issue.estimate_time}
              onChange={(val) => issueOperations.update(workspaceSlug, projectId, issueId, { estimate_time: val })}
              projectId={projectId}
              disabled={disabled}
              buttonVariant="transparent-with-text"
              className="w-3/4 flex-grow group"
              buttonContainerClassName="w-full text-left"
              buttonClassName={`text-sm ${issue?.estimate_time ? "" : "text-custom-text-400"}`}
              placeholder="None"
              hideIcon
              dropdownArrow
              dropdownArrowClassName="h-3.5 w-3.5 hidden group-hover:inline"
            />
          </div>
        )}

        {/* Story Point */}
        {visibleProperties.includes("story_point") && (
          <div className="flex w-full items-center gap-3 h-8">
            <div className="flex items-center gap-1 w-1/4 flex-shrink-0 text-sm text-custom-text-300">
              <PropertyIcon icon={Triangle} />
              <span>Story Point</span>
            </div>
            <PointEstimateDropdown
              value={issue.estimate_point}
              onChange={(val) => issueOperations.update(workspaceSlug, projectId, issueId, { estimate_point: val })}
              projectId={projectId}
              disabled={disabled}
              buttonVariant="transparent-with-text"
              className="w-3/4 flex-grow group"
              buttonContainerClassName="w-full text-left"
              buttonClassName={`text-sm ${issue?.estimate_point ? "" : "text-custom-text-400"}`}
              placeholder="None"
              hideIcon
              dropdownArrow
              dropdownArrowClassName="h-3.5 w-3.5 hidden group-hover:inline"
            />
          </div>
        )}

        {/* Modules */}
        {projectDetails?.module_view && visibleProperties.includes("modules") && (
          <div className="flex w-full items-center gap-3 min-h-8 h-full">
            <div className="flex items-center gap-1 w-1/4 flex-shrink-0 text-sm text-custom-text-300">
              <PropertyIcon icon={DiceIcon} isCustom />
              <span>{t("common.modules")}</span>
            </div>
            <IssueModuleSelect
              className="w-3/4 flex-grow"
              workspaceSlug={workspaceSlug}
              projectId={projectId}
              issueId={issueId}
              issueOperations={issueOperations}
              disabled={disabled}
            />
          </div>
        )}

        {/* Cycle */}
        {projectDetails?.cycle_view && visibleProperties.includes("cycle") && (
          <div className="flex w-full items-center gap-3 h-8">
            <div className="flex items-center gap-1 w-1/4 flex-shrink-0 text-sm text-custom-text-300">
              <PropertyIcon icon={ContrastIcon} isCustom />
              <span>{t("common.cycle")}</span>
            </div>
            <IssueCycleSelect
              className="w-3/4 flex-grow"
              workspaceSlug={workspaceSlug}
              projectId={projectId}
              issueId={issueId}
              issueOperations={issueOperations}
              disabled={disabled}
            />
          </div>
        )}

        {/* Parent Issue */}
        {visibleProperties.includes("parent") && (
          <div className="flex w-full items-center gap-3 h-8">
            <div className="flex items-center gap-1 w-1/4 flex-shrink-0 text-sm text-custom-text-300">
              <PropertyIcon icon={LayoutPanelTop} />
              <p>{t("common.parent")}</p>
            </div>
            <IssueParentSelectRoot
              className="w-3/4 flex-grow h-full"
              disabled={disabled}
              issueId={issueId}
              issueOperations={issueOperations}
              projectId={projectId}
              workspaceSlug={workspaceSlug}
            />
          </div>
        )}

        {/* Labels */}
        {visibleProperties.includes("labels") && (
          <div className="flex w-full items-center gap-3 min-h-8">
            <div className="flex items-center gap-1 w-1/4 flex-shrink-0 text-sm text-custom-text-300">
              <PropertyIcon icon={Tag} />
              <span>{t("common.labels")}</span>
            </div>
            <div className="flex w-full flex-col gap-3 truncate">
              <IssueLabel workspaceSlug={workspaceSlug} projectId={projectId} issueId={issueId} disabled={disabled} />
            </div>
          </div>
        )}

        {/* Tracked Time */}
        {visibleProperties.includes("tracked_time") && (
          <div className="flex w-full items-center gap-3 min-h-8">
            <div className="flex items-center gap-1 w-1/4 flex-shrink-0 text-sm text-custom-text-300">
              <PropertyIcon icon={Timer} />
              <span>Tracked Time</span>
            </div>
            <div className="w-3/4 flex-grow text-sm flex items-center gap-2">
              <span>{Math.floor(totalSeconds / 3600)}h</span>
              <IssueWorklogProperty
                workspaceSlug={workspaceSlug}
                projectId={projectId}
                issueId={issueId}
                disabled={disabled}
              />
            </div>
          </div>
        )}

        <WorkItemAdditionalSidebarProperties
          workItemId={issue.id}
          workItemTypeId={issue.type_id}
          projectId={projectId}
          workspaceSlug={workspaceSlug}
          isEditable={!disabled}
          isPeekView
        />
      </div>
    </div>
  );
});