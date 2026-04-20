import React, { useId, useState, useRef } from "react";
import { UploadCloud, FileText, X } from "lucide-react";
import { type ComponentSchema } from "../types/editor";
import {
  Input,
  Select,
  Radio,
  Checkbox,
  Rate,
  Switch,
  Cascader,
  DatePicker,
} from "antd";
import dayjs from "dayjs";

interface FormControlProps {
  schema: ComponentSchema;
  value: any;
  hasError?: boolean;
  onChange: (val: any) => void;
}

/**
 * 表单控件组件
 */
export const FormControl: React.FC<FormControlProps> = ({
  schema,
  value,
  hasError,
  onChange,
}) => {
  const antStatus = hasError ? "error" : "";
  const uniqueId = useId(); // 用于绑定 label 和 input

  // 上传组件专属状态与引用
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 防止流式加载时 props 为 undefined 导致崩溃
  const safeProps = schema.props || {};

  // 修复警告 3：确保所有的 option 及其 value 都绝对不会是 null
  const normalizedOptions = (Array.isArray(safeProps.options) ? safeProps.options : []).map(
    (opt: any) => {
      if (typeof opt === "string") return { label: opt, value: opt };
      return {
        ...opt,
        label: opt?.label ?? "未命名",
        value: opt?.value ?? "",
      };
    }
  );

  // 修复警告 2：拦截底层传递给 DOM 的 null 值
  const safeTextValue = value ?? "";
  const safeSelectValue = value ?? undefined;

  switch (schema.type) {
    case "input":
      return (
        <Input
          id={uniqueId}
          status={antStatus}
          placeholder={safeProps.placeholder}
          value={safeTextValue}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case "textarea":
      return (
        <Input.TextArea
          id={uniqueId}
          status={antStatus}
          placeholder={safeProps.placeholder}
          value={safeTextValue}
          rows={4}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case "select":
      return (
        <Select
          id={uniqueId}
          status={antStatus}
          className="w-full"
          placeholder={safeProps.placeholder}
          value={safeSelectValue}
          onChange={onChange}
          options={normalizedOptions}
        />
      );

    case "radio":
      return (
        <Radio.Group
          value={safeSelectValue}
          onChange={(e) => onChange(e.target.value)}
        >
          <div
            className={`flex gap-4 ${safeProps.direction === "vertical" ? "flex-col" : "flex-row flex-wrap"
              }`}
          >
            {normalizedOptions.map((opt) => (
              <Radio key={opt.value} value={opt.value}>
                {opt.label}
              </Radio>
            ))}
          </div>
        </Radio.Group>
      );

    case "checkbox":
      return (
        <Checkbox.Group value={safeSelectValue || []} onChange={onChange}>
          <div
            className={`flex gap-4 ${safeProps.direction === "vertical" ? "flex-col" : "flex-row flex-wrap"
              }`}
          >
            {normalizedOptions.map((opt) => (
              <Checkbox key={opt.value} value={opt.value}>
                {opt.label}
              </Checkbox>
            ))}
          </div>
        </Checkbox.Group>
      );

    case "date":
      return (
        <DatePicker
          id={uniqueId}
          status={antStatus}
          className="w-full"
          placeholder={safeProps.placeholder}
          value={value ? dayjs(value) : null}
          onChange={(_, dateString) => onChange(dateString)}
        />
      );

    case "rate":
      return (
        <Rate
          count={safeProps.maxRate || 5}
          value={Number(value) || 0}
          onChange={onChange}
        />
      );

    case "switch":
      return (
        <Switch
          id={uniqueId}
          checked={!!value}
          checkedChildren={safeProps.activeText}
          unCheckedChildren={safeProps.inactiveText}
          onChange={onChange}
        />
      );

    case "cascader":
      return (
        <Cascader
          id={uniqueId}
          status={antStatus}
          className="w-full"
          placeholder={safeProps.placeholder}
          options={normalizedOptions}
          value={safeSelectValue}
          onChange={onChange}
        />
      );

    case "upload":
      // 处理拖拽与选择文件的真实逻辑
      const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
      };
      const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
      };
      const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
          // 在实际项目中这里应该调用后端接口上传，目前仅记录文件名作为演示
          onChange(files[0].name);
        }
      };
      const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
          onChange(files[0].name);
        }
      };

      return (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center transition-all cursor-pointer ${hasError
              ? "border-red-300 bg-red-50"
              : isDragging
                ? "border-brand bg-slate-100 shadow-sm scale-[1.02]"
                : "border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-brand hover:shadow-sm"
            }`}
        >
          {/* 隐藏的真实文件输入框 */}
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept={safeProps.accept}
            onChange={handleFileChange}
          />

          {value ? (
            <div
              className="flex items-center gap-2 text-brand"
              onClick={(e) => e.stopPropagation()} // 防止点击删除按钮时触发上传框
            >
              <FileText className="w-6 h-6" />
              <span className="text-sm font-medium">{value}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  onChange("");
                  if (fileInputRef.current) fileInputRef.current.value = ""; // 清空原生 input
                }}
                className="ml-2 text-red-400 hover:text-red-600 bg-white p-1 rounded-full shadow-sm"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <>
              <UploadCloud
                className={`w-8 h-8 mb-2 transition-colors ${isDragging ? "text-brand" : "text-slate-400"
                  }`}
              />
              <span className="text-sm text-slate-600 font-medium">
                {isDragging ? "松开鼠标立即上传" : "点击或拖拽文件上传"}
              </span>
              <span className="text-xs text-slate-400 mt-1">
                支持 {safeProps.accept || "所有文件"}
              </span>
            </>
          )}
        </div>
      );

    default:
      return null
  }
};