import React, { useState, useEffect } from 'react';
import './MouListGmail.css';
import FilterSidebar from './FilterSidebar';
import api from '../api';

function MouListGmail({ mous, onView, onEdit, onDelete, userEmail }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState([]);
  const [starredMous, setStarredMous] = useState([]);
  const [filterStats, setFilterStats] = useState({
    active: 0,
    expired: 0,
    expiring: 0
  });

  useEffect(() => {
    if (userEmail) {
      fetchStarredMous();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userEmail]);

  useEffect(() => {
    calculateStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mous]);

  const fetchStarredMous = async () => {
    try {
      const response = await api.get('/api/mous/starred', {
        params: { email: userEmail }
      });
      setStarredMous(response.data);
    } catch (err) {
      console.error('Error fetching starred MoUs:', err);
    }
  };

  const calculateStats = () => {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    let active = 0;
    let expired = 0;
    let expiring = 0;

    mous.forEach(mou => {
      if (!mou || !mou.data) {
        active++;
        return;
      }
      
      // Handle both old format (validity_period) and new format (mou_end_date)
      let validTo;
      if (mou.data.mou_end_date) {
        validTo = new Date(mou.data.mou_end_date);
      } else if (mou.data.validity_period?.valid_to) {
        validTo = new Date(mou.data.validity_period.valid_to);
      } else {
        active++;
        return;
      }
      
      if (isNaN(validTo.getTime())) {
        active++;
        return;
      }
      
      if (validTo < now) {
        expired++;
      } else if (validTo <= thirtyDaysFromNow) {
        expiring++;
      } else {
        active++;
      }
    });

    setFilterStats({ active, expired, expiring });
  };

  const handleStarToggle = async (prefix, e) => {
    e.stopPropagation();
    
    const isStarred = starredMous.includes(prefix);
    
    try {
      if (isStarred) {
        await api.delete(`/api/mous/${prefix}/star`, {
          params: { email: userEmail }
        });
        setStarredMous(starredMous.filter(p => p !== prefix));
      } else {
        await api.post(`/api/mous/${prefix}/star`, { email: userEmail });
        setStarredMous([...starredMous, prefix]);
      }
    } catch (err) {
      console.error('Error toggling star:', err);
    }
  };

  const handleFilterChange = (filterKey) => {
    if (filterKey === null) {
      // Clear all filters
      setActiveFilters([]);
      return;
    }

    if (activeFilters.includes(filterKey)) {
      setActiveFilters(activeFilters.filter(f => f !== filterKey));
    } else {
      setActiveFilters([...activeFilters, filterKey]);
    }
  };

  const getMouStatus = (mou) => {
    if (!mou || !mou.data) return 'active';
    
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    // Handle both old format (validity_period) and new format (mou_end_date)
    let validTo;
    if (mou.data.mou_end_date) {
      validTo = new Date(mou.data.mou_end_date);
    } else if (mou.data.validity_period?.valid_to) {
      validTo = new Date(mou.data.validity_period.valid_to);
    } else {
      return 'active';
    }

    if (isNaN(validTo.getTime())) return 'active';
    if (validTo < now) return 'expired';
    if (validTo <= thirtyDaysFromNow) return 'expiring';
    return 'active';
  };

  const getFirstKpi = (mou) => {
    if (!mou || !mou.data) return null;
    const kpis = mou.data.kpis || [];
    if (kpis.length === 0) return null;
    return {
      first: kpis[0],
      count: kpis.length
    };
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const filteredMous = mous.filter(mou => {
    // Safety check
    if (!mou) return false;
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const partnerName = mou.data?.partner_institution?.name?.toLowerCase() || '';
      const mouId = mou.data?.mou_id?.toLowerCase() || '';
      const prefix = mou.prefix?.toLowerCase() || '';
      
      if (!partnerName.includes(query) && !mouId.includes(query) && !prefix.includes(query)) {
        return false;
      }
    }

    // Active filters
    if (activeFilters.length > 0) {
      // Starred filter
      if (activeFilters.includes('starred') && !starredMous.includes(mou.prefix)) {
        return false;
      }

      // Status filters
      const status = getMouStatus(mou);
      const statusFilters = activeFilters.filter(f => ['active', 'expired', 'expiring'].includes(f));
      if (statusFilters.length > 0 && !statusFilters.includes(status)) {
        return false;
      }

      // Type filters
      const mouType = (mou.data?.mou_type || mou.data?.type_of_mou || '').toLowerCase();
      const typeFilters = activeFilters.filter(f => ['academic', 'research', 'industry', 'training', 'other'].includes(f));
      if (typeFilters.length > 0 && mouType && !typeFilters.includes(mouType)) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className="mou-list-gmail">
      <FilterSidebar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeFilters={activeFilters}
        onFilterChange={handleFilterChange}
        starredCount={starredMous.length}
        stats={filterStats}
      />

      <div className="mou-list-content">
        <div className="mou-list-table">
          {filteredMous.length === 0 ? (
            <div className="no-mous">
              {searchQuery || activeFilters.length > 0 
                ? '🔍 No MoUs match your search or filters' 
                : '📋 No MoUs available'}
            </div>
          ) : (
            filteredMous.map(mou => {
              const status = getMouStatus(mou);
              const kpiInfo = getFirstKpi(mou);
              const isStarred = starredMous.includes(mou.prefix);

              return (
                <div 
                  key={mou.prefix} 
                  className={`mou-row ${status}`}
                  onClick={() => onView(mou.prefix)}
                >
                  <button
                    className={`star-btn ${isStarred ? 'starred' : ''}`}
                    onClick={(e) => handleStarToggle(mou.prefix, e)}
                    title={isStarred ? 'Unstar' : 'Star'}
                  >
                    {isStarred ? '⭐' : '☆'}
                  </button>

                  <div className="mou-info">
                    <div className="mou-primary">
                      <span className="partner-name">
                        {mou.data?.partner_name || mou.data?.partner_institution?.name || mou.title || 'Unknown Partner'}
                      </span>
                    </div>
                    <div className="mou-secondary">
                      <span className="mou-id" title={mou.data?.mou_id || mou.prefix}>
                        {mou.data?.mou_id || mou.prefix}
                      </span>
                      <span className="separator">•</span>
                      <span className="mou-type" title={mou.data?.mou_type || mou.data?.type_of_mou}>
                        {mou.data?.mou_type || mou.data?.type_of_mou || 'N/A'}
                      </span>
                      <span className="separator">•</span>
                      <span className="validity">
                        {formatDate(mou.data?.mou_end_date || mou.data?.validity_period?.valid_to)}
                      </span>
                    </div>
                  </div>
                  
                  <span className={`status-badge ${status}`}>
                    {status === 'active' ? '✅' : status === 'expired' ? '❌' : '⚠️'}
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </span>

                  {(onEdit || onDelete) && (
                    <div className="mou-actions">
                      {onEdit && (
                        <button
                          className="btn-action edit"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(mou.prefix);
                          }}
                          title="Edit"
                        >
                          ✏️
                        </button>
                      )}
                      {onDelete && (
                        <button
                          className="btn-action delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(mou.prefix);
                          }}
                          title="Delete"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default MouListGmail;
