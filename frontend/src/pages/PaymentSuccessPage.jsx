import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { m } from 'framer-motion'
import { CheckCircle, Coins, ArrowRight } from '@phosphor-icons/react'
import { useAuth } from '../context/AuthContext'
import { Card, LoadingSpinner } from '../components/common'
import Button from '../components/Button'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import GradientBackground from '../components/GradientBackground'
import { api } from '../services/api'
import styles from './PaymentResultPage.module.css'

export default function PaymentSuccessPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, updateUser, isLoggedIn, isLoading: authLoading } = useAuth()
  const [orderInfo, setOrderInfo] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const orderNo = searchParams.get('order_no')
  
  // 从 sessionStorage 获取支付前的返回地址
  const returnUrl = sessionStorage.getItem('paymentReturnUrl')

  // 获取订单信息并刷新用户余额
  useEffect(() => {
    if (!isLoggedIn || authLoading) return

    const fetchData = async () => {
      try {
        // 并行获取订单状态和最新余额
        const [orderResult, pointsResult] = await Promise.all([
          orderNo ? api.get(`/payment/status/${orderNo}`) : Promise.resolve(null),
          api.get('/points'),
        ])

        if (orderResult?.success && orderResult.data) {
          setOrderInfo(orderResult.data)
        }

        // 更新用户余额
        if (pointsResult?.balance !== undefined) {
          updateUser({ balance: pointsResult.balance })
        }
      } catch (err) {
        console.error('Failed to fetch order info:', err)
        setError('无法获取订单信息')
      } finally {
        setIsLoading(false)
      }
    }

    // 延迟一点再获取，给 webhook 时间处理
    const timer = setTimeout(fetchData, 1000)
    return () => clearTimeout(timer)
  }, [orderNo, isLoggedIn, authLoading, updateUser])

  if (authLoading) {
    return (
      <div className={styles.loadingPage}>
        <LoadingSpinner size="large" />
      </div>
    )
  }

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <GradientBackground
          gridCount={0}
          glowColors={['rgba(39, 179, 44, 0.2)', 'rgba(74, 222, 128, 0.15)']}
          noiseOpacity={0.08}
          animated
          expanded
        />

        <div className={styles.container}>
          <m.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Card padding="large" className={styles.resultCard}>
              {isLoading ? (
                <div className={styles.loadingState}>
                  <LoadingSpinner size="large" />
                  <p>正在确认支付结果...</p>
                </div>
              ) : (
                <>
                  <m.div
                    className={styles.iconWrapper}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.2 }}
                  >
                    <CheckCircle size={80} weight="fill" className={styles.successIcon} />
                  </m.div>

                  <h1 className={styles.title}>支付成功</h1>
                  <p className={styles.subtitle}>您的积分已充值到账</p>

                  {orderInfo && (
                    <div className={styles.orderDetails}>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>订单号</span>
                        <span className={styles.detailValue}>{orderInfo.orderNo}</span>
                      </div>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>充值积分</span>
                        <span className={styles.detailValueHighlight}>
                          +{orderInfo.points?.toLocaleString()}
                        </span>
                      </div>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>支付金额</span>
                        <span className={styles.detailValue}>
                          ¥{(orderInfo.amount / 100).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className={styles.balanceInfo}>
                    <Coins size={24} weight="fill" />
                    <span>当前余额: {user?.balance?.toLocaleString() || 0} 积分</span>
                  </div>

                  <div className={styles.actions}>
                    {returnUrl ? (
                      // 如果有返回地址，优先显示返回按钮
                      <>
                        <Button onClick={() => {
                          // 跳转后清除 sessionStorage
                          sessionStorage.removeItem('paymentReturnUrl');
                          navigate(returnUrl);
                        }}>
                          返回继续操作
                          <ArrowRight size={18} weight="bold" />
                        </Button>
                        <Link 
                          to="/bazi" 
                          className={styles.secondaryLink}
                          onClick={() => sessionStorage.removeItem('paymentReturnUrl')}
                        >
                          返回命盘
                        </Link>
                      </>
                    ) : (
                      <>
                        <Button onClick={() => navigate('/bazi')}>
                          开始命理解读
                          <ArrowRight size={18} weight="bold" />
                        </Button>
                        <Link to="/points" className={styles.secondaryLink}>
                          返回积分中心
                        </Link>
                      </>
                    )}
                  </div>
                </>
              )}
            </Card>
          </m.div>
        </div>
      </main>
      <Footer />
    </>
  )
}
