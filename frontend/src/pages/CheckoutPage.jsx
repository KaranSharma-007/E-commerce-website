import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useCart, useAuth, API } from '../App';
import { toast } from 'sonner';
import { ChevronLeft, Lock } from 'lucide-react';

export const CheckoutPage = () => {
  const { cart } = useCart();
  const { getAuthHeaders } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '', phone: '', address_line1: '', address_line2: '', city: '', state: '', pincode: ''
  });

  useEffect(() => {
    if (cart.items.length === 0) navigate('/cart');
  }, [cart.items, navigate]);

  const formatPrice = (price) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(price);
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const required = ['full_name', 'phone', 'address_line1', 'city', 'state', 'pincode'];
    for (const field of required) {
      if (!formData[field]) { toast.error(`Please fill in ${field.replace('_', ' ')}`); return; }
    }
    setLoading(true);
    try {
      const orderResponse = await axios.post(`${API}/orders`, { shipping_address: formData }, { withCredentials: true, headers: getAuthHeaders() });
      const checkoutResponse = await axios.post(`${API}/checkout/create-session`, { order_id: orderResponse.data.order_id, origin_url: window.location.origin }, { withCredentials: true, headers: getAuthHeaders() });
      window.location.href = checkoutResponse.data.url;
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to process checkout');
      setLoading(false);
    }
  };

  const CartSummaryItem = ({ item }) => (
    <div className="flex gap-4">
      <div className="w-16 h-16 rounded-lg overflow-hidden bg-white shrink-0">
        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-[#1D1D1F] truncate">{item.name}</p>
        <p className="text-sm text-[#86868B]">Qty: {item.quantity}</p>
      </div>
      <p className="font-medium text-[#1D1D1F] shrink-0">{formatPrice(item.price * item.quantity)}</p>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-white" data-testid="checkout-page">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 md:px-6 py-8 md:py-16">
          <button onClick={() => navigate('/cart')} className="inline-flex items-center text-[#86868B] hover:text-[#1D1D1F] transition-colors text-sm mb-8">
            <ChevronLeft className="mr-1 h-4 w-4" strokeWidth={1.5} /> Back to Cart
          </button>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
            <div>
              <h1 className="font-heading text-3xl font-bold tracking-tight text-[#1D1D1F] mb-8">Shipping Information</h1>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="full_name" className="text-sm font-medium text-[#1D1D1F]">Full Name *</Label>
                  <Input id="full_name" name="full_name" value={formData.full_name} onChange={handleChange} className="mt-2 h-12 rounded-lg" placeholder="John Doe" data-testid="input-full-name" />
                </div>
                <div>
                  <Label htmlFor="phone" className="text-sm font-medium text-[#1D1D1F]">Phone Number *</Label>
                  <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} className="mt-2 h-12 rounded-lg" placeholder="+91 98765 43210" data-testid="input-phone" />
                </div>
                <div>
                  <Label htmlFor="address_line1" className="text-sm font-medium text-[#1D1D1F]">Address Line 1 *</Label>
                  <Input id="address_line1" name="address_line1" value={formData.address_line1} onChange={handleChange} className="mt-2 h-12 rounded-lg" placeholder="House/Flat No., Street" data-testid="input-address1" />
                </div>
                <div>
                  <Label htmlFor="address_line2" className="text-sm font-medium text-[#1D1D1F]">Address Line 2</Label>
                  <Input id="address_line2" name="address_line2" value={formData.address_line2} onChange={handleChange} className="mt-2 h-12 rounded-lg" placeholder="Landmark (Optional)" data-testid="input-address2" />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="city" className="text-sm font-medium text-[#1D1D1F]">City *</Label>
                    <Input id="city" name="city" value={formData.city} onChange={handleChange} className="mt-2 h-12 rounded-lg" placeholder="Mumbai" data-testid="input-city" />
                  </div>
                  <div>
                    <Label htmlFor="state" className="text-sm font-medium text-[#1D1D1F]">State *</Label>
                    <Input id="state" name="state" value={formData.state} onChange={handleChange} className="mt-2 h-12 rounded-lg" placeholder="Maharashtra" data-testid="input-state" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="pincode" className="text-sm font-medium text-[#1D1D1F]">Pincode *</Label>
                  <Input id="pincode" name="pincode" value={formData.pincode} onChange={handleChange} className="mt-2 h-12 rounded-lg" placeholder="400001" data-testid="input-pincode" />
                </div>
                <Button type="submit" disabled={loading} className="w-full bg-black text-white hover:bg-gray-800 rounded-full py-6 text-base font-medium" data-testid="pay-now-btn">
                  {loading ? (<span className="flex items-center justify-center"><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />Processing...</span>) : (<><Lock className="mr-2 h-5 w-5" strokeWidth={1.5} />Pay {formatPrice(cart.total)}</>)}
                </Button>
                <p className="text-center text-sm text-[#86868B]">You'll be redirected to Stripe for secure payment</p>
              </form>
            </div>
            <div>
              <div className="sticky top-24 bg-[#F5F5F7] rounded-3xl p-8" data-testid="checkout-summary">
                <h2 className="font-heading text-xl font-semibold mb-6">Order Summary</h2>
                <div className="space-y-4 mb-6">
                  {cart.items.map((item) => <CartSummaryItem key={item.product_id} item={item} />)}
                </div>
                <div className="border-t border-gray-200 pt-4 space-y-3">
                  <div className="flex justify-between text-[#86868B]"><span>Subtotal</span><span>{formatPrice(cart.subtotal)}</span></div>
                  <div className="flex justify-between text-[#86868B]"><span>Shipping (Flat Rate)</span><span>{formatPrice(cart.shipping)}</span></div>
                  <div className="flex justify-between text-lg font-semibold text-[#1D1D1F] pt-3 border-t border-gray-200"><span>Total</span><span>{formatPrice(cart.total)}</span></div>
                </div>
                <div className="mt-6 p-4 bg-white rounded-xl">
                  <p className="text-sm text-[#86868B]"><span className="font-medium text-[#1D1D1F]">Shipping:</span> Your order will be shipped via Delhivery or BlueDart.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};
