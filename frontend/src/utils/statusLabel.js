const statusLabels = {
  ACTIVE: "Aktif",
  CANCELLED: "Dibatalkan",
  CONFIRMED: "Terkonfirmasi",
  EXPIRED: "Kedaluwarsa",
  FAILED: "Gagal",
  INACTIVE: "Tidak Aktif",
  PAID: "Dibayar",
  PENDING: "Pembayaran Tertunda",
  USED: "Digunakan",
  WAITING_PAYMENT: "Menunggu Pembayaran",
};

export function getStatusLabel(status) {
  return statusLabels[status] || status || "-";
}
