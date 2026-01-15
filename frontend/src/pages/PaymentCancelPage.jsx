import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { m } from 'framer-motion'
import { XCircle, ArrowLeft } from '@phosphor-icons/react'
import { Card } from '../components/common'
import Button from '../components/Button'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import GradientBackground from '../components/GradientBackground'
import styles from './PaymentResultPage.module.css'

export default function PaymentCancelPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const orderNo = searchParams.get('order_no')
  
  // 从 sessionStorage 获取支付前的返回地址
  const returnUrl = sessionStorage.getItem('paymentReturnUrl')

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <GradientBackground
          gridCount={0}
          glowColors={['rgba(107, 114, 128, 0.2)', 'rgba(156, 163, 175, 0.15)']}
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
              <m.div
                className={styles.iconWrapper}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
              >
                <XCircle size={80} weight="fill" className={styles.cancelIcon} />
              </m.div>

              <h1 className={styles.title}>支付已取消</h1>
              <p className={styles.subtitle}>您可以随时重新选择套餐进行充值</p>

              {orderNo && (
                <div className={styles.orderDetails}>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>订单号</span>
                    <span className={styles.detailValue}>{orderNo}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>状态</span>
                    <span className={styles.detailValueMuted}>已取消</span>
                  </div>
                </div>
              )}

              <div className={styles.actions}>
                <Button onClick={() => navigate('/points')}>
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
            </Card>
          </m.div>
        </div>
      </main>
      <Footer />
    </>
  )
}
