import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingBag, ArrowLeft, CheckCircle, AlertTriangle, Star, MessageSquare, Send, Lock } from 'lucide-react';
import { Product, ProductReview, ApiResponse } from '../../types';
import { apiClient } from '../../api/client';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);

  // Review form state
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const [currencySymbol, setCurrencySymbol] = useState('Rs.');
  const { addToCart } = useCart();
  const { user, isAuthenticated } = useAuth();

  const fetchProductAndReviews = async () => {
    if (!id) return;
    setLoading(true);

    let resolvedProduct: Product | null = null;

    // 1. Fetch product by ID
    try {
      const prodRes = await apiClient.get<ApiResponse<Product>>(`/products/${id}`);
      if (prodRes.data?.success && prodRes.data.data) {
        resolvedProduct = prodRes.data.data;
      }
    } catch {
      // 2. Fallback: Lookup by SKU
      try {
        const skuRes = await apiClient.get<ApiResponse<Product>>(`/products/sku/${encodeURIComponent(id)}`);
        if (skuRes.data?.success && skuRes.data.data) {
          resolvedProduct = skuRes.data.data;
        }
      } catch {
        // 3. Fallback: Lookup by Barcode
        try {
          const bcRes = await apiClient.get<ApiResponse<Product>>(`/products/barcode/${encodeURIComponent(id)}`);
          if (bcRes.data?.success && bcRes.data.data) {
            resolvedProduct = bcRes.data.data;
          }
        } catch {
          // 4. Fallback: Search in product catalog
          try {
            const searchRes = await apiClient.get<ApiResponse<{ items: Product[] }>>(`/products?searchTerm=${encodeURIComponent(id)}`);
            if (searchRes.data?.success && searchRes.data.data?.items?.length > 0) {
              resolvedProduct = searchRes.data.data.items[0];
            }
          } catch {
            // Not found
          }
        }
      }
    }

    setProduct(resolvedProduct);
    setLoading(false);

    // Fetch business profile for currency symbol
    apiClient.get<ApiResponse<any>>('/businesssettings')
      .then((res) => {
        if (res.data?.success && res.data.data?.currencySymbol) {
          setCurrencySymbol(res.data.data.currencySymbol);
        }
      })
      .catch(() => {});

    // Resiliently fetch reviews using the resolved product GUID
    if (resolvedProduct?.id) {
      try {
        const revRes = await apiClient.get<ApiResponse<ProductReview[]>>(`/products/${resolvedProduct.id}/reviews`);
        if (revRes.data?.success && revRes.data.data) {
          setReviews(revRes.data.data);
        }
      } catch (err) {
        console.warn('Reviews could not be loaded:', err);
      }
    }
  };

  useEffect(() => {
    fetchProductAndReviews();
  }, [id]);

  if (loading) {
    return (
      <div className="container" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
        <p style={{ color: '#64748b', fontSize: '1rem' }}>Loading product details & reviews...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem' }}>
          Product Not Found
        </h2>
        <p style={{ color: '#64748b', fontSize: '0.9375rem', maxWidth: 460, margin: '0 auto 1.5rem' }}>
          This item may have been updated, relocated, or temporarily unlisted. Check our latest catalog items below.
        </p>
        <Link to="/catalog" className="btn btn-primary" style={{ display: 'inline-flex', padding: '0.625rem 1.5rem' }}>
          Browse Product Catalog →
        </Link>
      </div>
    );
  }

  let attributes: Record<string, string> = {};
  if (product.attributesJson) {
    try {
      attributes = JSON.parse(product.attributesJson);
    } catch {
      attributes = {};
    }
  }

  const handleAddToCart = () => {
    addToCart(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !comment.trim() || !isAuthenticated) return;
    setSubmittingReview(true);
    setReviewError(null);
    try {
      const res = await apiClient.post<ApiResponse<ProductReview>>(
        `/products/${product.id}/reviews`,
        {
          rating,
          comment: comment.trim(),
        }
      );

      if (res.data.success) {
        setReviewSuccess(true);
        setComment('');
        fetchProductAndReviews();
        setTimeout(() => setReviewSuccess(false), 3000);
      }
    } catch (err: any) {
      setReviewError(err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const averageRating = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : (product.averageRating || 5.0).toFixed(1);

  return (
    <div className="container" style={{ padding: '2rem 1.5rem' }}>
      <Link to="/catalog" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
        <ArrowLeft size={16} /> Back to Catalog
      </Link>

      <div className="card" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '3rem', padding: '2rem' }}>
        {/* Product Image */}
        <div>
          <img
            src={product.imageUrl || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800'}
            alt={product.name}
            style={{ width: '100%', height: 400, objectFit: 'cover', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}
          />
        </div>

        {/* Product Information */}
        <div>
          <div style={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            {product.categoryName} {product.brand && `• ${product.brand}`}
          </div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2, marginBottom: '0.5rem' }}>
            {product.name}
          </h1>

          {/* Review Stars Summary */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', color: '#eab308' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={16}
                  fill={star <= Math.round(Number(averageRating)) ? '#eab308' : 'none'}
                />
              ))}
            </div>
            <a
              href="#reviews"
              style={{ fontSize: '0.8125rem', color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}
            >
              ({reviews.length} customer reviews) • Write a Review ↓
            </a>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a' }}>
              {currencySymbol} {product.effectivePrice.toFixed(2)}
            </span>
            {product.discountPrice && (
              <span style={{ fontSize: '1.25rem', color: '#94a3b8', textDecoration: 'line-through' }}>
                {currencySymbol} {product.sellingPrice.toFixed(2)}
              </span>
            )}
            <span style={{ fontSize: '0.875rem', color: '#64748b' }}>/ {product.unit}</span>
          </div>

          <p style={{ color: '#475569', fontSize: '0.9375rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            {product.description || 'No description provided.'}
          </p>

          {/* Extensible Industry Attributes */}
          {Object.keys(attributes).length > 0 && (
            <div style={{ marginBottom: '1.5rem', backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', marginBottom: '0.5rem' }}>
                Specifications & Attributes
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', fontSize: '0.8125rem' }}>
                {Object.entries(attributes).map(([k, v]) => (
                  <div key={k}>
                    <span style={{ color: '#64748b' }}>{k}: </span>
                    <strong style={{ color: '#0f172a' }}>{v}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stock availability */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            {product.stockQuantity > 0 ? (
              <span className="badge badge-success" style={{ gap: '0.25rem' }}>
                <CheckCircle size={14} /> In Stock ({product.stockQuantity} available)
              </span>
            ) : (
              <span className="badge badge-danger" style={{ gap: '0.25rem' }}>
                <AlertTriangle size={14} /> Out of Stock
              </span>
            )}
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace' }}>
              SKU: {product.sku}
            </span>
          </div>

          {/* Add to cart section */}
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: '0.5rem', backgroundColor: '#ffffff' }}>
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                style={{ padding: '0.625rem 0.875rem', fontWeight: 700, fontSize: '1rem' }}
              >
                -
              </button>
              <span style={{ padding: '0 0.75rem', fontWeight: 600, minWidth: 32, textAlign: 'center' }}>
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(Math.min(product.stockQuantity, quantity + 1))}
                style={{ padding: '0.625rem 0.875rem', fontWeight: 700, fontSize: '1rem' }}
                disabled={product.stockQuantity <= quantity}
              >
                +
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={product.stockQuantity <= 0}
              className="btn btn-primary"
              style={{ flex: 1, padding: '0.75rem 1.5rem', fontSize: '0.9375rem', opacity: product.stockQuantity <= 0 ? 0.5 : 1 }}
            >
              <ShoppingBag size={18} />
              {added ? 'Added to Cart!' : 'Add to Cart'}
            </button>
          </div>
        </div>
      </div>

      {/* Customer Reviews Section */}
      <div id="reviews" style={{ marginTop: '3rem', scrollMarginTop: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <MessageSquare size={22} color="#2563eb" />
          <h2 style={{ fontSize: '1.375rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Customer Reviews & Ratings
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
          {/* Write a review form */}
          <div className="card">
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1rem', color: '#0f172a' }}>
              Leave a Review
            </h3>

            {reviewSuccess && (
              <div style={{ backgroundColor: '#ecfdf5', color: '#065f46', padding: '0.75rem', borderRadius: '0.375rem', marginBottom: '1rem', fontSize: '0.8125rem' }}>
                ✓ Thank you! Your review has been added.
              </div>
            )}
            {reviewError && (
              <div style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '0.75rem', borderRadius: '0.375rem', marginBottom: '1rem', fontSize: '0.8125rem' }}>
                {reviewError}
              </div>
            )}

            {!isAuthenticated ? (
              <div style={{ padding: '2rem 1.25rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem', border: '1px dashed #cbd5e1', textAlign: 'center' }}>
                <div style={{ width: 44, height: 44, borderRadius: '9999px', backgroundColor: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem' }}>
                  <Lock size={20} />
                </div>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.35rem' }}>
                  Customer Sign-In Required
                </h4>
                <p style={{ fontSize: '0.8125rem', color: '#64748b', maxWidth: 300, margin: '0 auto 1.25rem', lineHeight: 1.5 }}>
                  Only verified, signed-in customers can submit reviews and ratings for products.
                </p>
                <Link
                  to={`/login?redirect=/product/${product.id}#reviews`}
                  className="btn btn-primary"
                  style={{ display: 'inline-flex', padding: '0.5rem 1.25rem', fontSize: '0.8125rem' }}
                >
                  Sign In to Write a Review →
                </Link>
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ fontSize: '0.8125rem', color: '#475569', backgroundColor: '#f1f5f9', padding: '0.5rem 0.75rem', borderRadius: '0.375rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>Reviewing as:</span> <strong style={{ color: '#0f172a' }}>{user?.fullName}</strong> <span style={{ color: '#94a3b8' }}>({user?.email})</span>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem', color: '#475569' }}>
                    Rating
                  </label>
                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        type="button"
                        key={s}
                        onClick={() => setRating(s)}
                        style={{ background: 'none', border: 'none', padding: 2, cursor: 'pointer', color: '#eab308' }}
                      >
                        <Star size={24} fill={s <= rating ? '#eab308' : 'none'} />
                      </button>
                    ))}
                    <span style={{ fontSize: '0.875rem', fontWeight: 700, marginLeft: '0.5rem', color: '#334155' }}>
                      {rating} / 5 Stars
                    </span>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem', color: '#475569' }}>
                    Your Feedback & Experience *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Tell other shoppers how this product performed..."
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem', fontSize: '0.8125rem', resize: 'vertical' }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingReview}
                  className="btn btn-primary"
                  style={{ alignSelf: 'flex-start', padding: '0.5rem 1.25rem', gap: '0.35rem' }}
                >
                  <Send size={15} /> {submittingReview ? 'Submitting...' : 'Post Review'}
                </button>
              </form>
            )}
          </div>

          {/* List of Reviews */}
          <div className="card">
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1rem', color: '#0f172a' }}>
              Shopper Feedback ({reviews.length})
            </h3>

            {reviews.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: '0.875rem', fontStyle: 'italic' }}>
                No reviews yet. Be the first to review this product!
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: 380, overflowY: 'auto' }}>
                {reviews.map((r) => (
                  <div key={r.id} style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '0.875rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f172a' }}>{r.customerName}</span>
                      <div style={{ display: 'flex', color: '#eab308' }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} size={13} fill={star <= r.rating ? '#eab308' : 'none'} />
                        ))}
                      </div>
                    </div>
                    <p style={{ fontSize: '0.8125rem', color: '#475569', lineHeight: 1.5, margin: 0 }}>
                      {r.comment}
                    </p>
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginTop: '0.25rem' }}>
                      {new Date(r.createdAtUtc).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
