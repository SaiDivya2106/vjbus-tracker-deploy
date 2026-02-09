import React from 'react';
import './KPIs.css';

function KPIs({ mou, canManage }) {
  // Get the actual JSON data (could be in mou.json or mou.data)
  const data = mou?.json || mou?.data || {};
  
  // Parse success_metrics string into array of KPIs
  const successMetricsText = data.success_metrics || '';
  let kpis = [];
  
  if (successMetricsText) {
    // Split by common delimiters: comma, semicolon, "and"
    kpis = successMetricsText
      .split(/[,;]|\sand\s/i)
      .map(item => item.trim())
      .filter(item => item.length > 0);
  }
  
  // Fallback to key_highlights if no success metrics
  if (kpis.length === 0) {
    kpis = data.kpis || data.key_highlights || [];
  }

  return (
    <div className="kpis-container">
      <div className="kpis-header">
        <h3>📊 Key Performance Indicators</h3>
        {canManage && (
          <p className="kpis-subtitle">Track and manage MoU performance metrics</p>
        )}
      </div>

      {kpis.length === 0 ? (
        <div className="no-kpis">
          📈 No KPIs or success metrics defined in this MoU yet.
          {canManage && <p>Success metrics can be added by editing the MoU JSON file.</p>}
        </div>
      ) : (
        <div className="kpis-list">
          {kpis.map((kpi, index) => (
            <div key={index} className="kpi-card">
              <div className="kpi-number">{index + 1}</div>
              <div className="kpi-content">
                <p className="kpi-text">{kpi}</p>
                {canManage && (
                  <div className="kpi-tracking">
                    <div className="kpi-metric-inputs">
                      <div className="metric-input-group">
                        <label>Planned:</label>
                        <input type="number" min="0" defaultValue="0" className="metric-input" />
                      </div>
                      <div className="metric-input-group">
                        <label>In Progress:</label>
                        <input type="number" min="0" defaultValue="0" className="metric-input" />
                      </div>
                      <div className="metric-input-group">
                        <label>Completed:</label>
                        <input type="number" min="0" defaultValue="0" className="metric-input" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {canManage && kpis.length > 0 && (
        <div className="kpis-footer">
          <p className="footer-note">
            💡 <strong>Note:</strong> Full KPI tracking with progress metrics, 
            deadlines, and analytics will be available in a future update.
          </p>
        </div>
      )}
    </div>
  );
}

export default KPIs;
