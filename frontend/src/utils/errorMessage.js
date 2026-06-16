export function getErrorMessage(error, fallback = "Terjadi kesalahan. Silakan coba lagi.") {
  return error?.response?.data?.message || error?.message || fallback;
}
