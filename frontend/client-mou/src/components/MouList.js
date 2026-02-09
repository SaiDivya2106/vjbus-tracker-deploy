import React from 'react';
import './MouList.css';

function MouList({ mous, onView, onEdit, onDelete }) {
  // Handle case where mous is not an array (error response, etc.)
  if (!Array.isArray(mous) || mous.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📭</div>
        <h2>No MoUs Found</h2>
        <p>{!Array.isArray(mous) ? 'Error loading MoUs. Please check your connection.' : 'Upload your first MoU to get started!'}</p>
      </div>
    );
  }

  return (
    <div className="mou-list-container">
      <h2>All MoUs ({mous.length})</h2>
      
      <div className="mou-grid">
        {mous.map((mou) => (
          <div key={mou.prefix} className="mou-card">
            <div className="mou-card-header">
              <h3>{mou.title || mou.prefix}</h3>
              {mou.title && <p className="prefix-subtitle">{mou.prefix}</p>}
            </div>
            
            <div className="mou-card-body">
              <div className="file-badges">
                {mou.hasJson && (
                  <span className="badge badge-json">📄 JSON</span>
                )}
                {mou.hasMd && (
                  <span className="badge badge-md">📝 Markdown</span>
                )}
                {mou.hasPdf && (
                  <span className="badge badge-pdf">📕 PDF</span>
                )}
              </div>
            </div>

            <div className="mou-card-actions">
              <button
                className="btn-view"
                onClick={() => onView(mou.prefix)}
              >
                👁️ View
              </button>
              <button
                className="btn-edit"
                onClick={() => onEdit(mou.prefix)}
              >
                ✏️ Edit
              </button>
              <button
                className="btn-delete"
                onClick={() => onDelete(mou.prefix)}
              >
                🗑️ Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MouList;
