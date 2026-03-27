const config = {
  firebase: {
    apiKey: "AIzaSyA8FxTP0_ue_tnE2hF9kJzHdlC575ePo-I",
    authDomain: "lemo-profile-stories.firebaseapp.com",
    projectId: "lemo-profile-stories",
    storageBucket: "lemo-profile-stories.firebasestorage.app",
    messagingSenderId: "1039102929805",
    appId: "1:1039102929805:web:b216a60a3571d8cc37abc4"
  },

  // Admin Configuration
  admin: {
    password: "lemo"
  }
};

// Export for use in HTML
if (typeof module !== 'undefined' && module.exports) {
  module.exports = config;
}