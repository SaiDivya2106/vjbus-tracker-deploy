import React, { useState, useEffect } from "react";
import { useAuth } from "../../Context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Container, Row, Col, Button, Modal } from "react-bootstrap";
import { FaShieldAlt, FaClock, FaHeadset } from "react-icons/fa";
import "./LandingPage.css";

const LandingPage = () => {
  const { user, loginWithSSO } = useAuth();
  const navigate = useNavigate();
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Handle modal open
  const handleLoginClick = () => {
    setShowLoginModal(true);
  };

  // Render GIS login button only when modal is open
  useEffect(() => {
    if (showLoginModal) {
      /* global google */
      if (window.google) {
        window.google.accounts.id.renderButton(
          document.getElementById("googleLoginDiv"),
          { theme: "outline", size: "large", width: "100%" }
        );

        window.google.accounts.id.prompt(); // One-tap
      }
    }
  }, [showLoginModal]);

  // Redirect immediately after login
  useEffect(() => {
    if (user) {
      setShowLoginModal(false);
      navigate("/complaints-website");
    }
  }, [user, navigate]);

  return (
    <div className="landing-page">
      <Container className="main-container">
        <Row className="align-items-center">
          {/* Left Column */}
          <Col md={6} className="image-col">
            <img
              src="https://content3.jdmagicbox.com/v2/comp/hyderabad/b9/040pxx40.xx40.170914101243.y2b9/catalogue/vnr-vjiet-hyderabad-mjlzcip2wl.jpg"
              alt="VNRVJIET Campus"
              className="campus-img"
            />
          </Col>

          {/* Right Column */}
          <Col md={6} className="content-col">
            <div className="brand-section">
              <h1 className="app-name">THRIVE</h1>
              <p className="fs-3 fw-semibold">VNRVJIET Reporting & Resolution Portal</p>
            </div>

            {user ? (
              <div className="user-section">
                <h2 className="welcome-text">
                  Welcome back, <span>{user.name || user.email}</span>
                </h2>
                <p className="instruction-text">
                  Help us maintain campus standards by reporting issues or tracking existing requests
                </p>

                <div className="action-btns">
                  <Button
                    variant="primary"
                    className="action-btn"
                    onClick={() => navigate("/all-complaints")}
                  >
                    <i className="bi bi-list-check me-2"></i> View Requests
                  </Button>
                  <Button
                    variant="success"
                    className="action-btn"
                    onClick={() => navigate("/complaint-form")}
                  >
                    <i className="bi bi-plus-circle me-2"></i> Report New Request
                  </Button>
                </div>
              </div>
            ) : (
              <div className="guest-section">
                <h2 className="tagline">Campus Concerns Resolution Portal</h2>
                <p className="description fw-medium">
                  A transparent platform for students to voice concerns and ensure timely resolution
                </p>

                <ul className="features">
                  <li className="fw-medium">
                    <FaShieldAlt className="feature-icon text-primary me-2" />
                    Secure & confidential request submission
                  </li>
                  <li className="fw-medium">
                    <FaClock className="feature-icon text-primary me-2" />
                    Real-time tracking of request status
                  </li>
                  <li className="fw-medium">
                    <FaHeadset className="feature-icon text-primary me-2" />
                    Admin support for quicker resolution
                  </li>
                </ul>

                {/* Custom Login Button */}
                <Button onClick={handleLoginClick} className="google-login-btn">
                  <div className="btn-content">
                    <svg width="20" height="20" viewBox="0 0 24 24" className="google-icon">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    <span className="ms-2">Sign in with Google</span>
                  </div>
                </Button>

                <p className="login-note mt-3">
                  <i className="bi bi-exclamation-triangle-fill text-danger me-2"></i>
                  Use only your official <strong>@vnrvjiet.in</strong> college email address
                </p>
              </div>
            )}
          </Col>
        </Row>
      </Container>

      {/* Google Login Modal */}
     <Modal
  show={showLoginModal}
  onHide={() => setShowLoginModal(false)}
  centered
  dialogClassName="custom-login-modal"
>
  <Modal.Header closeButton>
    <Modal.Title>Sign in with Google</Modal.Title>
  </Modal.Header>
  <Modal.Body>
    <div className="google-icon-circle">
      <svg width="30" height="30" viewBox="0 0 24 24">
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
    </div>
    <p className="welcome-text">
      Sign in securely using your official <strong>@vnrvjiet.in</strong> email.
    </p>
    <div id="googleLoginDiv"></div>
  </Modal.Body>
</Modal>

    </div>
  );
};

export default LandingPage;
