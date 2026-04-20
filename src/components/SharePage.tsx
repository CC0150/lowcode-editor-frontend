import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { FormPreview } from "./FormPreview";
import { Loader2, AlertCircle } from "lucide-react";
import { type ComponentSchema } from "../types/editor";
import { request } from "../utils/request";

export const SharePage: React.FC = () => {
    const { formId } = useParams<{ formId: string }>();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [formData, setFormData] = useState<{ title: string; components: ComponentSchema[] } | null>(null);

    useEffect(() => {
        const fetchForm = async () => {
            try {
                // 开启 silent: true 阻断 antd 的默认弹窗报错
                const result = await request.get(`/forms/${formId}`, {
                    silent: true // C端页面，由下方的 catch 结合 UI 亲自处理错误体验更好
                });

                if (result.success) {
                    setFormData(result.data);
                    // 修改网页标题
                    document.title = result.data.title || "问卷表单";
                } else {
                    setError(result.message || "表单不存在或已失效");
                }
            } catch (e) {
                setError("网络请求失败，请稍后重试");
            } finally {
                setLoading(false);
            }
        };

        if (formId) {
            fetchForm();
        }
    }, [formId]);

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-indigo-500">
                <Loader2 className="w-8 h-8 animate-spin mb-4" />
                <p className="text-sm font-medium">正在加载表单...</p>
            </div>
        );
    }

    if (error || !formData) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-slate-500">
                <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
                <h2 className="text-lg font-bold text-slate-700">{error || "加载失败"}</h2>
            </div>
        );
    }

    return (
        <FormPreview
            overrideComponents={formData.components}
            overrideTitle={formData.title}
            isEmbedded={false}
            hideHeader={true}
        />
    );
};