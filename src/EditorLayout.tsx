import { useEffect, useState, useRef } from "react";
import { useEditorStore } from "./store/useEditorStore";
import {
    PanelLeftClose,
    PanelLeftOpen,
    PanelRightClose,
    PanelRightOpen,
    Undo2,
    Redo2,
    SlidersHorizontal,
    Globe
} from "lucide-react";
import { ExportModal } from "./components/ExportModal";
import { FormPreview } from "./components/FormPreview";
import { AIGenerator } from "./components/AIGenerator";
import { LeftSidebar } from "./components/LeftSidebar";
import { EditorCanvas } from "./components/EditorCanvas";
import { RightSidebar } from "./components/RightSidebar";
import { useUIStore } from "./store/useUIStore";
import { Logo } from "./components/Logo";
import { PublishModal } from "./components/PublishModal";
import { Popover } from "antd";

export function EditorLayout() {
    const { past, future, undo, redo, formGap, updateFormGap } = useEditorStore();
    const { leftOpen, rightOpen, toggleLeft, toggleRight } = useUIStore();

    // 页面全局控制状态
    const [isPreview, setIsPreview] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [customGapInput, setCustomGapInput] = useState(String(formGap));
    const gapInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setCustomGapInput(String(formGap));
    }, [formGap]);

    // 监听键盘快捷键 (撤销/重做)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (
                e.target instanceof HTMLInputElement ||
                e.target instanceof HTMLTextAreaElement
            )
                return;
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
                e.shiftKey ? redo() : undo();
                e.preventDefault();
            } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
                e.preventDefault();
                redo();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [undo, redo]);

    return (
        <div className="h-screen w-full flex flex-col bg-gray-50 overflow-hidden font-sans text-slate-800">
            {/*  顶部导航  */}
            <header className="shrink-0 h-14 border-b border-gray-200 bg-white/90 backdrop-blur-md flex items-center px-4 justify-between z-20 shadow-sm relative">
                {/* 1. 左侧：Logo 和侧边栏开关 */}
                <div className="flex items-center gap-4 w-1/3">
                    <div className="flex items-center gap-2">
                        <Logo className="w-9 h-9" />
                        <h1 className="font-bold text-lg text-gray-800 tracking-tight">
                            AI Form <span className="text-indigo-600">Pro</span>
                        </h1>
                    </div>
                    <button
                        onClick={toggleLeft}
                        className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-md transition-colors"
                    >
                        {leftOpen ? (
                            <PanelLeftClose className="w-5 h-5" />
                        ) : (
                            <PanelLeftOpen className="w-5 h-5" />
                        )}
                    </button>

                </div>

                {/* 2. 中间：全局 AI 指挥中心入口 */}
                <div className="flex items-center justify-center w-1/3">
                    <AIGenerator />
                </div>

                {/* 3. 右侧：操作区 */}
                <div className="flex items-center justify-end gap-4 w-1/3">
                    <div className="flex items-center gap-1 border-r border-gray-200 pr-4 mr-1">
                        <button
                            onClick={undo}
                            disabled={past.length === 0}
                            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <Undo2 className="w-[18px] h-[18px]" />
                        </button>
                        <button
                            onClick={redo}
                            disabled={future.length === 0}
                            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <Redo2 className="w-[18px] h-[18px]" />
                        </button>
                    </div>
                    <Popover
                        trigger="click"
                        placement="bottomRight"
                        arrow={false}
                        content={
                            <div className="w-52">
                                <div className="text-xs font-semibold text-gray-500 mb-3 px-1">
                                    表单项间距
                                </div>
                                <div className="flex flex-col gap-1 mb-3">
                                    {[
                                        { value: 12, label: '密集' },
                                        { value: 20, label: '较紧' },
                                        { value: 24, label: '标准' },
                                        { value: 32, label: '宽松' },
                                        { value: 40, label: '极松' },
                                    ].map((opt) => (
                                        <button
                                            key={opt.value}
                                            onClick={() => updateFormGap(opt.value)}
                                            className={`flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${formGap === opt.value
                                                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                                                    : 'text-gray-600 hover:bg-gray-50'
                                                }`}
                                        >
                                            <span>{opt.label}</span>
                                            <span className={`text-xs ${formGap === opt.value ? 'text-indigo-400' : 'text-gray-400'}`}>
                                                {opt.value}px
                                            </span>
                                        </button>
                                    ))}
                                </div>
                                <div className="border-t border-gray-100 pt-3 mt-1">
                                    <label className="text-xs text-gray-400 mb-1.5 block px-1">
                                        自定义间距 (px)
                                    </label>
                                    <div className="flex items-center gap-2 px-1">
                                        <input
                                            ref={gapInputRef}
                                            type="number"
                                            min={4}
                                            max={80}
                                            className="w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-md outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 transition-colors"
                                            placeholder="如 24"
                                            defaultValue={String(formGap)}
                                            onChange={(e) => setCustomGapInput(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    const el = gapInputRef.current;
                                                    if (!el) return;
                                                    const val = parseInt(el.value, 10);
                                                    if (val >= 4 && val <= 80) updateFormGap(val);
                                                }
                                            }}
                                        />
                                        <button
                                            className="shrink-0 px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
                                            disabled={!customGapInput.trim()}
                                            onClick={() => {
                                                const el = gapInputRef.current;
                                                if (!el) return;
                                                const val = parseInt(el.value, 10);
                                                if (val >= 4 && val <= 80) updateFormGap(val);
                                            }}
                                        >
                                            应用
                                        </button>
                                    </div>
                                    <div className="text-[10px] text-gray-400 mt-1.5 px-1">
                                        当前 {formGap}px · 范围 4px ~ 80px
                                    </div>
                                </div>
                            </div>
                        }
                    >
                        <button
                            className="flex items-center gap-1.5 px-2.5 py-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md text-sm transition-colors border-r border-gray-200 mr-1"
                            title="调节表单项间距"
                        >
                            <SlidersHorizontal className="w-4 h-4" />
                        </button>
                    </Popover>
                    <button
                        onClick={() => setIsExporting(true)}
                        className="text-brand bg-brand/10 px-4 py-1.5 rounded-md text-sm font-medium hover:bg-brand/20 transition-colors"
                    >
                        导出
                    </button>
                    <button
                        onClick={() => setIsPreview(true)}
                        className="bg-brand text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-brand/90 transition-colors shadow-sm"
                    >
                        预览
                    </button>
                    <button
                        onClick={() => setIsPublishing(true)}
                        className="bg-indigo-600 text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-indigo-600/90 transition-colors shadow-sm flex items-center gap-1.5"
                    >
                        <Globe className="w-4 h-4" /> 发布
                    </button>
                    <button
                        onClick={toggleRight}
                        className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-md transition-colors"
                    >
                        {rightOpen ? (
                            <PanelRightClose className="w-5 h-5" />
                        ) : (
                            <PanelRightOpen className="w-5 h-5" />
                        )}
                    </button>
                </div>
            </header>

            {/*  主体区域  */}
            <main className="flex-1 flex overflow-hidden relative">
                {/* 全局模态框 */}
                {isPreview && <FormPreview onBack={() => setIsPreview(false)} />}
                {isExporting && <ExportModal onClose={() => setIsExporting(false)} />}
                {isPublishing && <PublishModal onClose={() => setIsPublishing(false)} />}

                <LeftSidebar isOpen={leftOpen} />
                <EditorCanvas />
                <RightSidebar isOpen={rightOpen} />
            </main>
        </div>
    );
}
