import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Button } from '../components/ui/button';
import { useCart } from '../App';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Heart } from 'lucide-react';

export const CartPage = () => {
  const { cart, loading, updateQuantity, clearCart, moveToWishlist } = useCart();
  const navigate = useNavigate();

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(price);
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

  const CartItem = ({ item }) => (
    <div className="flex gap-6 p-6 bg-[#F5F5F7] rounded-2xl" data-testid={`cart-item-${item.product_id}`}>
      <Link to={`/product/${item.product_id}`} className="shrink-0">
        <div className="w-24 h-24 md:w-32 md:h-32 rounded-xl overflow-hidden bg-white">
          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
        </div>
      </Link>
      <div className="flex-1 min-w-0">
        <Link to={`/product/${item.product_id}`}>
          <h3 className="font-medium text-[#1D1D1F] hover:text-[#0071E3] transition-colors truncate">{item.name}</h3>
        </Link>
        <p className="mt-1 text-lg font-semibold text-[#1D1D1F]">{formatPrice(item.price)}</p>
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
              className="p-2 border border-gray-300 rounded-full hover:bg-white transition-colors"
              data-testid={`decrease-${item.product_id}`}
            >
              <Minus className="h-4 w-4" strokeWidth={1.5} />
            </button>
            <span className="font-medium w-8 text-center">{item.quantity}</span>
            <button
              onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
              className="p-2 border border-gray-300 rounded-full hover:bg-white transition-colors"
              data-testid={`increase-${item.product_id}`}
            >
              <Plus className="h-4 w-4" strokeWidth={1.5} />
            </button>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => moveToWishlist(item.product_id)}
              className="p-2 text-[#86868B] hover:text-red-500 transition-colors"
              title="Move to Wishlist"
              data-testid={`move-to-wishlist-${item.product_id}`}
            >
              <Heart className="h-5 w-5" strokeWidth={1.5} />
            </button>
            <button
              onClick={() => updateQuantity(item.product_id, 0)}
              className="p-2 text-[#86868B] hover:text-red-500 transition-colors"
              title="Remove"
              data-testid={`remove-${item.product_id}`}
            >
              <Trash2 className="h-5 w-5" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col" data-testid="cart-page">
      <Header />
      <main className="flex-1 bg-white">
        <div className="container mx-auto px-4 md:px-6 py-8 md:py-16">
          <h1 className="font-heading text-3xl md:text-5xl font-bold tracking-tight text-[#1D1D1F] mb-8">Shopping Cart</h1>
          {cart.items.length === 0 ? (
            <div className="text-center py-16">
              <ShoppingBag className="mx-auto h-16 w-16 text-[#86868B] mb-4" strokeWidth={1} />
              <p className="text-[#86868B] text-lg mb-6">Your cart is empty</p>
              <Link to="/products">
                <Button className="bg-black text-white hover:bg-gray-800 rounded-full px-8" data-testid="continue-shopping-btn">
                  Continue Shopping <ArrowRight className="ml-2 h-4 w-4" strokeWidth={1.5} />
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-16">
              <div className="lg:col-span-2 space-y-6">
                {cart.items.map((item) => <CartItem key={item.product_id} item={item} />)}
                <button onClick={clearCart} className="text-[#86868B] hover:text-red-500 text-sm font-medium transition-colors" data-testid="clear-cart-btn">Clear Cart</button>
              </div>
              <div className="lg:col-span-1">
                <div className="sticky top-24 bg-[#F5F5F7] rounded-3xl p-8" data-testid="order-summary">
                  <h2 className="font-heading text-xl font-semibold mb-6">Order Summary</h2>
                  <div className="space-y-4">
                    <div className="flex justify-between text-[#86868B]"><span>Subtotal</span><span>{formatPrice(cart.subtotal)}</span></div>
                    <div className="flex justify-between text-[#86868B]"><span>Shipping</span><span>{formatPrice(cart.shipping)}</span></div>
                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex justify-between text-lg font-semibold text-[#1D1D1F]">
                        <span>Total</span><span data-testid="cart-total">{formatPrice(cart.total)}</span>
                      </div>
                    </div>
                  </div>
                  <Button onClick={() => navigate('/checkout')} className="w-full mt-8 bg-black text-white hover:bg-gray-800 rounded-full py-6 text-base font-medium" data-testid="checkout-btn">
                    Proceed to Checkout <ArrowRight className="ml-2 h-5 w-5" strokeWidth={1.5} />
                  </Button>
                  <p className="mt-4 text-center text-sm text-[#86868B]">Secure checkout powered by Stripe</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};
