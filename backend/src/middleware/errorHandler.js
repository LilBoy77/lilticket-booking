export function errorHandler(error, _request, response, _next) {
  const statusCode = error.statusCode || 500;

  if (error.responseBody) {
    response.status(statusCode).json(error.responseBody);
    return;
  }

  response.status(statusCode).json({
    error: "Request Error",
    message: error.message || "Terjadi kesalahan pada server",
    status: "error",
  });
}
