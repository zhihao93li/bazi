import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { m } from 'framer-motion'
import { CheckCircle, XCircle, Coins, ArrowRight, ArrowLeft, Warning } from '@phosphor-icons/react'
import { useAuth } from '../context/AuthContext'
import { Card, LoadingSpinner } from '../components/common'
import Button from '../components/Button'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import GradientBackground from '../components/GradientBackground'
import { api } from '../services/api'
import styles from './PaymentResultPage.module.css'

/**
 * 码支付同步回调结果页面
 * 路由: /payment/result
 * 
 * URL 参数:
 * - order_no: 商户订单号
 * - trade_status: 支付状态 (TRADE_SUCCESS | TRADE_CLOSED 等)
 * 
 * 需求: 5.3, 5.4
 */
export default function PaymentResultPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, updateUser, isLoggedIn, isLoading: authLoading } = useAuth()
  const [orderInfo, setOrderInfo] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // 从 URL 参数获取订单号和支付状态
  const orderNo = searchParams.get('order_no')
  const tradeStatus = searchParams.get('trade_status')
  
  // 判断支付是否成功
  const isSuccess = tradeStatus === 'TRADE_SUCCESS'
  
  // 从 sessionStorage 获取支付前的返回地址
  const returnUrl = sessionStorage.getItem('paymentReturnUrl')

  // 获取订单信息并刷新用户余额
  useEffect(() => {
    if (!orderNo) {
      setError('缺少订单号参数')
      setIsLoading(false)
      return
    }

    const fetchData = async () => {
      try {
        // 获取订单状态
        const orderResult = await api.get(`/payment/status/${orderNo}`)
        
        if (orderResult?.success && orderResult.data) {
          setOrderInfo(orderResult.data)
        } else {
          setError('无法获取订单信息')
        }

        // 如果用户已登录且支付成功，刷新积分余额
        if (isLoggedIn && isSuccess) {
          try {
            const pointsResult = await api.get('/points')
            if (pointsResult?.balance !== undefined) {
              updateUser({ balance: pointsResult.balance })
            }
          } catch (err) {
            console.error('Failed to refresh balance:', err)
          }
        }
      } catch (err) {
        console.error('Failed to fetch order info:', err)
        setError('无法获取订单信息')
      } finally {
        setIsLoading(false)
      }
    }

    // 延迟一点再获取，给异步通知时间处理
    const timer = setTimeout(fetchData, 1000)
    return () => clearTimeout(timer)
  }, [orderNo, isLoggedIn, isSuccess, updateUser])

  // 重试支付
  const handleRetry = () => {
    // 清除返回地址
    sessionStorage.removeItem('paymentReturnUrl')
    navigate('/points')
  }

  if (authLoading) {
    return (
      <div className={styles.loadingPage}>
        <LoadingSpinner size="large" />
      </div>
    )
  }

  // 根据支付状态选择不同的渐变颜色
  const glowColors = isSuccess
    ? ['rgba(39, 179, 44, 0.2)', 'rgba(74, 222, 128, 0.15)']
    : ['rgba(239, 68, 68, 0.2)', 'rgba(248, 113, 113, 0.15)']

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <GradientBackground
          gridCount={0}
          glowColors={glowColors}
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
              ) : error && !orderInfo ? (
                // 错误状态
                <ErrorContent 
                  error={error} 
                  onRetry={handleRetry}
                  returnUrl={returnUrl}
                />
              ) : isSuccess ? (
                // 支付成功
                <SuccessContent
                  orderInfo={orderInfo}
                  user={user}
                  returnUrl={returnUrl}
                  navigate={navigate}
                />
              ) : (
                // 支付失败
                <FailureContent
                  orderInfo={orderInfo}
                  tradeStatus={tradeStatus}
                  onRetry={handleRetry}
                  returnUrl={returnUrl}
                />
              )}
            </Card>
          </m.div>
        </div>
      </main>
      <Footer />
    </>
  )
}

/**
 * 支付成功内容组件
 */
function SuccessContent({ orderInfo, user, returnUrl, navigate }) {
  return (
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
          <>
            <Button onClick={() => {
              sessionStorage.removeItem('paymentReturnUrl')
              navigate(returnUrl)
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
  )
}

/**
 * 支付失败内容组件
 */
function FailureContent({ orderInfo, tradeStatus, onRetry, returnUrl }) {
  // 根据状态获取失败原因
  const getFailureMessage = () => {
    switch (tradeStatus) {
      case 'TRADE_CLOSED':
        return '订单已关闭'
      case 'WAIT_BUYER_PAY':
        return '等待支付'
      default:
        return '支付未完成'
    }
  }

  return (
    <>
      <m.div
        className={styles.iconWrapper}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', delay: 0.2 }}
      >
        <XCircle size={80} weight="fill" className={styles.failIcon} />
      </m.div>

      <h1 className={styles.title}>支付失败</h1>
      <p className={styles.subtitle}>{getFailureMessage()}</p>

      {orderInfo && (
        <div className={styles.orderDetails}>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>订单号</span>
            <span className={styles.detailValue}>{orderInfo.orderNo}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>状态</span>
            <span className={styles.detailValueMuted}>{getFailureMessage()}</span>
          </div>
          {orderInfo.amount && (
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>订单金额</span>
              <span className={styles.detailValue}>
                ¥{(orderInfo.amount / 100).toFixed(2)}
              </span>
            </div>
          )}
        </div>
      )}

      <div className={styles.actions}>
        <Button onClick={onRetry}>
          <ArrowLeft size={18} weight="bold" />
          重新选择套餐
        </Button>
        {returnUrl ? (
          <Link 
            to={returnUrl} 
            className={styles.secondaryLink}
            onClick={() => sessionStorage.removeItem('paymentReturnUrl')}
          >
            返回原页面
          </Link>
        ) : (
          <Link to="/" className={styles.secondaryLink}>
            返回首页
          </Link>
        )}
      </div>
    </>
  )
}

/**
 * 错误内容组件
 */
function ErrorContent({ error, onRetry, returnUrl }) {
  return (
    <>
      <m.div
        className={styles.iconWrapper}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', delay: 0.2 }}
      >
        <Warning size={80} weight="fill" className={styles.warningIcon} />
      </m.div>

      <h1 className={styles.title}>出错了</h1>
      <p className={styles.subtitle}>{error}</p>

      <div className={styles.actions}>
        <Button onClick={onRetry}>
          <ArrowLeft size={18} weight="bold" />
          返回积分中心
        </Button>
        {returnUrl ? (
          <Link 
            to={returnUrl} 
            className={styles.secondaryLink}
            onClick={() => sessionStorage.removeItem('paymentReturnUrl')}
          >
            返回原页面
          </Link>
        ) : (
          <Link to="/" className={styles.secondaryLink}>
            返回首页
          </Link>
        )}
      </div>
    </>
  )
}
