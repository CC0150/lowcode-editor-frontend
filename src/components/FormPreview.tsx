import React, { useState, useRef } from "react";
import { useEditorStore } from "../store/useEditorStore";
import { ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import { type ComponentSchema } from "../types/editor";
import { FormControl } from "./FormControl";
import { ErrorBoundary } from "react-error-boundary";
import { request } from "../utils/request";
import { useParams } from "react-router-dom";

interface Props {
  onBack?: () => void;
  overrideComponents?: ComponentSchema[];
  isEmbedded?: boolean; // 是否嵌入模式 (用于画布流式渲染)
  hideHeader?: boolean; // 是否隐藏顶部的"退出预览"栏 (用于独立分享页)
  overrideTitle?: string; // 独立分享页需要传入从接口请求到的标题
}

export const FormPreview: React.FC<Props> = ({
  onBack,
  overrideComponents,
  isEmbedded = false,
  hideHeader = false,
  overrideTitle,
}) => {
  const { formId: urlFormId } = useParams<{ formId: string }>();

  const { components: storeComponents, canvasTitle } = useEditorStore();
  const components = overrideComponents || storeComponents;
  // 决定使用传入的标题还是本地编辑器的标题
  const displayTitle = overrideTitle || canvasTitle;

  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  const fieldRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const handleInputChange = (id: string, value: any) => {
    setFormData((prev) => ({ ...prev, [id]: value }));
    if (errors[id]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[id];
        return newErrors;
      });
    }
  };

  const checkIsVisible = (comp: ComponentSchema) => {
    if (!comp.visibleRule || !comp.visibleRule.sourceId) return true;
    return formData[comp.visibleRule.sourceId] === comp.visibleRule.value;
  };

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    let firstErrorId: string | null = null;

    components.forEach((comp, originalIndex) => {
      if (!checkIsVisible(comp)) return;

      const safeId = comp.id || `streaming-comp-${originalIndex}`;
      const val = formData[safeId];

      const isEmpty =
        val === undefined ||
        val === null ||
        val === "" ||
        (Array.isArray(val) && val.length === 0);

      if (
        comp.required &&
        comp.type !== "switch" &&
        isEmpty
      ) {
        newErrors[safeId] = "此项为必填项";
        if (!firstErrorId) firstErrorId = safeId;
      } else if (
        !isEmpty &&
        typeof val === "string" &&
        comp.validation?.regex
      ) {
        try {
          if (!new RegExp(comp.validation.regex).test(val)) {
            newErrors[safeId] = comp.validation.message || "格式不正确";
            if (!firstErrorId) firstErrorId = safeId;
          }
        } catch (err) { }
      }
    });

    if (firstErrorId) {
      setErrors(newErrors);
      fieldRefs.current[firstErrorId]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      return;
    }
    try {
      // 只有在 hideHeader 为 true (即分享页/正式填写环境) 时才提交到数据库
      if (hideHeader && urlFormId) {
        await request.post("/api/forms/submit", {
          formId: urlFormId,
          content: formData
        });
      }
      
      console.log("=== 提交的表单数据 ===", formData);
      setIsSubmitted(true);
    } catch (err) {
      alert("提交失败，请稍后重试");
    }
  };

  if (isSubmitted) {
    return (
      <div
        className={`${isEmbedded ? "w-full h-full p-6 md:p-12" : "flex-1 h-full absolute inset-0 z-50 bg-gray-50"} flex flex-col items-center justify-center`}
      >
        <div className="bg-white p-6 md:p-8 rounded-2xl md:shadow-sm flex flex-col items-center max-w-sm w-full text-center border-transparent md:border-gray-100">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-800">提交成功</h2>

          {/* 根据不同模式显示不同的成功文案 */}
          <p className="text-gray-500 text-sm mt-2">
            {isEmbedded
              ? "校验通过，逻辑运行正常！"
              : (hideHeader ? "感谢您的参与，数据已成功提交。" : "控制台已打印收集到的受控数据。")}
          </p>

          <button
            onClick={() => {
              if (isEmbedded || hideHeader) {
                // 如果是分享页或画布测试，重新填写
                setIsSubmitted(false);
                setFormData({}); // 清空上一次填写的记录
              } else if (onBack) {
                // 如果是编辑器预览，返回编辑器
                onBack();
              }
            }}
            className="mt-8 px-8 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-600/90 transition-colors shadow-sm w-full"
          >
            {isEmbedded ? "返回重新试填" : (hideHeader ? "再填一份" : "返回编辑器")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={
        isEmbedded
          ? "w-full h-full relative"
          : "flex-1 bg-gray-50 overflow-auto flex flex-col h-full w-full absolute inset-0 z-50"
      }
    >
      {!isEmbedded && !hideHeader && (
        <header className="shrink-0 h-14 bg-white flex items-center px-4 md:px-6 sticky top-0 z-20 shadow-sm">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-brand transition-colors text-sm font-medium cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> 退出预览
          </button>
        </header>
      )}

      <div
        className={
          isEmbedded
            ? "p-4 md:p-6 flex justify-center pb-24"
            : "flex-1 p-0 md:p-8 flex justify-center pb-32"
        }
      >
        <form
          onSubmit={handleSubmit}
          className={
            isEmbedded
              ? "w-full max-w-2xl bg-white rounded-xl h-fit"
              : "w-full md:max-w-2xl bg-white md:shadow-xl md:shadow-gray-200/50 md:rounded-2xl p-6 md:p-10 h-fit border-transparent md:border-gray-100"
          }
        >
          {!isEmbedded && (
            <div className="border-b-2 border-gray-100 pb-5 mb-6 md:mb-8">
              <h1 className="text-2xl md:text-3xl font-extrabold text-center text-gray-800 tracking-tight">
                {displayTitle} {/* 使用动态标题 */}
              </h1>
              <p className="text-center text-gray-400 text-xs md:text-sm mt-2">
                {/* 隐藏 Header 代表这是线上的正式分享页，文案更正式 */}
                {hideHeader ? "请如实填写以下表单内容" : "真实校验环境"}
              </p>
            </div>
          )}

          {components.length === 0 && isEmbedded && (
            <div className="text-center text-gray-400 py-10">
              AI 未生成任何组件内容
            </div>
          )}

          <div className="flex flex-col gap-6 md:gap-7">
            {components
              .map((comp, originalIndex) => ({ comp, originalIndex }))
              .filter(({ comp }) => checkIsVisible(comp))
              .map(({ comp, originalIndex }, visibleIndex) => {

                const safeKey = comp.id || `streaming-comp-${originalIndex}`;
                const hasError = !!errors[safeKey];

                return (
                  <div
                    key={safeKey}
                    ref={(el) => {
                      fieldRefs.current[safeKey] = el;
                    }}
                    className={`flex flex-col gap-2 p-2 md:p-4 md:-mx-4 rounded-xl transition-all duration-300`}
                  >
                    <label
                      className={`text-[15px] md:text-[16px] font-semibold flex items-start gap-1 leading-snug ${hasError ? "text-red-600" : "text-gray-800"}`}
                    >
                      <span className="text-gray-400 font-normal mr-1">
                        {visibleIndex + 1}.
                      </span>
                      {comp.label}
                      {comp.required && (
                        <span className="text-red-500 font-bold ml-1">*</span>
                      )}
                    </label>

                    <div className="mt-1">
                      <ErrorBoundary
                        fallback={
                          <div className="p-4 border border-red-200 bg-red-50 text-red-500 rounded-lg text-sm font-medium flex flex-col items-center justify-center">
                            <AlertCircle className="w-5 h-5 mb-1" />
                            <span>该组件属性异常，无法渲染</span>
                          </div>
                        }
                      >
                        <FormControl
                          schema={comp}
                          value={formData[safeKey]}
                          hasError={hasError}
                          onChange={(val) => handleInputChange(safeKey, val)}
                        />
                      </ErrorBoundary>
                    </div>

                    {hasError && (
                      <p className="text-xs font-medium text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors[safeKey]}
                      </p>
                    )}
                  </div>
                );
              })}
          </div>
          {components.length > 0 && !isEmbedded && (
            <div className="mt-8 pt-6 border-t border-gray-100">
              <button
                type="submit"
                className="w-full bg-indigo-600 text-white py-3.5 md:py-4 rounded-xl font-bold text-base md:text-lg shadow-lg shadow-indigo-600/30 hover:bg-indigo-600/90 hover:shadow-indigo-600/40 transition-all active:scale-[0.98]"
              >
                提交表单
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};