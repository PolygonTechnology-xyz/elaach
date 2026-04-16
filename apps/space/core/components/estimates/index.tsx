import { Timer, Triangle } from "lucide-react";
import { Tooltip } from "@plane/propel/tooltip";

type EstimateDisplayProps = {
  value: string | null | undefined;
  onChange?: (val: string | undefined) => void;
  projectId?: string;
  disabled?: boolean;
  buttonVariant?: string;
  showTooltip?: boolean;
  className?: string;
};

export function PointEstimateDropdown({ value, showTooltip }: EstimateDisplayProps) {
  if (!value) return null;

  return (
    <Tooltip tooltipHeading="Story Point" tooltipContent={value} disabled={!showTooltip}>
      <div className="flex h-full items-center gap-1.5 rounded-sm border-[0.5px] border-strong bg-layer-2 px-2 py-0.5 text-11">
        <Triangle className="h-3 w-3 flex-shrink-0" />
        <span className="truncate">{value}</span>
      </div>
    </Tooltip>
  );
}

export function TimeEstimateDropdown({ value, showTooltip }: EstimateDisplayProps) {
  if (!value) return null;

  return (
    <Tooltip tooltipHeading="Estimate Time" tooltipContent={value} disabled={!showTooltip}>
      <div className="flex h-full items-center gap-1.5 rounded-sm border-[0.5px] border-strong bg-layer-2 px-2 py-0.5 text-11">
        <Timer className="h-3 w-3 flex-shrink-0" />
        <span className="truncate">{value}</span>
      </div>
    </Tooltip>
  );
}
