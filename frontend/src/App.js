import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback
} from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation
} from 'react-router-dom';
import axios from 'axios';
import { Toaster, toast } from 'sonner';
import { logger } from './utils/logger';

// Pages
import { HomePage } from './pages/HomePage';
import { ProductsPage } from './pages/ProductsPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderSuccessPage } from './pages/OrderSuccessPage';
import { OrdersPage } from './pages/OrdersPage';
import { OrderDetailPage } from './pages/OrderDetailPage';
import { TrackingPage } from './pages/TrackingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { WishlistPage } from './pages/WishlistPage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminProducts } from './pages/admin/AdminProducts';
import { AdminOrders } from './pages/admin/AdminOrders';

import { supabase } from './lib/supabase';

// ================= CONFIG =================
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
export const API = `${BACKEND_URL}/api`;

// ================= AUTH CONTEXT =================
const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔥 Sync Supabase session → Backend user
  const syncUserFromBackend = useCallback(async () => {
    try {
      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        logger.log('No session found');
        setUser(null);
        setLoading(false);
        return;
      }

      logger.log('Session found, syncing user...');

      const res = await axios.get(`${API}/auth/me`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        },
        withCredentials: true
      });

      logger.log('User synced:', res.data);
      setUser(res.data);
    } catch (err) {
      logger.error('Auth sync failed:', err.response?.data || err.message);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load + auth state change
  useEffect(() => {
    syncUserFromBackend();

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      logger.log('Auth state changed:', event);
      syncUserFromBackend();
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [syncUserFromBackend]);

  // Email/password register (Supabase)
  const register = async (email, password, name) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
            full_name: name
          }
        }
      });

      if (error) throw error;

      // Wait for backend to create user
      await new Promise(resolve => setTimeout(resolve, 1000));
      await syncUserFromBackend();

      return data.user;
    } catch (error) {
      logger.error('Register error:', error);
      throw error;
    }
  };

  // Email/password login (Supabase)
  const login = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      // Wait for backend to sync
      await new Promise(resolve => setTimeout(resolve, 1000));
      await syncUserFromBackend();

      return data.user;
    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  };

  // 🔥 Google Login (Supabase)
  const loginWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });

      if (error) throw error;
    } catch (error) {
      logger.error('Google login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      logger.error('Logout error:', error);
    }
  };

  // 🔐 Password Reset
  const resetPassword = async (email) => {
    try {
      // Make sure the redirect URL matches our route exactly
      const redirectUrl = `${window.location.origin}/reset-password`;
      logger.log('Sending reset email with redirect:', redirectUrl);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl
      });

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error('Reset password error:', error);
      throw error;
    }
  };

  const updatePassword = async (newPassword) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error('Update password error:', error);
      throw error;
    }
  };

  // 🔐 Always returns valid auth header
  const getAuthHeaders = async () => {
    try {
      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        logger.warn('No access token available');
        return {};
      }

      return { Authorization: `Bearer ${session.access_token}` };
    } catch (error) {
      logger.error('Get auth headers error:', error);
      return {};
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        loginWithGoogle,
        resetPassword,
        updatePassword,
        getAuthHeaders
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ================= CART CONTEXT =================
const CartContext = createContext(null);
export const useCart = () => useContext(CartContext);

const CartProvider = ({ children }) => {
  const { user, getAuthHeaders } = useAuth();
  const [cart, setCart] = useState({
    items: [],
    subtotal: 0,
    shipping: 0,
    total: 0
  });
  const [wishlist, setWishlist] = useState({ items: [] });
  const [wishlistCount, setWishlistCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!user) {
      setCart({ items: [], subtotal: 0, shipping: 0, total: 0 });
      return;
    }

    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      
      if (!headers.Authorization) {
        logger.warn('No auth header, skipping cart fetch');
        return;
      }

      const res = await axios.get(`${API}/cart`, {
        headers,
        withCredentials: true
      });
      
      logger.log('Cart fetched:', res.data);
      setCart(res.data);
    } catch (err) {
      logger.error('Fetch cart failed:', err.response?.data || err.message);
      
      if (err.response?.status === 401) {
        logger.log('Unauthorized, clearing cart');
        setCart({ items: [], subtotal: 0, shipping: 0, total: 0 });
      }
    } finally {
      setLoading(false);
    }
  }, [user, getAuthHeaders]);

  const fetchWishlist = useCallback(async () => {
    if (!user) {
      setWishlist({ items: [] });
      return;
    }

    try {
      const headers = await getAuthHeaders();
      
      if (!headers.Authorization) {
        logger.warn('No auth header, skipping wishlist fetch');
        return;
      }

      logger.log('Fetching wishlist...');
      const res = await axios.get(`${API}/wishlist`, {
        headers,
        withCredentials: true
      });
      
      logger.log('Wishlist fetched:', res.data);
      setWishlist(res.data);
    } catch (err) {
      logger.error('Fetch wishlist failed:', err.response?.data || err.message);
      
      if (err.response?.status === 401) {
        logger.log('Unauthorized, clearing wishlist');
        setWishlist({ items: [] });
      }
    }
  }, [user, getAuthHeaders]);

  const fetchWishlistCount = useCallback(async () => {
    if (!user) {
      setWishlistCount(0);
      return;
    }

    try {
      const headers = await getAuthHeaders();
      
      if (!headers.Authorization) {
        return;
      }

      const res = await axios.get(`${API}/wishlist/count`, {
        headers,
        withCredentials: true
      });
      
      logger.log('Wishlist count:', res.data.count);
      setWishlistCount(res.data.count);
    } catch (err) {
      logger.error('Wishlist count failed:', err.response?.data || err.message);
    }
  }, [user, getAuthHeaders]);

  useEffect(() => {
    fetchCart();
    fetchWishlist();
    fetchWishlistCount();
  }, [fetchCart, fetchWishlist, fetchWishlistCount]);

  // ========== CART FUNCTIONS ==========

  const addToCart = async (productId, quantity = 1) => {
    if (!user) {
      toast.error('Please login first');
      return false;
    }

    try {
      const headers = await getAuthHeaders();
      
      if (!headers.Authorization) {
        toast.error('Authentication required');
        return false;
      }

      logger.log('Adding to cart:', productId);

      await axios.post(
        `${API}/cart/add`,
        { product_id: productId, quantity },
        {
          headers,
          withCredentials: true
        }
      );
      
      await fetchCart();
      toast.success('Added to cart');
      return true;
    } catch (err) {
      logger.error('Add to cart error:', err.response?.data || err.message);
      toast.error(err.response?.data?.detail || 'Failed to add to cart');
      return false;
    }
  };

  const updateQuantity = async (productId, quantity) => {
    try {
      const headers = await getAuthHeaders();
      
      await axios.put(
        `${API}/cart/update`,
        { product_id: productId, quantity },
        {
          headers,
          withCredentials: true
        }
      );
      
      await fetchCart();
      toast.success('Cart updated');
    } catch (err) {
      logger.error('Update quantity error:', err);
      toast.error('Failed to update cart');
    }
  };

  const moveToWishlist = async (productId) => {
    try {
      const headers = await getAuthHeaders();
      
      await axios.post(
        `${API}/cart/${productId}/move-to-wishlist`,
        {},
        {
          headers,
          withCredentials: true
        }
      );
      
      await fetchCart();
      await fetchWishlist();
      await fetchWishlistCount();
      toast.success('Moved to wishlist');
    } catch (err) {
      logger.error('Move to wishlist error:', err);
      toast.error('Failed to move to wishlist');
    }
  };

  // ========== WISHLIST FUNCTIONS ==========

  const addToWishlist = async (productId) => {
    if (!user) {
      toast.error('Please login first');
      return false;
    }

    try {
      const headers = await getAuthHeaders();
      
      if (!headers.Authorization) {
        toast.error('Authentication required');
        return false;
      }

      logger.log('Adding to wishlist:', productId);

      const response = await axios.post(
        `${API}/wishlist/add`,
        { product_id: productId },
        {
          headers,
          withCredentials: true
        }
      );
      
      await fetchWishlist();
      await fetchWishlistCount();
      
      // Check if backend says it's already in wishlist
      if (response.data.message === "Already in wishlist") {
        toast.info('Already in wishlist');
      } else {
        toast.success('Added to wishlist');
      }
      return true;
    } catch (err) {
      logger.error('Add to wishlist error:', err.response?.data || err.message);
      toast.error(err.response?.data?.detail || 'Failed to add to wishlist');
      return false;
    }
  };

  const removeFromWishlist = async (productId) => {
    try {
      const headers = await getAuthHeaders();
      
      await axios.delete(`${API}/wishlist/${productId}`, {
        headers,
        withCredentials: true
      });
      
      await fetchWishlist();
      await fetchWishlistCount();
      toast.success('Removed from wishlist');
    } catch (err) {
      logger.error('Remove from wishlist error:', err);
      toast.error('Failed to remove from wishlist');
    }
  };

  const moveToCart = async (productId) => {
    try {
      const headers = await getAuthHeaders();
      
      await axios.post(
        `${API}/wishlist/${productId}/move-to-cart`,
        {},
        {
          headers,
          withCredentials: true
        }
      );
      
      await fetchCart();
      await fetchWishlist();
      await fetchWishlistCount();
      toast.success('Moved to cart');
    } catch (err) {
      logger.error('Move to cart error:', err);
      toast.error('Failed to move to cart');
    }
  };

  const cartCount = cart.items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        wishlist,
        loading,
        cartCount,
        wishlistCount,
        addToCart,
        updateQuantity,
        moveToWishlist,
        addToWishlist,
        removeFromWishlist,
        moveToCart,
        fetchCart,
        fetchWishlist,
        fetchWishlistCount
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

// ================= PROTECTED ROUTE =================
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (adminOnly && user.role !== 'admin') {
    toast.error('Admin access required');
    return <Navigate to="/" replace />;
  }

  return children;
};

// ================= ROUTES =================
function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/products" element={<ProductsPage />} />
      <Route path="/products/:category" element={<ProductsPage />} />
      <Route path="/product/:productId" element={<ProductDetailPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      <Route
        path="/cart"
        element={
          <ProtectedRoute>
            <CartPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/wishlist"
        element={
          <ProtectedRoute>
            <WishlistPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/checkout"
        element={
          <ProtectedRoute>
            <CheckoutPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/order-success"
        element={
          <ProtectedRoute>
            <OrderSuccessPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/orders"
        element={
          <ProtectedRoute>
            <OrdersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/orders/:orderId"
        element={
          <ProtectedRoute>
            <OrderDetailPage />
          </ProtectedRoute>
        }
      />

      <Route path="/tracking/:orderId" element={<TrackingPage />} />

      <Route
        path="/admin"
        element={
          <ProtectedRoute adminOnly>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/products"
        element={
          <ProtectedRoute adminOnly>
            <AdminProducts />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/orders"
        element={
          <ProtectedRoute adminOnly>
            <AdminOrders />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

// ================= ROOT =================
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Toaster position="top-center" richColors />
          <AppRouter />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}