export class IlluxatAPI {
  constructor() {
    this.baseUrl = 'https://illuxat.com/api/';
  }

  /**
   * Sends a GET request to the Illuxat API.
   * @param {string} path - Endpoint
   */
  async sendRequest(path) {
    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error. Status: ${response.status}`);
      }

      const data = await response.json();
      return data || { error: 'Failed to decode JSON response' };
    } catch (error) {
      return { error: 'Failed to send request' };
    }
  }

  async online(userOrId) {
    try {
      const response = await fetch(`${this.baseUrl}online/${userOrId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      // For the online endpoint, 500 means offline (valid response), so we parse it.
      const data = await response.json();
      return data || { error: 'Failed to decode JSON response' };
    } catch (error) {
      return { error: error.message || 'Failed to send request' };
    }
  }
}