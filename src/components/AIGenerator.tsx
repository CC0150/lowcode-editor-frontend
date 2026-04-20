import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useEditorStore } from "../store/useEditorStore";
import { type ComponentSchema } from "../types/editor";
import { FormPreview } from "./FormPreview";
import { Sparkles, Command, CornerDownLeft, X } from "lucide-react";
import { message } from "antd";
import { jsonrepair } from "jsonrepair";
import { validateAndCleanComponents } from "../utils/validation";
import { produce } from "immer";
import { request } from "../utils/request";

/**
 * 解析 JSON 字符串，尝试修复并返回组件数组和标题
 */
const parsePartialJSON = (jsonString: string) => {
  try {
    const repaired = jsonrepair(jsonString);
    const parsed = JSON.parse(repaired);
    return {
      components: parsed.components || [],
      title: parsed.title || "",
    };
  } catch (e) {
    // 如果 jsonrepair 都修不好，说明数据实在太少了，耐心等待下一帧
    return null;
  }
};

/**
 * AI 生成器组件
 */
export function AIGenerator() {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  // 沙箱预览状态
  const [previewData, setPreviewData] = useState<ComponentSchema[] | null>(null);
  const [previewTitle, setPreviewTitle] = useState<string>("");

  // 获取 Store 中的方法，全量覆盖到画布
  const applyAIGenerated = useEditorStore((state) => state.applyAIGenerated);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // 根据当前预览数据是否存在，判断是否处于 "追加修改" 模式
  const isPatchMode = previewData !== null && previewData.length > 0;

  /**
   * 关闭弹窗
   */
  const handleCloseModal = useCallback(() => {
    setIsOpen(false);
    setPrompt("");
    setPreviewData(null);
    setPreviewTitle(""); // 清空标题
    setLoading(false);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === "Escape") {
        handleCloseModal();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleCloseModal]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  /**
    * 触发 AI 生成或修改
    */
  const handleGenerate = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);

    if (isPatchMode && previewData) {
      // 1. 追加修改 (Patch) 模式 - 恢复流式接收机制
      abortControllerRef.current = new AbortController();
      let accumulatedText = "";

      try {
        const response: any = await request.post("/patch-form",
          { prompt, currentComponents: previewData },
          {
            signal: abortControllerRef.current.signal,
            rawResponse: true // <--- 关键点：开启原生响应流读取
          }
        );

        if (!response.body) throw new Error("无响应流");

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const dataStr = line.slice(6);

              // 当大模型输出完毕时，集中解析并应用 JSON Patch 补丁
              if (dataStr === "[DONE]") {
                try {
                  const finalJson = JSON.parse(accumulatedText);
                  if (finalJson.patches && Array.isArray(finalJson.patches)) {
                    setPreviewData((prev) => {
                      if (!prev) return prev;
                      return produce(prev, (draft) => {
                        finalJson.patches.forEach((patch: any) => {
                          if (patch.action === "remove" && patch.targetId) {
                            const index = draft.findIndex((c) => c.id === patch.targetId);
                            if (index !== -1) draft.splice(index, 1);
                          } else if (patch.action === "update" && patch.targetId && patch.updates) {
                            const component = draft.find((c) => c.id === patch.targetId);
                            if (component) {
                              Object.assign(component, patch.updates);
                            }
                          } else if (patch.action === "add" && patch.component) {
                            const newComponent = {
                              ...patch.component,
                              id: patch.component.id || `field_${Math.random().toString(36).substring(2, 9)}`
                            };
                            if (patch.targetId) {
                              const index = draft.findIndex((c) => c.id === patch.targetId);
                              if (index !== -1) {
                                const insertIndex = patch.position === "before" ? index : index + 1;
                                draft.splice(insertIndex, 0, newComponent);
                              } else {
                                draft.push(newComponent);
                              }
                            } else {
                              draft.push(newComponent);
                            }
                          }
                        });
                      });
                    });
                    message.success("表单修改成功！");
                    setPrompt("");
                  }
                } catch (e) {
                  message.error("大模型返回格式错误，未能应用修改");
                }
                break;
              }

              // 累加流式字符串
              try {
                const parsedData = JSON.parse(dataStr);
                if (parsedData.error) {
                  message.error(parsedData.error);
                  return;
                }
                if (parsedData.content) {
                  accumulatedText += parsedData.content;
                }
              } catch (e) { }
            }
          }
        }
      } catch (error: any) {
        if (error.name !== "AbortError") {
          message.error("修改请求失败，请检查网络");
        }
      } finally {
        setLoading(false);
      }
    } else {
      // 2. SSE 流式全新生成模式
      setPreviewData([]);
      setPreviewTitle("");
      abortControllerRef.current = new AbortController();
      let accumulatedText = "";

      try {
        const response: any = await request.post("/generate-form",
          { prompt },
          {
            signal: abortControllerRef.current.signal,
            rawResponse: true
          }
        );

        if (!response.body) throw new Error("无响应流");

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const dataStr = line.slice(6);
              if (dataStr === "[DONE]") break;

              try {
                const parsedData = JSON.parse(dataStr);
                if (parsedData.error) {
                  message.error(parsedData.error);
                  return;
                }
                if (parsedData.content) {
                  accumulatedText += parsedData.content;
                  const result = parsePartialJSON(accumulatedText);
                  if (result && result.components.length > 0) {
                    setPreviewData(result.components);
                    if (result.title) {
                      setPreviewTitle(result.title);
                    }
                  }
                }
              } catch (e) { }
            }
          }
        }
        setPrompt("");
      } catch (error: any) {
        if (error.name !== "AbortError") {
          message.error("生成失败，请重试");
        }
      } finally {
        setLoading(false);
      }
    }
  };

  /**
   * 确认 AI 生成的组件，覆盖到画布并更新标题
   */
  const handleConfirm = () => {
    if (previewData) {
      // 用 Zod 洗一遍数据，剥离脏属性，补充缺省值
      const safeData = validateAndCleanComponents(previewData);
      // 调用 store，同步导入组件和标题
      applyAIGenerated(safeData, previewTitle || "未命名表单");
      handleCloseModal();
    }
  };

  /**
   * 渲染弹窗内容
   */
  const modalContent = isOpen ? (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/5 backdrop-blur-md transition-all p-4 animate-in fade-in duration-200"
      onClick={handleCloseModal}
    >
      <div
        className="w-full max-w-[700px] bg-white/95 rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] overflow-hidden flex flex-col border border-slate-200/50 animate-in zoom-in-95 duration-200 ease-out"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center px-6 py-5">
          <Sparkles className="w-7 h-7 text-indigo-600 mr-4 drop-shadow-sm" />
          <textarea
            ref={inputRef}
            className="flex-1 bg-transparent text-xl text-slate-800 placeholder-slate-300 outline-none resize-none font-medium leading-relaxed"
            rows={prompt.length > 30 ? 3 : 1}
            placeholder={
              isPatchMode
                ? "继续优化表单，例如：在姓名下面加一个邮箱字段..."
                : "例如：创建一个面试登记表，包含姓名、手机号..."
            }
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleGenerate();
              }
            }}
          />
          {prompt.length > 0 && !loading && (
            <button onClick={() => setPrompt("")} className="ml-2 p-1 text-slate-300 hover:text-slate-500 transition-colors">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {(previewData || loading) && (
          <>
            <div className="h-[1px] w-full bg-slate-100" />
            <div className="flex-1 overflow-y-auto bg-slate-50/80 p-6 custom-scrollbar relative max-h-[60vh]">
              {previewData && previewData.length > 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative min-h-[200px]">

                  {/* 在沙箱预览顶部展示 AI 生成的标题 */}
                  {previewTitle && (
                    <div className="bg-slate-50 border-b border-slate-100 px-4 py-3 text-center">
                      <h3 className="text-lg font-bold text-slate-700">{previewTitle}</h3>
                    </div>
                  )}

                  <FormPreview overrideComponents={previewData} isEmbedded={true} />

                  {loading && (
                    <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur shadow-md px-3 py-1.5 rounded-full flex items-center gap-2 border border-indigo-50 animate-in fade-in zoom-in slide-in-from-bottom-2">
                      <div className="w-3 h-3 border-2 border-indigo-200 rounded-full animate-spin border-t-indigo-500"></div>
                      <span className="text-xs text-indigo-600 font-medium">
                        {isPatchMode ? "AI 正在修改..." : "AI 正在书写..."}
                      </span>
                    </div>
                  )}
                </div>
              ) : loading ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-4 py-12">
                  <div className="relative">
                    <div className="w-12 h-12 border-4 border-indigo-100 rounded-full animate-spin border-t-indigo-500"></div>
                    <Sparkles className="w-5 h-5 text-indigo-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  </div>
                  <p className="text-sm font-medium animate-pulse">正在理解您的需求...</p>
                </div>
              ) : null}
            </div>

            <div className="px-6 py-4 bg-white border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-5">
                <span className="flex items-center gap-1.5">
                  <kbd className="bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200 font-mono shadow-sm">ESC</kbd>
                  取消并清空
                </span>
                <span className="flex items-center gap-1.5">
                  <kbd className="bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200 font-mono shadow-sm">↵</kbd>
                  生成 / 追加修改
                </span>
              </div>

              {previewData && !loading && (
                <button
                  onClick={handleConfirm}
                  className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg font-medium transition-colors shadow-md active:scale-95"
                >
                  覆盖到画布 <CornerDownLeft className="w-4 h-4" />
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center justify-between w-80 px-3 py-1.5 bg-slate-100/60 hover:bg-slate-100 border border-slate-200/60 rounded-lg text-sm text-slate-500 transition-all backdrop-blur-md group focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
      >
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-4 h-4 text-indigo-500 group-hover:scale-110 transition-transform" />
          <span className="text-slate-400 group-hover:text-slate-600 transition-colors">
            让 AI 帮你生成新表单...
          </span>
        </div>
        <div className="flex items-center gap-1 text-[10px] font-mono font-medium text-slate-400 bg-white px-1.5 py-0.5 rounded shadow-sm border border-slate-200">
          <Command className="w-3 h-3" /> K
        </div>
      </button>

      {createPortal(modalContent, document.body)}
    </>
  );
}