export const ROLES = { CUSTOMER: "customer", AGENT: "agent", ADJUSTER: "adjuster", ADMIN: "admin" };

export const isCustomer  = (user) => user?.role === ROLES.CUSTOMER;
export const isAgent     = (user) => user?.role === ROLES.AGENT;
export const isAdjuster  = (user) => user?.role === ROLES.ADJUSTER;
export const isAdmin     = (user) => user?.role === ROLES.ADMIN;
export const isStaff     = (user) => [ROLES.AGENT, ROLES.ADJUSTER, ROLES.ADMIN].includes(user?.role);

export const ROLE_LABELS  = { customer: "Customer", agent: "Agent", adjuster: "Claims Adjuster", admin: "Administrator" };
export const getRoleLabel = (role) => ROLE_LABELS[role] || role;

export const STATUS_LABELS = {
  submitted:    "Submitted",
  under_review: "Under Review",
  approved:     "Approved",
  rejected:     "Rejected",
  withdrawn:    "Withdrawn",
};

export const STATUS_BADGE_CLASS = {
  submitted:    "badge-submitted",
  under_review: "badge-under-review",
  approved:     "badge-approved",
  rejected:     "badge-rejected",
  withdrawn:    "badge-withdrawn",
};
