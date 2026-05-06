import React from "react";
import { useEditorStore } from "../../store/useEditorStore";
import { SortableWrapper } from "./SortableWrapper";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

/** 画布标题 — 单独订阅 store，避免因组件变更而重渲染 */
const CanvasTitle = React.memo(() => {
  const canvasTitle = useEditorStore((s) => s.canvasTitle);
  const updateTitle = useEditorStore((s) => s.updateTitle);

  return (
    <div className="border-b-2 border-gray-100 pb-4 mb-8">
      <input
        value={canvasTitle}
        onChange={(e) => updateTitle(e.target.value)}
        className="text-2xl font-bold text-center text-gray-800 w-full border-none focus:ring-0 bg-transparent hover:bg-gray-50 rounded transition-colors"
        placeholder="请输入表单标题"
      />
      <p className="text-gray-500 text-sm text-center mt-2">
        请如实填写以下信息
      </p>
    </div>
  );
});
CanvasTitle.displayName = "CanvasTitle";

export const EditorCanvas: React.FC = React.memo(() => {
  const components = useEditorStore((s) => s.components);
  const selectComponent = useEditorStore((s) => s.selectComponent);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const handleDragEnd = React.useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const state = useEditorStore.getState();
      const oldIndex = state.components.findIndex((c) => c.id === active.id);
      const newIndex = state.components.findIndex((c) => c.id === over.id);
      state.reorderComponents(oldIndex, newIndex);
    }
  }, []);

  return (
    <section
      className="flex-1 bg-gray-100 p-8 overflow-auto flex items-start justify-center transition-all duration-300 custom-scrollbar"
      onClick={() => selectComponent(null)}
    >
      <div
        className="w-full max-w-2xl bg-white shadow-xl rounded-xl min-h-[560px] p-10 ring-1 ring-gray-200/50"
        onClick={(e) => e.stopPropagation()}
      >
        <CanvasTitle />

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={components.map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            {components.map((comp, index) => (
              <SortableWrapper
                key={comp.id}
                id={comp.id}
                index={index}
              />
            ))}
          </SortableContext>
        </DndContext>

        {components.length === 0 && (
          <div className="text-center text-gray-400 mt-10 border-2 border-dashed border-gray-200 py-16 rounded-xl bg-gray-50/50">
            点击左侧组件，开始搭建表单
          </div>
        )}
      </div>
    </section>
  );
});
EditorCanvas.displayName = "EditorCanvas";
