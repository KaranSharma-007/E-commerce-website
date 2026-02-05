import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAuth } from '../App';
import { toast } from 'sonner';
import { Mail, Lock, ArrowRight } from 'lucide-react';

export const LoginPage = () => {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white" data-testid="login-page">
      <Header />
      
      <main className="flex-1 flex items-center justify-center py-16">
        <div className="w-full max-w-md px-4">
          <div className="text-center mb-8">
            <h1 className="font-heading text-3xl md:text-4xl font-bold text-[#1D1D1F]">
              Welcome Back
            </h1>
            <p className="mt-2 text-[#86868B]">
              Sign in to your account to continue
            </p>
          </div>

          <div className="space-y-6">
            {/* Google Login */}
            <Button
              type="button"
              onClick={loginWithGoogle}
              variant="outline"
              className="w-full h-12 rounded-full border-gray-200 hover:bg-[#F5F5F7] transition-colors"
              data-testid="google-login-btn"
            >
              <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-[#86868B]">or</span>
              </div>
            </div>

            {/* Email Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-sm font-medium text-[#1D1D1F]">
                  Email
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
                    data-testid="email-input"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="password" className="text-sm font-medium text-[#1D1D1F]">
                  Password
                </Label>
                <div className="relative mt-2">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#86868B]" strokeWidth={1.5} />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-12 h-12 rounded-lg"
                    placeholder="••••••••"
                    data-testid="password-input"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-black text-white hover:bg-gray-800 rounded-full py-6 text-base font-medium"
                data-testid="login-submit-btn"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Signing in...
                  </span>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="ml-2 h-5 w-5" strokeWidth={1.5} />
                  </>
                )}
              </Button>
            </form>

            <div className="text-center mt-6">
              <Link to="/forgot-password" className="text-gray-600 hover:text-black transition-colors text-sm">
                Forgot password?
              </Link>
            </div>

            <p className="text-center text-[#86868B]">
              Don't have an account?{' '}
              <Link to="/register" className="text-[#0071E3] hover:underline font-medium">
                Sign up
              </Link>
            </p>

            {/* Demo Credentials */}
            <div className="bg-[#F5F5F7] rounded-xl p-4 text-sm">
              <p className="font-medium text-[#1D1D1F] mb-2">Demo Admin Credentials:</p>
              <p className="text-[#86868B]">Email: admin@store.com</p>
              <p className="text-[#86868B]">Password: admin123</p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
