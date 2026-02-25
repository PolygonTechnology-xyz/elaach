import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
// plane imports
import { ETabIndices } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import type { IRetro } from "@plane/types";
// ui
import { Input, TextArea } from "@plane/ui";
import { getTabIndex } from "@plane/utils";
// components
import { CycleDropdown } from "@/components/dropdowns/cycle"; 

type Props = {
  handleFormSubmit: (values: Partial<IRetro>) => Promise<void>;
  handleClose: () => void;
  status: boolean;
  projectId: string;
  data?: IRetro | null;
  isMobile?: boolean;
};

export function RetroForm(props: Props) {
  const { handleFormSubmit, handleClose, status, projectId, data, isMobile = false } = props;
  const { t } = useTranslation();

  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    control,
    reset,
  } = useForm<IRetro>({
    defaultValues: {
      project_id: projectId,
      name: data?.name || "",
      description: data?.description || "",
      cycle_id: data?.cycle_id || null,
    },
  });

  const { getIndex } = getTabIndex(ETabIndices.PROJECT_CYCLE, isMobile);

  useEffect(() => {
    reset({ ...data });
  }, [data, reset]);

  return (
    <form onSubmit={handleSubmit((formData) => handleFormSubmit(formData))}>
      <div className="space-y-5 p-5 max-h-[70vh] overflow-y-auto">
        <h3 className="text-18 font-medium text-secondary">
          {status ? "* Update Retro" : "Create Retro"}
        </h3>

        <div className="space-y-3">

          <div className="space-y-1">
            <label className="text-13 font-medium">Select Cycle</label>
            <Controller
              control={control}
              name="cycle_id"
              rules={{ required: "Selecting a cycle is required" }}
              render={({ field: { value, onChange } }) => (
                <CycleDropdown
                  projectId={projectId}
                  value={value}
                  onChange={onChange}
                  className="w-full"
                  buttonVariant="border-with-text"
                />
              )}
            />
            {errors?.cycle_id && <span className="text-12 text-red-500">{errors.cycle_id.message}</span>}
          </div>

          {/* Retro Title */}
          <div className="space-y-1">
            <label className="text-13 font-medium">Title <span className="text-red-500">*</span></label>
            <Controller
              name="name"
              control={control}
              rules={{ required: t("title_is_required") }}
              render={({ field: { value, onChange } }) => (
                <Input
                  name="name"
                  placeholder="Name"
                  className="w-full text-14"
                  value={value}
                  onChange={onChange}
                  hasError={Boolean(errors?.name)}
                />
              )}
            />
            {errors?.name && <span className="text-12 text-red-500">{errors.name.message}</span>}
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-13 font-medium">Description</label>
            <Controller
              name="description"
              control={control}
              render={({ field: { value, onChange } }) => (
                <TextArea
                  name="description"
                  placeholder="Description"
                  className="w-full text-14 resize-none min-h-24"
                  value={value}
                  onChange={onChange}
                />
              )}
            />
          </div>
        </div>
      </div>

      <div className="px-5 py-4 flex items-center justify-end gap-2 border-t-[0.5px] border-subtle ">
        <Button variant="secondary" onClick={handleClose}>
          {t("common.cancel")}
        </Button>
        <Button variant="primary" type="submit" loading={isSubmitting}>
          {status ? "Update Retro" : "Create Retro"}
        </Button>
      </div>
    </form>
  );
}