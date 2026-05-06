import { PanelSection } from "./PanelSection";
import { RegexEditor } from "./RegexEditor";
import { ShieldCheck } from "lucide-react";
import type { ComponentSchema } from "../../types/editor";

interface Props {
  componentId: string;
  validation: ComponentSchema["validation"];
  onUpdateComponent: (id: string, updates: Partial<ComponentSchema>) => void;
}

export const ValidationSection: React.FC<Props> = ({
  componentId,
  validation,
  onUpdateComponent,
}) => {
  return (
    <PanelSection
      id="validation-props"
      title="数据校验"
      icon={ShieldCheck}
      defaultOpen={true}
    >
      <RegexEditor
        onApply={(v) =>
          onUpdateComponent(componentId, { validation: v })
        }
      />

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-slate-600">
          正则表达式 (Regex)
        </label>
        <input
          type="text"
          placeholder="例如: ^1[3-9]\\d{9}$"
          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-green-400 font-mono placeholder:text-slate-500 focus:ring-2 focus:ring-brand/50 outline-none shadow-inner"
          value={validation?.regex || ""}
          onChange={(e) =>
            onUpdateComponent(componentId, {
              validation: {
                regex: e.target.value,
                message: validation?.message || "格式不正确",
              },
            })
          }
        />
      </div>

      {validation?.regex && (
        <div className="flex flex-col gap-1.5 pt-2">
          <label className="text-xs font-semibold text-slate-600">
            校验失败提示语
          </label>
          <input
            type="text"
            placeholder="请输入正确的格式"
            className="w-full px-3 py-2 bg-red-50 border border-red-100 rounded-lg text-sm text-red-800 placeholder:text-red-300 focus:border-red-300 focus:ring-2 focus:ring-red-200 outline-none"
            value={validation?.message || ""}
            onChange={(e) =>
              onUpdateComponent(componentId, {
                validation: {
                  ...validation!,
                  message: e.target.value,
                },
              })
            }
          />
        </div>
      )}
    </PanelSection>
  );
};
