import React, { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCategory, setAdminCategory] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshTimeout, setRefreshTimeout] = useState(null);

  const baseUrl = process.env.REACT_APP_COMPLAINTS_APP_BE_URL;

  useEffect(() => {
  const interceptor = axios.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error?.response?.status === 401) {
        console.log("⛔ Token expired — logging out automatically");

        logout(); // Use your existing logout function

        // Redirect user to login page
        window.location.href = "/complaints-website";
      }
      return Promise.reject(error);
    }
  );

  // Cleanup
  return () => axios.interceptors.response.eject(interceptor);
}, []);



  // --- Decode JWT ---
  const decodeJwt = (token) => JSON.parse(atob(token.split(".")[1]));

  // --- Schedule refresh ---
  const scheduleTokenRefresh = (token) => {
    if (!token) return;
    const { exp } = decodeJwt(token);
    const expiresIn = exp * 1000 - Date.now();
    const refreshTime = expiresIn - 2 * 60 * 1000;

    if (refreshTimeout) clearTimeout(refreshTimeout);
    if (refreshTime <= 0) return;

    const timeout = setTimeout(async () => {
      const refreshed = await silentRefreshToken();
      if (refreshed) scheduleTokenRefresh(localStorage.getItem("authToken"));
    }, refreshTime);

    setRefreshTimeout(timeout);
  };

  // --- Handle login response ---
  const handleGoogleResponse = async (response) => {
    if (!response.credential) return;
    const idToken = response.credential;

    localStorage.setItem("authToken", idToken);
    setAuthToken(idToken);
    scheduleTokenRefresh(idToken);

    try {
      const res = await fetch("https://auth.vjstartup.com/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token: idToken }),
      });

      if (!res.ok) {
        throw new Error("Access denied");
      }

      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        checkAdminStatus(data.user.email);
      }
    } catch (err) {
      console.error("Login failed:", err);
      logout(); // clear bad token if access denied
    }
  };

  // --- Initialize Google ---
  const initializeGoogle = () => {
    if (!window.google?.accounts?.id || window.googleInitialized) return;

    window.google.accounts.id.initialize({
      client_id:
        "522460567146-ubk3ojomopil8f68hl73jt1pj0jbbm68.apps.googleusercontent.com",
      callback: handleGoogleResponse,
      auto_select: false,
    });

    window.googleInitialized = true;
    showLoginButton();
  };

  // --- Silent refresh ---
  const silentRefreshToken = () =>
    new Promise((resolve) => {
      if (!window.google?.accounts?.id) return resolve(false);
      initializeGoogle();

      let done = false;
      const finish = (success) => {
        if (!done) {
          done = true;
          resolve(success);
        }
      };

      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          showLoginButton();
        }
      }, { select_account: true });

      setTimeout(() => finish(false), 3000);
    });

  // --- Check admin ---
  const checkAdminStatus = async (email) => {
    console.log("baseURl",baseUrl)
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch(`${baseUrl}/admin-api/check-admin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setIsAdmin(data.isAdmin);
      setAdminCategory(
        data.isAdmin
          ? Array.isArray(data.adminCategories)
            ? data.adminCategories
            : [data.adminCategory].filter(Boolean)
          : []
      );
    } catch (err) {
      console.error("Error checking admin:", err);
    }
  };

  // --- Render Google login button ---
  const showLoginButton = () => {
    if (!window.google?.accounts?.id) return;
    const div = document.getElementById("googleLoginDiv");
    if (!div) return;

    div.innerHTML = ""; // clear old
    window.google.accounts.id.renderButton(div, {
      theme: "outline",
      size: "large",
      type: "standard",
    });
  };

  // --- Login trigger ---
  const loginWithSSO = () => {
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt({ select_account: true });
    } else {
      console.warn("Google not initialized yet");
    }
  };

  // --- Logout ---
  const logout = async () => {
    if (refreshTimeout) clearTimeout(refreshTimeout);

    await fetch("https://auth.vjstartup.com/logout", {
      method: "POST",
      credentials: "include",
    });

    setUser(null);
    setIsAdmin(false);
    setAdminCategory(null);
    localStorage.removeItem("authToken");
    setAuthToken(null);

    const div = document.getElementById("googleLoginDiv");
    if (div) div.innerHTML = "";
    setTimeout(() => showLoginButton(), 50);
  };

  // --- Inject Google script ---
  useEffect(() => {
    const loadGoogleScript = () => {
      if (document.getElementById("google-js")) {
        initializeGoogle();
        return;
      }

      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.id = "google-js";
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogle;
      document.body.appendChild(script);
    };

    loadGoogleScript();

    const initAuth = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (token) {
          const { exp } = decodeJwt(token);
          if (Date.now() >= exp * 1000) {
            const refreshed = await silentRefreshToken();
            if (!refreshed) {
              showLoginButton();
              return;
            }
          } else {
            scheduleTokenRefresh(token);
          }
        }

        const res = await fetch("https://auth.vjstartup.com/check-auth", {
          credentials: "include",
        });
        const data = await res.json();
        if (data.logged_in) {
          setUser(data.user);
          checkAdminStatus(data.user.email);
        } else {
          showLoginButton();
        }
      } catch (err) {
        console.error("Auth init failed:", err);
        showLoginButton();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        adminCategory,
        loginWithSSO,
        logout,
        authToken,
        loading,
      }}
    >
      {loading ? null : children}
    </AuthContext.Provider>
  );
};
