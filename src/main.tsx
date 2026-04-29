import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary'
import { AlertTriangle } from 'lucide-react'
import './index.css'
import App from './App.tsx'

function Fallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-red-100 p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-xl font-bold text-gray-800 mb-2">应用出现异常</h1>
        <p className="text-sm text-gray-500 mb-4 font-mono bg-gray-50 rounded-lg p-3 text-left break-all">
          {error instanceof Error ? error.message : '未知错误'}
        </p>
        <button
          onClick={resetErrorBoundary}
          className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <AlertTriangle className="w-4 h-4" /> 重新加载
        </button>
      </div>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary FallbackComponent={Fallback}>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
