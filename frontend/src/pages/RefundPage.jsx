import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import styles from './PrivacyPage.module.css'

export default function RefundPage() {
  return (
    <>
      <Navbar />
      <main className={styles.page}>
        <div className={styles.container}>
          <h1 className={styles.title}>退款政策</h1>
          <p className={styles.lastUpdated}>最后更新：2026年1月</p>

          <section className={styles.section}>
            <h2>服务提供方</h2>
            <p>
              本退款政策由 CHONGSEN HONGKONG LIMITED（以下简称"本公司"或"我们"）制定并执行。
            </p>
          </section>

          <section className={styles.section}>
            <h2>1. 退款申请</h2>
            <p>
              如您对我们的服务不满意，或有其他合理原因需要申请退款，请发送邮件至 
              <a href="mailto:tafuofficial@gmail.com"> tafuofficial@gmail.com </a>
              进行申请。
            </p>
          </section>

          <section className={styles.section}>
            <h2>2. 退款条件</h2>
            <p>以下情况可以申请退款：</p>
            <ul>
              <li>购买后 7 天内未使用任何付费服务</li>
              <li>因系统故障导致服务无法正常使用</li>
              <li>重复扣款或其他支付异常</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>3. 退款流程</h2>
            <p>退款申请流程如下：</p>
            <ol>
              <li>发送邮件至 tafuofficial@gmail.com，标题注明"退款申请"</li>
              <li>邮件中请提供：注册邮箱、订单号、退款原因</li>
              <li>我们将在 3-5 个工作日内审核您的申请</li>
              <li>审核通过后，退款将在 7-14 个工作日内原路返回</li>
            </ol>
          </section>

          <section className={styles.section}>
            <h2>4. 不予退款的情况</h2>
            <p>以下情况不予退款：</p>
            <ul>
              <li>已使用的积分或已生成的命理解读报告</li>
              <li>购买超过 30 天的订单</li>
              <li>违反服务条款被封禁的账户</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>5. 联系我们</h2>
            <p>
              如有任何关于退款的问题，请联系：
              <br />
              公司：CHONGSEN HONGKONG LIMITED
              <br />
              邮箱：<a href="mailto:tafuofficial@gmail.com">tafuofficial@gmail.com</a>
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  )
}
