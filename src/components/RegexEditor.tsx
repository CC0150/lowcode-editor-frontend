import { useState } from "react";
import { message } from "antd";
import { request } from "../utils/request";
import { Wand2, Sparkles, Loader2 } from "lucide-react";
import type { ValidationRule } from "../types/editor";

interface RegexEditorProps {
  onApply: (validation: ValidationRule) => void;
}

/**
 * AI 正则表达式助手 —— 根据自然语言描述生成校验规则
 */
export function RegexEditor({ onApply }: RegexEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    try {
      const result = await request.post("/generate-regex", {
        prompt,
      });
      if (result.success && result.data) {
        onApply({
          regex: result.data.regex,
          message: result.data.message,
        });
        message.success("正则配置已应用");
        setPrompt("");
        setIsOpen(false);
      }
    } catch {
      // 错误统一已提示
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-4 flex flex-col bg-indigo-50/40 border border-indigo-100/80 rounded-xl overflow-hidden transition-all">
      <div
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-indigo-50/60 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
          <Wand2 className="w-3.5 h-3.5 text-indigo-500" /> AI 智能正则助手
        </span>
        <span className="text-[10px] text-indigo-400 font-medium bg-white px-2 py-0.5 rounded-full border border-indigo-100 shadow-sm">
          {isOpen ? "收起" : "试试看"}
        </span>
      </div>

      {isOpen && (
        <div className="flex flex-col gap-2 px-3 pb-3 pt-1 border-t border-indigo-100/50 animate-in slide-in-from-top-1 fade-in duration-200">
          <input
            type="text"
            placeholder="例如：大陆手机号、邮箱、必须包含数字..."
            className="w-full px-3 py-1.5 text-xs bg-white border border-indigo-200 rounded-lg focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/20 outline-none shadow-sm"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
          />
          <button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className="w-full bg-white border border-indigo-200 text-indigo-600 text-xs py-1.5 rounded-lg font-semibold hover:bg-indigo-50 hover:border-indigo-300 disabled:opacity-50 disabled:bg-slate-50 disabled:border-slate-200 disabled:text-slate-400 flex items-center justify-center gap-1.5 shadow-sm transition-all"
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <>
                <Sparkles className="w-3 h-3" /> 生成并应用
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
