import React, { useState, useEffect } from 'react';
import './App.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import UploadForm from './components/UploadForm';
import MouListGmail from './components/MouListGmail';
import MouViewer from './components/MouViewer';
import EditMou from './components/EditMou';
import api from './api';
import { canViewDashboard, ROLES } from './utils/roleUtils';
import NotificationsDropdown from './components/NotificationsDropdown';

function AppContent() {
  const { user, logout, isAuthenticated, loading: authLoading } = useAuth();
  const [mous, setMous] = useState([]);
  const [selectedMou, setSelectedMou] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [usersData, setUsersData] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [viewerInitialTab, setViewerInitialTab] = useState(null);

  // Fetch user role on login, reset on logout
  useEffect(() => {
    if (user) {
      fetchUserRole();
    } else {
      // Reset state on logout
      setUserRole(null);
      setUsersData(null);
      setSelectedMou(null);
      setActiveTab('dashboard');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Set initial tab based on role
  useEffect(() => {
    if (user && userRole && usersData) {
      if (canViewDashboard(user.email, usersData)) {
        setActiveTab('dashboard');
      } else {
        setActiveTab('list');
      }
    }
  }, [userRole, usersData, user]);

  const fetchUserRole = async () => {
    try {
      const response = await api.get('/api/auth/user', {
        params: { email: user.email }
      });
      setUserRole(response.data.role);
      
      // Fetch users data for role checking
      // Note: In production, this should be protected/limited
      const usersResponse = await api.get('/api/users');
      setUsersData(usersResponse.data);
    } catch (err) {
      console.error('Error fetching user role:', err);
    }
  };

  // Notifications: fetch unread count periodically
  useEffect(() => {
    let timer;
    const fetchUnread = async () => {
      try {
        if (!user?.email) return;
        const { data } = await api.get('/api/notifications', { params: { email: user.email } });
        setUnreadCount(data.unreadCount || 0);
      } catch (e) {
        // silent fail
      }
    };
    if (user) {
      fetchUnread();
      timer = setInterval(fetchUnread, 60000);
    }
    return () => timer && clearInterval(timer);
  }, [user]);

  const refreshUnread = async () => {
    try {
      if (!user?.email) return;
      const { data } = await api.get('/api/notifications', { params: { email: user.email } });
      setUnreadCount(data.unreadCount || 0);
    } catch {}
  };

  // Subscribe to SSE notifications (real-time)
  useEffect(() => {
    if (!user?.email) return;
    const url = `${api.defaults.baseURL}/api/notifications/stream?email=${encodeURIComponent(user.email)}`;
    const es = new EventSource(url);
    es.onmessage = (ev) => {
      try {
        const payload = JSON.parse(ev.data);
        if (payload.type === 'init' && typeof payload.unreadCount === 'number') {
          setUnreadCount(payload.unreadCount);
        } else if (payload.type === 'new') {
          setUnreadCount((c) => c + 1);
          if (showNotifications) {
            refreshUnread();
          }
        }
      } catch {}
    };
    es.onerror = () => {
      es.close();
    };
    return () => es.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email, showNotifications]);

  useEffect(() => {
    if (activeTab === 'list' || activeTab === 'view') {
      fetchMous();
    }
  }, [activeTab]);

  const fetchMous = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/mous');
      setMous(response.data);
    } catch (err) {
      setError('Failed to fetch MoUs');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSuccess = () => {
    setActiveTab('list');
    fetchMous();
  };

  const handleViewMou = async (prefix) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/api/mou/${prefix}`);
      setSelectedMou(response.data);
      setActiveTab('view');
    } catch (err) {
      setError('Failed to fetch MoU details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = async (prefix) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/api/mou/${prefix}`);
      setSelectedMou(response.data);
      setActiveTab('edit');
    } catch (err) {
      setError('Failed to load MoU for editing');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditSaved = async () => {
    if (!selectedMou) return;
    await handleViewMou(selectedMou.prefix);
  };

  const handleDeleteMou = async (prefix) => {
    if (!window.confirm(`Are you sure you want to delete MoU: ${prefix}?`)) {
      return;
    }

    try {
      await api.delete(`/api/mou/${prefix}`);
      fetchMous();
      if (selectedMou && selectedMou.prefix === prefix) {
        setSelectedMou(null);
        setActiveTab('list');
      }
    } catch (err) {
      setError('Failed to delete MoU');
      console.error(err);
    }
  };

  if (authLoading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  const showDashboard = userRole && usersData && canViewDashboard(user.email, usersData);
  const isManager = userRole === ROLES.MANAGER;

  return (
    <div className="App">
      <header className="App-header">
        <div className="header-content">
          <h1>📋 MoU Management System</h1>
          <div className="header-nav">
            {showDashboard && (
              <button
                className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => setActiveTab('dashboard')}
              >
                📊 Dashboard
              </button>
            )}
            <button
              className={`nav-btn ${activeTab === 'list' ? 'active' : ''}`}
              onClick={() => setActiveTab('list')}
            >
              📑 MoUs
            </button>
            {isManager && (
              <button
                className={`nav-btn ${activeTab === 'upload' ? 'active' : ''}`}
                onClick={() => setActiveTab('upload')}
              >
                ⬆️ Upload
              </button>
            )}
          </div>
          <div className="header-right">
            <div className="notif-wrapper">
              <button
                className="notif-bell"
                onClick={() => setShowNotifications(s => !s)}
                title="Notifications"
              >
                🔔
                {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
              </button>
              {showNotifications && (
                <NotificationsDropdown
                  userEmail={user.email}
                  onClose={() => setShowNotifications(false)}
                  onMarkedRead={refreshUnread}
                  onNavigateToMou={(prefix, type) => {
                    // Map notification type to viewer tab
                    const tab = type === 'comment' ? 'community' : 'activities';
                    setViewerInitialTab(tab);
                    handleViewMou(prefix);
                  }}
                />)
              }

            </div>
            <span className="user-email">{user.email}</span>
            <span className="user-role-badge">{userRole}</span>
            <button className="btn-logout" onClick={logout}>
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="main-content">
        {error && (
          <div className="error-message">{error}</div>
        )}

        {activeTab === 'dashboard' && showDashboard && <Dashboard />}

        {activeTab === 'upload' && isManager && (
          <UploadForm onSuccess={handleUploadSuccess} />
        )}

        {activeTab === 'list' && (
          loading ? (
            <div className="loading">Loading MoUs...</div>
          ) : (
            <MouListGmail
              mous={mous}
              onView={handleViewMou}
              onEdit={isManager ? handleOpenEdit : null}
              onDelete={isManager ? handleDeleteMou : null}
              userEmail={user?.email}
            />
          )
        )}

        {activeTab === 'view' && selectedMou && (
          <MouViewer
            mou={selectedMou}
            onBack={() => setActiveTab('list')}
            onEdit={isManager ? () => handleOpenEdit(selectedMou.prefix) : null}
            userEmail={user?.email}
            usersData={usersData}
            userRole={userRole}
            initialTab={viewerInitialTab}
          />
        )}

        {activeTab === 'edit' && selectedMou && isManager && (
          <EditMou
            mou={selectedMou}
            onCancel={() => setActiveTab('view')}
            onSaved={handleEditSaved}
          />
        )}
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
