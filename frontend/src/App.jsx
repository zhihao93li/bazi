import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { ToastProvider, LoadingOverlay } from './components/common'
import { AuthProvider } from './context/AuthContext'
import { AdminAuthProvider } from './context/AdminAuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import GuestRoute from './components/GuestRoute'
import AdminProtectedRoute from './components/AdminProtectedRoute'

// 页面级加载组件 - 使用全屏遮罩
const LoadingFallback = () => <LoadingOverlay fixed text="加载中..." />

// 首页直接导入（首屏必须）
import HomePage from './pages/HomePage'

// 其他页面懒加载
const WaitlistPage = lazy(() => import('./pages/WaitlistPage'))
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'))
const TermsPage = lazy(() => import('./pages/TermsPage'))
const RefundPage = lazy(() => import('./pages/RefundPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

// 八字命理页面 - 懒加载
const LoginPage = lazy(() => import('./pages/LoginPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const PointsPage = lazy(() => import('./pages/PointsPage'))
const PaymentSuccessPage = lazy(() => import('./pages/PaymentSuccessPage'))
const PaymentCancelPage = lazy(() => import('./pages/PaymentCancelPage'))
const PaymentResultPage = lazy(() => import('./pages/PaymentResultPage'))
const PaymentMethodPage = lazy(() => import('./pages/PaymentMethodPage'))
const SubjectsPage = lazy(() => import('./pages/SubjectsPage'))
const BaziInputPage = lazy(() => import('./pages/BaziInputPage'))
const BaziResultPage = lazy(() => import('./pages/BaziResultPage'))
const ReadingDetailPage = lazy(() => import('./pages/ReadingDetailPage'))
const SoulSongPage = lazy(() => import('./pages/SoulSongPage'))
const HistoryPage = lazy(() => import('./pages/HistoryPage'))
const CustomerServicePage = lazy(() => import('./pages/CustomerServicePage'))

// Dev pages - 懒加载
const ComponentsPage = lazy(() => import('./pages/dev/ComponentsPage'))
const BirthFormPage = lazy(() => import('./pages/dev/BirthFormPage'))
const BaziCardsPage = lazy(() => import('./pages/dev/BaziCardsPage'))
const SwitcherPage = lazy(() => import('./pages/dev/SwitcherPage'))

// Admin pages - 懒加载
const AdminLayout = lazy(() => import('./components/admin/AdminLayout'))
const AdminLoginPage = lazy(() => import('./pages/admin/AdminLoginPage'))
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'))
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage'))
const AdminSubjectsPage = lazy(() => import('./pages/admin/AdminSubjectsPage'))
const AdminTasksPage = lazy(() => import('./pages/admin/AdminTasksPage'))
const AdminThemeAnalysesPage = lazy(() => import('./pages/admin/AdminThemeAnalysesPage'))
const AdminPaymentOrdersPage = lazy(() => import('./pages/admin/AdminPaymentOrdersPage'))
const AdminPointsTransactionsPage = lazy(() => import('./pages/admin/AdminPointsTransactionsPage'))

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
            <Route path="/waitlist" element={<WaitlistPage />} />
            <Route path="/privacy-policy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/refund-policy" element={<RefundPage />} />
            <Route path="/customer-service" element={<CustomerServicePage />} />

            {/* Bazi Public/Hybrid Routes */}
            <Route path="/bazi/input" element={<BaziInputPage />} />
            <Route path="/bazi" element={<BaziResultPage />} />
            <Route path="/bazi/reading/:theme" element={<ReadingDetailPage />} />
            <Route path="/bazi/soul-song" element={<SoulSongPage />} />

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
              path="/payment/method"
              element={
                <ProtectedRoute>
                  <PaymentMethodPage />
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
              path="/payment/result"
              element={<PaymentResultPage />}
            />
            <Route
              path="/subjects"
              element={
                <ProtectedRoute>
                  <SubjectsPage />
                </ProtectedRoute>
              }
            />
            {/*            <Route
              path="/history"
              element={
                <ProtectedRoute>
                  <HistoryPage />
                </ProtectedRoute>
              }
            />*/}

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

function AdminApp() {
  return (
    <AdminAuthProvider>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Admin Login - Public */}
          <Route path="/admin/login" element={<AdminLoginPage />} />

          {/* Admin Protected Routes with Layout */}
          <Route
            path="/admin"
            element={
              <AdminProtectedRoute>
                <AdminLayout />
              </AdminProtectedRoute>
            }
          >
            <Route index element={<AdminDashboardPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="subjects" element={<AdminSubjectsPage />} />
            <Route path="tasks" element={<AdminTasksPage />} />
            <Route path="theme-analyses" element={<AdminThemeAnalysesPage />} />
            <Route path="payment-orders" element={<AdminPaymentOrdersPage />} />
            <Route path="points-transactions" element={<AdminPointsTransactionsPage />} />
          </Route>
        </Routes>
      </Suspense>
    </AdminAuthProvider>
  )
}

function RootApp() {
  const pathname = window.location.pathname

  // Admin routes use AdminApp
  if (pathname.startsWith('/admin')) {
    return <AdminApp />
  }

  // All other routes use the regular App
  return <App />
}

export default RootApp
