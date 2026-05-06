import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useEditorStore } from "../../store/useEditorStore";
import { canvasRenderers } from "./CanvasRenderer";

interface Props {
  id: string;
  index: number;
}

export const SortableWrapper: React.FC<Props> = React.memo(({ id, index }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const selectedId = useEditorStore((s) => s.selectedId);
  const selectComponent = useEditorStore((s) => s.selectComponent);
  const formGap = useEditorStore((s) => s.formGap);
  const comp = useEditorStore((s) => s.components.find((c) => c.id === id));

  // 组件被删除后，等待 React 卸载
  if (!comp) return null;

  const isSelected = selectedId === id;

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.5 : 1,
    marginBottom: formGap,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        e.stopPropagation();
        selectComponent(id);
      }}
      className={`relative p-4 bg-white border rounded-lg cursor-move transition-colors group ${
        isSelected
          ? "border-brand ring-1 ring-brand shadow-sm"
          : "border-transparent hover:border-dashed hover:border-gray-300 hover:bg-gray-50"
      }`}
    >
      {isSelected && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600 rounded-l-lg" />
      )}
      <div className="flex flex-col gap-2 pointer-events-none">
        <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
          {index + 1}. {comp.label}{" "}
          {comp.required && <span className="text-red-500">*</span>}
        </label>
        {canvasRenderers[comp.type](comp)}
      </div>
    </div>
  );
});
SortableWrapper.displayName = "SortableWrapper";
