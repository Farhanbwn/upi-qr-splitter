import { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import jsQR from 'jsqr';
import type { UpiData } from '../App';
import { Keyboard, ArrowRight, Upload, Image as ImageIcon } from 'lucide-react';

interface ScannerProps {
  onScanSuccess: (data: UpiData) => void;
}

/**
 * Safely calls jsQR handling ESM default export variations and image bounds.
 */
function safeJsQr(imageData: ImageData): { data: string } | null {
  if (!imageData || !imageData.width || !imageData.height || imageData.width < 10 || imageData.height < 10) {
    return null;
  }
  try {
    const qrFn = typeof jsQR === 'function' ? jsQR : (jsQR as any)?.default;
    if (typeof qrFn !== 'function') return null;

    const result = qrFn(imageData.data, imageData.width, imageData.height);
    if (result && result.data) {
      return result;
    }
  } catch (err) {
    console.warn('jsQR scan attempt warning:', err);
  }
  return null;
}

/**
 * Helper to decode QR codes from image files using jsQR + canvas scaling.
 * Handles high-resolution mobile camera screenshots safely.
 */
function decodeImageWithJsQr(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      if (!img.width || !img.height || img.width < 10 || img.height < 10) {
        return resolve(null);
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(null);

      // Attempt 1: Original resolution
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      try {
        let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        let code = safeJsQr(imageData);
        if (code && code.data) return resolve(code.data);

        // Attempt 2: Scaled down (max 800px) - greatly improves QR detection on high-res photos
        const maxDim = 800;
        if (img.width > maxDim || img.height > maxDim) {
          const scale = Math.min(maxDim / img.width, maxDim / img.height);
          canvas.width = Math.max(10, Math.floor(img.width * scale));
          canvas.height = Math.max(10, Math.floor(img.height * scale));
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          code = safeJsQr(imageData);
          if (code && code.data) return resolve(code.data);
        }
      } catch (e) {
        console.warn('Canvas image data extraction error:', e);
      }

      resolve(null);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(null);
    };

    img.src = objectUrl;
  });
}

/**
 * Robustly parses UPI QR strings across all payment apps (GPay, PhonePe, Paytm, BharatPe)
 * or plain VPA addresses like name@upi.
 */
function parseUpiString(text: string): UpiData | null {
  const trimmed = text.trim();
  
  // 1. Check for standard upi:// parameters or custom app links
  if (trimmed.toLowerCase().includes('upi://')) {
    try {
      const queryString = trimmed.includes('?') ? trimmed.split('?')[1] : trimmed;
      const params = new URLSearchParams(queryString);
      
      const pa = params.get('pa') || params.get('PA') || params.get('Pa');
      const pn = params.get('pn') || params.get('PN') || params.get('Pn') || undefined;
      
      if (pa && pa.includes('@')) {
        return { pa: decodeURIComponent(pa), pn: pn ? decodeURIComponent(pn) : undefined };
      }
    } catch (e) {
      console.error('UPI URL parse error:', e);
    }
  }

  // 2. Regex fallback for pa= and pn= query params anywhere in string
  const paMatch = trimmed.match(/pa=([a-zA-Z0-9.\-_%]+@[a-zA-Z0-9]+)/i);
  if (paMatch) {
    const pa = decodeURIComponent(paMatch[1]);
    const pnMatch = trimmed.match(/pn=([^&]+)/i);
    const pn = pnMatch ? decodeURIComponent(pnMatch[1]) : undefined;
    return { pa, pn };
  }

  // 3. Plain VPA email address pattern (e.g. mobile@upi, merchant@okaxis)
  const vpaRegex = /([a-zA-Z0-9.\-_]+@[a-zA-Z0-9]+)/i;
  const match = trimmed.match(vpaRegex);
  if (match) {
    return { pa: match[1] };
  }

  return null;
}

export function Scanner({ onScanSuccess }: ScannerProps) {
  const [error, setError] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [showManualInput, setShowManualInput] = useState<boolean>(false);
  const [manualPa, setManualPa] = useState<string>('');
  const [manualPn, setManualPn] = useState<string>('');
  
  const qrScannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const html5QrCode = new Html5Qrcode("reader");
    qrScannerRef.current = html5QrCode;
    let animFrameId: number | null = null;
    let isStopped = false;

    // Initialize native hardware-accelerated BarcodeDetector if supported by OS/Browser (Android Chrome, iOS Safari, Edge)
    let nativeDetector: any = null;
    if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
      try {
        nativeDetector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
      } catch (e) {
        console.warn('Native BarcodeDetector fallback to jsQR canvas scanner');
      }
    }
    
    html5QrCode.start(
      { facingMode: "environment" },
      {
        fps: 30, // 30 FPS for high-speed continuous frame processing
        qrbox: (viewfinderWidth, viewfinderHeight) => {
          const minDim = Math.min(viewfinderWidth, viewfinderHeight);
          const boxSize = Math.max(200, Math.floor(minDim * 0.75));
          return { width: boxSize, height: boxSize };
        }
      },
      (decodedText) => {
        if (!isStopped) {
          isStopped = true;
          if (animFrameId) cancelAnimationFrame(animFrameId);
          handleDecodedText(decodedText, html5QrCode);
        }
      },
      (_err) => {
        // framing logs ignored
      }
    ).then(() => {
      setIsScanning(true);

      const videoEl = document.querySelector("#reader video") as HTMLVideoElement;
      if (videoEl) {
        const offscreenCanvas = document.createElement('canvas');
        const offscreenCtx = offscreenCanvas.getContext('2d', { willReadFrequently: true });
        let lastScanTime = 0;

        const scanFrameLoop = async (time: number) => {
          if (isStopped) return;

          // Process frame every 35ms (~30 FPS)
          if (time - lastScanTime >= 35) {
            lastScanTime = time;

            if (videoEl && !videoEl.paused && !videoEl.ended && videoEl.readyState >= 2) {
              // 1. Try Native Hardware GPU BarcodeDetector first (Sub-10ms performance)
              if (nativeDetector) {
                try {
                  const barcodes = await nativeDetector.detect(videoEl);
                  if (barcodes && barcodes.length > 0 && barcodes[0].rawValue && !isStopped) {
                    isStopped = true;
                    if (animFrameId) cancelAnimationFrame(animFrameId);
                    handleDecodedText(barcodes[0].rawValue, html5QrCode);
                    return;
                  }
                } catch (_e) {
                  // Fall back to jsQR
                }
              }

              // 2. High-speed jsQR canvas scan fallback
              if (offscreenCtx && !isStopped) {
                const w = videoEl.videoWidth || 640;
                const h = videoEl.videoHeight || 480;
                offscreenCanvas.width = w;
                offscreenCanvas.height = h;
                offscreenCtx.drawImage(videoEl, 0, 0, w, h);

                try {
                  const imageData = offscreenCtx.getImageData(0, 0, w, h);
                  const code = safeJsQr(imageData);
                  if (code && code.data && !isStopped) {
                    isStopped = true;
                    if (animFrameId) cancelAnimationFrame(animFrameId);
                    handleDecodedText(code.data, html5QrCode);
                    return;
                  }
                } catch (_e) {
                  // Ignore frame read warnings
                }
              }
            }
          }

          if (!isStopped) {
            animFrameId = requestAnimationFrame(scanFrameLoop);
          }
        };

        animFrameId = requestAnimationFrame(scanFrameLoop);
      }
    }).catch((err) => {
      console.error(err);
      setError('Failed to access camera. Please allow camera permissions, upload a QR image, or enter UPI ID manually.');
    });

    return () => {
      isStopped = true;
      if (animFrameId) cancelAnimationFrame(animFrameId);
      try {
        html5QrCode.stop().then(() => {
          html5QrCode.clear();
        }).catch(() => {
          html5QrCode.clear();
        });
      } catch (e) {
        html5QrCode.clear();
      }
    };
  }, [onScanSuccess]);

  const handleDecodedText = (decodedText: string, scannerInstance?: Html5Qrcode) => {
    const parsed = parseUpiString(decodedText);
    if (parsed) {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate([80, 50, 80]);
        } catch (_e) {
          // Safely catch Chrome user-activation policy intervention
        }
      }

      const activeScanner = scannerInstance || qrScannerRef.current;
      if (activeScanner) {
        activeScanner.stop().then(() => {
          activeScanner.clear();
          onScanSuccess(parsed);
        }).catch(() => {
          onScanSuccess(parsed);
        });
      } else {
        onScanSuccess(parsed);
      }
    } else {
      setError(`QR Code scanned, but no valid UPI address was found inside: "${decodedText.slice(0, 40)}..."`);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    try {
      // 1. Try high-performance jsQR algorithm first (multi-res canvas pass)
      const jsQrDecoded = await decodeImageWithJsQr(file);
      if (jsQrDecoded) {
        handleDecodedText(jsQrDecoded);
        return;
      }

      // 2. Secondary fallback to html5-qrcode file scanner
      const fileScanner = new Html5Qrcode("file-scanner-temp");
      const decodedText = await fileScanner.scanFile(file, false);
      fileScanner.clear();
      handleDecodedText(decodedText);
    } catch (err: any) {
      console.error('File scan error:', err);
      setError('Could not detect a QR code in the uploaded image. Please try another image or enter UPI ID manually.');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualPa.trim() && manualPa.includes('@')) {
      onScanSuccess({ pa: manualPa.trim(), pn: manualPn.trim() || undefined });
    } else {
      setError('Please enter a valid UPI ID (e.g. mobile@upi or name@bank).');
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-xl mx-auto">
      {/* Hidden container for file scanner instance to avoid camera collision */}
      <div id="file-scanner-temp" className="hidden" />

      <div className="text-center">
        <h2 className="text-xl sm:text-2xl font-semibold text-ink tracking-tight">
          Scan or Upload Receiver's QR
        </h2>
        <p className="text-sm sm:text-base text-ink-muted-48 mt-1">
          Scan with your camera or select a QR image screenshot from your gallery
        </p>
      </div>
      
      {/* Video Container designed for Mobile & Desktop Laptop webcams */}
      <div className="w-full max-w-md aspect-[4/3] rounded-[24px] overflow-hidden shadow-2xl bg-black relative border border-hairline flex items-center justify-center">
        <div id="reader" className="w-full h-full" />
        
        {/* Animated Viewfinder Overlay */}
        {isScanning && (
          <div className="aria-hidden:true pointer-events-none absolute inset-0 flex items-center justify-center p-6">
            <div className="w-48 h-48 sm:w-56 sm:h-56 relative border-2 border-white/30 rounded-2xl overflow-hidden shadow-inner">
              {/* Corner indicators */}
              <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-lg" />
              
              {/* Laser line animation */}
              <div className="w-full h-0.5 bg-primary/80 shadow-[0_0_12px_#0066cc] animate-pulse" />
            </div>
          </div>
        )}
      </div>

      {/* Hidden File Input for QR Image Upload */}
      <input 
        type="file" 
        ref={fileInputRef} 
        accept="image/*" 
        onChange={handleFileUpload} 
        className="hidden" 
      />

      {/* Upload Button */}
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="w-full max-w-md flex items-center justify-center gap-2 bg-surface-pearl text-ink hover:bg-divider-soft border border-hairline text-sm font-semibold rounded-2xl py-3 px-5 shadow-sm transition-all active:scale-95"
      >
        <ImageIcon size={18} className="text-primary" />
        <Upload size={16} />
        Upload QR Code from Gallery / Files
      </button>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl py-3 px-4 text-sm font-medium text-center w-full max-w-md">
          {error}
        </div>
      )}

      {/* Manual UPI ID Entry Fallback */}
      <div className="w-full max-w-md pt-2 border-t border-divider-soft flex flex-col items-center gap-3">
        {!showManualInput ? (
          <button
            type="button"
            onClick={() => setShowManualInput(true)}
            className="flex items-center gap-2 text-primary hover:text-primary-focus text-sm font-semibold py-2 px-4 rounded-xl transition-all"
          >
            <Keyboard size={16} />
            Can't scan? Enter UPI ID manually
          </button>
        ) : (
          <form onSubmit={handleManualSubmit} className="w-full bg-canvas-parchment/60 p-4 rounded-2xl border border-hairline flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-ink uppercase tracking-wider">Manual UPI Entry</span>
              <button 
                type="button" 
                onClick={() => setShowManualInput(false)}
                className="text-xs text-ink-muted-48 hover:text-ink"
              >
                Close
              </button>
            </div>
            
            <input
              type="text"
              required
              value={manualPa}
              onChange={(e) => setManualPa(e.target.value)}
              placeholder="UPI ID (e.g. name@okicici or 9876543210@paytm)"
              className="w-full bg-white text-ink text-sm rounded-xl py-2.5 px-3 border border-hairline focus:outline-none focus:ring-2 focus:ring-primary"
            />

            <input
              type="text"
              value={manualPn}
              onChange={(e) => setManualPn(e.target.value)}
              placeholder="Receiver Name (Optional)"
              className="w-full bg-white text-ink text-sm rounded-xl py-2.5 px-3 border border-hairline focus:outline-none focus:ring-2 focus:ring-primary"
            />

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-primary text-on-primary text-sm font-semibold rounded-xl py-2.5 px-4 shadow-sm transition-all active:scale-95"
            >
              Continue with this UPI ID
              <ArrowRight size={16} />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
