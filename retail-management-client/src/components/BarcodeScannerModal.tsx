import React, { useEffect, useRef, useState } from 'react';
import { Camera, X, AlertTriangle, CheckCircle2, Scan } from 'lucide-react';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
  title?: string;
}

export const playScanBeep = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1046.5, ctx.currentTime); // C6 crisp tone
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch {
    // Audio autoplay restrictions ignored
  }
};

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onScan,
  title = 'Scan Product Barcode'
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<any>(null);

  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [hasDetectorApi, setHasDetectorApi] = useState(true);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    setCameraError(null);
    setScannedResult(null);
    setManualCode('');

    const startCamera = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setCameraError('Camera API is not supported on this browser or connection is not secure (requires HTTPS).');
          return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }

        if ('BarcodeDetector' in window) {
          setHasDetectorApi(true);
          const detector = new (window as any).BarcodeDetector({
            formats: ['code_128', 'ean_13', 'ean_8', 'upc_a', 'upc_e', 'qr_code', 'code_39', 'data_matrix']
          });

          scanIntervalRef.current = setInterval(async () => {
            if (videoRef.current && videoRef.current.readyState >= 2) {
              try {
                const barcodes = await detector.detect(videoRef.current);
                if (barcodes && barcodes.length > 0) {
                  const rawValue = barcodes[0].rawValue;
                  if (rawValue) {
                    playScanBeep();
                    setScannedResult(rawValue);
                    onScan(rawValue);
                    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
                    setTimeout(() => {
                      onClose();
                    }, 500);
                  }
                }
              } catch {
                // Drop frame, continue scanning
              }
            }
          }, 300);
        } else {
          setHasDetectorApi(false);
        }
      } catch (err: any) {
        setCameraError(
          'Unable to access device camera. Please grant camera permissions or type the barcode number below.'
        );
      }
    };

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const stopCamera = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      playScanBeep();
      onScan(manualCode.trim());
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: '1rem',
        backdropFilter: 'blur(3px)'
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: 460,
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Scan size={22} color="#2563eb" />
            <h3 style={{ fontSize: '1.125rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '0.25rem' }}
          >
            <X size={20} />
          </button>
        </div>

        {cameraError ? (
          <div
            style={{
              backgroundColor: '#fee2e2',
              color: '#991b1b',
              padding: '0.75rem',
              borderRadius: '0.375rem',
              fontSize: '0.8125rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <AlertTriangle size={16} /> {cameraError}
          </div>
        ) : (
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: 260,
              backgroundColor: '#000000',
              borderRadius: '0.5rem',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />

            {/* Viewfinder Reticle */}
            <div
              style={{
                position: 'absolute',
                width: '74%',
                height: '52%',
                border: '2px solid #3b82f6',
                borderRadius: '0.5rem',
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.45)',
                pointerEvents: 'none'
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: 0,
                  right: 0,
                  height: 2,
                  backgroundColor: '#ef4444',
                  boxShadow: '0 0 8px #ef4444'
                }}
              />
            </div>

            <div
              style={{
                position: 'absolute',
                bottom: 8,
                left: 0,
                right: 0,
                textAlign: 'center',
                color: '#ffffff',
                fontSize: '0.75rem',
                backgroundColor: 'rgba(0,0,0,0.5)',
                padding: '0.25rem 0'
              }}
            >
              Align barcode line inside red target
            </div>
          </div>
        )}

        {!hasDetectorApi && !cameraError && (
          <div
            style={{
              backgroundColor: '#eff6ff',
              color: '#1e40af',
              padding: '0.625rem',
              borderRadius: '0.375rem',
              fontSize: '0.75rem'
            }}
          >
            <strong>Note:</strong> Auto-detection is best supported in Chrome/Edge/Android. You can also scan with a USB/Bluetooth barcode gun or enter digits below.
          </div>
        )}

        {scannedResult && (
          <div
            style={{
              backgroundColor: '#ecfdf5',
              color: '#065f46',
              padding: '0.625rem',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              textAlign: 'center',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            <CheckCircle2 size={16} /> Barcode Detected: {scannedResult}
          </div>
        )}

        {/* Manual Input Fallback */}
        <form onSubmit={handleManualSubmit} style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="Or type/paste barcode digits here..."
            style={{
              flex: 1,
              padding: '0.5rem 0.75rem',
              border: '1px solid #cbd5e1',
              borderRadius: '0.25rem',
              fontSize: '0.8125rem'
            }}
          />
          <button type="submit" className="btn btn-primary" style={{ fontSize: '0.8125rem', padding: '0.5rem 0.875rem' }}>
            Apply
          </button>
        </form>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
            style={{ fontSize: '0.8125rem', padding: '0.5rem 1rem' }}
          >
            Close Scanner
          </button>
        </div>
      </div>
    </div>
  );
};
