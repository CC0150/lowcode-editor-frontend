import { useState } from "react";
import { PanelSection } from "./PanelSection";
import { OptionsEditor } from "./OptionsEditor";
import { CascaderEditor } from "./CascaderEditor";
import { Upload, Star, ToggleLeft, Sliders } from "lucide-react";
import message from "antd/es/message";
import { request } from "../../utils/request";
import type { ComponentSchema } from "../../types/editor";

const inputBaseStyle =
  "w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 transition-all placeholder:text-slate-400 hover:border-slate-300 focus:bg-white focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none shadow-sm";

interface Props {
  component: ComponentSchema;
  onUpdateProps: (id: string, props: Partial<ComponentSchema["props"]>) => void;
  onUpdateComponent: (id: string, updates: Partial<ComponentSchema>) => void;
}

export const AdvancedPropsSection: React.FC<Props> = ({
  component,
  onUpdateProps,
}) => {
  const [isOptionsAILoading, setIsOptionsAILoading] = useState(false);

  const handleGenerateOptions = async (prompt: string) => {
    if (!component) return;
    setIsOptionsAILoading(true);
    try {
      const result = await request.post("/modify-component", {
        component,
        prompt: `帮我批量生成选项，主题是："${prompt}"。请直接重写 props.options 数组，每个选项包含 label 和 value (value尽量使用英文或拼音缩写)。`,
      });

      if (result.success && result.data?.props?.options) {
        onUpdateProps(component.id, { options: result.data.props.options });
        message.success("AI 选项生成成功");
      } else {
        message.error("生成失败，请尝试换个描述");
      }
    } catch (e) {
      // 错误统一已提示
    } finally {
      setIsOptionsAILoading(false);
    }
  };

  return (
    <PanelSection id="advanced-props" title="控件高级属性" icon={Sliders}>
      {(component.type === "input" || component.type === "textarea") && (
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-600">
            占位文字 (Placeholder)
          </label>
          <input
            type="text"
            className={inputBaseStyle}
            value={component.props.placeholder || ""}
            onChange={(e) =>
              onUpdateProps(component.id, { placeholder: e.target.value })
            }
          />
        </div>
      )}

      {component.type === "upload" && (
        <div className="flex flex-col gap-2 p-3 bg-indigo-50/50 rounded-lg border border-indigo-100">
          <label className="text-xs font-bold text-indigo-900 flex items-center gap-1">
            <Upload className="w-3 h-3" /> 限制文件类型
          </label>
          <input
            type="text"
            placeholder="例如: image/*"
            className={inputBaseStyle}
            value={component.props.accept || ""}
            onChange={(e) =>
              onUpdateProps(component.id, { accept: e.target.value })
            }
          />
        </div>
      )}

      {component.type === "rate" && (
        <div className="flex flex-col gap-2 p-3 bg-yellow-50/50 rounded-lg border border-yellow-100">
          <label className="text-xs font-bold text-yellow-900 flex items-center gap-1">
            <Star className="w-3 h-3" /> 最大星数 (Max Rate)
          </label>
          <input
            type="number"
            min={3}
            max={10}
            className={inputBaseStyle}
            value={component.props.maxRate || 5}
            onChange={(e) =>
              onUpdateProps(component.id, { maxRate: Number(e.target.value) })
            }
          />
        </div>
      )}

      {component.type === "switch" && (
        <div className="flex flex-col gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
            <ToggleLeft className="w-3 h-3" /> 状态文案
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="开启"
              className={inputBaseStyle}
              value={component.props.activeText || ""}
              onChange={(e) =>
                onUpdateProps(component.id, { activeText: e.target.value })
              }
            />
            <input
              type="text"
              placeholder="关闭"
              className={inputBaseStyle}
              value={component.props.inactiveText || ""}
              onChange={(e) =>
                onUpdateProps(component.id, { inactiveText: e.target.value })
              }
            />
          </div>
        </div>
      )}

      {(component.type === "radio" || component.type === "checkbox") && (
        <div className="flex flex-col gap-1.5 mb-3">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            排列方向
          </label>
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() =>
                onUpdateProps(component.id, { direction: "horizontal" })
              }
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                component.props.direction === "horizontal"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              水平排列
            </button>
            <button
              onClick={() =>
                onUpdateProps(component.id, { direction: "vertical" })
              }
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                component.props.direction !== "horizontal"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              竖直排列
            </button>
          </div>
        </div>
      )}

      {(component.type === "radio" ||
        component.type === "select" ||
        component.type === "checkbox") && (
        <OptionsEditor
          options={component.props.options || []}
          onChange={(newOpts) =>
            onUpdateProps(component.id, { options: newOpts })
          }
          onAIGenerate={handleGenerateOptions}
          isAILoading={isOptionsAILoading}
        />
      )}

      {component.type === "cascader" && (
        <CascaderEditor
          options={component.props.options || []}
          onChange={(newOpts) =>
            onUpdateProps(component.id, { options: newOpts })
          }
          onAIGenerate={handleGenerateOptions}
          isAILoading={isOptionsAILoading}
        />
      )}
    </PanelSection>
  );
};
