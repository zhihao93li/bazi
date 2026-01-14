import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { m } from 'framer-motion'
import { ArrowLeft } from '@phosphor-icons/react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/common'
import { FormInput, ButtonGroup, Card } from '../components/common'
import Button from '../components/Button'
import GradientBackground from '../components/GradientBackground'
import styles from './LoginPage.module.css'

export default function LoginPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { login, register, isLoggedIn } = useAuth()
  const toast = useToast()

  const [mode, setMode] = useState('login') // login | register
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState({})

  // 如果已登录，跳转到首页或回调地址
  if (isLoggedIn) {
    const callbackUrl = searchParams.get('callbackUrl') || '/'
    navigate(callbackUrl, { replace: true })
    return null
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // 清除对应错误
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleModeChange = (e) => {
    setMode(e.target.value)
    setErrors({})
  }

  const validate = () => {
    const newErrors = {}

    if (!formData.username.trim()) {
      newErrors.username = '请输入用户名'
    } else if (formData.username.length < 3) {
      newErrors.username = '用户名至少3位'
    }

    if (!formData.password) {
      newErrors.password = '请输入密码'
    } else if (formData.password.length < 6) {
      newErrors.password = '密码至少6位'
    }

    if (mode === 'register') {
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = '请确认密码'
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = '两次密码不一致'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validate()) return

    setIsLoading(true)
    try {
      if (mode === 'login') {
        await login(formData.username, formData.password)
        toast.success('登录成功！')
      } else {
        await register(formData.username, formData.password)
        toast.success('注册成功！已赠送 100 积分')
      }

      // 跳转
      const callbackUrl = searchParams.get('callbackUrl') || '/bazi/input'
      navigate(callbackUrl, { replace: true })
    } catch (error) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const modeOptions = [
    { value: 'login', label: '登录' },
    { value: 'register', label: '注册' },
  ]

  return (
    <main className={styles.main}>
      {/* Background - Customized for Login (Warm/Welcoming) */}
      <GradientBackground
        gridCount={0}
        glowColors={['rgba(255, 47, 47, 0.2)', 'rgba(239, 123, 22, 0.2)']}
        noiseOpacity={0.1}
        animated
        expanded
      />

      {/* 内容 */}
      <div className={styles.container}>
        <m.div
          className={styles.content}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Logo */}
          <Link to="/" className={styles.logo}>
            <img
              src="https://framerusercontent.com/images/E65CrTfgroEJwcxOOIN1vzXb5w.svg"
              alt="Prismo"
              className={styles.logoImage}
            />
          </Link>

          {/* 表单卡片 */}
          <Card variant="gradient" padding="large" className={styles.formCard}>
            {/* 模式切换 */}
            <ButtonGroup
              options={modeOptions}
              value={mode}
              onChange={handleModeChange}
              name="mode"
              variant="light"
              fullWidth
            />

            {/* 表单 */}
            <form onSubmit={handleSubmit} className={styles.form}>
              <FormInput
                label="用户名"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="请输入用户名"
                error={errors.username}
                maxLength={20}
                required
              />

              <FormInput
                label="密码"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="请输入密码"
                error={errors.password}
                maxLength={32}
                required
              />

              {mode === 'register' && (
                <FormInput
                  label="确认密码"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="请再次输入密码"
                  error={errors.confirmPassword}
                  maxLength={32}
                  required
                />
              )}

              <Button
                type="submit"
                size="large"
                disabled={isLoading}
                className={styles.submitButton}
              >
                {isLoading ? '处理中...' : (mode === 'login' ? '登录' : '注册得100积分')}
              </Button>
            </form>
          </Card>

          {/* 返回首页 */}
          <Link to="/" className={styles.backLink}>
            <ArrowLeft size={18} />
            返回首页
          </Link>
        </m.div>
      </div>
    </main>
  )
}
