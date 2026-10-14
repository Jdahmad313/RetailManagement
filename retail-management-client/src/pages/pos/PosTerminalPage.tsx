import React, { useEffect, useState, useRef } from 'react';
import {
  Search,
  Barcode,
  Trash2,
  Plus,
  Minus,
  CreditCard,
  Banknote,
  Printer,
  CheckCircle,
  X,
  User,
  ShoppingBag,
  RotateCcw,
  Camera,
  Download,
  AlertTriangle,
} from 'lucide-react';
import { Product, Category, PosSale, ApiResponse, BusinessProfile } from '../../types';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useBusiness } from '../../context/BusinessContext';

interface PosCartLine {
  product: Product;
  quantity: number;
  discountAmount: number;
}

export const PosTerminalPage: React.FC = () => {
  const { user } = useAuth();
  const { currencySymbol } = useBusiness();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');

  const [cart, setCart] = useState<PosCartLine[]>([]);
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [globalDiscount, setGlobalDiscount] = useState<number>(0);

  // Modals
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentType, setPaymentType] = useState<'cash' | 'card' | 'split'>('cash');
  const [cashTendered, setCashTendered] = useState<number>(0);
  const [splitCashAmount, setSplitCashAmount] = useState<number>(0);
  const [splitCardAmount, setSplitCardAmount] = useState<number>(0);

  const [lastCompletedSale, setLastCompletedSale] = useState<PosSale | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Hardware Scanner buffer
  const scannerBuffer = useRef<string>('');
  const lastKeyTime = useRef<number>(0);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Camera Scanner Modal State
  const [showCameraScanner, setShowCameraScanner] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraSuccess, setCameraSuccess] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<any>(null);

  useEffect(() => {
    // Load products, categories, and business profile
    Promise.all([
      apiClient.get<ApiResponse<{ items: Product[] }>>('/products?pageSize=100&isActive=true'),
      apiClient.get<ApiResponse<Category[]>>('/categories'),
      apiClient.get<ApiResponse<BusinessProfile>>('/businesssettings'),
    ]).then(([prodRes, catRes, setRes]) => {
      if (prodRes.data.success) setProducts(prodRes.data.data.items);
      if (catRes.data.success) setCategories(catRes.data.data);
      if (setRes.data.success) setBusinessProfile(setRes.data.data);
    });
  }, []);

  // Hardware Barcode Scanner Machine Keyboard Listener (USB/Bluetooth HID guns)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when focusing on other editable fields like search query or customer name
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA') &&
        activeEl !== barcodeInputRef.current
      ) {
        return;
      }

      const now = Date.now();
      // Hardware barcode scanners send characters consecutively within < 80ms
      if (now - lastKeyTime.current > 120) {
        scannerBuffer.current = '';
      }
      lastKeyTime.current = now;

      if (e.key === 'Enter') {
        const code = scannerBuffer.current.trim();
        if (code.length >= 2) {
          lookupAndAddProduct(code);
          scannerBuffer.current = '';
          e.preventDefault();
        }
      } else if (e.key.length === 1) {
        scannerBuffer.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [products, businessProfile]);

  const lookupAndAddProduct = (code: string) => {
    const trimmed = code.trim();
    if (!trimmed) return;

    const matched = products.find(
      (p) =>
        (p.barcode && p.barcode.toLowerCase() === trimmed.toLowerCase()) ||
        p.sku.toLowerCase() === trimmed.toLowerCase()
    );

    if (matched) {
      addToCart(matched);
      setBarcodeInput('');
    } else {
      apiClient
        .get<ApiResponse<Product>>(`/products/barcode/${trimmed}`)
        .then((res) => {
          if (res.data.success && res.data.data) {
            addToCart(res.data.data);
            setBarcodeInput('');
          } else {
            setErrorMsg(`No product found with barcode or SKU: ${trimmed}`);
          }
        })
        .catch(() => {
          setErrorMsg(`No product found with barcode or SKU: ${trimmed}`);
        });
    }
  };

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (barcodeInput.trim()) {
      lookupAndAddProduct(barcodeInput.trim());
    }
  };

  // Camera Barcode Scanning Controls
  const startCameraScanner = async () => {
    setCameraError(null);
    setCameraSuccess(null);
    setShowCameraScanner(true);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Camera API is not supported on this browser or connection is not secure (HTTPS).');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }

      // Check BarcodeDetector API
      if ('BarcodeDetector' in window) {
        const barcodeDetector = new (window as any).BarcodeDetector({
          formats: ['code_128', 'ean_13', 'ean_8', 'upc_a', 'upc_e', 'qr_code', 'code_39'],
        });

        scanIntervalRef.current = setInterval(async () => {
          if (videoRef.current && videoRef.current.readyState >= 2) {
            try {
              const detected = await barcodeDetector.detect(videoRef.current);
              if (detected && detected.length > 0) {
                const rawValue = detected[0].rawValue;
                if (rawValue) {
                  setCameraSuccess(`Scanned: ${rawValue}`);
                  lookupAndAddProduct(rawValue);
                  setTimeout(() => {
                    stopCameraScanner();
                  }, 600);
                }
              }
            } catch {
              // Frame dropped, continue
            }
          }
        }, 400);
      }
    } catch (err: any) {
      setCameraError('Unable to access device camera. Please grant camera permission in your browser or enter barcode manually.');
    }
  };

  const stopCameraScanner = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setShowCameraScanner(false);
  };

  useEffect(() => {
    if (showCameraScanner && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
    return () => {
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [showCameraScanner]);

  const downloadReceipt = () => {
    if (!lastCompletedSale) return;
    const sym = businessProfile?.currencySymbol || currencySymbol || 'Rs.';
    const itemsFormatted = lastCompletedSale.items
      .map((i) => `${i.productName.padEnd(24)} x${i.quantity}   ${sym} ${i.total.toFixed(2)}`)
      .join('\n');

    const content = `================================================
${businessProfile?.businessName || 'Mukhtar Bashir Merchant Karyana'}
${businessProfile?.address || 'Jurian, Hafizabad'}
Phone: ${businessProfile?.phone || '+923446583468'}
================================================
Receipt:  ${lastCompletedSale.receiptNumber}
Date:     ${new Date(lastCompletedSale.createdAtUtc).toLocaleString()}
Cashier:  ${lastCompletedSale.cashierName}
Customer: ${lastCompletedSale.customerName}
------------------------------------------------
${itemsFormatted}
------------------------------------------------
Subtotal: ${sym} ${lastCompletedSale.subTotal.toFixed(2)}
Tax:      ${sym} ${lastCompletedSale.taxAmount.toFixed(2)}
TOTAL:    ${sym} ${lastCompletedSale.totalAmount.toFixed(2)}
Tendered: ${sym} ${lastCompletedSale.amountTendered.toFixed(2)}
Change:   ${sym} ${lastCompletedSale.changeGiven.toFixed(2)}
================================================
${businessProfile?.receiptFooter || 'Shukriya! Tashreef awri ka bohot shukriya.'}
================================================`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Receipt-${lastCompletedSale.receiptNumber}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const addToCart = (product: Product) => {
    setErrorMsg(null);
    if (product.stockQuantity <= 0 && !businessProfile?.allowNegativeStock) {
      setErrorMsg(`Product '${product.name}' is out of stock!`);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { product, quantity: 1, discountAmount: 0 }];
    });
  };

  const updateQuantity = (productId: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((i) => (i.product.id === productId ? { ...i, quantity: qty } : i))
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  };

  // Computations
  const subTotal = cart.reduce(
    (acc, i) => acc + i.product.effectivePrice * i.quantity - i.discountAmount,
    0
  );
  const taxRate = businessProfile?.defaultTaxRate ?? 8.5;
  const taxAmount = Math.round(subTotal * (taxRate / 100) * 100) / 100;
  const grandTotal = Math.max(0, subTotal + taxAmount - globalDiscount);

  const openPaymentModal = () => {
    if (cart.length === 0) return;
    setCashTendered(grandTotal);
    setSplitCashAmount(Math.round(grandTotal / 2));
    setSplitCardAmount(grandTotal - Math.round(grandTotal / 2));
    setShowPaymentModal(true);
  };

  const handleProcessPayment = async () => {
    setLoading(true);
    setErrorMsg(null);

    const payments = [];
    let tendered = grandTotal;

    if (paymentType === 'cash') {
      tendered = cashTendered;
      payments.push({
        paymentMethod: 0, // Cash
        amount: grandTotal,
      });
    } else if (paymentType === 'card') {
      tendered = grandTotal;
      payments.push({
        paymentMethod: 1, // Card
        amount: grandTotal,
        transactionReference: `CARD-${Date.now().toString().slice(-6)}`,
      });
    } else {
      tendered = splitCashAmount + splitCardAmount;
      payments.push({
        paymentMethod: 0,
        amount: splitCashAmount,
      });
      payments.push({
        paymentMethod: 1,
        amount: splitCardAmount,
        transactionReference: `CARD-${Date.now().toString().slice(-6)}`,
      });
    }

    const payload = {
      customerName,
      globalDiscountAmount: globalDiscount,
      amountTendered: tendered,
      items: cart.map((i) => ({
        productId: i.product.id,
        quantity: i.quantity,
        customUnitPrice: i.product.effectivePrice,
        discountAmount: i.discountAmount,
      })),
      payments,
    };

    try {
      const res = await apiClient.post<ApiResponse<PosSale>>('/pos/sale', payload);
      if (res.data.success && res.data.data) {
        setLastCompletedSale(res.data.data);
        setShowPaymentModal(false);
        setShowReceiptModal(true);
        setCart([]);
        setCustomerName('Walk-in Customer');
        setGlobalDiscount(0);

        // Update in-memory product stock
        setProducts((prev) =>
          prev.map((p) => {
            const sold = cart.find((c) => c.product.id === p.id);
            return sold ? { ...p, stockQuantity: p.stockQuantity - sold.quantity } : p;
          })
        );
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Transaction failed. Please check stock.');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesCat = !selectedCategory || p.categoryId === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.barcode && p.barcode.includes(searchQuery));
    return matchesCat && matchesSearch;
  });

  return (
    <div className="pos-container" style={{ gap: '1.25rem' }}>
      {/* Left Pane: Scanner, Category Tabs, Product Catalog */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflow: 'hidden' }}>
        {/* Top Controls: Barcode scan input & Keyword search */}
        <div className="card" style={{ padding: '0.875rem 1.25rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <form onSubmit={handleBarcodeSubmit} style={{ flex: 1, display: 'flex', gap: '0.5rem' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                ref={barcodeInputRef}
                type="text"
                placeholder="Scan Barcode or Enter SKU (Press Enter)..."
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                autoFocus
                style={{
                  width: '100%',
                  padding: '0.5rem 1rem 0.5rem 2.25rem',
                  borderRadius: '0.375rem',
                  border: '2px solid #3b82f6',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                }}
              />
              <Barcode size={18} style={{ position: 'absolute', left: '0.625rem', top: '50%', transform: 'translateY(-50%)', color: '#2563eb' }} />
            </div>
            <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>
              Add
            </button>
            <button
              type="button"
              onClick={startCameraScanner}
              className="btn btn-secondary"
              title="Open Device Camera Barcode Scanner"
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.5rem 0.875rem', whiteSpace: 'nowrap' }}
            >
              <Camera size={16} /> Scan Camera
            </button>
          </form>

          <div style={{ position: 'relative', width: 220 }}>
            <input
              type="text"
              placeholder="Filter catalog..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 1rem 0.5rem 2rem',
                borderRadius: '0.375rem',
                border: '1px solid #cbd5e1',
                fontSize: '0.8125rem',
              }}
            />
            <Search size={16} style={{ position: 'absolute', left: '0.625rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          </div>
        </div>

        {/* Category Pills */}
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
          <button
            onClick={() => setSelectedCategory('')}
            className="btn"
            style={{
              padding: '0.375rem 0.875rem',
              fontSize: '0.8125rem',
              backgroundColor: !selectedCategory ? '#2563eb' : '#ffffff',
              color: !selectedCategory ? '#ffffff' : '#334155',
              border: '1px solid #cbd5e1',
              borderRadius: '9999px',
              whiteSpace: 'nowrap',
            }}
          >
            All Products
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className="btn"
              style={{
                padding: '0.375rem 0.875rem',
                fontSize: '0.8125rem',
                backgroundColor: selectedCategory === c.id ? '#2563eb' : '#ffffff',
                color: selectedCategory === c.id ? '#ffffff' : '#334155',
                border: '1px solid #cbd5e1',
                borderRadius: '9999px',
                whiteSpace: 'nowrap',
              }}
            >
              {c.name}
            </button>
          ))}
        </div>

        {errorMsg && (
          <div style={{ backgroundColor: '#fee2e2', border: '1px solid #fecaca', color: '#991b1b', padding: '0.625rem 1rem', borderRadius: '0.375rem', fontSize: '0.8125rem' }}>
            {errorMsg}
          </div>
        )}

        {/* Product Catalog Grid */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', paddingRight: '0.25rem' }}>
          {filteredProducts.map((p) => (
            <div
              key={p.id}
              onClick={() => addToCart(p)}
              className="card"
              style={{
                padding: '0.75rem',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.1s ease',
                border: '1px solid #e2e8f0',
              }}
            >
              <img
                src={p.imageUrl || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200'}
                alt={p.name}
                style={{ width: '100%', height: 110, objectFit: 'cover', borderRadius: '0.375rem', marginBottom: '0.5rem' }}
              />
              <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.25, marginBottom: '0.375rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {p.name}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                <span style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#2563eb' }}>
                  {currencySymbol} {p.effectivePrice.toFixed(2)}
                </span>
                <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: p.stockQuantity <= p.reorderThreshold ? '#d97706' : '#64748b' }}>
                  Stock: {p.stockQuantity}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Pane: Cart, Customer, Payment Tender */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: '1.25rem', height: '100%', overflow: 'hidden' }}>
        {/* Customer Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
          <User size={18} color="#64748b" />
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            style={{ flex: 1, border: 'none', fontSize: '0.875rem', fontWeight: 600, color: '#0f172a', outline: 'none' }}
          />
          <button onClick={() => setCart([])} title="Clear Cart" style={{ color: '#ef4444' }}>
            <RotateCcw size={15} />
          </button>
        </div>

        {/* Cart Line Items */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
              <ShoppingBag size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
              <div>Register Cart Empty</div>
              <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>Scan a barcode or tap an item</div>
            </div>
          ) : (
            cart.map((line) => {
              const lineTotal = line.product.effectivePrice * line.quantity - line.discountAmount;
              return (
                <div key={line.product.id} style={{ padding: '0.75rem 0', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1, marginRight: '0.5rem' }}>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#0f172a' }}>{line.product.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {currencySymbol} {line.product.effectivePrice.toFixed(2)} / {line.product.unit}
                    </div>
                  </div>

                  {/* Enhanced Quantity Controls */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginRight: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => updateQuantity(line.product.id, line.quantity - 1)}
                      title="Decrease quantity (-1)"
                      style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '0.25rem', cursor: 'pointer' }}
                    >
                      <Minus size={12} />
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={line.quantity}
                      onChange={(e) => updateQuantity(line.product.id, Math.max(1, parseInt(e.target.value) || 1))}
                      style={{ width: 42, height: 24, padding: 0, textAlign: 'center', border: '1px solid #cbd5e1', borderRadius: '0.25rem', fontSize: '0.8125rem', fontWeight: 700 }}
                    />
                    <button
                      type="button"
                      onClick={() => updateQuantity(line.product.id, line.quantity + 1)}
                      title="Increase quantity (+1)"
                      style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '0.25rem', cursor: 'pointer' }}
                    >
                      <Plus size={12} />
                    </button>
                  </div>

                  <div style={{ fontWeight: 700, fontSize: '0.875rem', minWidth: 55, textAlign: 'right' }}>
                    {currencySymbol} {lineTotal.toFixed(2)}
                  </div>

                  {/* Assigned Delete / Remove Product Button */}
                  <button
                    type="button"
                    onClick={() => removeFromCart(line.product.id)}
                    title="Remove item from invoice"
                    style={{
                      backgroundColor: '#fee2e2',
                      color: '#ef4444',
                      border: '1px solid #fecaca',
                      padding: '0.25rem',
                      borderRadius: '0.25rem',
                      marginLeft: '0.5rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Totals & Tender */}
        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem', marginTop: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.375rem', color: '#64748b' }}>
            <span>Subtotal</span>
            <span>{currencySymbol} {subTotal.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.375rem', color: '#64748b' }}>
            <span>Tax ({taxRate}%)</span>
            <span>{currencySymbol} {taxAmount.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.75rem', color: '#64748b' }}>
            <span>Discount</span>
            <input
              type="number"
              value={globalDiscount}
              onChange={(e) => setGlobalDiscount(parseFloat(e.target.value) || 0)}
              style={{ width: 60, padding: '0.1rem 0.25rem', textAlign: 'right', border: '1px solid #cbd5e1', borderRadius: '0.25rem', fontSize: '0.8125rem' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem' }}>
            <span>Total Due</span>
            <span style={{ color: '#2563eb' }}>{currencySymbol} {grandTotal.toFixed(2)}</span>
          </div>

          <button
            onClick={openPaymentModal}
            disabled={cart.length === 0}
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.875rem', fontSize: '1rem', justifyContent: 'center' }}
          >
            Pay & Complete Sale ({currencySymbol} {grandTotal.toFixed(2)})
          </button>
        </div>
      </div>

      {/* Payment Tender Modal */}
      {showPaymentModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="card" style={{ width: 440, padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Collect Payment</h3>
              <button onClick={() => setShowPaymentModal(false)}><X size={18} /></button>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '1.5rem', backgroundColor: '#eff6ff', padding: '1rem', borderRadius: '0.5rem' }}>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 600 }}>Amount Due</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#1e40af' }}>{currencySymbol} {grandTotal.toFixed(2)}</div>
            </div>

            {/* Payment Method Tabs */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <button
                onClick={() => setPaymentType('cash')}
                style={{
                  padding: '0.625rem',
                  borderRadius: '0.375rem',
                  border: `2px solid ${paymentType === 'cash' ? '#2563eb' : '#cbd5e1'}`,
                  backgroundColor: paymentType === 'cash' ? '#eff6ff' : '#ffffff',
                  fontWeight: 600,
                  fontSize: '0.8125rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.375rem',
                }}
              >
                <Banknote size={16} /> Cash
              </button>
              <button
                onClick={() => setPaymentType('card')}
                style={{
                  padding: '0.625rem',
                  borderRadius: '0.375rem',
                  border: `2px solid ${paymentType === 'card' ? '#2563eb' : '#cbd5e1'}`,
                  backgroundColor: paymentType === 'card' ? '#eff6ff' : '#ffffff',
                  fontWeight: 600,
                  fontSize: '0.8125rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.375rem',
                }}
              >
                <CreditCard size={16} /> Card
              </button>
              <button
                onClick={() => setPaymentType('split')}
                style={{
                  padding: '0.625rem',
                  borderRadius: '0.375rem',
                  border: `2px solid ${paymentType === 'split' ? '#2563eb' : '#cbd5e1'}`,
                  backgroundColor: paymentType === 'split' ? '#eff6ff' : '#ffffff',
                  fontWeight: 600,
                  fontSize: '0.8125rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.375rem',
                }}
              >
                Split
              </button>
            </div>

            {/* Cash Tender Mode */}
            {paymentType === 'cash' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>Cash Received ({currencySymbol})</label>
                <input
                  type="number"
                  value={cashTendered}
                  onChange={(e) => setCashTendered(parseFloat(e.target.value) || 0)}
                  style={{ width: '100%', padding: '0.625rem', fontSize: '1.25rem', fontWeight: 700, borderRadius: '0.375rem', border: '1px solid #cbd5e1', marginBottom: '0.75rem' }}
                />

                {/* Quick bill buttons */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
                  {[100, 500, 1000, 5000].map((bill) => (
                    <button
                      key={bill}
                      onClick={() => setCashTendered(bill)}
                      style={{ padding: '0.375rem', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '0.25rem', fontWeight: 700, fontSize: '0.8125rem' }}
                    >
                      {currencySymbol} {bill}
                    </button>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '0.375rem', marginBottom: '1.25rem' }}>
                  <span style={{ fontWeight: 600 }}>Change Due:</span>
                  <strong style={{ fontSize: '1.125rem', color: cashTendered >= grandTotal ? '#16a34a' : '#dc2626' }}>
                    {currencySymbol} {Math.max(0, cashTendered - grandTotal).toFixed(2)}
                  </strong>
                </div>
              </div>
            )}

            {/* Card Tender Mode */}
            {paymentType === 'card' && (
              <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '0.375rem', marginBottom: '1.25rem' }}>
                <CreditCard size={32} color="#2563eb" style={{ margin: '0 auto 0.5rem' }} />
                <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>Tap or Insert Customer Card on Terminal</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Integrated POS Reader Simulated</div>
              </div>
            )}

            {/* Split Tender Mode */}
            {paymentType === 'split' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600 }}>Cash Component ({currencySymbol})</label>
                  <input
                    type="number"
                    value={splitCashAmount}
                    onChange={(e) => setSplitCashAmount(parseFloat(e.target.value) || 0)}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.25rem', fontWeight: 700 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600 }}>Card Component ({currencySymbol})</label>
                  <input
                    type="number"
                    value={splitCardAmount}
                    onChange={(e) => setSplitCardAmount(parseFloat(e.target.value) || 0)}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.25rem', fontWeight: 700 }}
                  />
                </div>
                <div style={{ fontSize: '0.75rem', color: splitCashAmount + splitCardAmount >= grandTotal ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
                  Total Collected: {currencySymbol} {(splitCashAmount + splitCardAmount).toFixed(2)} / {currencySymbol} {grandTotal.toFixed(2)}
                </div>
              </div>
            )}

            <button
              onClick={handleProcessPayment}
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.75rem', justifyContent: 'center' }}
            >
              {loading ? 'Processing...' : 'Confirm Payment & Print Receipt'}
            </button>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal */}
      {showReceiptModal && lastCompletedSale && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 }}>
          <div className="card" style={{ width: 420, padding: '1.5rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span className="badge badge-success">Sale Completed</span>
              <button onClick={() => setShowReceiptModal(false)}><X size={18} /></button>
            </div>

            {/* Receipt Preview */}
            <div id="printable-receipt" style={{ fontFamily: 'monospace', fontSize: '0.8125rem', lineHeight: 1.4, border: '1px dashed #cbd5e1', padding: '1rem', backgroundColor: '#ffffff', color: '#000000' }}>
              <div style={{ textAlign: 'center', marginBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 800 }}>{businessProfile?.businessName || 'Apex Retail'}</h3>
                <div>{businessProfile?.address}</div>
                <div>{businessProfile?.phone}</div>
                <div>{businessProfile?.receiptHeader}</div>
              </div>

              <div style={{ borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '0.5rem 0', margin: '0.5rem 0' }}>
                <div>Receipt: {lastCompletedSale.receiptNumber}</div>
                <div>Date: {new Date(lastCompletedSale.createdAtUtc).toLocaleString()}</div>
                <div>Cashier: {lastCompletedSale.cashierName}</div>
                <div>Customer: {lastCompletedSale.customerName}</div>
              </div>

              <table style={{ width: '100%', textAlign: 'left', marginBottom: '0.5rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #000' }}>
                    <th>Item</th>
                    <th style={{ textAlign: 'center' }}>Qty</th>
                    <th style={{ textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {lastCompletedSale.items.map((i) => (
                    <tr key={i.id}>
                      <td>{i.productName}</td>
                      <td style={{ textAlign: 'center' }}>{i.quantity}</td>
                      <td style={{ textAlign: 'right' }}>{currencySymbol} {i.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ borderTop: '1px dashed #000', paddingTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Subtotal:</span>
                  <span>{currencySymbol} {lastCompletedSale.subTotal.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Tax:</span>
                  <span>{currencySymbol} {lastCompletedSale.taxAmount.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '0.9375rem', borderTop: '1px solid #000', paddingTop: '0.25rem' }}>
                  <span>TOTAL:</span>
                  <span>{currencySymbol} {lastCompletedSale.totalAmount.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Tendered:</span>
                  <span>{currencySymbol} {lastCompletedSale.amountTendered.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Change:</span>
                  <span>{currencySymbol} {lastCompletedSale.changeGiven.toFixed(2)}</span>
                </div>
              </div>

              <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.75rem', borderTop: '1px dashed #000', paddingTop: '0.5rem' }}>
                {businessProfile?.receiptFooter}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem' }}>
              <button
                type="button"
                onClick={() => window.print()}
                className="btn btn-primary"
                style={{ flex: 1, justifyContent: 'center', fontSize: '0.8125rem' }}
              >
                <Printer size={15} /> Print
              </button>
              <button
                type="button"
                onClick={downloadReceipt}
                className="btn btn-secondary"
                style={{ flex: 1, justifyContent: 'center', fontSize: '0.8125rem' }}
              >
                <Download size={15} /> Download
              </button>
              <button
                type="button"
                onClick={() => setShowReceiptModal(false)}
                className="btn btn-secondary"
                style={{ padding: '0.5rem 0.75rem', justifyContent: 'center', fontSize: '0.8125rem' }}
              >
                Next Sale
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Camera Barcode Scanner Modal */}
      {showCameraScanner && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 80,
            padding: '1rem',
            backdropFilter: 'blur(3px)',
          }}
        >
          <div className="card" style={{ width: '100%', maxWidth: 460, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Camera size={20} color="#2563eb" />
                <h3 style={{ fontSize: '1.125rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>Camera Barcode Scanner</h3>
              </div>
              <button onClick={stopCameraScanner} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {cameraError ? (
              <div style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '0.75rem', borderRadius: '0.375rem', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={16} /> {cameraError}
              </div>
            ) : (
              <div style={{ position: 'relative', width: '100%', height: 260, backgroundColor: '#000000', borderRadius: '0.5rem', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                {/* Visual Viewfinder Reticle */}
                <div
                  style={{
                    position: 'absolute',
                    width: '70%',
                    height: '55%',
                    border: '2px solid #3b82f6',
                    borderRadius: '0.5rem',
                    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.45)',
                    pointerEvents: 'none',
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
                      opacity: 0.8,
                    }}
                  />
                </div>
              </div>
            )}

            {cameraSuccess && (
              <div style={{ backgroundColor: '#ecfdf5', color: '#065f46', padding: '0.625rem', borderRadius: '0.375rem', fontSize: '0.8125rem', textAlign: 'center', fontWeight: 700 }}>
                ✓ {cameraSuccess}
              </div>
            )}

            <div style={{ fontSize: '0.75rem', color: '#64748b', textAlign: 'center' }}>
              Aim your device camera at any product barcode, UPC, or QR code to scan.
            </div>

            <button
              type="button"
              onClick={stopCameraScanner}
              className="btn btn-secondary"
              style={{ width: '100%', justifyContent: 'center', padding: '0.5rem' }}
            >
              Close Camera Scanner
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
