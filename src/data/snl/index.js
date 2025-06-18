// src/data/snl/index.js
// Central export for all SNL security
module.exports = {
  usergroups: require('./security/usergroups.snl'),
  plans: require('./security/plans.snl'),
  usersplans: require('./security/usersplans.snl'),
  userroles: require('./security/userroles.snl'),
  subscription: require('./security/subscription.snl'),
  planlimits: require('./security/planlimits.snl'),
  billing: require('./security/billing.snl'),
  aiconfig: require('./security/aiconfig.snl')
};