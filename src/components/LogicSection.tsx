import { PanelSection } from "./PanelSection";
import { GitBranch } from "lucide-react";
import { Select } from "antd";
import type { ComponentSchema } from "../types/editor";

interface Props {
  componentId: string;
  visibleRule: ComponentSchema["visibleRule"];
  dependencyOptions: ComponentSchema[];
  onUpdateComponent: (id: string, updates: Partial<ComponentSchema>) => void;
}

export const LogicSection: React.FC<Props> = ({
  componentId,
  visibleRule,
  dependencyOptions,
  onUpdateComponent,
}) => {
  return (
    <PanelSection
      id="logic-props"
      title="动态显示逻辑"
      icon={GitBranch}
      defaultOpen={false}
    >
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            依赖字段 (Source)
          </label>
          <Select
            className="w-full"
            style={{ height: "38px" }}
            placeholder="始终显示 (无依赖条件)"
            allowClear
            value={visibleRule?.sourceId || undefined}
            onChange={(value) =>
              onUpdateComponent(componentId, {
                visibleRule: value
                  ? { sourceId: value, operator: "===", value: "" }
                  : undefined,
              })
            }
            options={[
              { label: "始终显示 (无依赖条件)", value: "" },
              ...dependencyOptions.map((c) => ({
                label: `${c.label} (ID: ${c.id.slice(0, 4)})`,
                value: c.id,
              })),
            ]}
          />
        </div>

        {visibleRule?.sourceId && (
          <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-200 border-dashed">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              当触发值等于 (Value)
            </label>
            <input
              type="text"
              placeholder="输入期望的值..."
              className="w-full px-3 py-2 bg-white border border-brand/30 rounded-lg text-sm text-slate-800 shadow-sm font-mono focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none"
              value={visibleRule?.value || ""}
              onChange={(e) =>
                onUpdateComponent(componentId, {
                  visibleRule: {
                    ...visibleRule!,
                    value: e.target.value,
                  },
                })
              }
            />
          </div>
        )}
      </div>
    </PanelSection>
  );
};
