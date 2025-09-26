import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Typography, 
  Box, 
  Button,
  CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import PersonIcon from '@mui/icons-material/Person';
import Profile from './Profile';

const base_url = import.meta.env.VITE_API_BASE_URL;

// Cache for profile validation results
const profileValidationCache = {
  isValid: null,
  timestamp: null,
  expiresIn: 5 * 60 * 1000 // 5 minutes in milliseconds
};

const ProfileValidationWrapper = ({ children }) => {
  const navigate = useNavigate();
  const [showProfileAlert, setShowProfileAlert] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Get the path from the child's props
  const childPath = React.Children.map(children, child => 
    React.isValidElement(child) ? child.props.path : null
  )[0];
  
  const validateProfileData = (userData) => {
    if (!userData) return false;
    
    // Check for minimal required fields
    const hasName = userData.name && userData.name.trim() !== '';
    const hasEducation = userData.education && userData.education.length > 0;
    
    // Education is now mandatory, plus name
    return hasName && hasEducation;
  };
  
  const handleClick = async (e) => {
    e.preventDefault();
    
    // Extract path from child's onClick handler or use the original path from menuItems
    const path = childPath || (
      React.Children.map(children, child => 
        React.isValidElement(child) && child.props.onClick ? 
        child.props.onClick.toString().match(/navigate\(['"](\/[^'"]*)['"]\)/)?.[1] : 
        null
      )[0]
    );
    
    // Default to resume-builder if no path is found (fallback for compatibility)
    const targetPath = path || '/resume-builder';
    
    setLoading(true);
    
    // Check if we have a valid cached result
    const now = Date.now();
    const cacheIsValid = 
      profileValidationCache.isValid !== null && 
      profileValidationCache.timestamp && 
      (now - profileValidationCache.timestamp) < profileValidationCache.expiresIn;
    
    try {
      let isProfileComplete;
      
      // Use cached result if available and valid
      if (cacheIsValid) {
        isProfileComplete = profileValidationCache.isValid;
      } else {
        // Before making an API call, check if we have profile data in localStorage
        const cachedProfileData = localStorage.getItem('profile_data');
        const cachedTimestamp = localStorage.getItem('profile_data_timestamp');
        const PROFILE_CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes in milliseconds
        
        if (cachedProfileData && cachedTimestamp && 
            (now - parseInt(cachedTimestamp) < PROFILE_CACHE_EXPIRY)) {
          // Use the cached profile data for validation
          const profileData = JSON.parse(cachedProfileData);
          isProfileComplete = validateProfileData(profileData);
        } else {
          // Otherwise make API call
          const token = localStorage.getItem('token');
          const response = await axios.get(
            `${base_url}/api/user/profile`,
            {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            }
          );
          
          isProfileComplete = validateProfileData(response.data);
          
          // Store the fetched data in localStorage
          localStorage.setItem('profile_data', JSON.stringify(response.data));
          localStorage.setItem('profile_data_timestamp', now.toString());
        }
        
        // Update cache
        profileValidationCache.isValid = isProfileComplete;
        profileValidationCache.timestamp = now;
      }
      
      if (isProfileComplete) {
        // Profile is complete, navigate to the target path
        navigate(targetPath);
      } else {
        // Profile is incomplete, show warning
        setShowProfileAlert(true);
      }
    } catch (error) {
      console.error('Error validating profile before navigation:', error);
      // If there's an error, let them navigate anyway
      navigate(targetPath);
    } finally {
      setLoading(false);
    }
  };
  
  // Clear cache when profile is updated
  const handleProfileUpdated = () => {
    // Invalidate cache when profile is updated
    profileValidationCache.isValid = null;
    profileValidationCache.timestamp = null;
    handleCloseProfile();
  };
  
  const handleOpenProfile = () => {
    setIsProfileOpen(true);
    setShowProfileAlert(false);
  };

  const handleCloseProfile = () => {
    setIsProfileOpen(false);
  };
  
  // Clone the child element with the new onClick handler
  const childrenWithProps = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      // Add loading indicator to the child element
      let newProps = { onClick: handleClick };
      
      // If it's a Button from MUI
      if (child.type && child.type.name === 'Button') {
        newProps = {
          ...newProps,
          startIcon: loading ? <CircularProgress size={16} color="inherit" /> : child.props.startIcon,
          disabled: loading
        };
      }
      // If it's a ListItem (for the drawer menu)
      else if (child.props && child.props.button) {
        // For ListItem, we can't directly use startIcon, so we'll modify based on its structure
        const updatedChildren = React.Children.map(child.props.children, innerChild => {
          // If this is the ListItemIcon, add a loading indicator
          if (innerChild.type && innerChild.type.displayName === 'ListItemIcon') {
            return React.cloneElement(innerChild, {}, 
              loading ? <CircularProgress size={20} color="inherit" /> : innerChild.props.children
            );
          }
          return innerChild;
        });
        
        newProps = {
          ...newProps,
          disabled: loading,
          children: updatedChildren
        };
      }
      
      return React.cloneElement(child, newProps);
    }
    return child;
  });

  return (
    <>
      {childrenWithProps}
      
      {/* Profile Validation Alert */}
      <Dialog
        open={showProfileAlert}
        onClose={() => navigate('/dashboard')}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle sx={{ 
          borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
          backgroundColor: 'rgba(211, 47, 47, 0.08)',
          py: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <ErrorOutlineIcon color="error" />
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'error.main' }}>
            Complete Your Profile First
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 3, pb: 2 }}>
          <Typography variant="body1" paragraph>
            To create an effective resume, you need to complete your profile with at least the following information:
          </Typography>
          <Box component="ul" sx={{ pl: 3 }}>
            <Typography component="li" sx={{ fontWeight: 'bold' }}>Your full name (required)</Typography>
            <Typography component="li" sx={{ fontWeight: 'bold', color: 'error.main' }}>
              At least one education entry (required) - THIS IS MANDATORY
            </Typography>
          </Box>
          <Box sx={{ 
            mt: 2, 
            p: 2, 
            bgcolor: 'error.light', 
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'error.main' 
          }}>
            <Typography variant="body2" fontWeight="bold">
              IMPORTANT: You must know that adding at least one education entry is absolutely required to create a resume. 
              Without education details, you cannot proceed to the Resume Builder.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            variant="outlined"
            onClick={() => navigate('/dashboard')}
          >
            Back to Dashboard
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleOpenProfile}
            startIcon={<PersonIcon />}
          >
            Update Profile Now
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Profile Component */}
      <Profile 
        open={isProfileOpen} 
        onClose={handleProfileUpdated} 
      />
    </>
  );
};

export default ProfileValidationWrapper; 