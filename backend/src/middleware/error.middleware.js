const { fail } = require('../utils/apiResponse');

// eslint-disable-next-line no-unused-vars
function errorMiddleware(err, req, res, next) {
  const status = err.status || 500;
  const code = err.code || 'INTERNAL_ERROR';

  if (status >= 500) {
    // eslint-disable-next-line no-console
    console.error(err);
  }

  return fail(res, status, code, err.message || 'Something went wrong. Please try again.');
}

module.exports = errorMiddleware;
