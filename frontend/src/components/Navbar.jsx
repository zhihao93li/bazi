import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { List, X, User, Coins } from '@phosphor-icons/react'
import { m, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import styles from './Navbar.module.css'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const location = useLocation()
  const { isLoggedIn, user } = useAuth()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll()

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = [
    { label: '首页', path: '/' },
    { label: '人生解读', path: '/bazi' },
  ]

  const authLinks = []

  const displayLinks = isLoggedIn ? [...navLinks, ...authLinks] : navLinks

  return (
    <nav className={`${styles.navbar} ${isScrolled ? styles.scrolled : ''}`}>
      <div className={styles.container}>
        <Link to="/" className={styles.logo}>
          <img
            src="/favicon.svg"
            alt="她赋"
            className={styles.logoIcon}
          />
          <span className={styles.logoText}>她赋</span>
        </Link>

        {/* Desktop Navigation */}
        <div className={styles.desktopNav}>
          <ul className={styles.navLinks}>
            {displayLinks.map((link) => (
              <li key={link.path}>
                <Link
                  to={link.path}
                  className={`${styles.navLink} ${location.pathname === link.path ? styles.active : ''}`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          {isLoggedIn ? (
            <div className={styles.userActions}>
              <Link to="/points" className={styles.pointsBadge}>
                <Coins weight="fill" size={16} />
                <span>{user?.balance?.toLocaleString() || 0}</span>
              </Link>
              <Link to="/profile" className={styles.profileBtn}>
                <User weight="bold" size={18} />
                <span>{user?.username || '我的'}</span>
              </Link>
            </div>
          ) : (
            <Link to="/login" className={styles.ctaButton}>
              登录 / 注册
            </Link>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className={styles.mobileActions}>
          {/* 移动端积分余额显示 */}
          {isLoggedIn && (
            <Link to="/points" className={styles.mobileHeaderPoints}>
              <Coins weight="fill" size={16} />
              <span>{user?.balance?.toLocaleString() || 0}</span>
            </Link>
          )}
          <button
            className={styles.menuButton}
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={24} /> : <List size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isOpen && (
          <m.div
            className={styles.mobileNav}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <ul className={styles.mobileLinks}>
              {displayLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className={styles.mobileLink}
                    onClick={() => setIsOpen(false)}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              {isLoggedIn && (
                <li>
                  <Link
                    to="/points"
                    className={styles.mobilePointsBadge}
                    onClick={() => setIsOpen(false)}
                  >
                    <Coins weight="fill" size={18} />
                    <span>积分余额: {user?.balance?.toLocaleString() || 0}</span>
                  </Link>
                </li>
              )}
              <li>
                {isLoggedIn ? (
                  <Link
                    to="/profile"
                    className={styles.mobileCta}
                    onClick={() => setIsOpen(false)}
                  >
                    用户中心
                  </Link>
                ) : (
                  <Link
                    to="/login"
                    className={styles.mobileCta}
                    onClick={() => setIsOpen(false)}
                  >
                    登录 / 注册
                  </Link>
                )}
              </li>
            </ul>
          </m.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
