import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import MotionProvider from './components/MotionProvider'
import App from './App'
import './styles/global.css'

// 创建 QueryClient 实例
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5分钟内数据视为新鲜
      gcTime: 30 * 60 * 1000, // 30分钟后垃圾回收
      retry: 1, // 失败后重试1次
      refetchOnWindowFocus: false, // 窗口聚焦时不重新请求
    },
  },
})

// 导出 queryClient 供外部使用（如手动更新缓存）
export { queryClient }

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <MotionProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </MotionProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)
