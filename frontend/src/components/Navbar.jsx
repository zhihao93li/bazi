import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { List, X, User } from '@phosphor-icons/react'
import { motion, AnimatePresence } from 'framer-motion'
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
    { label: '八字排盘', path: '/bazi/input' },
    { label: '历史记录', path: '/history' },
  ]

  const authLinks = [
    { label: '积分充值', path: '/points' },
  ]

  const displayLinks = isLoggedIn ? [...navLinks, ...authLinks] : navLinks

  return (
    <nav className={`${styles.navbar} ${isScrolled ? styles.scrolled : ''}`}>
      <div className={styles.container}>
        <Link to="/" className={styles.logo}>
          <img 
            src="https://framerusercontent.com/images/E65CrTfgroEJwcxOOIN1vzXb5w.svg" 
            alt="Prismo" 
            className={styles.logoImage}
          />
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
            <Link to="/profile" className={styles.profileBtn}>
              <User weight="bold" size={18} />
              <span>{user?.username || '我的'}</span>
            </Link>
          ) : (
            <Link to="/login" className={styles.ctaButton}>
              登录 / 注册
            </Link>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button 
          className={styles.menuButton}
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          {isOpen ? <X size={24} /> : <List size={24} />}
        </button>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
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
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
