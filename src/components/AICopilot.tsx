import { useState, useRef } from "react";
import { message } from "antd";
import { request } from "../utils/request";
import { Sparkles, Loader2, CornerDownLeft } from "lucide-react";
import type { ComponentSchema } from "../types/editor";

/**
 * 局部 AI 助手 —— 对单个组件发指令修改属性
 *
 * 拆分为两个渲染部分：
 * - Trigger 按钮（由父组件决定放置位置）
 * - Bar 展开栏（由父组件决定放置位置）
 */
export function AICopilotBar({
  component,
  onUpdate,
  onClose,
}: {
  component: ComponentSchema;
  onUpdate: (id: string, updates: Partial<ComponentSchema>) => void;
  onClose: () => void;
}) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleModify = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    try {
      const result = await request.post("/modify-component", {
        component,
        prompt,
      });
      if (result.success && result.data) {
        onUpdate(component.id, result.data);
        message.success("AI 修改成功");
        setPrompt("");
        onClose();
      } else {
        message.error("AI 修改失败");
      }
    } catch {
      // 错误统一已提示
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="shrink-0 px-5 py-4 bg-indigo-600/5 border-b border-indigo-100 shadow-inner animate-in slide-in-from-top-2">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-4 h-4 text-indigo-600" />
        <span className="text-xs font-bold text-indigo-900">
          对该组件发指令...
        </span>
        <span className="ml-auto text-[10px] text-indigo-400 bg-white px-1.5 rounded border border-indigo-100 font-mono shadow-sm">
          Ctrl+I
        </span>
      </div>
      <div className="flex gap-2">
        <input
          ref={inputRef}
          autoFocus
          type="text"
          placeholder="例如：把选项改为四大名著..."
          className="flex-1 px-3 py-1.5 text-sm rounded border border-indigo-200 focus:ring-2 focus:ring-indigo-500/30 outline-none"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleModify()}
        />
        <button
          onClick={handleModify}
          disabled={loading || !prompt.trim()}
          className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center min-w-[60px]"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              修改 <CornerDownLeft className="w-3.5 h-3.5 ml-0.5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export function AICopilot({
  isOpen,
  onToggle,
}: {
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={`p-1.5 rounded-md transition-all shadow-sm border text-xs flex items-center gap-1 font-medium ${
        isOpen
          ? "bg-indigo-50 border-indigo-200 text-indigo-600"
          : "text-indigo-500 border-indigo-100 hover:bg-indigo-50 bg-white"
      }`}
      title="局部 AI 助手 (Ctrl+I)"
    >
      <Sparkles className="w-4 h-4" /> AI 助手
    </button>
  );
}
