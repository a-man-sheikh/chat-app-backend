const jwt = require("jsonwebtoken");

/**
 * Token Manager Utility
 * Handles token storage, validation, and refresh logic
 */
class TokenManager {
  constructor() {
    this.accessToken = null;
    this.refreshToken = null;
  }

  /**
   * Set tokens
   */
  setTokens(accessToken, refreshToken) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
  }

  /**
   * Get access token
   */
  getAccessToken() {
    return this.accessToken;
  }

  /**
   * Get refresh token
   */
  getRefreshToken() {
    return this.refreshToken;
  }

  /**
   * Check if access token is expired
   */
  isAccessTokenExpired() {
    if (!this.accessToken) return true;
    
    try {
      const decoded = jwt.decode(this.accessToken);
      if (!decoded || !decoded.exp) return true;
      
      const currentTime = Math.floor(Date.now() / 1000);
      return decoded.exp < currentTime;
    } catch (error) {
      return true;
    }
  }

  /**
   * Check if refresh token is expired
   */
  isRefreshTokenExpired() {
    if (!this.refreshToken) return true;
    
    try {
      const decoded = jwt.decode(this.refreshToken);
      if (!decoded || !decoded.exp) return true;
      
      const currentTime = Math.floor(Date.now() / 1000);
      return decoded.exp < currentTime;
    } catch (error) {
      return true;
    }
  }

  /**
   * Get token expiration time
   */
  getTokenExpiration(token) {
    try {
      const decoded = jwt.decode(token);
      return decoded ? decoded.exp : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Clear tokens
   */
  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
  }

  /**
   * Get authorization header
   */
  getAuthHeader() {
    return this.accessToken ? `Bearer ${this.accessToken}` : null;
  }
}

module.exports = TokenManager; 