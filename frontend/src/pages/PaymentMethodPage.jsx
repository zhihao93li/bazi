import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { m } from 'framer-motion'
import { CreditCard, QrCode, ArrowLeft, Globe, MapPin } from '@phosphor-icons/react'
import { useAuth } from '../context/AuthContext'
import { useToast, Card, LoadingSpinner, LoadingOverlay } from '../components/common'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import GradientBackground from '../components/GradientBackground'
import QRCodeModal from '../components/QRCodeModal'
import { api } from '../services/api'
import styles from './PaymentMethodPage.module.css'

export default function PaymentMethodPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { isLoggedIn, isLoading: authLoading } = useAuth()
  const toast = useToast()

  const packageId = searchParams.get('packageId')
  const [pkg, setPkg] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [processing, setProcessing] = useState(null) // 'mazfu' | 'stripe' | null

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

  // 检查 packageId
  useEffect(() => {
    if (!packageId) {
      toast.error('请先选择充值套餐')
      navigate('/points', { replace: true })
    }
  }, [packageId, navigate, toast])

  // 获取套餐信息
  useEffect(() => {
    if (isLoggedIn && packageId) {
      api.get('/points/packages')
        .then(res => {
          const found = res.packages.find(p => p.id === packageId)
          if (found) {
            setPkg({
              ...found,
              price: found.price / 100, // 转换为元
            })
          } else {
            toast.error('套餐不存在')
            navigate('/points', { replace: true })
          }
          setIsLoading(false)
        })
        .catch(err => {
          console.error(err)
          toast.error('获取套餐信息失败')
          setIsLoading(false)
        })
    }
  }, [isLoggedIn, packageId, navigate, toast])

  // 码支付（中国大陆）
  const handleMazfuPayment = async () => {
    if (!pkg) return
    setProcessing('mazfu')

    try {
      const result = await api.post('/payment/create-mazfu', {
        packageId: pkg.id,
      })

      if (result.success && result.qrcode) {
        setQrCodeUrl(result.qrcode)
        setCurrentOrderNo(result.orderNo)
        setCurrentAmount(pkg.price)
        setQrModalVisible(true)
        setProcessing(null)
      } else {
        toast.error(result.message || '创建支付失败')
        setProcessing(null)
      }
    } catch (e) {
      console.error('Mazfu payment error:', e)
      toast.error(e.message || '支付失败，请稍后重试')
      setProcessing(null)
    }
  }

  // Stripe 支付（海外/港澳台）
  const handleStripePayment = async () => {
    if (!pkg) return
    setProcessing('stripe')

    try {
      const result = await api.post('/payment/create-checkout', {
        packageId: pkg.id,
      })

      if (result.success && result.checkoutUrl) {
        // 跳转到 Stripe Checkout 页面
        window.location.href = result.checkoutUrl
      } else {
        toast.error(result.message || '创建支付失败')
        setProcessing(null)
      }
    } catch (e) {
      console.error('Stripe payment error:', e)
      toast.error(e.message || '支付失败，请稍后重试')
      setProcessing(null)
    }
  }

  // 支付成功回调
  const handlePaymentSuccess = () => {
    setQrModalVisible(false)
    navigate(`/payment/success?order_no=${currentOrderNo}`)
  }

  // 关闭二维码弹窗
  const handleQrModalClose = () => {
    setQrModalVisible(false)
    setQrCodeUrl('')
    setCurrentOrderNo('')
    setCurrentAmount(0)
  }

  if (authLoading || isLoading) {
    return <LoadingOverlay fixed />
  }

  if (!isLoggedIn || !pkg) {
    return null
  }

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        {/* Background */}
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
            {/* 返回按钮 */}
            <button
              className={styles.backButton}
              onClick={() => navigate('/points')}
            >
              <ArrowLeft size={20} weight="bold" />
              <span>返回积分中心</span>
            </button>

            {/* 页面标题 */}
            <div className={styles.header}>
              <h1 className={styles.title}>选择支付方式</h1>
              <p className={styles.subtitle}>请根据您所在的地区选择合适的支付方式</p>
            </div>

            {/* 订单信息 */}
            <Card variant="gradient" padding="medium" className={styles.orderCard}>
              <div className={styles.orderInfo}>
                <span className={styles.orderLabel}>充值套餐</span>
                <span className={styles.orderValue}>{pkg.points} 积分</span>
              </div>
              <div className={styles.orderDivider} />
              <div className={styles.orderInfo}>
                <span className={styles.orderLabel}>支付金额</span>
                <span className={styles.orderPrice}>¥{pkg.price.toFixed(2)}</span>
              </div>
            </Card>

            {/* 支付方式选择 */}
            <section className={styles.section}>
              <div className={styles.methodsGrid}>
                {/* 码支付 - 中国大陆 */}
                <m.div
                  className={styles.methodCard}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className={styles.methodHeader}>
                    <div className={styles.methodIconWrapper}>
                      <QrCode size={32} weight="duotone" />
                    </div>
                    <div className={styles.methodRegion}>
                      <MapPin size={14} weight="fill" />
                      <span>中国大陆</span>
                    </div>
                  </div>
                  <div className={styles.methodContent}>
                    <h3 className={styles.methodTitle}>支付宝扫码支付</h3>
                    <p className={styles.methodDesc}>
                      使用支付宝扫描二维码完成支付，适用于中国大陆用户
                    </p>
                    <div className={styles.methodFeatures}>
                      <span className={styles.featureTag}>快速到账</span>
                      <span className={styles.featureTag}>安全便捷</span>
                    </div>
                  </div>
                  <button
                    className={styles.methodButton}
                    onClick={handleMazfuPayment}
                    disabled={processing !== null}
                  >
                    {processing === 'mazfu' ? (
                      <LoadingSpinner size="small" color="white" />
                    ) : (
                      '选择此方式'
                    )}
                  </button>
                </m.div>

                {/* Stripe - 海外/港澳台 */}
                <m.div
                  className={styles.methodCard}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className={styles.methodHeader}>
                    <div className={`${styles.methodIconWrapper} ${styles.stripe}`}>
                      <CreditCard size={32} weight="duotone" />
                    </div>
                    <div className={`${styles.methodRegion} ${styles.overseas}`}>
                      <Globe size={14} weight="fill" />
                      <span>港澳台及海外</span>
                    </div>
                  </div>
                  <div className={styles.methodContent}>
                    <h3 className={styles.methodTitle}>Stripe 国际支付</h3>
                    <p className={styles.methodDesc}>
                      支持信用卡、Apple Pay、Google Pay 等多种支付方式
                    </p>
                    <div className={styles.methodFeatures}>
                      <span className={styles.featureTag}>Visa</span>
                      <span className={styles.featureTag}>Mastercard</span>
                      <span className={styles.featureTag}>Apple Pay</span>
                      <span className={styles.featureTag}>Google Pay</span>
                    </div>
                  </div>
                  <button
                    className={`${styles.methodButton} ${styles.stripeButton}`}
                    onClick={handleStripePayment}
                    disabled={processing !== null}
                  >
                    {processing === 'stripe' ? (
                      <LoadingSpinner size="small" color="white" />
                    ) : (
                      '选择此方式'
                    )}
                  </button>
                </m.div>
              </div>
            </section>

            {/* 提示信息 */}
            <div className={styles.notice}>
              <p>如有任何支付问题，请联系客服获取帮助</p>
            </div>
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
        onTimeout={() => {}}
      />
    </>
  )
}
