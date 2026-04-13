import React, { useEffect, useState } from 'react';
import { useAuth } from '../../Context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AssistantDashboard.css';

import socket from "../../socket";

const AssistantDashboard = () => {
    const { user, isAssistant } = useAuth();
    const navigate = useNavigate();
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [remarks, setRemarks] = useState({});
    const [statusUpdateLoading, setStatusUpdateLoading] = useState(null);

    const baseUrl = process.env.REACT_APP_COMPLAINTS_APP_BE_URL;
const [selectedCategory, setSelectedCategory] = useState("All");
const [statusFilter, setStatusFilter] = useState("All");
    useEffect(() => {
        if (!isAssistant) {
            navigate('/all-complaints');
            return;
        }
        fetchComplaints();
    }, [isAssistant, navigate]);

    const fetchComplaints = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('authToken');
            const response = await axios.get(`${baseUrl}/admin-api/assistant-complaints?email=${user.email}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setComplaints(response.data.complaints);
        } catch (error) {
            console.error('Error fetching complaints:', error);
        } finally {
            setLoading(false);
        }
    };




    useEffect(() => {
  socket.on("complaintAssigned", (data) => {
    if (data.assistantEmail === user.email) {
      fetchComplaints(selectedCategory, statusFilter);
    }
  });

  return () => socket.off("complaintAssigned");
}, []);







    const handleStatusUpdate = async (complaintId, newStatus) => {
        try {
            setStatusUpdateLoading(complaintId);
            const token = localStorage.getItem('authToken');
            await axios.put(`${baseUrl}/admin-api/update-complaint-status-assistant`, {
                complaintId,
                status: newStatus,
                remarks: remarks[complaintId] || "",
                assistantEmail: user.email
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Refresh complaints
            fetchComplaints();
            setRemarks(prev => ({ ...prev, [complaintId]: "" })); // Clear remarks
            alert(`Status updated to ${newStatus}`);
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Failed to update status');
        } finally {
            setStatusUpdateLoading(null);
        }
    };

    if (loading) return <div className="assistant-loading">Loading assigned complaints...</div>;

    return (
        <div className="assistant-dashboard">
            <h1>Assistant Dashboard</h1>
            <p>Welcome, {user?.name}</p>

            {complaints.length === 0 ? (
                <p>No complaints assigned to you.</p>
            ) : (
                <div className="complaints-list">
                    {complaints.map(complaint => (
                        <div key={complaint.complaint_id} className="complaint-card">
                            <div className="complaint-header">
                                <h3>{complaint.title}</h3>
                                <span className={`status-badge ${complaint.status.toLowerCase()}`}>{complaint.status}</span>
                            </div>
                            <p className="complaint-desc">{complaint.description}</p>
                            <div className="complaint-details">
                                <p><strong>Category:</strong> {complaint.category}</p>
                                <p><strong>User:</strong> {complaint.user_id}</p>
                                <p><strong>Date:</strong> {new Date(complaint.timestamp).toLocaleDateString()}</p>
                                {complaint.assignedBy && <p><strong>Assigned By:</strong> {complaint.assignedBy}</p>}
                                {complaint.assistantRemarks && (
                                    <p><strong>Last Remark:</strong> {
                                        (() => {
                                            let remark = complaint.assistantRemarks || "";
                                            remark = remark.replace(/by assistant/gi, "").replace(/\s+/g, " ").trim();
                                            remark = remark.replace(/by\s+by/gi, "by");
                                            return remark;
                                        })()
                                    }</p>
                                )}
                            </div>

                            <div className="action-area">
                                <textarea
                                    placeholder="Add remarks before updating status..."
                                    value={remarks[complaint.complaint_id] || ""}
                                    onChange={(e) => setRemarks(prev => ({ ...prev, [complaint.complaint_id]: e.target.value }))}
                                />
                                <div className="status-buttons">
                                    {complaint.status !== 'Ongoing' && (
                                        <button
                                            className="btn-ongoing"
                                            disabled={statusUpdateLoading === complaint.complaint_id}
                                            onClick={() => handleStatusUpdate(complaint.complaint_id, 'Ongoing')}
                                        >
                                            Mark In Progress
                                        </button>
                                    )}
                                    {complaint.status !== 'Resolved' && (
                                        <button
                                            className="btn-resolve"
                                            disabled={statusUpdateLoading === complaint.complaint_id}
                                            onClick={() => handleStatusUpdate(complaint.complaint_id, 'Resolved')}
                                        >
                                            Resolve
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AssistantDashboard;
