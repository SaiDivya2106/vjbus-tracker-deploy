import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./ComplaintsDetails.css";
import { HiOutlineThumbUp, HiOutlineThumbDown } from "react-icons/hi";
import { IoMdSend } from "react-icons/io";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { BiCategoryAlt } from "react-icons/bi";
import { FaDoorOpen } from "react-icons/fa";
import { FiWifi, FiClock } from "react-icons/fi";
import { IoMdCall } from "react-icons/io";
import { useAuth } from "../../Context/AuthContext";
import ComplaintCategoryWithFlag from "../ComplaintCategoryWithFlag/ComplaintCategoryWithFlag";

const ComplaintsDetails = () => {
  const { complaint_id } = useParams();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState(null);
  const [status, setStatus] = useState("");
  const [newComment, setNewComment] = useState("");
  const { user } = useAuth();
  const baseUrl = process.env.REACT_APP_COMPLAINTS_APP_BE_URL;

  // determine if complaint is flagged (used to disable updates)
  const isFlagged = complaint?.flagged === true || complaint?.flagged?.isFlagged === true;

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  useEffect(() => {
    const fetchComplaint = async () => {
      try {
        const token = localStorage.getItem("authToken");

        const response = await axios.get(
          `${baseUrl}/admin-api/view-complaint/${complaint_id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const complaintData = response.data.complaint;
        setComplaint({
          ...complaintData,
          comments: complaintData.comments || [],
        });
        setStatus(complaintData.status);
      } catch (error) {
        console.error("Error fetching complaint details:", error);
      }
    };
    fetchComplaint();
  }, [complaint_id]);

  const handleStatusChange = async (e) => {
    const updatedStatus = e.target.value;
    setStatus(updatedStatus);

    if (!user || !user.email) {
      toast.error("Admin email missing. Please login again.");
      return;
    }

    try {
      const token = localStorage.getItem("authToken");

      await axios.put(
        `${baseUrl}/admin-api/update-status/${complaint_id}`,
        { status: updatedStatus, adminEmail: user.email },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setComplaint((prev) => ({ ...prev, status: updatedStatus }));
      toast.success(`Status updated to: ${updatedStatus}`);
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status.");
    }
  };

  const handleCategoryChange = async (e) => {
    const newCategory = e.target.value;

    if (newCategory === complaint.category) {
      toast.info("Please select a different category");
      return;
    }

    if (
      !window.confirm(
        `Are you sure you want to move this complaint to ${newCategory}?`
      )
    ) {
      return;
    }

    try {
      const token = localStorage.getItem("authToken");

      await axios.put(
        `${baseUrl}/admin-api/change-category/${complaint_id}`,
        {
          newCategory,
          adminEmail: user.email,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setComplaint((prev) => ({ ...prev, category: newCategory }));
      toast.success(`Complaint moved to ${newCategory}.`);
    } catch (error) {
      console.error("Error changing category:", error);
      toast.error("Failed to change category.");
    }
  };

  const handleCommentSubmit = async () => {
    if (!newComment.trim()) return;

    try {
      const token = localStorage.getItem("authToken");

      await axios.post(
        `${baseUrl}/admin-api/complaints/${complaint_id}/comment`,
        {
          text: newComment,
          adminEmail: user.email,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setComplaint((prev) => ({
        ...prev,
        comments: [
          ...(prev.comments || []),
          {
            id: new Date().getTime(),
            text: newComment,
            date: new Date().toISOString(),
            email: user.email,
          },
        ],
      }));

      setNewComment("");
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  const handleDeleteComplaint = async () => {
    if (!window.confirm("Are you sure you want to delete this complaint?"))
      return;

    try {
      const token = localStorage.getItem("authToken");

      if (!user || !user.email) {
        toast.error("Admin email missing. Please login again.");
        return;
      }

      await axios.delete(`${baseUrl}/admin-api/delete-complaint/${complaint_id}`, {
        data: { adminEmail: user.email },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      alert("Complaint deleted successfully.");
      navigate("/adminpage");
    } catch (error) {
      console.error("Error deleting complaint:", error);
    }
  };

  const handleBackClick = () => navigate("/adminpage");

  if (!complaint) return <div className="container">Loading complaint...</div>;

  return (
    <div className="complaint-page">
      <ToastContainer />
      <div className="container">

        <button className="btn btn-outline-primary mb-3 mt-3" onClick={handleBackClick}>
          <i className="bi bi-arrow-left"></i> Back
        </button>

        <div className="complaint-header-wrapper d-flex justify-content-between align-items-center mt-4 mb-3 px-2">
          <h1 className="page-title fs-2 fw-bold mb-0">Complaint Details</h1>
          <button className="btn btn-danger delete-icon-btn" onClick={handleDeleteComplaint}>
            <i className="bi bi-trash3-fill"></i>
          </button>
        </div>

        {/* MAIN SECTION */}
        <div className="content-section">

          <div className="top-row d-flex justify-content-between align-items-center position-relative">
            <span className="categoryb">
              <BiCategoryAlt size={18} /> {complaint.category}
            </span>

            <div className="engagement-box d-flex gap-3">
              <div className="likes d-flex align-items-center gap-1">
                <HiOutlineThumbUp size={24} /> {complaint.likes}
              </div>
              <div className="dislikes d-flex align-items-center gap-1">
                <HiOutlineThumbDown size={24} /> {complaint.dislikes}
              </div>
            </div>

            <div
              className="position-absolute"
              style={{ top: "10px", right: "10px", zIndex: 10 }}
            >
              <ComplaintCategoryWithFlag
                complaintId={complaint.complaint_id}
                baseUrl={baseUrl}
                complaint={complaint}
                user={user}
                onFlagged={() => toast.success("Complaint flagged!")}
                disabled={isFlagged}
              />
            </div>
          </div>

          <h1 className="h4 fw-bold">{complaint.title}</h1>

          <div className="complaint-meta mt-2">
            <span className="me-3">
              <i className="bi bi-calendar3 me-1"></i>
              {formatDate(complaint.timestamp)}
            </span>
          </div>

          <p className="mt-2 description-text">{complaint.description}</p>

{/* ⭐ FIXED - STATUS LEFT, CATEGORY RIGHT WITH LABELS */}
<div className="d-flex justify-content-between align-items-start mt-4 flex-wrap">

  {/* LEFT SIDE - STATUS */}
  <div className="status-box" style={{ minWidth: "240px" }}>
    <label className="form-label fw-bold mb-1">Update Status</label>
    <select
      className={`form-select ${status.toLowerCase()}-status`}
      value={status}
      onChange={handleStatusChange}
      disabled={isFlagged}
    >
      <option value="Pending">⏳ Pending</option>
      <option value="Ongoing">🔄 Ongoing</option>
      <option value="Resolved">✅ Resolved</option>
    </select>
  </div>

  {/* RIGHT SIDE - CATEGORY */}
  <div className="category-box" style={{ minWidth: "280px" }}>
    <label className="form-label fw-bold mb-1">Change Category(reassign/escalate)</label>
    <select
      className="form-select"
      value={complaint.category}
      onChange={handleCategoryChange}
      disabled={isFlagged}
    >
      <option value={complaint.category}>{complaint.category} (current)</option>
      <option value="Infrastructure">Infrastructure</option>
      <option value="Canteen">Canteen</option>
      <option value="Examination">Examination</option>
      <option value="Fee Payments and Accounts">Fee Payments and Accounts</option>
      <option value="Boys Hostel">Boys Hostel</option>
      <option value="Girls Hostel">Girls Hostel</option>
      <option value="Hostel Food">Hostel Food</option>
      <option value="Extracurricular and Events">Extracurricular and Events</option>
      <option value="Security">Security</option>
      <option value="Sports">Sports</option>
      <option value="Housekeeping">Housekeeping</option>
      <option value="Audio-Visual Equipment">Audio-Visual Equipment</option>
      <option value="Parking">Parking</option>
      <option value="Transport">Transport</option>
      <option value="Library">Library</option>
      <option value="IT and Networking">IT and Networking</option>
      <option value="Others">Others</option>
    </select>
  </div>

</div>


          <hr className="mt-4" />

          {/* COMMENTS TIMELINE */}
          <h3 className="comment-heading">
            <i className="bi bi-chat-left-dots-fill"></i> Timeline (
            {complaint.comments.length})
          </h3>

          <div className="comments-container">
            {complaint.comments.length > 0 ? (
              <div className="timeline">
                {complaint.comments.map((c, index) => {
                  // Determine display name and styling based on role
                  const isStudent = c.role === "student";
                  const displayName = isStudent ? "Student" : (c.email || "Admin");
                  const roleIcon = isStudent ? "🎓" : "👨‍💼";
                  const roleColor = isStudent ? "#ff6b6b" : "#4c63d2";
                  const roleBgColor = isStudent ? "#ffe0e0" : "#e8f0ff";

                  return (
                    <div key={c.id || index} className="timeline-item">
                      {/* Timeline dot and connector */}
                      <div className="timeline-marker" style={{ borderColor: roleColor, backgroundColor: roleColor }}>
                        {roleIcon}
                      </div>
                      {index < complaint.comments.length - 1 && <div className="timeline-line" style={{ borderLeftColor: roleColor }}></div>}

                      {/* Comment card */}
                      <div className="timeline-content">
                        <div className="comment-card" style={{ borderLeftColor: roleColor, backgroundColor: roleBgColor }}>
                          <div className="comment-header">
                            <span className="comment-role" style={{ color: roleColor, fontWeight: "700" }}>
                              {displayName}
                            </span>
                            <span className="comment-date">
                              {formatDate(c.timestamp || c.date)}
                            </span>
                          </div>
                          <div className="comment-body">{c.text}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted">No comments yet.</p>
            )}

            <div className="d-flex align-items-center mt-3">
              <textarea
                className="form-control flex-grow-1"
                placeholder="Add your comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows="2"
              ></textarea>

              <button
                className="btn btn-primary btn-sm ms-2 d-flex align-items-center justify-content-center"
                onClick={handleCommentSubmit}
                disabled={!newComment.trim()}
                style={{ width: "60px", height: "60px" }}
              >
                <IoMdSend size={28} className="text-white" />
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ComplaintsDetails;
