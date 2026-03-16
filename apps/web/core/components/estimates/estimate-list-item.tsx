"use client";

import { observer } from "mobx-react";
import { Timer, Triangle } from "lucide-react";
// constants
import { EEstimateSystem } from "@plane/constants";
// utils
import { cn } from "@plane/utils";
// hooks
import { useProjectEstimates } from "@/hooks/store/estimates";
import { useEstimate } from "@/hooks/store/estimates/use-estimate";
// plane web components
import { EstimateListItemButtons } from "@/plane-web/components/estimates";

type TEstimateListItem = {
  estimateId: string;
  isAdmin: boolean;
  isEstimateEnabled: boolean;
  isEditable: boolean;
  onEditClick?: (estimateId: string) => void;
  onDeleteClick?: (estimateId: string) => void;
};

export const EstimateListItem = observer(function EstimateListItem(props: TEstimateListItem) {
  const { estimateId, isAdmin, isEstimateEnabled, isEditable } = props;
  
  // hooks
  const { estimateById } = useProjectEstimates();
  const { estimatePointIds, estimatePointById } = useEstimate(estimateId);
  const currentEstimate = estimateById(estimateId);

  // derived values
  const estimatePointValues = estimatePointIds
    ?.map((id) => {
      const point = estimatePointById(id);
      if (!point) return null;
      return point.value;
    })
    .filter(Boolean);

  if (!currentEstimate) return <></>;

  const isTimeSystem = currentEstimate?.type === EEstimateSystem.TIME;

  return (
    <div
      className={cn(
        "relative flex justify-between items-center gap-3 py-3.5 border-b border-subtle last:border-b-0",
        isAdmin && isEditable && isEstimateEnabled ? `text-primary` : `text-secondary`
      )}
    >
      <div className="flex items-start gap-3">
        {/* Type Icon */}
        <div className="mt-1">
          {isTimeSystem ? (
            <Timer className="h-4 w-4 text-custom-text-300" />
          ) : (
            <Triangle className="h-4 w-4 text-custom-text-300" />
          )}
        </div>

        <div className="space-y-0.5">
          
          <h3 className="font-medium text-sm text-custom-text-100">
            {currentEstimate?.name} 
          </h3>
          <p className="text-xs text-custom-text-400">
            {estimatePointValues?.join(", ")}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Indicator for Active System */}
        {currentEstimate.last_used && (
          <span className="text-[10px] bg-green-500/10 text-green-500 px-1.5 py-0.5 rounded">
            Active
          </span>
        )}
        <EstimateListItemButtons {...props} />
      </div>
    </div>
  );
});