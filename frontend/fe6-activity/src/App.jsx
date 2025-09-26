import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Dashboard, ResumeBuilder, Login, Signup, Home, CoverLetter, CareerCopilot } from './pages';
import Layout from './components/Layout';

const clientId = "522460567146-ubk3ojomopil8f68hl73jt1pj0jbbm68.apps.googleusercontent.com"; // 🔹 Replace with your actual Google OAuth Client ID

console.log('App component rendering');

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));

  console.log("App.jsx - Initial isAuthenticated state:", isAuthenticated);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      setIsAuthenticated(!!token);
    };

    window.addEventListener('storage', checkAuth);
    return () => {
      window.removeEventListener('storage', checkAuth);
    };
  }, []);

  useEffect(() => {
    console.log("App.jsx - isAuthenticated state changed:", isAuthenticated);
  }, [isAuthenticated]);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    window.location.href = '/login'; // Temporary redirect using window.location
    console.log("App.jsx - Logout function called - isAuthenticated set to false (window.location)");
  };

  const ProtectedRoute = ({ children }) => {
    if (!isAuthenticated) {
      return <Navigate to="/login" />;
    }
    return <Layout logout={logout}>{children}</Layout>;
  };

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route
            path="/login"
            element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login setIsAuthenticated={setIsAuthenticated} />}
          />
          <Route
            path="/signup"
            element={isAuthenticated ? <Navigate to="/dashboard" /> : <Signup />}
          />

          {/* Protected Routes */}
          <Route
            path="/"
            element={<ProtectedRoute><Home /></ProtectedRoute>}
          />
          <Route
            path="/dashboard"
            element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
          />
          <Route
            path="/resume-builder"
            element={<ProtectedRoute><ResumeBuilder /></ProtectedRoute>}
          />
          <Route
            path="/cover-letter"
            element={<ProtectedRoute><CoverLetter /></ProtectedRoute>}
          />
          <Route
            path="/career-copilot"
            element={<ProtectedRoute><CareerCopilot /></ProtectedRoute>}
          />

          {/* Catch-all Route */}
          <Route
            path="*"
            element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />}
          />
        </Routes>
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;
