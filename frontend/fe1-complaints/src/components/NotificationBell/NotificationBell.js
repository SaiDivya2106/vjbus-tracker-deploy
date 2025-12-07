import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./NotificationBell.css";

const NotificationBell = ({ baseUrl, adminCategory, user }) => {
  const navigate = useNavigate();
  const [reopenedComplaints, setReopenedComplaints] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch reopened complaints in admin's category
  const fetchReopenedComplaints = async () => {
    if (!adminCategory || adminCategory.length === 0) return;

    setIsLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      const res = await axios.get(
        `${baseUrl}/admin-api/get-reopened-complaints`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { categories: adminCategory },
        }
      );

      setReopenedComplaints(res.data.complaints || []);
    } catch (error) {
      console.error("Error fetching reopened complaints:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch on mount and every 30 seconds
  useEffect(() => {
    fetchReopenedComplaints();
    const interval = setInterval(fetchReopenedComplaints, 30000);
    return () => clearInterval(interval);
  }, [adminCategory]);

  const handleComplaintClick = (complaintId) => {
    navigate(`/complaints-details/${complaintId}`);
    setShowDropdown(false);
    
    // Refetch reopened complaints after a delay to reflect the change
    // The complaint may no longer be \"Reopened\" after admin views/updates it
    setTimeout(() => {
      fetchReopenedComplaints();
    }, 2000);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "Unknown";
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <div className="notification-bell-container">
      <button
        className="notification-bell-btn"
        onClick={() => setShowDropdown(!showDropdown)}
        title="View reopened complaints"
      >
        🔔
        {reopenedComplaints.length > 0 && (
          <span className="notification-badge">{reopenedComplaints.length}</span>
        )}
      </button>

      {showDropdown && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h5>Reopened Complaints</h5>
            <button
              className="close-btn"
              onClick={() => setShowDropdown(false)}
            >
              ✕
            </button>
          </div>

          {isLoading ? (
            <div className="notification-content">
              <p className="text-center text-muted">Loading...</p>
            </div>
          ) : reopenedComplaints.length === 0 ? (
            <div className="notification-content">
              <p className="text-center text-muted">No reopened complaints</p>
            </div>
          ) : (
            <div className="notification-content">
              {reopenedComplaints.map((complaint) => (
                <div
                  key={complaint.complaint_id}
                  className="notification-item"
                  onClick={() => handleComplaintClick(complaint.complaint_id)}
                >
                  <div className="notification-title">
                    Complaint #{complaint.complaint_id}
                  </div>
                  <div className="notification-message">
                    {complaint.title}
                  </div>
                  <div className="notification-timestamp">
                    🔄 Reopened {formatDate(complaint.lastCommentAt)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
