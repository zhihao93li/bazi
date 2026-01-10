import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { List, X } from '@phosphor-icons/react'
import { motion, AnimatePresence } from 'framer-motion'
import styles from './Navbar.module.css'

const navLinks = [
  { label: 'Home', path: '/' },
  { label: 'Features', path: '/#features' },
  { label: 'Pricing', path: '/#pricing' },
  { label: 'About', path: '/#about' },
  { label: 'Contact', path: '/#contact' },
]

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()

  return (
    <nav className={styles.navbar}>
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
            {navLinks.map((link) => (
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
          <Link to="/waitlist" className={styles.ctaButton}>
            Join Waitlist
          </Link>
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
              {navLinks.map((link) => (
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
                <Link 
                  to="/waitlist" 
                  className={styles.mobileCta}
                  onClick={() => setIsOpen(false)}
                >
                  Join Waitlist
                </Link>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
