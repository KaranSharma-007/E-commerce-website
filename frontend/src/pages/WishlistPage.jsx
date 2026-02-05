import React from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Button } from '../components/ui/button';
import { useCart } from '../App';
import { Heart, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';

export const WishlistPage = () => {
  const { wishlist, loading, removeFromWishlist, moveToCart } = useCart();

  // Debug log to see what data we're getting
  console.log('Wishlist data:', wishlist);

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

  // Check if wishlist is empty
  const wishlistItems = wishlist?.items || [];
  const isEmpty = wishlistItems.length === 0;

  return (
    <div className="min-h-screen flex flex-col" data-testid="wishlist-page">
      <Header />
      <main className="flex-1 bg-white">
        <div className="container mx-auto px-4 md:px-6 py-8 md:py-16">
          <h1 className="font-heading text-3xl md:text-5xl font-bold tracking-tight text-[#1D1D1F] mb-8">
            My Wishlist
          </h1>

          {isEmpty ? (
            <div className="text-center py-16">
              <Heart className="mx-auto h-16 w-16 text-[#86868B] mb-4" strokeWidth={1} />
              <p className="text-[#86868B] text-lg mb-6">Your wishlist is empty</p>
              <Link to="/products">
                <Button className="bg-black text-white hover:bg-gray-800 rounded-full px-8" data-testid="browse-products-btn">
                  Browse Products
                  <ArrowRight className="ml-2 h-4 w-4" strokeWidth={1.5} />
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {wishlistItems.map((item) => (
                <div
                  key={item.product_id}
                  className="bg-[#F5F5F7] rounded-2xl overflow-hidden"
                  data-testid={`wishlist-item-${item.product_id}`}
                >
                  <Link to={`/product/${item.product_id}`}>
                    <div className="aspect-square">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </Link>
                  <div className="p-4">
                    <Link to={`/product/${item.product_id}`}>
                      <h3 className="font-medium text-[#1D1D1F] hover:text-[#0071E3] transition-colors line-clamp-1">
                        {item.name}
                      </h3>
                    </Link>
                    <p className="text-lg font-semibold text-[#1D1D1F] mt-1">
                      {formatPrice(item.price)}
                    </p>
                    <p className={`text-sm mt-1 ${item.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {item.stock > 0 ? `${item.stock} in stock` : 'Out of stock'}
                    </p>
                    <div className="flex gap-2 mt-4">
                      <Button
                        onClick={() => moveToCart(item.product_id)}
                        disabled={item.stock === 0}
                        className="flex-1 bg-black text-white hover:bg-gray-800 rounded-full text-sm"
                        data-testid={`move-to-cart-${item.product_id}`}
                      >
                        <ShoppingBag className="h-4 w-4 mr-1" strokeWidth={1.5} />
                        {item.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => removeFromWishlist(item.product_id)}
                        className="rounded-full px-3"
                        data-testid={`remove-wishlist-${item.product_id}`}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" strokeWidth={1.5} />
                      </Button>
                    </div>
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