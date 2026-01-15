import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import ComparisonSection from '../components/ComparisonSection'
import Features from '../components/Features'
import FAQ from '../components/FAQ'
import Footer from '../components/Footer'

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <ComparisonSection />
        <Features />
        {/* <FAQ /> */}
      </main>
      <Footer />
    </>
  )
}
