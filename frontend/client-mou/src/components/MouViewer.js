import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import './MouViewer.css';
import Activities from './Activities';
import { canManageActivities as canManageActivitiesUtil, ROLES } from '../utils/roleUtils';
import Community from './Community';
import KPIs from './KPIs';
import Reports from './Reports';

function MouViewer({ mou, onBack, onEdit, userEmail, usersData, userRole, initialTab }) {
  const [activeTab, setActiveTab] = useState(initialTab || 'details');
    const canManageActivities = canManageActivitiesUtil(userEmail, mou.prefix, usersData);
  const [activeView, setActiveView] = useState(
    mou.json ? 'json' : (mou.md ? 'md' : (mou.pdfUrl ? 'pdf' : 'json'))
  );

  // Set initial tab on mou change or when initialTab provided
  React.useEffect(() => {
    setActiveTab(initialTab || 'details');
  }, [initialTab, mou.prefix]);

  // Helper to format field names
  const formatFieldName = (key) => {
    return key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  // Helper to check if value is empty
  const isEmptyValue = (value) => {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string' && value.trim() === '') return true;
    if (Array.isArray(value) && value.length === 0) return true;
    if (typeof value === 'object' && Object.keys(value).length === 0) return true;
    return false;
  };

  // Helper to render any value
  const renderValue = (value, key = '') => {
    if (isEmptyValue(value)) return null;
    
    if (typeof value === 'boolean') {
      return (
        <span className={`status ${value ? 'active' : 'inactive'}`}>
          {value ? '✓ Yes' : '✗ No'}
        </span>
      );
    }
    
    if (typeof value === 'string' || typeof value === 'number') {
      // Special formatting ONLY for success_metrics field
      if (key === 'success_metrics') {
        const text = String(value);
        // Split by common delimiters: comma, semicolon, period followed by space
        const items = text.split(/[,;]|\.(?=\s)/).map(s => s.trim()).filter(s => s.length > 0);
        
        if (items.length > 1) {
          return (
            <ul className="metrics-list">
              {items.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          );
        }
      }
      return <span>{String(value)}</span>;
    }
    
    if (Array.isArray(value)) {
      if (value.length === 0) return null;
      
      // If array of strings/numbers, render as tags or list
      if (value.every(v => typeof v === 'string' || typeof v === 'number')) {
        // Use tags for shorter items, list for longer ones
        const useList = value.some(v => String(v).length > 50);
        
        if (useList) {
          return (
            <ul>
              {value.map((item, idx) => (
                <li key={idx}>{String(item)}</li>
              ))}
            </ul>
          );
        } else {
          return (
            <div className="tags">
              {value.map((item, idx) => (
                <span key={idx} className="tag tag-general">{String(item)}</span>
              ))}
            </div>
          );
        }
      }
      
      // Array of objects - render as nested sections
      return (
        <div className="nested-array">
          {value.map((item, idx) => (
            <div key={idx} className="nested-item">
              {renderValue(item, key)}
            </div>
          ))}
        </div>
      );
    }
    
    if (typeof value === 'object') {
      // Filter out empty values from nested objects
      const nonEmptyEntries = Object.entries(value).filter(([_, v]) => !isEmptyValue(v));
      if (nonEmptyEntries.length === 0) return null;
      
      return (
        <div className="nested-object">
          {nonEmptyEntries.map(([k, v]) => (
            <div key={k} className="nested-field">
              <strong>{formatFieldName(k)}:</strong>
              <div className="nested-value">{renderValue(v, k)}</div>
            </div>
          ))}
        </div>
      );
    }
    
    return <span>{String(value)}</span>;
  };

  const renderJson = () => {
    if (!mou.json) return <p>No JSON data available</p>;

    const data = mou.json;
    
    // Core info fields to display at top (if present)
    const coreFields = [
      'mou_id', 'title', 'partner_name', 'location',
      'start_date', 'mou_start_date', 'end_date', 'mou_end_date',
      'validity_years', 'mou_type', 'is_active'
    ];
    
    // Fields to skip from auto-render (will show in raw JSON)
    const skipFields = new Set([]);
    
    return (
      <div className="json-viewer">
        {/* Core Information */}
        {coreFields.some(f => data[f] !== undefined && !isEmptyValue(data[f])) && (
          <div className="core-info">
            {coreFields.map(field => {
              if (isEmptyValue(data[field])) return null;
              const renderedValue = renderValue(data[field], field);
              if (renderedValue === null) return null;
              return (
                <div key={field} className="json-field">
                  <strong>{formatFieldName(field)}:</strong> {renderedValue}
                </div>
              );
            })}
          </div>
        )}

        {/* All other fields as sections */}
        {Object.entries(data).map(([key, value]) => {
          if (coreFields.includes(key) || skipFields.has(key)) return null;
          if (isEmptyValue(value)) return null;
          
          const renderedValue = renderValue(value, key);
          if (renderedValue === null) return null;
          
          return (
            <div key={key} className="json-section">
              <h3>{formatFieldName(key)}</h3>
              {renderedValue}
            </div>
          );
        })}

        {/* Raw JSON - always at bottom */}
        <div className="json-raw">
          <h3>Raw JSON</h3>
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      </div>
    );
  };

  const renderMarkdown = () => {
    if (!mou.md) return <p>No Markdown content available</p>;

    return (
      <div className="markdown-viewer">
        <ReactMarkdown>{mou.md}</ReactMarkdown>
      </div>
    );
  };

  const renderPdf = () => {
    if (!mou.pdfUrl) return <p>No PDF available</p>;

    // Use API URL from environment variable or default to localhost for dev
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    const pdfUrl = mou.pdfUrl.startsWith('http') 
      ? mou.pdfUrl 
      : `${apiUrl}${mou.pdfUrl}`;

    return (
      <div className="pdf-viewer">
        <iframe
          src={pdfUrl}
          title="MoU PDF"
          className="pdf-iframe"
        />
      </div>
    );
  };

  return (
    <div className="mou-viewer-container">
      <div className="viewer-header">
        <button className="btn-back" onClick={onBack}>
          ← Back to List
        </button>
        <div className="header-titles">
          <h2>{mou.title || mou.prefix}</h2>
          {mou.title && <p className="prefix-subtitle">{mou.prefix}</p>}
        </div>
        {onEdit && (
          <button className="btn-edit" onClick={onEdit}>
            ✏️ Edit
          </button>
        )}
      </div>

      {/* Main Tabs: Details, Activities, Community, KPIs, Reports */}
      <div className="main-tabs">
        <button
          className={activeTab === 'details' ? 'active' : ''}
          onClick={() => setActiveTab('details')}
        >
          📋 Details
        </button>
        <button
          className={activeTab === 'activities' ? 'active' : ''}
          onClick={() => setActiveTab('activities')}
        >
          📅 Activities
        </button>
        <button
          className={activeTab === 'community' ? 'active' : ''}
          onClick={() => setActiveTab('community')}
        >
          💬 Community
        </button>
        {(userRole === ROLES.MANAGER || canManageActivities) && (
          <>
            <button
              className={activeTab === 'kpis' ? 'active' : ''}
              onClick={() => setActiveTab('kpis')}
            >
              📊 KPIs
            </button>
            <button
              className={activeTab === 'reports' ? 'active' : ''}
              onClick={() => setActiveTab('reports')}
            >
              📈 Reports
            </button>
          </>
        )}
      </div>

      {/* Content Area */}
      {activeTab === 'details' && (
        <>
          <div className="viewer-tabs">
            {mou.json && (
              <button
                className={activeView === 'json' ? 'active' : ''}
                onClick={() => setActiveView('json')}
              >
                📄 JSON View
              </button>
            )}
            {mou.md && (
              <button
                className={activeView === 'md' ? 'active' : ''}
                onClick={() => setActiveView('md')}
              >
                📝 Markdown View
              </button>
            )}
            {mou.pdfUrl && (
              <button
                className={activeView === 'pdf' ? 'active' : ''}
                onClick={() => setActiveView('pdf')}
              >
                📕 PDF View
              </button>
            )}
          </div>

          <div className="viewer-content">
            {activeView === 'json' && renderJson()}
            {activeView === 'md' && renderMarkdown()}
            {activeView === 'pdf' && renderPdf()}
          </div>
        </>
      )}

      {activeTab === 'activities' && (
        <Activities 
          key={mou.prefix}
          mouPrefix={mou.prefix} 
          userEmail={userEmail}
          canManage={canManageActivities}
        />
      )}

      {activeTab === 'community' && (
        <Community 
          key={mou.prefix}
          mouPrefix={mou.prefix} 
          userEmail={userEmail}
        />
      )}

      {activeTab === 'kpis' && (
        <KPIs 
          key={mou.prefix}
          mou={mou}
          canManage={userRole === ROLES.MANAGER || canManageActivities}
        />
      )}

      {activeTab === 'reports' && (
        <Reports 
          key={mou.prefix}
          mou={mou}
          canManage={userRole === ROLES.MANAGER || canManageActivities}
        />
      )}
    </div>
  );
}

export default MouViewer;
