import { ClockClockwise } from '@phosphor-icons/react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import styles from './PrivacyPage.module.css'

const sections = [
    {
        title: '服务概述',
        content: '欢迎使用八字命理 AI 分析服务（以下简称"本服务"）。本服务由 CHONGSEN HONGKONG LIMITED（以下简称"本公司"或"我们"）提供，旨在利用传统八字命理学与现代人工智能技术，为用户提供个性化的命理分析报告。使用本服务即表示您同意遵守本服务条款。'
    },
    {
        title: '服务内容',
        content: '本服务包括但不限于：',
        list: [
            '八字排盘：根据您提供的出生日期、时间和地点，计算生成八字命盘',
            'AI 命理分析：利用人工智能技术，基于八字命盘提供命理解读',
            '测算对象管理：创建和管理多个测算对象的档案',
            '历史记录：保存和查阅您的测算历史',
            '积分系统：购买和使用积分以获取 AI 分析服务'
        ]
    },
    {
        title: '账户注册与安全',
        content: '使用本服务的部分功能需要注册账户。在注册时，您需要提供真实、准确的信息。您有责任：',
        list: [
            '妥善保管您的账户登录凭证',
            '对账户下发生的所有活动负责',
            '发现账户被盗用或异常时立即通知我们',
            '不与他人共享您的账户信息'
        ]
    },
    {
        title: '积分与付费服务',
        content: '使用 AI 命理分析服务需要消耗积分。关于积分系统，请注意：',
        list: [
            '新用户注册时将获得一定数量的赠送积分',
            '积分可通过充值获取，支持多种支付方式',
            '已充值的积分不支持退款',
            '积分仅用于本平台服务，不可转让或兑换现金',
            '我们保留调整积分价格和消耗规则的权利'
        ]
    },
    {
        title: '服务声明与免责',
        content: '请您理解并同意以下重要声明：',
        list: [
            '本服务提供的命理分析仅供参考和娱乐目的，不构成任何形式的专业建议',
            '八字命理学是中国传统文化的一部分，其科学性和准确性存在争议',
            'AI 分析结果基于算法生成，可能存在偏差或不准确',
            '您不应将分析结果作为重大人生决策的唯一依据',
            '对于因使用本服务做出的任何决定，我们不承担责任'
        ]
    },
    {
        title: '用户行为规范',
        content: '在使用本服务时，您同意不进行以下行为：',
        list: [
            '注册虚假信息或冒用他人身份',
            '试图破解、攻击或干扰本服务的正常运行',
            '利用本服务进行任何违法活动',
            '批量爬取或复制本服务的内容',
            '传播或分享任何可能侵犯他人权益的内容'
        ]
    },
    {
        title: '知识产权',
        content: '本服务的所有内容，包括但不限于文字、图像、界面设计、软件代码、AI 模型等，均受知识产权法保护。未经我们书面授权，您不得复制、修改、分发或以其他方式使用这些内容。'
    },
    {
        title: '服务变更与终止',
        content: '我们保留随时修改、暂停或终止部分或全部服务的权利，恕不另行通知。对于服务的变更或终止，我们不对您或任何第三方承担责任。如发生以下情况，我们可能终止您的账户：',
        list: [
            '违反本服务条款',
            '存在欺诈或恶意行为',
            '账户长期未使用',
            '其他我们认为有必要的情况'
        ]
    },
    {
        title: '争议解决',
        content: '本服务条款的解释和执行均适用香港特别行政区法律。如发生争议，双方应首先友好协商解决；协商不成的，任何一方均可向香港特别行政区具有管辖权的法院提起诉讼。'
    },
    {
        title: '条款更新',
        content: '我们可能会不时更新本服务条款。更新后的条款将在本页面公布，您继续使用本服务即表示接受更新后的条款。对于重大变更，我们将以适当方式通知您。'
    },
    {
        title: '联系方式',
        content: '如您对本服务条款有任何疑问，请通过以下方式联系我们：tafuofficial@gmail.com。本服务条款由 CHONGSEN HONGKONG LIMITED 负责解释。'
    }
]

export default function TermsPage() {
    return (
        <>
            <Navbar />
            <main className={styles.main}>
                <div className={styles.container}>
                    <div className={styles.header}>
                        <h1 className={styles.title}>服务条款</h1>
                        <p className={styles.subtitle}>
                            请仔细阅读以下服务条款。使用我们的服务即表示您同意受本条款的约束。
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
