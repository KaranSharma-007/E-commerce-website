import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, User, Menu, X, Search, LogOut, Package, Settings, Heart } from 'lucide-react';
import { useAuth, useCart } from '../App';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

export const Header = () => {
  const { user, logout } = useAuth();
  const { cartCount, wishlistCount } = useCart();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200/50 bg-white/80 backdrop-blur-xl" data-testid="header">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2" data-testid="logo">
            <span className="font-heading text-xl font-bold tracking-tight text-[#1D1D1F]">
              E1 Store
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link 
              to="/products" 
              className="text-sm font-medium text-[#86868B] hover:text-[#1D1D1F] transition-colors"
              data-testid="nav-products"
            >
              All Products
            </Link>
            <Link 
              to="/products/tech" 
              className="text-sm font-medium text-[#86868B] hover:text-[#1D1D1F] transition-colors"
              data-testid="nav-tech"
            >
              Technology
            </Link>
            <Link 
              to="/products/home" 
              className="text-sm font-medium text-[#86868B] hover:text-[#1D1D1F] transition-colors"
              data-testid="nav-home"
            >
              Home & Living
            </Link>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center space-x-4">
            {/* Wishlist */}
            {user && (
              <Link to="/wishlist" className="relative p-2 hover:bg-gray-100 rounded-full transition-colors" data-testid="wishlist-icon">
                <Heart className="h-5 w-5 text-[#1D1D1F]" strokeWidth={1.5} />
                {wishlistCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-5 w-5 flex items-center justify-center bg-red-500 text-white text-xs font-medium rounded-full" data-testid="wishlist-count">
                    {wishlistCount}
                  </span>
                )}
              </Link>
            )}
            
            {/* Cart */}
            <Link to="/cart" className="relative p-2 hover:bg-gray-100 rounded-full transition-colors" data-testid="cart-icon">
              <ShoppingBag className="h-5 w-5 text-[#1D1D1F]" strokeWidth={1.5} />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-5 w-5 flex items-center justify-center bg-black text-white text-xs font-medium rounded-full" data-testid="cart-count">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* User Menu */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full" data-testid="user-menu-trigger">
                    {user.picture ? (
                      <img src={user.picture} alt={user.name} className="h-8 w-8 rounded-full object-cover" />
                    ) : (
                      <User className="h-5 w-5" strokeWidth={1.5} />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-[#86868B]">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/wishlist')} data-testid="menu-wishlist">
                    <Heart className="mr-2 h-4 w-4" strokeWidth={1.5} />
                    My Wishlist
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/orders')} data-testid="menu-orders">
                    <Package className="mr-2 h-4 w-4" strokeWidth={1.5} />
                    My Orders
                  </DropdownMenuItem>
                  {user.role === 'admin' && (
                    <DropdownMenuItem onClick={() => navigate('/admin')} data-testid="menu-admin">
                      <Settings className="mr-2 h-4 w-4" strokeWidth={1.5} />
                      Admin Dashboard
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} data-testid="menu-logout">
                    <LogOut className="mr-2 h-4 w-4" strokeWidth={1.5} />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/login">
                <Button className="bg-black text-white hover:bg-gray-800 rounded-full px-6" data-testid="login-btn">
                  Sign In
                </Button>
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon" data-testid="mobile-menu-toggle">
                  <Menu className="h-5 w-5" strokeWidth={1.5} />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <SheetHeader>
                  <SheetTitle className="font-heading">Menu</SheetTitle>
                </SheetHeader>
                <nav className="mt-8 flex flex-col space-y-4">
                  <Link 
                    to="/products" 
                    className="text-lg font-medium py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    All Products
                  </Link>
                  <Link 
                    to="/products/tech" 
                    className="text-lg font-medium py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Technology
                  </Link>
                  <Link 
                    to="/products/home" 
                    className="text-lg font-medium py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Home & Living
                  </Link>
                  {!user && (
                    <Link 
                      to="/login" 
                      className="text-lg font-medium py-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Sign In
                    </Link>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};
