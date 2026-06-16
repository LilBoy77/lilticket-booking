function ConfirmModal({
  cancelText = "Batal",
  confirmText = "Hapus",
  loading = false,
  message = "Apakah Anda yakin ingin menghapus data ini? Data yang dihapus tidak dapat dikembalikan.",
  onCancel,
  onConfirm,
  title = "Konfirmasi Hapus",
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/40 px-4 py-6" role="presentation">
      <div className="surface-card w-full max-w-md bg-white p-5 shadow-xl shadow-slate-950/20">
        <h2 className="text-xl font-extrabold tracking-tight text-navy">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-muted">{message}</p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button className="btn-secondary w-full sm:w-auto" disabled={loading} onClick={onCancel} type="button">
            {cancelText}
          </button>
          <button className="btn-primary w-full bg-danger hover:bg-danger/90 sm:w-auto" disabled={loading} onClick={onConfirm} type="button">
            {loading ? "Menghapus..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
