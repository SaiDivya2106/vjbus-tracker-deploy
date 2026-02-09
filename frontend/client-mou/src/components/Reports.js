import React from 'react';
import './Reports.css';

function Reports({ mou, canManage }) {
  if (!canManage) {
    return (
      <div className="reports-container">
        <div className="reports-header">
          <h3>📈 Reports</h3>
        </div>
        <div className="no-access">
          🔒 Reports are only accessible to Managers and MoU SPOCs.
        </div>
      </div>
    );
  }

  const mouData = mou?.json || mou?.data || {};
  const activities = 0; // TODO: Fetch from activities API
  const comments = 0; // TODO: Fetch from comments API
  
  // Handle both old format (validity_period) and new format (mou_start_date/mou_end_date)
  const validFrom = mouData.mou_start_date || mouData.validity_period?.valid_from;
  const validTo = mouData.mou_end_date || mouData.validity_period?.valid_to;
  const daysRemaining = validTo ? Math.ceil((new Date(validTo) - new Date()) / (1000 * 60 * 60 * 24)) : 0;
  const isActive = daysRemaining > 0;

  return (
    <div className="reports-container">
      <div className="reports-header">
        <h3>📈 MoU Reports & Analytics</h3>
        <p className="reports-subtitle">Comprehensive insights and performance metrics</p>
      </div>

      <div className="report-sections">
        {/* Summary Section */}
        <section className="report-section">
          <h4 className="section-title">📊 Summary Statistics</h4>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{isActive ? '✅ Active' : '❌ Expired'}</div>
              <div className="stat-label">Status</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{daysRemaining > 0 ? daysRemaining : 0}</div>
              <div className="stat-label">Days Remaining</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{activities}</div>
              <div className="stat-label">Activities</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{comments}</div>
              <div className="stat-label">Comments</div>
            </div>
          </div>
        </section>

        {/* Validity Timeline */}
        <section className="report-section">
          <h4 className="section-title">📅 Validity Timeline</h4>
          <div className="timeline-info">
            <div className="timeline-item">
              <span className="timeline-label">Start Date:</span>
              <span className="timeline-value">
                {validFrom ? new Date(validFrom).toLocaleDateString('en-US', { 
                  year: 'numeric', month: 'long', day: 'numeric' 
                }) : 'N/A'}
              </span>
            </div>
            <div className="timeline-item">
              <span className="timeline-label">End Date:</span>
              <span className="timeline-value">
                {validTo ? new Date(validTo).toLocaleDateString('en-US', { 
                  year: 'numeric', month: 'long', day: 'numeric' 
                }) : 'N/A'}
              </span>
            </div>
          </div>
        </section>

        {/* Partner Information */}
        <section className="report-section">
          <h4 className="section-title">🤝 Partner Information</h4>
          <div className="partner-details">
            <div className="detail-row">
              <span className="detail-label">Institution:</span>
              <span className="detail-value">{mouData.partner_name || mouData.partner_institution?.name || 'N/A'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Type:</span>
              <span className="detail-value">{mouData.mou_type || mouData.type_of_mou || 'N/A'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Location:</span>
              <span className="detail-value">{mouData.location || 'N/A'}</span>
            </div>
          </div>
        </section>

        {/* Success Metrics */}
        {mouData.success_metrics && (
          <section className="report-section">
            <h4 className="section-title">🎯 Success Metrics</h4>
            <div className="metrics-content">
              <p>{mouData.success_metrics}</p>
            </div>
          </section>
        )}

        {/* Coming Soon */}
        <section className="report-section coming-soon">
          <h4 className="section-title">🚀 Coming Soon</h4>
          <ul className="features-list">
            <li>📊 Activity completion charts</li>
            <li>📈 KPI progress tracking</li>
            <li>💬 Engagement analytics</li>
            <li>📥 Export reports (PDF, Excel)</li>
            <li>📅 Custom date range filters</li>
            <li>📧 Scheduled email reports</li>
          </ul>
        </section>
      </div>
    </div>
  );
}

export default Reports;
