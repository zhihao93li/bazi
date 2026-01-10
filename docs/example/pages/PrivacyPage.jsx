import { ClockClockwise } from '@phosphor-icons/react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import styles from './PrivacyPage.module.css'

const sections = [
  {
    title: 'Information We Collect',
    content: 'We may collect personal information from you when you visit our website, register for an account, or interact with our services. This information may include your name, email address, contact details, and any other information you voluntarily provide to us.'
  },
  {
    title: 'How We Use Your Information',
    content: 'We may use the information we collect from you for various purposes, including:',
    list: [
      'Providing and improving our products and services',
      'Personalizing your experience on our website',
      'Communicating with you about your account and any updates or promotions',
      'Analyzing website traffic and user behavior to enhance our offerings'
    ]
  },
  {
    title: 'Data Security',
    content: 'We take data security seriously and employ industry-standard measures to protect your personal information from unauthorized access, disclosure, alteration, or destruction. However, no method of transmission over the internet or electronic storage is 100% secure, and we cannot guarantee absolute security.'
  },
  {
    title: 'Third-Party Disclosure',
    content: 'We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as required by law or as necessary to provide our services. We may share your information with trusted third-party service providers who assist us in operating our website, conducting our business, or servicing you, provided that they agree to keep your information confidential.'
  },
  {
    title: 'Cookies',
    content: 'Our website may use cookies to enhance your browsing experience and collect information about how you interact with our site. You can adjust your browser settings to refuse cookies or alert you when cookies are being sent, but some features of the site may not function properly without cookies.'
  },
  {
    title: 'Changes to this Privacy Policy',
    content: 'We reserve the right to update or change this Privacy Policy at any time. Any changes will be posted on this page, and the effective date will be updated accordingly. We encourage you to review this Privacy Policy periodically for any updates.'
  },
  {
    title: 'Contact Us',
    content: 'If you have any questions or concerns about our Privacy Policy or the handling of your personal information, please contact us at hello@prismo.com'
  }
]

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.header}>
            <h1 className={styles.title}>Our Privacy Policy</h1>
            <p className={styles.subtitle}>
              Our Privacy Policy outlines how we collect, use, and protect your personal information. 
              Your privacy and security are our priorities.
            </p>
            <div className={styles.lastUpdated}>
              <ClockClockwise size={20} />
              <span>Last Updated on August, 24, 2024</span>
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
