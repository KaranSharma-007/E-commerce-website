import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Lock, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function ResetPasswordPage() {
  const { updatePassword } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isValidToken, setIsValidToken] = useState(false);
  const [checkingToken, setCheckingToken] = useState(true);

  useEffect(() => {
    const checkRecoveryToken = async () => {
      console.log('Checking for recovery token...');
      console.log('Current URL:', window.location.href);
      
      // Check URL hash first (Supabase default: #access_token=...&type=recovery)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const hashAccessToken = hashParams.get('access_token');
      const hashType = hashParams.get('type');
      
      // Check query parameters (?token=...&type=recovery)
      const queryToken = searchParams.get('token');
      const queryType = searchParams.get('type');
      
      console.log('Hash access_token:', hashAccessToken, 'Type:', hashType);
      console.log('Query token:', queryToken, 'Type:', queryType);

      // Handle hash-based tokens (standard Supabase format)
      if (hashType === 'recovery' && hashAccessToken) {
        console.log('Found hash-based recovery token');
        
        // Check if we have a valid session (Supabase auto-handles this)
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (session && !error) {
          console.log('Valid recovery session from hash');
          setIsValidToken(true);
          // Clean up URL
          window.history.replaceState({}, document.title, '/reset-password');
        } else {
          console.error('Invalid recovery session:', error);
          toast.error('Invalid or expired reset link');
          setTimeout(() => navigate('/forgot-password'), 2000);
        }
      }
      // Handle query-based tokens (?token=...&type=recovery)
      else if (queryType === 'recovery' && queryToken) {
        console.log('Found query-based recovery token, verifying...');
        
        try {
          // Verify the token with Supabase
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: queryToken,
            type: 'recovery'
          });
          
          if (data?.session && !error) {
            console.log('Valid recovery session from query token');
            setIsValidToken(true);
            // Clean up URL
            window.history.replaceState({}, document.title, '/reset-password');
          } else {
            console.error('Token verification failed:', error);
            toast.error('Invalid or expired reset link');
            setTimeout(() => navigate('/forgot-password'), 2000);
          }
        } catch (err) {
          console.error('Error verifying token:', err);
          toast.error('Invalid or expired reset link');
          setTimeout(() => navigate('/forgot-password'), 2000);
        }
      }
      // No valid token found
      else {
        console.log('No recovery token found in URL');
        console.log('Hash params:', Object.fromEntries(hashParams));
        console.log('Query params:', Object.fromEntries(searchParams));
        toast.error('Please use the reset link sent to your email');
        setTimeout(() => navigate('/forgot-password'), 2000);
      }
      
      setCheckingToken(false);
    };

    checkRecoveryToken();
  }, [navigate, searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await updatePassword(password);
      toast.success('Password updated successfully!');
      navigate('/login');
    } catch (error) {
      console.error('Password update error:', error);
      toast.error(error.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  if (checkingToken) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="mt-4 text-[#86868B]">Verifying reset link...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!isValidToken) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-[#86868B]">Redirecting...</p>
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
              Reset Password
            </h1>
            <p className="mt-2 text-[#86868B]">
              Enter your new password below
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="password" className="text-sm font-medium text-[#1D1D1F]">
                New Password
              </Label>
              <div className="relative mt-2">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#86868B]" strokeWidth={1.5} />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-12 h-12 rounded-lg"
                  placeholder="Enter new password"
                  disabled={loading}
                  required
                  minLength={6}
                />
              </div>
              <p className="text-xs text-[#86868B] mt-1">
                Must be at least 6 characters
              </p>
            </div>

            <div>
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-[#1D1D1F]">
                Confirm Password
              </Label>
              <div className="relative mt-2">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#86868B]" strokeWidth={1.5} />
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-12 h-12 rounded-lg"
                  placeholder="Confirm new password"
                  disabled={loading}
                  required
                  minLength={6}
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
                  Updating...
                </span>
              ) : (
                <>
                  Update Password
                  <ArrowRight className="ml-2 h-5 w-5" strokeWidth={1.5} />
                </>
              )}
            </Button>
          </form>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}