import { useState } from 'react';
import type { UpiData } from '../App';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';

interface AmountFormProps {
  upiData: UpiData;
  onSubmit: (amount: number) => void;
  onBack: () => void;
}

export function AmountForm({ upiData, onSubmit, onBack }: AmountFormProps) {
  const [amount, setAmount] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (!isNaN(val) && val > 0) {
      onSubmit(val);
    }
  };

  return (
    <div className="flex flex-col items-center gap-8 text-center max-w-md mx-auto w-full">
      <div className="bg-canvas-parchment/60 rounded-2xl p-4 sm:p-6 w-full border border-hairline flex flex-col items-center gap-2">
        <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
          <CheckCircle2 size={22} />
        </div>
        <div>
          <span className="text-xs uppercase tracking-wider font-semibold text-ink-muted-48">Payee Address</span>
          <h2 className="text-lg sm:text-xl font-semibold text-ink tracking-tight mt-0.5">
            {upiData.pn || upiData.pa}
          </h2>
          {upiData.pn && (
            <p className="text-sm text-ink-muted-48 font-mono mt-0.5">
              {upiData.pa}
            </p>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label htmlFor="amount" className="text-sm font-medium text-ink-muted-48">
            Enter Total Amount to Split
          </label>
          <div className="relative">
            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-ink text-2xl font-semibold">₹</span>
            <input
              id="amount"
              type="number"
              min="1"
              step="1"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-canvas text-ink text-2xl font-semibold rounded-2xl py-4 pl-12 pr-6 border border-hairline focus:outline-none focus:ring-2 focus:ring-primary shadow-inner"
              placeholder="0.00"
              autoFocus
            />
          </div>
          <p className="text-xs text-ink-muted-48 text-left px-1">
            * Amounts above ₹1,999 will automatically be split into multiple ₹1,999 QR codes.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 flex items-center justify-center gap-2 bg-surface-pearl text-ink hover:bg-divider-soft text-base font-medium rounded-2xl py-3.5 px-6 border border-hairline transition-all active:scale-95"
          >
            <ArrowLeft size={18} />
            Back
          </button>
          <button
            type="submit"
            className="flex-1 bg-primary text-on-primary hover:bg-primary-focus text-base font-semibold rounded-2xl py-3.5 px-6 shadow-md transition-all active:scale-95"
          >
            Generate Split QRs
          </button>
        </div>
      </form>
    </div>
  );
}
