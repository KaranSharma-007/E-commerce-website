import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { useAuth, API } from '../../App';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import { 
  ChevronLeft, 
  ChevronDown,
  Truck,
  Package,
  Search,
  Download,
  CheckSquare,
  Square,
  Eye
} from 'lucide-react';

export const AdminOrders = () => {
  const { getAuthHeaders } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [trackingData, setTrackingData] = useState({
    tracking_number: '',
    tracking_provider: 'delhivery'
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  const fetchOrders = async () => {
    try {
      const headers = await getAuthHeaders(); // FIX: Added await
      const params = statusFilter ? `?status=${statusFilter}` : '';
      const response = await axios.get(`${API}/admin/orders${params}`, {
        withCredentials: true,
        headers
      });
      setOrders(response.data);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  useEffect(() => {
    const status = searchParams.get('status');
    if (status) {
      setStatusFilter(status);
    }
  }, [searchParams]);

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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-blue-100 text-blue-700';
      case 'shipped':
        return 'bg-purple-100 text-purple-700';
      case 'delivered':
        return 'bg-green-100 text-green-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-yellow-100 text-yellow-700';
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      const headers = await getAuthHeaders();
      await axios.put(
        `${API}/admin/orders/${orderId}?status=${status}`,
        {},
        { withCredentials: true, headers }
      );
      toast.success(`Order status updated to ${status}`);
      fetchOrders();
    } catch (error) {
      toast.error('Failed to update order status');
    }
  };

  // Bulk Actions
  const toggleOrderSelection = (orderId) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedOrders.length === filteredOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(filteredOrders.map(o => o.order_id));
    }
  };

  const bulkUpdateStatus = async (status) => {
    if (selectedOrders.length === 0) {
      toast.error('Please select orders first');
      return;
    }

    try {
      const headers = await getAuthHeaders();
      await Promise.all(
        selectedOrders.map(orderId =>
          axios.put(
            `${API}/admin/orders/${orderId}?status=${status}`,
            {},
            { withCredentials: true, headers }
          )
        )
      );
      toast.success(`${selectedOrders.length} orders updated to ${status}`);
      setSelectedOrders([]);
      fetchOrders();
    } catch (error) {
      toast.error('Failed to update orders');
    }
  };

  const openTrackingDialog = (order) => {
    setSelectedOrder(order);
    setTrackingData({
      tracking_number: order.tracking_number || '',
      tracking_provider: order.tracking_provider || 'delhivery'
    });
    setDialogOpen(true);
  };

  const openDetailsDialog = (order) => {
    setSelectedOrder(order);
    setDetailsDialogOpen(true);
  };

  const saveTracking = async () => {
    if (!trackingData.tracking_number) {
      toast.error('Please enter tracking number');
      return;
    }

    try {
      const headers = await getAuthHeaders();
      await axios.put(
        `${API}/admin/orders/${selectedOrder.order_id}?status=shipped&tracking_number=${trackingData.tracking_number}&tracking_provider=${trackingData.tracking_provider}`,
        {},
        { withCredentials: true, headers }
      );
      toast.success('Tracking information added');
      setDialogOpen(false);
      fetchOrders();
    } catch (error) {
      toast.error('Failed to add tracking');
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Order ID', 'Date', 'Customer', 'Total', 'Status', 'Payment Status'];
    const rows = filteredOrders.map(order => [
      order.order_id,
      formatDate(order.created_at),
      order.shipping_address.full_name,
      order.total,
      order.status,
      order.payment_status
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Orders exported successfully');
  };

  // Filter orders by search query
  const filteredOrders = orders.filter(order => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      order.order_id.toLowerCase().includes(query) ||
      order.shipping_address.full_name.toLowerCase().includes(query) ||
      order.shipping_address.phone.includes(query)
    );
  });

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
    <div className="min-h-screen flex flex-col bg-[#F5F5F7]" data-testid="admin-orders">
      <Header />
      
      <main className="flex-1">
        <div className="container mx-auto px-4 md:px-6 py-8 md:py-12">
          <Link to="/admin" className="inline-flex items-center text-[#86868B] hover:text-[#1D1D1F] transition-colors text-sm mb-8">
            <ChevronLeft className="mr-1 h-4 w-4" strokeWidth={1.5} />
            Back to Dashboard
          </Link>

          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <h1 className="font-heading text-3xl md:text-4xl font-bold text-[#1D1D1F]">
              Orders
            </h1>
            
            {/* Export Button */}
            <Button 
              variant="outline" 
              className="rounded-full"
              onClick={exportToCSV}
              disabled={filteredOrders.length === 0}
            >
              <Download className="mr-2 h-4 w-4" strokeWidth={1.5} />
              Export CSV
            </Button>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#86868B]" strokeWidth={1.5} />
              <Input
                type="text"
                placeholder="Search by order ID, customer name, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-lg"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex gap-2 flex-wrap mb-6">
            <Button 
              variant={statusFilter === '' ? 'default' : 'outline'} 
              className="rounded-full"
              onClick={() => setStatusFilter('')}
            >
              All ({orders.length})
            </Button>
            <Button 
              variant={statusFilter === 'pending' ? 'default' : 'outline'} 
              className="rounded-full"
              onClick={() => setStatusFilter('pending')}
            >
              Pending
            </Button>
            <Button 
              variant={statusFilter === 'confirmed' ? 'default' : 'outline'} 
              className="rounded-full"
              onClick={() => setStatusFilter('confirmed')}
            >
              Confirmed
            </Button>
            <Button 
              variant={statusFilter === 'shipped' ? 'default' : 'outline'} 
              className="rounded-full"
              onClick={() => setStatusFilter('shipped')}
            >
              Shipped
            </Button>
            <Button 
              variant={statusFilter === 'delivered' ? 'default' : 'outline'} 
              className="rounded-full"
              onClick={() => setStatusFilter('delivered')}
            >
              Delivered
            </Button>
          </div>

          {/* Bulk Actions */}
          {selectedOrders.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6 flex items-center gap-4">
              <p className="text-sm font-medium text-blue-900">
                {selectedOrders.length} order{selectedOrders.length > 1 ? 's' : ''} selected
              </p>
              <div className="flex gap-2 flex-wrap">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="rounded-full"
                  onClick={() => bulkUpdateStatus('confirmed')}
                >
                  Mark as Confirmed
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="rounded-full"
                  onClick={() => bulkUpdateStatus('shipped')}
                >
                  Mark as Shipped
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="rounded-full"
                  onClick={() => bulkUpdateStatus('delivered')}
                >
                  Mark as Delivered
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="rounded-full"
                  onClick={() => setSelectedOrders([])}
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          )}

          {/* Orders List */}
          {filteredOrders.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center">
              <Package className="mx-auto h-12 w-12 text-[#86868B] mb-4" strokeWidth={1} />
              <p className="text-[#86868B]">
                {searchQuery ? 'No orders match your search' : 'No orders found'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Select All */}
              <div className="bg-white rounded-2xl p-4 flex items-center gap-3">
                <button
                  onClick={toggleSelectAll}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  {selectedOrders.length === filteredOrders.length ? (
                    <CheckSquare className="h-5 w-5 text-blue-600" strokeWidth={1.5} />
                  ) : (
                    <Square className="h-5 w-5 text-[#86868B]" strokeWidth={1.5} />
                  )}
                </button>
                <p className="text-sm text-[#86868B]">
                  Select all {filteredOrders.length} orders
                </p>
              </div>

              {filteredOrders.map((order) => (
                <div 
                  key={order.order_id}
                  className="bg-white rounded-2xl p-6"
                  data-testid={`admin-order-${order.order_id}`}
                >
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleOrderSelection(order.order_id)}
                      className="mt-1 p-1 hover:bg-gray-100 rounded"
                    >
                      {selectedOrders.includes(order.order_id) ? (
                        <CheckSquare className="h-5 w-5 text-blue-600" strokeWidth={1.5} />
                      ) : (
                        <Square className="h-5 w-5 text-[#86868B]" strokeWidth={1.5} />
                      )}
                    </button>

                    <div className="flex-1">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
                        <div className="flex flex-col md:flex-row md:items-center gap-4">
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
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            order.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {order.payment_status === 'paid' ? 'Paid' : order.payment_status}
                          </span>
                        </div>
                      </div>

                      {/* Items Preview */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {order.items?.slice(0, 4).map((item) => (
                          <div key={item.product_id} className="w-12 h-12 rounded-lg overflow-hidden bg-[#F5F5F7]">
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          </div>
                        ))}
                        {order.items?.length > 4 && (
                          <div className="w-12 h-12 rounded-lg bg-[#F5F5F7] flex items-center justify-center text-xs text-[#86868B]">
                            +{order.items.length - 4}
                          </div>
                        )}
                      </div>

                      {/* Shipping Address */}
                      <div className="text-sm text-[#86868B] mb-4">
                        <span className="font-medium text-[#1D1D1F]">Ship to:</span>{' '}
                        {order.shipping_address.full_name}, {order.shipping_address.city}, {order.shipping_address.state} - {order.shipping_address.pincode}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2">
                        {/* View Details */}
                        <Button 
                          variant="outline" 
                          className="rounded-full"
                          onClick={() => openDetailsDialog(order)}
                        >
                          <Eye className="mr-2 h-4 w-4" strokeWidth={1.5} />
                          View Details
                        </Button>

                        {/* Status Update Dropdown */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="rounded-full" data-testid={`update-status-${order.order_id}`}>
                              Update Status
                              <ChevronDown className="ml-2 h-4 w-4" strokeWidth={1.5} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => updateOrderStatus(order.order_id, 'pending')}>
                              Pending
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateOrderStatus(order.order_id, 'confirmed')}>
                              Confirmed
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateOrderStatus(order.order_id, 'shipped')}>
                              Shipped
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateOrderStatus(order.order_id, 'delivered')}>
                              Delivered
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateOrderStatus(order.order_id, 'cancelled')}>
                              Cancelled
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Add Tracking */}
                        <Dialog open={dialogOpen && selectedOrder?.order_id === order.order_id} onOpenChange={setDialogOpen}>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              className="rounded-full"
                              onClick={() => openTrackingDialog(order)}
                              data-testid={`add-tracking-${order.order_id}`}
                            >
                              <Truck className="mr-2 h-4 w-4" strokeWidth={1.5} />
                              {order.tracking_number ? 'Update Tracking' : 'Add Tracking'}
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Add Tracking Information</DialogTitle>
                              <DialogDescription>
                                Add shipping tracking details for this order
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 mt-4">
                              <div>
                                <Label htmlFor="tracking_provider">Carrier</Label>
                                <select
                                  id="tracking_provider"
                                  value={trackingData.tracking_provider}
                                  onChange={(e) => setTrackingData({ ...trackingData, tracking_provider: e.target.value })}
                                  className="mt-1 w-full h-10 rounded-lg border border-gray-200 px-3 text-sm"
                                  data-testid="tracking-provider-select"
                                >
                                  <option value="delhivery">Delhivery</option>
                                  <option value="bluedart">BlueDart</option>
                                </select>
                              </div>
                              <div>
                                <Label htmlFor="tracking_number">Tracking Number</Label>
                                <Input
                                  id="tracking_number"
                                  value={trackingData.tracking_number}
                                  onChange={(e) => setTrackingData({ ...trackingData, tracking_number: e.target.value })}
                                  placeholder="Enter tracking number"
                                  className="mt-1"
                                  data-testid="tracking-number-input"
                                />
                              </div>
                              <Button 
                                onClick={saveTracking}
                                className="w-full bg-black text-white hover:bg-gray-800 rounded-full"
                                data-testid="save-tracking-btn"
                              >
                                Save & Mark as Shipped
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>

                        {/* View Tracking */}
                        {order.tracking_number && (
                          <div className="flex items-center gap-2 text-sm text-[#86868B]">
                            <Truck className="h-4 w-4" strokeWidth={1.5} />
                            <span>{order.tracking_provider}: {order.tracking_number}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Order Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              Complete information for order {selectedOrder?.order_id}
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              {/* Order Info */}
              <div>
                <h3 className="font-semibold mb-2">Order Information</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-[#86868B]">Order ID:</span>
                    <p className="font-mono">{selectedOrder.order_id}</p>
                  </div>
                  <div>
                    <span className="text-[#86868B]">Date:</span>
                    <p>{formatDate(selectedOrder.created_at)}</p>
                  </div>
                  <div>
                    <span className="text-[#86868B]">Status:</span>
                    <p className="capitalize">{selectedOrder.status}</p>
                  </div>
                  <div>
                    <span className="text-[#86868B]">Payment:</span>
                    <p className="capitalize">{selectedOrder.payment_status}</p>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div>
                <h3 className="font-semibold mb-2">Items</h3>
                <div className="space-y-2">
                  {selectedOrder.items?.map((item) => (
                    <div key={item.product_id} className="flex items-center gap-3 p-3 bg-[#F5F5F7] rounded-lg">
                      <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded" />
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-[#86868B]">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-semibold">{formatPrice(item.price * item.quantity)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping Address */}
              <div>
                <h3 className="font-semibold mb-2">Shipping Address</h3>
                <div className="p-3 bg-[#F5F5F7] rounded-lg text-sm">
                  <p className="font-medium">{selectedOrder.shipping_address.full_name}</p>
                  <p>{selectedOrder.shipping_address.phone}</p>
                  <p>{selectedOrder.shipping_address.address_line1}</p>
                  {selectedOrder.shipping_address.address_line2 && (
                    <p>{selectedOrder.shipping_address.address_line2}</p>
                  )}
                  <p>
                    {selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.state} - {selectedOrder.shipping_address.pincode}
                  </p>
                </div>
              </div>

              {/* Pricing */}
              <div>
                <h3 className="font-semibold mb-2">Pricing</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#86868B]">Subtotal:</span>
                    <span>{formatPrice(selectedOrder.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#86868B]">Shipping:</span>
                    <span>{formatPrice(selectedOrder.shipping)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-base pt-2 border-t">
                    <span>Total:</span>
                    <span>{formatPrice(selectedOrder.total)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};