// Role utility functions

export const ROLES = {
  MANAGER: 'manager',
  SPOC: 'spoc',
  VIEWER: 'viewer'
};

export const getUserRole = (email, usersData) => {
  if (!email || !usersData) return ROLES.VIEWER;

  // Check if manager
  if (usersData.managers && usersData.managers.includes(email)) {
    return ROLES.MANAGER;
  }

  // Check if SPOC for any MoU
  if (usersData.mous) {
    for (const mouId in usersData.mous) {
      if (usersData.mous[mouId].spocs && usersData.mous[mouId].spocs.includes(email)) {
        return ROLES.SPOC;
      }
    }
  }

  // Default to viewer
  return ROLES.VIEWER;
};

export const getSpocMous = (email, usersData) => {
  if (!email || !usersData || !usersData.mous) return [];

  const spocMous = [];
  for (const mouId in usersData.mous) {
    if (usersData.mous[mouId].spocs && usersData.mous[mouId].spocs.includes(email)) {
      spocMous.push(mouId);
    }
  }
  return spocMous;
};

export const canEditMou = (email, usersData) => {
  const role = getUserRole(email, usersData);
  return role === ROLES.MANAGER;
};

export const canManageActivities = (email, mouId, usersData) => {
  const role = getUserRole(email, usersData);
  // Phase 2 requirement: SPOCs only can manage activities for their assigned MoU
  if (role !== ROLES.SPOC) return false;
  const spocMous = getSpocMous(email, usersData);
  return spocMous.includes(mouId);
};

export const canViewDashboard = (email, usersData) => {
  const role = getUserRole(email, usersData);
  return role === ROLES.MANAGER || role === ROLES.SPOC;
};
