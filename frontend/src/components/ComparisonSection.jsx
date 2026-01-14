import React from 'react'
import { Check } from '@phosphor-icons/react'
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
                <p className={styles.subtitle}>
                    很多命理话术，诞生于并不关心女性选择的年代。<br />
                    她赋想做的，不是推翻它们，而是把解读权，交还给女性自己。
                </p>
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
                                <svg 
                                    xmlns="http://www.w3.org/2000/svg" 
                                    viewBox="0 0 256 256" 
                                    className={styles.iconLeft}
                                    width={20}
                                    height={20}
                                >
                                    <g>
                                        <path d="M216,48v55.77C216,174.6,176.6,232,128,232S40,174.6,40,103.79V48a8,8,0,0,1,10.89-7.47C66,46.41,95.11,55.71,128,55.71s62-9.3,77.11-15.16A8,8,0,0,1,216,48Z" opacity="0.2" fill="currentColor"></path>
                                        <path d="M158.66,188.43a8,8,0,0,1-11.09,2.23C141.07,186.34,136,184,128,184s-13.07,2.34-19.57,6.66a8,8,0,0,1-8.86-13.32C108,171.73,116.06,168,128,168s20,3.73,28.43,9.34A8,8,0,0,1,158.66,188.43ZM189.34,114a8,8,0,0,0-11.3.62c-2.68,3-8.85,5.34-14,5.34s-11.36-2.35-14-5.34A8,8,0,0,0,138,125.33c5.71,6.38,16.14,10.67,26,10.67s20.25-4.29,26-10.67A8,8,0,0,0,189.34,114ZM224,48v55.77c0,35.84-9.65,69.65-27.18,95.18-18.16,26.46-42.6,41-68.82,41s-50.66-14.57-68.82-41C41.65,173.44,32,139.63,32,103.79V48A16,16,0,0,1,53.79,33.09C67.84,38.55,96.18,47.71,128,47.71s60.15-9.16,74.21-14.62A16,16,0,0,1,224,48Zm-16,0v0c-15.1,5.89-45.57,15.73-80,15.73S63.1,53.87,48,48v55.79c0,32.64,8.66,63.23,24.37,86.13C87.46,211.9,107.21,224,128,224s40.54-12.1,55.63-34.08C199.34,167,208,136.43,208,103.79Zm-90,77.31A8,8,0,0,0,106,114.66c-2.68,3-8.85,5.34-14,5.34s-11.36-2.35-14-5.34A8,8,0,0,0,66,125.33C71.75,131.71,82.18,136,92,136S112.25,131.71,118,125.33Z" fill="currentColor"></path>
                                    </g>
                                </svg>
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
                                        <div className={styles.iconRightInner}>
                                            <Check size={10} weight="bold" />
                                        </div>
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
