
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  ThumbsUp,
  ThumbsDown,
  ChevronDown,
  FileX,
} from "lucide-react";
import { FaPlus, FaCalendarAlt, FaUser } from "react-icons/fa";
import { MdOutlineTextsms } from "react-icons/md";
import { Card, Container, Row, Col } from "react-bootstrap";
import axios from "axios";
import { useAuth } from "../../Context/AuthContext";
import "./Home.css";
import { FaUserPen } from "react-icons/fa";
import {  FaEdit  } from 'react-icons/fa'; // Correct icon
import { Modal } from "react-bootstrap";
import { CheckCircleFill } from "react-bootstrap-icons";
import NoImageIcon from "../images/no-img-icon.png";



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

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [userVotes, setUserVotes] = useState({});
  const [expandedCard, setExpandedCard] = useState(null);
  const [expandedDescriptions, setExpandedDescriptions] = useState({});
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [editWarning, setEditWarning] = useState(""); // Backend warning for edit complaint



  const [showImageModal, setShowImageModal] = useState(false);
const [modalImageSrc, setModalImageSrc] = useState(null);




  const baseUrl = process.env.REACT_APP_COMPLAINTS_APP_BE_URL;
const [editImage, setEditImage] = useState(null);
const [imagePreview, setImagePreview] = useState(null);
const [popupMessage, setPopupMessage] = useState("");
// --- show popup in center ---
const showPopup = (message) => {
  setPopupMessage(message);
  setTimeout(() => setPopupMessage(""), 2000); // disappears in 2 sec
};


const [editComplaint, setEditComplaint] = useState(null); // holds complaint to edit
const [editForm, setEditForm] = useState({ title: "", description: "", category: "" });
// Default image if complaint has no image
// const DEFAULT_IMAGE =
//   "https://static.vecteezy.com/system/resources/previews/007/719/637/non_2x/no-camera-or-no-photo-allowed-sign-the-flat-icon-crossed-out-good-for-icon-sticker-message-flat-design-with-grey-color-vector.jpg";
const DEFAULT_IMAGE = NoImageIcon;


  useEffect(() => {
    fetchComplaints();
  }, [categoryFilter, statusFilter]);

  const fetchComplaints = async () => {
    setLoading(true);
  //   try {
  //     const url =  `${baseUrl}/user-api/filter-complaints?category=${categoryFilter}&status=${statusFilter}`;
  //     const token = localStorage.getItem("authToken");

  //     const res = await axios.get(url, {
  //       headers: { Authorization: `Bearer ${token}` },
  //     });

  //     const data = res.data?.complaints || [];
  //     setComplaints(data);

  //     // Track votes
  //     const votes = {};
  //     data.forEach((complaint) => {
  //       if (Array.isArray(complaint.votedUsers)) {
  //         const userVote = complaint.votedUsers.find(
  //           (v) => v.email === user?.email
  //         );
  //         if (userVote) votes[complaint.complaint_id] = userVote.vote;
  //       }
  //     });
  //     setUserVotes(votes);
  //   } catch (err) {
  //     console.error("Error fetching complaints:", err);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  try {
  const url = `${baseUrl}/user-api/filter-complaints?category=${categoryFilter}&status=${statusFilter}`;
  const token = localStorage.getItem("authToken");

  const res = await axios.get(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = res.data?.complaints || [];
  setComplaints(data);

  // ✅ Now directly store userVotes
  const votes = {};
  data.forEach((complaint) => {
    if (complaint.userVote) {
      votes[complaint.complaint_id] = complaint.userVote;
    }
  });
  setUserVotes(votes);

} catch (err) {
  console.error("Error fetching complaints:", err);

  if (err.response && err.response.status === 401) {
    localStorage.removeItem("authToken");
    navigate("/complaints-website");
  }
} finally {
  setLoading(false);
}


};


  const formatDate = (timestamp) => {
    if (!timestamp) return "Unknown Date";
    const date = new Date(timestamp);
    return date.toDateString();
  };






// --- handle image change ---
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

// --- handle image removal ---
const removeEditImage = () => {
  setEditImage(null);
  setImagePreview(null);

  // ✅ Also clear any previously saved image from the complaint
  setEditComplaint((prev) => ({ ...prev, image: null }));
};


// --- update submitEditComplaint to handle Cloudinary upload if image is changed ---
// const submitEditComplaint = async () => {
//   try {
//     const token = localStorage.getItem("authToken");
//     let imageUrl = editComplaint.image; // keep old one if unchanged

//     // If new image selected, upload to Cloudinary
//     if (editImage) {
//       const imgData = new FormData();
//       imgData.append("file", editImage);
//       imgData.append("upload_preset", "complaint_uploads"); // Cloudinary preset
//       const uploadRes = await axios.post(
//         https://api.cloudinary.com/v1_1/dbsrpikci/image/upload,
//         imgData
//       );
//       imageUrl = uploadRes.data.secure_url;
//     }
//     setShowSaveSuccess(true);
//     setTimeout(() => setShowSaveSuccess(false), 3000);


//     const updatedData = { ...editForm, image: imageUrl };

//     await axios.put(
//       ${baseUrl}/user-api/edit-complaint/${editComplaint.complaint_id},
//       updatedData,
//       { headers: { Authorization: Bearer ${token} } }
//     );

//     setComplaints((prev) =>
//       prev.map((c) =>
//         c.complaint_id === editComplaint.complaint_id
//           ? { ...c, ...updatedData }
//           : c
//       )
//     );

//     setEditComplaint(null);
//     setEditImage(null);
//     setImagePreview(null);

//   } catch (err) {
//     console.error("Error editing complaint:", err);
//   }
// };
const submitEditComplaint = async () => {
  try {
    const title = editForm.title.trim();
    const description = editForm.description.trim();

    // --- Basic Empty Checks ---
    if (!title || !description) {
      setEditWarning("⚠ Title and description cannot be empty.");
      return;
    }

    // --- Smarter gibberish detection ---
    const gibberishWordPattern = /\b[b-df-hj-np-tv-z]{4,}\b/gi; // words with 4+ consonants and no vowels
    const hasGibberishWord = (text) => {
      const words = text.split(/\s+/);
      return words.some((word) => gibberishWordPattern.test(word));
    };

    if (hasGibberishWord(title) || hasGibberishWord(description)) {
      setEditWarning(
        "⚠ Please remove random or meaningless words (like 'xiugcunb', 'bcjkhl', etc.) before saving."
      );
      return;
    }

    // --- Check for too short content ---
    if (description.length < 20) {
      setEditWarning("⚠ Description must be at least 20 characters long.");
      return;
    }

    const token = localStorage.getItem("authToken");
    let imageUrl = editComplaint.image;

    // --- Upload image if changed ---
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

    await axios.put(
      `${baseUrl}/user-api/edit-complaint/${editComplaint.complaint_id}`,
      updatedData,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    setShowSaveSuccess(true);
    setTimeout(() => setShowSaveSuccess(false), 3000);

    setComplaints((prev) =>
      prev.map((c) =>
        c.complaint_id === editComplaint.complaint_id
          ? { ...c, ...updatedData }
          : c
      )
    );

    setEditComplaint(null);
    setEditImage(null);
    setImagePreview(null);
    setEditWarning("");
  } catch (err) {
    const backendMsg = err.response?.data?.message;
    if (backendMsg) {
      setEditWarning(backendMsg);
    } else {
      console.error("Error editing complaint:", err);
    }
  }
};



  const toggleDescription = (complaintId) => {
    setExpandedDescriptions((prev) => ({
      ...prev,
      [complaintId]: !prev[complaintId],
    }));
  };

  const handleVote = async (id, type) => {
    const prevVote = userVotes[id];
    try {
      const token = localStorage.getItem("authToken");
      const url = `${baseUrl}/user-api/${
        type === "upvote" ? "like" : "dislike"
      }-complaint/${id}`;
      await axios.post(
        url,
        { email: user?.email },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setUserVotes((prevVotes) => {
        if (prevVote === type) {
          const updatedVotes = { ...prevVotes };
          delete updatedVotes[id];
          return updatedVotes;
        } else {
          return { ...prevVotes, [id]: type };
        }
      });

      setComplaints((prevComplaints) =>
        prevComplaints.map((complaint) => {
          if (complaint.complaint_id !== id) return complaint;
          let likes = complaint.likes;
          let dislikes = complaint.dislikes;

          if (prevVote === "upvote") likes = Math.max(0, likes - 1);
          if (prevVote === "downvote") dislikes = Math.max(0, dislikes - 1);

          if (prevVote === type) {
            return { ...complaint, likes, dislikes };
          } else {
            if (type === "upvote") likes += 1;
            else dislikes += 1;
            return { ...complaint, likes, dislikes };
          }
        })
      );

      if (expandedCard && expandedCard.complaint_id === id) {
        let updatedLikes = expandedCard.likes;
        let updatedDislikes = expandedCard.dislikes;

        if (prevVote === "upvote") updatedLikes = Math.max(0, updatedLikes - 1);
        if (prevVote === "downvote")
          updatedDislikes = Math.max(0, updatedDislikes - 1);

        if (prevVote !== type) {
          if (type === "upvote") updatedLikes += 1;
          else updatedDislikes += 1;
        }

        setExpandedCard({
          ...expandedCard,
          likes: updatedLikes,
          dislikes: updatedDislikes,
        });
      }
    } catch (err) {
      console.error("Error updating vote:", err);
    }
  };

  // const handleEditComplaint = (complaint) => {
  //   navigate(/edit-complaint/${complaint.complaint_id}, {
  //     state: { complaint },
  //   });
  // };

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



// const submitEditComplaint = async () => {
//     try {
//       const token = localStorage.getItem("authToken");
//       await axios.put(
//         ${baseUrl}/user-api/edit-complaint/${editComplaint.complaint_id},
//         editForm,
//         { headers: { Authorization: Bearer ${token} } }
//       );

//       setComplaints((prev) =>
//         prev.map((c) =>
//           c.complaint_id === editComplaint.complaint_id
//             ? { ...c, ...editForm }
//             : c
//         )
//       );

//       setEditComplaint(null);
//     } catch (err) {
//       console.error("Error editing complaint:", err);
//     }
//   };

const handleDeleteComplaint = async (id) => {
  if (!window.confirm("Are you sure you want to delete this complaint?")) return;

  try {
    const token = localStorage.getItem("authToken");
    const response = await axios.delete(`${baseUrl}/user-api/delete-complaint/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 200) {
      // Show success modal
      setShowDeleteSuccess(true);
      setTimeout(() => setShowDeleteSuccess(false), 3000);

      // Remove deleted complaint from list
      setComplaints((prev) => prev.filter((c) => c.complaint_id !== id));

      // Close expanded card if it was open for this complaint
      if (expandedCard?.complaint_id === id) {
        setExpandedCard(null);
      }

      // Close edit popup if open for the same complaint
      if (editComplaint?.complaint_id === id) {
        setEditComplaint(null);
      }
    } else {
      console.error("Failed to delete complaint");
    }
  } catch (err) {
    console.error("Error deleting complaint:", err.response?.data || err.message);
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
      case "Reopened":
        return <span className="status-pill status-reopened">🔄 Reopened</span>;
      default:
        return null;
    }
  };

  const filteredComplaints = complaints.filter((complaint) => {
  // ❌ Exclude flagged complaints
  const isFlagged =
    complaint.flagged === true ||
    complaint.flagged?.isFlagged === true;

  if (isFlagged) return false;

  // Text search
  const matchesSearch =
    complaint.title.toLowerCase().includes(search.toLowerCase()) ||
    complaint.description.toLowerCase().includes(search.toLowerCase());

  // Category
  const matchesCategory = categoryFilter
    ? complaint.category === categoryFilter
    : true;

  // Status
  const matchesStatus = statusFilter
    ? complaint.status === statusFilter
    : true;

  return matchesSearch && matchesCategory && matchesStatus;
});


 return (
    <Container className="mt-5 home-container mb-2">
      {popupMessage && (
  <div
    style={{
      position: "fixed",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      background: "rgba(0,0,0,0.8)",
      color: "#fff",
      padding: "15px 25px",
      borderRadius: "10px",
      fontSize: "1.1rem",
      zIndex: 2000,
      textAlign: "center",
    }}
  >
    {popupMessage}
  </div>
)}

      {/* Filters + Search */}
      <div className="container mt-4 mb-4">
        <div className="d-flex flex-wrap justify-content-center gap-3">
          <div className="search-container">
            <Search className="search-icon" size={20} />
            <input
              type="text"
              placeholder="Search complaints..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="filter-select category-select"
          >
            <option value="">Categories</option>
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">All Status</option>
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading-wrapper">
          <div className="spinner" />
        </div>
      ) : filteredComplaints.length === 0 ? (
        <div className="text-center text-muted mt-5 mb-5 fs-5 d-flex flex-column align-items-center">
          <FileX size={64} className="iconn mb-3 text-secondary" />
          <h5 className="text-dark fw-semibold">No requests available</h5>
        </div>
      ) : (
        <div className={expandedCard ? "blurred-background" : ""}>
         <Row className="gx-4 gy-4">
  {filteredComplaints.map((complaint) => (
    <Col key={complaint.complaint_id} lg={4} md={6} sm={12}>
      <Card className="card-hover-effect p-3 glass-effect rounded-4 custom-card-container w-100 d-flex flex-column">

        {/* Image with status badge overlay */}
        <div className="position-relative complaint-image-wrapper mt-3 mb-2">
          {/* <Card.Img
            variant="top"
            src={complaint.image || DEFAULT_IMAGE}
            alt="complaint"
            className="complaint-image"
            style={{ cursor: "pointer" }}
            onClick={() => {
              if (complaint.image) {
                setModalImageSrc(complaint.image);
                setShowImageModal(true);
              }
            }}
          /> */}



          <div
  className="d-flex flex-column align-items-center justify-content-center"
  style={{
    height: "180px",
    // backgroundColor: "#f8f9fa",  light gray background like in your screenshot
    borderRadius: "10px",
  }}
>
  {complaint.image ? (
    <Card.Img
      variant="top"
      src={complaint.image}
      alt="Complaint"
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
        borderRadius: "10px",
        cursor: "pointer",
      }}
      onClick={() => {
        setModalImageSrc(complaint.image);
        setShowImageModal(true);
      }}
    />
  ) : (
    <>
<div style={{ position: "relative", textAlign: "center" }}>
  <Card.Img
    variant="top"
    src={complaint.image || DEFAULT_IMAGE}
    alt="complaint"
    className="complaint-image"
    onClick={() => {
      if (complaint.image) {
        setModalImageSrc(complaint.image);
        setShowImageModal(true);
      }
    }}
    style={{
      cursor: complaint.image ? "pointer" : "default",
      width: complaint.image ? "100%" : "250px", // smaller for default image
      height: complaint.image ? "auto" : "250px",
      display: "block",
      margin: complaint.image ? "0 auto" : "20px auto 0 auto", // moves default image up
      opacity: complaint.image ? 1 : 0.95,
    }}
  />

    <p
    style={{
      position: "absolute",
      bottom: "35px", // locks text below icon regardless of icon size
      width: "100%",
      textAlign: "center",
      fontSize: "1rem",
      color: "#6c757d",
      fontWeight: "bold",
      margin: 0,
    }}
  >
    No Image
  </p>
  {/* <p
    style={{
      position: "absolute",
      bottom: "15px", // locks text below icon regardless of icon size
      width: "100%",
      textAlign: "center",
      fontSize: "1rem",
      color: "#6c757d",
      fontWeight: "semi-bold",
      margin: 0,
    }}
  >
    No Image
  </p> */}
</div>

    </>
  )}
</div>

          <div
            className="status-overlay position-absolute"
            style={{ top: "8px", left: "8px", zIndex: 3 }}
          >
            {getStatusBadge(complaint.status)}
          </div>
        </div>
{/* Date + Edit row below image */}
<div
  className="d-flex align-items-center justify-content-between"
  style={{ marginTop: "5px", marginBottom: "5px" }} // reduced gap
>
  {/* Date on the left */}
  <div
    className="d-flex align-items-center text-primary fw-semibold"
    style={{ fontSize: "0.9rem", marginBottom: 0 }}
  >
    <span
      style={{
        backgroundColor: "#e0f0ff",
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
    {formatDate(complaint.timestamp)}
  </div>

  {/* Edit icon (optional) */}
</div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <Card.Title
            className="fw-bold text-dark fs-5"
            style={{ marginTop: "5px", marginBottom: "5px" }} // reduced gap
          >
            {complaint.title}
          </Card.Title>

          {/* Show IT-specific summary when category is IT and Networking */}
          {(() => {
            const cat = (complaint.category || "").toString().toLowerCase();
            const isIt = cat.includes("it") && cat.includes("network");
            const itRoom = complaint.it_details?.room_number || complaint.room_number;
            const itSpeed = complaint.it_details?.internet_speed || complaint.internet_speed;
            const itDuration = complaint.it_details?.issue_duration || complaint.issue_duration;

            if (isIt && (itRoom || itSpeed || itDuration)) {
              return (
                <div className="it-summary mb-2" style={{ color: "#495057", fontSize: "0.95rem" }}>
                  {itRoom && <div><strong>Room:</strong> <span style={{ marginLeft: 6 }}>{itRoom}</span></div>}
                  {itSpeed && <div><strong>Internet Speed:</strong> <span style={{ marginLeft: 6 }}>{itSpeed}</span></div>}
                  {itDuration && <div><strong>Duration:</strong> <span style={{ marginLeft: 6 }}>{itDuration}</span></div>}
                </div>
              );
            }
            return null;
          })()}

          <Card.Text className="text-secondary mb-2" style={{ marginTop: 0, maxHeight: 140, overflow: "hidden" }}>
  {expandedDescriptions[complaint.complaint_id]
    ? complaint.description
    : `${complaint.description.substring(0, 200)}${
        complaint.description.length > 200 ? "..." : ""
      }`}
  {complaint.description.length > 200 && (
    <span
      className="view-more-link ms-2"
      onClick={() => setExpandedCard(complaint)} // open popup
      style={{ color: "#007bff", cursor: "pointer", fontWeight: 500 }}
    >
      View More
    </span>
  )}
</Card.Text>



                  {complaint.comments && complaint.comments.length > 0 && (
                    <button
                      className="admin-update-btn"
                      onClick={() => setExpandedCard(complaint)}
                    >
                      Show Admin Updates <ChevronDown size={18} />
                    </button>
                  )}

                  {/* Footer: category + edit/delete + votes */}
                  <div className="mt-auto d-flex w-100 align-items-center pt-2 px-0">
                    <span
                      className="category-tag px-2 py-1 rounded-pill me-auto"
                      style={{ fontSize: "0.8rem" }}
                    >
                      {complaint.category}
                    </span>



                    <div className="d-flex align-items-center gap-3 ms-auto">
                      <button
                        className={`btnscolor d-flex align-items-center gap-1 px-2 py-1 rounded-pill shadow-sm border-0 ${
                          userVotes[complaint.complaint_id] === "upvote"
                            ? "bg-success text-white"
                            : "text-success"
                        }`}
                        onClick={() =>
                          handleVote(complaint.complaint_id, "upvote")
                        }
                        style={{ fontSize: "1rem" }}
                      >
                        <ThumbsUp size={20} />
                        {complaint.likes}
                      </button>

                      <button
                        className={`btnscolor d-flex align-items-center gap-1 px-2 py-1 rounded-pill shadow-sm border-0 ${
                          userVotes[complaint.complaint_id] === "downvote"
                            ? "bg-danger text-white"
                            : "text-danger"
                        }`}
                        onClick={() =>
                          handleVote(complaint.complaint_id, "downvote")
                        }
                        style={{ fontSize: "1rem" }}
                      >
                        <ThumbsDown size={20} />
                        {complaint.dislikes}
                      </button>
                    </div>
                  </div>
          </div>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      )}


      {/* Floating expanded card for Admin Updates */}
{expandedCard && (
  <div className="overlay">
    <Card
      className="popup-card rounded-4 card-background-gradient p-4"
      onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
    >
      {/* Close button */}
      <button
        className="close-btn"
        onClick={() => setExpandedCard(null)} // ✅ only close on this button
      >
        ✕
      </button>

      {/* Status badge */}
      <div className="mb-2">{getStatusBadge(expandedCard.status)}</div>

      {/* Date */}
      <Card.Text
        className="mt-1 mb-2"
        style={{
          fontSize: "0.9rem",
          fontWeight: "600",
          color: "#1e90ff",
        }}
      >
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

      {/* Title & Description */}
      <Card.Title className="fw-bold text-dark mt-3 fs-4">
        {expandedCard.title}
      </Card.Title>
      {/* Show IT details in expanded popup */}
      {(() => {
        const cat = (expandedCard.category || "").toString().toLowerCase();
        const isIt = cat.includes("it") && cat.includes("network");
        const itRoom = expandedCard.it_details?.room_number || expandedCard.room_number;
        const itSpeed = expandedCard.it_details?.internet_speed || expandedCard.internet_speed;
        const itDuration = expandedCard.it_details?.issue_duration || expandedCard.issue_duration;
        const itMobile = expandedCard.it_details?.mobile_number || expandedCard.mobile_number;

        if (isIt && (itRoom || itSpeed || itDuration || itMobile)) {
          return (
            <div className="it-details-inline mb-3" style={{ color: "#333" }}>
              {itRoom && (
                <div className="d-flex align-items-center mb-1">
                  <span className="me-2" style={{ color: "#6c757d" }}>🏷️</span>
                  <small style={{ color: "#555" }}><strong>Room:</strong> {itRoom}</small>
                </div>
              )}
              {itSpeed && (
                <div className="d-flex align-items-center mb-1">
                  <span className="me-2" style={{ color: "#6c757d" }}>📶</span>
                  <small style={{ color: "#555" }}><strong>Internet Speed:</strong> {itSpeed}</small>
                </div>
              )}
              {itDuration && (
                <div className="d-flex align-items-center mb-1">
                  <span className="me-2" style={{ color: "#6c757d" }}>⏱️</span>
                  <small style={{ color: "#555" }}><strong>Duration:</strong> {itDuration}</small>
                </div>
              )}
              {itMobile && (
                <div className="d-flex align-items-center mb-1">
                  <span className="me-2" style={{ color: "#6c757d" }}>📞</span>
                  <small style={{ color: "#555" }}><strong>Mobile:</strong> {itMobile}</small>
                </div>
              )}
            </div>
          );
        }
        return null;
      })()}

      <Card.Text className="text-dark mb-3">{expandedCard.description}</Card.Text>

      {/* Admin Comments */}
<div className="admin-updates mb-3">
  <h5 className="mb-2">
    <MdOutlineTextsms className="me-2" /> Admin Updates:
  </h5>

  {expandedCard.comments && expandedCard.comments.length > 0 ? (
    expandedCard.comments.map((comment) => {
      const isStudent = comment.role === "student";
      const displayName = isStudent ? "Student" : (comment.email || "Admin");
      const borderColor = isStudent ? "#ff6b6b" : "purple";
      return (
        <div
          key={comment.id}
          className="update-entry mb-2 p-3"
          style={{
            backgroundColor: "#f8f9fa",
            borderLeft: `4px solid ${borderColor}`,
            borderRadius: "10px",
          }}
        >
          <div className="d-flex align-items-center mb-1">
            <FaUser className="me-2" size={18} style={{ color: borderColor }} />
            <strong style={{ color: borderColor }}>{displayName}</strong>
          </div>
          <div style={{ marginLeft: "1.8rem" }}>{comment.text}</div>
        </div>
      );
    })
  ) : (
    <p className="text-muted" style={{ marginLeft: "1.8rem" }}>
      No admin updates yet.
    </p>
  )}
</div>


      {/* Footer: category + votes */}
      <div className="mt-auto d-flex w-100 align-items-center pt-2 px-0">
        <span
          className="category-tag px-2 py-1 rounded-pill me-auto"
          style={{ fontSize: "0.8rem" }}
        >
          {expandedCard.category}
        </span>

        <div className="d-flex align-items-center gap-3 ms-auto">
          <button
            className={`btnscolor d-flex align-items-center gap-1 px-2 py-1 rounded-pill shadow-sm border-0 ${
              userVotes[expandedCard.complaint_id] === "upvote"
                ? "bg-success text-white"
                : "text-success"
            }`}
            onClick={() => handleVote(expandedCard.complaint_id, "upvote")}
            style={{ fontSize: "1rem" }}
          >
            <ThumbsUp size={20} />
            {expandedCard.likes}
          </button>

          <button
            className={`btnscolor d-flex align-items-center gap-1 px-2 py-1 rounded-pill shadow-sm border-0 ${
              userVotes[expandedCard.complaint_id] === "downvote"
                ? "bg-danger text-white"
                : "text-danger"
            }`}
            onClick={() => handleVote(expandedCard.complaint_id, "downvote")}
            style={{ fontSize: "1rem" }}
          >
            <ThumbsDown size={20} />
            {expandedCard.dislikes}
          </button>
        </div>
      </div>
    </Card>
  </div>
)}



{/* 🔍 Shared Image Preview Modal */}
{/* Image Preview Modal */}
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
    style={{ backgroundColor: "rgba(0,0,0,0.95)" }}
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



      {/* Add Complaint Button */}
      <button
        className="add-complaint-btn"
        onClick={() => navigate("/complaint-form")}
      >
        <FaPlus className="plus-icon" /> Add Support Request
      </button>


      
      <div
        className="feedback-button"
        onClick={() =>
          window.open(
            "https://docs.google.com/forms/d/e/1FAIpQLSdpEmSGlS8hwIR58A3zW9vm9kTVBuhiONbA6zDjAixeMfELnw/viewform?usp=header",
            "_blank"
          )
        }
      >
        <MdOutlineTextsms size={20} />
        <span>Feedback</span>
      </div>

      <div style={{ height: "40px" }}></div>
    </Container>
  );
};

export default Home;