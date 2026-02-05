import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { Button } from '../../components/ui/button';
import { useAuth, API } from '../../App';
import { 
  Package, 
  ShoppingCart, 
  Users, 
  IndianRupee, 
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

export const AdminDashboard = () => {
  const { getAuthHeaders } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      setRefreshing(true);
      const headers = await getAuthHeaders(); // FIX: Added await
      
      const response = await axios.get(`${API}/admin/stats`, {
        withCredentials: true,
        headers
      });
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(price);
  };

  // Calculate growth percentages (mock data - replace with real historical data)
  const calculateGrowth = (current, previous = 0) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous * 100).toFixed(1);
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

  const pendingOrdersNeedAttention = (stats?.pending_orders || 0) > 5;

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F5F7]" data-testid="admin-dashboard">
      <Header />
      
      <main className="flex-1">
        <div className="container mx-auto px-4 md:px-6 py-8 md:py-12">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="font-heading text-3xl md:text-4xl font-bold text-[#1D1D1F]">
                Admin Dashboard
              </h1>
              <p className="text-[#86868B] mt-1">Overview of your store performance</p>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="rounded-full"
                onClick={fetchStats}
                disabled={refreshing}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} strokeWidth={1.5} />
                Refresh
              </Button>
              <Link to="/admin/products">
                <Button variant="outline" className="rounded-full">
                  <Package className="mr-2 h-4 w-4" strokeWidth={1.5} />
                  Products
                </Button>
              </Link>
              <Link to="/admin/orders">
                <Button className="bg-black text-white hover:bg-gray-800 rounded-full">
                  <ShoppingCart className="mr-2 h-4 w-4" strokeWidth={1.5} />
                  Orders
                </Button>
              </Link>
            </div>
          </div>

          {/* Alert for pending orders */}
          {pendingOrdersNeedAttention && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0" strokeWidth={1.5} />
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-900">
                  You have {stats.pending_orders} pending orders that need attention
                </p>
              </div>
              <Link to="/admin/orders?status=pending">
                <Button size="sm" variant="outline" className="rounded-full">
                  View Orders
                </Button>
              </Link>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Revenue Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm" data-testid="stat-revenue">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-100 rounded-full">
                  <IndianRupee className="h-6 w-6 text-green-600" strokeWidth={1.5} />
                </div>
                <div className="flex items-center gap-1 text-green-600">
                  <TrendingUp className="h-4 w-4" strokeWidth={1.5} />
                  <span className="text-xs font-medium">+12%</span>
                </div>
              </div>
              <p className="text-sm text-[#86868B] mb-1">Total Revenue</p>
              <p className="text-2xl font-bold text-[#1D1D1F]">
                {formatPrice(stats?.total_revenue || 0)}
              </p>
              <p className="text-xs text-[#86868B] mt-2">From paid orders</p>
            </div>

            {/* Orders Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm" data-testid="stat-orders">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-100 rounded-full">
                  <ShoppingCart className="h-6 w-6 text-blue-600" strokeWidth={1.5} />
                </div>
                <span className="text-xs font-medium text-blue-600">All time</span>
              </div>
              <p className="text-sm text-[#86868B] mb-1">Total Orders</p>
              <p className="text-2xl font-bold text-[#1D1D1F]">{stats?.total_orders || 0}</p>
              <p className="text-xs text-[#86868B] mt-2">
                <span className="text-yellow-600 font-medium">{stats?.pending_orders || 0}</span> pending
              </p>
            </div>

            {/* Products Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm" data-testid="stat-products">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-100 rounded-full">
                  <Package className="h-6 w-6 text-purple-600" strokeWidth={1.5} />
                </div>
              </div>
              <p className="text-sm text-[#86868B] mb-1">Total Products</p>
              <p className="text-2xl font-bold text-[#1D1D1F]">{stats?.total_products || 0}</p>
              <Link to="/admin/products" className="text-xs text-purple-600 hover:underline mt-2 inline-block">
                Manage inventory →
              </Link>
            </div>

            {/* Users Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm" data-testid="stat-users">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-orange-100 rounded-full">
                  <Users className="h-6 w-6 text-orange-600" strokeWidth={1.5} />
                </div>
              </div>
              <p className="text-sm text-[#86868B] mb-1">Total Customers</p>
              <p className="text-2xl font-bold text-[#1D1D1F]">{stats?.total_users || 0}</p>
              <p className="text-xs text-[#86868B] mt-2">Registered users</p>
            </div>
          </div>

          {/* Order Status Breakdown */}
          <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading text-xl font-semibold">Order Status</h2>
              <Link to="/admin/orders">
                <Button variant="ghost" size="sm" className="text-[#86868B] hover:text-[#1D1D1F]">
                  View Details →
                </Button>
              </Link>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <Link to="/admin/orders?status=pending" className="block">
                <div className="text-center p-4 bg-[#F5F5F7] rounded-xl hover:bg-yellow-50 transition-colors cursor-pointer">
                  <p className="text-2xl font-bold text-yellow-600">{stats?.pending_orders || 0}</p>
                  <p className="text-sm text-[#86868B] mt-1">Pending</p>
                </div>
              </Link>
              
              <Link to="/admin/orders?status=confirmed" className="block">
                <div className="text-center p-4 bg-[#F5F5F7] rounded-xl hover:bg-blue-50 transition-colors cursor-pointer">
                  <p className="text-2xl font-bold text-blue-600">{stats?.confirmed_orders || 0}</p>
                  <p className="text-sm text-[#86868B] mt-1">Confirmed</p>
                </div>
              </Link>
              
              <Link to="/admin/orders?status=shipped" className="block">
                <div className="text-center p-4 bg-[#F5F5F7] rounded-xl hover:bg-purple-50 transition-colors cursor-pointer">
                  <p className="text-2xl font-bold text-purple-600">{stats?.shipped_orders || 0}</p>
                  <p className="text-sm text-[#86868B] mt-1">Shipped</p>
                </div>
              </Link>
              
              <Link to="/admin/orders?status=delivered" className="block">
                <div className="text-center p-4 bg-[#F5F5F7] rounded-xl hover:bg-green-50 transition-colors cursor-pointer">
                  <p className="text-2xl font-bold text-green-600">{stats?.delivered_orders || 0}</p>
                  <p className="text-sm text-[#86868B] mt-1">Delivered</p>
                </div>
              </Link>
              
              <div className="text-center p-4 bg-[#F5F5F7] rounded-xl col-span-2 md:col-span-1">
                <p className="text-2xl font-bold text-[#1D1D1F]">{stats?.total_orders || 0}</p>
                <p className="text-sm text-[#86868B] mt-1">Total</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-6 pt-6 border-t border-gray-100">
              <p className="text-sm text-[#86868B] mb-3">Quick Actions</p>
              <div className="flex flex-wrap gap-2">
                <Link to="/admin/orders?status=pending">
                  <Button variant="outline" size="sm" className="rounded-full">
                    Process Pending Orders
                  </Button>
                </Link>
                <Link to="/admin/orders?status=confirmed">
                  <Button variant="outline" size="sm" className="rounded-full">
                    Add Tracking Info
                  </Button>
                </Link>
                <Link to="/admin/products">
                  <Button variant="outline" size="sm" className="rounded-full">
                    Update Inventory
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};