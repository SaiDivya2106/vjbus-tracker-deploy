// import React, { useState, useEffect } from "react";
// import { Card, Button, Row, Col } from "react-bootstrap";
// import { HiOutlineThumbUp, HiOutlineThumbDown } from "react-icons/hi";
// import { Clock, CalendarDays, ChevronDown, ChevronUp } from "lucide-react";
// import { FaPlus, FaCalendarAlt, FaExclamationCircle,FaUser } from "react-icons/fa";
// import { useNavigate } from "react-router-dom";
// import { useAuth } from "../../Context/AuthContext";
// import axios from "axios";
// import { MdOutlineTextsms } from "react-icons/md";
// import "./UserDashboard.css";


// import { Modal } from "react-bootstrap";


// const UserDashboard = () => {
//   const [showImageModal, setShowImageModal] = useState(false);
//   const [modalImageSrc, setModalImageSrc] = useState(null);

//   const { user } = useAuth();
//   const userEmail = user?.email;
//   const navigate = useNavigate();
//   const [complaints, setComplaints] = useState([]);
//   const [expandedCards, setExpandedCards] = useState({});

//   const baseUrl = process.env.REACT_APP_COMPLAINTS_APP_BE_URL;
//   const DEFAULT_IMAGE = "https://static.vecteezy.com/system/resources/previews/007/719/637/non_2x/no-camera-or-no-photo-allowed-sign-the-flat-icon-crossed-out-good-for-icon-sticker-message-flat-design-with-grey-color-vector.jpg";


// useEffect(() => {
//   if (userEmail) {
//     // Get token from localStorage
//     const token = localStorage.getItem("authToken");

//     axios
//       .get(`${baseUrl}/user-api/view-complaints/${userEmail}`, {
//         headers: {
//           Authorization: `Bearer ${token}`, // Add token to headers
//         },
//       })
//       .then((response) => {
//         setComplaints(response.data.complaints);
//       })
//       .catch((error) => {
//         console.error("Error fetching complaints:", error);
//       });
//   }
// }, [userEmail]);



// const openImageModal = (src) => {
//   setModalImageSrc(src);
//   setShowImageModal(true);
// };

//   const toggleExpand = (id) => {
//     setExpandedCards((prev) => ({
//       ...prev,
//       [id]: !prev[id],
//     }));
//   };

//   const formatDateTime = (isoString) => {
//     if (!isoString) return "Date not available";
//     const date = new Date(isoString);
//     return isNaN(date.getTime())
//       ? "Invalid date"
//       : date.toLocaleDateString("en-GB", {
//           day: "2-digit",
//           month: "short",
//           year: "numeric",
//         });
//   };

//   return (
//     <div className="user-dashboard-container">
//       <div className="dashboard-container">
//         <div className="page-heading text-center">
//           <h1>VNRVJIET Support-Request Portal</h1>
//           <p>Welcome to the platform where your voice matters!</p>
//         </div>

//         <div className="user-info mb-4">
//           <div className="user-avatar">
//             <img src={user?.picture} alt="Profile" className="rounded-circle" />
//           </div>
//           <div className="user-details">
//             <h2>Welcome, {user?.name || "User"}</h2>
//             <p><strong>Email:</strong> {userEmail}</p>
//           </div>
//         </div>

//         <div className="my-complaints-heading mb-3">
//           <h3>My Support-Requests</h3>
//         </div>

//         {complaints.length === 0 ? (
//           <div className="no-complaints-message text-center">
//             <p>You haven't raised any Requests yet. Have a concern? Speak up and let your voice be heard!</p>
//             <Button className="raise-complaint-btn mt-3 px-4 py-2 fw-bold" onClick={() => navigate("/complaint-form")}>
//               Raise a Support-Request
//             </Button>
//           </div>
//         ) : (
//           <Row className="gx-4 gy-4">
//             {complaints.map((complaint) => (
//               <Col key={complaint._id} xs={12} sm={6} lg={4}>
//                 <Card className=" rounded-4 complaint-card">
//                   <Card.Body className="d-flex flex-column">
// {/* Complaint image with status overlay (same as Home) */}
// <div className="complaint-image-wrapper mt-2 mb-3">
//   <Card.Img
//   variant="top"
//   src={complaint.image || DEFAULT_IMAGE}
//   alt="complaint"
//   className="complaint-image rounded-3"
//   style={{ maxHeight: "200px", objectFit: "cover", width: "100%", cursor: "pointer" }}
//   onClick={() => openImageModal(complaint.image || DEFAULT_IMAGE)}
// />

//   <div className="status-overlay">
//     <span className={`status-pill ${complaint.status.toLowerCase()}`}>
//       {complaint.status}
//     </span>
//   </div>
// </div>


// {/* Date line below status */}
// <div className="d-flex align-items-center text-muted small mb-3 mt-2">
//   <span
//     style={{
//       backgroundColor: "#e0f0ff",
//       color: "#1e90ff",
//       padding: "6px",
//       borderRadius: "10px",
//       display: "inline-flex",
//       alignItems: "center",
//       justifyContent: "center",
//       width: "28px",
//       height: "28px",
//       marginRight: "8px",
//     }}
//   >
//     <FaCalendarAlt style={{ fontSize: "14px" }} />
//   </span>
//     <span style={{ color: "#1e90ff", fontWeight: "700" }}>
//     {formatDateTime(complaint.createdAt || complaint.date || complaint.timestamp || complaint.created_on)}
//   </span>
// </div>


//                     <h5 className="fw-bold mb-2">{complaint.title}</h5>

//                     <Card.Text className="text-secondary mb-2">
//                       {complaint.description.split(" ").length > 20 ? (
//                         <>
//                           {expandedCards[complaint.complaint_id]
//                             ? complaint.description
//                             : complaint.description.split(" ").slice(0, 20).join(" ") + "..."}
//                           <span
//                             className="ms-2 text-primary"
//                             style={{ cursor: "pointer" }}
//                             onClick={() => toggleExpand(complaint.complaint_id)}
//                           >
//                             {expandedCards[complaint.complaint_id] ? "View less" : "View more"}
//                           </span>
//                         </>
//                       ) : (
//                         complaint.description
//                       )}
//                     </Card.Text>

//                     {complaint.comments?.length > 0 && (
//                       <button
//                         className={`admin-toggle-btn mt-2 ${
//                           expandedCards[complaint.complaint_id] ? "hide-updates-btn" : "show-updates-btn"
//                         }`}
//                         onClick={() => toggleExpand(complaint.complaint_id)}
//                       >
//                         Admin Updates
//                         {expandedCards[complaint.complaint_id] ? (
//                           <ChevronUp size={16} className="ms-1" />
//                         ) : (
//                           <ChevronDown size={16} className="ms-1" />
//                         )}
//                       </button>
//                     )}

//                     {expandedCards[complaint.complaint_id] && (
//                       <div className="admin-updates mt-3">
//                         <h6 className="d-flex align-items-center">
//                           <MdOutlineTextsms className="me-2 text-secondary" size={18} /> Admin Updates
//                         </h6>
//                         <div className="updates-container">
//                           {complaint.comments.map((update, index) => (
// <div key={index} className="update-entry">
//   <div className="d-flex justify-content-between align-items-start flex-wrap">
    
//     {/* EMAIL + ICON */}
//     <div className="d-flex align-items-center mb-1">
//       <FaUser className="me-2 text-purple" size={18} />
//       <div>
//         <strong style={{ fontSize: "14px" }}>{update.email}</strong>
//       </div>
//     </div>

//     {/* TIME */}
//     <div className="update-time d-flex align-items-center ms-auto">
//       <Clock size={14} className="me-1 text-muted" />
//       <small>{formatDateTime(update.date)}</small>
//     </div>
//   </div>

//   {/* TEXT (own line) */}
//   <div className="mt-1 ps-4">
//     <p className="update-text mb-1">{update.text}</p>
//   </div>
// </div>

//                           ))}
//                         </div>
//                       </div>
//                     )}

//                     <div className="mt-auto d-flex justify-content-between align-items-center pt-3">
//                       <div className="d-flex align-items-center gap-3">
//                         <span className="text-success d-flex align-items-center">
//                           <HiOutlineThumbUp className="me-1" size={20} />
//                           {complaint.likes}
//                         </span>
//                         <span className="text-danger d-flex align-items-center">
//                           <HiOutlineThumbDown className="me-1" size={20} />
//                           {complaint.dislikes}
//                         </span>
//                       </div>
//                       <span className="category-tag1">{complaint.category}</span>
//                     </div>
//                   </Card.Body>
//                 </Card>
//               </Col>
//             ))}
//           </Row>
//         )}

// <Modal
//   show={showImageModal}
//   onHide={() => setShowImageModal(false)}
//   centered
//   size="lg"
//   contentClassName="bg-dark border-0"
//   style={{ zIndex: 9999 }}  // ✅ ensures it's on top of everything
//   backdropClassName="custom-image-backdrop"
// >
//   <Modal.Body
//     className="p-0 d-flex justify-content-center align-items-center"
//     style={{ backgroundColor: "rgba(0,0,0,0.95)" }}
//   >
//     <img
//       src={modalImageSrc}
//       alt="Full preview"
//       style={{
//         width: "100%",
//         height: "auto",
//         maxHeight: "65vh",
//         objectFit: "contain",
//       }}
//     />
//     <button
//       onClick={() => setShowImageModal(false)}
//       style={{
//         position: "absolute",
//         top: "15px",
//         right: "20px",
//         background: "rgba(255,255,255,0.2)",
//         color: "white",
//         border: "none",
//         borderRadius: "50%",
//         width: "35px",
//         height: "35px",
//         fontSize: "1.5rem",
//         cursor: "pointer",
//         zIndex: 10000, // ✅ even above the modal image
//       }}
//     >
//       ×
//     </button>
//   </Modal.Body>
// </Modal>

// {/* 🔍 Shared Image Preview Modal */}
// <Modal
//   show={showImageModal}
//   onHide={() => setShowImageModal(false)}
//   centered
//   size="lg"
//   contentClassName="bg-dark border-0"
//   style={{ zIndex: 9999 }}
//   backdropClassName="custom-image-backdrop"
// >
//   <Modal.Body
//     className="p-0 d-flex justify-content-center align-items-center"
//     style={{ backgroundColor: "rgba(0,0,0,0.9)" }}
//   >
//     <img
//       src={modalImageSrc}
//       alt="Full preview"
//       style={{
//         width: "auto",
//         maxWidth: "80%",
//         height: "auto",
//         maxHeight: "65vh",
//         borderRadius: "10px",
//         objectFit: "contain",
//         boxShadow: "0 0 15px rgba(0,0,0,0.5)",
//       }}
//     />
//     <button
//       onClick={() => setShowImageModal(false)}
//       style={{
//         position: "absolute",
//         top: "15px",
//         right: "20px",
//         background: "rgba(255,255,255,0.2)",
//         color: "white",
//         border: "none",
//         borderRadius: "50%",
//         width: "35px",
//         height: "35px",
//         fontSize: "1.5rem",
//         cursor: "pointer",
//         zIndex: 10000,
//       }}
//     >
//       ×
//     </button>
//   </Modal.Body>
// </Modal>


//         <div className="text-center mt-4">
//               <button className="add-complaint-btn" onClick={() => navigate("/complaint-form")}>
//           <FaPlus className="plus-icon" /> Add Support-Request
//         </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default UserDashboard;



import React, { useState, useEffect } from "react";
import { Card, Container, Row, Col, Modal } from "react-bootstrap";
import { FaPlus, FaCalendarAlt, FaUser, FaEdit } from "react-icons/fa";
import { MdOutlineTextsms } from "react-icons/md";
import { ThumbsUp, ThumbsDown, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../Context/AuthContext";
import axios from "axios";
import { CheckCircleFill } from "react-bootstrap-icons";
import "./UserDashboard.css";
import NoImageIcon from "../images/no-img-icon.png";
import {useRef } from "react"; // 👈 add useRef here

const CATEGORIES = [
  "Infrastructure",
  "Canteen",
  "Examination",
  "Fee Payments and Accounts",
  "Boys Hostel",
  "Girls Hostel",
  "Hostel Food",
  "Extracurricular and Events",
  "Security",
  "Sports",
  "Housekeeping",
  "Audio-Visual Equipment",
  "Parking",
  "Transport",
  "Library",
  "IT and Networking",
  "Others",
];



const STATUSES = ["Pending", "Ongoing", "Resolved"];

const UserDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const userEmail = user?.email;
  const [complaints, setComplaints] = useState([]);
  const [userVotes, setUserVotes] = useState({});
  const [expandedCard, setExpandedCard] = useState(null);
  const [editComplaint, setEditComplaint] = useState(null);
  const [editForm, setEditForm] = useState({ title: "", description: "", category: "" });
  const [editImage, setEditImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [editWarning, setEditWarning] = useState("");
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalImageSrc, setModalImageSrc] = useState(null);
  const warningRef = useRef(null);
  const baseUrl = process.env.REACT_APP_COMPLAINTS_APP_BE_URL;

  const DEFAULT_IMAGE = NoImageIcon;

  useEffect(() => {
  if (editWarning && warningRef.current) {
    warningRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}, [editWarning]);

  useEffect(() => {
  if (!user?.email) return;

  const token = localStorage.getItem("authToken");

  axios
    .get(`${baseUrl}/user-api/view-complaints/${user.email}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((res) => {
      setComplaints(res.data.complaints || []);

      const votes = {};
      (res.data.complaints || []).forEach((complaint) => {
        if (Array.isArray(complaint.votedUsers)) {
          const userVote = complaint.votedUsers.find(
            (v) => v.email === user.email
          );
          if (userVote) votes[complaint.complaint_id] = userVote.vote;
        }
      });

      setUserVotes(votes);
    })
    .catch((err) => {
      console.error(err);

      // ⭐ Handle token expiry
      if (err.response && err.response.status === 401) {
        localStorage.removeItem("authToken"); // Remove invalid token
        navigate("/complaints-website");      // Redirect to login
      }
    });
}, [user]);

  const formatDate = (timestamp) => {
    if (!timestamp) return "Unknown Date";
    const date = new Date(timestamp);
    return date.toDateString();
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 1500 * 1024) {
        alert("File too large! Please upload ≤ 1.5MB.");
        return;
      }
      setEditImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleVote = async (id, type) => {
    const prevVote = userVotes[id];
    try {
      const token = localStorage.getItem("authToken");
      const url = `${baseUrl}/user-api/${type === "upvote" ? "like" : "dislike"}-complaint/${id}`;
      await axios.post(url, { email: user.email }, { headers: { Authorization: `Bearer ${token}` } });

      setUserVotes((prevVotes) => {
        if (prevVote === type) {
          const updatedVotes = { ...prevVotes };
          delete updatedVotes[id];
          return updatedVotes;
        } else {
          return { ...prevVotes, [id]: type };
        }
      });

      setComplaints((prev) =>
        prev.map((c) => {
          if (c.complaint_id !== id) return c;
          let likes = c.likes;
          let dislikes = c.dislikes;

          if (prevVote === "upvote") likes = Math.max(0, likes - 1);
          if (prevVote === "downvote") dislikes = Math.max(0, dislikes - 1);

          if (prevVote !== type) {
            if (type === "upvote") likes += 1;
            else dislikes += 1;
          }

          return { ...c, likes, dislikes };
        })
      );

      if (expandedCard?.complaint_id === id) {
        let likes = expandedCard.likes;
        let dislikes = expandedCard.dislikes;

        if (prevVote === "upvote") likes = Math.max(0, likes - 1);
        if (prevVote === "downvote") dislikes = Math.max(0, dislikes - 1);

        if (prevVote !== type) {
          if (type === "upvote") likes += 1;
          else dislikes += 1;
        }

        setExpandedCard({ ...expandedCard, likes, dislikes });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditComplaint = (complaint) => {
    setEditComplaint(complaint);
    setEditForm({
      title: complaint.title,
      description: complaint.description,
      category: complaint.category,
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const removeEditImage = () => {
    setEditImage(null);
    setImagePreview(null);
    setEditComplaint((prev) => ({ ...prev, image: null }));
  };

  const submitEditComplaint = async () => {
    try {
      const title = editForm.title.trim();
      const description = editForm.description.trim();
      if (!title || !description) {
        setEditWarning("⚠ Title and description cannot be empty.");
        if (warningRef.current) {
        warningRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      }
        return;
      }

      const token = localStorage.getItem("authToken");
      let imageUrl = editComplaint.image;

      if (editImage) {
        const imgData = new FormData();
        imgData.append("file", editImage);
        imgData.append("upload_preset", "complaint_uploads");
        const uploadRes = await axios.post(
          "https://api.cloudinary.com/v1_1/dbsrpikci/image/upload",
          imgData
        );
        imageUrl = uploadRes.data.secure_url;
      }

      const updatedData = { ...editForm, image: imageUrl };

      await axios.put(`${baseUrl}/user-api/edit-complaint/${editComplaint.complaint_id}`, updatedData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setComplaints((prev) =>
        prev.map((c) => (c.complaint_id === editComplaint.complaint_id ? { ...c, ...updatedData } : c))
      );

      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 3000);

      setEditComplaint(null);
      setEditImage(null);
      setImagePreview(null);
      setEditWarning("");
    } catch (err) {
      setEditWarning(err.response?.data?.message || "Error saving complaint");
    }
  };

  const handleDeleteComplaint = async (id) => {
    if (!window.confirm("Are you sure you want to delete this complaint?")) return;
    try {
      const token = localStorage.getItem("authToken");
      await axios.delete(`${baseUrl}/user-api/delete-complaint/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setComplaints((prev) => prev.filter((c) => c.complaint_id !== id));
      setShowDeleteSuccess(true);
      setTimeout(() => setShowDeleteSuccess(false), 3000);
      if (expandedCard?.complaint_id === id) setExpandedCard(null);
      if (editComplaint?.complaint_id === id) setEditComplaint(null);
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Pending":
        return <span className="status-pill status-pending">Pending</span>;
      case "Ongoing":
        return <span className="status-pill status-ongoing">Ongoing</span>;
      case "Resolved":
        return <span className="status-pill status-resolved">Resolved</span>;
      default:
        return null;
    }
  };

  return (
    <div className="user-dashboard-container">
      <div className="dashboard-container">
        <div className="page-heading text-center mb-4">
          <h1>VNRVJIET Support-Request Portal</h1>
          <p>Welcome to the platform where your voice matters!</p>
        </div>

        <div className="user-info d-flex align-items-center mb-4">
          <div className="user-avatar me-3">
            <img src={user?.picture} alt="Profile" className="rounded-circle" width={80} height={80} />
          </div>
          <div className="user-details">
            <h2>Welcome, {user?.name || "User"}</h2>
            <p><strong>Email:</strong> {userEmail}</p>
          </div>
        </div>

        <div className="my-complaints-heading mb-3">
          <h3>My Support-Requests</h3>
        </div>

        <Container className="mt-5 home-container mb-2">
          <Row className="gx-4 gy-4">
            {complaints.length === 0 ? (
              <div className="no-complaints-container">
                <h4 className="no-complaints-title">You haven't raised any complaints yet.</h4>
                <p className="no-complaints-sub">Have a concern? Speak up and let your voice be heard!</p>
                <button className="raise-btn" onClick={() => navigate("/complaint-form")}>+ Raise Issue</button>
              </div>
            ) : (
              complaints.map((complaint) => (
                <Col key={complaint.complaint_id} lg={4} md={6} sm={12}>
                  <Card className="card-hover-effect p-3 glass-effect rounded-4 custom-card-container d-flex flex-column">
                    {/* Complaint Image */}
                    <div className="position-relative complaint-image-wrapper mt-3 mb-2">
                      <div
                        className="d-flex flex-column align-items-center justify-content-center"
                        style={{ height: "180px", borderRadius: "10px" }}
                      >
                        {complaint.image ? (
                          <Card.Img
                            variant="top"
                            src={complaint.image}
                            alt="Complaint"
                            style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "10px", cursor: "pointer" }}
                            onClick={() => { setModalImageSrc(complaint.image); setShowImageModal(true); }}
                          />
                        ) : (
                          <div
                            style={{
                              position: "relative",
                              width: "190px",
                              height: "190px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexDirection: "column",
                            }}
                          >
                            <img src={NoImageIcon} alt="No Image" style={{ width: "200px", height: "200px", opacity: 0.8, objectFit: "contain" }} />
                            <p style={{ position: "absolute", bottom: "15px", width: "100%", textAlign: "center", fontSize: "1rem", color: "#6c757d", fontWeight: 600, margin: 0 }}>No Image</p>
                          </div>
                        )}
                      </div>
                      <div className="status-overlay position-absolute" style={{ top: "8px", left: "8px", zIndex: 3 }}>
                        {getStatusBadge(complaint.status)}
                      </div>
                    </div>

                    <div className="d-flex align-items-center justify-content-between" style={{ marginTop: "5px", marginBottom: "5px" }}>
                      <div className="d-flex align-items-center text-primary fw-semibold" style={{ fontSize: "0.9rem", marginBottom: 0 }}>
                        <span style={{ backgroundColor: "#e0f0ff", color: "#1e90ff", padding: "6px", borderRadius: "10px", display: "inline-flex", alignItems: "center", justifyContent: "center", width: "28px", height: "28px", marginRight: "8px" }}>
                          <FaCalendarAlt style={{ fontSize: "14px" }} />
                        </span>
                        {formatDate(complaint.timestamp)}
                      </div>
                      {complaint.user_id === user?.email && complaint.status === "Pending" && (
                        <FaEdit size={24} className="edit-icon-purple" style={{ cursor: "pointer" }} onClick={() => handleEditComplaint(complaint)} />
                      )}
                    </div>

                    <Card.Title className="fw-bold text-dark fs-5" style={{ marginTop: "5px", marginBottom: "8px" }}>
                      {complaint.title}
                    </Card.Title>
                    <Card.Text className="text-secondary" style={{ marginTop: 0, marginBottom: "5px", color: "#495057", fontWeight: 500 }}>
                      {complaint.description.length > 200 ? `${complaint.description.substring(0, 200)}...` : complaint.description}
                      {complaint.description.length > 200 && (
                        <span className="view-more-link ms-2" onClick={() => setExpandedCard(complaint)} style={{ color: "#007bff", cursor: "pointer", fontWeight: 500 }}>View More</span>
                      )}
                    </Card.Text>

                    {complaint.comments && complaint.comments.length > 0 && (
                      <button className="admin-update-btn" onClick={() => setExpandedCard(complaint)}>Show Admin Updates <ChevronDown size={18} /></button>
                    )}

                    {/* <div className="mt-auto d-flex w-100 align-items-center pt-2 px-0">
                      <span className="category-tag px-2 py-1 rounded-pill me-auto" style={{ fontSize: "0.8rem" }}>{complaint.category}</span>
                      <div className="d-flex align-items-center gap-3 ms-auto">
                        <button className={`btnscolor d-flex align-items-center gap-1 px-2 py-1 rounded-pill shadow-sm border-0 ${userVotes[complaint.complaint_id] === "upvote" ? "bg-success text-white" : "text-success"}`} onClick={() => handleVote(complaint.complaint_id, "upvote")} style={{ fontSize: "1rem" }}>
                          <ThumbsUp size={20} />{complaint.likes}
                        </button>
                        <button className={`btnscolor d-flex align-items-center gap-1 px-2 py-1 rounded-pill shadow-sm border-0 ${userVotes[complaint.complaint_id] === "downvote" ? "bg-danger text-white" : "text-danger"}`} onClick={() => handleVote(complaint.complaint_id, "downvote")} style={{ fontSize: "1rem" }}>
                          <ThumbsDown size={20} />{complaint.dislikes}
                        </button>
                      </div>
                    </div> */}
                    <div className="mt-auto d-flex w-100 align-items-center pt-2 px-0">
  <span className="category-tag px-2 py-1 rounded-pill me-auto" style={{ fontSize: "0.8rem" }}>
    {complaint.category}
  </span>
  <div className="d-flex align-items-center gap-3 ms-auto">
    <div className="d-flex align-items-center gap-1 text-success">
      <ThumbsUp size={20} /> <span>{complaint.likes}</span>
    </div>
    <div className="d-flex align-items-center gap-1 text-danger">
      <ThumbsDown size={20} /> <span>{complaint.dislikes}</span>
    </div>
  </div>
</div>

                  </Card>
                </Col>
              ))
            )}
          </Row>

          <button className="add-complaint-btn" onClick={() => navigate("/complaint-form")}>
            <FaPlus className="plus-icon" /> Add Support Request
          </button>
        </Container>

        {/* Expanded Card Modal */}
{/* Expanded Card Modal */}
{expandedCard && (
  <div className="overlay">
    <Card className="popup-card rounded-4 card-background-gradient p-4">
      <button className="close-btn" onClick={() => setExpandedCard(null)}>✕</button>

      {/* Status Badge */}
      <div className="mb-2">{getStatusBadge(expandedCard.status)}</div>

      {/* Date */}
      <Card.Text className="mt-1 mb-2" style={{ fontSize: "0.9rem", fontWeight: 600, color: "#1e90ff" }}>
        <span
          style={{
            backgroundColor: "#d4dbe2ff",
            color: "#1e90ff",
            padding: "6px",
            borderRadius: "10px",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "28px",
            height: "28px",
            marginRight: "8px",
          }}
        >
          <FaCalendarAlt style={{ fontSize: "14px" }} />
        </span>
        {formatDate(expandedCard.timestamp)}
      </Card.Text>

      {/* Title */}
      <Card.Title className="fw-bold text-dark mt-3 fs-4">{expandedCard.title}</Card.Title>

      {/* Description */}
      <Card.Text className="text-dark mb-3">{expandedCard.description}</Card.Text>

      {/* Admin Updates */}
      <div className="admin-updates mb-3">
        <h5 className="mb-2">
          <MdOutlineTextsms className="me-2" /> Admin Updates:
        </h5>
        {expandedCard.comments && expandedCard.comments.length > 0 ? (
          expandedCard.comments.map((comment) => (
            <div
              key={comment.id}
              className="update-entry mb-2 p-3"
              style={{ backgroundColor: "#f8f9fa", borderLeft: "4px solid purple", borderRadius: "10px" }}
            >
              <div className="d-flex align-items-center mb-1">
                <FaUser className="me-2 text-purple" size={18} />
                <strong>{comment.email}</strong>
              </div>
              <div style={{ marginLeft: "1.8rem" }}>{comment.text}</div>
            </div>
          ))
        ) : (
          <p>No admin updates available.</p>
        )}
      </div>

      {/* Footer: category + votes */}
      <div className="mt-auto d-flex w-100 align-items-center pt-2 px-0">
        <span className="category-tag px-2 py-1 rounded-pill me-auto" style={{ fontSize: "0.8rem" }}>
          {expandedCard.category}
        </span>
        <div className="d-flex align-items-center gap-3 ms-auto">
          <button
            className={`btnscolor d-flex align-items-center gap-1 px-2 py-1 rounded-pill shadow-sm border-0 ${
              userVotes[expandedCard.complaint_id] === "upvote" ? "bg-success text-white" : "text-success"
            }`}
            onClick={() => handleVote(expandedCard.complaint_id, "upvote")}
            style={{ fontSize: "1rem" }}
          >
            <ThumbsUp size={20} /> {expandedCard.likes}
          </button>
          <button
            className={`btnscolor d-flex align-items-center gap-1 px-2 py-1 rounded-pill shadow-sm border-0 ${
              userVotes[expandedCard.complaint_id] === "downvote" ? "bg-danger text-white" : "text-danger"
            }`}
            onClick={() => handleVote(expandedCard.complaint_id, "downvote")}
            style={{ fontSize: "1rem" }}
          >
            <ThumbsDown size={20} /> {expandedCard.dislikes}
          </button>
        </div>
      </div>
    </Card>
  </div>
)}


        {/* Edit Complaint Modal */}
{editComplaint && (
  <div className="overlay">
    <Card
      className="popup-card rounded-4 card-background-gradient p-3"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Close button */}
      <button className="close-btn" onClick={() => setEditComplaint(null)}>✕</button>

      {/* Header with Delete */}
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h5 className="mb-0">Edit or delete your Complaint</h5>
        <button
          className="btn btn-danger btn-icon btn-sm delete-btn"
          onClick={() => handleDeleteComplaint(editComplaint.complaint_id)}
        >
          <i className="bi bi-trash"></i>
        </button>
      </div>

      {/* Form Fields */}
      <div className="form-group mb-2">
        <label className="form-label d-flex align-items-center">
          <span className="label-icon purple me-2">
            <i className="bi bi-info-lg"></i>
          </span>
          Title
        </label>
        <input
          type="text"
          name="title"
          className="form-control"
          value={editForm.title}
          onChange={handleEditChange}
        />
      </div>

      <div className="form-group mb-2">
        <label className="form-label d-flex align-items-center">
          <span className="label-icon dark-purple me-2">
            <i className="bi bi-card-text"></i>
          </span>
          Description
        </label>
        <textarea
          name="description"
          className="form-control"
          rows={4}
          value={editForm.description}
          onChange={handleEditChange}
        />
      </div>

      <div className="form-group mb-2">
        <label className="form-label d-flex align-items-center">
          <span className="label-icon orange me-2">
            <i className="bi bi-tag"></i>
          </span>
          Category
        </label>
        <select
          name="category"
          className="form-control"
          value={editForm.category}
          onChange={handleEditChange}
          disabled
        >
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Image Upload */}
      <div className="form-group mb-2">
        <label className="form-label d-flex align-items-center">
          <span className="label-icon blue me-2">
            <i className="bi bi-image"></i>
          </span>
          Update Image (Optional)
        </label>

        <div className="upload-box-wrapper">
          <div className="upload-box">

            {imagePreview || editComplaint.image ? (
              <div className="image-preview">
                <img
                  src={imagePreview || editComplaint.image}
                  alt="Preview"
                  onClick={() => {
                    setModalImageSrc(imagePreview || editComplaint.image);
                    setShowImageModal(true);
                  }}
                  style={{
                    width: "100%",
                    borderRadius: "8px",
                    maxHeight: "250px",
                    objectFit: "cover",
                    cursor: "pointer",
                  }}
                />
                <button type="button" className="remove-btn" onClick={removeEditImage}>
                  ×
                </button>
              </div>
            ) : (
              <>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  id="edit-file-upload"
                  style={{ display: "none" }}
                />
                <label htmlFor="edit-file-upload" className="upload-placeholder">
                  <div className="upload-icon">⬆</div>
                  <span className="upload-text">Upload Image</span>
                </label>
              </>
            )}

          </div>

          <p className="file-size-note text-dark">≤ 1.5MB</p>
        </div>
      </div>

      {/* {editWarning && (
        <div
          className="alert alert-warning text-center mb-3"
          style={{ borderRadius: "10px", fontWeight: 500 }}
        >
          ⚠ {editWarning}
        </div>
      )} */}

{editWarning && (
  <div
    ref={warningRef} // 👈 add this line
    className="alert alert-warning text-center mb-3"
    style={{ borderRadius: "10px", fontWeight: 500 }}
  >
    ⚠ {editWarning}
  </div>
)}

      {/* Save Button */}
      <div className="modal-footer mt-2 text-center">
        <button className="btn btn-primary save-btn" onClick={submitEditComplaint}>
          <i className="bi bi-save me-2"></i> Save Changes
        </button>
      </div>
    </Card>
  </div>
)}

<Modal
  show={showImageModal}
  onHide={() => setShowImageModal(false)}
  centered
  size="lg"
  contentClassName="bg-dark border-0"
  style={{ zIndex: 9999 }}
  backdropClassName="custom-image-backdrop"
>
  <Modal.Body
    className="p-0 d-flex justify-content-center align-items-center"
    style={{ backgroundColor: "rgba(0,0,0,0.9)" }}
  >
    <img
      src={modalImageSrc}
      alt="Full preview"
      style={{
        width: "auto",
        maxWidth: "80%",
        height: "auto",
        maxHeight: "65vh",
        borderRadius: "10px",
        objectFit: "contain",
        boxShadow: "0 0 15px rgba(0,0,0,0.5)",
      }}
    />
    <button
      onClick={() => setShowImageModal(false)}
      style={{
        position: "absolute",
        top: "15px",
        right: "20px",
        background: "rgba(255,255,255,0.2)",
        color: "white",
        border: "none",
        borderRadius: "50%",
        width: "35px",
        height: "35px",
        fontSize: "1.5rem",
        cursor: "pointer",
        zIndex: 10000,
      }}
    >
      ×
    </button>
  </Modal.Body>
</Modal>

<Modal
  show={showDeleteSuccess}
  onHide={() => setShowDeleteSuccess(false)}
  centered
>
  <Modal.Body className="text-center p-5">
    <CheckCircleFill size={50} color="green" className="mb-3" />
    <h5 className="text-success">Complaint Deleted Successfully!</h5>
  </Modal.Body>
</Modal>

<Modal
  show={showSaveSuccess}
  onHide={() => setShowSaveSuccess(false)}
  centered
>
  <Modal.Body className="text-center p-5">
    <CheckCircleFill size={50} color="green" className="mb-3" />
    <h5 className="text-success">Complaint Saved Successfully!</h5>
  </Modal.Body>
</Modal>
      </div>
    </div>
  );
};

export default UserDashboard;
