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

// // Get token from localStorage
// const token = localStorage.getItem("authToken");

// // Pass token in Authorization header
// const response = await axios.get(url, {
//   headers: {
//     Authorization: `Bearer ${token}`,
//   },
// });


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
import { FaCalendarAlt ,FaEdit } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { Card, Button, Row, Col, Form } from "react-bootstrap";
import axios from "axios";
import { useAuth } from "../../Context/AuthContext";
import { FileX } from "lucide-react";
import "./AdminPage.css";

const AdminPage = () => {
  const navigate = useNavigate();
  const { isAdmin, adminCategory } = useAuth();

  const [complaints, setComplaints] = useState([]);
  const [sortOption, setSortOption] = useState("default");
  const [statusFilter, setStatusFilter] = useState("All");
  const [expandedCardId, setExpandedCardId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const baseUrl = process.env.REACT_APP_COMPLAINTS_APP_BE_URL;
  const DEFAULT_IMAGE = "https://static.vecteezy.com/system/resources/previews/007/719/637/non_2x/no-camera-or-no-photo-allowed-sign-the-flat-icon-crossed-out-good-for-icon-sticker-message-flat-design-with-grey-color-vector.jpg";


  // Normalize admin categories into array
  const categories = Array.isArray(adminCategory)
    ? adminCategory
    : [adminCategory].filter(Boolean);

  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    if (isAdmin) {
      fetchComplaints(selectedCategory, statusFilter);
    }
  }, [isAdmin, selectedCategory, statusFilter]);

  // const fetchComplaints = async (category, status) => {
  //   setLoading(true);
  //   setError(false);

  //   try {
  //     let url = `${baseUrl}/admin-api/filter-complaints`;
  //     const params = new URLSearchParams();
  //     if (category && category !== "All") params.append("category", category);
  //     if (status && status !== "All") params.append("status", status);

  //     const token = localStorage.getItem("authToken");
  //     const response = await axios.get(`${url}?${params.toString()}`, {
  //       headers: { Authorization: `Bearer ${token}` },
  //     });

  //     const complaintsData = response?.data?.complaints ?? [];
  //     if (Array.isArray(complaintsData)) {
  //       setComplaints(complaintsData);
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



  const fetchComplaints = async (category, status) => {
  setLoading(true);
  setError(false);

//   try {
//     let url = `${baseUrl}/admin-api/filter-complaints`;
//     const params = new URLSearchParams();

//     // If specific category selected, send only that
//     if (category && category !== "All") {
//       params.append("category", category);
//     }

//     // Status filter
//     if (status && status !== "All") {
//       params.append("status", status);
//     }

//     const token = localStorage.getItem("authToken");
//     const response = await axios.get(`${url}?${params.toString()}`, {
//       headers: { Authorization: `Bearer ${token}` },
//     });

//     const complaintsData = response?.data?.complaints ?? [];
//     if (Array.isArray(complaintsData)) {
//       setComplaints(complaintsData);
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
try {
  let url = `${baseUrl}/admin-api/filter-complaints`;
  const params = new URLSearchParams();

  // Category filter
  if (category && category !== "All") {
    params.append("category", category);
  }

  // Status filter
  if (status && status !== "All") {
    params.append("status", status);
  }

  const token = localStorage.getItem("authToken");
  const response = await axios.get(`${url}?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  // ✅ Handle token expired or invalid
  if (response?.status === 401 || response?.data?.message === "Invalid or expired token") {
    localStorage.removeItem("authToken");
    alert("Session expired. Please login again.");
    navigate("/complaints-website");
    return;
  }

  const complaintsData = response?.data?.complaints ?? [];
  if (Array.isArray(complaintsData)) {
    setComplaints(complaintsData);
  } else {
    throw new Error("Invalid complaints data");
  }

} catch (err) {

  console.error("❌ Error fetching complaints:", err);

  // ✅ Also catch backend thrown 403 errors
  if (err?.response?.status === 403) {
    alert("Session expired. Please login again.");
    localStorage.removeItem("authToken");
    navigate("/complaints-website");
    return;
  }

  setError(true);
  setComplaints([]);
  
} finally {
  setLoading(false);
}
  };

  const handleSort = (option) => setSortOption(option);

  useEffect(() => {
    const sortedComplaints = [...complaints];
    switch (sortOption) {
      case "most-liked":
        sortedComplaints.sort((a, b) => b.likes - a.likes);
        break;
      case "most-disliked":
        sortedComplaints.sort((a, b) => b.dislikes - a.dislikes);
        break;
      default:
        sortedComplaints.sort(
          (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
        );
    }
    setComplaints(sortedComplaints);
  }, [sortOption]);

  const formatDate = (timestamp) =>
    timestamp ? new Date(timestamp).toDateString() : "Unknown Date";

  const toggleExpand = (id) => {
    setExpandedCardId((prevId) => (prevId === id ? null : id));
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
    <div className="container adminpage">
      <div className="text-center mt-3 mb-4">
        <p className="adminheading">
          Admin Requests Dashboard{" "}
          <sup className="text-muted">
            {categories.length > 1
              ? "Multiple Categories"
              : categories[0] || ""}
          </sup>
        </p>

        <div className="filter-controls-wrapper mt-4 d-flex align-items-center gap-3">
          {/* Category dropdown if multiple categories */}
          {/* {categories.length > 1 && (
            <Form.Select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{ maxWidth: "250px" }}
            >
              <option value="All" disabled>
                Select Category ▼
              </option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </Form.Select>
          )} */}

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





  
<Button
  variant="outline-primary"
  onClick={() => navigate("/admin-analysis")}
  className="analysis-btn d-flex align-items-center no-hover-bg"
>
  <FaSquarePollVertical size={20} color="#1e90ff" className="me-2" />
  Analysis
</Button>

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
       <Row className="g-4 pb-3">
  {complaints.map((complaint) => (
    <Col key={complaint.complaint_id} xs={12} sm={6} lg={4}>
      <Card
        className={`card-hover-effect p-3 glass-effect rounded-4 custom-card-container w-100 d-flex flex-column ${
          expandedCardId === complaint.complaint_id ? "expanded-card" : ""
        }`}
      >
        {/* Image with status overlay */}
        <div className="complaint-image-wrapper position-relative mb-3">
          <Card.Img
            variant="top"
            src={complaint.image || DEFAULT_IMAGE}
            alt="complaint"
            className="complaint-image rounded-3"
            style={{ height: "200px", objectFit: "cover", width: "100%" }}
          />
          <div
            className="status-overlay"
            style={{
              position: "absolute",
              top: "12px",
              left: "12px",
              zIndex: 3
            }}
          >
            {getStatusBadge(complaint.status)}
          </div>
        </div>

        {/* Date and Edit on the same line */}
        <div className="d-flex justify-content-between align-items-center mb-2">
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

          <Button
            className="custom-pencil-button"
            onClick={() =>
              navigate(`/complaints-details/${complaint.complaint_id}`)
            }
          >
            <FaEdit  size={28} className="edit-icon-purple" style={{ cursor: "pointer" }} />
          </Button>
        </div>

        {/* Title and Description */}
        <Card.Title className="fw-bold text-dark mt-1">
          {complaint.title}
        </Card.Title>

        <Card.Text className="text-secondary mb-2">
          {complaint.description.split(" ").length > 38 ? (
            <>
              {expandedCardId === complaint.complaint_id
                ? complaint.description
                : complaint.description
                    .split(" ")
                    .slice(0, 38)
                    .join(" ") + "..."}
              <span
                className="ms-2 text-secondary fw-semibold"
                role="button"
                onClick={() => toggleExpand(complaint.complaint_id)}
              >
                {expandedCardId === complaint.complaint_id
                  ? "View less"
                  : "View more"}
              </span>
            </>
          ) : (
            complaint.description
          )}
        </Card.Text>

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
    </div>
  );
};

export default AdminPage;

