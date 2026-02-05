import React, { useState } from 'react';
import { useAuth } from '../App';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Mail, ArrowRight, CheckCircle } from 'lucide-react';

export function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Please enter your email');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
      toast.success('Password reset email sent! Check your inbox.');
    } catch (error) {
      toast.error(error.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        
        <main className="flex-1 flex items-center justify-center py-16">
          <div className="w-full max-w-md px-4">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
                <CheckCircle className="w-8 h-8 text-green-600" strokeWidth={2} />
              </div>
              
              <h1 className="font-heading text-3xl md:text-4xl font-bold text-[#1D1D1F] mb-3">
                Check Your Email
              </h1>
              
              <p className="text-[#86868B] mb-2">
                We've sent a password reset link to
              </p>
              <p className="font-medium text-[#1D1D1F] mb-6">
                {email}
              </p>
              
              <p className="text-sm text-[#86868B] mb-8">
                Click the link in the email to reset your password. The link will expire in 1 hour.
              </p>
              
              <Link to="/login">
                <Button className="bg-black text-white hover:bg-gray-800 rounded-full px-8 py-6 text-base font-medium">
                  Back to Login
                  <ArrowRight className="ml-2 h-5 w-5" strokeWidth={1.5} />
                </Button>
              </Link>
              
              <p className="mt-6 text-sm text-[#86868B]">
                Didn't receive the email?{' '}
                <button 
                  onClick={() => setSent(false)} 
                  className="text-[#0071E3] hover:underline font-medium"
                >
                  Try again
                </button>
              </p>
            </div>
          </div>
        </main>
        
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      
      <main className="flex-1 flex items-center justify-center py-16">
        <div className="w-full max-w-md px-4">
          <div className="text-center mb-8">
            <h1 className="font-heading text-3xl md:text-4xl font-bold text-[#1D1D1F]">
              Forgot Password?
            </h1>
            <p className="mt-2 text-[#86868B]">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="email" className="text-sm font-medium text-[#1D1D1F]">
                Email Address
              </Label>
              <div className="relative mt-2">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#86868B]" strokeWidth={1.5} />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-12 h-12 rounded-lg"
                  placeholder="you@example.com"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white hover:bg-gray-800 rounded-full py-6 text-base font-medium"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Sending...
                </span>
              ) : (
                <>
                  Send Reset Link
                  <ArrowRight className="ml-2 h-5 w-5" strokeWidth={1.5} />
                </>
              )}
            </Button>

            <div className="text-center">
              <Link to="/login" className="text-sm text-[#86868B] hover:text-[#1D1D1F] inline-flex items-center">
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Login
              </Link>
            </div>
          </form>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
