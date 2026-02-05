import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Button } from '../components/ui/button';
import { useAuth, useCart, API } from '../App';
import { CheckCircle, Package, ArrowRight, XCircle } from 'lucide-react';

export const OrderSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const { getAuthHeaders } = useAuth();
  const { fetchCart } = useCart();
  const navigate = useNavigate();
  
  const [status, setStatus] = useState('checking');
  const [attempts, setAttempts] = useState(0);
  const hasPolled = useRef(false);

  useEffect(() => {
    if (!sessionId) {
      navigate('/');
      return;
    }

    if (hasPolled.current) return;
    hasPolled.current = true;

    const pollPaymentStatus = async (attempt = 0) => {
      const maxAttempts = 5;
      const pollInterval = 2000;

      if (attempt >= maxAttempts) {
        setStatus('timeout');
        return;
      }

      try {
        const response = await axios.get(
          `${API}/checkout/status/${sessionId}`,
          { withCredentials: true, headers: getAuthHeaders() }
        );

        if (response.data.payment_status === 'paid') {
          setStatus('success');
          await fetchCart(); // Refresh cart (should be empty now)
          return;
        } else if (response.data.status === 'expired') {
          setStatus('expired');
          return;
        }

        // Continue polling
        setAttempts(attempt + 1);
        setTimeout(() => pollPaymentStatus(attempt + 1), pollInterval);
      } catch (error) {
        console.error('Error checking payment status:', error);
        setStatus('error');
      }
    };

    pollPaymentStatus();
  }, [sessionId, getAuthHeaders, fetchCart, navigate]);

  return (
    <div className="min-h-screen flex flex-col bg-white" data-testid="order-success-page">
      <Header />
      
      <main className="flex-1 flex items-center justify-center">
        <div className="container mx-auto px-4 md:px-6 py-16">
          <div className="max-w-lg mx-auto text-center">
            {status === 'checking' && (
              <>
                <div className="w-16 h-16 mx-auto mb-6">
                  <div className="w-full h-full border-4 border-black border-t-transparent rounded-full animate-spin" />
                </div>
                <h1 className="font-heading text-2xl md:text-3xl font-bold text-[#1D1D1F] mb-4">
                  Processing Your Payment
                </h1>
                <p className="text-[#86868B]">
                  Please wait while we confirm your payment...
                </p>
              </>
            )}

            {status === 'success' && (
              <>
                <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center animate-slide-up">
                  <CheckCircle className="w-10 h-10 text-green-600" strokeWidth={1.5} />
                </div>
                <h1 className="font-heading text-3xl md:text-4xl font-bold text-[#1D1D1F] mb-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                  Order Confirmed!
                </h1>
                <p className="text-lg text-[#86868B] mb-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                  Thank you for your purchase. Your order has been successfully placed and will be shipped soon.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up" style={{ animationDelay: '0.3s' }}>
                  <Link to="/orders">
                    <Button className="bg-black text-white hover:bg-gray-800 rounded-full px-8 py-6" data-testid="view-orders-btn">
                      <Package className="mr-2 h-5 w-5" strokeWidth={1.5} />
                      View My Orders
                    </Button>
                  </Link>
                  <Link to="/products">
                    <Button variant="outline" className="rounded-full px-8 py-6" data-testid="continue-shopping-btn">
                      Continue Shopping
                      <ArrowRight className="ml-2 h-5 w-5" strokeWidth={1.5} />
                    </Button>
                  </Link>
                </div>
              </>
            )}

            {(status === 'expired' || status === 'error' || status === 'timeout') && (
              <>
                <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
                  <XCircle className="w-10 h-10 text-red-600" strokeWidth={1.5} />
                </div>
                <h1 className="font-heading text-3xl md:text-4xl font-bold text-[#1D1D1F] mb-4">
                  Payment Issue
                </h1>
                <p className="text-lg text-[#86868B] mb-8">
                  {status === 'expired' 
                    ? 'Your payment session has expired. Please try again.'
                    : status === 'timeout'
                    ? 'We couldn\'t confirm your payment. Please check your orders or contact support.'
                    : 'There was an error processing your payment. Please try again.'}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link to="/cart">
                    <Button className="bg-black text-white hover:bg-gray-800 rounded-full px-8 py-6">
                      Return to Cart
                    </Button>
                  </Link>
                  <Link to="/orders">
                    <Button variant="outline" className="rounded-full px-8 py-6">
                      Check My Orders
                    </Button>
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
