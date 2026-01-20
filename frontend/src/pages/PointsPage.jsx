import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { m } from 'framer-motion'
import { Check, ArrowUp, ArrowDown, Gift } from '@phosphor-icons/react'
import { useAuth } from '../context/AuthContext'
import { useToast, Card, LoadingSpinner, LoadingOverlay } from '../components/common'
import Button from '../components/Button'
import Tag from '../components/Tag'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import GradientBackground from '../components/GradientBackground'
import QRCodeModal from '../components/QRCodeModal'
import { api } from '../services/api'
import styles from './PointsPage.module.css'

export default function PointsPage() {
  const navigate = useNavigate()
  const { user, isLoggedIn, updateUser, isLoading: authLoading } = useAuth()
  const toast = useToast()
  const [balance, setBalance] = useState(0)
  const [transactions, setTransactions] = useState([])
  const [packages, setPackages] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [purchasing, setPurchasing] = useState(null)

  // 二维码弹窗状态
  const [qrModalVisible, setQrModalVisible] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [currentOrderNo, setCurrentOrderNo] = useState('')
  const [currentAmount, setCurrentAmount] = useState(0)

  // 检查登录状态
  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      navigate('/login?callbackUrl=/points', { replace: true })
    }
  }, [authLoading, isLoggedIn, navigate])

  // 检查是否有余额不足的提示消息
  useEffect(() => {
    const message = sessionStorage.getItem('insufficientPointsMessage')
    if (message) {
      toast.error(message)
      sessionStorage.removeItem('insufficientPointsMessage')
    }
  }, [toast])

  // 获取数据
  useEffect(() => {
    if (isLoggedIn) {
      Promise.all([
        api.get('/points'),
        api.get('/points/packages')
      ]).then(([pointsRes, packagesRes]) => {
        setBalance(pointsRes.balance);
        setTransactions(pointsRes.transactions);
        setPackages(packagesRes.packages.map(pkg => ({
          ...pkg,
          price: pkg.price / 100,
        })));
        setIsLoading(false);
      }).catch(err => {
        console.error(err);
        setIsLoading(false);
      });
    }
  }, [isLoggedIn, user])

  const handlePurchase = (pkg) => {
    // 跳转到支付方式选择页面
    navigate(`/payment/method?packageId=${pkg.id}`)
  }

  // 刷新积分余额
  const refreshBalance = useCallback(async () => {
    try {
      const pointsRes = await api.get('/points')
      setBalance(pointsRes.balance)
      setTransactions(pointsRes.transactions)
    } catch (err) {
      console.error('刷新积分失败:', err)
    }
  }, [])

  // 支付成功回调
  const handlePaymentSuccess = useCallback(() => {
    setQrModalVisible(false)
    // 跳转到支付成功页面
    navigate(`/payment/success?order_no=${currentOrderNo}`)
  }, [navigate, currentOrderNo])

  // 支付超时回调
  const handlePaymentTimeout = useCallback(() => {
    // 超时处理由 QRCodeModal 内部处理
  }, [])

  // 关闭二维码弹窗
  const handleQrModalClose = useCallback(() => {
    setQrModalVisible(false)
    setQrCodeUrl('')
    setCurrentOrderNo('')
    setCurrentAmount(0)
  }, [])

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
      case 'gift':
        return <Gift size={18} weight="bold" />
      default:
        return null
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
        {/* Background - Gold/Orange for Wealth */}
        <GradientBackground
          gridCount={0}
          glowColors={['rgba(239, 123, 22, 0.3)', 'rgba(255, 47, 47, 0.2)']}
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
              <h1 className={styles.title}>积分中心</h1>
              <p className={styles.subtitle}>管理您的积分余额和充值</p>
            </div>

            {/* 余额卡片 */}
            <Card variant="gradient" padding="large" className={styles.balanceCard}>
              <span className={styles.balanceLabel}>当前积分</span>
              <span className={styles.balanceValue}>
                {isLoading ? <LoadingSpinner size="large" /> : balance.toLocaleString()}
              </span>
              <span className={styles.balanceHint}>积分可用于报告解锁服务</span>
            </Card>

            {/* 充值套餐 */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>充值套餐</h2>
              <div className={styles.packagesGrid}>
                {packages.map((pkg, index) => {
                  // 根据索引选择不同的图标
                  const iconIndex = (index % 3) + 1;

                  // 计算折扣信息
                  let discount = null;
                  let originalPrice = null;
                  if (pkg.points === 500) {
                    discount = 95; // 95折
                    originalPrice = pkg.price / 0.95;
                  } else if (pkg.points === 1000) {
                    discount = 88; // 88折
                    originalPrice = pkg.price / 0.88;
                  }

                  // 根据积分数量设置描述
                  let description = '解锁更多命理解读内容';
                  if (pkg.points === 200) {
                    description = '支持解锁 1-2 份报告';
                  } else if (pkg.points === 500) {
                    description = '支持解锁 3-4 份报告';
                  } else if (pkg.points === 1000) {
                    description = '一键解锁所有报告';
                  }

                  return (
                    <m.div
                      key={pkg.id}
                      className={`${styles.packageCard} ${pkg.popular ? styles.popular : ''}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      {pkg.popular && (
                        <span className={styles.popularBadge}>推荐</span>
                      )}
                      {discount && (
                        <span className={styles.discountBadge}>{discount}折</span>
                      )}
                      <div className={styles.packageIcon}>
                        <img
                          src={`/icons/package-icon-${iconIndex}.svg`}
                          alt=""
                          width={48}
                          height={48}
                        />
                      </div>
                      <div className={styles.packageInfo}>
                        <h3 className={styles.packageTitle}>{pkg.points} 积分</h3>
                        <p className={styles.packageDesc}>{description}</p>
                      </div>
                      <div className={styles.packagePriceRow}>
                        {discount && (
                          <span className={styles.originalPrice}>¥{originalPrice.toFixed(2)}</span>
                        )}
                        <span className={styles.packagePrice}>¥{pkg.price.toFixed(2)}</span>
                      </div>
                      <button
                        className={styles.packageButton}
                        onClick={() => handlePurchase(pkg)}
                        disabled={purchasing === pkg.id}
                      >
                        {purchasing === pkg.id ? <LoadingSpinner size="small" color="white" /> : '立即购买'}
                      </button>
                    </m.div>
                  );
                })}
              </div>
            </section>

            {/* 积分明细 */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>积分明细</h2>
              <Card padding="none" className={styles.transactionsCard}>
                {isLoading ? (
                  <div className={styles.loadingState}>
                    <LoadingSpinner />
                  </div>
                ) : transactions.length === 0 ? (
                  <div className={styles.emptyState}>暂无积分记录</div>
                ) : (
                  transactions.map((tx, index) => (
                    <m.div
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
                    </m.div>
                  ))
                )}
              </Card>
            </section>
          </m.div>
        </div>
      </main>
      <Footer />

      {/* 二维码支付弹窗 */}
      <QRCodeModal
        visible={qrModalVisible}
        qrCodeUrl={qrCodeUrl}
        orderNo={currentOrderNo}
        amount={currentAmount}
        onClose={handleQrModalClose}
        onSuccess={handlePaymentSuccess}
        onTimeout={handlePaymentTimeout}
      />
    </>
  )
}
