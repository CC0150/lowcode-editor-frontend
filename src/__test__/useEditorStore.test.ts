import { describe, it, expect, beforeEach } from "vitest";
import { useEditorStore } from "../store/useEditorStore";
import type { ComponentSchema } from "../types/editor";

/**
 * useEditorStore 测试
 *
 * 覆盖核心功能：
 * - 组件 CRUD（添加、修改、删除、排序）
 * - 撤销 / 重做（基于 Immer patches）
 * - AI 生成 / 增量补丁
 * - 边界情况（空栈安全、无效 id 降级）
 */

// 每个测试前重置 store 到初始状态
beforeEach(() => {
  useEditorStore.setState({
    components: [],
    canvasTitle: "自定义表单",
    formGap: 24,
    selectedId: null,
    past: [],
    future: [],
  });
});

// 辅助：快速构造一个组件
const makeComponent = (overrides: Partial<ComponentSchema> = {}): ComponentSchema => ({
  id: "test-id",
  type: "input",
  label: "测试组件",
  required: false,
  props: {},
  ...overrides,
});

// ============================================================
// 添加组件
// ============================================================
describe("addComponent", () => {
  it("添加后 components 数量 +1", () => {
    useEditorStore.getState().addComponent("input");
    expect(useEditorStore.getState().components).toHaveLength(1);
  });

  it("多次添加得到不同的 id", () => {
    useEditorStore.getState().addComponent("input");
    useEditorStore.getState().addComponent("input");
    const [a, b] = useEditorStore.getState().components;
    expect(a.id).not.toBe(b.id);
  });

  it("input 类型有正确的默认 label 和 placeholder", () => {
    useEditorStore.getState().addComponent("input");
    const c = useEditorStore.getState().components[0];
    expect(c.type).toBe("input");
    expect(c.label).toBe("新建单行文本");
    expect(c.props.placeholder).toBe("请输入");
  });

  it("radio 类型带默认选项和竖向排列", () => {
    useEditorStore.getState().addComponent("radio");
    const c = useEditorStore.getState().components[0];
    expect(c.type).toBe("radio");
    expect(c.props.options).toHaveLength(2);
    expect(c.props.options![0].label).toBe("选项 1");
    expect(c.props.direction).toBe("vertical");
  });

  it("cascader 类型带嵌套子选项", () => {
    useEditorStore.getState().addComponent("cascader");
    const c = useEditorStore.getState().components[0];
    expect(c.props.options).toHaveLength(1);
    expect(c.props.options![0].children).toHaveLength(1);
  });
});

// ============================================================
// 修改组件
// ============================================================
describe("updateComponent", () => {
  it("修改 label", () => {
    useEditorStore.setState({ components: [makeComponent({ id: "c1" })] });
    useEditorStore.getState().updateComponent("c1", { label: "新名称" });
    expect(useEditorStore.getState().components[0].label).toBe("新名称");
  });

  it("修改 required", () => {
    useEditorStore.setState({ components: [makeComponent({ id: "c1" })] });
    useEditorStore.getState().updateComponent("c1", { required: true });
    expect(useEditorStore.getState().components[0].required).toBe(true);
  });

  it("不存在的 id 不影响现有组件", () => {
    useEditorStore.setState({ components: [makeComponent({ id: "c1" })] });
    useEditorStore.getState().updateComponent("nonexistent", { label: "改了" });
    expect(useEditorStore.getState().components[0].label).toBe("测试组件");
  });
});

describe("updateProps", () => {
  it("合并更新 placeholder", () => {
    useEditorStore.setState({
      components: [makeComponent({ id: "c1", props: { placeholder: "旧" } })],
    });
    useEditorStore.getState().updateProps("c1", { placeholder: "新" });
    expect(useEditorStore.getState().components[0].props.placeholder).toBe("新");
  });

  it("不存在的 id 不修改", () => {
    useEditorStore.setState({ components: [makeComponent({ id: "c1" })] });
    useEditorStore.getState().updateProps("nonexistent", { placeholder: "新" });
    expect(useEditorStore.getState().components[0].props.placeholder).toBeUndefined();
  });
});

// ============================================================
// 删除与排序
// ============================================================
describe("deleteComponent", () => {
  it("删除后组件数量减少", () => {
    useEditorStore.setState({
      components: [makeComponent({ id: "c1" }), makeComponent({ id: "c2" })],
    });
    useEditorStore.getState().deleteComponent("c1");
    expect(useEditorStore.getState().components).toHaveLength(1);
    expect(useEditorStore.getState().components[0].id).toBe("c2");
  });

  it("删除选中组件时清除 selectedId", () => {
    useEditorStore.setState({
      components: [makeComponent({ id: "c1" })],
      selectedId: "c1",
    });
    useEditorStore.getState().deleteComponent("c1");
    expect(useEditorStore.getState().selectedId).toBeNull();
  });

  it("删除非选中组件时不改变 selectedId", () => {
    useEditorStore.setState({
      components: [makeComponent({ id: "c1" }), makeComponent({ id: "c2" })],
      selectedId: "c1",
    });
    useEditorStore.getState().deleteComponent("c2");
    expect(useEditorStore.getState().selectedId).toBe("c1");
  });

  it("删除不存在的 id 不报错", () => {
    useEditorStore.setState({ components: [makeComponent({ id: "c1" })] });
    expect(() => useEditorStore.getState().deleteComponent("nonexistent")).not.toThrow();
  });
});

describe("reorderComponents", () => {
  it("将第一个组件移到末尾", () => {
    useEditorStore.setState({
      components: [
        makeComponent({ id: "c1", label: "第一" }),
        makeComponent({ id: "c2", label: "第二" }),
        makeComponent({ id: "c3", label: "第三" }),
      ],
    });
    useEditorStore.getState().reorderComponents(0, 2);
    const labels = useEditorStore.getState().components.map((c) => c.label);
    expect(labels).toEqual(["第二", "第三", "第一"]);
  });
});

describe("selectComponent", () => {
  it("选中指定组件", () => {
    useEditorStore.getState().selectComponent("c1");
    expect(useEditorStore.getState().selectedId).toBe("c1");
  });

  it("传 null 清除选中", () => {
    useEditorStore.setState({ selectedId: "c1" });
    useEditorStore.getState().selectComponent(null);
    expect(useEditorStore.getState().selectedId).toBeNull();
  });
});

describe("clearCanvas", () => {
  it("清空所有组件、选中状态、重置标题", () => {
    useEditorStore.setState({
      components: [makeComponent({ id: "c1" }), makeComponent({ id: "c2" })],
      selectedId: "c1",
    });
    useEditorStore.getState().clearCanvas();
    expect(useEditorStore.getState().components).toHaveLength(0);
    expect(useEditorStore.getState().selectedId).toBeNull();
    expect(useEditorStore.getState().canvasTitle).toBe("未命名表单");
  });
});

// ============================================================
// 撤销 / 重做（核心能力）
// ============================================================
describe("undo / redo", () => {
  it("撤销添加组件回到空状态", () => {
    useEditorStore.getState().addComponent("input");
    expect(useEditorStore.getState().components).toHaveLength(1);
    useEditorStore.getState().undo();
    expect(useEditorStore.getState().components).toHaveLength(0);
  });

  it("撤销后重做恢复组件", () => {
    useEditorStore.getState().addComponent("input");
    useEditorStore.getState().undo();
    useEditorStore.getState().redo();
    expect(useEditorStore.getState().components).toHaveLength(1);
  });

  it("多次操作逐个撤销", () => {
    useEditorStore.getState().addComponent("input");
    useEditorStore.getState().addComponent("radio");
    useEditorStore.getState().addComponent("select");
    expect(useEditorStore.getState().components).toHaveLength(3);

    useEditorStore.getState().undo();
    expect(useEditorStore.getState().components).toHaveLength(2);
    useEditorStore.getState().undo();
    expect(useEditorStore.getState().components).toHaveLength(1);
    useEditorStore.getState().undo();
    expect(useEditorStore.getState().components).toHaveLength(0);
  });

  it("新操作清空 redo 栈", () => {
    useEditorStore.getState().addComponent("input");
    useEditorStore.getState().undo();
    expect(useEditorStore.getState().future).toHaveLength(1);

    useEditorStore.getState().addComponent("textarea");
    expect(useEditorStore.getState().future).toHaveLength(0);
  });

  it("空栈时 undo 不报错", () => {
    expect(() => useEditorStore.getState().undo()).not.toThrow();
  });

  it("空栈时 redo 不报错", () => {
    expect(() => useEditorStore.getState().redo()).not.toThrow();
  });

  it("撤销修改组件恢复原始值", () => {
    useEditorStore.setState({ components: [makeComponent({ id: "c1", label: "原始" })] });
    useEditorStore.getState().updateComponent("c1", { label: "修改后" });
    useEditorStore.getState().undo();
    expect(useEditorStore.getState().components[0].label).toBe("原始");
  });

  it("撤销删除恢复被删的组件", () => {
    useEditorStore.setState({
      components: [makeComponent({ id: "c1" }), makeComponent({ id: "c2" })],
    });
    useEditorStore.getState().deleteComponent("c1");
    useEditorStore.getState().undo();
    expect(useEditorStore.getState().components).toHaveLength(2);
    expect(useEditorStore.getState().components[0].id).toBe("c1");
  });

  it("撤销排序恢复原始顺序", () => {
    useEditorStore.setState({
      components: [
        makeComponent({ id: "c1", label: "A" }),
        makeComponent({ id: "c2", label: "B" }),
      ],
    });
    useEditorStore.getState().reorderComponents(0, 1);
    useEditorStore.getState().undo();
    const labels = useEditorStore.getState().components.map((c) => c.label);
    expect(labels).toEqual(["A", "B"]);
  });
});

// ============================================================
// AI 生成
// ============================================================
describe("applyAIGenerated", () => {
  it("替换所有组件", () => {
    useEditorStore.setState({ components: [makeComponent({ id: "old" })] });
    useEditorStore.getState().applyAIGenerated([
      makeComponent({ id: "ai-1", label: "AI 生成的" }),
    ]);
    expect(useEditorStore.getState().components).toHaveLength(1);
    expect(useEditorStore.getState().components[0].label).toBe("AI 生成的");
  });

  it("同步更新标题", () => {
    useEditorStore.getState().applyAIGenerated(
      [makeComponent({ id: "ai-1" })],
      "AI 表单"
    );
    expect(useEditorStore.getState().canvasTitle).toBe("AI 表单");
  });

  it("不传标题时保留原标题", () => {
    useEditorStore.setState({ canvasTitle: "原标题" });
    useEditorStore.getState().applyAIGenerated([]);
    expect(useEditorStore.getState().canvasTitle).toBe("原标题");
  });

  it("AI 生成后可撤销回到之前状态", () => {
    useEditorStore.getState().addComponent("input");
    useEditorStore.getState().addComponent("textarea");
    expect(useEditorStore.getState().components).toHaveLength(2);

    useEditorStore.getState().applyAIGenerated(
      [makeComponent({ id: "ai-1" })],
      "新标题"
    );
    expect(useEditorStore.getState().components).toHaveLength(1);

    useEditorStore.getState().undo();
    // undo 只恢复组件变更，不恢复标题（标题的 set 在 applyChange 之外）
    expect(useEditorStore.getState().components).toHaveLength(2);
  });
});

// ============================================================
// AI 增量补丁
// ============================================================
describe("applyAIPatches", () => {
  it("add 补丁添加组件到末尾", () => {
    useEditorStore.setState({ components: [makeComponent({ id: "c1" })] });
    useEditorStore.getState().applyAIPatches([
      { action: "add", component: makeComponent({ id: "new-1", label: "新增" }) },
    ]);
    expect(useEditorStore.getState().components).toHaveLength(2);
    expect(useEditorStore.getState().components[1].label).toBe("新增");
  });

  it("add 补丁支持 before 定位插入", () => {
    useEditorStore.setState({
      components: [
        makeComponent({ id: "c1", label: "A" }),
        makeComponent({ id: "c2", label: "B" }),
      ],
    });
    useEditorStore.getState().applyAIPatches([
      {
        action: "add",
        targetId: "c2",
        position: "before",
        component: makeComponent({ id: "new", label: "插入" }),
      },
    ]);
    expect(useEditorStore.getState().components.map((c) => c.label)).toEqual(["A", "插入", "B"]);
  });

  it("update 补丁修改组件", () => {
    useEditorStore.setState({ components: [makeComponent({ id: "c1" })] });
    useEditorStore.getState().applyAIPatches([
      { action: "update", targetId: "c1", updates: { label: "已修改" } },
    ]);
    expect(useEditorStore.getState().components[0].label).toBe("已修改");
  });

  it("remove 补丁删除组件", () => {
    useEditorStore.setState({
      components: [makeComponent({ id: "c1" }), makeComponent({ id: "c2" })],
    });
    useEditorStore.getState().applyAIPatches([
      { action: "remove", targetId: "c1" },
    ]);
    expect(useEditorStore.getState().components).toHaveLength(1);
    expect(useEditorStore.getState().components[0].id).toBe("c2");
  });

  it("多个补丁按顺序执行", () => {
    useEditorStore.setState({ components: [makeComponent({ id: "c1" })] });
    useEditorStore.getState().applyAIPatches([
      { action: "update", targetId: "c1", updates: { label: "更新" } },
      { action: "add", component: makeComponent({ id: "c2", label: "新增" }) },
    ]);
    expect(useEditorStore.getState().components).toHaveLength(2);
    expect(useEditorStore.getState().components[0].label).toBe("更新");
    expect(useEditorStore.getState().components[1].label).toBe("新增");
  });

  it("空补丁不产生历史记录", () => {
    useEditorStore.setState({ components: [makeComponent({ id: "c1" })] });
    const pastBefore = useEditorStore.getState().past.length;
    useEditorStore.getState().applyAIPatches([]);
    expect(useEditorStore.getState().past.length).toBe(pastBefore);
  });

  it("不存在的 targetId 在 add 时追加到末尾", () => {
    useEditorStore.setState({ components: [makeComponent({ id: "c1" })] });
    useEditorStore.getState().applyAIPatches([
      {
        action: "add",
        targetId: "nonexistent",
        component: makeComponent({ id: "new", label: "追加" }),
      },
    ]);
    expect(useEditorStore.getState().components).toHaveLength(2);
    expect(useEditorStore.getState().components[1].label).toBe("追加");
  });

  it("AI 补丁后可撤销恢复", () => {
    useEditorStore.setState({ components: [makeComponent({ id: "c1" })] });
    useEditorStore.getState().applyAIPatches([
      { action: "update", targetId: "c1", updates: { label: "AI 改的" } },
    ]);
    useEditorStore.getState().undo();
    expect(useEditorStore.getState().components[0].label).toBe("测试组件");
  });
});

// ============================================================
// 其他
// ============================================================
describe("updateTitle / updateFormGap", () => {
  it("updateTitle 更新画布标题", () => {
    useEditorStore.getState().updateTitle("新标题");
    expect(useEditorStore.getState().canvasTitle).toBe("新标题");
  });

  it("updateFormGap 更新间距", () => {
    useEditorStore.getState().updateFormGap(32);
    expect(useEditorStore.getState().formGap).toBe(32);
  });
});
