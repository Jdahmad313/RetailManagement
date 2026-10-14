import React, { useEffect, useState, useRef } from 'react';
import { Plus, Search, Edit2, Trash2, X, AlertCircle, Camera, Scan } from 'lucide-react';
import { Product, Category, PagedResponse, ApiResponse } from '../../types';
import { apiClient } from '../../api/client';
import { useBusiness } from '../../context/BusinessContext';
import { ImagePicker } from '../../components/ImagePicker';
import { BarcodeScannerModal, playScanBeep } from '../../components/BarcodeScannerModal';

export const ProductsAdminPage: React.FC = () => {
  const { currencySymbol } = useBusiness();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);

  // Hardware Barcode Scanner Buffer (USB/Bluetooth Guns)
  const scannerBuffer = useRef<string>('');
  const lastKeyTime = useRef<number>(0);

  // Form Fields
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [brand, setBrand] = useState('');
  const [unit, setUnit] = useState('pcs');
  const [categoryId, setCategoryId] = useState('');
  const [purchaseCost, setPurchaseCost] = useState<number>(0);
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [discountPrice, setDiscountPrice] = useState<string>('');
  const [initialStock, setInitialStock] = useState<number>(0);
  const [reorderThreshold, setReorderThreshold] = useState<number>(5);
  const [imageUrl, setImageUrl] = useState('');
  const [attributesJson, setAttributesJson] = useState('{}');
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadData = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.append('searchTerm', search);
    if (selectedCategory) params.append('categoryId', selectedCategory);
    params.append('pageSize', '50');

    Promise.all([
      apiClient.get<ApiResponse<PagedResponse<Product>>>(`/products?${params.toString()}`),
      apiClient.get<ApiResponse<Category[]>>('/categories'),
    ])
      .then(([prodRes, catRes]) => {
        if (prodRes.data.success && prodRes.data.data) {
          setProducts(prodRes.data.data.items);
        }
        if (catRes.data.success) {
          setCategories(catRes.data.data);
          if (!categoryId && catRes.data.data.length > 0) {
            setCategoryId(catRes.data.data[0].id);
          }
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [search, selectedCategory]);

  // Hardware Scanner Machine Keyboard Listener (USB/Bluetooth HID guns)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showModal) return;

      const activeEl = document.activeElement as HTMLElement | null;
      if (activeEl && activeEl.tagName === 'TEXTAREA') {
        return;
      }

      const now = Date.now();
      if (now - lastKeyTime.current > 120) {
        scannerBuffer.current = '';
      }
      lastKeyTime.current = now;

      if (e.key === 'Enter') {
        const code = scannerBuffer.current.trim();
        if (code.length >= 3) {
          e.preventDefault();
          e.stopPropagation();
          if (showModal) {
            setBarcode(code);
          } else {
            setSearch(code);
          }
          playScanBeep();
          scannerBuffer.current = '';
        }
      } else if (e.key.length === 1) {
        scannerBuffer.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [showModal]);

  const openCreateModal = () => {
    setEditingProduct(null);
    setSku(`SKU-${Date.now().toString().slice(-6)}`);
    setBarcode('');
    setName('');
    setDescription('');
    setBrand('');
    setUnit('pcs');
    setPurchaseCost(10);
    setSellingPrice(25);
    setDiscountPrice('');
    setInitialStock(20);
    setReorderThreshold(5);
    setImageUrl('');
    setAttributesJson('{}');
    setIsActive(true);
    setIsFeatured(false);
    setErrorMsg(null);
    setShowModal(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setSku(p.sku);
    setBarcode(p.barcode || '');
    setName(p.name);
    setDescription(p.description || '');
    setBrand(p.brand || '');
    setUnit(p.unit);
    setCategoryId(p.categoryId);
    setPurchaseCost(p.purchaseCost);
    setSellingPrice(p.sellingPrice);
    setDiscountPrice(p.discountPrice ? p.discountPrice.toString() : '');
    setInitialStock(p.stockQuantity);
    setReorderThreshold(p.reorderThreshold);
    setImageUrl(p.imageUrl || '');
    setAttributesJson(p.attributesJson || '{}');
    setIsActive(p.isActive);
    setIsFeatured(p.isFeatured);
    setErrorMsg(null);
    setShowModal(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);

    const payload = {
      sku: sku.trim(),
      barcode: barcode.trim() || null,
      name: name.trim(),
      description: description.trim() || null,
      brand: brand.trim() || null,
      unit,
      categoryId,
      purchaseCost,
      sellingPrice,
      discountPrice: discountPrice ? parseFloat(discountPrice) : null,
      initialStock,
      reorderThreshold,
      imageUrl: imageUrl.trim() || null,
      attributesJson: attributesJson.trim() || null,
      isActive,
      isFeatured,
    };

    try {
      if (editingProduct) {
        await apiClient.put(`/products/${editingProduct.id}`, { ...payload, id: editingProduct.id });
      } else {
        await apiClient.post('/products', payload);
      }
      setShowModal(false);
      loadData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to save product.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this product? Historical sales will be preserved.')) return;
    try {
      await apiClient.delete(`/products/${id}`);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete product.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>Product Management</h1>
          <p style={{ fontSize: '0.8125rem', color: '#64748b' }}>Configure your generic retail catalog and pricing</p>
        </div>
        <button onClick={openCreateModal} className="btn btn-primary">
          <Plus size={16} /> Add Product
        </button>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '0.875rem 1.25rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, display: 'flex', gap: '0.375rem' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              type="text"
              placeholder="Search by SKU, barcode, name, brand..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', padding: '0.5rem 1rem 0.5rem 2rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
            />
            <Search size={16} style={{ position: 'absolute', left: '0.625rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          </div>
          <button
            type="button"
            onClick={() => setShowBarcodeScanner(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.5rem 0.75rem',
              backgroundColor: '#eff6ff',
              color: '#2563eb',
              border: '1px solid #bfdbfe',
              borderRadius: '0.375rem',
              fontWeight: 600,
              fontSize: '0.8125rem',
              cursor: 'pointer'
            }}
            title="Scan barcode with camera to filter"
          >
            <Camera size={15} /> Scan
          </button>
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          style={{ padding: '0.5rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.875rem', backgroundColor: '#ffffff' }}
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Products Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8125rem' }}>
          <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>
            <tr>
              <th style={{ padding: '0.75rem 1.25rem' }}>Item</th>
              <th style={{ padding: '0.75rem 1rem' }}>SKU / Barcode</th>
              <th style={{ padding: '0.75rem 1rem' }}>Category</th>
              <th style={{ padding: '0.75rem 1rem' }}>Cost</th>
              <th style={{ padding: '0.75rem 1rem' }}>Price</th>
              <th style={{ padding: '0.75rem 1rem' }}>Stock</th>
              <th style={{ padding: '0.75rem 1rem' }}>Status</th>
              <th style={{ padding: '0.75rem 1.25rem', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}>Loading catalog...</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}>No products found.</td></tr>
            ) : (
              products.map((p) => (
                <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.75rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <img
                      src={p.imageUrl || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=80'}
                      alt={p.name}
                      style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: '0.25rem', border: '1px solid #e2e8f0' }}
                    />
                    <div>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{p.name}</div>
                      <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>{p.brand && `${p.brand} • `}{p.unit}</div>
                    </div>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace' }}>
                    <div>{p.sku}</div>
                    {p.barcode && <div style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>BC: {p.barcode}</div>}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>{p.categoryName}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#64748b' }}>{currencySymbol} {p.purchaseCost.toFixed(2)}</td>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>
                    {currencySymbol} {p.effectivePrice.toFixed(2)}
                    {p.discountPrice && (
                      <span style={{ fontSize: '0.6875rem', color: '#94a3b8', textDecoration: 'line-through', marginLeft: '0.25rem' }}>
                        {currencySymbol} {p.sellingPrice.toFixed(2)}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span className={`badge ${p.stockQuantity <= 0 ? 'badge-danger' : p.stockQuantity <= p.reorderThreshold ? 'badge-warning' : 'badge-success'}`}>
                      {p.stockQuantity} {p.unit}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span className={`badge ${p.isActive ? 'badge-success' : 'badge-danger'}`}>
                      {p.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 1.25rem', textAlign: 'right' }}>
                    <button onClick={() => openEditModal(p)} style={{ color: '#2563eb', marginRight: '0.75rem' }} title="Edit">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDeleteProduct(p.id)} style={{ color: '#ef4444' }} title="Delete">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Product Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>

            {errorMsg && (
              <div style={{ backgroundColor: '#fee2e2', border: '1px solid #fecaca', color: '#991b1b', padding: '0.75rem', borderRadius: '0.375rem', marginBottom: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.8125rem' }}>
                <AlertCircle size={16} /> {errorMsg}
              </div>
            )}

            <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>SKU *</label>
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.25rem' }}
                  />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Barcode (EAN/UPC)</label>
                    <button
                      type="button"
                      onClick={() => setShowBarcodeScanner(true)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        background: 'none',
                        border: 'none',
                        color: '#2563eb',
                        fontWeight: 600,
                        fontSize: '0.6875rem',
                        cursor: 'pointer',
                        padding: 0
                      }}
                    >
                      <Camera size={13} /> Camera Scan
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: '0.375rem' }}>
                    <input
                      type="text"
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                      placeholder="e.g. 896101400101"
                      style={{ flex: 1, padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.25rem', fontSize: '0.8125rem' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowBarcodeScanner(true)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0.5rem 0.625rem',
                        backgroundColor: '#eff6ff',
                        color: '#2563eb',
                        border: '1px solid #bfdbfe',
                        borderRadius: '0.25rem',
                        cursor: 'pointer'
                      }}
                      title="Open device camera barcode scanner"
                    >
                      <Scan size={16} />
                    </button>
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: '#64748b', marginTop: '0.25rem' }}>
                    Point camera or trigger barcode scanner gun
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Product Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.25rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Category *</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.25rem' }}
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Brand</label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.25rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Unit</label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="pcs, kg, box"
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.25rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Purchase Cost ({currencySymbol})</label>
                  <input
                    type="number"
                    step="0.01"
                    value={purchaseCost}
                    onChange={(e) => setPurchaseCost(parseFloat(e.target.value) || 0)}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.25rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Selling Price ({currencySymbol}) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(parseFloat(e.target.value) || 0)}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.25rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Discount Price ({currencySymbol})</label>
                  <input
                    type="number"
                    step="0.01"
                    value={discountPrice}
                    onChange={(e) => setDiscountPrice(e.target.value)}
                    placeholder="Optional"
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.25rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Initial Stock</label>
                  <input
                    type="number"
                    disabled={!!editingProduct}
                    value={initialStock}
                    onChange={(e) => setInitialStock(parseInt(e.target.value, 10) || 0)}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.25rem' }}
                  />
                  {editingProduct && (
                    <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>Use Inventory Adjustments to alter existing stock.</div>
                  )}
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Reorder Threshold</label>
                  <input
                    type="number"
                    value={reorderThreshold}
                    onChange={(e) => setReorderThreshold(parseInt(e.target.value, 10) || 0)}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.25rem' }}
                  />
                </div>
              </div>

              <ImagePicker
                label="Product Image"
                value={imageUrl}
                onChange={setImageUrl}
                recommendedText="Select from gallery/camera or paste web link (Auto-compressed)"
                maxDimension={800}
              />

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                  Industry Attributes (JSON - e.g. Color, Size, Expiry, Dosage)
                </label>
                <textarea
                  rows={2}
                  value={attributesJson}
                  onChange={(e) => setAttributesJson(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.25rem', fontFamily: 'monospace', fontSize: '0.75rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '2rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem' }}>
                  <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                  Active in Catalog
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem' }}>
                  <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} />
                  Featured on Home Page
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn btn-primary">
                  {saving ? 'Saving...' : editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Camera Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={showBarcodeScanner}
        onClose={() => setShowBarcodeScanner(false)}
        onScan={(scannedCode) => {
          if (showModal) {
            setBarcode(scannedCode);
          } else {
            setSearch(scannedCode);
          }
        }}
        title={showModal ? 'Scan Product Barcode' : 'Scan to Find Product'}
      />
    </div>
  );
};
