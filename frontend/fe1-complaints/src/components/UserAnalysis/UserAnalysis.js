import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import './UserAnalysis.css';
import { CheckCircle2, Timer, AlertTriangle, Trophy, FileX2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const UserAnalysis = () => {
  const [data, setData] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('resolved');
  const [loading, setLoading] = useState(true);

  const baseUrl = process.env.REACT_APP_COMPLAINTS_APP_BE_URL;
const navigate = useNavigate();

useEffect(() => {
  const token = localStorage.getItem("authToken");
  setLoading(true);

  axios
    .get(`${baseUrl}/user-api/complaints/summary`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    .then((res) => setData(res.data))
    .catch((err) => {
      console.error("Error fetching data:", err);

      // ⭐ Check if unauthorized
      if (err.response && err.response.status === 401) {
        localStorage.removeItem("authToken"); // Remove token
        navigate("/complaints-website");      // Redirect
      }

      setData(null);
    })
    .finally(() => setLoading(false));
}, []);



  const transformedData = useMemo(() => {
    if (!data || !data.categories) return [];
    return Object.values(data.categories).map((category) => ({
      category: category.category,
      resolved: category.resolved,
      pending: category.pending,
      ongoing: category.ongoing,
      total: category.total
    }));
  }, [data]);

  

  const totalStats = useMemo(() => {
    if (!data) return { resolved: 0, pending: 0, ongoing: 0, total: 0, resolutionRate: 0 };
    const resolutionRate = data.total > 0 ? Math.round((data.resolved / data.total) * 100) : 0;
    return {
      resolved: data.resolved,
      pending: data.pending,
      ongoing: data.ongoing,
      total: data.total,
      resolutionRate
    };
  }, [data]);
  

  const sortedData = useMemo(() => {
    const filtered = selectedCategory === 'all'
      ? transformedData
      : transformedData.filter(item => item.category === selectedCategory);

    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'resolved':
          return b.resolved - a.resolved;
        case 'rate':
          return (b.resolved / b.total) - (a.resolved / a.total);
        case 'total':
          return b.total - a.total;
        default:
          return 0;
      }
    });
  }, [transformedData, selectedCategory, sortBy]);

  const topPerformer = useMemo(() => {
    if (transformedData.length === 0) return null;
    return transformedData.reduce((top, current) =>
      current.resolved > top.resolved ? current : top
    );
  }, [transformedData]);

  const getResolutionRate = (item) => {
    return item.total > 0 ? Math.round((item.resolved / item.total) * 100) : 0;
  };

  if (loading) {
    return (
      <div className="loading-state">
        <p>Loading requests...</p>
      </div>
    );
  }

  if (!data || !data.categories || Object.keys(data.categories).length === 0) {
    return (
      
      <div className="empty-state">
        <FileX2 size={48} className="empty-icon" />
        <h3>No Complaints Found</h3>
        <p>There are no requests yet.</p>
      </div>
    );
  }
  



  return (
    <div className="user-analysis-container">
      <div className="tracker-hero">
        <div className="tracker-header">
           <div className="header-inline">
    <div className="icon">📊</div>
    <h2>Requests Resolution Tracker</h2>
  </div>
          <p>
            Track the progress and effectiveness of request resolution across all categories.
            <br />
            Transparency in action.
          </p>
        </div>

        <div className="tracker-grid">
          {/* First Row */}
          <div className="tracker-row">
            <div className="tracker-card resolved">
              <div className="card-content">
                <div>
                  <p className="label">Total Resolved</p>
                  <h1>{totalStats.resolved}</h1>
                  <p className="subtext">📈 {totalStats.resolutionRate}% Resolution Rate</p>
                </div>
                <div className="card-icon">
                  <CheckCircle2 className="status-icon" size={50} />
                </div>
              </div>
            </div>

            <div className="tracker-card pending">
              <div className="card-content">
                <div>
                  <p className="label">Pending Review</p>
                  <h1>{totalStats.pending}</h1>
                  <p className="subtext">Awaiting resolution</p>
                </div>
                <div className="card-icon">
                  <Timer className="status-icon" size={50} />
                </div>
              </div>
            </div>
          </div>

          {/* Second Row */}
          <div className="tracker-row">
            <div className="tracker-card ongoing">
              <div className="card-content">
                <div>
                  <p className="label">In Progress</p>
                  <h1>{totalStats.ongoing}</h1>
                  <p className="subtext">Currently being addressed</p>
                </div>
                <div className="card-icon">
                  <AlertTriangle className="status-icon" size={50} />
                </div>
              </div>
            </div>

            <div className="tracker-card top-performer">
              <div className="card-content">
                <div>
                  <p className="label">Top Performer</p>
                  <h4>{topPerformer?.category || "-"}</h4>
                  <p className="subtext">{topPerformer?.resolved || 0} resolved</p>
                </div>
                <div className="card-icon">
                  <Trophy className="status-icon" size={50} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

  <div className="filters-container">
  <div className="filters-header">
    <div className="filters-controls">
      <div className="filter-group">
        
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="filter-select"
        >
          <option value="all">All Categories</option>
          {transformedData.map(item => (
            <option key={item.category} value={item.category}>
              {item.category}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="filter-select"
        >
          <option value="resolved">Most Resolved</option>
          <option value="rate">Resolution Rate</option>
          <option value="total">Total Complaints</option>
        </select>
      </div>
    </div>
  </div>
</div>

      {/* 📊 Category Breakdown */}
  
  <div className="categories-grid">
          {sortedData.map((item, index) => {
            const resolutionRate = getResolutionRate(item);
            const maxResolved = Math.max(...sortedData.map(d => d.resolved));
            const barWidth = maxResolved > 0 ? (item.resolved / maxResolved) * 100 : 0;
            
            return (
              <div key={item.category} className="category-card">
                <div className="category-header">
                  <div className="category-info">
                    <h3 className="category-title">{item.category}</h3>
                    <div className="category-badges">
                      {index < 3 && sortBy === 'resolved' && (
                        <span className="rank-badge">
                          #{index + 1}
                        </span>
                      )}
                      <span className={`resolution-badge ${
                        resolutionRate >= 80 
                          ? 'resolution-badge-high' 
                          : resolutionRate >= 60 
                          ? 'resolution-badge-medium'
                          : 'resolution-badge-low'
                      }`}>
                        {resolutionRate}% resolved
                      </span>
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="progress-section">
                  <div className="progress-header">
                    <span className="progress-label">Resolution Progress</span>
                    <span className="progress-count">{item.resolved}/{item.total}</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${resolutionRate}%` }}
                    ></div>
                  </div>
                </div>

                {/* Stats */}
                <div className="category-stats">
                  <div className="stat-item">
                    <p className="stat-number stat-number-green">{item.resolved}</p>
                    <p className="stat-text">Resolved</p>
                  </div>
                  <div className="stat-item">
                    <p className="stat-number stat-number-amber">{item.pending}</p>
                    <p className="stat-text">Pending</p>
                  </div>
                  <div className="stat-item">
                    <p className="stat-number stat-number-blue">{item.ongoing}</p>
                    <p className="stat-text">Ongoing</p>
                  </div>
                </div>

                {/* Comparison bar */}
                <div className="comparison-section">
                  <div className="comparison-header">
                    <span className="comparison-label">vs others:</span>
                    <div className="comparison-bar">
                      <div
                        className="comparison-fill"
                        style={{ width: `${barWidth}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

    </div>

  );
};

export default UserAnalysis;
