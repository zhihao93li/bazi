import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { ToastProvider, LoadingOverlay } from './components/common'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

// 页面级加载组件 - 使用全屏遮罩
const LoadingFallback = () => <LoadingOverlay fixed text="加载中..." />

// 首页直接导入（首屏必须）
import HomePage from './pages/HomePage'

// 其他页面懒加载
const WaitlistPage = lazy(() => import('./pages/WaitlistPage'))
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'))
const TermsPage = lazy(() => import('./pages/TermsPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

// 八字命理页面 - 懒加载
const LoginPage = lazy(() => import('./pages/LoginPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const PointsPage = lazy(() => import('./pages/PointsPage'))
const PaymentSuccessPage = lazy(() => import('./pages/PaymentSuccessPage'))
const PaymentCancelPage = lazy(() => import('./pages/PaymentCancelPage'))
const SubjectsPage = lazy(() => import('./pages/SubjectsPage'))
const BaziInputPage = lazy(() => import('./pages/BaziInputPage'))
const BaziResultPage = lazy(() => import('./pages/BaziResultPage'))
const HistoryPage = lazy(() => import('./pages/HistoryPage'))

// Dev pages - 懒加载
const ComponentsPage = lazy(() => import('./pages/dev/ComponentsPage'))
const BirthFormPage = lazy(() => import('./pages/dev/BirthFormPage'))
const BaziCardsPage = lazy(() => import('./pages/dev/BaziCardsPage'))
const SwitcherPage = lazy(() => import('./pages/dev/SwitcherPage'))

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/waitlist" element={<WaitlistPage />} />
            <Route path="/privacy-policy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />

            {/* Bazi Public/Hybrid Routes */}
            <Route path="/bazi/input" element={<BaziInputPage />} />
            <Route path="/bazi" element={<BaziResultPage />} />

            {/* Protected Routes */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/points"
              element={
                <ProtectedRoute>
                  <PointsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payment/success"
              element={
                <ProtectedRoute>
                  <PaymentSuccessPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payment/cancel"
              element={
                <ProtectedRoute>
                  <PaymentCancelPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/subjects"
              element={
                <ProtectedRoute>
                  <SubjectsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/history"
              element={
                <ProtectedRoute>
                  <HistoryPage />
                </ProtectedRoute>
              }
            />

            {/* Dev Routes (Keep public for easy access during dev) */}
            <Route path="/dev/components" element={<ComponentsPage />} />
            <Route path="/dev/birth-form" element={<BirthFormPage />} />
            <Route path="/dev/bazi-cards" element={<BaziCardsPage />} />
            <Route path="/dev/switcher" element={<SwitcherPage />} />

            {/* 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </ToastProvider>
    </AuthProvider>
  )
}

export default App
