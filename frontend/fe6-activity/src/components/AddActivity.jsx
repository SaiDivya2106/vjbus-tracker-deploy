import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Autocomplete,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
} from '@mui/material';
import axios from 'axios';
const base_url = import.meta.env.VITE_API_BASE_URL;
const activityTypes = [
  'Project',
  'Hackathon',
  'Certification',
  'Course',
  'Workshop',
  'Achievement',
  'Publication',
  'Volunteer',
  'Other'
];

const COMMON_SKILLS = [
  'JavaScript', 'Python', 'React', 'Node.js', 'Flask',
  'MongoDB', 'SQL', 'AWS', 'Docker', 'Git',
  'Machine Learning', 'Data Analysis', 'UI/UX',
  'Project Management', 'Agile', 'Java', 'C++',
  'TypeScript', 'Angular', 'Vue.js', 'Django',
  'Express.js', 'PostgreSQL', 'Redis', 'GraphQL',
  'REST API', 'CI/CD', 'Kubernetes', 'System Design',
  'Data Structures', 'Algorithms', 'Cloud Computing',
  'DevOps', 'Testing', 'Microservices'
];

// Activity types that should show the skills field
const SKILL_BASED_ACTIVITIES = ['Project', 'Certification'];

const AddActivity = ({ open, onClose, onActivityAdded }) => {
  const [tab, setTab] = useState('daily'); // State to manage which tab is active
  const [formData, setFormData] = useState({
    title: '',
    type: '',
    description: '',
    status: 'ongoing',
    skills: [], // Add skills array to form data
    start_date: '',
    end_date: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [formDataDaily, setFormDataDaily] = useState({
    title: '',
    description: ''
  });

  const [loadingDaily, setLoadingDaily] = useState(false);

  const handleTabChange = (newTab) => {
    setTab(newTab);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSkillsChange = (event, newValue) => {
    setFormData({
      ...formData,
      skills: newValue
    });
  };

  const handleChangeDaily = (e) => {
    setFormDataDaily({
      ...formDataDaily,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const token = localStorage.getItem('token');
      
      const response = await axios.post(
        `${base_url}/api/add_activity`,
        {
          title: formData.title,
          activity_type: formData.type,
          description: formData.description,
          status: formData.status,
          skills: formData.skills, // Include skills in the request
          start_date: formData.start_date,
          end_date: formData.end_date
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.status === 201) {
        console.log("Activity added successfully (status 201), calling onActivityAdded");
        
        // Notify parent component
        onActivityAdded('regular', response.data.activity);
        
        // Clear any cached data to force a refresh
        localStorage.removeItem('regular_activities_cache');
        localStorage.removeItem('regular_activities_cache_timestamp');
        localStorage.removeItem('activities_data_cache');
        localStorage.removeItem('activities_data_cache_timestamp');
        
        // Dispatch a global event for other components that might need to know
        // Use a more direct approach to ensure components are updated
        try {
          window.dispatchEvent(new CustomEvent('activity-added', { 
            detail: { type: 'regular', activity: response.data.activity } 
          }));
          
          // Also dispatch a separate event specifically for regular activities
          window.dispatchEvent(new CustomEvent('regular-activity-added', { 
            detail: { activity: response.data.activity } 
          }));
        } catch (err) {
          console.error('Error dispatching events:', err);
        }
        
        onClose();
        setFormData({ // Reset form
          title: '',
          type: '',
          description: '',
          status: 'ongoing',
          skills: [],
          start_date: '',
          end_date: ''
        });
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add activity');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitDailyActivity = async (e) => {
    e.preventDefault();
    setLoadingDaily(true);
    setError('');

    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const token = localStorage.getItem('token');
      
      const response = await axios.post(
        `${base_url}/api/add_daily_activity`,
        {
          title: formDataDaily.title,
          description: formDataDaily.description
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.status === 201) {
        console.log("Daily activity added successfully (status 201), calling onActivityAdded");
        
        // Notify parent component
        onActivityAdded('daily', response.data.activity);
        
        // Clear any cached data to force a refresh
        localStorage.removeItem('daily_activities_cache');
        localStorage.removeItem('daily_activities_cache_timestamp');
        
        // Dispatch a global event for other components that might need to know
        // Use a more direct approach to ensure components are updated
        try {
          window.dispatchEvent(new CustomEvent('activity-added', { 
            detail: { type: 'daily', activity: response.data.activity } 
          }));
          
          // Also dispatch a separate event specifically for daily activities
          window.dispatchEvent(new CustomEvent('daily-activity-added', { 
            detail: { activity: response.data.activity } 
          }));
        } catch (err) {
          console.error('Error dispatching events:', err);
        }
        
        onClose();
        setFormDataDaily({ // Reset form
          title: '',
          description: ''
        });
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add daily activity');
    } finally {
      setLoadingDaily(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add New Activity</DialogTitle>
      <DialogContent>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tab} onChange={(_, newTab) => handleTabChange(newTab)} aria-label="activity tabs">
            <Tab label="Daily Activity" value="daily" />
            <Tab label="Major Activity" value="regular" />
          </Tabs>
        </Box>
        {tab === 'daily' ? (
          <Box component="form" onSubmit={handleSubmitDailyActivity} sx={{ mt: 2 }}>
            {error && (
              <Box sx={{ color: 'error.main', mb: 2 }}>
                {error}
              </Box>
            )}
            
            <TextField
              fullWidth
              name="title"
              label="Title"
              value={formDataDaily.title}
              onChange={handleChangeDaily}
              required
              margin="normal"
            />

            <TextField
              fullWidth
              name="description"
              label="Description"
              value={formDataDaily.description}
              onChange={handleChangeDaily}
              required
              multiline
              rows={4}
              margin="normal"
            />

            <Button 
              type="submit"
              variant="contained" 
              color="primary"
              disabled={loadingDaily}
              sx={{ mt: 2 }}
            >
              {loadingDaily ? 'Adding...' : 'Add Daily Activity'}
            </Button>
          </Box>
        ) : (
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            {error && (
              <Box sx={{ color: 'error.main', mb: 2 }}>
                {error}
              </Box>
            )}
            
            <TextField
              fullWidth
              name="title"
              label="Title"
              value={formData.title}
              onChange={handleChange}
              required
              margin="normal"
            />

            <FormControl fullWidth margin="normal">
              <InputLabel>Type</InputLabel>
              <Select
                name="type"
                value={formData.type}
                onChange={handleChange}
                required
                label="Type"
              >
                {activityTypes.map((type) => (
                  <MenuItem key={type} value={type}>{type}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              name="description"
              label="Description"
              value={formData.description}
              onChange={handleChange}
              required
              multiline
              rows={4}
              margin="normal"
            />

            {SKILL_BASED_ACTIVITIES.includes(formData.type) && (
              <Autocomplete
                multiple
                options={COMMON_SKILLS}
                value={formData.skills}
                onChange={handleSkillsChange}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      label={option}
                      {...getTagProps({ index })}
                      color="primary"
                      variant="outlined"
                    />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Skills"
                    placeholder="Add relevant skills"
                    margin="normal"
                  />
                )}
                freeSolo
                sx={{ mt: 2 }}
              />
            )}

            <FormControl fullWidth margin="normal">
              <InputLabel>Status</InputLabel>
              <Select
                name="status"
                value={formData.status}
                onChange={handleChange}
                label="Status"
              >
                <MenuItem value="ongoing">Ongoing</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="planned">Planned</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              name="start_date"
              label="Start Date"
              type="date"
              value={formData.start_date}
              onChange={handleChange}
              InputLabelProps={{
                shrink: true,
              }}
              margin="normal"
            />

            <TextField
              fullWidth
              name="end_date"
              label="End Date"
              type="date"
              value={formData.end_date}
              onChange={handleChange}
              InputLabelProps={{
                shrink: true,
              }}
              margin="normal"
            />

            <Button 
              type="submit"
              variant="contained" 
              color="primary"
              disabled={loading}
              sx={{ mt: 2 }}
            >
              {loading ? 'Adding...' : 'Add Activity'}
            </Button>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddActivity; 