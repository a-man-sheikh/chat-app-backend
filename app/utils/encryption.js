const crypto = require("crypto");

// Encryption configuration
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;

/**
 * Generate a random encryption key
 * @returns {string} Base64 encoded encryption key
 */
const generateEncryptionKey = () => {
  return crypto.randomBytes(KEY_LENGTH).toString("base64");
};

/**
 * Derive encryption key from password using PBKDF2
 * @param {string} password - The password to derive key from
 * @param {string} salt - The salt for key derivation
 * @returns {Buffer} Derived key
 */
const deriveKey = (password, salt) => {
  return crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, "sha512");
};

/**
 * Encrypt a message
 * @param {string} text - The text to encrypt
 * @param {string} encryptionKey - The encryption key (base64)
 * @returns {string} Encrypted data (base64)
 */
const encryptMessage = (text, encryptionKey) => {
  try {
    // Decode the base64 key
    const key = Buffer.from(encryptionKey, "base64");

    // Generate random IV
    const iv = crypto.randomBytes(IV_LENGTH);

    // Create cipher with IV
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    cipher.setAAD(Buffer.from("message-authentication", "utf8"));

    // Encrypt the text
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");

    // Get the auth tag
    const tag = cipher.getAuthTag();

    // Combine IV, encrypted data, and auth tag
    const result = Buffer.concat([iv, Buffer.from(encrypted, "hex"), tag]);

    return result.toString("base64");
  } catch (error) {
    throw new Error("Encryption failed: " + error.message);
  }
};

/**
 * Decrypt a message
 * @param {string} encryptedData - The encrypted data (base64)
 * @param {string} encryptionKey - The encryption key (base64)
 * @returns {string} Decrypted text
 */
const decryptMessage = (encryptedData, encryptionKey) => {
  try {
    // Decode the base64 key and data
    const key = Buffer.from(encryptionKey, "base64");
    const data = Buffer.from(encryptedData, "base64");

    // Extract IV, encrypted data, and auth tag
    const iv = data.subarray(0, IV_LENGTH);
    const tag = data.subarray(data.length - TAG_LENGTH);
    const encrypted = data.subarray(IV_LENGTH, data.length - TAG_LENGTH);

    // Create decipher with IV
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAAD(Buffer.from("message-authentication", "utf8"));
    decipher.setAuthTag(tag);

    // Decrypt the data
    let decrypted = decipher.update(encrypted, null, "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    throw new Error("Decryption failed: " + error.message);
  }
};

/**
 * Generate a secure random string for conversation keys
 * @param {number} length - Length of the string
 * @returns {string} Random string
 */
const generateSecureRandom = (length = 32) => {
  return crypto.randomBytes(length).toString("hex");
};

/**
 * Hash a string for verification
 * @param {string} text - Text to hash
 * @returns {string} SHA256 hash
 */
const hashString = (text) => {
  return crypto.createHash("sha256").update(text).digest("hex");
};

module.exports = {
  generateEncryptionKey,
  deriveKey,
  encryptMessage,
  decryptMessage,
  generateSecureRandom,
  hashString,
};
