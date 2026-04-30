import "@testing-library/jest-dom/vitest";

// jsdom 缺少 ResizeObserver, Ant Design 组件依赖它用于测量
globalThis.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
