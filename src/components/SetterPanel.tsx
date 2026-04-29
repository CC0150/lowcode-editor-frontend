import { useState, useEffect } from "react";
import { useEditorStore } from "../store/useEditorStore";
import { AICopilot, AICopilotBar } from "./AICopilot";
import { RegexEditor } from "./RegexEditor";
import {
  Trash2,
  Settings2,
  GitBranch,
  ShieldCheck,
  BoxSelect,
  Upload,
  Star,
  ToggleLeft,
  Sliders,
} from "lucide-react";
import { PanelSection } from "./PanelSection";
import { OptionsEditor } from "./OptionsEditor";
import { message, Select } from "antd";
import { CascaderEditor } from "./CascaderEditor";
import { request } from "../utils/request";

export const SetterPanel = () => {
  const {
    components,
    selectedId,
    updateComponent,
    updateProps,
    deleteComponent,
  } = useEditorStore();
  const selectedComponent = components.find((c) => c.id === selectedId);


  // AI 选项生成状态
  const [isOptionsAILoading, setIsOptionsAILoading] = useState(false);

  // AI Copilot 展开状态
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

  // AI 选项生成处理函数
  const handleGenerateOptions = async (prompt: string) => {
    if (!selectedComponent) return;
    setIsOptionsAILoading(true);
    try {
      const result = await request.post("/modify-component", {
        component: selectedComponent,
        prompt: `帮我批量生成选项，主题是："${prompt}"。请直接重写 props.options 数组，每个选项包含 label 和 value (value尽量使用英文或拼音缩写)。`,
      });

      if (result.success && result.data?.props?.options) {
        updateProps(selectedComponent.id, {
          options: result.data.props.options,
        });
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

  const inputBaseStyle =
    "w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 transition-all placeholder:text-slate-400 hover:border-slate-300 focus:bg-white focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none shadow-sm";

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

  // 过滤出依赖项——所有在当前组件之前出现的组件
  const selectedIndex = components.findIndex((c) => c.id === selectedComponent.id);
  const dependencyOptions = components.slice(0, selectedIndex);

  return (
    <div className="h-full flex flex-col bg-slate-50 relative">
      <header className="shrink-0 px-5 py-4 border-b border-slate-200 bg-white z-10 flex items-center justify-between shadow-sm">
        <div className="flex flex-col">
          <h3 className="font-bold text-slate-800">属性面板</h3>
        </div>
        <div className="flex items-center gap-2">
          <AICopilot
            isOpen={isAICopilotOpen}
            onToggle={() => setIsAICopilotOpen((v) => !v)}
          />
          <span className="px-2 py-1 bg-indigo-50 text-indigo-600 text-[11px] font-mono font-bold rounded-md border border-indigo-200 ml-1">
            {selectedComponent.type}
          </span>
          <button
            onClick={() => deleteComponent(selectedComponent.id)}
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {isAICopilotOpen && (
        <AICopilotBar
          component={selectedComponent}
          onUpdate={updateComponent}
          onClose={() => setIsAICopilotOpen(false)}
        />
      )}

      <div className="flex-1 overflow-y-auto custom-scrollbar pb-10">
        {/* 1. 基础属性  */}
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

        {/* 2. 控件高级属性  */}
        <PanelSection id="advanced-props" title="控件高级属性" icon={Sliders}>
          {(selectedComponent.type === "input" ||
            selectedComponent.type === "textarea") && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600">
                  占位文字 (Placeholder)
                </label>
                <input
                  type="text"
                  className={inputBaseStyle}
                  value={selectedComponent.props.placeholder || ""}
                  onChange={(e) =>
                    updateProps(selectedComponent.id, {
                      placeholder: e.target.value,
                    })
                  }
                />
              </div>
            )}
          {selectedComponent.type === "upload" && (
            <div className="flex flex-col gap-2 p-3 bg-indigo-50/50 rounded-lg border border-indigo-100">
              <label className="text-xs font-bold text-indigo-900 flex items-center gap-1">
                <Upload className="w-3 h-3" /> 限制文件类型
              </label>
              <input
                type="text"
                placeholder="例如: image/*"
                className={inputBaseStyle}
                value={selectedComponent.props.accept || ""}
                onChange={(e) =>
                  updateProps(selectedComponent.id, { accept: e.target.value })
                }
              />
            </div>
          )}
          {selectedComponent.type === "rate" && (
            <div className="flex flex-col gap-2 p-3 bg-yellow-50/50 rounded-lg border border-yellow-100">
              <label className="text-xs font-bold text-yellow-900 flex items-center gap-1">
                <Star className="w-3 h-3" /> 最大星数 (Max Rate)
              </label>
              <input
                type="number"
                min={3}
                max={10}
                className={inputBaseStyle}
                value={selectedComponent.props.maxRate || 5}
                onChange={(e) =>
                  updateProps(selectedComponent.id, {
                    maxRate: Number(e.target.value),
                  })
                }
              />
            </div>
          )}
          {selectedComponent.type === "switch" && (
            <div className="flex flex-col gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <ToggleLeft className="w-3 h-3" /> 状态文案
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="开启"
                  className={inputBaseStyle}
                  value={selectedComponent.props.activeText || ""}
                  onChange={(e) =>
                    updateProps(selectedComponent.id, {
                      activeText: e.target.value,
                    })
                  }
                />
                <input
                  type="text"
                  placeholder="关闭"
                  className={inputBaseStyle}
                  value={selectedComponent.props.inactiveText || ""}
                  onChange={(e) =>
                    updateProps(selectedComponent.id, {
                      inactiveText: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          )}

          {/* 排列方向切换 (仅作用于 Radio 和 Checkbox) */}
          {(selectedComponent.type === "radio" ||
            selectedComponent.type === "checkbox") && (
              <div className="flex flex-col gap-1.5 mb-3">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  排列方向
                </label>
                <div className="flex bg-slate-100 p-1 rounded-lg">
                  <button
                    onClick={() =>
                      updateProps(selectedComponent.id, {
                        direction: "horizontal",
                      })
                    }
                    className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${selectedComponent.props.direction === "horizontal"
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                      }`}
                  >
                    水平排列
                  </button>
                  <button
                    onClick={() =>
                      updateProps(selectedComponent.id, { direction: "vertical" })
                    }
                    className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${selectedComponent.props.direction !== "horizontal"
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                      }`}
                  >
                    竖直排列
                  </button>
                </div>
              </div>
            )}

          {(selectedComponent.type === "radio" ||
            selectedComponent.type === "select" ||
            selectedComponent.type === "checkbox") && (
              <OptionsEditor
                options={selectedComponent.props.options || []}
                onChange={(newOpts) =>
                  updateProps(selectedComponent.id, { options: newOpts })
                }
                onAIGenerate={handleGenerateOptions}
                isAILoading={isOptionsAILoading}
              />
            )}
          {selectedComponent.type === "cascader" && (
            <CascaderEditor
              options={selectedComponent.props.options || []}
              onChange={(newOpts) =>
                updateProps(selectedComponent.id, { options: newOpts })
              }
              onAIGenerate={handleGenerateOptions}
              isAILoading={isOptionsAILoading}
            />
          )}
        </PanelSection>

        {/* 3. 数据校验 (带 AI 正则生成)  */}
        {(selectedComponent.type === "input" ||
          selectedComponent.type === "textarea") && (
            <PanelSection
              id="validation-props"
              title="数据校验"
              icon={ShieldCheck}
              defaultOpen={true}
            >
              <RegexEditor
                onApply={(validation) =>
                  updateComponent(selectedComponent.id, { validation })
                }
              />

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600">
                  正则表达式 (Regex)
                </label>
                <input
                  type="text"
                  placeholder="例如: ^1[3-9]\d{9}$"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-green-400 font-mono placeholder:text-slate-500 focus:ring-2 focus:ring-brand/50 outline-none shadow-inner"
                  value={selectedComponent.validation?.regex || ""}
                  onChange={(e) =>
                    updateComponent(selectedComponent.id, {
                      validation: {
                        regex: e.target.value,
                        message:
                          selectedComponent.validation?.message || "格式不正确",
                      },
                    })
                  }
                />
              </div>

              {selectedComponent.validation?.regex && (
                <div className="flex flex-col gap-1.5 pt-2">
                  <label className="text-xs font-semibold text-slate-600">
                    校验失败提示语
                  </label>
                  <input
                    type="text"
                    placeholder="请输入正确的格式"
                    className="w-full px-3 py-2 bg-red-50 border border-red-100 rounded-lg text-sm text-red-800 placeholder:text-red-300 focus:border-red-300 focus:ring-2 focus:ring-red-200 outline-none"
                    value={selectedComponent.validation?.message || ""}
                    onChange={(e) =>
                      updateComponent(selectedComponent.id, {
                        validation: {
                          ...selectedComponent.validation!,
                          message: e.target.value,
                        },
                      })
                    }
                  />
                </div>
              )}
            </PanelSection>
          )}

        {/* 4. 动态逻辑  */}
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
                value={selectedComponent.visibleRule?.sourceId || undefined}
                onChange={(value) =>
                  updateComponent(selectedComponent.id, {
                    visibleRule: value
                      ? {
                        sourceId: value,
                        operator: "===",
                        value: "",
                      }
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

            {selectedComponent.visibleRule?.sourceId && (
              <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-200 border-dashed">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  当触发值等于 (Value)
                </label>
                <input
                  type="text"
                  placeholder="输入期望的值..."
                  className="w-full px-3 py-2 bg-white border border-brand/30 rounded-lg text-sm text-slate-800 shadow-sm font-mono focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none"
                  value={selectedComponent.visibleRule?.value || ""}
                  onChange={(e) =>
                    // 修复visibleRule更新逻辑，确保operator字段被正确设置
                    updateComponent(selectedComponent.id, {
                      visibleRule: {
                        ...selectedComponent.visibleRule!,
                        value: e.target.value,
                      },
                    })
                  }
                />
              </div>
            )}
          </div>
        </PanelSection>
      </div>
    </div>
  );
};
