import { useState } from 'react';
import { Scanner } from './components/Scanner.tsx';
import { AmountForm } from './components/AmountForm.tsx';
import { QRGallery } from './components/QRGallery.tsx';
import { QrCode, Calculator, Share2 } from 'lucide-react';

export type UpiData = {
  pa: string; // payee address (upi id)
  pn?: string; // payee name
};

export default function App() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [upiData, setUpiData] = useState<UpiData | null>(null);
  const [totalAmount, setTotalAmount] = useState<number | null>(null);

  const handleScanSuccess = (data: UpiData) => {
    setUpiData(data);
    setStep(2);
  };

  const handleAmountSubmit = (amount: number) => {
    setTotalAmount(amount);
    setStep(3);
  };

  const handleReset = () => {
    setStep(1);
    setUpiData(null);
    setTotalAmount(null);
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col font-text text-ink">
      {/* Global Apple-style Header */}
      <nav className="h-12 bg-surface-black flex items-center justify-between px-6 sm:px-12 w-full shadow-md z-10">
        <div className="flex items-center gap-2">
          <QrCode className="text-primary-on-dark w-5 h-5" />
          <span className="text-on-dark text-sm font-semibold tracking-tight">MDR Killer</span>
        </div>
        <span className="text-ink-muted-80 text-xs hidden sm:inline-block">Max ₹1,999 per QR</span>
      </nav>

      <main className="flex-1 w-full max-w-2xl lg:max-w-4xl mx-auto px-4 sm:px-8 py-8 sm:py-12 flex flex-col gap-8 items-center">
        
        {/* Responsive Hero Heading */}
        <header className="text-center space-y-3">
          <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight text-ink leading-tight">
            Split Payment into QRs
          </h1>
          <p className="text-base sm:text-xl font-normal text-ink-muted-48 max-w-lg mx-auto">
            Scan a UPI QR, enter the total amount, and instantly generate ready-to-pay QR codes for splitting payments to bypass MDR charges.
          </p>
        </header>

        {/* Wizard Progress Bar */}
        <div className="flex justify-between items-center w-full max-w-md sm:max-w-lg px-4 sm:px-8">
          <StepIcon stepNum={1} active={step >= 1} current={step === 1} label="Scan QR" icon={<QrCode size={18} />} />
          <div className={`h-0.5 flex-1 mx-2 sm:mx-4 transition-colors duration-300 ${step >= 2 ? 'bg-primary' : 'bg-divider-soft'}`} />
          <StepIcon stepNum={2} active={step >= 2} current={step === 2} label="Set Amount" icon={<Calculator size={18} />} />
          <div className={`h-0.5 flex-1 mx-2 sm:mx-4 transition-colors duration-300 ${step >= 3 ? 'bg-primary' : 'bg-divider-soft'}`} />
          <StepIcon stepNum={3} active={step >= 3} current={step === 3} label="Split QRs" icon={<Share2 size={18} />} />
        </div>

        {/* Dynamic Card Container for Laptop & Mobile */}
        <div className="w-full bg-white rounded-[24px] sm:rounded-[32px] p-6 sm:p-10 shadow-xl border border-divider-soft/70 transition-all duration-300">
          {step === 1 && <Scanner onScanSuccess={handleScanSuccess} />}
          {step === 2 && <AmountForm upiData={upiData!} onSubmit={handleAmountSubmit} onBack={() => setStep(1)} />}
          {step === 3 && <QRGallery upiData={upiData!} totalAmount={totalAmount!} onReset={handleReset} />}
        </div>
      </main>

      <footer className="py-8 px-6 text-ink-muted-48 text-xs text-center border-t border-divider-soft mt-auto bg-white/50 flex flex-col items-center gap-3">
        <p className="font-medium text-ink text-sm">
          Developed by{' '}
          <a
            href="https://farhanchowdhury.me"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-primary hover:underline transition-all"
          >
            Farhan
          </a>
        </p>
        
        {/* Social Links */}
        <div className="flex items-center gap-4 text-ink-muted-48">
          <a
            href="https://github.com/Farhanbwn"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            className="p-2 rounded-full hover:bg-surface-pearl hover:text-ink transition-all border border-transparent hover:border-hairline"
          >
            <GithubIcon />
          </a>
          <a
            href="https://www.linkedin.com/in/farhan-chowdhury-101b25258/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
            className="p-2 rounded-full hover:bg-surface-pearl hover:text-ink transition-all border border-transparent hover:border-hairline"
          >
            <LinkedinIcon />
          </a>
          <a
            href="https://www.instagram.com/nishan.bwn/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="p-2 rounded-full hover:bg-surface-pearl hover:text-ink transition-all border border-transparent hover:border-hairline"
          >
            <InstagramIcon />
          </a>
        </div>

        <p className="text-[11px] text-ink-muted-48">
          UPI Payment Splitter • Split payments to bypass MDR charges easily
        </p>
      </footer>
    </div>
  );
}

function StepIcon({ active, current, label, icon }: { stepNum?: number; active: boolean; current: boolean; label: string; icon: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all duration-300 ${
        active 
          ? 'bg-primary text-on-primary shadow-md scale-105' 
          : 'bg-surface-pearl text-ink-muted-48 border border-divider-soft'
      } ${current ? 'ring-4 ring-primary/20' : ''}`}>
        {icon}
      </div>
      <span className={`text-xs font-medium transition-colors ${current ? 'text-primary font-semibold' : 'text-ink-muted-48'}`}>
        {label}
      </span>
    </div>
  );
}

function GithubIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

function LinkedinIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

function InstagramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}
