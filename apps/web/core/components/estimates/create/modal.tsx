"use client";

import { useState } from "react";
import { observer } from "mobx-react";
import { mutate } from "swr";
// plane imports
import { EEstimateSystem, ESTIMATE_SYSTEMS } from "@plane/constants";
import { Button } from "@plane/propel/button";
import { ChevronLeftIcon } from "@plane/propel/icons";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
// hooks
import { useProjectEstimates } from "@/hooks/store/estimates";
// local imports
import { EstimatePointCreateRoot } from "../points";
import { EstimateCreateStageOne } from "./stage-one";

export const CreateEstimateModal = observer(function CreateEstimateModal(props: any) {
  const { workspaceSlug, projectId, isOpen, handleClose } = props;
  const { createEstimate } = useProjectEstimates();

  const [estimateSystem, setEstimateSystem] = useState<any>(EEstimateSystem.POINTS);
  const [estimatePoints, setEstimatePoints] = useState<any>(undefined);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!workspaceSlug || !projectId || !estimatePoints) return;
    setLoading(true);
    try {
      await createEstimate(workspaceSlug, projectId, {
        estimate: { 
          name: ESTIMATE_SYSTEMS[estimateSystem]?.name, 
          type: estimateSystem, 
          last_used: true 
        },
        estimate_points: estimatePoints,
      });
      mutate(`PROJECT_ESTIMATES_${workspaceSlug}_${projectId}`);
      setToast({ type: TOAST_TYPE.SUCCESS, title: "Estimate created successfully" });
      handleClose();
      setEstimatePoints(undefined);
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: "Error creating estimate" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.TOP} width={EModalWidth.XXL}>
      <div className="relative space-y-6 py-5">
        <div className="px-5 flex items-center gap-2">
          {estimatePoints && (
            <button onClick={() => setEstimatePoints(undefined)} className="hover:bg-custom-background-80 p-1 rounded">
              <ChevronLeftIcon className="w-4 h-4" />
            </button>
          )}
          <h3 className="text-18 font-medium">New Estimate System</h3>
        </div>

        <div className="px-5 max-h-[450px] overflow-y-auto custom-scrollbar">
          {!estimatePoints ? (
            <EstimateCreateStageOne
              handleEstimatePoints={(system: any, template: any) => {
                setEstimateSystem(system);
                setEstimatePoints(ESTIMATE_SYSTEMS[system].templates[template].values);
              }}
            />
          ) : (
            <EstimatePointCreateRoot
              workspaceSlug={workspaceSlug}
              projectId={projectId}
              estimateType={estimateSystem}
              estimatePoints={estimatePoints}
              setEstimatePoints={setEstimatePoints}
              estimatePointError={{}}
              handleEstimatePointError={() => {}}
            />
          )}
        </div>

        <div className="flex justify-end gap-3 px-5 pt-5 border-t border-subtle">
          <Button variant="secondary" onClick={handleClose}>Cancel</Button>
          {estimatePoints && (
            <Button onClick={handleCreate} loading={loading}>Create Estimate</Button>
          )}
        </div>
      </div>
    </ModalCore>
  );
});