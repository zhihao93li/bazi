import { Link } from 'react-router-dom';
import { m } from 'framer-motion';
import { ArrowLeft } from '@phosphor-icons/react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import GradientBackground from '../components/GradientBackground';
import { Card } from '../components/common';
import styles from './CustomerServicePage.module.css';

export default function CustomerServicePage() {
  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <GradientBackground
          gridCount={0}
          glowColors={['rgba(94, 106, 210, 0.2)', 'rgba(138, 67, 225, 0.2)']}
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
            <Link to="/profile" className={styles.backButton}>
              <ArrowLeft size={20} />
              <span>返回</span>
            </Link>

            {/* 页面标题 */}
            <div className={styles.header}>
              <h1 className={styles.title}>联系客服</h1>
              <p className={styles.subtitle}>有问题请添加客服微信</p>
            </div>

            {/* 二维码卡片 */}
            <Card padding="large" className={styles.qrcodeCard}>
              <img
                src="/images/customer-service-qrcode.png"
                alt="客服微信二维码"
                className={styles.qrcode}
              />
              <p className={styles.wechatId}>微信号：tafu2026</p>
            </Card>
          </m.div>
        </div>
      </main>
      <Footer />
    </>
  );
}
