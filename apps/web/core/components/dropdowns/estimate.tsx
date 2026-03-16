"use client";

import type { ReactNode } from "react";
import { useRef, useState, useMemo, useEffect } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { usePopper } from "react-popper";
import { Check, Search, Timer, Triangle } from "lucide-react";
import { Combobox } from "@headlessui/react";
import { useTranslation } from "@plane/i18n";
import { ChevronDownIcon } from "@plane/propel/icons";
import { EEstimateSystem } from "@plane/types";
import { ComboDropDown } from "@plane/ui";
import { cn } from "@plane/utils";
import { useProjectEstimates } from "@/hooks/store/estimates";
import { useEstimate } from "@/hooks/store/estimates/use-estimate";
import { useDropdown } from "@/hooks/use-dropdown";
import { DropdownButton } from "./buttons";
import { BUTTON_VARIANTS_WITH_TEXT } from "./constants";
import type { TDropdownProps } from "./types";

type Props = TDropdownProps & {
  button?: ReactNode;
  dropdownArrow?: boolean;
  dropdownArrowClassName?: string;
  onChange: (val: string | undefined) => void;
  onClose?: () => void;
  projectId: string | undefined;
  value: string | undefined | null;
  renderByDefault?: boolean;
  estimateId?: string;
  systemType?: "points" | "time"; 
};

export const EstimateDropdown = observer(function EstimateDropdown(props: Props) {
  const {
    buttonClassName,
    buttonContainerClassName,
    buttonVariant,
    className = "",
    disabled = false,
    dropdownArrow = false,
    dropdownArrowClassName = "",
    hideIcon = false,
    onChange,
    onClose,
    placeholder = "None",
    placement,
    projectId,
    showTooltip = false,
    value,
    estimateId, 
    systemType,
  } = props;

  const { workspaceSlug } = useParams();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);

  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: placement ?? "bottom-start",
    modifiers: [{ name: "preventOverflow", options: { padding: 12 } }],
  });

  const { getProjectEstimates } = useProjectEstimates();
  const { estimatePointIds, estimatePointById } = useEstimate(estimateId);

  useEffect(() => {
    if (workspaceSlug && projectId) {
      getProjectEstimates(workspaceSlug.toString(), projectId);
    }
  }, [workspaceSlug, projectId, getProjectEstimates]);

  const displayValue = useMemo(() => {
    if (!value || !estimatePointIds || estimatePointIds.length === 0) return undefined;
    const isIdInThisSystem = estimatePointIds.includes(value);
    return isIdInThisSystem ? estimatePointById(value) : undefined;
  }, [value, estimatePointIds, estimatePointById]);

  const options = useMemo(() => (estimatePointIds ?? [])
    ?.map((id) => {
      const point = estimatePointById(id);
      if (point)
        return {
          value: point.id,
          query: `${point.value}`,
          content: (
            <div className="flex items-center gap-2">
              {systemType === "time" ? <Timer className="h-3 w-3" /> : <Triangle className="h-3 w-3" />}
              <span className="flex-grow truncate">{point.value}</span>
            </div>
          ),
        };
      return undefined;
    })
    .filter(Boolean), [estimatePointIds, estimatePointById, systemType]);

  const filteredOptions = query === "" ? options : options?.filter((o: any) => o.query.toLowerCase().includes(query.toLowerCase()));

  const { handleClose, handleKeyDown, handleOnClick, searchInputKeyDown } = useDropdown({
    dropdownRef, inputRef, isOpen, onClose, setIsOpen, setQuery,
  });

  return (
    <ComboDropDown
      as="div"
      ref={dropdownRef}
      className={cn("h-full w-full", className)}
      value={displayValue?.id ?? null}
      onChange={(val) => { 
        const key = systemType === "time" ? "estimate_time" : "estimate_point";
        onChange(val); 
        handleClose(); 
      }}
      onKeyDown={handleKeyDown}
      button={
        <button
          ref={setReferenceElement}
          type="button"
          className={cn("clickable block h-full max-w-full outline-none", buttonContainerClassName)}
          onClick={handleOnClick}
          disabled={disabled}
        >
          <DropdownButton
            className={buttonClassName}
            isActive={isOpen}
            tooltipHeading={systemType === "time" ? "Estimate Time" : "Story Point"}
            tooltipContent={displayValue ? displayValue.value : placeholder}
            showTooltip={showTooltip}
            variant={buttonVariant}
          >
            {!hideIcon && (systemType === "time" ? <Timer className="h-3.5 w-3.5" /> : <Triangle className="h-3.5 w-3.5" />)}
            {BUTTON_VARIANTS_WITH_TEXT.includes(buttonVariant as any) && (
              <span className="truncate">
                {displayValue ? (
                  displayValue.value
                ) : (
                  <span className="text-custom-text-400 opacity-60">{placeholder}</span>
                )}
              </span>
            )}
            {dropdownArrow && <ChevronDownIcon className={cn("h-3 w-3", dropdownArrowClassName)} />}
          </DropdownButton>
        </button>
      }
    >
      {isOpen && (
        <Combobox.Options className="fixed z-10" static>
          <div
            className="my-1 w-48 bg-surface-1 rounded border border-custom-border-200 bg-custom-background-100 p-2 shadow-md focus:outline-none"
            ref={setPopperElement}
            style={styles.popper}
            {...attributes.popper}
          >
            <div className="flex items-center gap-2 rounded bg-custom-background-80 px-2 border border-custom-border-100">
              <Search className="h-3.5 w-3.5 text-custom-text-400" />
              <Combobox.Input
                className="w-full bg-transparent py-1 text-xs focus:outline-none"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search..."
                onKeyDown={searchInputKeyDown}
              />
            </div>
            <div className="mt-2 max-h-48 overflow-y-auto space-y-1">
              {estimateId ? (
                <>
                  <Combobox.Option value={undefined}>
                    {({ active }) => (
                      <div className={cn("flex cursor-pointer select-none items-center justify-between rounded px-2 py-1.5 text-xs", active ? "bg-custom-background-80" : "text-custom-text-400")}>
                        None
                      </div>
                    )}
                  </Combobox.Option>
                  {filteredOptions?.map((option: any) => (
                    <Combobox.Option key={option.value} value={option.value}>
                      {({ active }) => {
                        const isSelected = displayValue?.id === option.value;
                        return (
                          <div className={cn("flex cursor-pointer select-none items-center justify-between rounded px-2 py-1.5 text-xs", active ? "bg-custom-background-80" : "", isSelected ? "text-custom-primary font-medium" : "text-custom-text-200")}>
                            {option.content}
                            {isSelected && <Check className="h-3 w-3" />}
                          </div>
                        );
                      }}
                    </Combobox.Option>
                  ))}
                </>
              ) : (
                <div className="px-2 py-1 text-xs text-custom-text-400 italic">No estimate system found</div>
              )}
            </div>
          </div>
        </Combobox.Options>
      )}
    </ComboDropDown>
  );
});

// Story Point Dropdown
export const PointEstimateDropdown = observer((props: Props) => {
  const { estimateIdsByProjectId, getEstimateById } = useProjectEstimates();
  const pointId = useMemo(() => 
    (estimateIdsByProjectId(props.projectId ?? "") || []).find((id) => getEstimateById(id)?.type === EEstimateSystem.POINTS),
    [props.projectId, estimateIdsByProjectId, getEstimateById]
  );
  return <EstimateDropdown {...props} estimateId={pointId} systemType="points" />;
});

// Time Estimate Dropdown
export const TimeEstimateDropdown = observer((props: Props) => {
  const { estimateIdsByProjectId, getEstimateById } = useProjectEstimates();
  const timeId = useMemo(() => 
    (estimateIdsByProjectId(props.projectId ?? "") || []).find((id) => getEstimateById(id)?.type === EEstimateSystem.TIME),
    [props.projectId, estimateIdsByProjectId, getEstimateById]
  );
  return <EstimateDropdown {...props} estimateId={timeId} systemType="time" />;
});