// import React, { useState, useEffect } from "react";
// import { LuPencil } from "react-icons/lu";
// import { FaSquarePollVertical, FaUserPen } from "react-icons/fa6";
// import { useNavigate } from "react-router-dom";
// import axios from "axios";
// import {
//   HiOutlineThumbUp,
//   HiOutlineThumbDown,
// } from "react-icons/hi";
// import {
//   FaCalendarAlt,
//   FaExclamationCircle,
// } from "react-icons/fa";
// import { Card, Button, Row, Col, Form } from "react-bootstrap";
// import { useAuth } from "../../Context/AuthContext";
// import { FileX } from "lucide-react";
// import "./AdminPage.css";


// const AdminPage = () => {
//   const navigate = useNavigate();
//   const { user, isAdmin, adminCategory } = useAuth();
//   const [complaints, setComplaints] = useState([]);
//   const [sortOption, setSortOption] = useState("default");
//   const [statusFilter, setStatusFilter] = useState("All");
//   const [expandedCardId, setExpandedCardId] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(false);


//   const [selectedCategory, setSelectedCategory] = useState(null);


//   const baseUrl = process.env.REACT_APP_COMPLAINTS_APP_BE_URL;

//   useEffect(() => {
//     if (isAdmin && adminCategory) {
//       fetchComplaints(adminCategory, statusFilter);
//     }
//   }, [isAdmin, adminCategory, statusFilter]);

// const fetchComplaints = async (category, status) => {
//   setLoading(true);
//   setError(false);

//   try {
// let url = `${baseUrl}/admin-api/filter-complaints?category=${category}`;
// if (status !== "All") {
//   url += `&status=${status}`;
// }

//     // Use withCredentials for HttpOnly cookie auth
//     const response = await axios.get(url, {
//       withCredentials: true,
//     });


//     // ✅ Always expect an array
//     const complaints = response?.data?.complaints ?? [];

//     if (Array.isArray(complaints)) {
//       setComplaints(complaints);
//     } else {
//       throw new Error("Invalid complaints data");
//     }
//   } catch (err) {
//     console.error("❌ Error fetching complaints:", err);
//     setError(true);
//     setComplaints([]);
//   } finally {
//     setLoading(false);
//   }
// };





//   const handleSort = (option) => {
//     setSortOption(option);
//   };

//   useEffect(() => {
//     let sortedComplaints = [...complaints];
//     switch (sortOption) {
//       case "most-liked":
//         sortedComplaints.sort((a, b) => b.likes - a.likes);
//         break;
//       case "most-disliked":
//         sortedComplaints.sort((a, b) => b.dislikes - a.dislikes);
//         break;
//       default:
//         sortedComplaints.sort(
//           (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
//         );
//     }
//     setComplaints(sortedComplaints);
//   }, [sortOption]);

//   const formatDate = (timestamp) => {
//     if (!timestamp) return "Unknown Date";
//     const date = new Date(timestamp);
//     return date.toDateString();
//   };

//   const toggleExpand = (id) => {
//     setExpandedCardId((prevId) => (prevId === id ? null : id));
//   };

//   const getStatusBadge = (status) => {
//     switch (status) {
//       case "Pending":
//         return <span className="status-pill status-pending">Pending</span>;
//       case "Ongoing":
//         return <span className="status-pill status-ongoing">Ongoing</span>;
//       case "Resolved":
//         return <span className="status-pill status-resolved">Resolved</span>;
//       default:
//         return null;
//     }
//   };
//   console.log("loading:", loading);
// console.log("error:", error);
// console.log("complaints:", complaints);

//   return (
//     <div className="container adminpage">
//       <div className="text-center mt-3 mb-4">
//         <p className="adminheading">
//           Admin Complaints Dashboard{" "}
//           <sup className="text-muted">({adminCategory})</sup>
//         </p>
//         <div className="filter-controls-wrapper mt-4">
//           <div className="filter-controls">
//             <Form.Select
//               className="me-3"
//               value={sortOption}
//               onChange={(e) => handleSort(e.target.value)}
//               style={{ minWidth: "165px" }}
//             >
//               <option value="default">Sortby:Latest</option>
//               <option value="most-liked">Popular</option>
//               <option value="most-disliked">Disagreed</option>
//             </Form.Select>

//             <Form.Select
//               className="me-3"
//               value={statusFilter}
//               onChange={(e) => setStatusFilter(e.target.value)}
//               style={{ maxWidth: "160px" }}
//             >
//               <option value="All">All Status</option>
//               <option value="Pending">Pending</option>
//               <option value="Ongoing">Ongoing</option>
//               <option value="Resolved">Resolved</option>
//             </Form.Select>
//           </div>
//           <Button
//             variant="outline-primary"
//             onClick={() => navigate("/admin-analysis")}
//             className="d-flex align-items-center no-hover-bg"
//           >
//             <FaSquarePollVertical size={20} color="#1e90ff" className="me-2" />
//             Analysis
//           </Button>
//         </div>
//       </div>

// {loading ? (
//   <div className="loading-wrapper">
//     <div className="spinner" />
//     <p className="text-muted mt-3">Loading complaints...</p>
//   </div>
// ) : complaints.length === 0 ? (
//   <div className="text-center text-muted mt-5 mb-5 fs-5 d-flex flex-column align-items-center">
//     <FileX size={64} className="iconn mb-3 text-secondary" />
//     <h5 className="text-dark fw-semibold">No complaints available</h5>

//     {adminCategory && statusFilter === "All" && (
//       <p className="mb-1">
//         No complaints have been submitted in the <strong>{adminCategory}</strong> category yet.
//       </p>
//     )}

//     {!adminCategory && statusFilter !== "All" && (
//       <p className="mb-1">
//         No complaints marked as <strong>{statusFilter}</strong> yet.
//       </p>
//     )}

//     {adminCategory && statusFilter !== "All" && (
//       <p className="mb-1">
//         No complaints in <strong>{adminCategory}</strong> category with <strong>{statusFilter}</strong> status.
//       </p>
//     )}

//     {!adminCategory && statusFilter === "All" && (
//       <p className="mb-1">No complaints have been submitted yet.</p>
//     )}

//     <p className="text-secondary mt-1">
//       Complaints for this {adminCategory ? `category (${adminCategory})` : ""}{" "}
//       {adminCategory && statusFilter !== "All" ? "and " : ""}
//       {statusFilter !== "All" ? `status (${statusFilter})` : ""} will appear here when submitted.
//     </p>
//   </div>




// ) : (
//   <Row className="g-4 pb-3">
//     {complaints.map((complaint) => (
//       <Col key={complaint.complaint_id} xs={12} sm={6} lg={4}>
//         <Card
//           className={`card-hover-effect p-3 glass-effect rounded-4 custom-card-container w-100 d-flex flex-column ${
//             expandedCardId === complaint.complaint_id ? "expanded-card" : ""
//           }`}
//         >
//           <div className="d-flex justify-content-between align-items-start">
//             {getStatusBadge(complaint.status)}
//             <Button
//               className="custom-pencil-button"
//               onClick={() =>
//                 navigate(`/complaints-details/${complaint.complaint_id}`)
//               }
//             >
//               <FaUserPen size={28} className="pencil-icon" />
//             </Button>
//           </div>

//           <Card.Text
//             className="mt-3 mb-0"
//             style={{
//               fontSize: "0.9rem",
//               fontWeight: "600",
//               color: "#1e90ff",
//             }}
//           >
//             <span
//               style={{
//                 backgroundColor: "#e0f0ff",
//                 color: "#1e90ff",
//                 padding: "6px",
//                 borderRadius: "10px",
//                 display: "inline-flex",
//                 alignItems: "center",
//                 justifyContent: "center",
//                 width: "28px",
//                 height: "28px",
//                 marginRight: "8px",
//               }}
//             >
//               <FaCalendarAlt style={{ fontSize: "14px" }} />
//             </span>
//             {formatDate(complaint.timestamp)}
//           </Card.Text>

//           <Card.Title className="fw-bold text-dark mt-3">
//             {complaint.title}
//           </Card.Title>

//           <Card.Text className="text-secondary mb-2">
//             {complaint.description.split(" ").length > 38 ? (
//               <>
//                 {expandedCardId === complaint.complaint_id
//                   ? complaint.description
//                   : complaint.description.split(" ").slice(0, 38).join(" ") +
//                     "..."}
//                 <span
//                   className="ms-2 text-secondary fw-semibold"
//                   role="button"
//                   onClick={() => toggleExpand(complaint.complaint_id)}
//                 >
//                   {expandedCardId === complaint.complaint_id
//                     ? "View less"
//                     : "View more"}
//                 </span>
//               </>
//             ) : (
//               complaint.description
//             )}
//           </Card.Text>

//           <div className="mt-auto d-flex justify-content-between align-items-center pt-3">
//             <div className="d-flex align-items-center gap-3">
//               <span className="text-success d-flex align-items-center">
//                 <HiOutlineThumbUp className="me-1" size={20} />
//                 {complaint.likes}
//               </span>
//               <span className="text-danger d-flex align-items-center">
//                 <HiOutlineThumbDown className="me-1" size={20} />
//                 {complaint.dislikes}
//               </span>
//             </div>
//             <span className="category-tag1">{complaint.category}</span>
//           </div>
//         </Card>
//       </Col>
//     ))}
//   </Row>
// )}

//     </div>
//   );
// };

// export default AdminPage;








import React, { useState, useEffect } from "react";
import { FaSquarePollVertical, FaUserPen } from "react-icons/fa6";
import { HiOutlineThumbUp, HiOutlineThumbDown } from "react-icons/hi";
import { FaCalendarAlt, FaEdit } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { Card, Button, Row, Col, Form, Modal, Dropdown } from "react-bootstrap";
import axios from "axios";
import { useAuth } from "../../Context/AuthContext";
import { FileX } from "lucide-react";
import "./AdminPage.css";
import NotificationBell from "../NotificationBell/NotificationBell";
import NoImageIcon from "../images/no-img-icon.png";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { io } from "socket.io-client";
import socket from "../../socket";
const AdminPage = () => {
  const navigate = useNavigate();
  const { isAdmin, adminCategory, user, isAssistant } = useAuth();
const [assistantCategories, setAssistantCategories] = useState([]);

const socket = io(process.env.REACT_APP_COMPLAINTS_APP_BE_URL);
  const [complaints, setComplaints] = useState([]);
  const [sortOption, setSortOption] = useState("default");
  const [statusFilter, setStatusFilter] = useState("All");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const baseUrl = process.env.REACT_APP_COMPLAINTS_APP_BE_URL;
  // const DEFAULT_IMAGE = "https://static.vecteezy.com/system/resources/previews/007/719/637/non_2x/no-camera-or-no-photo-allowed-sign-the-flat-icon-crossed-out-good-for-icon-sticker-message-flat-design-with-grey-color-vector.jpg";
  const DEFAULT_IMAGE = NoImageIcon;

  const [userVotes, setUserVotes] = useState({});


  const [expandedCard, setExpandedCard] = useState(null);



  const [showImageModal, setShowImageModal] = useState(false);
  const [modalImageSrc, setModalImageSrc] = useState(null);

  // Assignment State
  const [assistants, setAssistants] = useState([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedComplaintId, setSelectedComplaintId] = useState(null);
  const [selectedAssistant, setSelectedAssistant] = useState("");
  const [isReassign, setIsReassign] = useState(false);
  const [currentComplaint, setCurrentComplaint] = useState(null);

  // Workload Detail Modal State
  const [showWorkloadModal, setShowWorkloadModal] = useState(false);
  const [workloadComplaints, setWorkloadComplaints] = useState([]);
  const [workloadTitle, setWorkloadTitle] = useState("");
  const [workloadLoading, setWorkloadLoading] = useState(false);
  const [workloadCategoriesHint, setWorkloadCategoriesHint] = useState([]);

  const handleWorkloadClick = async (assistant, statusType) => {
    setWorkloadTitle(`${assistant.name || assistant.email} - ${statusType} Complaints`);
    setShowWorkloadModal(true);
    setWorkloadLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      let url = `${baseUrl}/admin-api/assistant-complaints?email=${assistant.email}`;
      if (statusType === "Pending") url += `&status=Pending`;
      else if (statusType === "Solved") url += `&status=Resolved`;
      
      const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
      let data = res.data.complaints || [];
      if (statusType === "Ongoing/Reopened") {
        data = data.filter(c => c.status === "Ongoing" || c.status === "Reopened");
      }
      
      // Calculate what other categories are taking up their time before filtering
      const categoriesPresent = [...new Set(data.map(c => c.category))].filter(Boolean);
      setWorkloadCategoriesHint(categoriesPresent.filter(cat => cat !== currentComplaint?.category));

      // Keep only current category filter correctly!
      if (currentComplaint?.category) {
        data = data.filter(c => c.category === currentComplaint.category);
      }
      setWorkloadComplaints(data);
    } catch (e) {
       console.error("Failed to fetch workload complaints:", e);
    } finally {
       setWorkloadLoading(false);
    }
  };

  const fetchAssistants = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const res = await axios.get(`${baseUrl}/admin-api/all-assistants`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Assume backend returns workload info, or default to 0
      const assistantsWithWorkload = res.data.assistants.map(ast => ({
        ...ast,
        activeComplaints: ast.activeComplaints || 0,
        pendingCount: ast.pendingCount || 0,
        ongoingCount: ast.ongoingCount || 0,
        resolvedCount: ast.resolvedCount || 0,
        reopenedCount: ast.reopenedCount || 0
      }));
      setAssistants(assistantsWithWorkload);
    } catch (error) {
      console.error("Error fetching assistants:", error);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchAssistants();
    }
  }, [isAdmin]);

const getAssistantsForCategory = (category) => {
  if (!category) return [];

  const normalizedCategory = category.trim().toLowerCase();

  return assistants.filter(ast => {
    // 1️⃣ Check ast.categories (Array)
    if (ast.categories && Array.isArray(ast.categories)) {
      return ast.categories.some(cat => cat.trim().toLowerCase() === normalizedCategory);
    }
    
    // 2️⃣ Check ast.category (String) - fallback for manual DB entries
    if (ast.category && typeof ast.category === "string") {
      return ast.category.trim().toLowerCase() === normalizedCategory;
    }

    return false;
  });
};

const handleTakeBack = async (complaintId) => {
  try {
    const token = localStorage.getItem("authToken");

await axios.put(
  `${baseUrl}/admin-api/take-back-complaint`,
  {
    complaintId,
    adminEmail: user.email
  },
  {
    headers: { Authorization: `Bearer ${token}` }
  }
);


    alert("Complaint taken back successfully. You can now resolve it.");

    fetchComplaints(selectedCategory, statusFilter);

  } catch (error) {
    console.error("Take back failed:", error);
    alert("Failed to take back complaint");
  }
};


const fetchAssistantCategories = async () => {
  try {
    const token = localStorage.getItem("authToken");

    const res = await axios.get(
      `${baseUrl}/admin-api/assistant-categories?email=${user.email.toLowerCase()}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    setAssistantCategories(res.data.categories || []);
  } catch (err) {
    console.error("Error fetching assistant categories:", err);
  }
};
useEffect(() => {
  if (isAssistant) {
    fetchAssistantCategories();
  }
}, [isAssistant]);


  const openAssignModal = (complaintId, complaint = null, reassign = false) => {
    setSelectedComplaintId(complaintId);
    setCurrentComplaint(complaint);
    setSelectedAssistant("");
    setIsReassign(reassign);
    setShowAssignModal(true);
  };

  const handleAssign = async () => {
    if (!selectedAssistant) return;
    try {
      const token = localStorage.getItem("authToken");
      // const endpoint = isReassign 
      //   ? `${baseUrl}/admin-api/reassign-complaint`
      //   : `${baseUrl}/admin-api/assign-complaint`;


      const endpoint = `${baseUrl}/admin-api/assign-complaint`;

      
      await axios.post(endpoint, {
        complaintId: selectedComplaintId,
        assistantEmail: selectedAssistant,
        adminEmail: user.email
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });




      socket.emit("complaintAssigned", {
  assistantEmail: selectedAssistant
});



      setShowAssignModal(false);
      const assistantData = assistants.find(a => a.email === selectedAssistant);
      const assistantName = assistantData?.name || selectedAssistant;
      alert(`Complaint ${isReassign ? 're' : ''}assigned to ${assistantName}`);
      fetchComplaints(selectedCategory, statusFilter); // Refresh list
    } catch (error) {
      console.error("Assignment failed:", error);
      alert(`Failed to ${isReassign ? 're' : ''}assign complaint`);
    }
  };


  const handleVote = (complaintId, voteType) => {
    setExpandedCard((prev) => {
      if (!prev || prev.complaint_id !== complaintId) return prev;

      let likes = prev.likes;
      let dislikes = prev.dislikes;

      const previousVote = userVotes[complaintId];

      // 🔁 SAME vote clicked again → REMOVE vote
      if (previousVote === voteType) {
        if (voteType === "upvote") likes -= 1;
        if (voteType === "downvote") dislikes -= 1;

        setUserVotes((prevVotes) => {
          const updated = { ...prevVotes };
          delete updated[complaintId]; // remove vote
          return updated;
        });

        return { ...prev, likes, dislikes };
      }

      // 🔄 SWITCH vote (up → down OR down → up)
      if (previousVote === "upvote" && voteType === "downvote") {
        likes -= 1;
        dislikes += 1;
      } else if (previousVote === "downvote" && voteType === "upvote") {
        dislikes -= 1;
        likes += 1;
      } else {
        // 🆕 FIRST TIME vote
        if (voteType === "upvote") likes += 1;
        if (voteType === "downvote") dislikes += 1;
      }

      setUserVotes((prevVotes) => ({
        ...prevVotes,
        [complaintId]: voteType,
      }));

      return { ...prev, likes, dislikes };
    });
  };




  // Normalize admin categories into array
const categories = isAssistant
  ? assistantCategories
  : (Array.isArray(adminCategory)
      ? adminCategory
      : [adminCategory].filter(Boolean)
    );


  const [selectedCategory, setSelectedCategory] = useState("All");
  const [assignmentFilter, setAssignmentFilter] = useState("All"); // All, Assigned, Unassigned, AssignedByMe

  useEffect(() => {
    if (isAdmin || isAssistant) { // ✅ Fetch if Admin OR Assistant
      fetchComplaints(selectedCategory, statusFilter, assignmentFilter);
    }
  }, [isAdmin, isAssistant, selectedCategory, statusFilter, assignmentFilter, sortOption]);



  // const fetchComplaints = async (category, status) => {
  //   setLoading(true);
  //   setError(false);

  //   try {
  //     let url = `${baseUrl}/admin-api/filter-complaints`;

  //     // ✅ If Assistant, use assistant-specific API
  //   if (isAssistant) {
  //   url = `${baseUrl}/admin-api/assistant-complaints?email=${user.email}`;

  //   if (category && category !== "All") {
  //   params.append("category", category);
  //   }

  //   if (status && status !== "All") {
  //     params.append("status", status);
  //   }
  //   }


  //     const params = new URLSearchParams();

  //     if (!isAssistant) {
  //       // Category filter (Admin only)
  //       if (category && category !== "All") {
  //         params.append("category", category);
  //       }
  //       // Status filter (Admin only)
  //       if (status && status !== "All") {
  //         params.append("status", status);
  //       }
  //     }

  //     const token = localStorage.getItem("authToken");

  //     // Construct final URL
  //     const finalUrl = isAssistant
  //       ? url
  //       : `${url}?${params.toString()}`;

  //     const response = await axios.get(finalUrl, {
  //       headers: { Authorization: `Bearer ${token}` },
  //     });

  //     // ✅ Handle token expired or invalid
  //     if (response?.status === 401 || response?.data?.message === "Invalid or expired token") {
  //       localStorage.removeItem("authToken");
  //       alert("Session expired. Please login again.");
  //       navigate("/complaints-website");
  //       return;
  //     }

  //     const complaintsData = response?.data?.complaints ?? [];
  //     if (Array.isArray(complaintsData)) {
  //       setComplaints(complaintsData);
  //     } else {
  //       throw new Error("Invalid complaints data");
  //     }

  //   } catch (err) {

  //     console.error("❌ Error fetching complaints:", err);

  //     // ✅ Also catch backend thrown 403 errors
  //     if (err?.response?.status === 403) {
  //       alert("Session expired. Please login again.");
  //       localStorage.removeItem("authToken");
  //       navigate("/complaints-website");
  //       return;
  //     }

  //     setError(true);
  //     setComplaints([]);

  //   } finally {
  //     setLoading(false);
  //   }
  // };


const fetchComplaints = async (category, status, assignmentStatus = "All") => {
  setLoading(true);
  setError(false);

  try {
    const token = localStorage.getItem("authToken");

    let response;

    if (isAdmin && !isAssistant) {
      // ✅ Admin ONLY (Main) View: Show all complaints for their category
      const params = new URLSearchParams();
      if (category && category !== "All") params.append("category", category);
      if (status && status !== "All") params.append("status", status);
      if (assignmentStatus && assignmentStatus !== "All") params.append("assignmentFilter", assignmentStatus);

      response = await axios.get(
        `${baseUrl}/admin-api/filter-complaints?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } else if (isAssistant) {
      // ✅ Assistant View (even if they also happen to be Admin): Show only their assigned complaints
      response = await axios.get(
        `${baseUrl}/admin-api/assistant-complaints?email=${user.email.toLowerCase()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } else {
      // Not authorized for anything
      setComplaints([]);
      setLoading(false);
      return;
    }

    let complaintsData = response?.data?.complaints ?? [];

    // ✅ Apply frontend filtering for assistants
    if (isAssistant) {
      if (category && category !== "All") {
        complaintsData = complaintsData.filter(
          (c) => c.category === category
        );
      }

      if (status && status !== "All") {
        complaintsData = complaintsData.filter(
          (c) => c.status === status
        );
      }
    }

    // ✅ Apply sorting AFTER filtering
    switch (sortOption) {
      case "most-liked":
        complaintsData.sort((a, b) => b.likes - a.likes);
        break;
      case "most-disliked":
        complaintsData.sort((a, b) => b.dislikes - a.dislikes);
        break;
      default:
        complaintsData.sort(
          (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
        );
    }

    setComplaints(complaintsData);

  } catch (err) {
    console.error("Error fetching complaints:", err);
    setError(true);
    setComplaints([]);
  } finally {
    setLoading(false);
  }
};



  const handleSort = (option) => setSortOption(option);

  // useEffect(() => {
  //   const sortedComplaints = [...complaints];
  //   switch (sortOption) {
  //     case "most-liked":
  //       sortedComplaints.sort((a, b) => b.likes - a.likes);
  //       break;
  //     case "most-disliked":
  //       sortedComplaints.sort((a, b) => b.dislikes - a.dislikes);
  //       break;
  //     default:
  //       sortedComplaints.sort(
  //         (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
  //       );
  //   }
  //   setComplaints(sortedComplaints);
  // }, [sortOption]);

  const formatDate = (timestamp) =>
    timestamp ? new Date(timestamp).toDateString() : "Unknown Date";

  const toggleExpand = (complaint) => {
    setExpandedCard(complaint);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Pending":
        return <span className="status-pill status-pending">Pending</span>;
      case "Ongoing":
        return <span className="status-pill status-ongoing">Ongoing</span>;
      case "Resolved":
        return <span className="status-pill status-resolved">✅ Resolved</span>;
      case "Reopened":
        return <span className="status-pill status-reopened">🔄 Reopened</span>;
      default:
        return null;
    }
  };

  return (
    <div className="container adminpage">
      <div className="text-center mt-3 mb-4">
        <div className="d-flex align-items-center justify-content-center gap-3 mb-3">
<p className="adminheading mb-0">
  {isAssistant ? "My Assigned Complaints" : "Admin Requests Dashboard"}

  {isAssistant && assistantCategories.length > 0 && (
    <div className="text-muted mt-1" style={{ fontSize: "1.9rem" }}>
      {assistantCategories.length > 1
        ? `Categories: ${assistantCategories.join(", ")}`
        : `My Assigned Category: ${assistantCategories[0]}`
      }
    </div>
  )}
</p>


          <NotificationBell
            baseUrl={baseUrl}
            adminCategory={adminCategory}
            user={user}
            isAssistant={isAssistant}
          />
        </div>

        <div className="filter-controls-wrapper mt-4 d-flex align-items-center gap-3">
          {/* Category dropdown if multiple categories */}

            <Form.Select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{ maxWidth: "250px" }}
            >
              <option value="All">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </Form.Select>
          


          <Form.Select
            className="me-3"
            value={sortOption}
            onChange={(e) => handleSort(e.target.value)}
            style={{ minWidth: "165px" }}
          >
            <option value="default">Sort by: Latest</option>
            <option value="most-liked">Popular</option>
            <option value="most-disliked">Disagreed</option>
          </Form.Select>


            <Form.Select
              className="me-3"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ maxWidth: "160px" }}
            >
              <option value="All">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Ongoing">Ongoing</option>
              <option value="Resolved">Resolved</option>
            </Form.Select>

          {!isAssistant && (() => {
            const getAssignmentFilterLabel = () => {
              if (assignmentFilter === "All") return "All Complaints";
              if (assignmentFilter === "Assigned") return "Assigned Complaints";
              if (assignmentFilter === "Unassigned") return "Unassigned";
              const ast = assistants.find(a => a.email === assignmentFilter);
              return ast?.name ? ast.name : assignmentFilter;
            };

            const uniqueAssistantsForMenu = (() => {
              const catsToCheck = selectedCategory !== "All" ? [selectedCategory] : categories;
              const filtered = assistants.filter(ast => 
                catsToCheck.some(cat => 
                  ast.categories?.some(c => c.toLowerCase() === cat.toLowerCase()) || 
                  ast.category?.toLowerCase() === cat.toLowerCase()
                )
              );
              const unique = [];
              const seen = new Set();
              for (const ast of filtered) {
                if (!seen.has(ast.email)) {
                  seen.add(ast.email);
                  unique.push(ast);
                }
              }
              return unique;
            })();

            return (
              <Dropdown onSelect={(e) => setAssignmentFilter(e)}>
                <Dropdown.Toggle 
                  variant="outline-secondary" 
                  className="filter-dropdown-toggle me-3 py-2 text-start"
                  style={{ minWidth: "190px", backgroundColor: "#fff", borderColor: "#cfd7ff", color: "#333", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                >
                  {getAssignmentFilterLabel()}
                </Dropdown.Toggle>

                <Dropdown.Menu className="shadow-sm border-0" style={{ borderRadius: '10px' }}>
                  <Dropdown.Item eventKey="All">All Complaints</Dropdown.Item>
                  <Dropdown.Item eventKey="Assigned">Assigned Complaints</Dropdown.Item>
                  <Dropdown.Item eventKey="Unassigned">Unassigned</Dropdown.Item>
                  
                  {uniqueAssistantsForMenu.length > 0 && (
                    <div className="nested-dropdown mt-2">
                       <Dropdown.Divider />
                       <div className="nested-dropdown-trigger px-3 py-1 text-dark d-flex justify-content-between align-items-center" style={{ cursor: 'default', fontWeight: 'bold' }}>
                         Filter by Member <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>▶</span>
                       </div>
                       <div className="nested-dropdown-menu shadow rounded border-0 bg-white">
                         {uniqueAssistantsForMenu.map(ast => (
                           <Dropdown.Item key={ast.email} eventKey={ast.email} className="py-2 px-3">
                             {ast.name ? ast.name : ast.email}
                           </Dropdown.Item>
                         ))}
                       </div>
                    </div>
                  )}
                </Dropdown.Menu>
              </Dropdown>
            );
          })()}

          {!isAssistant && (
            <Button
              variant="outline-primary"
              onClick={() => navigate("/admin-analysis")}
              className="analysis-btn d-flex align-items-center no-hover-bg"
            >
              <FaSquarePollVertical size={20} color="#1e90ff" className="me-2" />
              Analysis
            </Button>
          )}

        </div>
      </div>

      {loading ? (
        <div className="loading-wrapper">
          <div className="spinner" />
          <p className="text-muted mt-3">Loading requests...</p>
        </div>
      ) : complaints.length === 0 ? (
        <div className="text-center text-muted mt-5 mb-5 fs-5 d-flex flex-column align-items-center">
          <FileX size={64} className="iconn mb-3 text-secondary" />
          <h5 className="text-dark fw-semibold">No requests available</h5>
          {selectedCategory && statusFilter === "All" && (
            <p>
              No requests have been submitted in{" "}
              <strong>{selectedCategory}</strong> category yet.
            </p>
          )}
          {selectedCategory && statusFilter !== "All" && (
            <p>
              No requests in <strong>{selectedCategory}</strong> with{" "}
              <strong>{statusFilter}</strong> status.
            </p>
          )}
        </div>
      ) : (
        //  <Row className="g-4 pb-3">
        <Row className="gx-4 gy-4">

          {complaints.map((complaint) => (
            // <Col key={complaint.complaint_id} xs={12} sm={6} lg={4}>
            <Col sm={12} md={6} lg={4}>

              <Card
                className={`card-hover-effect p-3 glass-effect rounded-4 custom-card-container w-100 d-flex flex-column ${expandedCard === complaint.complaint_id ? "expanded-card" : ""
                  }`}
              >
                {/* STATUS (if NOT flagged) */}
                {!complaint.flagged?.isFlagged && (
                  <div className="status-overlay-admin">{getStatusBadge(complaint.status)}</div>
                )}



                {/* Image with status overlay */}
                {/* <div className="complaint-image-wrapper position-relative mb-3">
          <Card.Img
            variant="top"
            src={complaint.image || DEFAULT_IMAGE}
            alt="complaint"
            className="complaint-image rounded-3"
            style={{ height: "200px", objectFit: "cover", width: "100%" }}
          />
                  </div> */}



                {/* <div className="status-overlay">
{complaint.flagged?.isFlagged && (
  <span className="flagged-badge position-absolute" 
        style={{ top: "10px", left: "10px" }}>
    Flagged
  </span>
)}

</div> */}

                <div
                  className="d-flex align-items-center justify-content-center"
                  style={{
                    height: "180px",
                    borderRadius: "12px",
                    overflow: "hidden",
                  }}
                >
                  {complaint.image ? (
                    <Card.Img
                      src={complaint.image}
                      alt="Complaint"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        cursor: "pointer",
                      }}
                      onClick={() => {
                        setModalImageSrc(complaint.image);
                        setShowImageModal(true);
                      }}
                    />
                  ) : (
                    <div
                      className="d-flex flex-column align-items-center justify-content-center"
                      style={{
                        height: "100%",
                        width: "100%",
                      }}
                    >
                      <img
                        src={DEFAULT_IMAGE}
                        alt="No Image"
                        style={{
                          width: "190px",
                          height: "290px",
                          opacity: 0.9,
                          marginTop: "20px",
                        }}
                      />

                      <p
                        style={{
                          marginTop: "10px",
                          fontSize: "1rem",
                          color: "#626466",
                          fontWeight: "700",
                          marginTop: "-45px",
                        }}
                      >
                        No Image
                      </p>
                    </div>
                  )}
                </div>



                {/* Date and Edit on the same line */}
                <div className="d-flex justify-content-between align-items-center mb-2 mt-3">
                  <Card.Text
                    className="mb-0"
                    style={{
                      fontSize: "0.9rem",
                      fontWeight: "600",
                      color: "#1e90ff",
                    }}
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
                    {new Date(complaint.timestamp).toDateString()}
                  </Card.Text>

                  {complaint.flagged?.isFlagged && (
                    <span className="flagged-badge">Flagged</span>
                  )}
                  <Button
                    className="custom-pencil-button"
                    onClick={() =>
                      navigate(`/complaints-details/${complaint.complaint_id}`)
                    }
                  >
                    <FaEdit size={28} className="edit-icon-purple" style={{ cursor: "pointer" }} />
                  </Button>


                </div>

                {/* Title and Description */}
                <Card.Title className="fw-bold text-dark mt-1">
                  {complaint.title}
                </Card.Title>
                                <Card.Text
                  className="text-secondary mb-2"
                  style={{ marginTop: 0, maxHeight: 140, overflow: "hidden" }}
                >
                  {complaint.description.length > 200
                    ? `${complaint.description.substring(0, 200)}...`
                    : complaint.description}

                  {complaint.description.length > 200 && (
                    <span
                      className="view-more-link ms-2"
                      onClick={() => setExpandedCard(complaint)}
                      style={{
                        color: "#007bff",
                        cursor: "pointer",
                        fontWeight: 500,
                      }}
                    >
                      View More
                    </span>
                  )}
                </Card.Text>

                {/* IT summary for admin cards */}
                {(() => {
                  const cat = (complaint.category || "").toString().toLowerCase();
                  const isIt = cat.includes("it") && cat.includes("network");
                  const itLocation = complaint.it_details?.location;
                  const itConnection = complaint.it_details?.connectionType;
                  const itRoom = complaint.it_details?.room_number || complaint.room_number;
                  const itSpeed = complaint.it_details?.internet_speed || complaint.internet_speed;
                  const itDuration = complaint.it_details?.issue_duration || complaint.issue_duration;
                  const itMobile = complaint.it_details?.mobile_number || complaint.mobile_number;

                  if (isIt && (itLocation || itConnection || itRoom || itSpeed || itDuration || itMobile)) {
                    return (
                      <div className="it-summary-admin mb-2" style={{ color: "#495057", fontSize: "0.95rem" }}>
                        {itLocation && (
                          <div className="d-flex align-items-center mb-1">
                            <span style={{ marginRight: 8 }}>📍</span>
                            <small><strong>Location:</strong> {itLocation}</small>
                          </div>
                        )}
                        {itConnection && (
                          <div className="d-flex align-items-center mb-1">
                            <span style={{ marginRight: 8 }}>🔗</span>
                            <small><strong>Connection Type:</strong> {itConnection}</small>
                          </div>
                        )}
                        {itRoom && (
                          <div className="d-flex align-items-center mb-1">
                            <span style={{ marginRight: 8 }}>🏷️</span>
                            <small><strong>Room:</strong> {itRoom}</small>
                          </div>
                        )}
                        {itSpeed && (
                          <div className="d-flex align-items-center mb-1">
                            <span style={{ marginRight: 8 }}>📶</span>
                            <small><strong>Internet Speed:</strong> {itSpeed}</small>
                          </div>
                        )}
                        {itDuration && (
                          <div className="d-flex align-items-center mb-1">
                            <span style={{ marginRight: 8 }}>⏱️</span>
                            <small><strong>Duration:</strong> {itDuration}</small>
                          </div>
                        )}
                        {itMobile && (
                          <div className="d-flex align-items-center mb-1">
                            <span style={{ marginRight: 8 }}>📞</span>
                            <small><strong>Mobile:</strong> {itMobile}</small>
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                })()}



                {/* Status & Assignment Info */}
                <div className="mt-2 mb-2">
                  {/* Show who assigned it if user is Assistant */}
                  {isAssistant && complaint.assignedBy ? (
                    <small className="text-muted d-block">
                      <strong>Assigned By:</strong> {complaint.assignedBy}
                    </small>
                  ) : null}

                  {/* Show Assign Button only for Main Admins (not Assistants) */}
                  {(isAdmin && !isAssistant) && getAssistantsForCategory(complaint.category).length > 0 && (
                    complaint.assignedAssistant ? (
<div className="mt-1">
  <small className="text-muted d-block">
    <strong>Assigned to:</strong>
  </small>

  <small className="text-muted d-block">
    {complaint.assignedAssistant}
  </small>

  {complaint.status === "Pending" && (
    <div className="d-flex gap-2 mt-2">
      <Button
        variant="outline-warning"
        size="sm"
        className="reassignfun"
        onClick={(e) => {
          e.stopPropagation();
          openAssignModal(complaint.complaint_id, complaint, true);
        }}
      >
        Reassign
      </Button>

      <Button
        variant="outline-danger"
        size="sm"
        className="takebackfun"
        onClick={(e) => {
          e.stopPropagation();
          if (window.confirm("Are you sure you want to take back this complaint? You can resolve it after taking back.\n\nPress OK to continue or Cancel to abort.")) {
            handleTakeBack(complaint.complaint_id);
          }
        }}
      >
        Take Back
      </Button>
    </div>
  )}
</div>

                    ) : (
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        className="mt-1"
                        onClick={(e) => { e.stopPropagation(); openAssignModal(complaint.complaint_id, complaint, false); }}
                      >
                        {/* Assign to Assistant */}
                        Assign to Team
                      </Button>
                    )
                  )}

{complaint.assistantRemarks && (
  <div className="mt-2 px-2 py-1 rounded" style={{ backgroundColor: "#f3fdf5", borderLeft: "3px solid #28a745" }}>
    <small className="d-block text-dark" style={{ fontSize: "0.8rem", lineHeight: "1.4" }}>
      <strong className="text-success">Last Update: </strong> 
      {
        (() => {
          let remark = complaint.assistantRemarks || "";
          
          // Scrub out "by assistant" entirely wherever it might appear
          remark = remark.replace(/by assistant/gi, "").replace(/\s+/g, " ").trim();
          
          // E.g., if it became "Status updated to Ongoing by 22071a..."
          // Let's also clean up double "by by" if that happened
          remark = remark.replace(/by\s+by/gi, "by");

          return remark;
        })()
      }
      {complaint.lastUpdatedBy && !complaint.assistantRemarks.includes(complaint.lastUpdatedBy) && (
        <span className="text-muted fw-semibold ps-1">
          {`by ${complaint.lastUpdatedBy}`}
        </span>
      )}
    </small>
  </div>
)}


                </div>

                {/* Likes, Dislikes, Category */}
                <div className="mt-auto d-flex justify-content-between align-items-center pt-3">
                  <div className="d-flex align-items-center gap-3">
                    <span className="text-success d-flex align-items-center">
                      <HiOutlineThumbUp className="me-1" size={20} />
                      {complaint.likes}
                    </span>
                    <span className="text-danger d-flex align-items-center">
                      <HiOutlineThumbDown className="me-1" size={20} />
                      {complaint.dislikes}
                    </span>
                  </div>
                  <span className="category-tag1">{complaint.category}</span>
                </div>
              </Card>
            </Col>
          ))}
        </Row>

      )}



      {/* 🔥 VIEW MORE POPUP */}
      {/* 🔥 VIEW MORE POPUP */}
      {expandedCard && (
        <div className="overlay" onClick={() => setExpandedCard(null)}>
          <Card
            className="popup-card p-4 rounded-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              className="close-btn-inside-modalh"
              onClick={() => setExpandedCard(null)}
            >
              ✕
            </button>

            {/* Status */}
            <div className="mb-2">
              {getStatusBadge(expandedCard.status)}
            </div>

            {/* Date */}
            <Card.Text className="text-primary fw-semibold">
              <FaCalendarAlt className="me-2" />
              {formatDate(expandedCard.timestamp)}
            </Card.Text>

            {/* Title */}
            <Card.Title className="fs-4 fw-bold mt-3">
              {expandedCard.title}
            </Card.Title>

            {/* Description */}
            <Card.Text className="mt-3 text-secondary">
              {expandedCard.description}
            </Card.Text>

            <div className="mt-auto d-flex w-100 align-items-center pt-2 px-0">
              <span
                className="category-tag px-2 py-1 rounded-pill me-auto"
                style={{ fontSize: "0.8rem" }}
              >
                {expandedCard.category}
              </span>

              <div className="d-flex align-items-center gap-3 ms-auto">
                <button
                  className={`btnscolor d-flex align-items-center gap-1 px-2 py-1 rounded-pill shadow-sm border-0 ${userVotes[expandedCard.complaint_id] === "upvote"
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
                  className={`btnscolor d-flex align-items-center gap-1 px-2 py-1 rounded-pill shadow-sm border-0 ${userVotes[expandedCard.complaint_id] === "downvote"
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

      {/* Assignment Modal */}
      {/* <Modal show={showAssignModal} onHide={() => setShowAssignModal(false)} centered> */}
      <Modal
  show={showAssignModal}
  onHide={() => setShowAssignModal(false)}
  centered
  dialogClassName="assign-modal"
>
  <Modal.Header closeButton>
    <Modal.Title>
      {isReassign ? "Reassign Complaint" : "Assign Complaint"}
    </Modal.Title>
  </Modal.Header>

  <Modal.Body>
    <Form.Group className="assign-form-group">
      <Form.Label>Select Member</Form.Label>
      <Form.Text className="d-block text-muted mb-2 small">
        Select the member to {isReassign ? "reassign" : "assign"} this complaint to
      </Form.Text>
      
      {currentComplaint?.assignedAssistant && isReassign && (
        <div className="alert alert-info mb-3 small">
          <strong>Currently assigned to:</strong> {currentComplaint.assignedAssistant}
        </div>
      )}

      

<Form.Select 
  className="w-100"
  value={selectedAssistant}
  onChange={(e) => setSelectedAssistant(e.target.value)}
>
  <option value="" disabled>
    Select Member
  </option>

  {/* Filter by category and sort assistants by workload (lighter load first) */}
  {[...getAssistantsForCategory(currentComplaint?.category)]
    .sort((a, b) => (a.activeComplaints || 0) - (b.activeComplaints || 0))
    .map(ast => (
      // <option key={ast.email} value={ast.email}>
      //   {ast.name || ast.email} ({ast.email}) – {ast.activeComplaints || 0} active {ast.activeComplaints === 1 ? 'complaint' : 'complaints'}
      //   {(ast.activeComplaints || 0) > 10 ? ' ⚠️' : ''}
      // </option>


      <option key={ast.email} value={ast.email}>
        {ast.name && ast.name !== ast.email
          ? `${ast.name} (${ast.email})`
          : ast.email
        }
        {" – "}
        {ast.pendingCount || 0} pending, {ast.ongoingCount || 0} ongoing, {ast.resolvedCount || 0} solved
      </option>

    ))}
</Form.Select>

      {/* Show workload summary for this category */}
      {getAssistantsForCategory(currentComplaint?.category).length > 0 && (
        <div className="mt-3 p-2 bg-light rounded small">
          <strong className="d-block mb-2">📊 Workload Summary ({currentComplaint?.category}):</strong>
          <div style={{ fontSize: '0.85rem', lineHeight: '1.6' }}>
            {[...getAssistantsForCategory(currentComplaint?.category)]
              .sort((a, b) => (a.activeComplaints || 0) - (b.activeComplaints || 0))
              .map(ast => (
                <div key={ast.email} className="mb-2 p-2 border-bottom">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <strong>{ast.name || ast.email}:</strong>
                    <span className="badge bg-light text-dark" style={{ border: '1px solid #ddd' }}>
                      {ast.activeComplaints || 0} Active
                    </span>
                  </div>
                  <div className="d-flex flex-wrap gap-2 text-muted" style={{ fontSize: '0.8rem' }}>
                    <span 
                      className="badge bg-white text-warning border border-warning" 
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleWorkloadClick(ast, 'Pending')}
                    >
                      ⏳ Pending: <strong>{ast.pendingCount || 0}</strong>
                    </span>
                    <span 
                      className="badge bg-white text-primary border border-primary" 
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleWorkloadClick(ast, 'Ongoing/Reopened')}
                    >
                      🚀 Ongoing/Reopened: <strong>{(ast.ongoingCount || 0) + (ast.reopenedCount || 0)}</strong>
                    </span>
                    <span 
                      className="badge bg-white text-success border border-success" 
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleWorkloadClick(ast, 'Solved')}
                    >
                      ✅ Solved: <strong>{ast.resolvedCount || 0}</strong>
                    </span>
                  </div>
                </div>
              ))}
          </div>
          <small className="text-muted d-block mt-2">💡 Tip: Choose member with fewer active complaints for better distribution</small>
        </div>
      )}
      
      {/* Show message if no assistants for this category */}
      {getAssistantsForCategory(currentComplaint?.category).length === 0 && (
        <div className="alert alert-warning mt-3 small">
          ⚠️ No assistants assigned to the <strong>{currentComplaint?.category}</strong> category yet.
        </div>
      )}
    </Form.Group>
  </Modal.Body>

  <Modal.Footer className="assign-footer">
    <Button
      variant="secondary"
      onClick={() => setShowAssignModal(false)}
    >
      Cancel
    </Button>

    <Button
      variant="primary"
      onClick={handleAssign}
      disabled={!selectedAssistant}
    >
      {isReassign ? "Reassign Complaint" : "Assign Complaint"}
    </Button>
  </Modal.Footer>
</Modal>

<Modal show={showWorkloadModal} onHide={() => setShowWorkloadModal(false)} centered size="lg" dialogClassName="workload-modal">
  <Modal.Header closeButton className="border-bottom pb-3">
    <Modal.Title className="fw-bold text-dark w-100 text-center fs-4">{workloadTitle}</Modal.Title>
  </Modal.Header>
  <Modal.Body style={{ maxHeight: '60vh', overflowY: 'auto' }}>
    {workloadLoading ? (
      <div className="text-center py-4"><div className="spinner-border text-primary" role="status"></div></div>
    ) : workloadComplaints.length === 0 ? (
      <div className="text-center py-4">
        <p className="text-muted m-0">
          No complaints found for this status in <strong>{currentComplaint?.category}</strong>.
        </p>
        {workloadCategoriesHint.length > 0 && (
          <small className="text-muted mt-2 d-block">
            These active complaints are from: {workloadCategoriesHint.join(", ")}
          </small>
        )}
      </div>
    ) : (
      <div className="list-group border-0">
        {workloadComplaints.map(c => (
          <div 
            key={c.complaint_id} 
            className="list-group-item list-group-item-action flex-column align-items-start mb-3 p-3 shadow-sm workload-item"
            style={{ borderRadius: '12px', border: '1px solid #e0e5f0', cursor: 'pointer', transition: 'all 0.2s ease-in-out', backgroundColor: '#fff' }}
            onClick={() => {
                setShowWorkloadModal(false);
                navigate(`/complaints-details/${c.complaint_id}`);
            }}
          >
            <div className="d-flex w-100 justify-content-between mb-2">
              <h6 className="mb-0 fw-bold fs-5" style={{ color: '#0056b3' }}>{c.title}</h6>
              <small className="text-secondary fw-semibold">{new Date(c.timestamp).toLocaleDateString()}</small>
            </div>
            <p className="mb-3 text-secondary" style={{ fontSize: '0.95rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {c.description}
            </p>
            <small className="text-dark d-flex align-items-center">
              <strong>Status:</strong> <span className="ms-1 me-2 text-muted">{c.status}</span> <span className="mx-2 text-muted">|</span> 
              <strong>Complaint ID:</strong> <span className="ms-1" style={{ fontFamily: 'monospace', color: '#495057' }}>{c.complaint_id.slice(-6).toUpperCase()}</span>
            </small>
          </div>
        ))}
        {workloadCategoriesHint.length > 0 && (
          <div className="text-center mt-2 p-2 rounded" style={{ backgroundColor: '#f8f9fa', border: '1px border #e9ecef' }}>
            <small className="text-muted">
              <strong>Note:</strong> The remaining active complaints are from: <strong>{workloadCategoriesHint.join(", ")}</strong>
            </small>
          </div>
        )}
      </div>
    )}
  </Modal.Body>
  <Modal.Footer className="border-top pt-3 justify-content-center">
    <Button variant="secondary" className="px-5 py-2 rounded-pill fw-bold" onClick={() => setShowWorkloadModal(false)} style={{ backgroundColor: '#6c757d', border: 'none' }}>Close</Button>
  </Modal.Footer>
</Modal>

    </div>
  );
};

export default AdminPage;

