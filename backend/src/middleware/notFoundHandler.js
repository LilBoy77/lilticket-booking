export function notFoundHandler(request, response) {
  response.status(404).json({
    error: "Request Error",
    message: `Route ${request.originalUrl} tidak ditemukan`,
    status: "error",
  });
}
