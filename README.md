# UPI QR Splitter

A modern, high-performance web application built with **React 19**, **TypeScript**, **Vite**, and **Tailwind CSS**. **UPI QR Splitter** enables users to scan or upload any receiver's UPI QR code, specify a total amount, and automatically split larger payments into multiple ready-to-pay **₹1,999** QR codes.

---

##  Key Features

-  **Hardware-Accelerated Camera Scanner**: Sub-30ms QR detection utilizing native browser `BarcodeDetector` API + `jsQR` frame sampling loop.
-  **QR Image File Upload**: Decodes high-resolution QR screenshots & phone gallery photos via multi-pass canvas scaling.
-  **Manual UPI Fallback**: Easily type any UPI VPA ID (e.g. `merchant@okicici`) manually without scanning.
-  **Automated Payment Chunking**: Divides any payment amount above ₹1,999 into safe ₹1,999 transaction chunks.
-  **One-Click Download & Share**: Export individual split QR codes as high-resolution PNG images.
-  **Apple-Inspired Design System**: Modern glassmorphism, responsive desktop/mobile views, and clean typography.
-  **Progressive Web App (PWA)**: Installable on Android & iOS devices for quick offline access.

---

##  Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS, Lucide React Icons
- **QR Engine**: `html5-qrcode`, `jsQR`, `qrcode.react`
- **PWA**: `vite-plugin-pwa`

---

##  Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- `npm` or `yarn`

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/upi-qr-splitter.git
   cd upi-qr-splitter
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start local development server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

---

##  Testing on Mobile Phone

To test camera scanning and payment splitting directly on your mobile device:

### Option A: Local Wi-Fi Network
1. Run `npm run dev`.
2. Connect your mobile phone to the same Wi-Fi network.
3. Open `http://<YOUR_LAPTOP_IP>:5173` on your mobile browser.

### Option B: Cloudflare Tunnel (HTTPS for Mobile Camera)
```bash
npx @cloudflare/cloudflared tunnel --url http://127.0.0.1:5173
```
Open the generated `https://...trycloudflare.com` URL on your phone for full camera permission access.

---

##  Project Structure

```text
upi-qr-splitter/
├── src/
│   ├── components/
│   │   ├── Scanner.tsx       # Dual-engine camera & file QR decoder
│   │   ├── AmountForm.tsx    # Payment amount input & validation
│   │   └── QRGallery.tsx     # Split QR grid gallery & PNG export
│   ├── App.tsx               # Main wizard state & layout container
│   ├── index.css             # Tailwind base styles & scanner overrides
│   └── main.tsx              # App root entry point
├── public/                   # Static assets & PWA icons
├── vite.config.ts            # Vite & PWA configuration
└── package.json
```

---

##  License

This project is open-source under the [MIT License](LICENSE).