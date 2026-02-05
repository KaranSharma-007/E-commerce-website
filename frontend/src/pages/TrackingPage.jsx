import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Button } from '../components/ui/button';
import { API } from '../App';
import { ChevronLeft, Truck, Package, CheckCircle, Clock, ExternalLink } from 'lucide-react';

export const TrackingPage = () => {
  const { orderId } = useParams();
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTracking = async () => {
      try {
        const response = await axios.get(`${API}/tracking/${orderId}`);
        setTracking(response.data);
      } catch (error) {
        console.error('Failed to fetch tracking:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTracking();
  }, [orderId]);

  const getStatusSteps = () => {
    const steps = [
      { id: 'pending', label: 'Order Placed', icon: Package },
      { id: 'confirmed', label: 'Confirmed', icon: CheckCircle },
      { id: 'shipped', label: 'Shipped', icon: Truck },
      { id: 'delivered', label: 'Delivered', icon: CheckCircle }
    ];

    const statusOrder = ['pending', 'confirmed', 'shipped', 'delivered'];
    const currentIndex = statusOrder.indexOf(tracking?.status || 'pending');

    return steps.map((step, index) => ({
      ...step,
      completed: index <= currentIndex,
      current: index === currentIndex
    }));
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

  if (!tracking) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center">
          <p className="text-[#86868B] text-lg mb-4">Order not found</p>
          <Link to="/orders">
            <Button variant="outline" className="rounded-full">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Orders
            </Button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const steps = getStatusSteps();

  return (
    <div className="min-h-screen flex flex-col bg-white" data-testid="tracking-page">
      <Header />
      
      <main className="flex-1">
        <div className="container mx-auto px-4 md:px-6 py-8 md:py-16">
          <Link to={`/orders/${orderId}`} className="inline-flex items-center text-[#86868B] hover:text-[#1D1D1F] transition-colors text-sm mb-8">
            <ChevronLeft className="mr-1 h-4 w-4" strokeWidth={1.5} />
            Back to Order
          </Link>

          <div className="max-w-2xl mx-auto">
            <h1 className="font-heading text-3xl md:text-4xl font-bold text-[#1D1D1F] text-center mb-2">
              Track Your Order
            </h1>
            <p className="text-center text-[#86868B] font-mono mb-12">{tracking.order_id}</p>

            {/* Status Timeline */}
            <div className="relative mb-12">
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200" />
              
              <div className="space-y-8">
                {steps.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <div key={step.id} className="relative flex items-start gap-6">
                      <div 
                        className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center ${
                          step.completed 
                            ? step.current 
                              ? 'bg-black text-white' 
                              : 'bg-green-100 text-green-600'
                            : 'bg-gray-100 text-[#86868B]'
                        }`}
                      >
                        {step.completed && !step.current ? (
                          <CheckCircle className="h-6 w-6" strokeWidth={1.5} />
                        ) : (
                          <Icon className="h-6 w-6" strokeWidth={1.5} />
                        )}
                      </div>
                      <div className="pt-4">
                        <p className={`font-medium ${step.completed ? 'text-[#1D1D1F]' : 'text-[#86868B]'}`}>
                          {step.label}
                        </p>
                        {step.current && (
                          <p className="text-sm text-[#0071E3] mt-1">Current Status</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tracking Info */}
            {tracking.tracking_number ? (
              <div className="bg-[#F5F5F7] rounded-2xl p-6 md:p-8">
                <div className="flex items-center gap-2 mb-4">
                  <Truck className="h-5 w-5 text-[#1D1D1F]" strokeWidth={1.5} />
                  <h2 className="font-heading text-lg font-semibold">Shipment Details</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <p className="text-sm text-[#86868B]">Tracking Number</p>
                    <p className="font-mono text-[#1D1D1F]">{tracking.tracking_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[#86868B]">Carrier</p>
                    <p className="text-[#1D1D1F] capitalize">{tracking.tracking_provider}</p>
                  </div>
                </div>

                {tracking.tracking_url && (
                  <a 
                    href={tracking.tracking_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex"
                  >
                    <Button className="bg-black text-white hover:bg-gray-800 rounded-full" data-testid="external-track-btn">
                      Track on {tracking.tracking_provider}
                      <ExternalLink className="ml-2 h-4 w-4" strokeWidth={1.5} />
                    </Button>
                  </a>
                )}
              </div>
            ) : (
              <div className="bg-[#F5F5F7] rounded-2xl p-6 md:p-8 text-center">
                <Clock className="mx-auto h-12 w-12 text-[#86868B] mb-4" strokeWidth={1} />
                <p className="text-[#86868B]">
                  Tracking information will be available once your order is shipped.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
