import React from 'react';
import './FilterSidebar.css';

function FilterSidebar({ 
  searchQuery, 
  onSearchChange, 
  activeFilters, 
  onFilterChange,
  starredCount,
  stats 
}) {
  const filters = [
    {
      type: 'special',
      label: '⭐ Starred',
      key: 'starred',
      count: starredCount
    },
    {
      type: 'status',
      label: 'Status',
      options: [
        { key: 'active', label: '✅ Active', count: stats?.active || 0 },
        { key: 'expired', label: '❌ Expired', count: stats?.expired || 0 },
        { key: 'expiring', label: '⚠️ Expiring Soon', count: stats?.expiring || 0 }
      ]
    },
    {
      type: 'type',
      label: 'Type',
      options: [
        { key: 'academic', label: '🎓 Academic' },
        { key: 'research', label: '🔬 Research' },
        { key: 'industry', label: '🏭 Industry' },
        { key: 'training', label: '📚 Training' },
        { key: 'other', label: '📋 Other' }
      ]
    }
  ];

  const handleFilterToggle = (filterKey) => {
    onFilterChange(filterKey);
  };

  return (
    <div className="filter-sidebar">
      <div className="search-container">
        <input
          type="text"
          className="search-input"
          placeholder="🔍 Search MoUs..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="filters-container">
        {filters.map((filter, idx) => (
          <div key={idx} className="filter-section">
            {filter.type === 'special' ? (
              <button
                className={`filter-item special ${activeFilters.includes(filter.key) ? 'active' : ''}`}
                onClick={() => handleFilterToggle(filter.key)}
              >
                <span className="filter-label">{filter.label}</span>
                {filter.count > 0 && <span className="filter-count">{filter.count}</span>}
              </button>
            ) : (
              <>
                <div className="filter-header">{filter.label}</div>
                {filter.options.map((option) => (
                  <button
                    key={option.key}
                    className={`filter-item ${activeFilters.includes(option.key) ? 'active' : ''}`}
                    onClick={() => handleFilterToggle(option.key)}
                  >
                    <span className="filter-label">{option.label}</span>
                    {option.count !== undefined && (
                      <span className="filter-count">{option.count}</span>
                    )}
                  </button>
                ))}
              </>
            )}
          </div>
        ))}
      </div>

      {activeFilters.length > 0 && (
        <div className="active-filters-footer">
          <button 
            className="clear-filters-btn"
            onClick={() => onFilterChange(null)} // Clear all
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}

export default FilterSidebar;
