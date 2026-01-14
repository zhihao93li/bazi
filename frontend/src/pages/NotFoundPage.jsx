import { m } from 'framer-motion'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Button from '../components/Button'
import styles from './NotFoundPage.module.css'

export default function NotFoundPage() {
  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <div className={styles.background}>
          <div className={styles.leftAbstract} />
          <div className={styles.rightAbstract} />
          <div className={styles.noise} />
        </div>

        <m.div
          className={styles.container}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className={styles.errorCode}>404</h1>
          <div className={styles.content}>
            <h2 className={styles.title}>Oops! This path leads to the past.</h2>
            <p className={styles.description}>
              We regret to inform you that the page you're searching for seems to be beyond our grasp.
              We apologize for any inconvenience this may cause.
            </p>
          </div>
          <Button to="/" size="large">
            Back to Home Page
          </Button>
        </m.div>
      </main>
      <Footer />
    </>
  )
}
