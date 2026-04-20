import React, { useState } from "react";
import { useEditorStore } from "../store/useEditorStore";
import { X, Globe, Link as LinkIcon, Loader2, QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { message } from "antd";
import { request } from "../utils/request";


interface Props {
    onClose: () => void;
}

export const PublishModal: React.FC<Props> = ({ onClose }) => {
    const { components, canvasTitle } = useEditorStore();
    const [isPublishing, setIsPublishing] = useState(false);
    const [shareUrl, setShareUrl] = useState("");

    const handlePublish = async () => {
        setIsPublishing(true);
        try {
            const result = await request.post("/forms", {
                title: canvasTitle,
                components: components,
            });

            if (result.success) {
                const url = `${window.location.origin}/share/${result.data.formId}`;
                setShareUrl(url);
                message.success("发布成功！");
            } else {
                message.error(result.message || "发布失败");
            }
        } catch (e) {
            // 错误已经在 request.ts 里统一拦截提示过了，这里只需要兜底即可
        } finally {
            setIsPublishing(false);
        }
    };

    const copyLink = async () => {
        try {
            // 1. 优先尝试现代剪贴板 API (适用于 HTTPS 或 localhost 环境)
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(shareUrl);
                message.success("链接已复制到剪贴板");
            } else {
                // 2. 降级方案：适用于局域网 IP 访问测试 (HTTP 环境)
                const textArea = document.createElement("textarea");
                textArea.value = shareUrl;
                // 确保文本框不可见，防止页面跳动
                textArea.style.position = "absolute";
                textArea.style.opacity = "0";
                textArea.style.left = "-999999px";
                textArea.style.top = "-999999px";
                document.body.appendChild(textArea);

                textArea.focus();
                textArea.select();

                // 执行传统复制命令
                const successful = document.execCommand('copy');
                textArea.remove();

                if (successful) {
                    message.success("链接已复制");
                } else {
                    message.error("当前浏览器不支持一键复制，请手动长按选中链接复制");
                }
            }
        } catch (e) {
            console.error("复制报错:", e);
            message.error("复制失败，请手动长按选中链接复制");
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100]">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Globe className="w-5 h-5 text-brand" />
                        发布表单
                    </h2>
                    <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg transition-colors text-slate-400">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 flex flex-col items-center">
                    {!shareUrl ? (
                        <>
                            <div className="w-16 h-16 bg-blue-50 text-brand rounded-full flex items-center justify-center mb-4">
                                <Globe className="w-8 h-8" />
                            </div>
                            <p className="text-slate-500 text-sm text-center mb-6">
                                发布后将生成专属访问链接与二维码，<br />其他人可以通过手机扫码直接填写此表单。
                            </p>
                            <button
                                onClick={handlePublish}
                                disabled={isPublishing || components.length === 0}
                                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-600/90 disabled:opacity-50 transition-all shadow-sm"
                            >
                                {isPublishing ? <Loader2 className="w-5 h-5 animate-spin" /> : "立即生成链接"}
                            </button>
                            {components.length === 0 && (
                                <p className="text-xs text-red-400 mt-3">请先在画布中添加组件再进行发布</p>
                            )}
                        </>
                    ) : (
                        <div className="flex flex-col items-center w-full animate-in fade-in">
                            <div className="p-3 bg-white border-2 border-slate-100 rounded-2xl shadow-sm mb-4">
                                <QRCodeSVG value={shareUrl} size={180} level={"H"} includeMargin={false} />
                            </div>
                            <p className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-1">
                                <QrCode className="w-4 h-4 text-slate-400" /> 微信扫一扫，立即填写
                            </p>

                            <div className="w-full flex items-center gap-2 mt-4 p-2 bg-slate-50 border border-slate-200 rounded-lg">
                                <LinkIcon className="w-4 h-4 text-slate-400 ml-2 shrink-0" />
                                <span className="text-xs text-slate-500 truncate flex-1 font-mono">{shareUrl}</span>
                                <button
                                    onClick={copyLink}
                                    className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded shadow-sm hover:border-brand hover:text-brand transition-colors whitespace-nowrap"
                                >
                                    复制链接
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};