import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { FormPreview } from "../components/FormPreview";
import { useEditorStore } from "../store/useEditorStore";
import type { ComponentSchema } from "../types/editor";

// Mock react-router-dom (FormPreview uses useParams for share page URL)
vi.mock("react-router-dom", () => ({
  useParams: () => ({}),
}));

// Mock scrollIntoView (used on validation error)
Element.prototype.scrollIntoView = vi.fn();

const makeComponent = (overrides: Partial<ComponentSchema> = {}): ComponentSchema => ({
  id: "test-id",
  type: "input",
  label: "测试组件",
  required: false,
  props: {},
  ...overrides,
});

// 渲染 FormPreview 的快捷方式
const renderFormPreview = () => render(<FormPreview />);

beforeEach(() => {
  useEditorStore.setState({
    components: [],
    canvasTitle: "测试表单",
    formGap: 24,
    selectedId: null,
    past: [],
    future: [],
  });
});

// ============================================================
// 基础渲染
// ============================================================
describe("基础渲染", () => {
  it("渲染表单标题", () => {
    renderFormPreview();
    expect(screen.getByText("测试表单")).toBeInTheDocument();
  });

  it("没有组件时不显示提交按钮", () => {
    renderFormPreview();
    expect(screen.queryByText("提交表单")).not.toBeInTheDocument();
  });

  it("有组件时显示提交按钮", () => {
    useEditorStore.setState({ components: [makeComponent({ id: "c1" })] });
    renderFormPreview();
    expect(screen.getByText("提交表单")).toBeInTheDocument();
  });
});

// ============================================================
// 可见性规则联动（核心特色功能）
// ============================================================
describe("可见性规则联动", () => {
  it("无规则的组件始终显示", () => {
    useEditorStore.setState({
      components: [makeComponent({ id: "c1", label: "始终可见" })],
    });
    renderFormPreview();
    expect(screen.getByText("始终可见")).toBeInTheDocument();
  });

  it("规则不匹配时组件隐藏", () => {
    useEditorStore.setState({
      components: [
        makeComponent({ id: "src", label: "源字段" }),
        makeComponent({
          id: "dep",
          label: "依赖字段",
          visibleRule: { sourceId: "src", operator: "===", value: "yes" },
        }),
      ],
    });
    renderFormPreview();
    expect(screen.getByText("源字段")).toBeInTheDocument();
    expect(screen.queryByText("依赖字段")).not.toBeInTheDocument();
  });

  it("规则匹配时组件显示", () => {
    useEditorStore.setState({
      components: [
        makeComponent({ id: "src", label: "源字段", props: { placeholder: "输入yes显示" } }),
        makeComponent({
          id: "dep",
          label: "依赖字段",
          visibleRule: { sourceId: "src", operator: "===", value: "yes" },
        }),
      ],
    });
    renderFormPreview();

    expect(screen.queryByText("依赖字段")).not.toBeInTheDocument();

    // 在源字段输入 "yes"
    const input = screen.getByPlaceholderText("输入yes显示");
    fireEvent.change(input, { target: { value: "yes" } });

    expect(screen.getByText("依赖字段")).toBeInTheDocument();
  });

  it("填写其他值不触发显示", () => {
    useEditorStore.setState({
      components: [
        makeComponent({ id: "src", label: "源字段", props: { placeholder: "输入" } }),
        makeComponent({
          id: "dep",
          label: "依赖字段",
          visibleRule: { sourceId: "src", operator: "===", value: "yes" },
        }),
      ],
    });
    renderFormPreview();

    fireEvent.change(screen.getByPlaceholderText("输入"), { target: { value: "no" } });
    expect(screen.queryByText("依赖字段")).not.toBeInTheDocument();
  });

  it("从匹配变为不匹配时重新隐藏", () => {
    useEditorStore.setState({
      components: [
        makeComponent({ id: "src", label: "源", props: { placeholder: "切换" } }),
        makeComponent({
          id: "dep",
          label: "依赖字段",
          visibleRule: { sourceId: "src", operator: "===", value: "yes" },
        }),
      ],
    });
    renderFormPreview();

    const input = screen.getByPlaceholderText("切换");

    fireEvent.change(input, { target: { value: "yes" } });
    expect(screen.getByText("依赖字段")).toBeInTheDocument();

    fireEvent.change(input, { target: { value: "no" } });
    expect(screen.queryByText("依赖字段")).not.toBeInTheDocument();
  });

  it("多个组件独立计算可见性", () => {
    useEditorStore.setState({
      components: [
        makeComponent({ id: "src1", label: "源1", props: { placeholder: "输入1" } }),
        makeComponent({ id: "src2", label: "源2", props: { placeholder: "输入2" } }),
        makeComponent({
          id: "dep1", label: "依赖1",
          visibleRule: { sourceId: "src1", operator: "===", value: "a" },
        }),
        makeComponent({
          id: "dep2", label: "依赖2",
          visibleRule: { sourceId: "src2", operator: "===", value: "b" },
        }),
      ],
    });
    renderFormPreview();

    expect(screen.queryByText("依赖1")).not.toBeInTheDocument();
    expect(screen.queryByText("依赖2")).not.toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("输入1"), { target: { value: "a" } });
    expect(screen.getByText("依赖1")).toBeInTheDocument();
    expect(screen.queryByText("依赖2")).not.toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("输入2"), { target: { value: "b" } });
    expect(screen.getByText("依赖2")).toBeInTheDocument();
  });

  it("引用不存在的 sourceId 时隐藏", () => {
    useEditorStore.setState({
      components: [makeComponent({
        id: "dep",
        label: "孤立依赖",
        visibleRule: { sourceId: "nonexistent", operator: "===", value: "x" },
      })],
    });
    renderFormPreview();
    expect(screen.queryByText("孤立依赖")).not.toBeInTheDocument();
  });
});

// ============================================================
// 必填校验
// ============================================================
describe("必填校验", () => {
  it("必填字段为空时提交显示错误", async () => {
    useEditorStore.setState({
      components: [makeComponent({ id: "c1", label: "姓名", required: true, props: { placeholder: "请输入姓名" } })],
    });
    renderFormPreview();

    fireEvent.click(screen.getByText("提交表单"));

    await waitFor(() => {
      expect(screen.getByText("此项为必填项")).toBeInTheDocument();
    });
  });

  it("必填字段填写后提交通过", async () => {
    useEditorStore.setState({
      components: [makeComponent({ id: "c1", label: "姓名", required: true, props: { placeholder: "请输入姓名" } })],
    });
    renderFormPreview();

    fireEvent.change(screen.getByPlaceholderText("请输入姓名"), { target: { value: "张三" } });
    fireEvent.click(screen.getByText("提交表单"));

    await waitFor(() => {
      expect(screen.getByText("提交成功")).toBeInTheDocument();
    });
  });

  it("多个必填字段同时显示多个错误", async () => {
    useEditorStore.setState({
      components: [
        makeComponent({ id: "c1", label: "字段A", required: true, props: { placeholder: "A" } }),
        makeComponent({ id: "c2", label: "字段B", required: true, props: { placeholder: "B" } }),
      ],
    });
    renderFormPreview();

    fireEvent.click(screen.getByText("提交表单"));

    await waitFor(() => {
      expect(screen.getAllByText("此项为必填项")).toHaveLength(2);
    });
  });

  it("选填字段不影响必填字段的校验", async () => {
    useEditorStore.setState({
      components: [
        makeComponent({ id: "c1", label: "选填", required: false, props: { placeholder: "非必填" } }),
        makeComponent({ id: "c2", label: "必填", required: true, props: { placeholder: "必填" } }),
      ],
    });
    renderFormPreview();

    fireEvent.change(screen.getByPlaceholderText("必填"), { target: { value: "填了" } });
    fireEvent.click(screen.getByText("提交表单"));

    await waitFor(() => {
      expect(screen.getByText("提交成功")).toBeInTheDocument();
    });
  });

  it("填写后错误提示自动消失", async () => {
    useEditorStore.setState({
      components: [makeComponent({ id: "c1", label: "姓名", required: true, props: { placeholder: "请输入" } })],
    });
    renderFormPreview();

    fireEvent.click(screen.getByText("提交表单"));
    await waitFor(() => {
      expect(screen.getByText("此项为必填项")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText("请输入"), { target: { value: "张三" } });
    expect(screen.queryByText("此项为必填项")).not.toBeInTheDocument();
  });

  it("switch 类型跳过必填校验", async () => {
    useEditorStore.setState({
      components: [makeComponent({ id: "c1", type: "switch", label: "开关", required: true })],
    });
    renderFormPreview();

    fireEvent.click(screen.getByText("提交表单"));

    await waitFor(() => {
      expect(screen.getByText("提交成功")).toBeInTheDocument();
    });
  });

  it("隐藏的必填字段不触发校验", async () => {
    useEditorStore.setState({
      components: [
        makeComponent({ id: "src", label: "开关", props: { placeholder: "输入show" } }),
        makeComponent({
          id: "dep",
          label: "条件必填",
          required: true,
          props: { placeholder: "依赖输入" },
          visibleRule: { sourceId: "src", operator: "===", value: "show" },
        }),
      ],
    });
    renderFormPreview();

    // dep 隐藏时，提交跳过它的校验
    fireEvent.click(screen.getByText("提交表单"));
    await waitFor(() => {
      expect(screen.getByText("提交成功")).toBeInTheDocument();
    });
  });
});

// ============================================================
// 正则校验
// ============================================================
describe("正则校验", () => {
  it("不匹配时显示自定义错误", async () => {
    useEditorStore.setState({
      components: [makeComponent({
        id: "c1", label: "邮箱", required: false,
        props: { placeholder: "输入邮箱" },
        validation: { regex: "^.+@.+$", message: "请输入有效邮箱" },
      })],
    });
    renderFormPreview();

    fireEvent.change(screen.getByPlaceholderText("输入邮箱"), { target: { value: "invalid" } });
    fireEvent.click(screen.getByText("提交表单"));

    await waitFor(() => {
      expect(screen.getByText("请输入有效邮箱")).toBeInTheDocument();
    });
  });

  it("匹配时校验通过", async () => {
    useEditorStore.setState({
      components: [makeComponent({
        id: "c1", label: "邮箱", required: false,
        props: { placeholder: "输入邮箱" },
        validation: { regex: "^.+@.+$", message: "请输入有效邮箱" },
      })],
    });
    renderFormPreview();

    fireEvent.change(screen.getByPlaceholderText("输入邮箱"), { target: { value: "test@example.com" } });
    fireEvent.click(screen.getByText("提交表单"));

    await waitFor(() => {
      expect(screen.getByText("提交成功")).toBeInTheDocument();
    });
  });

  it("空值不触发正则校验", async () => {
    useEditorStore.setState({
      components: [makeComponent({
        id: "c1", label: "邮箱", required: false,
        props: { placeholder: "输入邮箱" },
        validation: { regex: "^.+@.+$", message: "请输入有效邮箱" },
      })],
    });
    renderFormPreview();

    // 非必填 + 空值，直接提交
    fireEvent.click(screen.getByText("提交表单"));

    await waitFor(() => {
      expect(screen.getByText("提交成功")).toBeInTheDocument();
    });
  });

  it("非法正则不崩溃", () => {
    useEditorStore.setState({
      components: [makeComponent({
        id: "c1", label: "奇怪校验", required: false,
        props: { placeholder: "输入" },
        validation: { regex: "[invalid", message: "不会触发" },
      })],
    });
    renderFormPreview();

    fireEvent.change(screen.getByPlaceholderText("输入"), { target: { value: "test" } });
    expect(() => {
      fireEvent.click(screen.getByText("提交表单"));
    }).not.toThrow();
  });
});

// ============================================================
// 提交流程
// ============================================================
describe("提交流程", () => {
  it("提交成功后显示成功页面", async () => {
    useEditorStore.setState({
      components: [makeComponent({ id: "c1", props: { placeholder: "输入" } })],
    });
    renderFormPreview();

    fireEvent.change(screen.getByPlaceholderText("输入"), { target: { value: "数据" } });
    fireEvent.click(screen.getByText("提交表单"));

    await waitFor(() => {
      expect(screen.getByText("提交成功")).toBeInTheDocument();
    });
  });

  it("成功页面可返回编辑器", async () => {
    const onBack = vi.fn();
    useEditorStore.setState({
      components: [makeComponent({ id: "c1" })],
    });
    render(<FormPreview onBack={onBack} />);

    fireEvent.click(screen.getByText("提交表单"));
    await waitFor(() => {
      expect(screen.getByText("提交成功")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("返回编辑器"));
    expect(onBack).toHaveBeenCalledOnce();
  });
});
