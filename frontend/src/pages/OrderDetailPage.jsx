import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Button } from '../components/ui/button';
import { useAuth, API } from '../App';
import { ChevronLeft, Truck, MapPin, ExternalLink } from 'lucide-react';

export const OrderDetailPage = () => {
  const { orderId } = useParams();
  const { getAuthHeaders } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await axios.get(`${API}/orders/${orderId}`, { withCredentials: true, headers: getAuthHeaders() });
        setOrder(response.data);
      } catch (error) {
        console.error('Failed to fetch order:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId, getAuthHeaders]);

  const formatPrice = (price) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(price);
  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const getStatusColor = (status) => {
    const colors = { confirmed: 'bg-blue-100 text-blue-700', shipped: 'bg-yellow-100 text-yellow-700', delivered: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-700' };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  if (loading) return (<div className="min-h-screen flex flex-col"><Header /><main className="flex-1 flex items-center justify-center"><div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" /></main><Footer /></div>);
  if (!order) return (<div className="min-h-screen flex flex-col"><Header /><main className="flex-1 flex flex-col items-center justify-center"><p className="text-[#86868B] text-lg mb-4">Order not found</p><Link to="/orders"><Button variant="outline" className="rounded-full"><ChevronLeft className="mr-2 h-4 w-4" />Back to Orders</Button></Link></main><Footer /></div>);

  const OrderItem = ({ item }) => (
    <div className="flex gap-4">
      <Link to={`/product/${item.product_id}`} className="shrink-0">
        <div className="w-20 h-20 rounded-xl overflow-hidden bg-white"><img src={item.image} alt={item.name} className="w-full h-full object-cover" /></div>
      </Link>
      <div className="flex-1 min-w-0">
        <Link to={`/product/${item.product_id}`}><h3 className="font-medium text-[#1D1D1F] hover:text-[#0071E3] transition-colors">{item.name}</h3></Link>
        <p className="text-sm text-[#86868B]">Qty: {item.quantity}</p>
        <p className="font-medium text-[#1D1D1F] mt-1">{formatPrice(item.price * item.quantity)}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-white" data-testid="order-detail-page">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 md:px-6 py-8 md:py-16">
          <Link to="/orders" className="inline-flex items-center text-[#86868B] hover:text-[#1D1D1F] transition-colors text-sm mb-8"><ChevronLeft className="mr-1 h-4 w-4" strokeWidth={1.5} />Back to Orders</Link>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div><h1 className="font-heading text-2xl md:text-3xl font-bold text-[#1D1D1F]">Order Details</h1><p className="text-[#86868B] mt-1 font-mono">{order.order_id}</p></div>
                <span className={`px-4 py-2 rounded-full text-sm font-medium capitalize ${getStatusColor(order.status)}`}>{order.status}</span>
              </div>
              <div className="bg-[#F5F5F7] rounded-2xl p-6">
                <h2 className="font-heading text-lg font-semibold mb-4">Items</h2>
                <div className="space-y-4">{order.items.map((item) => <OrderItem key={item.product_id} item={item} />)}</div>
              </div>
              <div className="bg-[#F5F5F7] rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4"><MapPin className="h-5 w-5 text-[#1D1D1F]" strokeWidth={1.5} /><h2 className="font-heading text-lg font-semibold">Shipping Address</h2></div>
                <div className="text-[#1D1D1F]">
                  <p className="font-medium">{order.shipping_address.full_name}</p>
                  <p>{order.shipping_address.phone}</p>
                  <p className="mt-2">{order.shipping_address.address_line1}{order.shipping_address.address_line2 && <><br />{order.shipping_address.address_line2}</>}</p>
                  <p>{order.shipping_address.city}, {order.shipping_address.state} - {order.shipping_address.pincode}</p>
                </div>
              </div>
              {order.tracking_number && (
                <div className="bg-[#F5F5F7] rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-4"><Truck className="h-5 w-5 text-[#1D1D1F]" strokeWidth={1.5} /><h2 className="font-heading text-lg font-semibold">Tracking Information</h2></div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div><p className="text-sm text-[#86868B]">Tracking Number</p><p className="font-mono text-[#1D1D1F]">{order.tracking_number}</p><p className="text-sm text-[#86868B] mt-1">via {order.tracking_provider}</p></div>
                    <Link to={`/tracking/${order.order_id}`}><Button className="bg-black text-white hover:bg-gray-800 rounded-full" data-testid="track-btn">Track Package<ExternalLink className="ml-2 h-4 w-4" strokeWidth={1.5} /></Button></Link>
                  </div>
                </div>
              )}
            </div>
            <div className="lg:col-span-1">
              <div className="sticky top-24 bg-[#F5F5F7] rounded-2xl p-6">
                <h2 className="font-heading text-lg font-semibold mb-4">Order Summary</h2>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-[#86868B]"><span>Order Date</span><span>{formatDate(order.created_at)}</span></div>
                  <div className="flex justify-between text-[#86868B]"><span>Payment Status</span><span className={order.payment_status === 'paid' ? 'text-green-600' : 'text-yellow-600'}>{order.payment_status === 'paid' ? 'Paid' : order.payment_status}</span></div>
                </div>
                <div className="border-t border-gray-200 mt-4 pt-4 space-y-3">
                  <div className="flex justify-between text-[#86868B]"><span>Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
                  <div className="flex justify-between text-[#86868B]"><span>Shipping</span><span>{formatPrice(order.shipping)}</span></div>
                  <div className="flex justify-between text-lg font-semibold text-[#1D1D1F] pt-3 border-t border-gray-200"><span>Total</span><span>{formatPrice(order.total)}</span></div>
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
