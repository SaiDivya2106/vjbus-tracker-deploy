import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import './Dashboard.css';

function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [expiringMous, setExpiringMous] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch stats
      const statsResponse = await api.get('/api/dashboard/stats', {
        params: { email: user.email }
      });
      setStats(statsResponse.data);

      // Fetch expiring MoUs (within 30 days)
      const expiringResponse = await api.get('/api/dashboard/expiring', {
        params: { email: user.email, days: 30 }
      });
      setExpiringMous(expiringResponse.data);

      // Fetch recent activities (last 5)
      const activitiesResponse = await api.get('/api/dashboard/recent-activities', {
        params: { email: user.email, limit: 5 }
      });
      setRecentActivities(activitiesResponse.data);

      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load dashboard data');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const getDaysUntilExpiry = (endDate) => {
    if (!endDate) return null;
    const today = new Date();
    const expiry = new Date(endDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <p>⚠️ {error}</p>
        <button onClick={fetchDashboardData} className="btn-retry">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>📊 Dashboard</h1>
        <p>Overview of your MoU activities</p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card stat-total">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <h3>{stats?.total || 0}</h3>
            <p>Total MoUs</p>
          </div>
        </div>

        <div className="stat-card stat-active">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{stats?.active || 0}</h3>
            <p>Active MoUs</p>
          </div>
        </div>

        <div className="stat-card stat-expired">
          <div className="stat-icon">⏰</div>
          <div className="stat-content">
            <h3>{stats?.expired || 0}</h3>
            <p>Expired MoUs</p>
          </div>
        </div>

        <div className="stat-card stat-activities">
          <div className="stat-icon">🎯</div>
          <div className="stat-content">
            <h3>{stats?.totalActivities || 0}</h3>
            <p>Total Activities</p>
            <span className="stat-sub">+{stats?.monthActivities || 0} this month</span>
          </div>
        </div>
      </div>

      {/* Expiring MoUs Warning */}
      {expiringMous.length > 0 && (
        <div className="warning-section">
          <div className="section-header">
            <h2>⚠️ Expiring Soon (Within 30 Days)</h2>
          </div>
          <div className="expiring-list">
            {expiringMous.map((mou) => {
              const daysLeft = getDaysUntilExpiry(mou.end_date || mou.mou_end_date);
              return (
                <div key={mou.prefix} className="expiring-item">
                  <div className="expiring-info">
                    <h4>{mou.title || mou.prefix}</h4>
                    <p className="mou-prefix">{mou.prefix}</p>
                  </div>
                  <div className="expiring-date">
                    <span className={`days-badge ${daysLeft <= 7 ? 'urgent' : 'warning'}`}>
                      {daysLeft > 0 ? `${daysLeft} days left` : 'Expired'}
                    </span>
                    <p>Expires {formatDate(mou.end_date || mou.mou_end_date)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Activities */}
      {recentActivities.length > 0 && (
        <div className="activities-section">
          <div className="section-header">
            <h2>📈 Recent Activities</h2>
          </div>
          <div className="activities-list">
            {recentActivities.map((activity, idx) => (
              <div key={idx} className="activity-item">
                <div className="activity-icon">
                  {activity.type === 'workshop' && '🎓'}
                  {activity.type === 'seminar' && '📢'}
                  {activity.type === 'exchange' && '🔄'}
                  {activity.type === 'project' && '💼'}
                  {activity.type === 'publication' && '📚'}
                </div>
                <div className="activity-info">
                  <h4>{activity.title}</h4>
                  <p className="activity-mou">{activity.mou_title || activity.mou_id}</p>
                </div>
                <div className="activity-date">
                  {formatDate(activity.date)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state if no activities */}
      {recentActivities.length === 0 && (
        <div className="empty-activities">
          <div className="empty-icon">📭</div>
          <h3>No Recent Activities</h3>
          <p>Add activities to track collaboration progress</p>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
