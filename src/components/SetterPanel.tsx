import { useState, useEffect } from "react";
import { useEditorStore } from "../store/useEditorStore";
import { AICopilotBar } from "./AICopilot";
import { PanelSection } from "./PanelSection";
import { SetterHeader } from "./SetterHeader";
import { AdvancedPropsSection } from "./AdvancedPropsSection";
import { ValidationSection } from "./ValidationSection";
import { LogicSection } from "./LogicSection";
import { Settings2, BoxSelect } from "lucide-react";

const inputBaseStyle =
  "w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 transition-all placeholder:text-slate-400 hover:border-slate-300 focus:bg-white focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none shadow-sm";

export const SetterPanel = () => {
  const {
    components,
    selectedId,
    updateComponent,
    updateProps,
    deleteComponent,
  } = useEditorStore();
  const selectedComponent = components.find((c) => c.id === selectedId);

  const [isAICopilotOpen, setIsAICopilotOpen] = useState(false);

  // Ctrl+I 唤醒 AI Copilot
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        e.key.toLowerCase() === "i" &&
        selectedId
      ) {
        e.preventDefault();
        setIsAICopilotOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedId]);

  if (!selectedComponent) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-slate-400 bg-slate-50/30">
        <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mb-4">
          <BoxSelect className="w-8 h-8 text-slate-300 stroke-[1.5]" />
        </div>
        <p className="text-sm font-bold text-slate-600">未选中任何组件</p>
        <p className="text-xs mt-2 text-slate-400 text-center max-w-[200px] leading-relaxed">
          请在左侧画布中点击选中一个表单项，即可在此配置其属性
        </p>
      </div>
    );
  }

  const selectedIndex = components.findIndex(
    (c) => c.id === selectedComponent.id,
  );
  const dependencyOptions = components.slice(0, selectedIndex);

  return (
    <div className="h-full flex flex-col bg-slate-50 relative">
      <SetterHeader
        component={selectedComponent}
        isAICopilotOpen={isAICopilotOpen}
        onToggleAICopilot={() => setIsAICopilotOpen((v) => !v)}
        onDelete={deleteComponent}
      />

      {isAICopilotOpen && (
        <AICopilotBar
          component={selectedComponent}
          onUpdate={updateComponent}
          onClose={() => setIsAICopilotOpen(false)}
        />
      )}

      <div className="flex-1 overflow-y-auto custom-scrollbar pb-10">
        {/* 1. 基础属性 */}
        <PanelSection id="basic-props" title="基础属性" icon={Settings2}>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600">
              字段标题 (Label)
            </label>
            <input
              type="text"
              className={inputBaseStyle}
              value={selectedComponent.label || ""}
              onChange={(e) =>
                updateComponent(selectedComponent.id, {
                  label: e.target.value,
                })
              }
            />
          </div>
          {selectedComponent.type !== "switch" && (
            <label className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg cursor-pointer hover:border-brand/50 transition-all mt-2">
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-slate-700">
                  设为必填项
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5">
                  提交时将校验此字段
                </span>
              </div>
              <div className="relative inline-flex items-center">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={selectedComponent.required || false}
                  onChange={(e) =>
                    updateComponent(selectedComponent.id, {
                      required: e.target.checked,
                    })
                  }
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand"></div>
              </div>
            </label>
          )}
        </PanelSection>

        {/* 2. 控件高级属性 */}
        <AdvancedPropsSection
          component={selectedComponent}
          onUpdateProps={updateProps}
          onUpdateComponent={updateComponent}
        />

        {/* 3. 数据校验 (仅 input / textarea) */}
        {(selectedComponent.type === "input" ||
          selectedComponent.type === "textarea") && (
          <ValidationSection
            componentId={selectedComponent.id}
            validation={selectedComponent.validation}
            onUpdateComponent={updateComponent}
          />
        )}

        {/* 4. 动态显示逻辑 */}
        <LogicSection
          componentId={selectedComponent.id}
          visibleRule={selectedComponent.visibleRule}
          dependencyOptions={dependencyOptions}
          onUpdateComponent={updateComponent}
        />
      </div>
    </div>
  );
};
