import Navbar from '@/components/Navbar'
import Stepper from '@/components/wizard/Stepper'

export default function WizardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen mesh-gradient noise-bg">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Stepper />
        <main className="animate-fade-in-up">{children}</main>
      </div>
    </div>
  )
}
