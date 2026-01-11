import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Check, ArrowUp, ArrowDown, Gift } from '@phosphor-icons/react'
import { useAuth } from '../context/AuthContext'
import { useToast, Card } from '../components/common'
import Button from '../components/Button'
import Tag from '../components/Tag'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { mockPackages, mockTransactions, fetchPointsData } from '../mock/points'
import styles from './PointsPage.module.css'

export default function PointsPage() {
  const navigate = useNavigate()
  const { user, isLoggedIn, updateUser, isLoading: authLoading } = useAuth()
  const toast = useToast()
  const [balance, setBalance] = useState(0)
  const [transactions, setTransactions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [purchasing, setPurchasing] = useState(null)

  // 检查登录状态
  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      navigate('/login?callbackUrl=/points', { replace: true })
    }
  }, [authLoading, isLoggedIn, navigate])

  // 获取数据
  useEffect(() => {
    if (isLoggedIn) {
      fetchPointsData().then(data => {
        setBalance(user?.balance || data.balance)
        setTransactions(data.transactions)
        setIsLoading(false)
      })
    }
  }, [isLoggedIn, user])

  const handlePurchase = async (pkg) => {
    setPurchasing(pkg.id)
    
    // 模拟支付流程
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // 更新积分
    const newBalance = balance + pkg.points
    setBalance(newBalance)
    updateUser({ balance: newBalance })
    
    // 添加交易记录
    const newTransaction = {
      id: `tx-${Date.now()}`,
      type: 'recharge',
      amount: pkg.points,
      balance: newBalance,
      description: `充值 - ${pkg.name}套餐`,
      createdAt: new Date().toISOString(),
    }
    setTransactions([newTransaction, ...transactions])
    
    toast.success(`充值成功！获得 ${pkg.points} 积分`)
    setPurchasing(null)
  }

  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
  }

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'recharge':
        return <ArrowUp size={18} weight="bold" />
      case 'consume':
        return <ArrowDown size={18} weight="bold" />
      case 'bonus':
        return <Gift size={18} weight="bold" />
      default:
        return null
    }
  }

  if (authLoading || !isLoggedIn) {
    return null
  }

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
              <h1 className={styles.title}>积分中心</h1>
              <p className={styles.subtitle}>管理您的积分余额和充值</p>
            </div>

            {/* 余额卡片 */}
            <Card variant="gradient" padding="large" className={styles.balanceCard}>
              <span className={styles.balanceLabel}>当前积分</span>
              <span className={styles.balanceValue}>
                {isLoading ? '-' : balance.toLocaleString()}
              </span>
              <span className={styles.balanceHint}>积分可用于命理分析服务</span>
            </Card>

            {/* 充值套餐 */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>充值套餐</h2>
              <div className={styles.packagesGrid}>
                {mockPackages.map((pkg, index) => (
                  <motion.div
                    key={pkg.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Card 
                      hover 
                      padding="medium"
                      className={`${styles.packageCard} ${pkg.popular ? styles.popular : ''}`}
                    >
                      {pkg.popular && (
                        <span className={styles.popularBadge}>推荐</span>
                      )}
                      <span className={styles.packagePoints}>{pkg.points}</span>
                      <span className={styles.packagePointsLabel}>积分</span>
                      <span className={styles.packagePrice}>¥{pkg.price.toFixed(2)}</span>
                      <Button
                        size="small"
                        onClick={() => handlePurchase(pkg)}
                        disabled={purchasing === pkg.id}
                        className={styles.packageButton}
                      >
                        {purchasing === pkg.id ? '处理中...' : '购买'}
                      </Button>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </section>

            {/* 积分明细 */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>积分明细</h2>
              <Card padding="none" className={styles.transactionsCard}>
                {isLoading ? (
                  <div className={styles.loadingState}>加载中...</div>
                ) : transactions.length === 0 ? (
                  <div className={styles.emptyState}>暂无积分记录</div>
                ) : (
                  transactions.map((tx, index) => (
                    <motion.div
                      key={tx.id}
                      className={styles.transactionItem}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <div className={styles.transactionLeft}>
                        <div className={`${styles.transactionIcon} ${styles[tx.type]}`}>
                          {getTransactionIcon(tx.type)}
                        </div>
                        <div className={styles.transactionInfo}>
                          <span className={styles.transactionDesc}>{tx.description}</span>
                          <span className={styles.transactionTime}>{formatDate(tx.createdAt)}</span>
                        </div>
                      </div>
                      <div className={styles.transactionRight}>
                        <span className={`${styles.transactionAmount} ${tx.amount > 0 ? styles.positive : styles.negative}`}>
                          {tx.amount > 0 ? '+' : ''}{tx.amount}
                        </span>
                        <span className={styles.transactionBalance}>余额: {tx.balance}</span>
                      </div>
                    </motion.div>
                  ))
                )}
              </Card>
            </section>
          </motion.div>
        </div>
      </main>
      <Footer />
    </>
  )
}
