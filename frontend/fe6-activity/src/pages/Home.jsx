import React, { useState } from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import { Link } from 'react-router-dom';
import './Home.css';
import AddActivity from '../components/AddActivity';
import ProfileValidationWrapper from '../components/ProfileValidationWrapper';

const Home = () => {
  const [isAddActivityOpen, setIsAddActivityOpen] = useState(false);
  return (
    <Box className="home-page">
      <Container 
        maxWidth="lg"
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: 'auto',
          py: 4
        }}
      >
        <Box className="home-content">
          <Typography 
            variant="h2" 
            component="h2" 
            className="home-main-title" 
            sx={{ fontWeight: 700 }}
          >
            Build Your <span className="highlight">Resume</span> &amp; Log Your <span className="highlight">Progress</span>
          </Typography>
          <Typography 
            variant="body1" 
            className="home-subtitle" 
            sx={{ fontWeight: 600, mt: 2 }}
          >
            Create a stunning resume and log your coding journey with our comprehensive dashboard for LeetCode progress and daily activities.
          </Typography>
          <Box className="home-buttons" sx={{ mt: 4 }}>
            <Button variant="contained" color="primary" component={Link} to="/dashboard">
              View Dashboard
            </Button>
            <ProfileValidationWrapper>
              <Button variant="outlined" sx={{ ml: 2 }}>
                Create Resume
              </Button>
            </ProfileValidationWrapper>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Home; 