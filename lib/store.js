

const store = {
  onboardings: new Map(),   // onboardId -> { student, status, invitationMsgId, connectionId }
  logins: new Map(),        // loginId   -> { status, presExId, user }

  
  byInvitation: new Map(),  // invitation_msg_id -> onboardId | 'faculty'
  byConnection: new Map(),  // connection_id     -> onboardId
  byPresEx: new Map(),      // pres_ex_id        -> loginId

  
  faculty: { status: 'not_connected', invitationMsgId: null, connectionId: null },
  messages: [],             
};

module.exports = store;