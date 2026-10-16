import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Filter, Search, RotateCcw } from 'lucide-react';
import { Product, Category, PagedResponse, ApiResponse } from '../../types';
import { apiClient } from '../../api/client';
import { useCart } from '../../context/CartContext';

export const CatalogPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pageInfo, setPageInfo] = useState({ pageNumber: 1, pageSize: 12, totalCount: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // Filters
  const search = searchParams.get('search') || '';
  const selectedCat = searchParams.get('category') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const inStockOnly = searchParams.get('inStock') === 'true';
  const sortBy = searchParams.get('sortBy') || 'created';
  const sortDir = searchParams.get('sortDir') || 'desc';
  const page = parseInt(searchParams.get('page') || '1', 10);

  const { addToCart } = useCart();

  useEffect(() => {
    apiClient.get<ApiResponse<Category[]>>('/categories')
      .then((res) => {
        if (res.data.success) setCategories(res.data.data || []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.append('searchTerm', search);
    if (selectedCat) params.append('categoryId', selectedCat);
    if (minPrice) params.append('minPrice', minPrice);
    if (maxPrice) params.append('maxPrice', maxPrice);
    if (inStockOnly) params.append('inStockOnly', 'true');
    if (sortBy) {
      params.append('sortBy', sortBy);
      params.append('sortDirection', sortDir);
    }
    params.append('pageNumber', page.toString());
    params.append('pageSize', '12');

    apiClient.get<ApiResponse<PagedResponse<Product>>>(`/products?${params.toString()}`)
      .then((res) => {
        if (res.data.success && res.data.data) {
          setProducts(res.data.data.items);
          setPageInfo({
            pageNumber: res.data.data.pageNumber,
            pageSize: res.data.data.pageSize,
            totalCount: res.data.data.totalCount,
            totalPages: res.data.data.totalPages,
          });
        }
      })
      .finally(() => setLoading(false));
  }, [searchParams]);

  const updateParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    if (key !== 'page') {
      next.set('page', '1');
    }
    setSearchParams(next);
  };

  const handleSortChange = (combinedVal: string) => {
    const [sb, sd] = combinedVal.split('-');
    const next = new URLSearchParams(searchParams);
    if (sb) {
      next.set('sortBy', sb);
    } else {
      next.delete('sortBy');
    }
    if (sd) {
      next.set('sortDir', sd);
    } else {
      next.delete('sortDir');
    }
    next.set('page', '1');
    setSearchParams(next);
  };

  const handleResetFilters = () => {
    setSearchParams({});
  };

  return (
    <div className="container" style={{ padding: '2rem 1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>Product Catalog</h1>
          <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
            Showing {products.length} of {pageInfo.totalCount} items
          </p>
        </div>

        {/* Sorting Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Sort:</span>
          <select
            value={`${sortBy}-${sortDir}`}
            onChange={(e) => handleSortChange(e.target.value)}
            style={{
              padding: '0.5rem 0.75rem',
              borderRadius: '0.375rem',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              fontSize: '0.875rem',
              cursor: 'pointer',
            }}
          >
            <option value="created-desc">Newest First</option>
            <option value="created-asc">Oldest First</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="name-asc">Alphabetical (A - Z)</option>
            <option value="name-desc">Alphabetical (Z - A)</option>
          </select>
        </div>
      </div>

      <div className="catalog-layout" style={{ gap: '2rem', alignItems: 'start' }}>
        {/* Filters Sidebar */}
        <aside className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
            <span style={{ fontWeight: 700, fontSize: '0.9375rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Filter size={16} /> Filters
            </span>
            <button onClick={handleResetFilters} style={{ fontSize: '0.75rem', color: '#2563eb', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <RotateCcw size={12} /> Reset
            </button>
          </div>

          {/* Search */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
              Search Keywords
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="SKU, Name, Barcode..."
                defaultValue={search}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    updateParam('search', (e.target as HTMLInputElement).value || null);
                  }
                }}
                style={{ width: '100%', padding: '0.5rem 2rem 0.5rem 0.75rem', fontSize: '0.8125rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem' }}
              />
              <Search size={14} style={{ position: 'absolute', right: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            </div>
          </div>

          {/* Categories */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
              Category
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              <button
                onClick={() => updateParam('category', null)}
                style={{
                  textAlign: 'left',
                  fontSize: '0.8125rem',
                  fontWeight: !selectedCat ? 700 : 500,
                  color: !selectedCat ? '#2563eb' : '#334155',
                  padding: '0.25rem 0',
                }}
              >
                All Categories
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => updateParam('category', c.id)}
                  style={{
                    textAlign: 'left',
                    fontSize: '0.8125rem',
                    fontWeight: selectedCat === c.id ? 700 : 500,
                    color: selectedCat === c.id ? '#2563eb' : '#475569',
                    padding: '0.25rem 0',
                  }}
                >
                  {c.name} ({c.productCount})
                </button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
              Price Range (Rs.)
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="number"
                placeholder="Min"
                defaultValue={minPrice}
                onBlur={(e) => updateParam('minPrice', e.target.value || null)}
                style={{ width: '50%', padding: '0.375rem', fontSize: '0.8125rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem' }}
              />
              <input
                type="number"
                placeholder="Max"
                defaultValue={maxPrice}
                onBlur={(e) => updateParam('maxPrice', e.target.value || null)}
                style={{ width: '50%', padding: '0.375rem', fontSize: '0.8125rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem' }}
              />
            </div>
          </div>

          {/* Availability */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => updateParam('inStock', e.target.checked ? 'true' : null)}
              />
              <span>In-Stock Only</span>
            </label>
          </div>
        </aside>

        {/* Product Grid Area */}
        <div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>Loading products...</div>
          ) : products.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.5rem' }}>No products match your criteria</h3>
              <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1.5rem' }}>Try clearing or relaxing your search keywords or price filters.</p>
              <button onClick={handleResetFilters} className="btn btn-secondary">
                Reset All Filters
              </button>
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.5rem' }}>
                {products.map((p) => (
                  <div key={p.id} className="card" style={{ display: 'flex', flexDirection: 'column', padding: '1rem' }}>
                    <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
                      <img
                        src={p.imageUrl || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400'}
                        alt={p.name}
                        style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: '0.5rem' }}
                      />
                      {p.discountPrice && (
                        <span className="badge badge-danger" style={{ position: 'absolute', top: '0.5rem', left: '0.5rem' }}>
                          SALE
                        </span>
                      )}
                      {p.stockQuantity <= 0 ? (
                        <span className="badge badge-warning" style={{ position: 'absolute', top: '0.5rem', right: '0.5rem' }}>
                          Out of Stock
                        </span>
                      ) : p.stockQuantity <= p.reorderThreshold ? (
                        <span className="badge badge-warning" style={{ position: 'absolute', top: '0.5rem', right: '0.5rem' }}>
                          Low Stock ({p.stockQuantity})
                        </span>
                      ) : null}
                    </div>

                    <div style={{ fontSize: '0.6875rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                      {p.categoryName} {p.brand && `• ${p.brand}`}
                    </div>

                    <Link
                      to={`/product/${p.id}`}
                      style={{
                        fontSize: '0.875rem',
                        fontWeight: 700,
                        color: '#0f172a',
                        margin: '0.25rem 0 0.5rem',
                        lineHeight: 1.3,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {p.name}
                    </Link>

                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.75rem' }}>
                      SKU: <span style={{ fontFamily: 'monospace' }}>{p.sku}</span>
                    </div>

                    <div style={{ marginTop: 'auto', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontSize: '1.0625rem', fontWeight: 800, color: '#0f172a' }}>
                          Rs. {p.effectivePrice.toFixed(2)}
                        </span>
                        {p.discountPrice && (
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8', textDecoration: 'line-through', marginLeft: '0.375rem' }}>
                            Rs. {p.sellingPrice.toFixed(2)}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => addToCart(p, 1)}
                        disabled={p.stockQuantity <= 0}
                        className="btn btn-primary"
                        style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem', opacity: p.stockQuantity <= 0 ? 0.5 : 1 }}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pageInfo.totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '2.5rem' }}>
                  {Array.from({ length: pageInfo.totalPages }, (_, i) => i + 1).map((pg) => (
                    <button
                      key={pg}
                      onClick={() => updateParam('page', pg.toString())}
                      className="btn"
                      style={{
                        padding: '0.5rem 0.875rem',
                        fontSize: '0.8125rem',
                        backgroundColor: page === pg ? '#2563eb' : '#ffffff',
                        color: page === pg ? '#ffffff' : '#334155',
                        border: '1px solid #cbd5e1',
                      }}
                    >
                      {pg}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
