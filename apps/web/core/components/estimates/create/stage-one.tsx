"use client";

import { EEstimateSystem, ESTIMATE_SYSTEMS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import type { TEstimateSystemKeys } from "@plane/types";

type TEstimateCreateStageOne = {
  handleEstimatePoints: (systemType: TEstimateSystemKeys, templateType: string) => void;
};

export function EstimateCreateStageOne(props: TEstimateCreateStageOne) {
  const { handleEstimatePoints } = props;
  const { t } = useTranslation();

  // Helper to render each system category (Points and Time)
  const renderSystemSection = (systemKey: TEstimateSystemKeys) => {
    const system = ESTIMATE_SYSTEMS[systemKey];
    if (!system) return null;

  // console.log("estimate system-------------> ", system)

    return (
      <div key={systemKey} className="space-y-4 mb-8 last:mb-0">
        <h3 className="text-16 font-semibold text-primary border-b border-subtle pb-2">
          {systemKey === EEstimateSystem.POINTS ? "Points" : "Time"}
        </h3>

        {/* Start from scratch */}
        <div className="space-y-2">
          {/* <div className="text-13 font-medium text-secondary">Start from scratch</div>
          <button
            className="border border-subtle rounded-md p-3 py-2 text-left w-full hover:bg-custom-background-80 transition-colors"
            onClick={() => handleEstimatePoints(systemKey, "custom")}
          >
            <p className="text-14 font-medium">Custom</p>
            <p className="text-11 text-tertiary">Add your own {systemKey.toLowerCase()} from scratch.</p>
          </button> */}
        </div>

        {/* Templates */}
        <div className="space-y-2">
          <div className="text-13 font-medium text-secondary">Choose a template</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.keys(system.templates).map((name) => (
              <button
                key={name}
                className="border border-subtle rounded-md p-3 py-2 text-left hover:bg-custom-background-80 transition-colors"
                onClick={() => handleEstimatePoints(systemKey, name)}
              >
                <p className="text-14 font-medium">{system.templates[name].title}</p>
                <p className="text-11 text-tertiary">
                  {system.templates[name].values.map((v: any) => v.value).join(", ")}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {renderSystemSection(EEstimateSystem.POINTS)}
      {renderSystemSection(EEstimateSystem.TIME)}
    </div>
  );
}