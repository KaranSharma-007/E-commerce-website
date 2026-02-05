import React from 'react';
import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <footer className="bg-[#F5F5F7] border-t border-gray-200" data-testid="footer">
      <div className="container mx-auto px-4 md:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <h3 className="font-heading text-lg font-bold mb-4">E1 Store</h3>
            <p className="text-sm text-[#86868B] leading-relaxed">
              Premium products, crafted with care. Experience the difference of quality.
            </p>
          </div>

          {/* Shop */}
          <div>
            <h4 className="font-heading text-sm font-semibold uppercase tracking-wider mb-4">Shop</h4>
            <ul className="space-y-3">
              <li><Link to="/products" className="text-sm text-[#86868B] hover:text-[#1D1D1F] transition-colors">All Products</Link></li>
              <li><Link to="/products/tech" className="text-sm text-[#86868B] hover:text-[#1D1D1F] transition-colors">Technology</Link></li>
              <li><Link to="/products/home" className="text-sm text-[#86868B] hover:text-[#1D1D1F] transition-colors">Home & Living</Link></li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="font-heading text-sm font-semibold uppercase tracking-wider mb-4">Account</h4>
            <ul className="space-y-3">
              <li><Link to="/orders" className="text-sm text-[#86868B] hover:text-[#1D1D1F] transition-colors">My Orders</Link></li>
              <li><Link to="/cart" className="text-sm text-[#86868B] hover:text-[#1D1D1F] transition-colors">Shopping Cart</Link></li>
            </ul>
          </div>

          {/* Shipping */}
          <div>
            <h4 className="font-heading text-sm font-semibold uppercase tracking-wider mb-4">Shipping</h4>
            <ul className="space-y-3">
              <li className="text-sm text-[#86868B]">Flat ₹100 shipping</li>
              <li className="text-sm text-[#86868B]">Delhivery & BlueDart</li>
              <li className="text-sm text-[#86868B]">Pan-India delivery</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-center text-sm text-[#86868B]">
            © {new Date().getFullYear()} E1 Store. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
