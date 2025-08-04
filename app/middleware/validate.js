/**
 * Validation Middleware using Joi
 * @param {Object} schema - Joi validation schema
 * @returns {Function} Express middleware function
 */
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false, // Return all validation errors
      stripUnknown: true, // Remove unknown fields
      allowUnknown: false, // Don't allow unknown fields
    });

    if (error) {
      // Create a custom error object that the error handler can recognize
      const validationError = new Error("Validation Error");
      validationError.isJoi = true;
      validationError.details = error.details;
      return next(validationError);
    }

    // Replace req.body with validated data
    req.body = value;
    next();
  };
};

module.exports = validate;
