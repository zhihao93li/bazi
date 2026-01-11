import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  User, 
  CurrencyCircleDollar, 
  FileText, 
  SignOut,
  YinYang,
  ClockCounterClockwise,
  Coins,
  CaretRight
} from '@phosphor-icons/react'
import { useAuth } from '../context/AuthContext'
import { useToast, Card } from '../components/common'
import Button from '../components/Button'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { mockUserStats } from '../mock/user'
import styles from './ProfilePage.module.css'

export default function ProfilePage() {
  const navigate = useNavigate()
  const { user, isLoggedIn, logout, isLoading: authLoading } = useAuth()
  const toast = useToast()
  const [stats, setStats] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // 检查登录状态
  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      navigate('/login?callbackUrl=/profile', { replace: true })
    }
  }, [authLoading, isLoggedIn, navigate])

  // 获取统计数据
  useEffect(() => {
    if (isLoggedIn) {
      // 模拟 API 调用
      setTimeout(() => {
        setStats({
          balance: user?.balance || mockUserStats.balance,
          reportCount: mockUserStats.reportCount,
          totalSpent: mockUserStats.totalSpent,
        })
        setIsLoading(false)
      }, 500)
    }
  }, [isLoggedIn, user])

  const handleLogout = () => {
    logout()
    toast.success('已退出登录')
    navigate('/', { replace: true })
  }

  if (authLoading || !isLoggedIn) {
    return null
  }

  const quickActions = [
    { icon: YinYang, label: '八字排盘', to: '/bazi/input', color: 'purple' },
    { icon: ClockCounterClockwise, label: '历史记录', to: '/history', color: 'blue' },
    { icon: Coins, label: '积分充值', to: '/points', color: 'orange' },
    { icon: SignOut, label: '退出登录', onClick: handleLogout, color: 'red' },
  ]

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <div className={styles.container}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* 页面标题 */}
            <div className={styles.header}>
              <h1 className={styles.title}>用户中心</h1>
              <p className={styles.subtitle}>管理您的账户信息</p>
            </div>

            {/* 用户信息卡片 */}
            <Card padding="large" className={styles.userCard}>
              <div className={styles.userInfo}>
                <div className={styles.avatar}>
                  <User size={40} weight="fill" />
                </div>
                <div className={styles.userDetails}>
                  <h2 className={styles.userName}>{user?.username || '用户'}</h2>
                  <span className={styles.userStatus}>
                    {user?.phone ? user.phone : '已注册用户'}
                  </span>
                </div>
              </div>

              {/* 统计数据 */}
              <div className={styles.statsGrid}>
                <div className={styles.statItem}>
                  <span className={styles.statValue}>
                    {isLoading ? '-' : stats?.balance}
                  </span>
                  <span className={styles.statLabel}>当前积分</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statValue}>
                    {isLoading ? '-' : stats?.reportCount}
                  </span>
                  <span className={styles.statLabel}>分析报告</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statValue}>
                    {isLoading ? '-' : stats?.totalSpent}
                  </span>
                  <span className={styles.statLabel}>累计消费</span>
                </div>
              </div>
            </Card>

            {/* 快捷操作 */}
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>快捷操作</h3>
              <div className={styles.actionsGrid}>
                {quickActions.map((action, index) => (
                  <motion.div
                    key={action.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    {action.to ? (
                      <Link to={action.to} className={styles.actionCard}>
                        <div className={`${styles.actionIcon} ${styles[action.color]}`}>
                          <action.icon size={28} weight="fill" />
                        </div>
                        <span className={styles.actionLabel}>{action.label}</span>
                      </Link>
                    ) : (
                      <button 
                        className={styles.actionCard}
                        onClick={action.onClick}
                      >
                        <div className={`${styles.actionIcon} ${styles[action.color]}`}>
                          <action.icon size={28} weight="fill" />
                        </div>
                        <span className={styles.actionLabel}>{action.label}</span>
                      </button>
                    )}
                  </motion.div>
                ))}
              </div>
            </section>

            {/* 账户信息 */}
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>账户信息</h3>
              <Card padding="none" className={styles.infoCard}>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>用户名</span>
                  <span className={styles.infoValue}>{user?.username || '-'}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>手机号</span>
                  <span className={styles.infoValue}>{user?.phone || '未绑定'}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>用户ID</span>
                  <span className={styles.infoValue}>{user?.id?.slice(0, 12)}...</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>账户状态</span>
                  <span className={`${styles.infoValue} ${styles.statusNormal}`}>正常</span>
                </div>
              </Card>
            </section>

            {/* 移动端退出按钮 */}
            <div className={styles.mobileLogout}>
              <Button 
                variant="outline" 
                onClick={handleLogout}
                className={styles.logoutButton}
              >
                退出登录
              </Button>
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </>
  )
}
