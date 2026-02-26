import type React from "react";
import { observer } from "mobx-react";
// ui
import type { ISvgIcons } from "@plane/propel/icons";
import { GridLayoutIcon, ListLayoutIcon } from "@plane/propel/icons";
// plane package imports
import type { TRetroLayoutOptions } from "@plane/types"; 
import { CustomMenu } from "@plane/ui";
// hooks
import { useRetroFilter } from "@/hooks/store/use-retro-filter"; 
import { useProject } from "@/hooks/store/use-project";

const RETRO_VIEW_LAYOUTS: {
  key: TRetroLayoutOptions;
  icon: React.FC<ISvgIcons>;
  title: string;
}[] = [
  {
    key: "list",
    icon: ListLayoutIcon,
    title: "List layout",
  },
  {
    key: "board",
    icon: GridLayoutIcon,
    title: "Gallery layout",
  },
];

export const RetroListMobileHeader = observer(function RetroListMobileHeader() {
  const { currentProjectDetails } = useProject();
  // hooks
  const { updateDisplayFilters } = useRetroFilter(); 

  return (
    <div className="flex justify-center sm:hidden">
      <CustomMenu
        maxHeight={"md"}
        className="flex flex-grow justify-center text-secondary text-13 py-2 border-b border-subtle bg-surface-1"
        customButton={
          <span className="flex items-center gap-2">
            <ListLayoutIcon className="h-4 w-4" />
            <span className="flex flex-grow justify-center text-secondary text-13">Layout</span>
          </span>
        }
        customButtonClassName="flex flex-grow justify-center items-center text-secondary text-13"
        closeOnSelect
      >
        {RETRO_VIEW_LAYOUTS.map((layout) => (
          <CustomMenu.MenuItem
            key={layout.key}
            onClick={() => {
              if (currentProjectDetails?.id) {
                updateDisplayFilters(currentProjectDetails.id, {
                  layout: layout.key,
                });
              }
            }}
            className="flex items-center gap-2"
          >
            <layout.icon className="w-3 h-3 text-secondary" />
            <div className="text-tertiary">{layout.title}</div>
          </CustomMenu.MenuItem>
        ))}
      </CustomMenu>
    </div>
  );
});