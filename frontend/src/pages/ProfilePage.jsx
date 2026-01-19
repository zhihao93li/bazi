import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { m } from 'framer-motion'
import {
  SignOut,
  Trash,
  Copy,
  Check,
  Headset,
} from '@phosphor-icons/react'
import { useAuth } from '../context/AuthContext'
import { useToast, Card, LoadingOverlay } from '../components/common'
import Button from '../components/Button'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import GradientBackground from '../components/GradientBackground'
import styles from './ProfilePage.module.css'

export default function ProfilePage() {
  const navigate = useNavigate()
  const { user, isLoggedIn, logout, isLoading: authLoading } = useAuth()
  const toast = useToast()
  const [copiedId, setCopiedId] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // 检查登录状态
  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      navigate('/login?callbackUrl=/profile', { replace: true })
    }
  }, [authLoading, isLoggedIn, navigate])

  const handleLogout = () => {
    logout()
    toast.success('已退出登录')
    navigate('/', { replace: true })
  }

  const handleCopyUserId = async () => {
    if (user?.id) {
      try {
        await navigator.clipboard.writeText(user.id)
        setCopiedId(true)
        toast.success('用户ID已复制')
        setTimeout(() => setCopiedId(false), 2000)
      } catch {
        toast.error('复制失败')
      }
    }
  }

  const handleDeleteAccount = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch('/api/auth/delete-account', {
        method: 'DELETE',
        credentials: 'include',
      })

      if (response.ok) {
        logout()
        toast.success('账户已注销')
        navigate('/', { replace: true })
      } else {
        const data = await response.json()
        toast.error(data.error || '注销失败，请稍后重试')
      }
    } catch {
      toast.error('注销失败，请稍后重试')
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  if (authLoading) {
    return <LoadingOverlay fixed />
  }

  if (!isLoggedIn) {
    return null
  }

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        {/* Background */}
        <GradientBackground
          gridCount={0}
          glowColors={['rgba(94, 106, 210, 0.2)', 'rgba(138, 67, 225, 0.2)']}
          noiseOpacity={0.1}
          animated
          expanded
        />

        <div className={styles.container}>
          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* 页面标题 */}
            <div className={styles.header}>
              <h1 className={styles.title}>用户中心</h1>
              <p className={styles.subtitle}>管理您的账户信息</p>
            </div>

            {/* 账户信息 */}
            <Card padding="none" className={styles.infoCard}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>用户名</span>
                <span className={styles.infoValue}>{user?.username || '-'}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>用户ID</span>
                <div className={styles.userIdContainer}>
                  <span className={styles.infoValue}>{user?.id || '-'}</span>
                  <button
                    className={styles.copyButton}
                    onClick={handleCopyUserId}
                    title="复制用户ID"
                  >
                    {copiedId ? <Check size={16} weight="bold" /> : <Copy size={16} />}
                  </button>
                </div>
              </div>
            </Card>

            {/* 操作按钮 */}
            <div className={styles.actions}>
              <Link to="/customer-service" className={styles.actionLink}>
                <Headset size={20} />
                联系客服
              </Link>

              <Button
                variant="outline"
                onClick={handleLogout}
                className={styles.actionButton}
              >
                <SignOut size={20} />
                退出登录
              </Button>

              <Button
                variant="ghost"
                onClick={() => setShowDeleteConfirm(true)}
                className={styles.deleteButton}
              >
                <Trash size={20} />
                注销账户
              </Button>
            </div>
          </m.div>
        </div>
      </main>
      <Footer />

      {/* 注销确认弹窗 */}
      {showDeleteConfirm && (
        <div className={styles.modalOverlay} onClick={() => setShowDeleteConfirm(false)}>
          <m.div
            className={styles.modal}
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <h3 className={styles.modalTitle}>确认注销账户？</h3>
            <p className={styles.modalText}>
              注销后，您的所有数据将被永久删除，此操作无法撤销。
            </p>
            <div className={styles.modalActions}>
              <Button
                variant="ghost"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
              >
                取消
              </Button>
              <Button
                variant="outline"
                onClick={handleDeleteAccount}
                className={styles.confirmDeleteButton}
                disabled={isDeleting}
              >
                {isDeleting ? '注销中...' : '确认注销'}
              </Button>
            </div>
          </m.div>
        </div>
      )}
    </>
  )
}
