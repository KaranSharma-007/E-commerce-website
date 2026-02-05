import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { useAuth, API } from '../../App';
import { toast } from 'sonner';
import { 
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '../../components/ui/sheet';
import { 
  ChevronLeft, 
  Plus, 
  Pencil, 
  Trash2,
  Package,
  AlertTriangle,
  Search,
  Filter
} from 'lucide-react';

export const AdminProducts = () => {
  const { getAuthHeaders } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockFilter, setStockFilter] = useState(''); // 'all', 'low', 'out'
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'tech',
    images: '',
    stock: '',
    featured: false
  });

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API}/products?limit=100`);
      setProducts(response.data.products);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(price);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      category: 'tech',
      images: '',
      stock: '',
      featured: false
    });
    setEditingProduct(null);
  };

  const openEditSheet = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      category: product.category,
      images: product.images.join('\n'),
      stock: product.stock.toString(),
      featured: product.featured
    });
    setSheetOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const productData = {
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price),
      category: formData.category,
      images: formData.images.split('\n').filter(url => url.trim()),
      stock: parseInt(formData.stock),
      featured: formData.featured
    };

    try {
      const headers = await getAuthHeaders(); // FIX: Added await
      
      if (editingProduct) {
        await axios.put(
          `${API}/products/${editingProduct.product_id}`,
          productData,
          { withCredentials: true, headers }
        );
        toast.success('Product updated successfully');
      } else {
        await axios.post(
          `${API}/products`,
          productData,
          { withCredentials: true, headers }
        );
        toast.success('Product created successfully');
      }
      
      setSheetOpen(false);
      resetForm();
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save product');
    }
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    
    try {
      const headers = await getAuthHeaders(); // FIX: Added await
      await axios.delete(
        `${API}/products/${productId}`,
        { withCredentials: true, headers }
      );
      toast.success('Product deleted');
      fetchProducts();
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  // Quick stock update
  const quickUpdateStock = async (productId, newStock) => {
    try {
      const headers = await getAuthHeaders();
      await axios.put(
        `${API}/products/${productId}`,
        { stock: parseInt(newStock) },
        { withCredentials: true, headers }
      );
      toast.success('Stock updated');
      fetchProducts();
    } catch (error) {
      toast.error('Failed to update stock');
    }
  };

  // Filter products
  const filteredProducts = products.filter(product => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!product.name.toLowerCase().includes(query) && 
          !product.description.toLowerCase().includes(query)) {
        return false;
      }
    }

    // Category filter
    if (categoryFilter && product.category !== categoryFilter) {
      return false;
    }

    // Stock filter
    if (stockFilter === 'low' && product.stock > 10) {
      return false;
    }
    if (stockFilter === 'out' && product.stock !== 0) {
      return false;
    }

    return true;
  });

  // Count products by status
  const lowStockCount = products.filter(p => p.stock > 0 && p.stock <= 10).length;
  const outOfStockCount = products.filter(p => p.stock === 0).length;

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
    <div className="min-h-screen flex flex-col bg-[#F5F5F7]" data-testid="admin-products">
      <Header />
      
      <main className="flex-1">
        <div className="container mx-auto px-4 md:px-6 py-8 md:py-12">
          <Link to="/admin" className="inline-flex items-center text-[#86868B] hover:text-[#1D1D1F] transition-colors text-sm mb-8">
            <ChevronLeft className="mr-1 h-4 w-4" strokeWidth={1.5} />
            Back to Dashboard
          </Link>

          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="font-heading text-3xl md:text-4xl font-bold text-[#1D1D1F]">
                Products
              </h1>
              <p className="text-[#86868B] mt-1">
                {products.length} total products
              </p>
            </div>
            <Sheet open={sheetOpen} onOpenChange={(open) => { setSheetOpen(open); if (!open) resetForm(); }}>
              <SheetTrigger asChild>
                <Button className="bg-black text-white hover:bg-gray-800 rounded-full" data-testid="add-product-btn">
                  <Plus className="mr-2 h-4 w-4" strokeWidth={1.5} />
                  Add Product
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</SheetTitle>
                  <SheetDescription>
                    {editingProduct ? 'Update product details' : 'Fill in the product details'}
                  </SheetDescription>
                </SheetHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-6">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="mt-1"
                      data-testid="product-name-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      required
                      className="mt-1 w-full h-24 rounded-lg border border-gray-200 p-3 text-sm"
                      data-testid="product-description-input"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="price">Price (₹)</Label>
                      <Input
                        id="price"
                        name="price"
                        type="number"
                        step="0.01"
                        value={formData.price}
                        onChange={handleChange}
                        required
                        className="mt-1"
                        data-testid="product-price-input"
                      />
                    </div>
                    <div>
                      <Label htmlFor="stock">Stock</Label>
                      <Input
                        id="stock"
                        name="stock"
                        type="number"
                        value={formData.stock}
                        onChange={handleChange}
                        required
                        className="mt-1"
                        data-testid="product-stock-input"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="mt-1 w-full h-10 rounded-lg border border-gray-200 px-3 text-sm"
                      data-testid="product-category-select"
                    >
                      <option value="tech">Technology</option>
                      <option value="home">Home & Living</option>
                      <option value="fashion">Fashion</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="images">Image URLs (one per line)</Label>
                    <textarea
                      id="images"
                      name="images"
                      value={formData.images}
                      onChange={handleChange}
                      placeholder="https://example.com/image1.jpg"
                      className="mt-1 w-full h-24 rounded-lg border border-gray-200 p-3 text-sm"
                      data-testid="product-images-input"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      id="featured"
                      name="featured"
                      type="checkbox"
                      checked={formData.featured}
                      onChange={handleChange}
                      className="h-4 w-4 rounded border-gray-300"
                      data-testid="product-featured-checkbox"
                    />
                    <Label htmlFor="featured">Featured product</Label>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-black text-white hover:bg-gray-800 rounded-full"
                    data-testid="save-product-btn"
                  >
                    {editingProduct ? 'Update Product' : 'Create Product'}
                  </Button>
                </form>
              </SheetContent>
            </Sheet>
          </div>

          {/* Inventory Alerts */}
          {(lowStockCount > 0 || outOfStockCount > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {lowStockCount > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0" strokeWidth={1.5} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-yellow-900">
                      {lowStockCount} product{lowStockCount > 1 ? 's' : ''} running low on stock
                    </p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="rounded-full"
                    onClick={() => setStockFilter('low')}
                  >
                    View
                  </Button>
                </div>
              )}
              {outOfStockCount > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" strokeWidth={1.5} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-900">
                      {outOfStockCount} product{outOfStockCount > 1 ? 's' : ''} out of stock
                    </p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="rounded-full"
                    onClick={() => setStockFilter('out')}
                  >
                    View
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Search and Filters */}
          <div className="mb-6 space-y-4">
            {/* Search */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#86868B]" strokeWidth={1.5} />
              <Input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-lg"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={categoryFilter === '' ? 'default' : 'outline'}
                size="sm"
                className="rounded-full"
                onClick={() => setCategoryFilter('')}
              >
                All Categories
              </Button>
              <Button
                variant={categoryFilter === 'tech' ? 'default' : 'outline'}
                size="sm"
                className="rounded-full"
                onClick={() => setCategoryFilter('tech')}
              >
                Technology
              </Button>
              <Button
                variant={categoryFilter === 'home' ? 'default' : 'outline'}
                size="sm"
                className="rounded-full"
                onClick={() => setCategoryFilter('home')}
              >
                Home & Living
              </Button>
              <Button
                variant={categoryFilter === 'fashion' ? 'default' : 'outline'}
                size="sm"
                className="rounded-full"
                onClick={() => setCategoryFilter('fashion')}
              >
                Fashion
              </Button>

              <div className="w-px bg-gray-200 mx-2" />

              <Button
                variant={stockFilter === '' ? 'default' : 'outline'}
                size="sm"
                className="rounded-full"
                onClick={() => setStockFilter('')}
              >
                All Stock
              </Button>
              <Button
                variant={stockFilter === 'low' ? 'default' : 'outline'}
                size="sm"
                className="rounded-full"
                onClick={() => setStockFilter('low')}
              >
                Low Stock
              </Button>
              <Button
                variant={stockFilter === 'out' ? 'default' : 'outline'}
                size="sm"
                className="rounded-full"
                onClick={() => setStockFilter('out')}
              >
                Out of Stock
              </Button>
            </div>
          </div>

          {/* Products Grid */}
          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center">
              <Package className="mx-auto h-12 w-12 text-[#86868B] mb-4" strokeWidth={1} />
              <p className="text-[#86868B]">
                {searchQuery || categoryFilter || stockFilter 
                  ? 'No products match your filters' 
                  : 'No products yet. Add your first product!'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => {
                const isLowStock = product.stock > 0 && product.stock <= 10;
                const isOutOfStock = product.stock === 0;

                return (
                  <div 
                    key={product.product_id}
                    className="bg-white rounded-2xl overflow-hidden shadow-sm"
                    data-testid={`admin-product-${product.product_id}`}
                  >
                    <div className="aspect-square bg-[#F5F5F7] relative">
                      <img 
                        src={product.images[0]} 
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                      {isOutOfStock && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                          <span className="bg-red-500 text-white px-4 py-2 rounded-full text-sm font-medium">
                            Out of Stock
                          </span>
                        </div>
                      )}
                      {isLowStock && (
                        <div className="absolute top-3 right-3">
                          <span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" strokeWidth={2} />
                            Low Stock
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-medium text-[#1D1D1F] line-clamp-1">{product.name}</h3>
                        {product.featured && (
                          <span className="shrink-0 bg-black text-white text-xs px-2 py-0.5 rounded-full">
                            Featured
                          </span>
                        )}
                      </div>
                      <p className="text-lg font-semibold text-[#1D1D1F] mb-1">
                        {formatPrice(product.price)}
                      </p>
                      
                      {/* Quick Stock Update */}
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-sm text-[#86868B]">Stock:</span>
                        <input
                          type="number"
                          value={product.stock}
                          onChange={(e) => {
                            const newStock = e.target.value;
                            if (newStock !== '') {
                              quickUpdateStock(product.product_id, newStock);
                            }
                          }}
                          className="w-20 px-2 py-1 text-sm border border-gray-200 rounded"
                          min="0"
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 rounded-full"
                          onClick={() => openEditSheet(product)}
                          data-testid={`edit-${product.product_id}`}
                        >
                          <Pencil className="h-4 w-4 mr-1" strokeWidth={1.5} />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-full text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleDelete(product.product_id)}
                          data-testid={`delete-${product.product_id}`}
                        >
                          <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};