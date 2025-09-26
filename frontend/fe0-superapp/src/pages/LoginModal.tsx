import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import Cookies from 'js-cookie';
import { useAuth } from './context/AuthContext';

interface LoginModalProps {
  onClose: () => void;
  onLogin: (username: string, email: string, picture?: string) => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ onClose, onLogin }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { setIsAuthenticated } = useAuth();

  // This function will be called once Google login is successful
  const handleCredentialResponse = async (response: any) => {
    const idToken = response.credential;
    // console.log("Google ID Token:", idToken); // Log the token to verify it's not undefined

    // Ensure the token is not undefined
    if (!idToken) {
      console.error("Google ID Token is undefined");
      return;
    }

    setIsLoading(true);
    try {
      const backendResponse = await fetch('https://auth.vjstartup.com/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: idToken }), // Send the Google ID token to backend
        credentials: 'include',
      });

      if (!backendResponse.ok) {
        throw new Error('Failed to authenticate with backend');
      }

      const data = await backendResponse.json();
      // console.log('Server Response:', data);

      const { token, user } = data;

      // Set cookies for JWT and user data
      const isSecure = window.location.protocol === 'https:';
      const isLocalhost = window.location.hostname === 'localhost';
      const cookieOptions = {
        path: '/',
        secure: isSecure && !isLocalhost,
        sameSite: 'lax' as const,
        expires: 1,
        ...(isLocalhost ? {} : { domain: '.vjstartup.com' }),                   
      };

      Cookies.set('userToken', token, cookieOptions);
      Cookies.set('user', JSON.stringify(user), cookieOptions);

      setIsAuthenticated(true); // Update authentication state
      onLogin(user.name, user.email, user.picture); // Call onLogin to pass the user data
    } catch (err) {
      console.error('Error during Google login:', err);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Initialize Google login button on component mount
    google.accounts.id.initialize({
      client_id: '522460567146-ubk3ojomopil8f68hl73jt1pj0jbbm68.apps.googleusercontent.com', // Replace with your client ID
      callback: handleCredentialResponse,
    });

    // Render Google login button
    google.accounts.id.renderButton(
      document.getElementById('login')!,
      { theme: 'outline', size: 'large' } // Customize button size and theme
    );
  }, []); // Empty dependency array ensures this runs only once on mount

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex justify-between items-center bg-indigo-700 text-white px-6 py-4">
          <h3 className="text-xl font-bold">Login to VNRVJIET Super App</h3>
          <button onClick={onClose} className="text-indigo-100 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500"> Please login with the college account</span>
            </div>
          </div>

          <button
            id="login"
            className="w-full flex items-center justify-center space-x-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 py-2.5 px-4 rounded-lg disabled:opacity-50"
            disabled={isLoading}
          >
            <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
              <path
                fill="#EA4335"
                d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
              />
              <path
                fill="#4285F4"
                d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
              />
              <path
                fill="#FBBC05"
                d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
              />
              <path
                fill="#34A853"
                d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
              />
              <path fill="none" d="M0 0h48v48H0z" />
            </svg>
            <span>Sign in with Google</span>
          </button>

          <div className="text-center text-sm text-gray-500 mt-4">
            <p>Use your VNRVJIET Google account to sign in</p>
            <p className="mt-2">
              Don&apos;t have an account?{' '}
              <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500">
                Sign up
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
