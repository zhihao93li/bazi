import { ClockClockwise } from '@phosphor-icons/react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import styles from './PrivacyPage.module.css'

const sections = [
  {
    title: '服务提供方',
    content: '本隐私政策由 CHONGSEN HONGKONG LIMITED（以下简称"我们"或"本公司"）制定并发布。我们致力于保护您的隐私权益，并遵守适用的数据保护法律法规。'
  },
  {
    title: '我们收集的信息',
    content: '为了提供八字命理分析服务，我们可能会收集以下类型的个人信息：',
    list: [
      '账户信息：手机号码、用户名、密码（加密存储）',
      '出生信息：出生日期、出生时间、出生地点（用于八字排盘计算）',
      '测算对象信息：您为他人创建的测算档案信息',
      '交易信息：充值记录、积分使用记录、支付订单信息',
      '设备信息：设备类型、操作系统、浏览器类型等技术数据'
    ]
  },
  {
    title: '信息使用目的',
    content: '我们收集的信息将用于以下目的：',
    list: [
      '提供八字排盘和 AI 命理分析服务',
      '创建和管理您的用户账户',
      '处理积分充值和支付交易',
      '保存您的测算历史，以便随时查阅',
      '改善和优化我们的服务质量',
      '发送重要的服务通知和更新'
    ]
  },
  {
    title: 'AI 服务说明',
    content: '我们的命理分析服务采用先进的人工智能技术。您的出生信息将被发送至 AI 模型进行分析，以生成个性化的命理报告。我们使用安全的 API 接口与 AI 服务提供商通信，您的数据仅用于生成分析结果，不会被 AI 服务商用于其他目的或模型训练。'
  },
  {
    title: '数据安全',
    content: '我们高度重视您的数据安全，采取了多项措施保护您的个人信息：',
    list: [
      '使用 HTTPS 加密传输所有数据',
      '密码采用安全的加密算法存储',
      '数据库采用严格的访问控制',
      '定期进行安全审计和漏洞检测',
      '仅授权人员可访问用户数据'
    ]
  },
  {
    title: '第三方服务',
    content: '为了提供完整的服务，我们可能与以下第三方服务商合作：',
    list: [
      '支付服务商：安全的支付处理服务',
      'OpenAI：AI 命理分析服务',
      '云服务提供商：数据存储和服务器托管'
    ]
  },
  {
    title: '信息共享与披露',
    content: '我们不会出售、交易或以其他方式将您的个人信息转让给第三方，除非：获得您的明确同意、法律法规要求、保护我们的合法权益、或与可信赖的服务提供商合作以运营我们的服务（这些服务商必须同意对您的信息保密）。'
  },
  {
    title: 'Cookie 使用',
    content: '我们的网站使用 Cookie 和类似技术来维持您的登录状态、记住您的偏好设置，并分析网站使用情况。您可以在浏览器设置中管理 Cookie 偏好，但禁用某些 Cookie 可能会影响网站功能。'
  },
  {
    title: '您的权利',
    content: '关于您的个人信息，您享有以下权利：',
    list: [
      '访问和查看您的个人信息',
      '更正不准确的信息',
      '删除您的账户和相关数据',
      '导出您的测算记录',
      '撤回对数据处理的同意'
    ]
  },
  {
    title: '隐私政策更新',
    content: '我们可能会不时更新本隐私政策。任何变更都将在本页面公布，并更新生效日期。对于重大变更，我们将通过网站通知或其他适当方式告知您。'
  },
  {
    title: '联系我们',
    content: '如您对本隐私政策有任何疑问或建议，请通过以下方式联系我们：tafuofficial@gmail.com。本隐私政策由 CHONGSEN HONGKONG LIMITED 负责解释。'
  }
]

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.header}>
            <h1 className={styles.title}>隐私政策</h1>
            <p className={styles.subtitle}>
              本隐私政策说明我们如何收集、使用和保护您的个人信息。
              您的隐私和安全是我们的首要任务。
            </p>
            <div className={styles.lastUpdated}>
              <ClockClockwise size={20} />
              <span>最后更新于 2026 年 1 月 14 日</span>
            </div>
          </div>

          <div className={styles.content}>
            {sections.map((section, index) => (
              <div
                key={index}
                className={styles.section}
              >
                <div className={styles.divider} />
                <h2 className={styles.sectionTitle}>{section.title}</h2>
                <p className={styles.sectionContent}>{section.content}</p>
                {section.list && (
                  <ul className={styles.list}>
                    {section.list.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
