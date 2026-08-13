const errorHandler = (err, req, res, next) => {
  let error = { ...err };

  error.message = err.message;

  // Log the real stack. (This previously read `err.stack.red`, which relied on
  // the `colors` package monkey-patching String.prototype — `colors` is not a
  // dependency, so it logged `undefined` and swallowed every stack trace. It
  // also threw outright whenever a non-Error value was thrown, since `undefined.red`
  // is a TypeError.)
  console.error(err.stack || err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = `Resource not found with id of ${err.value}`;
    error = new Error(message);
    error.statusCode = 404;
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = new Error(message);
    error.statusCode = 400;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message);
    error = new Error(message);
    error.statusCode = 400;
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Server Error',
  });
};

module.exports = errorHandler;