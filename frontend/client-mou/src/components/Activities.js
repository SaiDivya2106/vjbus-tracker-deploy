import React, { useState, useEffect, useRef } from 'react';
import './Activities.css';
import api, { API_BASE_URL } from '../api';

function Activities({ mouPrefix, userEmail, canManage }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const fileInputsRef = useRef({});
  const [newActivity, setNewActivity] = useState({
    title: '',
    description: '',
    date: '',
    status: 'not-started'
  });

  useEffect(() => {
    fetchActivities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mouPrefix]);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/mous/${mouPrefix}/activities`);
      setActivities(response.data);
    } catch (err) {
      console.error('Error fetching activities:', err);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddActivity = async () => {
    if (!newActivity.title || !newActivity.date) {
      alert('Title and Date are required');
      return;
    }

    try {
      await api.post(`/api/mous/${mouPrefix}/activities`, {
        ...newActivity,
        createdBy: userEmail,
        createdAt: new Date().toISOString()
      });
      
      setNewActivity({ title: '', description: '', date: '', status: 'not-started' });
      setIsAdding(false);
      fetchActivities();
    } catch (err) {
      console.error('Error adding activity:', err);
      alert('Failed to add activity');
    }
  };

  const handleDeleteActivity = async (activityId) => {
    if (!window.confirm('Are you sure you want to delete this activity?')) {
      return;
    }

    try {
      await api.delete(`/api/mous/${mouPrefix}/activities/${activityId}`);
      fetchActivities();
    } catch (err) {
      console.error('Error deleting activity:', err);
      alert('Failed to delete activity');
    }
  };

  const handleUpdateStatus = async (activityId, newStatus) => {
    try {
      await api.patch(`/api/mous/${mouPrefix}/activities/${activityId}`, {
        status: newStatus
      });
      fetchActivities();
    } catch (err) {
      console.error('Error updating activity:', err);
      alert('Failed to update status');
    }
  };

  const handleUploadPhoto = async (activityId, file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('photo', file);
    formData.append('uploadedBy', userEmail || 'unknown');
    try {
      await api.post(`/api/mous/${mouPrefix}/activities/${activityId}/attachments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      fetchActivities();
    } catch (err) {
      console.error('Error uploading photo:', err);
      alert('Failed to upload photo');
    } finally {
      if (fileInputsRef.current[activityId]) {
        fileInputsRef.current[activityId].value = '';
      }
    }
  };

  const isLikedByUser = (activity) => {
    if (!userEmail) return false;
    return Array.isArray(activity.likes) && activity.likes.includes(userEmail);
  };

  const toggleLike = async (activity) => {
    try {
      if (isLikedByUser(activity)) {
        await api.delete(`/api/mous/${mouPrefix}/activities/${activity.id}/like`, {
          params: { email: userEmail }
        });
      } else {
        await api.post(`/api/mous/${mouPrefix}/activities/${activity.id}/like`, { email: userEmail });
      }
      fetchActivities();
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'green';
      case 'in-progress': return 'blue';
      case 'not-started': return 'orange';
      case 'cancelled': return 'red';
      default: return 'gray';
    }
  };

  if (loading) {
    return <div className="activities-loading">Loading activities...</div>;
  }

  // Sort activities by date descending (latest first)
  const sortedActivities = [...activities].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="activities-container">
      <div className="activities-header">
        <h3>📅 Activities & Events</h3>
        {canManage && (
          <button 
            className="btn-add-activity"
            onClick={() => setIsAdding(!isAdding)}
          >
            {isAdding ? '✕ Cancel' : '➕ Add Activity'}
          </button>
        )}
      </div>

      {isAdding && (
        <div className="activity-form">
          <input
            type="text"
            placeholder="Activity Title *"
            value={newActivity.title}
            onChange={(e) => setNewActivity({ ...newActivity, title: e.target.value })}
            className="form-input"
          />
          <textarea
            placeholder="Description"
            value={newActivity.description}
            onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
            className="form-textarea"
            rows="3"
          />
          <div className="form-row">
            <input
              type="date"
              value={newActivity.date}
              onChange={(e) => setNewActivity({ ...newActivity, date: e.target.value })}
              className="form-input"
            />
            <select
              value={newActivity.status}
              onChange={(e) => setNewActivity({ ...newActivity, status: e.target.value })}
              className="form-select"
            >
              <option value="not-started">⏸️ Not Started</option>
              <option value="in-progress">🔄 In Progress</option>
              <option value="completed">✅ Completed</option>
              <option value="cancelled">❌ Cancelled</option>
            </select>
          </div>
          <button className="btn-save-activity" onClick={handleAddActivity}>
            Save Activity
          </button>
        </div>
      )}

      <div className="activities-list timeline">
        {sortedActivities.length === 0 ? (
          <div className="no-activities">
            📭 No activities yet. {canManage && 'Click "Add Activity" to create one.'}
          </div>
        ) : (
          sortedActivities.map(activity => (
            <div key={activity.id} className="activity-card">
              <div className="activity-header">
                <h4>{activity.title}</h4>
                <span className={`status-badge ${getStatusColor(activity.status)}`}>
                  {activity.status}
                </span>
              </div>
              
              {activity.description && (
                <p className="activity-description">{activity.description}</p>
              )}
              
              <div className="activity-meta">
                <span>📅 {new Date(activity.date).toLocaleDateString()}</span>
                <span>👤 {activity.createdBy}</span>
              </div>

              {activity.attachments && activity.attachments.length > 0 && (
                <div className="activity-attachments">
                  {activity.attachments.map(att => (
                    <a key={att.id} href={`${att.url.startsWith('http') ? att.url : API_BASE_URL + att.url}`} target="_blank" rel="noreferrer" className="attachment-thumb">
                      <img src={`${att.url.startsWith('http') ? att.url : API_BASE_URL + att.url}`} alt={att.originalName || 'attachment'} />
                    </a>
                  ))}
                </div>
              )}

              {canManage && (
                <div className="activity-actions">
                  <button
                    className={`btn-like ${isLikedByUser(activity) ? 'liked' : ''}`}
                    onClick={() => toggleLike(activity)}
                  >
                    {isLikedByUser(activity) ? '❤️' : '🤍'} {Array.isArray(activity.likes) ? activity.likes.length : 0}
                  </button>
                  <select
                    value={activity.status}
                    onChange={(e) => handleUpdateStatus(activity.id, e.target.value)}
                    className="status-select"
                  >
                    <option value="not-started">⏸️ Not Started</option>
                    <option value="in-progress">🔄 In Progress</option>
                    <option value="completed">✅ Completed</option>
                    <option value="cancelled">❌ Cancelled</option>
                  </select>
                  <label className="btn-upload">
                    📷 Add Photo
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      ref={el => (fileInputsRef.current[activity.id] = el)}
                      onChange={e => handleUploadPhoto(activity.id, e.target.files?.[0])}
                    />
                  </label>
                  <button
                    className="btn-delete"
                    onClick={() => handleDeleteActivity(activity.id)}
                  >
                    🗑️ Delete
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Activities;
