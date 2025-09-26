import React, { useState, useEffect, useRef } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  IconButton, 
  Box, 
  Drawer, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  useMediaQuery, 
  useTheme, 
  Avatar, 
  Menu, 
  MenuItem, 
  Divider,
  Container
} from '@mui/material';
import { 
  Menu as MenuIcon, 
  Dashboard as DashboardIcon, 
  Description as ResumeIcon, 
  Home as HomeIcon,
  Link as IntegrationsIcon, 
  AccountCircle, 
  ExitToApp as LogoutIcon,
  Assignment as ActivitiesIcon,
  VpnKey as VpnKeyIcon,
  Create as CoverLetterIcon,
  Psychology as CopilotIcon
} from '@mui/icons-material';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Profile from './Profile';
import SetAPIKey from './SetAPIKey';
import ProfileValidationWrapper from './ProfileValidationWrapper';
import './Navbar.css';
import { initializeSelector, updateSelector, handleResponsiveSelector, addResizeListener } from './NavbarAnimation';

const Navbar = ({ logout }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const navigate = useNavigate();
  
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAPIKeyDialogOpen, setAPIKeyDialogOpen] = useState(false);
  
  const navbarRef = useRef(null);
  const activeRef = useRef(null);
  const selectorRef = useRef(null);
  
  const user = JSON.parse(localStorage.getItem('user')) || { name: 'User' };
  
  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };
  
  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handleLogout = () => {
    handleProfileMenuClose();
    logout();
  };
  
  const handleNavigate = (path) => {
    navigate(path);
    if (isMobile) {
      setDrawerOpen(false);
    }
  };

  const handleOpenProfile = () => {
    handleProfileMenuClose();
    setIsProfileOpen(true);
  };
  
  // Initialize and update selector on page load and route changes
  useEffect(() => {
    // Wait for the DOM to be fully loaded and refs to be available
    const timer = setTimeout(() => {
      if (!isMobile) {
        initializeSelector(selectorRef, activeRef, navbarRef);
      }
      handleResponsiveSelector(selectorRef, activeRef, navbarRef, isMobile);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [location.pathname, isMobile]);
  
  // Listen for window resize events
  useEffect(() => {
    const handleResize = () => {
      handleResponsiveSelector(selectorRef, activeRef, navbarRef, isMobile);
    };
    
    return addResizeListener(handleResize);
  }, [isMobile]);
  
  const menuItems = [
    { text: 'Home', icon: <HomeIcon />, path: '/' },
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Resume', icon: <ResumeIcon />, path: '/resume-builder', needsValidation: true },
    { text: 'Cover Letter', icon: <CoverLetterIcon />, path: '/cover-letter', needsValidation: true },
    { text: 'Career Copilot', icon: <CopilotIcon />, path: '/career-copilot', needsValidation: true },
  ];
  
  const drawer = (
    <Box sx={{ width: 250 }} role="presentation">
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
          <span style={{ color: '#5161ce' }}>Acti</span>
          <span style={{ color: '#dc004e' }}>gen</span>
        </Typography>
      </Box>
      <Divider />
      <List>
        {menuItems.map((item) => {
          const listItem = (
            <ListItem 
              button 
              key={item.text} 
              onClick={() => handleNavigate(item.path)}
              selected={location.pathname === item.path}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: '#5161ce',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: '#5161ce',
                  },
                },
              }}
            >
              <ListItemIcon sx={{ color: location.pathname === item.path ? 'white' : 'inherit' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text} 
                primaryTypographyProps={{
                  fontWeight: location.pathname === item.path ? 'bold' : 'normal',
                }}
              />
            </ListItem>
          );
          
          return item.needsValidation ? 
            <ProfileValidationWrapper key={item.text}>
              {React.cloneElement(listItem, { path: item.path })}
            </ProfileValidationWrapper> : 
            listItem;
        })}
      </List>
    </Box>
  );
  
  return (
    <>
      <AppBar 
        position="fixed" 
        elevation={0} 
        className="navbar-custom"
        sx={{ 
          backgroundColor: '#5161ce',
          color: 'white', 
        }}
      >
        <Container maxWidth="xl">
          <Toolbar disableGutters sx={{ minHeight: '64px', p: 0 }}>
            <Typography 
              variant="h6" 
              component="div" 
              className="navbar-logo"
              onClick={() => navigate('/')}
            >
              <span style={{ color: 'white', fontWeight: 'bold' }}>Acti</span>
              <span style={{ color: '#ff6b6b', fontWeight: 'bold' }}>Gen</span>
            </Typography>
            
            {isMobile ? (
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ ml: 'auto' }}
                className="navbar-toggler"
              >
                <MenuIcon />
              </IconButton>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', position: 'relative', width: '100%' }} ref={navbarRef}>
                <ul className="navbar-nav">
                  {/* Horizontal selector for active menu item */}
                  <div className="hori-selector" ref={selectorRef}>
                    <div className="left"></div>
                    <div className="right"></div>
                  </div>
                  
                  {menuItems.map((item, index) => {
                    const isActive = location.pathname === item.path;
                    const navItem = (
                      <li 
                        key={index} 
                        className={`nav-item ${isActive ? 'active' : ''}`}
                        ref={isActive ? activeRef : null}
                      >
                        <a 
                          className="nav-link" 
                          href="#" 
                          onClick={(e) => {
                            e.preventDefault();
                            handleNavigate(item.path);
                          }}
                        >
                          <span className="nav-icon">{item.icon}</span>
                          {item.text}
                        </a>
                      </li>
                    );
                    
                    return item.needsValidation ? (
                      <ProfileValidationWrapper key={index}>
                        {React.cloneElement(navItem, { path: item.path })}
                      </ProfileValidationWrapper>
                    ) : navItem;
                  })}
                </ul>
                
                <Box sx={{ display: 'flex', alignItems: 'center', ml: 'auto' }}>
                  <IconButton
                    size="large"
                    edge="end"
                    aria-label="account of current user"
                    aria-controls="menu-appbar"
                    aria-haspopup="true"
                    onClick={handleProfileMenuOpen}
                    color="inherit"
                  >
                    <Avatar sx={{ width: 35, height: 35 }} className="navbar-avatar">
                      {user.name.charAt(0)}
                    </Avatar>
                  </IconButton>
                </Box>
              </Box>
            )}
          </Toolbar>
        </Container>
      </AppBar>
      
      {/* Add space for the fixed navbar */}
      <Toolbar />
      
      <Menu
        id="menu-appbar"
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        keepMounted
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
      >
        <MenuItem onClick={() => { setIsProfileOpen(true); handleProfileMenuClose(); }}>
          <ListItemIcon><AccountCircle fontSize="small" /></ListItemIcon>
          Profile
        </MenuItem>
        <MenuItem onClick={() => { setAPIKeyDialogOpen(true); handleProfileMenuClose(); }}>
          <ListItemIcon><VpnKeyIcon fontSize="small" /></ListItemIcon>
          Set API Key
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
          Logout
        </MenuItem>
      </Menu>
      
      <Drawer
        variant="temporary"
        open={drawerOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 250 },
        }}
      >
        {drawer}
      </Drawer>

      {/* Profile Dialog */}
      <Profile 
        open={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
      />

      <SetAPIKey 
        open={isAPIKeyDialogOpen} 
        onClose={() => {
          setAPIKeyDialogOpen(false);
        }}
      />
    </>
  );
};

export default Navbar;