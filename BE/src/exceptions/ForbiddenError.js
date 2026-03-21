const { ApiError } = require('./ApiError');

class ForbiddenError extends ApiError {
  constructor(message = 'Forbidden') {
    super(403, message);
  }
}

module.exports = { ForbiddenError };
