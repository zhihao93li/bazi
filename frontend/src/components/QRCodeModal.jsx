import { useState, useEffect, useRef, useCallback } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import Modal from './common/Modal'
import { api, isAbortError } from '../services/api'
import styles from './QRCodeModal.module.css'

/**
 * 二维码支付弹窗组件
 * @param {Object} props
 * @param {boolean} props.visible - 是否显示弹窗
 * @param {string} props.qrCodeUrl - 二维码URL
 * @param {string} props.orderNo - 订单号
 * @param {number} props.amount - 金额（元）
 * @param {() => void} props.onClose - 关闭回调
 * @param {() => void} props.onSuccess - 支付成功回调
 * @param {() => void} props.onTimeout - 支付超时回调
 */
export default function QRCodeModal({
  visible,
  qrCodeUrl,
  orderNo,
  amount,
  onClose,
  onSuccess,
  onTimeout,
}) {
  const [timeLeft, setTimeLeft] = useState(300) // 5分钟 = 300秒
  const [isExpired, setIsExpired] = useState(false)
  const pollingRef = useRef(null)
  const timerRef = useRef(null)
  const abortControllerRef = useRef(null)

  // 格式化倒计时显示
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // 停止轮询 - 必须在 pollOrderStatus 之前定义，因为 pollOrderStatus 依赖它
  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
  }, [])

  // 轮询订单状态
  const pollOrderStatus = useCallback(async () => {
    if (!orderNo || !visible) return

    // 创建新的 AbortController
    abortControllerRef.current = new AbortController()

    try {
      const response = await api.get(`/payment/status/${orderNo}`, {
        signal: abortControllerRef.current.signal,
      })

      // API 返回 { success: true, data: { status: 'paid', ... } }
      if (response.data?.status === 'paid') {
        stopPolling()
        onSuccess?.()
      }
    } catch (error) {
      // 忽略取消请求的错误
      if (!isAbortError(error)) {
        console.error('轮询订单状态失败:', error)
      }
    }
  }, [orderNo, visible, onSuccess, stopPolling])

  // 开始轮询和倒计时
  useEffect(() => {
    // 只有 visible 且有 orderNo 时才开始轮询
    if (!visible || !orderNo) {
      // 不可见时立即停止轮询
      stopPolling()
      return
    }

    if (isExpired) {
      return
    }

    // 重置状态
    setTimeLeft(300)
    setIsExpired(false)

    // 立即轮询一次
    pollOrderStatus()

    // 每3秒轮询一次
    pollingRef.current = setInterval(pollOrderStatus, 3000)

    // 倒计时
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsExpired(true)
          stopPolling()
          onTimeout?.()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      stopPolling()
    }
  }, [visible, orderNo, isExpired, pollOrderStatus, stopPolling, onTimeout])

  // 处理关闭
  const handleClose = () => {
    stopPolling()
    onClose?.()
  }

  // 处理重试
  const handleRetry = () => {
    setIsExpired(false)
    setTimeLeft(300)
    onClose?.()
  }

  return (
    <Modal
      isOpen={visible}
      onClose={handleClose}
      title="扫码支付"
      size="small"
    >
      <div className={styles.container}>
        {isExpired ? (
          <div className={styles.expiredContainer}>
            <div className={styles.expiredIcon}>⏰</div>
            <p className={styles.expiredText}>支付已过期</p>
            <p className={styles.expiredHint}>请重新发起支付</p>
            <button className={styles.retryButton} onClick={handleRetry}>
              重新支付
            </button>
          </div>
        ) : (
          <>
            <div className={styles.qrCodeWrapper}>
              {qrCodeUrl && (
                <QRCodeSVG
                  value={qrCodeUrl}
                  size={200}
                  level="H"
                  includeMargin
                />
              )}
            </div>

            <div className={styles.info}>
              <div className={styles.amount}>
                <span className={styles.amountLabel}>支付金额</span>
                <span className={styles.amountValue}>¥{amount?.toFixed(2)}</span>
              </div>

              <div className={styles.timer}>
                <span className={styles.timerLabel}>剩余时间</span>
                <span className={styles.timerValue}>{formatTime(timeLeft)}</span>
              </div>
            </div>

            <p className={styles.hint}>请使用支付宝扫描二维码完成支付</p>
          </>
        )}
      </div>
    </Modal>
  )
}
