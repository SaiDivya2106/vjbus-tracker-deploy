import React, { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../Context/AuthContext";
import "./NavBar.css";


const NavBar = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [isNavbarOpen, setIsNavbarOpen] = useState(false);
  const { user, isAdmin, isAssistant, logout } = useAuth();
  const navigate = useNavigate();
  const dropdownRef = useRef();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false); // ✅ track super admin
  const baseUrl = process.env.REACT_APP_COMPLAINTS_APP_BE_URL;

  const handleLogout = async () => {
    await logout();
    navigate("/complaints-website");
    setIsNavbarOpen(false); // close navbar after logout
  };

  // ✅ Check if user is SuperAdmin when navbar loads
  useEffect(() => {
    const checkSuperAdmin = async () => {
      if (!user?.email) return;

      try {
        const res = await fetch(`${baseUrl}/admin-api/superadmin/check`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: user.email }),
        });

        const data = await res.json();
        if (res.ok && data.isSuperAdmin) {
          setIsSuperAdmin(true);
        } else {
          setIsSuperAdmin(false);
        }
      } catch (err) {
        console.error("Error checking superadmin:", err);
        setIsSuperAdmin(false);
      }
    };

    checkSuperAdmin();
  }, [user]);


  // Close dropdown when clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark fixed-top">
      <div className="container-fluid">
        <div
          className="logo text-white"
          onClick={() => {
            navigate("/complaints-website");
            setIsNavbarOpen(false);
          }}
        >
          THRIVE
        </div>
        <button
          className="navbar-toggler"
          type="button"
          onClick={() => setIsNavbarOpen((prev) => !prev)}
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className={`collapse navbar-collapse ${isNavbarOpen ? "show" : ""}`} id="navbarNav">
          <ul className="navbar-nav ms-auto mb-lg-0">
            {user && (
              <li className="nav-item">
                <NavLink
                  className="nav-link"
                  to="/all-complaints"
                  onClick={() => setIsNavbarOpen(false)}
                >
                  All Support-Requests
                </NavLink>
              </li>
            )}
            {user && (
              <li className="nav-item">
                <NavLink
                  className="nav-link"
                  to="/user-analysis"
                  state={{ email: user.email }}
                  onClick={() => setIsNavbarOpen(false)}
                >
                  Dashboard
                </NavLink>
              </li>
            )}


            {user && (
              <li className="nav-item">
                <NavLink
                  className="nav-link"
                  to="/my-complaints"
                  state={{ email: user.email }}
                  onClick={() => setIsNavbarOpen(false)}
                >
                  My Requests
                </NavLink>
              </li>
            )}

            {(isAdmin || isAssistant) && (
              <li className="nav-item">
                <NavLink
                  className="nav-link"
                  to="/adminpage"
                  onClick={() => setIsNavbarOpen(false)}
                >
                  Resolve
                </NavLink>
              </li>
            )}
            {isSuperAdmin && (
              <li className="nav-item">
                <NavLink className="nav-link" to="/superadmin-dashboard" onClick={() => setIsNavbarOpen(false)}>
                  SuperAdmin
                </NavLink>
              </li>
            )}

            {(user || isAdmin) ? (
              <li className="nav-item dropdown" ref={dropdownRef} style={{ marginTop: "6px" }}>
                <img
                  src={user?.picture || "/default-avatar.png"}
                  alt="Profile"
                  className="rounded-circle"
                  style={{ width: "30px", height: "30px", cursor: "pointer" }}
                  onClick={() => setShowDropdown((prev) => !prev)}
                />
                {showDropdown && (
                  <ul
                    className="dropdown-menu dropdown-menu-end show mt-2"
                    style={{ minWidth: "110px", right: 0, transform: "translateX(-5px)" }}
                  >
                    <li>
                      <button className="dropdown-item" onClick={handleLogout}>
                        Logout
                      </button>
                    </li>
                  </ul>
                )}
              </li>
            ) : (
              <li className="nav-item">
                <NavLink
                  className="nav-link"
                  to="/complaints-website"
                  onClick={() => setIsNavbarOpen(false)}
                >
                  Login
                </NavLink>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
