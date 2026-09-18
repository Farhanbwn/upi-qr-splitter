import { useEffect, useState } from 'react';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import type { UpiData } from '../App';
import { Download, RefreshCw, Check } from 'lucide-react';

interface QRGalleryProps {
  upiData: UpiData;
  totalAmount: number;
  onReset: () => void;
}

interface SplitInfo {
  amount: number;
  uri: string;
}

export function QRGallery({ upiData, totalAmount, onReset }: QRGalleryProps) {
  const [splits, setSplits] = useState<SplitInfo[]>([]);
  const [downloaded, setDownloaded] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const chunkLimit = 1999;
    let remaining = totalAmount;
    const newSplits: SplitInfo[] = [];

    while (remaining > 0) {
      const chunk = remaining > chunkLimit ? chunkLimit : remaining;
      const uri = `upi://pay?pa=${upiData.pa}&pn=${encodeURIComponent(upiData.pn || '')}&am=${chunk}&cu=INR`;
      newSplits.push({ amount: chunk, uri });
      remaining -= chunk;
    }

    setSplits(newSplits);
  }, [upiData, totalAmount]);

  const handleDownload = (index: number) => {
    const canvas = document.getElementById(`qr-canvas-${index}`) as HTMLCanvasElement;
    if (canvas) {
      const url = canvas.toDataURL("image/png");
      const a = document.createElement('a');
      a.href = url;
      a.download = `upi-split-${index + 1}-of-${splits.length}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setDownloaded((prev) => ({ ...prev, [index]: true }));
      setTimeout(() => {
        setDownloaded((prev) => ({ ...prev, [index]: false }));
      }, 2500);
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full items-center">
      <div className="text-center space-y-1">
        <span className="text-xs uppercase tracking-wider font-semibold text-primary">
          Payee: {upiData.pn || upiData.pa}
        </span>
        <h2 className="text-2xl sm:text-3xl font-bold text-ink tracking-tight">
          Total Amount: ₹{totalAmount.toLocaleString('en-IN')}
        </h2>
        <p className="text-sm text-ink-muted-48">
          Split into {splits.length} payment {splits.length === 1 ? 'QR' : 'QRs'} (Max ₹1,999 per QR)
        </p>
      </div>

      {/* Grid view: 1 col on mobile, 2 or 3 cols on laptop/desktop screens */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 w-full">
        {splits.map((split, i) => (
          <div 
            key={i} 
            className="bg-canvas-parchment/40 rounded-3xl p-6 shadow-sm flex flex-col items-center gap-4 border border-hairline hover:shadow-md transition-all"
          >
            <div className="flex justify-between items-center w-full">
              <span className="text-xs font-semibold text-ink-muted-48 bg-white px-3 py-1 rounded-full border border-hairline">
                Part {i + 1} of {splits.length}
              </span>
              <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Ready
              </span>
            </div>
            
            {/* Hidden canvas for PNG export */}
            <QRCodeCanvas 
              id={`qr-canvas-${i}`} 
              value={split.uri} 
              size={220} 
              level="H" 
              className="hidden" 
            />

            {/* Display SVG */}
            <div className="bg-white p-3 rounded-2xl shadow-sm border border-hairline my-2">
              <QRCodeSVG 
                value={split.uri} 
                size={180} 
                level="H"
              />
            </div>
            
            <div className="text-center">
              <p className="text-xs text-ink-muted-48">Amount to pay</p>
              <p className="text-2xl font-bold text-ink tracking-tight">
                ₹{split.amount.toLocaleString('en-IN')}
              </p>
            </div>

            <button
              onClick={() => handleDownload(i)}
              className={`w-full flex items-center justify-center gap-2 text-sm font-medium rounded-xl py-2.5 px-4 transition-all active:scale-95 ${
                downloaded[i] 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-surface-pearl text-ink hover:bg-divider-soft border border-hairline'
              }`}
            >
              {downloaded[i] ? <Check size={16} /> : <Download size={16} />}
              {downloaded[i] ? 'Saved to Downloads' : 'Save QR Code'}
            </button>
          </div>
        ))}
      </div>

      <div className="flex justify-center mt-4 w-full max-w-xs">
        <button
          onClick={onReset}
          className="w-full flex items-center justify-center gap-2 bg-transparent text-primary hover:bg-primary/5 text-base font-semibold rounded-2xl py-3 px-6 transition-all border border-primary active:scale-95"
        >
          <RefreshCw size={18} />
          Scan Another QR
        </button>
      </div>
    </div>
  );
}
