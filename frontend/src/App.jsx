import { Routes, Route } from 'react-router-dom'
import { ToastProvider } from './components/common'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute' // Import ProtectedRoute

// Prismo 原有页面
import HomePage from './pages/HomePage'
import WaitlistPage from './pages/WaitlistPage'
import PrivacyPage from './pages/PrivacyPage'
import NotFoundPage from './pages/NotFoundPage'
// 八字命理页面
import LoginPage from './pages/LoginPage'
import ProfilePage from './pages/ProfilePage'
import PointsPage from './pages/PointsPage'
import PaymentSuccessPage from './pages/PaymentSuccessPage'
import PaymentCancelPage from './pages/PaymentCancelPage'
import SubjectsPage from './pages/SubjectsPage'
import BaziInputPage from './pages/BaziInputPage'
import BaziResultPage from './pages/BaziResultPage'
import HistoryPage from './pages/HistoryPage'

// Dev pages
import ComponentsPage from './pages/dev/ComponentsPage'
import BirthFormPage from './pages/dev/BirthFormPage'
import BaziCardsPage from './pages/dev/BaziCardsPage'
import SwitcherPage from './pages/dev/SwitcherPage'

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/waitlist" element={<WaitlistPage />} />
          <Route path="/privacy-policy" element={<PrivacyPage />} />
          
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
      </ToastProvider>
    </AuthProvider>
  )
}

export default App
