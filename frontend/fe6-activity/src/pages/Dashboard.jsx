import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button,
  Grid,
  Card,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  CircularProgress,
  Alert,
  Paper,
  MenuItem,
  Tabs,
  Tab,
  Snackbar,
  useTheme,
  Fab,
  Zoom
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { Link, useNavigate } from 'react-router-dom';
import AddActivity from '../components/AddActivity';
import axios from 'axios';
import AddIcon from '@mui/icons-material/Add';
import CodeIcon from '@mui/icons-material/Code';
import WorkIcon from '@mui/icons-material/Work';
import SchoolIcon from '@mui/icons-material/School';
import GitHubIcon from '@mui/icons-material/GitHub';
import RefreshIcon from '@mui/icons-material/Refresh';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ResponsiveCalendar } from '@nivo/calendar';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ReactTypingEffect from 'react-typing-effect';
import LeetCodeStats from '../components/LeetCodeStats';
// import ActivityList from '../components/ActivityList';
import ActivityManager from '../components/ActivityManager';
import Profile from '../components/Profile';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import './Dashboard.css';

const base_url = import.meta.env.VITE_API_BASE_URL;

const LEETCODE_CACHE_KEY = 'leetcode_data_cache';
const LEETCODE_CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Define cache keys and expiration times for activities
const ACTIVITIES_CACHE_KEY = 'activities_data_cache';
const ACTIVITIES_CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes in milliseconds

// Custom tooltip for the line chart
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <Paper sx={{ 
        p: 2, 
        backgroundColor: 'background.paper',
        boxShadow: 2,
        border: '1px solid',
        borderColor: 'divider'
      }}>
        <Typography variant="subtitle2" color="primary">
          {data.contest_name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {new Date(label).toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })}
        </Typography>
        <Typography variant="body2">
          Rating: <strong>{data.rating}</strong>
        </Typography>
        <Typography variant="body2">
          Rank: <strong>#{data.ranking}</strong>
        </Typography>
      </Paper>
    );
  }
  return null;
};

const Dashboard = () => {
  const theme = useTheme();
  const [userData, setUserData] = useState(() => {
    const storedUser = localStorage.getItem('user');
    try {
      return JSON.parse(storedUser) || {};
    } catch (error) {
      console.error('Error parsing user data:', error);
      return {};
    }
  });
  const username = userData?.username;
  const [leetcodeStatus, setLeetcodeStatus] = useState(null);
  const [leetcodeData, setLeetcodeData] = useState(null);
  const [isSetUsernameModalOpen, setIsSetUsernameModalOpen] = useState(false);
  const [newLeetcodeUsername, setNewLeetcodeUsername] = useState('');
  const [isSettingUsername, setIsSettingUsername] = useState(false);
  const navigate = useNavigate();
  const [stats, setStats] = useState(() => {
    // Initialize stats from localStorage if available
    const cachedStats = localStorage.getItem('dashboard_stats');
    if (cachedStats) {
      try {
        return JSON.parse(cachedStats);
      } catch (error) {
        console.error('Error parsing cached stats:', error);
      }
    }
    return {
      totalProjects: 0,
      totalCertifications: 0,
      githubContributions: 0,
      leetcodeSolved: 0
    };
  });
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAddActivityOpen, setIsAddActivityOpen] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [isProfileComplete, setIsProfileComplete] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const validateProfileData = (data) => {
    if (!data) return false;
    
    // Check for minimal required fields
    const hasName = data.name && data.name.trim() !== '';
    const hasEducation = data.education && data.education.length > 0;
    
    // Education is now mandatory, plus name
    return hasName && hasEducation;
  };

  const handleOpenProfile = () => {
    setIsProfileOpen(true);
  };

  const handleCloseProfile = async () => {
    setIsProfileOpen(false);
    
    // Check for updated profile data in localStorage
    const cachedProfileData = localStorage.getItem('profile_data');
    if (cachedProfileData) {
      try {
        const parsedData = JSON.parse(cachedProfileData);
        setProfileData(parsedData);
        setIsProfileComplete(validateProfileData(parsedData));
        return;
      } catch (error) {
        console.error('Error parsing cached profile data:', error);
      }
    }
    
    // Fallback to API if localStorage data is not available
    try {
      const token = localStorage.getItem('token');
      const profileResponse = await axios.get(`${base_url}/api/user/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfileData(profileResponse.data);
      setIsProfileComplete(validateProfileData(profileResponse.data));
    } catch (error) {
      console.error('Error refreshing profile data:', error);
    }
  };

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      // Validate username
      if (!username) {
        console.error('No username found in user data');
        setError('User data is incomplete. Please try logging in again.');
        return;
      }

      console.log('Fetching data for username:', username);
      await fetchActivities();
      await checkLeetCodeStatus();
      
      // Check if we have cached profile data in localStorage
      const cachedProfileData = localStorage.getItem('profile_data');
      const cachedTimestamp = localStorage.getItem('profile_data_timestamp');
      const now = Date.now();
      const PROFILE_CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes in milliseconds
      
      // If we have valid, unexpired cached data, use it
      if (cachedProfileData && cachedTimestamp && 
          (now - parseInt(cachedTimestamp) < PROFILE_CACHE_EXPIRY)) {
        console.log('Using cached profile data from localStorage');
        const parsedData = JSON.parse(cachedProfileData);
        setProfileData(parsedData);
        setIsProfileComplete(validateProfileData(parsedData));
        setLoading(false);
        return;
      }
      
      // Otherwise, fetch from API
      const profileResponse = await axios.get(`${base_url}/api/user/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Store the fresh data in localStorage for future use
      localStorage.setItem('profile_data', JSON.stringify(profileResponse.data));
      localStorage.setItem('profile_data_timestamp', now.toString());
      
      setProfileData(profileResponse.data);
      setIsProfileComplete(validateProfileData(profileResponse.data));
    } catch (error) {
      console.error("Error fetching user data:", error);
      setError("Failed to fetch user data.");
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch - Modified to avoid unnecessary API calls
  useEffect(() => {
    if (username) {
      console.log('Dashboard mounted, initializing data');
      
      // Set initial loading state
      const hasActivitiesCache = localStorage.getItem(ACTIVITIES_CACHE_KEY);
      const hasProfileCache = localStorage.getItem('profile_data');
      const hasLeetCodeCache = localStorage.getItem(LEETCODE_CACHE_KEY);
      
      // If we have all caches, we can hide loading immediately
      if (hasActivitiesCache && hasProfileCache && hasLeetCodeCache) {
        setLoading(false);
      }
      
      // Fetch data from API or cache as appropriate
      fetchUserData();
    }
  }, [username]);

  // Setup event listeners for data updates
  useEffect(() => {
    // Function to handle activity data updates
    const handleActivityUpdate = () => {
      // Clear activities cache when an activity is added/updated/deleted
      localStorage.removeItem(ACTIVITIES_CACHE_KEY);
      localStorage.removeItem(`${ACTIVITIES_CACHE_KEY}_timestamp`);
      fetchActivities();
    };
    
    // Function to handle profile data updates
    const handleProfileUpdate = () => {
      // When profile_data_timestamp changes in localStorage, we should reload our data
      const cachedProfileData = localStorage.getItem('profile_data');
      if (cachedProfileData) {
        const parsedData = JSON.parse(cachedProfileData);
        setProfileData(parsedData);
        setIsProfileComplete(validateProfileData(parsedData));
      }
    };
    
    // Listen for activity updates
    window.addEventListener('activity-added', handleActivityUpdate);
    window.addEventListener('activity-updated', handleActivityUpdate);
    window.addEventListener('activity-deleted', handleActivityUpdate);
    window.addEventListener('storage', handleProfileUpdate);
    
    return () => {
      window.removeEventListener('activity-added', handleActivityUpdate);
      window.removeEventListener('activity-updated', handleActivityUpdate);
      window.removeEventListener('activity-deleted', handleActivityUpdate);
      window.removeEventListener('storage', handleProfileUpdate);
    };
  }, []);

  const fetchActivities = async () => {
    try {
      // Check if activities data is cached in localStorage
      const cachedActivities = localStorage.getItem(ACTIVITIES_CACHE_KEY);
      const cachedTimestamp = localStorage.getItem(`${ACTIVITIES_CACHE_KEY}_timestamp`);
      const now = Date.now();
      
      // If we have unexpired cached data, use it
      if (cachedActivities && cachedTimestamp && 
          (now - parseInt(cachedTimestamp) < ACTIVITIES_CACHE_EXPIRY)) {
        console.log('Using cached activities data');
        const activitiesData = JSON.parse(cachedActivities);
        
        // Calculate stats from cached activities
        const projectCount = activitiesData.filter(activity => 
          activity.activity_type?.toLowerCase() === 'project'
        ).length;
        
        const certificationCount = activitiesData.filter(activity => 
          activity.activity_type?.toLowerCase() === 'certification'
        ).length;
        
        const newStats = {
          ...stats,
          totalProjects: projectCount,
          totalCertifications: certificationCount
        };
        
        setStats(newStats);
        // Store stats in localStorage
        localStorage.setItem('dashboard_stats', JSON.stringify(newStats));
        return;
      }
      
      // Otherwise, fetch from API
      const token = localStorage.getItem('token');
      const response = await axios.get(`${base_url}/api/activities`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Cache the activities data
      localStorage.setItem(ACTIVITIES_CACHE_KEY, JSON.stringify(response.data));
      localStorage.setItem(`${ACTIVITIES_CACHE_KEY}_timestamp`, now.toString());
      
      // Calculate stats from activities
      const projectCount = response.data.filter(activity => 
        activity.activity_type?.toLowerCase() === 'project'
      ).length;
      
      const certificationCount = response.data.filter(activity => 
        activity.activity_type?.toLowerCase() === 'certification'
      ).length;
      
      const newStats = {
        ...stats,
        totalProjects: projectCount,
        totalCertifications: certificationCount
      };
      
      setStats(newStats);
      // Store stats in localStorage
      localStorage.setItem('dashboard_stats', JSON.stringify(newStats));
    } catch (error) {
      console.error("Error fetching activities for stats:", error);
      setError('Failed to fetch activities');
    }
  };

  const getLeetCodeFromCache = () => {
    const cachedData = localStorage.getItem(LEETCODE_CACHE_KEY);
    if (!cachedData) return null;

    try {
      const { data, timestamp } = JSON.parse(cachedData);
      const now = new Date().getTime();
      
      // Check if cache has expired (24 hours)
      if (now - timestamp > LEETCODE_CACHE_EXPIRY) {
        localStorage.removeItem(LEETCODE_CACHE_KEY);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Error parsing cached LeetCode data:', error);
      localStorage.removeItem(LEETCODE_CACHE_KEY);
      return null;
    }
  };

  const saveLeetCodeToCache = (data) => {
    try {
      const cacheData = {
        data,
        timestamp: new Date().getTime()
      };
      localStorage.setItem(LEETCODE_CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error caching LeetCode data:', error);
    }
  };

  const checkLeetCodeStatus = async () => {
    if (!username) {
      console.error('Cannot check LeetCode status: No username provided');
      return;
    }
    
    try {
      // First check cache
      const cachedData = getLeetCodeFromCache();
      if (cachedData) {
        console.log('Using cached LeetCode data');
        setLeetcodeStatus(cachedData.status);
        setLeetcodeData(cachedData.data);
        return;
      }

      const token = localStorage.getItem('token');
      console.log('Checking LeetCode status for user:', username);
      const response = await axios.get(
        `${base_url}/api/user/leetcode_status/${username}`,
        { 
          headers: { Authorization: `Bearer ${token}` },
          timeout: 5000
        }
      );
      
      console.log('LeetCode status response:', response.data);
      setLeetcodeStatus(response.data);
      
      if (response.data.has_leetcode) {
        const leetcodeData = await fetchLeetcodeData();
        // Cache both status and data
        saveLeetCodeToCache({
          status: response.data,
          data: leetcodeData
        });
      } else {
        console.log('User does not have LeetCode username set');
      }
    } catch (error) {
      console.error('Error checking LeetCode status:', error.response?.data || error.message);
      if (error.code === 'ERR_NETWORK') {
        setError('Network error. Please check your connection.');
      } else {
        setError(error.response?.data?.error || 'Error checking LeetCode status');
        setLeetcodeStatus({ has_leetcode: false });
      }
    }
  };

  const fetchLeetcodeData = async () => {
    if (!username) {
      console.error('Cannot fetch LeetCode data: No username provided');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      console.log('Fetching LeetCode data for user:', username);
      const response = await axios.get(
        `${base_url}/api/user/${username}/leetcode_history`,
        { 
          headers: { Authorization: `Bearer ${token}` },
          timeout: 5000
        }
      );
      console.log('LeetCode data response:', response.data);
      setLeetcodeData(response.data);
      console.log('Contest History:', response.data?.contest_history);
      return response.data;
    } catch (error) {
      console.error('Error fetching LeetCode data:', error.response?.data || error.message);
      handleLeetCodeError(error);
      return null;
    }
  };

  const handleLeetCodeError = (error) => {
    if (error.code === 'ERR_NETWORK') {
      setError('Network error. Please check your connection.');
    } else if (error.response?.status === 400 && error.response?.data?.needs_setup) {
      setLeetcodeStatus(prev => ({ ...prev, has_leetcode: false }));
    } else {
      setError(error.response?.data?.error || 'Error fetching LeetCode data');
    }
  };

  const handleSetLeetcodeUsername = async () => {
    setIsSetUsernameModalOpen(true);
  };

  const handleCloseSetUsernameModal = () => {
    setIsSetUsernameModalOpen(false);
    setNewLeetcodeUsername('');
    setError('');
  };

  const handleSaveLeetcodeUsername = async () => {
    if (!username || !newLeetcodeUsername.trim()) {
      setError('Please enter a valid LeetCode username');
      return;
    }

    setIsSettingUsername(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${base_url}/api/user/${username}/set_leetcode_username`,
        { leetcode_username: newLeetcodeUsername },
        { 
          headers: { Authorization: `Bearer ${token}` },
          timeout: 5000
        }
      );

      handleCloseSetUsernameModal();
      await checkLeetCodeStatus();
    } catch (error) {
      console.error('Error setting LeetCode username:', error);
      if (error.code === 'ERR_NETWORK') {
        setError('Network error. Please check your connection.');
      } else {
        setError(error.response?.data?.error || 'Error setting LeetCode username');
      }
    } finally {
      setIsSettingUsername(false);
    }
  };

  const handleUpdateLeetCodeData = async () => {
    if (!username) return;

    setLoading(true);
    setError(null);
    try {
      // Force refresh by removing cache
      localStorage.removeItem(LEETCODE_CACHE_KEY);
      await checkLeetCodeStatus();
      setSnackbarMessage('LeetCode data updated successfully');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error updating LeetCode data:', error);
      setError('Error updating LeetCode data');
    } finally {
      setLoading(false);
    }
  };

  const navigateToLeetCodeStats = () => {
    navigate(`/user/${username}/leetcode`);
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <Typography variant="h4" component="h1" sx={{ 
          fontWeight: 600, 
          color: 'text.primary',
          mb: 1
        }}>
          Dashboard
        </Typography>
      </div>
      
      <div className="dashboard-container">
        {/* Stats Section */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon projects">
              <WorkIcon />
            </div>
            <div className="stat-info">
              <h2>{stats.totalProjects}</h2>
              <p>Projects</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon certs">
              <SchoolIcon />
            </div>
            <div className="stat-info">
              <h2>{stats.totalCertifications}</h2>
              <p>Certifications</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon github">
              <GitHubIcon />
            </div>
            <div className="stat-info">
              <h2>{stats.githubContributions}</h2>
              <p>GitHub Contributions</p>
            </div>
          </div>
        </div>

        {/* Welcome Message */}
        <Box
          sx={{
            mb: 4,
            p: 3,
            background: 'linear-gradient(135deg,rgb(154, 231, 255) 0%,rgb(173, 212, 235) 100%)',
            borderRadius: 2,
            color: 'white',
            boxShadow: '0 4px 20px rgba(254, 254, 254, 0)',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'radial-gradient(circle at top right, rgba(255,255,255,0.1) 0%, transparent 60%)',
              pointerEvents: 'none'
            }
          }}
        >
          <Typography variant="h4" sx={{ mb: 1, fontWeight: 'bold', color: '#1e3a8a' }}>
            Welcome, {userData?.name || 'Developer'}! 👋
          </Typography>
          <Box sx={{ height: '60px', display: 'flex', alignItems: 'center' }}>
            <ReactTypingEffect
              text={[
                "Track your achievements and build the perfect resume",
                "Showcase your LeetCode progress and skills",
                "Document your journey to success"
              ]}
              speed={50}
              eraseSpeed={50}
              typingDelay={1000}
              eraseDelay={2000}
              cursorRenderer={cursor => (
                <span style={{ color: '#2563eb' }}>{cursor}</span>
              )}
              displayTextRenderer={(text) => (
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 500,
                    color: '#1e3a8a',
                    fontSize: '1.1rem',
                    padding: '0.5rem',
                    borderRadius: '8px'
                  }}
                >
                  {text}
                </Typography>
              )}
            />
          </Box>
        </Box>
        
        {/* Profile Completeness Banner */}
        {!isProfileComplete && (
          <Paper
            elevation={0}
            sx={{
              mb: 4,
              p: 3,
              backgroundColor: 'rgba(211, 47, 47, 0.08)',
              border: '1px solid rgba(211, 47, 47, 0.2)',
              borderRadius: 2
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <ErrorOutlineIcon color="error" sx={{ fontSize: 32, mt: 0.5 }} />
              <Box>
                <Typography variant="h6" fontWeight={600} color="error.main">
                  Your profile is incomplete
                </Typography>
                <Typography variant="body1" sx={{ mt: 1 }}>
                  You must complete your profile with the following mandatory information:
                </Typography>
                <Box component="ul" sx={{ mt: 1, mb: 2 }}>
                  <Typography component="li">Your full name</Typography>
                  <Typography component="li" fontWeight="bold">
                    At least one education entry - THIS IS MANDATORY
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  IMPORTANT: You must know that without education details, you will not be able to create a resume.
                </Typography>
                <Button
                  variant="contained"
                  color="error"
                  onClick={handleOpenProfile}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 500,
                    borderRadius: 2
                  }}
                >
                  Complete Profile Now
                </Button>
              </Box>
            </Box>
          </Paper>
        )}
        
        <LeetCodeStats username={username} />

        {/* Activities Tabs Section */}
        <div className="activities-section">
          <ActivityManager />
        </div>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
        )}
      </div>

      {/* Floating Action Button for Adding Activity */}
      <Zoom in={true} timeout={500} unmountOnExit>
        <Fab 
          color="primary" 
          aria-label="add activity"
          onClick={() => setIsAddActivityOpen(true)}
          sx={{ 
            position: 'fixed', 
            bottom: 32, 
            right: 32,
            width: 64,
            height: 64,
            borderRadius: '16px',
            boxShadow: '0 6px 16px rgba(37, 99, 235, 0.3)',
            background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)',
            }
          }}
        >
          <AddIcon sx={{ fontSize: 28 }} />
        </Fab>
      </Zoom>

      {/* Add Activity Dialog */}
      <AddActivity 
        open={isAddActivityOpen}
        onClose={() => setIsAddActivityOpen(false)}
        onActivityAdded={(type, newActivity) => {
          setIsAddActivityOpen(false);
          setSnackbarMessage('Activity added successfully!');
          setSnackbarOpen(true);
          
          // Dispatch a force refresh event to ensure ActivityManager updates
          window.dispatchEvent(new CustomEvent('force-activity-refresh'));
          
          // Dispatch an event to notify ActivityManager to refresh its lists
          window.dispatchEvent(new CustomEvent('activity-added', { 
            detail: { type, activity: newActivity } 
          }));
          
          // Clear the activities cache to force a refresh on the next render
          localStorage.removeItem(ACTIVITIES_CACHE_KEY);
          localStorage.removeItem(`${ACTIVITIES_CACHE_KEY}_timestamp`);
          
          // Trigger a fetch of new activities to update the dashboard stats
          fetchActivities();
        }}
      />

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />

      {/* Profile Component */}
      <Profile 
        open={isProfileOpen} 
        onClose={handleCloseProfile} 
      />
    </div>
  );
};

export default Dashboard; 