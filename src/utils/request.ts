import { message } from "antd";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

interface RequestOptions extends RequestInit {
    silent?: boolean;      // 如果为 true，则不弹出全局错误提示
    rawResponse?: boolean; // 如果为 true，则直接返回原生 Response 对象（用于流式数据）
}

export const request = {
    async fetch(endpoint: string, options: RequestOptions = {}) {
        const { silent, rawResponse, ...customOptions } = options;

        // 如果 endpoint 自带 http（比如外部链接），则不拼接 BaseURL
        const url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint}`;

        const defaultHeaders: Record<string, string> = {
            "Content-Type": "application/json",
        };

        const mergedOptions: RequestInit = {
            ...customOptions,
            headers: {
                ...defaultHeaders,
                ...customOptions.headers,
            },
        };

        try {
            const response = await fetch(url, mergedOptions);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // 如果需要原生 Response (例如大模型 SSE 流式读取)，直接返回
            if (rawResponse) {
                return response;
            }

            // 否则默认自动解析并返回 JSON
            return await response.json();
        } catch (error: any) {
            // 统一错误拦截，如果是手动取消的请求（AbortError），则不提示报错
            if (error.name === "AbortError") {
                console.log("请求已被中止");
            } else if (!silent) {
                message.error("网络请求异常，请检查服务状态");
            }
            throw error;
        }
    },

    get(endpoint: string, options?: RequestOptions) {
        return this.fetch(endpoint, { ...options, method: "GET" });
    },

    post(endpoint: string, body: any, options?: RequestOptions) {
        return this.fetch(endpoint, {
            ...options,
            method: "POST",
            body: JSON.stringify(body),
        });
    },
};