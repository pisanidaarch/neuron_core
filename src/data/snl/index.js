// src/data/snl/index.js
// Central export for all SNL commands
module.exports = {
  // Security entities
  usergroups: require('./security/usergroups.snl'),
  plans: require('./security/plans.snl'),
  usersplans: require('./security/usersplans.snl'),
  userroles: require('./security/userroles.snl'),
  subscription: require('./security/subscription.snl'),
  planlimits: require('./security/planlimits.snl'),
  billing: require('./security/billing.snl'),
  aiconfig: require('./security/aiconfig.snl'),

  // Configuration entities
  behavior: require('./config/behavior.snl'),
  agent: require('./config/agent.snl')
};