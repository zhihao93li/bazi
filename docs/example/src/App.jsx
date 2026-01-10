import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import WaitlistPage from './pages/WaitlistPage'
import PrivacyPage from './pages/PrivacyPage'
import NotFoundPage from './pages/NotFoundPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/waitlist" element={<WaitlistPage />} />
      <Route path="/privacy-policy" element={<PrivacyPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App
