import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { toast } from 'sonner';

export const AuthCallback = () => {
  const { processGoogleSession } = useAuth();
  const navigate = useNavigate();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Prevent double processing in StrictMode
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const handleCallback = async () => {
      try {
        // Get session_id from URL fragment
        const hash = window.location.hash;
        const sessionIdMatch = hash.match(/session_id=([^&]+)/);
        
        if (!sessionIdMatch) {
          throw new Error('No session ID found');
        }

        const sessionId = sessionIdMatch[1];
        
        // Process the session
        await processGoogleSession(sessionId);
        
        toast.success('Successfully signed in!');
        
        // Clear the hash and redirect
        window.history.replaceState(null, '', window.location.pathname);
        navigate('/', { replace: true });
      } catch (error) {
        console.error('Auth callback error:', error);
        toast.error('Failed to sign in. Please try again.');
        navigate('/login', { replace: true });
      }
    };

    handleCallback();
  }, [processGoogleSession, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="w-12 h-12 mx-auto mb-4">
          <div className="w-full h-full border-4 border-black border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="text-[#86868B]">Completing sign in...</p>
      </div>
    </div>
  );
};
