export class IlluxatAPI {
  constructor() {
    // External API disabled
  }

  /**
   * Disabled external requests
   */
  async sendRequest(path) {
    return {
      success: false,
      message: "API disabled"
    };
  }

  /**
   * Disabled online status check
   */
  async online(userOrId) {
    return {
      online: false,
      message: "Offline (API disabled)"
    };
  }
}
