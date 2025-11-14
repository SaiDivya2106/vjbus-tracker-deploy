// import React, { useEffect, useState } from "react";
// import axios from "axios";
// import { Bar } from "react-chartjs-2";
// import { Chart as ChartJS, BarElement, Tooltip, Legend, CategoryScale, LinearScale } from "chart.js";
// import "bootstrap/dist/css/bootstrap.min.css";
// import "./AdminAnalysis.css";
// import { useAuth } from "../../Context/AuthContext";
// import {useNavigate} from "react-router-dom"

// ChartJS.register(BarElement, Tooltip, Legend, CategoryScale, LinearScale);

// const AdminAnalysis = () => {
//   const baseUrl = process.env.REACT_APP_COMPLAINTS_APP_BE_URL;
  
//   // State to store complaint counts
//   const [complaintsData, setComplaintsData] = useState({
//     resolved: 0,
//     pending: 0,
//     ongoing: 0,
//   });

//   const { adminCategory } = useAuth(); // ✅ Get adminCategory from AuthContext
//   console.log("Admin Category:", adminCategory);

//   // Fetch complaint counts from backend
// useEffect(() => {
//   const fetchComplaintCounts = async () => {
//     if (adminCategory) {
//       try {
//         console.log("Fetching complaints for category:", adminCategory);

//         // Get token from localStorage
//         const token = localStorage.getItem("authToken");

//         // Add headers with Authorization
//         const response = await axios.get(
//           `${baseUrl}/admin-api/complaints-count/${adminCategory}`,
//           {
//             headers: {
//               Authorization: `Bearer ${token}`,
//             },
//           }
//         );

//         setComplaintsData(response.data);
//       } catch (error) {
//         console.error("Error fetching complaint counts:", error);
//       }
//     }
//   };

//   if (adminCategory) {
//     fetchComplaintCounts();
//   }
// }, [adminCategory]);


//   // Bar Chart Data
//   const barData = {
//     labels: ["Resolved", "Pending", "Ongoing"],
//     datasets: [
//       {
//         label: "Number of Complaints",
//         data: [complaintsData.resolved, complaintsData.pending, complaintsData.ongoing],
//         backgroundColor: ["#28a745", "#ffc107", "#17a2b8"],
//         borderRadius: 5,
//       },
//     ],
//   };

//   const chartOptions = {
//     maintainAspectRatio: false,
//     responsive: true,
//     scales: {
//       y: {
//         beginAtZero: true,
//         ticks: {
//           stepSize: 1, 
//           precision: 0, 
//         },
//       },
//     },
//     plugins: {
//       legend: {
//         position: "bottom",
//         labels: {
//           font: {
//             size: 14,
//           },
//         },
//       },
//     },
//   };
  

//   return (
//     <div className="statistics-page  text-center">
//       <h2 className="text-center mb-4 fw-bold">Admin Complaint Statistics 📊</h2>

//       {/* Centered Bar Chart */}
//       <div className="d-flex justify-content-center">
//         <div className="chart-card" style={{ width: "600px" }}>
//           <h5 className="chart-title">Complaints Overview</h5>
//           <div className="chart-container">
//             <Bar data={barData} options={chartOptions} />
//           </div>
//         </div>
//       </div>

//       {/* Summary Section */}
//       <div className="summary-section mt-4">
//         <h4 className="summary-title">
//           📌 Total Complaints: {complaintsData.resolved + complaintsData.pending + complaintsData.ongoing}
//         </h4>
//         <div>✅ Resolved: {complaintsData.resolved}</div>
//         <div>⚠ Pending: {complaintsData.pending}</div>
//         <div>🔄 Ongoing: {complaintsData.ongoing}</div>
//       </div>
//     </div>
//   );
// };

// export default AdminAnalysis;

// import React, { useEffect, useState } from "react";
// import axios from "axios";
// import { Bar } from "react-chartjs-2";
// import {
//   Chart as ChartJS,
//   BarElement,
//   Tooltip,
//   Legend,
//   CategoryScale,
//   LinearScale,
// } from "chart.js";
// import "bootstrap/dist/css/bootstrap.min.css";
// import "./AdminAnalysis.css";
// import { useAuth } from "../../Context/AuthContext";
// import { FaCheckCircle, FaClock, FaExclamationCircle, FaChartLine } from "react-icons/fa";

// ChartJS.register(BarElement, Tooltip, Legend, CategoryScale, LinearScale);

// const AdminAnalysis = () => {
//   const baseUrl = process.env.REACT_APP_COMPLAINTS_APP_BE_URL;

//   const [complaintsData, setComplaintsData] = useState({
//     resolved: 0,
//     pending: 0,
//     ongoing: 0,
//   });

//   const { adminCategory } = useAuth();

//   useEffect(() => {
//     const fetchComplaintCounts = async () => {
//       if (adminCategory) {
//         try {
//           const token = localStorage.getItem("authToken");
//           const response = await axios.get(
//             `${baseUrl}/admin-api/complaints-count/${adminCategory}`,
//             {
//               headers: {
//                 Authorization: `Bearer ${token}`,
//               },
//             }
//           );
//           setComplaintsData(response.data);
//         } catch (error) {
//           console.error("Error fetching complaint counts:", error);
//         }
//       }
//     };

//     if (adminCategory) {
//       fetchComplaintCounts();
//     }
//   }, [adminCategory, baseUrl]);

//   // ✅ Bar chart data with gradient
//   const barData = (canvas) => {
//     if (!canvas) {
//       return {
//         labels: ["Resolved", "Pending", "Ongoing"],
//         datasets: [
//           {
//             label: "Number of Complaints",
//             data: [
//               complaintsData.resolved || 0,
//               complaintsData.pending || 0,
//               complaintsData.ongoing || 0,
//             ],
//             backgroundColor: ["#00c853", "#ff9800", "#ff3d00"], // fallback colors
//             borderRadius: 15,
//             barThickness: 70,
//           },
//         ],
//       };
//     }

//     const ctx = canvas.getContext("2d");

//     const greenGradient = ctx.createLinearGradient(0, 0, 0, 400);
//     greenGradient.addColorStop(0, "#00e676");
//     greenGradient.addColorStop(1, "#00c853");

//     const yellowGradient = ctx.createLinearGradient(0, 0, 0, 400);
//     yellowGradient.addColorStop(0, "#ffca28");
//     yellowGradient.addColorStop(1, "#ff9800");

//     const redGradient = ctx.createLinearGradient(0, 0, 0, 400);
//     redGradient.addColorStop(0, "#ff6e40");
//     redGradient.addColorStop(1, "#ff3d00");

//     return {
//       labels: ["Resolved", "Pending", "Ongoing"],
//       datasets: [
//         {
//           label: "Number of Complaints",
//           data: [
//             complaintsData.resolved || 0,
//             complaintsData.pending || 0,
//             complaintsData.ongoing || 0,
//           ],
//           backgroundColor: [greenGradient, yellowGradient, redGradient],
//           borderRadius: 15,
//           barThickness: 70,
//         },
//       ],
//     };
//   };

//   const chartOptions = {
//     maintainAspectRatio: false,
//     responsive: true,
//     scales: {
//       x: {
//         ticks: {
//           color: "#fff",
//           font: { size: 14, weight: "bold" },
//         },
//         grid: { display: false },
//       },
//       y: {
//         beginAtZero: true,
//         ticks: { color: "#bbb" },
//         grid: { color: "rgba(255,255,255,0.1)" },
//       },
//     },
//     plugins: {
//       legend: { display: false },
//       tooltip: {
//         backgroundColor: "#222",
//         titleColor: "#fff",
//         bodyColor: "#ddd",
//       },
//     },
//   };

//   return (
//     <div className="statistics-page text-center">
//       <h2 className="text-center mb-4 fw-bold">Admin Complaint Statistics 📊</h2>

//       {/* Chart */}
//       <div className="d-flex justify-content-center">
//         <div className="chart-card">
//           <h5 className="chart-title">
//             <FaChartLine className="me-2" />
//             Performance Overview
//           </h5>
//           <p className="chart-subtitle">
//             Interactive visualization of complaint resolution metrics
//           </p>
//           <div className="chart-container">
//             <Bar data={(canvas) => barData(canvas)} options={chartOptions} />
//           </div>
//         </div>
//       </div>

//       {/* Summary Cards */}
//       <div className="summary-cards mt-5 d-flex justify-content-center gap-4 flex-wrap">
//         <div className="card-box total">
//           <FaChartLine size={55} className="card-icon" />
//           <h6 className="card-title1">TOTAL COMPLAINTS</h6>
//           <div className="card-number">
//             {complaintsData.resolved +
//               complaintsData.pending +
//               complaintsData.ongoing}
//           </div>
//         </div>

//         <div className="card-box resolved">
//           <FaCheckCircle size={55} className="card-icon" />
//           <h6 className="card-title1">RESOLVED</h6>
//           <div className="card-number">{complaintsData.resolved}</div>
//         </div>

//         <div className="card-box pending">
//           <FaClock size={55} className="card-icon" />
//           <h6 className="card-title1">PENDING</h6>
//           <div className="card-number">{complaintsData.pending}</div>
//         </div>

//         <div className="card-box ongoing">
//           <FaExclamationCircle size={55} className="card-icon" />
//           <h6 className="card-title1">ONGOING</h6>
//           <div className="card-number">{complaintsData.ongoing}</div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default AdminAnalysis;





import React, { useEffect, useState } from "react";
import axios from "axios";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
} from "chart.js";
import "bootstrap/dist/css/bootstrap.min.css";
import "./AdminAnalysis.css";
import { useAuth } from "../../Context/AuthContext";
import { FaCheckCircle, FaClock, FaExclamationCircle, FaChartLine } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

// Register ChartJS components
ChartJS.register(BarElement, Tooltip, Legend, CategoryScale, LinearScale);

const AdminAnalysis = () => {
  const baseUrl = process.env.REACT_APP_COMPLAINTS_APP_BE_URL;

  const [complaintsData, setComplaintsData] = useState({
    resolved: 0,
    pending: 0,
    ongoing: 0,
  });

  const { adminCategory } = useAuth();

  const navigate = useNavigate();

  useEffect(() => {
    const fetchComplaintCounts = async () => {
      if (adminCategory) {
        try {
          const token = localStorage.getItem("authToken");
          const response = await axios.get(
            `${baseUrl}/admin-api/complaints-count/${adminCategory}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          setComplaintsData(response.data);
        } catch (error) {
          console.error("Error fetching complaint counts:", error);
                  // ⭐ If unauthorized (token expired / invalid)
        if (error.response && error.response.status === 401) {
          localStorage.removeItem("authToken");     // Remove token
          navigate("/complaints-website");          // Redirect user
        }
        }
      }
    };

    if (adminCategory) {
      fetchComplaintCounts();
    }
  }, [adminCategory, baseUrl]);

  // ✅ Chart Data with gradients
const barData = (canvas) => {
  const ctx = canvas?.getContext("2d");

  const greenGradient = ctx
    ? ctx.createLinearGradient(0, 0, 0, 400)
    : "#00c853";
  if (ctx) {
    greenGradient.addColorStop(0, "#00e676");
    greenGradient.addColorStop(1, "#00c853");
  }

  const yellowGradient = ctx
    ? ctx.createLinearGradient(0, 0, 0, 400)
    : "#ff9800";
  if (ctx) {
    yellowGradient.addColorStop(0, "#ffca28");
    yellowGradient.addColorStop(1, "#ff9800");
  }

  const redGradient = ctx
    ? ctx.createLinearGradient(0, 0, 0, 400)
    : "#ff3d00";
  if (ctx) {
    redGradient.addColorStop(0, "#ff6e40");
    redGradient.addColorStop(1, "#ff3d00");
  }

    return {
      labels: ["Resolved", "Pending", "Ongoing"],
      datasets: [
        {
          label: "Number of Complaints",
          data: [
            complaintsData.resolved || 0,
            complaintsData.pending || 0,
            complaintsData.ongoing || 0,
          ],
          backgroundColor: [greenGradient, yellowGradient, redGradient],
          borderRadius: 15,
          barThickness: 70,
        },
      ],
    };
  };

  // ✅ Chart Options (without numbers)
  const chartOptions = {
    maintainAspectRatio: false,
    responsive: true,
    scales: {
      x: {
        ticks: {
          color: "#fff",
          font: { size: 14, weight: "bold" },
        },
        grid: { display: false },
      },
      y: {
        beginAtZero: true,
        ticks: { color: "#bbb" },
        grid: { color: "rgba(255,255,255,0.1)" },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#222",
        titleColor: "#fff",
        bodyColor: "#ddd",
      },
    },
  };

  return (
    <div className="statistics-page text-center">
      <h2 className="text-center mb-4 fw-bold">Admin Request Statistics 📊</h2>

      {/* Chart */}
      <div className="d-flex justify-content-center">
        <div className="chart-card">
          <h5 className="chart-title">
            <FaChartLine className="me-2" />
            Performance Overview
          </h5>
          <p className="chart-subtitle">
            Interactive visualization of request resolution metrics
          </p>
          <div className="chart-container">
            {/* <Bar data={(canvas) => barData(canvas)} options={chartOptions} /> */}
            <Bar data={barData()} options={chartOptions} />

          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards mt-5 d-flex justify-content-center gap-4 flex-wrap">
        <div className="card-box total">
          <FaChartLine size={55} className="card-icon" />
          <h6 className="card-title1">TOTAL REQUESTS</h6>
          <div className="card-number">
            {complaintsData.resolved +
              complaintsData.pending +
              complaintsData.ongoing}
          </div>
        </div>

        <div className="card-box resolved">
          <FaCheckCircle size={55} className="card-icon" />
          <h6 className="card-title1">RESOLVED</h6>
          <div className="card-number">{complaintsData.resolved}</div>
        </div>

        <div className="card-box pending">
          <FaClock size={55} className="card-icon" />
          <h6 className="card-title1">PENDING</h6>
          <div className="card-number">{complaintsData.pending}</div>
        </div>

        <div className="card-box ongoing">
          <FaExclamationCircle size={55} className="card-icon" />
          <h6 className="card-title1">ONGOING</h6>
          <div className="card-number">{complaintsData.ongoing}</div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalysis;
