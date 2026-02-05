import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { ProductCard } from '../components/ProductCard';
import { Button } from '../components/ui/button';
import { ArrowRight, Truck, Shield, CreditCard } from 'lucide-react';
import { API } from '../App';

export const HomePage = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Seed data first
        await axios.post(`${API}/seed`);
        
        const response = await axios.get(`${API}/products?featured=true&limit=6`);
        setFeaturedProducts(response.data.products);
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <div className="min-h-screen flex flex-col" data-testid="home-page">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative bg-[#F5F5F7] overflow-hidden" data-testid="hero-section">
          <div className="container mx-auto px-4 md:px-6 py-16 md:py-24 lg:py-32">
            <div className="max-w-3xl">
              <h1 className="font-heading text-5xl md:text-7xl font-bold tracking-tight text-[#1D1D1F] animate-slide-up">
                Discover.
                <br />
                <span className="text-[#86868B]">Experience.</span>
                <br />
                Own.
              </h1>
              <p className="mt-6 text-lg md:text-xl text-[#86868B] max-w-xl animate-slide-up" style={{ animationDelay: '0.1s' }}>
                Curated collection of premium products designed to elevate your everyday life.
              </p>
              <div className="mt-8 flex flex-wrap gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <Link to="/products">
                  <Button className="bg-black text-white hover:bg-gray-800 rounded-full px-8 py-6 text-base font-medium transition-transform duration-300 hover:scale-105" data-testid="shop-now-btn">
                    Shop Now
                    <ArrowRight className="ml-2 h-5 w-5" strokeWidth={1.5} />
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Hero Image */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1/2 h-full hidden lg:block">
            <img 
              src="https://images.unsplash.com/photo-1644566622057-baae2f78f652?crop=entropy&cs=srgb&fm=jpg&q=85"
              alt="Hero"
              className="w-full h-full object-cover"
            />
          </div>
        </section>

        {/* Features */}
        <section className="py-16 bg-white border-b border-gray-100" data-testid="features-section">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex items-center space-x-4 p-6 rounded-2xl hover:bg-[#F5F5F7] transition-colors">
                <div className="p-3 bg-[#F5F5F7] rounded-full">
                  <Truck className="h-6 w-6 text-[#1D1D1F]" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="font-medium text-[#1D1D1F]">Fast Shipping</h3>
                  <p className="text-sm text-[#86868B]">Flat ₹100 delivery pan-India</p>
                </div>
              </div>
              <div className="flex items-center space-x-4 p-6 rounded-2xl hover:bg-[#F5F5F7] transition-colors">
                <div className="p-3 bg-[#F5F5F7] rounded-full">
                  <Shield className="h-6 w-6 text-[#1D1D1F]" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="font-medium text-[#1D1D1F]">Secure Checkout</h3>
                  <p className="text-sm text-[#86868B]">Powered by Stripe</p>
                </div>
              </div>
              <div className="flex items-center space-x-4 p-6 rounded-2xl hover:bg-[#F5F5F7] transition-colors">
                <div className="p-3 bg-[#F5F5F7] rounded-full">
                  <CreditCard className="h-6 w-6 text-[#1D1D1F]" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="font-medium text-[#1D1D1F]">Multiple Payments</h3>
                  <p className="text-sm text-[#86868B]">Cards, UPI & more</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Products */}
        <section className="py-16 md:py-24 bg-white" data-testid="featured-products-section">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex items-end justify-between mb-12">
              <div>
                <p className="text-sm text-[#86868B] uppercase tracking-wider mb-2">Curated Selection</p>
                <h2 className="font-heading text-3xl md:text-5xl font-semibold tracking-tight text-[#1D1D1F]">
                  Featured Products
                </h2>
              </div>
              <Link to="/products" className="hidden md:flex items-center text-[#0071E3] hover:underline font-medium">
                View All
                <ArrowRight className="ml-1 h-4 w-4" strokeWidth={1.5} />
              </Link>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-[#F5F5F7] rounded-2xl aspect-square" />
                    <div className="mt-4 space-y-2">
                      <div className="h-4 bg-[#F5F5F7] rounded w-3/4" />
                      <div className="h-3 bg-[#F5F5F7] rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {featuredProducts.map((product, index) => (
                  <div key={product.product_id} className="animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            )}

            <div className="mt-12 text-center md:hidden">
              <Link to="/products">
                <Button variant="outline" className="rounded-full px-8" data-testid="view-all-mobile-btn">
                  View All Products
                  <ArrowRight className="ml-2 h-4 w-4" strokeWidth={1.5} />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="py-16 md:py-24 bg-[#F5F5F7]" data-testid="categories-section">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-12">
              <p className="text-sm text-[#86868B] uppercase tracking-wider mb-2">Browse By</p>
              <h2 className="font-heading text-3xl md:text-5xl font-semibold tracking-tight text-[#1D1D1F]">
                Categories
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Link to="/products/tech" className="group relative overflow-hidden rounded-3xl aspect-[16/9]" data-testid="category-tech">
                <img 
                  src="https://images.unsplash.com/photo-1560718217-69193acc0713?crop=entropy&cs=srgb&fm=jpg&q=85"
                  alt="Technology"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />
                <div className="absolute bottom-8 left-8">
                  <h3 className="font-heading text-2xl md:text-3xl font-semibold text-white">Technology</h3>
                  <p className="mt-2 text-white/80">Gadgets & accessories</p>
                </div>
              </Link>

              <Link to="/products/home" className="group relative overflow-hidden rounded-3xl aspect-[16/9]" data-testid="category-home">
                <img 
                  src="https://images.unsplash.com/photo-1765277114329-b3da8e70731e?crop=entropy&cs=srgb&fm=jpg&q=85"
                  alt="Home & Living"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />
                <div className="absolute bottom-8 left-8">
                  <h3 className="font-heading text-2xl md:text-3xl font-semibold text-white">Home & Living</h3>
                  <p className="mt-2 text-white/80">Decor & furniture</p>
                </div>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};
