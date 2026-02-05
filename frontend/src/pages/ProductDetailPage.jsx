import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Button } from '../components/ui/button';
import { useCart, useAuth, API } from '../App';
import { ShoppingBag, Truck, Shield, ChevronLeft, Minus, Plus, Heart } from 'lucide-react';
import { toast } from 'sonner';

export const ProductDetailPage = () => {
  const { productId } = useParams();
  const { user, getAuthHeaders } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [inWishlist, setInWishlist] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const { addToCart, addToWishlist, removeFromWishlist, fetchWishlistCount, wishlist } = useCart();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await axios.get(`${API}/products/${productId}`);
        setProduct(response.data);
      } catch (error) {
        console.error('Failed to fetch product:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  // Check wishlist status from context
  useEffect(() => {
    if (wishlist?.items && user) {
      const inList = wishlist.items.some(item => item.product_id === productId);
      setInWishlist(inList);
    } else {
      setInWishlist(false);
    }
  }, [wishlist, productId, user]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(price);
  };

  const handleAddToCart = async () => {
    setAdding(true);
    const success = await addToCart(product.product_id, quantity);
    if (success) {
      setQuantity(1);
    }
    setAdding(false);
  };

  const toggleWishlist = async () => {
    if (!user) {
      toast.error('Please login to add to wishlist');
      return;
    }
    
    setWishlistLoading(true);
    try {
      if (inWishlist) {
        // Remove from wishlist
        await removeFromWishlist(productId);
      } else {
        // Add to wishlist
        await addToWishlist(productId);
      }
    } catch (error) {
      console.error('Wishlist toggle error:', error);
    } finally {
      setWishlistLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center">
          <p className="text-[#86868B] text-lg mb-4">Product not found</p>
          <Link to="/products">
            <Button variant="outline" className="rounded-full">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Products
            </Button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" data-testid="product-detail-page">
      <Header />
      
      <main className="flex-1 bg-white">
        {/* Breadcrumb */}
        <div className="container mx-auto px-4 md:px-6 py-4">
          <Link to="/products" className="inline-flex items-center text-[#86868B] hover:text-[#1D1D1F] transition-colors text-sm">
            <ChevronLeft className="mr-1 h-4 w-4" strokeWidth={1.5} />
            Back to Products
          </Link>
        </div>

        {/* Product Detail */}
        <section className="py-8 md:py-16">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
              {/* Product Image */}
              <div className="lg:sticky lg:top-24 lg:self-start">
                <div className="bg-[#F5F5F7] rounded-3xl overflow-hidden aspect-square relative">
                  <img 
                    src={product.images[0]} 
                    alt={product.name}
                    className="w-full h-full object-cover"
                    data-testid="product-image"
                  />
                  {/* Wishlist Button */}
                  <button
                    onClick={toggleWishlist}
                    disabled={wishlistLoading}
                    className={`absolute top-4 right-4 p-3 rounded-full transition-all ${
                      inWishlist ? 'bg-red-500 text-white' : 'bg-white text-[#1D1D1F] hover:bg-gray-100'
                    } shadow-lg`}
                    data-testid="wishlist-btn"
                  >
                    <Heart className={`h-5 w-5 ${inWishlist ? 'fill-current' : ''}`} strokeWidth={1.5} />
                  </button>
                </div>
              </div>

              {/* Product Info */}
              <div className="space-y-8">
                <div>
                  {product.featured && (
                    <span className="inline-block bg-black text-white text-xs font-medium px-3 py-1 rounded-full mb-4">
                      Featured
                    </span>
                  )}
                  <h1 className="font-heading text-3xl md:text-5xl font-bold tracking-tight text-[#1D1D1F]" data-testid="product-name">
                    {product.name}
                  </h1>
                  <p className="mt-4 text-3xl font-semibold text-[#1D1D1F]" data-testid="product-price">
                    {formatPrice(product.price)}
                  </p>
                </div>

                <p className="text-lg text-[#86868B] leading-relaxed" data-testid="product-description">
                  {product.description}
                </p>

                {/* Quantity Selector */}
                <div className="space-y-4">
                  <p className="font-medium text-[#1D1D1F]">Quantity</p>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-3 border border-gray-200 rounded-full hover:bg-gray-50 transition-colors"
                      data-testid="decrease-qty"
                    >
                      <Minus className="h-4 w-4" strokeWidth={1.5} />
                    </button>
                    <span className="text-xl font-medium w-12 text-center" data-testid="quantity-display">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                      className="p-3 border border-gray-200 rounded-full hover:bg-gray-50 transition-colors"
                      data-testid="increase-qty"
                      disabled={quantity >= product.stock}
                    >
                      <Plus className="h-4 w-4" strokeWidth={1.5} />
                    </button>
                  </div>
                </div>

                {/* Add to Cart */}
                <div className="flex gap-4">
                  <Button
                    onClick={handleAddToCart}
                    disabled={adding || product.stock === 0}
                    className="flex-1 bg-black text-white hover:bg-gray-800 rounded-full py-7 text-lg font-medium transition-transform duration-300 hover:scale-[1.02]"
                    data-testid="add-to-cart-btn"
                  >
                    {adding ? (
                      <span className="flex items-center">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Adding...
                      </span>
                    ) : product.stock === 0 ? (
                      'Out of Stock'
                    ) : (
                      <>
                        <ShoppingBag className="mr-2 h-5 w-5" strokeWidth={1.5} />
                        Add to Cart
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={toggleWishlist}
                    disabled={wishlistLoading}
                    variant="outline"
                    className={`px-6 py-7 rounded-full ${inWishlist ? 'border-red-500 text-red-500' : ''}`}
                    data-testid="wishlist-btn-secondary"
                  >
                    <Heart className={`h-5 w-5 ${inWishlist ? 'fill-red-500' : ''}`} strokeWidth={1.5} />
                  </Button>
                </div>

                {/* Features */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-8 border-t border-gray-100">
                  <div className="flex items-center space-x-3 p-4 bg-[#F5F5F7] rounded-xl">
                    <Truck className="h-5 w-5 text-[#1D1D1F]" strokeWidth={1.5} />
                    <div>
                      <p className="font-medium text-[#1D1D1F]">Fast Shipping</p>
                      <p className="text-sm text-[#86868B]">₹100 flat rate</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-4 bg-[#F5F5F7] rounded-xl">
                    <Shield className="h-5 w-5 text-[#1D1D1F]" strokeWidth={1.5} />
                    <div>
                      <p className="font-medium text-[#1D1D1F]">Secure Payment</p>
                      <p className="text-sm text-[#86868B]">Stripe protected</p>
                    </div>
                  </div>
                </div>

                {/* Stock Info */}
                <p className={`text-sm ${product.stock > 0 ? 'text-[#86868B]' : 'text-red-500'}`}>
                  {product.stock > 0 ? (
                    <>In stock: {product.stock} units available</>
                  ) : (
                    <span className="font-medium">Out of stock</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};