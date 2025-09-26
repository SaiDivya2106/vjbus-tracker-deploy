// src/components/ActivityManager.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Box, Snackbar, Alert, Dialog, DialogActions, DialogContent, DialogTitle, TextField, MenuItem, Button, Typography, Paper } from '@mui/material';
import RegularActivityList from './RegularActivityList';
import DailyActivityList from './DailyActivityList';
import AddActivity from './AddActivity';
import axios from 'axios';
import './ActivityList.css';
import AssignmentIcon from '@mui/icons-material/Assignment';
import TodayIcon from '@mui/icons-material/Today';
const base_url = import.meta.env.VITE_API_BASE_URL;

// Define cache keys and expiration times
const REGULAR_ACTIVITIES_CACHE_KEY = 'regular_activities_cache';
const DAILY_ACTIVITIES_CACHE_KEY = 'daily_activities_cache';
const ACTIVITIES_CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes in milliseconds

const ActivityManager = () => {
  const [regularActivities, setRegularActivities] = useState(() => {
    // Initialize from localStorage if available
    const cachedData = localStorage.getItem(REGULAR_ACTIVITIES_CACHE_KEY);
    if (cachedData) {
      try {
        return JSON.parse(cachedData);
      } catch (error) {
        console.error('Error parsing cached regular activities:', error);
      }
    }
    return [];
  });
  
  const [dailyActivities, setDailyActivities] = useState(() => {
    // Initialize from localStorage if available
    const cachedData = localStorage.getItem(DAILY_ACTIVITIES_CACHE_KEY);
    if (cachedData) {
      try {
        return JSON.parse(cachedData);
      } catch (error) {
        console.error('Error parsing cached daily activities:', error);
      }
    }
    return [];
  });
  
  const [loading, setLoading] = useState(!localStorage.getItem(REGULAR_ACTIVITIES_CACHE_KEY));
  const [loadingDailyActivities, setLoadingDailyActivities] = useState(!localStorage.getItem(DAILY_ACTIVITIES_CACHE_KEY));
  const [error, setError] = useState('');
  const [isAddActivityOpen, setIsAddActivityOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    activity_type: '',
    status: 'ongoing',
    skills: [],
    start_date: '',
    end_date: '',
    date: ''
  });
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  
  // Activity types - removed Education, Experience, and LeetCode entries
  const activityTypes = [
    'Project',
    'Certification',
    'Workshop',
    'Hackathon',
    'Publication',
    'Volunteer',
    'Other'
  ];

  // Listen for activity updates from Dashboard's AddActivity
  useEffect(() => {
    const handleActivityAdded = (event) => {
      console.log('Activity added event detected', event.detail);
      
      // Clear cache when an activity is added
      localStorage.removeItem(REGULAR_ACTIVITIES_CACHE_KEY);
      localStorage.removeItem(DAILY_ACTIVITIES_CACHE_KEY);
      
      // Force immediate refresh
      fetchRegularActivities(true);
      fetchDailyActivities(true);
    };
    
    const handleRegularActivityAdded = () => {
      console.log('Regular activity added event detected');
      localStorage.removeItem(REGULAR_ACTIVITIES_CACHE_KEY);
      fetchRegularActivities(true);
    };
    
    const handleDailyActivityAdded = () => {
      console.log('Daily activity added event detected');
      localStorage.removeItem(DAILY_ACTIVITIES_CACHE_KEY);
      fetchDailyActivities(true);
    };
    
    const forceRefresh = () => {
      console.log('Force refresh triggered');
      // Force both activities to refresh
      fetchRegularActivities(true);
      fetchDailyActivities(true);
      // Also update the last refresh timestamp
      setLastRefresh(Date.now());
    };

    // Add event listener for activity updates
    window.addEventListener('activity-added', handleActivityAdded);
    window.addEventListener('regular-activity-added', handleRegularActivityAdded);
    window.addEventListener('daily-activity-added', handleDailyActivityAdded);
    window.addEventListener('force-activity-refresh', forceRefresh);

    // Cleanup
    return () => {
      window.removeEventListener('activity-added', handleActivityAdded);
      window.removeEventListener('regular-activity-added', handleRegularActivityAdded);
      window.removeEventListener('daily-activity-added', handleDailyActivityAdded);
      window.removeEventListener('force-activity-refresh', forceRefresh);
    };
  }, []);

  useEffect(() => {
    fetchRegularActivities();
    fetchDailyActivities();
  }, [lastRefresh]);

  // Create memoized fetch functions to avoid unnecessary re-renders
  const fetchRegularActivities = useCallback(async (forceRefresh = false) => {
    try {
      // Check if we have unexpired cached data
      const cachedTimestamp = localStorage.getItem(`${REGULAR_ACTIVITIES_CACHE_KEY}_timestamp`);
      const now = Date.now();
      
      if (!forceRefresh && regularActivities.length > 0 && cachedTimestamp && 
          (now - parseInt(cachedTimestamp) < ACTIVITIES_CACHE_EXPIRY)) {
        console.log('Using cached regular activities');
        return; // Use the data we already have in state
      }
      
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${base_url}/api/activities`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update state and cache
      setRegularActivities(response.data);
      localStorage.setItem(REGULAR_ACTIVITIES_CACHE_KEY, JSON.stringify(response.data));
      localStorage.setItem(`${REGULAR_ACTIVITIES_CACHE_KEY}_timestamp`, now.toString());
    } catch (err) {
      console.error('Error fetching regular activities:', err);
      setError('Failed to load regular activities');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDailyActivities = useCallback(async (forceRefresh = false) => {
    try {
      // Check if we have unexpired cached data
      const cachedTimestamp = localStorage.getItem(`${DAILY_ACTIVITIES_CACHE_KEY}_timestamp`);
      const now = Date.now();
      
      if (!forceRefresh && dailyActivities.length > 0 && cachedTimestamp && 
          (now - parseInt(cachedTimestamp) < ACTIVITIES_CACHE_EXPIRY)) {
        console.log('Using cached daily activities');
        setLoadingDailyActivities(false);
        return; // Use the data we already have in state
      }
      
      setLoadingDailyActivities(true);
      setError(null);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${base_url}/api/daily_activities`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update state and cache
      setDailyActivities(response.data);
      localStorage.setItem(DAILY_ACTIVITIES_CACHE_KEY, JSON.stringify(response.data));
      localStorage.setItem(`${DAILY_ACTIVITIES_CACHE_KEY}_timestamp`, now.toString());
    } catch (error) {
      console.error("Error fetching daily activities:", error);
      setError('Failed to fetch daily activities');
    } finally {
      setLoadingDailyActivities(false);
    }
  }, []);

  const handleAddActivity = (type, newActivity) => {
    if (type === 'regular') {
      const updatedActivities = [newActivity, ...regularActivities];
      setRegularActivities(updatedActivities);
      // Update the cache
      localStorage.setItem(REGULAR_ACTIVITIES_CACHE_KEY, JSON.stringify(updatedActivities));
      localStorage.setItem(`${REGULAR_ACTIVITIES_CACHE_KEY}_timestamp`, Date.now().toString());
    } else if (type === 'daily') {
      const updatedActivities = [newActivity, ...dailyActivities];
      setDailyActivities(updatedActivities);
      // Update the cache
      localStorage.setItem(DAILY_ACTIVITIES_CACHE_KEY, JSON.stringify(updatedActivities));
      localStorage.setItem(`${DAILY_ACTIVITIES_CACHE_KEY}_timestamp`, Date.now().toString());
    }
    setSnackbarMessage(`${type === 'regular' ? 'Activity' : 'Daily activity'} added successfully!`);
    setSnackbarOpen(true);
    
    // Dispatch event for other components to listen
    window.dispatchEvent(new CustomEvent('activity-added', { detail: { type, activity: newActivity } }));
  };

  const handleEditActivity = (activity) => {
    setEditingActivity({
      ...activity,
      isDaily: false // Flag to identify this as a regular activity
    });
    setEditFormData({
      title: activity.title,
      description: activity.description,
      activity_type: activity.activity_type || '',
      status: activity.status || 'ongoing',
      skills: activity.skills || [],
      start_date: activity.start_date || '',
      end_date: activity.end_date || '',
      date: activity.date || ''
    });
  };

  const handleEditDailyActivity = (activity) => {
    setEditingActivity({
      ...activity,
      isDaily: true // Flag to identify this as a daily activity
    });
    setEditFormData({
      title: activity.title,
      description: activity.description,
      start_date: activity.start_date || '',
      end_date: activity.end_date || '',
      date: activity.date || ''
    });
  };

  const handleDeleteActivity = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${base_url}/api/activities/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const updatedActivities = regularActivities.filter(a => a.activity_id !== id);
      setRegularActivities(updatedActivities);
      
      // Update the cache
      localStorage.setItem(REGULAR_ACTIVITIES_CACHE_KEY, JSON.stringify(updatedActivities));
      localStorage.setItem(`${REGULAR_ACTIVITIES_CACHE_KEY}_timestamp`, Date.now().toString());
      
      setSnackbarMessage('Activity deleted successfully!');
      setSnackbarOpen(true);
      
      // Dispatch event for other components to listen
      window.dispatchEvent(new CustomEvent('activity-deleted'));
    } catch (err) {
      console.error('Error deleting activity:', err);
      setError('Failed to delete activity');
    }
  };

  const handleDeleteDailyActivity = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${base_url}/api/daily_activities/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const updatedActivities = dailyActivities.filter(a => a.daily_activity_id !== id);
      setDailyActivities(updatedActivities);
      
      // Update the cache
      localStorage.setItem(DAILY_ACTIVITIES_CACHE_KEY, JSON.stringify(updatedActivities));
      localStorage.setItem(`${DAILY_ACTIVITIES_CACHE_KEY}_timestamp`, Date.now().toString());
      
      setSnackbarMessage('Daily activity deleted successfully!');
      setSnackbarOpen(true);
      
      // Dispatch event for other components to listen
      window.dispatchEvent(new CustomEvent('activity-deleted'));
    } catch (err) {
      console.error('Error deleting daily activity:', err);
      setError('Failed to delete daily activity');
    }
  };

  return (
    <Box className="activity-container">
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      {/* <Alert severity="info" sx={{ mb: 3 }}>
        Note: Education and Experience entries should be added through the Resume Builder's dedicated sections. 
        These sections provide specialized fields for better formatting in your resume.
      </Alert> */}

      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <AssignmentIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
            Major Activities
          </Typography>
        </Box>
        <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          {loading ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>Loading activities...</Box>
          ) : regularActivities.length === 0 ? (
            <Box sx={{ 
              textAlign: 'center', 
              py: 4,
              color: 'text.secondary'
            }}>
              <Typography variant="h6" gutterBottom>No Major Activities Yet</Typography>
              <Typography variant="body2">
                Start adding your projects, certifications, and other achievements to showcase in your resume.
              </Typography>
            </Box>
          ) : (
            <RegularActivityList
              activities={regularActivities}
              onEdit={handleEditActivity}
              onDelete={handleDeleteActivity}
            />
          )}
        </Paper>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <TodayIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
            Daily Activities
          </Typography>
        </Box>
        <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          {loadingDailyActivities ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>Loading daily activities...</Box>
          ) : dailyActivities.length === 0 ? (
            <Box sx={{ 
              textAlign: 'center', 
              py: 4,
              color: 'text.secondary'
            }}>
              <Typography variant="h6" gutterBottom>No Daily Activities Yet</Typography>
              <Typography variant="body2">
                Track your daily progress by adding activities like coding practice, learning sessions, or project updates.
              </Typography>
            </Box>
          ) : (
            <DailyActivityList
              daily_activities_prop={dailyActivities}
              onEdit={handleEditDailyActivity}
              onDelete={handleDeleteDailyActivity}
            />
          )}
        </Paper>
      </Box>

      <AddActivity 
        open={isAddActivityOpen}
        onClose={() => setIsAddActivityOpen(false)}
        onActivityAdded={handleAddActivity}
      />

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />

      {editingActivity && (
        <Dialog
          open={!!editingActivity}
          onClose={() => setEditingActivity(null)}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>
            Edit {editingActivity.isDaily ? 'Daily Activity' : 'Activity'}
          </DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Title"
              fullWidth
              value={editFormData.title}
              onChange={(e) => setEditFormData(prev => ({
                ...prev,
                title: e.target.value
              }))}
            />
            <TextField
              margin="dense"
              label="Description"
              fullWidth
              multiline
              rows={4}
              value={editFormData.description}
              onChange={(e) => setEditFormData(prev => ({
                ...prev,
                description: e.target.value
              }))}
            />
            
            {/* Only show status field for regular activities */}
            {!editingActivity.isDaily && (
              <>
                <TextField
                  select
                  margin="dense"
                  label="Status"
                  fullWidth
                  value={editFormData.status}
                  onChange={(e) => setEditFormData(prev => ({
                    ...prev,
                    status: e.target.value
                  }))}
                >
                  <MenuItem value="ongoing">Ongoing</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                </TextField>
                
                <TextField
                  select
                  margin="dense"
                  label="Activity Type"
                  fullWidth
                  value={editFormData.activity_type || ''}
                  onChange={(e) => setEditFormData(prev => ({
                    ...prev,
                    activity_type: e.target.value
                  }))}
                >
                  {activityTypes.map((type) => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
                  ))}
                </TextField>
                
                <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                  <TextField
                    margin="dense"
                    label="Start Date"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                    value={editFormData.start_date ? new Date(editFormData.start_date).toISOString().split('T')[0] : ''}
                    onChange={(e) => setEditFormData(prev => ({
                      ...prev,
                      start_date: e.target.value ? new Date(e.target.value).toISOString() : null
                    }))}
                  />
                  <TextField
                    margin="dense"
                    label="End Date"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                    value={editFormData.end_date ? new Date(editFormData.end_date).toISOString().split('T')[0] : ''}
                    onChange={(e) => setEditFormData(prev => ({
                      ...prev,
                      end_date: e.target.value ? new Date(e.target.value).toISOString() : null
                    }))}
                  />
                </Box>
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditingActivity(null)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                try {
                  const token = localStorage.getItem('token');
                  
                  if (editingActivity.isDaily) {
                    // Update Daily Activity
                    await axios.put(
                      `${base_url}/api/daily_activities/${editingActivity.daily_activity_id}`,
                      editFormData,
                      { headers: { Authorization: `Bearer ${token}` } }
                    );
                    
                    // Update state
                    const updatedActivities = dailyActivities.map(activity => 
                      activity.daily_activity_id === editingActivity.daily_activity_id 
                        ? { ...activity, ...editFormData }
                        : activity
                    );
                    setDailyActivities(updatedActivities);
                    
                    // Update cache
                    localStorage.setItem(DAILY_ACTIVITIES_CACHE_KEY, JSON.stringify(updatedActivities));
                    localStorage.setItem(`${DAILY_ACTIVITIES_CACHE_KEY}_timestamp`, Date.now().toString());
                  } else {
                    // Update Regular Activity
                    await axios.put(
                      `${base_url}/api/activities/${editingActivity.activity_id}`,
                      editFormData,
                      { headers: { Authorization: `Bearer ${token}` } }
                    );
                    
                    // Update state
                    const updatedActivities = regularActivities.map(activity => 
                      activity.activity_id === editingActivity.activity_id 
                        ? { ...activity, ...editFormData }
                        : activity
                    );
                    setRegularActivities(updatedActivities);
                    
                    // Update cache
                    localStorage.setItem(REGULAR_ACTIVITIES_CACHE_KEY, JSON.stringify(updatedActivities));
                    localStorage.setItem(`${REGULAR_ACTIVITIES_CACHE_KEY}_timestamp`, Date.now().toString());
                  }
                  
                  setEditingActivity(null);
                  setSnackbarMessage(`${editingActivity.isDaily ? 'Daily activity' : 'Activity'} updated successfully!`);
                  setSnackbarOpen(true);
                  
                  // Dispatch event for other components to listen
                  window.dispatchEvent(new CustomEvent('activity-updated'));
                } catch (error) {
                  console.error('Error updating activity:', error);
                  setError(`Failed to update ${editingActivity.isDaily ? 'daily activity' : 'activity'}`);
                }
              }}
              variant="contained"
            >
              Save Changes
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

export default ActivityManager;