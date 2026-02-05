import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Button } from '../components/ui/button';
import { useAuth, API } from '../App';
import { Package, ChevronRight, Truck } from 'lucide-react';

export const OrdersPage = () => {
  const { getAuthHeaders } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await axios.get(`${API}/orders`, {
          withCredentials: true,
          headers: getAuthHeaders()
        });
        setOrders(response.data);
      } catch (error) {
        console.error('Failed to fetch orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [getAuthHeaders]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(price);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-blue-100 text-blue-700';
      case 'shipped':
        return 'bg-yellow-100 text-yellow-700';
      case 'delivered':
        return 'bg-green-100 text-green-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
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

  return (
    <div className="min-h-screen flex flex-col bg-white" data-testid="orders-page">
      <Header />
      
      <main className="flex-1">
        <div className="container mx-auto px-4 md:px-6 py-8 md:py-16">
          <h1 className="font-heading text-3xl md:text-5xl font-bold tracking-tight text-[#1D1D1F] mb-8">
            My Orders
          </h1>

          {orders.length === 0 ? (
            <div className="text-center py-16">
              <Package className="mx-auto h-16 w-16 text-[#86868B] mb-4" strokeWidth={1} />
              <p className="text-[#86868B] text-lg mb-6">You haven't placed any orders yet</p>
              <Link to="/products">
                <Button className="bg-black text-white hover:bg-gray-800 rounded-full px-8" data-testid="shop-now-btn">
                  Start Shopping
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => (
                <div 
                  key={order.order_id}
                  className="bg-[#F5F5F7] rounded-2xl p-6 md:p-8"
                  data-testid={`order-${order.order_id}`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                      <p className="text-sm text-[#86868B]">Order ID</p>
                      <p className="font-mono text-[#1D1D1F]">{order.order_id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[#86868B]">Date</p>
                      <p className="text-[#1D1D1F]">{formatDate(order.created_at)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[#86868B]">Total</p>
                      <p className="font-semibold text-[#1D1D1F]">{formatPrice(order.total)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                      {order.payment_status === 'paid' ? (
                        <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
                          Paid
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-700">
                          {order.payment_status}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 mb-6">
                    {order.items.slice(0, 4).map((item) => (
                      <div key={item.product_id} className="w-16 h-16 rounded-lg overflow-hidden bg-white">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                    ))}
                    {order.items.length > 4 && (
                      <div className="w-16 h-16 rounded-lg bg-white flex items-center justify-center text-[#86868B] text-sm font-medium">
                        +{order.items.length - 4}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link to={`/orders/${order.order_id}`}>
                      <Button variant="outline" className="rounded-full" data-testid={`view-details-${order.order_id}`}>
                        View Details
                        <ChevronRight className="ml-1 h-4 w-4" strokeWidth={1.5} />
                      </Button>
                    </Link>
                    {order.tracking_number && (
                      <Link to={`/tracking/${order.order_id}`}>
                        <Button variant="outline" className="rounded-full" data-testid={`track-order-${order.order_id}`}>
                          <Truck className="mr-2 h-4 w-4" strokeWidth={1.5} />
                          Track Order
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};
