import React, { useState } from "react";
import axios from "axios";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Link,
  Box,
  Alert,
  CircularProgress,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

const base_url = import.meta.env.VITE_API_BASE_URL;
const google_client_id = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await axios.post(
        `${base_url}/api/auth/login`,
        {
          email: formData.email,
          password: formData.password,
        },
        { withCredentials: true }
      );

      const { token, user } = response.data;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      window.dispatchEvent(new Event("storage"));

      navigate("/dashboard");
    } catch (error) {
      setError(error.response?.data?.error || "Failed to login.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (response) => {
    try {
      const googleToken = response.credential;
      const res = await axios.post(`${base_url}/api/auth/google-login`, { token: googleToken });

      const { token, user } = res.data;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      window.dispatchEvent(new Event("storage"));

      navigate("/dashboard");
    } catch (error) {
      setError("Google login failed. Try again.");
    }
  };

  const handleGoogleFailure = () => {
    setError("Google Sign-In failed.");
  };

  return (
    <GoogleOAuthProvider clientId={google_client_id}>
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          py: 4,
          backgroundColor: "background.default",
        }}
      >
        <Container maxWidth="xs">
          <Paper elevation={3} sx={{ p: 4, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <Typography variant="h4" component="h1" gutterBottom>
              Login
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2, width: "100%" }} onClose={() => setError("")}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleLogin} sx={{ width: "100%" }}>
              <TextField label="Email" fullWidth margin="normal" name="email" type="email" value={formData.email} onChange={handleChange} required />
              <TextField label="Password" fullWidth margin="normal" name="password" type="password" value={formData.password} onChange={handleChange} required />

              <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }} disabled={loading}>
                {loading ? <CircularProgress size={24} /> : "Login"}
              </Button>

              <GoogleLogin onSuccess={handleGoogleSuccess} onError={handleGoogleFailure} />

              <Box sx={{ textAlign: "center", mt: 2 }}>
                <Link href="/signup" variant="body2">
                  Don't have an account? Sign Up
                </Link>
              </Box>
            </Box>
          </Paper>
        </Container>
      </Box>
    </GoogleOAuthProvider>
  );
};

export default Login;
