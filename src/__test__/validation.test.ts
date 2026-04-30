import { describe, it, expect } from "vitest";
import { validateAndCleanComponents, componentSchemaZod } from "../utils/validation";

describe("validateAndCleanComponents", () => {
  // ---- 非数组输入 ----
  it("null 返回空数组", () => {
    expect(validateAndCleanComponents(null)).toEqual([]);
  });

  it("undefined 返回空数组", () => {
    expect(validateAndCleanComponents(undefined)).toEqual([]);
  });

  it("字符串返回空数组", () => {
    expect(validateAndCleanComponents("string")).toEqual([]);
  });

  it("对象返回空数组", () => {
    expect(validateAndCleanComponents({})).toEqual([]);
  });

  // ---- 正常数据 ----
  it("合法组件原样通过", () => {
    const input = [{
      id: "comp-1",
      type: "input",
      label: "姓名",
      required: true,
      props: { placeholder: "请输入姓名" },
    }];
    const result = validateAndCleanComponents(input);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("input");
    expect(result[0].label).toBe("姓名");
    expect(result[0].required).toBe(true);
  });

  it("所有合法 type 都能通过", () => {
    const types = [
      "input", "textarea", "radio", "select",
      "date", "checkbox", "upload", "rate", "switch", "cascader",
    ];
    const result = validateAndCleanComponents(
      types.map((t) => ({ type: t, label: t, required: false, props: {} }))
    );
    expect(result).toHaveLength(types.length);
    types.forEach((t, i) => expect(result[i].type).toBe(t));
  });

  // ---- 脏数据降级 ----
  it("未知 type 降级为 input", () => {
    const result = validateAndCleanComponents([
      { type: "garbage_type", label: "测试", required: false, props: {} },
    ]);
    expect(result[0].type).toBe("input");
  });

  it("缺失 label 使用默认值", () => {
    const result = validateAndCleanComponents([
      { type: "input", required: false, props: {} },
    ]);
    expect(result[0].label).toBe("未命名组件");
  });

  it("缺失 required 默认 false", () => {
    const result = validateAndCleanComponents([
      { type: "input", label: "测试", props: {} },
    ]);
    expect(result[0].required).toBe(false);
  });

  it("缺失 props 默认空对象", () => {
    const result = validateAndCleanComponents([
      { type: "input", label: "测试", required: false },
    ]);
    expect(result[0].props).toEqual({});
  });

  it("props 为非法类型时降级为空对象", () => {
    const result = validateAndCleanComponents([
      { type: "input", label: "测试", required: false, props: "garbage" },
    ]);
    expect(result[0].props).toEqual({});
  });

  // ---- 选项处理 ----
  it("radio 的 options 正确传递", () => {
    const result = validateAndCleanComponents([{
      type: "radio",
      label: "性别",
      required: false,
      props: { options: [{ label: "男", value: "male" }, { label: "女", value: "female" }] },
    }]);
    expect(result[0].props.options).toHaveLength(2);
  });

  it("option 缺失 label 时使用默认值", () => {
    const result = validateAndCleanComponents([{
      type: "select",
      label: "城市",
      required: false,
      props: { options: [{ value: "beijing" }] },
    }]);
    expect(result[0].props.options![0].label).toBe("未命名选项");
  });

  it("cascader 嵌套 options 正确解析", () => {
    const result = validateAndCleanComponents([{
      type: "cascader",
      label: "地区",
      required: false,
      props: {
        options: [{
          label: "浙江", value: "zj",
          children: [{ label: "杭州", value: "hz" }],
        }],
      },
    }]);
    expect(result[0].props.options![0].children).toHaveLength(1);
  });

  // ---- 可选字段保留 ----
  it("visibleRule 正确保留", () => {
    const result = validateAndCleanComponents([{
      type: "input", label: "条件显示", required: false, props: {},
      visibleRule: { sourceId: "comp-1", operator: "===" as const, value: "是" },
    }]);
    expect(result[0].visibleRule).toEqual({ sourceId: "comp-1", operator: "===", value: "是" });
  });

  it("validation 正确保留", () => {
    const result = validateAndCleanComponents([{
      type: "input", label: "邮箱", required: false, props: {},
      validation: { regex: "^.+@.+$", message: "请输入有效邮箱" },
    }]);
    expect(result[0].validation).toEqual({ regex: "^.+@.+$", message: "请输入有效邮箱" });
  });

  // ---- 混合数据 ----
  it("混合合法和脏数据，脏数据降级", () => {
    const result = validateAndCleanComponents([
      { type: "input", label: "正常", required: false, props: {} },
      { type: "garbage", label: "脏数据", required: false, props: {} },
    ]);
    expect(result).toHaveLength(2);
    expect(result[0].type).toBe("input");
    expect(result[1].type).toBe("input"); // 降级为 input
  });
});

describe("componentSchemaZod", () => {
  it("最小合法输入通过并填充默认值", () => {
    const result = componentSchemaZod.safeParse({ type: "input" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe("input");
      expect(result.data.label).toBe("未命名组件");
      expect(result.data.required).toBe(false);
      expect(result.data.props).toEqual({});
    }
  });

  it("空对象通过（所有字段有 catch 兜底）", () => {
    const result = componentSchemaZod.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe("input");
      expect(result.data.label).toBe("未命名组件");
    }
  });
});
