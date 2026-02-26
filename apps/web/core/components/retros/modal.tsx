import React from "react";
// types
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IRetro } from "@plane/types";
// ui
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
// hooks
import { useRetro } from "@/hooks/store/use-retro";
import { usePlatformOS } from "@/hooks/use-platform-os";
// local imports
import { RetroForm } from "./form";

type Props = {
  isOpen: boolean;
  handleClose: () => void;
  data?: IRetro | null;
  workspaceSlug: string;
  projectId: string;
  cycleId?: string;
};

export function RetroCreateUpdateModal({ isOpen, handleClose, data, workspaceSlug, projectId, cycleId }: Props) {

  const { createBoard, fetchBoards } = useRetro(); 
  const { isMobile } = usePlatformOS();

  const handleFormSubmit = async (formData: Partial<IRetro>) => {
    console.log("Form submitted with data:", formData);
    
    if (!workspaceSlug || !projectId) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Missing workspace or project information."
      });
      return;
    }

    const selectedCycleId = formData.cycle_id || cycleId;
    
    if (!selectedCycleId) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Cycle is required. Please select a cycle.",
      });
      return;
    }

    if (!formData.name || formData.name.trim() === "") {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Retro board name is required.",
      });
      return;
    }

    try {
      if (data?.id) {
        setToast({ type: TOAST_TYPE.SUCCESS, title: "Updated!", message: "Retrospective updated." });
      } else {
        await createBoard(workspaceSlug, projectId, selectedCycleId, { 
          name: formData.name.trim(), 
          description: formData.description?.trim() || ""
        });

        if (fetchBoards) {
          await fetchBoards(workspaceSlug, projectId, selectedCycleId);
        }

        setToast({ type: TOAST_TYPE.SUCCESS, title: "Success!", message: "Retro board created." });
      }

      handleClose();
    } catch (err: any) {
      console.error("Error in retro board operation:", err);
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: err?.detail || err?.message || err || "Something went wrong.",
      });
    }
  };

  return (
    <ModalCore 
      isOpen={isOpen} 
      handleClose={handleClose} 
      position={EModalPosition.TOP} 
      width={EModalWidth.XL}
    >
        <RetroForm
          handleFormSubmit={handleFormSubmit}
          handleClose={handleClose}
          status={!!data}
          projectId={projectId}
          data={data}
          isMobile={isMobile}
        />
    </ModalCore>
  );
}