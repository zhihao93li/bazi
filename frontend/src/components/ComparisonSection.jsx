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
                <h2 className={styles.title}>
                    拒绝旧偏见，<br className="sm:hidden" />找回“我”的主体性
                </h2>
            </m.div>

            <div className={styles.comparisonWrapper}>
                {/* V/S Badge Positioned Absolutely in CSS but placed here structurally */}
                <div className={styles.vsContainer}>
                    <div className={styles.vsBadge}>V/S</div>
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
                            <h3 className={styles.cardTitle}>在“她赋”，我们看见</h3>
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
