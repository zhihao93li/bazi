import React from 'react'
import { Check, ShieldWarning } from '@phosphor-icons/react'
import { m } from 'framer-motion'
import styles from './ComparisonSection.module.css'

export default function ComparisonSection() {
    const oldTerms = [
        '克夫',
        '官杀混杂',
        '命硬',
        '伤官见官',
        '比劫重重',
        '身旺无依'
    ]

    const newTerms = [
        '不依附的意志',
        '多维身份的探索',
        '极具张力的生命能量',
        '不再驯服的独立意志',
        '强烈的自我边界与主体意识',
        '掌控人生版图的主动权'
    ]

    return (
        <section className={styles.section}>
            <m.div
                className={styles.header}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
            >
                <h2 className={styles.title}>拒绝旧偏见</h2>
                <p className={styles.subtitle}>找回"我"的主体性</p>
            </m.div>

            <div className={styles.comparisonWrapper}>
                {/* V/S Badge with curved connectors */}
                <div className={styles.vsContainer}>
                    {/* 左边曲线 - 灰色 */}
                    <svg className={styles.curveLeft} width="38" height="45" viewBox="0 0 38 45" fill="none">
                        <path stroke="url(#leftGradient)" d="M2.531 41.03H27c5.523 0 10-4.477 10-10V15.735"/>
                        <circle cx="4.002" cy="41" r="3.5" fill="#fff" stroke="#D3CBC5"/>
                        <defs>
                            <linearGradient id="leftGradient" x1="37" x2="32.512" y1="-19.995" y2="31.097" gradientUnits="userSpaceOnUse">
                                <stop stopColor="#D3CBC5" stopOpacity="0"/>
                                <stop offset="1" stopColor="#D3CBC5"/>
                            </linearGradient>
                        </defs>
                    </svg>
                    
                    <div className={styles.vsBadge}>V/S</div>
                    
                    {/* 右边曲线 - 渐变色 */}
                    <svg className={styles.curveRight} width="38" height="45" viewBox="0 0 38 45" fill="none">
                        <path stroke="url(#rightGradientA)" d="M35.469 41.03H11c-5.523 0-10-4.477-10-10V15.735"/>
                        <path stroke="url(#rightGradientB)" d="M35.469 41.03H11c-5.523 0-10-4.477-10-10V15.735"/>
                        <circle cx="4" cy="4" r="3.5" fill="#fff" stroke="url(#rightGradientC)" transform="matrix(-1 0 0 1 37.998 37)"/>
                        <defs>
                            <linearGradient id="rightGradientA" x1="1" x2="2.108" y1="10.796" y2="36.256" gradientUnits="userSpaceOnUse">
                                <stop stopColor="#D3CBC5" stopOpacity="0"/>
                                <stop offset="1" stopColor="#D3CBC5"/>
                            </linearGradient>
                            <linearGradient id="rightGradientB" x1="35.469" x2="13.884" y1="41.031" y2="18.593" gradientUnits="userSpaceOnUse">
                                <stop stopColor="#FF2F2F"/>
                                <stop offset=".363" stopColor="#EF7B16"/>
                                <stop offset=".698" stopColor="#8A43E1"/>
                                <stop offset="1" stopColor="#D511FD" stopOpacity="0"/>
                            </linearGradient>
                            <linearGradient id="rightGradientC" x1="4" x2="4" y1="0" y2="8" gradientUnits="userSpaceOnUse">
                                <stop stopColor="#FF2F2F"/>
                                <stop offset=".363" stopColor="#EF7B16"/>
                                <stop offset=".698" stopColor="#8A43E1"/>
                                <stop offset="1" stopColor="#D511FD"/>
                            </linearGradient>
                        </defs>
                    </svg>
                </div>

                {/* Left Card */}
                <m.div
                    className={styles.cardLeft}
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    viewport={{ once: true }}
                >
                    <div className={styles.cardHeader}>
                        <h3 className={styles.cardTitle}>过去，他们说</h3>
                    </div>
                    <div className={styles.list}>
                        {oldTerms.map((term, index) => (
                            <div key={index} className={`${styles.listItem} ${styles.listItemLeft}`}>
                                <ShieldWarning size={20} className={styles.iconLeft} />
                                <span>{term}</span>
                            </div>
                        ))}
                    </div>
                </m.div>

                {/* Right Card */}
                <m.div
                    className={styles.rightCardWrapper}
                    initial={{ opacity: 0, x: 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    viewport={{ once: true }}
                >
                    <div className={styles.gradientBg} />
                    <div className={styles.cardRightContent}>
                        <div className={styles.cardHeader}>
                            <h3 className={styles.cardTitle}>在"她赋"，我们看见</h3>
                        </div>
                        <div className={styles.list}>
                            {newTerms.map((term, index) => (
                                <div key={index} className={`${styles.listItem} ${styles.listItemRight}`}>
                                    <div className={styles.iconRightWrapper}>
                                        <Check size={12} weight="bold" />
                                    </div>
                                    <span>{term}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </m.div>
            </div>
        </section>
    )
}
