"use client";

import { observer } from "mobx-react";
import { EstimateListItem } from "./estimate-list-item";

type TEstimateList = {
  estimateIds: string[];
  isAdmin: boolean;
  isEstimateEnabled: boolean;
  isEditable: boolean;
  onEditClick?: (estimateId: string) => void;
  onDeleteClick?: (estimateId: string) => void;
};

export const EstimateList = observer(function EstimateList(props: TEstimateList) {
  const { estimateIds, isAdmin, isEstimateEnabled, isEditable, onEditClick, onDeleteClick } = props;

  return (
    <div className="divide-y divide-subtle border border-subtle rounded-md px-4 bg-custom-background-100">
      {estimateIds.map((id) => (
        <EstimateListItem
          key={id}
          estimateId={id}
          isAdmin={isAdmin}
          isEstimateEnabled={isEstimateEnabled}
          isEditable={isEditable}
          onEditClick={onEditClick}
          onDeleteClick={onDeleteClick}
        />
      ))}
    </div>
  );
});