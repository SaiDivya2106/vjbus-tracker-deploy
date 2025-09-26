import React from 'react';
import { Box, Container } from '@mui/material';
import Navbar from './Navbar';

const Layout = ({ children, logout }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#ffffff' }}>
      <Navbar logout={logout} />
      <Box 
        component="main"
        sx={{ 
          flex: 1,
          bgcolor: '#ffffff',
          position: 'relative',
          zIndex: 0,
          mt: 0
        }}
      >
        <Container maxWidth="xl" sx={{ py: 4 }}>
          {children}
        </Container>
      </Box>
    </Box>
  );
};

export default Layout; 