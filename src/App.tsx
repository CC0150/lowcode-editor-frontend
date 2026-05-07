import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

const EditorLayout = lazy(() =>
    import("./EditorLayout").then((m) => ({ default: m.EditorLayout }))
);
const SharePage = lazy(() =>
    import("./components/form/SharePage").then((m) => ({ default: m.SharePage }))
);

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-indigo-200 rounded-full animate-spin border-t-indigo-500" />
        <p className="text-sm text-slate-400 font-medium">加载中...</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<EditorLayout />} />
          <Route path="/share/:formId" element={<SharePage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}