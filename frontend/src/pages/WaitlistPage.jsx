import { useState } from 'react'
import { m } from 'framer-motion'
import { GoogleLogo, Star, StarHalf } from '@phosphor-icons/react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import GradientBackground from '../components/GradientBackground'
import styles from './WaitlistPage.module.css'

export default function WaitlistPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle') // idle, loading, success, error

  const handleSubmit = (e) => {
    e.preventDefault()
    setStatus('loading')

    // Simulate API call
    setTimeout(() => {
      setStatus('success')
      setEmail('')
    }, 1500)
  }

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <GradientBackground />

        <div className={styles.container}>
          <m.div
            className={styles.content}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <img
              src="https://framerusercontent.com/images/T7nGca5vqvah8vLo7yTe6bea9Lc.png"
              alt="Prismo Logo"
              className={styles.logo}
            />

            <div className={styles.textContent}>
              <h1 className={styles.title}>Get early access</h1>
              <p className={styles.subtitle}>
                Be amongst the first to experience Wait and launch a viral waitlist.
                Sign up to be notified when we launch!
              </p>
            </div>

            <form className={styles.form} onSubmit={handleSubmit}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                disabled={status === 'loading'}
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                className={status === 'success' ? styles.success : ''}
              >
                {status === 'loading' ? 'Joining...' :
                  status === 'success' ? 'Joined!' : 'Get Started'}
              </button>
            </form>

            <div className={styles.rating}>
              <div className={styles.stars}>
                <GoogleLogo size={18} weight="bold" />
                <Star size={14} weight="fill" />
                <Star size={14} weight="fill" />
                <Star size={14} weight="fill" />
                <Star size={14} weight="fill" />
                <StarHalf size={14} weight="fill" />
              </div>
              <div className={styles.divider} />
              <span>4.9 rating Based on 300k Users</span>
            </div>
          </m.div>

          <m.div
            className={styles.videoContainer}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className={styles.videoWrapper}>
              <img
                src="https://framerusercontent.com/images/BesZqi2DRImbj4FXrPED12W5zA.png"
                alt="Prismo Dashboard Preview"
                className={styles.previewImage}
              />
            </div>
          </m.div>
        </div>
      </main>
      <Footer />
    </>
  )
}
