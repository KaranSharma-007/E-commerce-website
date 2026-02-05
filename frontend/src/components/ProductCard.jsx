import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart, useAuth } from '../App';
import { Button } from './ui/button';
import { ShoppingBag, Heart } from 'lucide-react';

export const ProductCard = ({ product }) => {
  const { addToCart, addToWishlist, removeFromWishlist, wishlist } = useCart();
  const { user } = useAuth();
  const [isInWishlist, setIsInWishlist] = useState(false);

  // Check if product is in wishlist
  useEffect(() => {
    if (wishlist?.items && user) {
      const inWishlist = wishlist.items.some(
        item => item.product_id === product.product_id
      );
      setIsInWishlist(inWishlist);
    } else {
      setIsInWishlist(false);
    }
  }, [wishlist, product.product_id, user]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(price);
  };

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    await addToCart(product.product_id);
  };

  const handleToggleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isInWishlist) {
      // Remove from wishlist
      await removeFromWishlist(product.product_id);
    } else {
      // Add to wishlist
      await addToWishlist(product.product_id);
    }
  };

  return (
    <Link 
      to={`/product/${product.product_id}`}
      className="group block"
      data-testid={`product-card-${product.product_id}`}
    >
      <div className="relative bg-[#F5F5F7] rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl border border-transparent hover:border-gray-100">
        {/* Image */}
        <div className="aspect-square overflow-hidden">
          <img 
            src={product.images[0]} 
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>

        {/* Quick Action Buttons */}
        <div className="absolute bottom-4 right-4 flex gap-2">
          {/* Add to Wishlist Button */}
          <button
            onClick={handleToggleWishlist}
            className={`p-3 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
              isInWishlist 
                ? 'text-red-500 hover:bg-red-50' 
                : 'hover:bg-black hover:text-white'
            }`}
            data-testid={`add-to-wishlist-${product.product_id}`}
          >
            <Heart 
              className="h-5 w-5" 
              strokeWidth={1.5}
              fill={isInWishlist ? 'currentColor' : 'none'}
            />
          </button>

          {/* Quick Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            className="p-3 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-black hover:text-white"
            data-testid={`quick-add-${product.product_id}`}
          >
            <ShoppingBag className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>

        {/* Featured Badge */}
        {product.featured && (
          <div className="absolute top-4 left-4">
            <span className="bg-black text-white text-xs font-medium px-3 py-1 rounded-full">
              Featured
            </span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="mt-4 space-y-1">
        <h3 className="font-medium text-[#1D1D1F] group-hover:text-[#0071E3] transition-colors">
          {product.name}
        </h3>
        <p className="text-[#86868B] text-sm line-clamp-1">{product.description}</p>
        <p className="font-semibold text-[#1D1D1F]">{formatPrice(product.price)}</p>
      </div>
    </Link>
  );
};