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
import { useAuth } from "../../Context/AuthContext";

const ComplaintsDetails = () => {
  const { complaint_id } = useParams();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState(null);
  const [status, setStatus] = useState("");
  const [newComment, setNewComment] = useState("");
  const {user}=useAuth()
  const baseUrl = process.env.REACT_APP_COMPLAINTS_APP_BE_URL;

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

      // ⭐ If unauthorized (token expired/invalid)
      if (error.response && error.response.status === 401) {
        localStorage.removeItem("authToken");
        navigate("/complaints-website");
      }
    }
  };

  fetchComplaint();
}, [complaint_id]);

  const handleStatusChange = async (e) => {
    const updatedStatus = e.target.value;
    setStatus(updatedStatus);

    try {
// Get token from localStorage
const token = localStorage.getItem("authToken");

await axios.put(
  `${baseUrl}/admin-api/update-status/${complaint_id}`,
  { 
    status: updatedStatus,
    adminEmail: user.email   // ✅ send admin's email
  },
  {
    headers: {
      Authorization: `Bearer ${token}`, // ✅ keep the token for verification
    },
  }
);


      setComplaint((prev) => ({ ...prev, status: updatedStatus }));
      toast.success(`Status updated to: ${updatedStatus}`, {
        position: "top-right",
        autoClose: 3000,
      });
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status. Please try again.", {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

 const handleCommentSubmit = async () => {
  if (!newComment.trim()) return;

  const newCommentObj = {
    id: (complaint.comments.length || 0) + 1,
    date: new Date().toISOString(),
    text: newComment,
  };

  try {
   // Get token from localStorage
const token = localStorage.getItem("authToken");

await axios.post(
  `${baseUrl}/admin-api/complaints/${complaint_id}/comment`,
  {
    text: newComment,
    adminEmail: user.email,
  },
  {
    headers: {
      Authorization: `Bearer ${token}`, // Add Bearer token
    },
  }
);


    // Add comment to UI manually
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

    setNewComment(""); // clear the input
  } catch (error) {
    console.error("Error adding comment:", error);
  }
};


  const handleDeleteComplaint = async () => {
    if (!window.confirm("Are you sure you want to delete this complaint?")) return;

    try {
      // Get token from localStorage
const token = localStorage.getItem("authToken");

await axios.delete(
  `${baseUrl}/admin-api/delete-complaint/${complaint_id}`,
  {
    headers: {
      Authorization: `Bearer ${token}`, // ✅ keep token
    },
    data: {
      adminEmail: user.email, // ✅ send admin email to backend
    },
  }
);


      alert("Complaint has been deleted successfully.");
      navigate("/adminpage");
    } catch (error) {
      console.error("Error deleting complaint:", error);
    }
  };

  const handleBackClick = () => {
    navigate("/adminpage");
  };

  if (!complaint) {
    return <div className="container">Loading complaint details...</div>;
  }

  return (
    <div className="complaint-page">
      <ToastContainer />
      <div className="container">
        <button className="btn btn-outline-primary mb-3 mt-3" onClick={handleBackClick}>
          <i className="bi bi-arrow-left"></i> Back
        </button>

<div className="complaint-header-wrapper d-flex justify-content-between align-items-center mt-4 mb-3 px-2">
  <h1 className="page-title fs-2 fw-bold mb-0">Request Details</h1>
  <button
    className="btn btn-danger delete-icon-btn"
    onClick={handleDeleteComplaint}
    title="Delete Complaint"
  >
    <i className="bi bi-trash3-fill"></i>
  </button>
</div>


        {/* MAIN SECTION (No Card) */}
        <div className="content-section">
          <div className="top-row">
  <span className="categoryb">
    <BiCategoryAlt size={18} /> {complaint.category}
  </span>
  <div className="engagement-box">
    <div className="likes">
      <HiOutlineThumbUp size={24} /> {complaint.likes}
    </div>
    <div className="dislikes">
      <HiOutlineThumbDown size={24} /> {complaint.dislikes}
    </div>
  </div>
</div>


          <h1 className="h4 fw-bold">{complaint.title}</h1>

          <div className="complaint-meta mt-2">
            <span className="me-3">
              <i className="bi bi-calendar3 me-1"></i> {formatDate(complaint.timestamp)}
            </span>
           
          </div>

          <p className="mt-2 description-text">{complaint.description}</p>

          {/* STATUS */}
          <div className="update-status-box mt-3">
            <span>Update Status:</span>
            <select
              className={`form-select ${status.toLowerCase()}-status`}
              value={status}
              onChange={handleStatusChange}
            >
              <option value="Pending">⏳ Pending</option>
              <option value="Ongoing">🔄 Ongoing</option>
              <option value="Resolved">✅ Resolved</option>
            </select>
          </div>

          <hr style={{ borderTop: "2px solid #666", marginTop: "1rem", marginBottom: "2rem" }} />

          {/* COMMENTS */}
          <div className="section-header">
            <h3 className="comment-heading">
              <i className="bi bi-chat-left-dots-fill"></i>Comments ({complaint.comments.length})
            </h3>
          </div>

          <div className="comments-container">
            {complaint.comments.length > 0 ? (
              complaint.comments.map((comment) => (
                <div key={comment.id} className="comment-card">
                  <div className="comment-header">
  <div className="author-wrapper">
    <span className="comment-avatar">👤</span>
    <span className="comment-author">{user.name || "Admin Team"}</span>
  </div>
  <div className="comment-date">{formatDate(comment.date)}</div>
</div>
                  <div className="comment-body">{comment.text}</div>
                </div>
              ))
            ) : (
              <p className="text-muted">No comments yet.</p>
            )}

            <div className="d-flex align-items-center mt-3">
              <textarea
                className="form-control flex-grow-1"
                placeholder="Add your comment here..."
                rows="2"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              ></textarea>

              <button
                className="btn btn-primary btn-sm ms-2 d-flex align-items-center justify-content-center"
                onClick={handleCommentSubmit}
                disabled={!newComment.trim()}
                style={{ width: "60px", height: "60px" }}
              >
                <IoMdSend className="text-white" size={30} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplaintsDetails;
