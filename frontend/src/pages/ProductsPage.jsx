import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { ProductCard } from '../components/ProductCard';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Search, SlidersHorizontal } from 'lucide-react';
import { API } from '../App';

export const ProductsPage = () => {
  const { category } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [total, setTotal] = useState(0);

  const categoryTitles = {
    tech: 'Technology',
    home: 'Home & Living',
    fashion: 'Fashion'
  };

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (category) params.append('category', category);
        if (searchQuery) params.append('search', searchQuery);
        
        const response = await axios.get(`${API}/products?${params.toString()}`);
        setProducts(response.data.products);
        setTotal(response.data.total);
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [category, searchQuery]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchParams(searchQuery ? { search: searchQuery } : {});
  };

  return (
    <div className="min-h-screen flex flex-col" data-testid="products-page">
      <Header />
      
      <main className="flex-1 bg-white">
        {/* Page Header */}
        <section className="bg-[#F5F5F7] py-12 md:py-16">
          <div className="container mx-auto px-4 md:px-6">
            <h1 className="font-heading text-3xl md:text-5xl font-bold tracking-tight text-[#1D1D1F]">
              {category ? categoryTitles[category] || category : 'All Products'}
            </h1>
            <p className="mt-2 text-[#86868B]">
              {total} products found
            </p>
          </div>
        </section>

        {/* Search & Filter */}
        <section className="border-b border-gray-100">
          <div className="container mx-auto px-4 md:px-6 py-4">
            <form onSubmit={handleSearch} className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#86868B]" strokeWidth={1.5} />
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 rounded-full border-gray-200 bg-[#F5F5F7] focus:bg-white transition-colors"
                  data-testid="search-input"
                />
              </div>
              <Button type="submit" className="bg-black text-white hover:bg-gray-800 rounded-full px-6 h-12" data-testid="search-btn">
                Search
              </Button>
            </form>
          </div>
        </section>

        {/* Products Grid */}
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4 md:px-6">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-[#F5F5F7] rounded-2xl aspect-square" />
                    <div className="mt-4 space-y-2">
                      <div className="h-4 bg-[#F5F5F7] rounded w-3/4" />
                      <div className="h-3 bg-[#F5F5F7] rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-[#86868B] text-lg">No products found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
                {products.map((product, index) => (
                  <div key={product.product_id} className="animate-slide-up" style={{ animationDelay: `${index * 0.05}s` }}>
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};
