import { type ComponentSchema, type FormItemType } from "../types/editor";
import type { ReactNode } from "react";
import { UploadCloud, Star, ListTree } from "lucide-react";

type CanvasRenderer = (component: ComponentSchema) => ReactNode;

const inputRenderer: CanvasRenderer = (comp) => (
  <input
    type="text"
    placeholder={comp.props.placeholder}
    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-50"
    readOnly
  />
);

const textareaRenderer: CanvasRenderer = (comp) => (
  <textarea
    placeholder={comp.props.placeholder}
    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-50 resize-none h-20"
    readOnly
  />
);

const dateRenderer: CanvasRenderer = () => (
  <input
    type="date"
    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-50 text-gray-400"
    readOnly
  />
);

const selectRenderer: CanvasRenderer = () => (
  <select
    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-50"
    disabled
  >
    <option>请选择...</option>
  </select>
);

const radioRenderer: CanvasRenderer = (comp) => (
  <div
    className={`flex mt-1 gap-4 ${comp.props.direction === "horizontal" ? "flex-row flex-wrap" : "flex-col"}`}
  >
    {(comp.props.options?.length
      ? comp.props.options
      : [{ label: "选项一" }, { label: "选项二" }]
    ).map((opt, i) => (
      <label key={i} className="flex items-center gap-2">
        <input type="radio" className="w-4 h-4" readOnly />
        <span className="text-sm">{opt.label}</span>
      </label>
    ))}
  </div>
);

const checkboxRenderer: CanvasRenderer = (comp) => (
  <div
    className={`flex mt-1 gap-4 ${comp.props.direction === "horizontal" ? "flex-row flex-wrap" : "flex-col"}`}
  >
    {(comp.props.options?.length
      ? comp.props.options
      : [{ label: "选项一" }, { label: "选项二" }]
    ).map((opt, i) => (
      <label key={i} className="flex items-center gap-2">
        <input type="checkbox" className="w-4 h-4 rounded" readOnly />
        <span className="text-sm">{opt.label}</span>
      </label>
    ))}
  </div>
);

const uploadRenderer: CanvasRenderer = () => (
  <div className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center bg-gray-50 text-gray-400">
    <UploadCloud className="w-8 h-8 mb-2" />
    <span className="text-sm">点击或拖拽文件上传</span>
  </div>
);

const rateRenderer: CanvasRenderer = (comp) => (
  <div className="flex gap-1">
    {Array.from({ length: comp.props.maxRate || 5 }).map((_, i) => (
      <Star key={i} className="w-6 h-6 text-gray-300 fill-gray-200" />
    ))}
  </div>
);

const switchRenderer: CanvasRenderer = () => (
  <div className="w-11 h-6 bg-gray-200 rounded-full relative">
    <div className="w-4 h-4 bg-white rounded-full absolute left-1 top-1 shadow-sm" />
  </div>
);

const cascaderRenderer: CanvasRenderer = () => (
  <div className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-50 flex justify-between items-center text-gray-400">
    <span>请选择级联层级...</span>
    <ListTree className="w-4 h-4" />
  </div>
);

export const canvasRenderers: Record<FormItemType, CanvasRenderer> = {
  input: inputRenderer,
  textarea: textareaRenderer,
  date: dateRenderer,
  select: selectRenderer,
  radio: radioRenderer,
  checkbox: checkboxRenderer,
  upload: uploadRenderer,
  rate: rateRenderer,
  switch: switchRenderer,
  cascader: cascaderRenderer,
};
