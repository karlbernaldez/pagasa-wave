export const PERMISSIONS = {
  projects: {
    admin: ['viewAll', 'review', 'approve'],
    forecaster: ['viewOwn', 'create', 'edit', 'submit'],
  },
  analytics: {
    admin: ['view', 'export'],
    forecaster: ['view'],
  },
  models: {
    admin: ['view', 'manage'],
    forecaster: ['view', 'run'],
  },
  users: {
    admin: ['view', 'manage'],
    forecaster: [],
  },
  reports: {
    admin: ['view', 'approve'],
    forecaster: ['view', 'create'],
  },
};
