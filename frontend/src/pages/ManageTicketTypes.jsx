import { Edit3, Plus, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import ConfirmModal from "../components/ui/ConfirmModal.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { eventService } from "../services/eventService.js";
import { ticketTypeService } from "../services/ticketTypeService.js";
import { getErrorMessage } from "../utils/errorMessage.js";
import { formatCurrency } from "../utils/formatCurrency.js";
import { isEndDateAfterStartDate, isRequired, optionalDate } from "../utils/validation.js";

const emptyForm = {
  description: "",
  event_id: "",
  name: "",
  price: "",
  quota: "",
  sale_end_at: "",
  sale_start_at: "",
};
const ticketNamePlaceholder = "Pilih jenis tiket";
const ticketNameOptions = ["Regular", "VIP", "VVIP", "Early Bird", "Presale", "Festival", "Tribune"];
const ticketTypeUsedMessage = "Jenis tiket tidak dapat dihapus karena sudah digunakan pada pesanan.";

function toDateTimeLocal(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 16);
}

function toPayloadDate(value) {
  return value ? new Date(value).toISOString() : null;
}

function ManageTicketTypes() {
  const [ticketTypes, setTicketTypes] = useState([]);
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const formRef = useRef(null);
  const firstInputRef = useRef(null);
  const { showToast } = useToast();

  const selectedTicketType = ticketTypes.find((ticketType) => ticketType.id === editingId);
  const selectedEvent = events.find((event) => event.id === form.event_id);
  const ticketNameSelectOptions = useMemo(() => {
    if (form.name && form.name !== ticketNamePlaceholder && !ticketNameOptions.includes(form.name)) {
      return [...ticketNameOptions, form.name];
    }

    return ticketNameOptions;
  }, [form.name]);

  const validateForm = () => {
    const price = Number(form.price);
    const quota = Number(form.quota);
    const nextErrors = {
      event_id: isRequired(form.event_id) ? "" : "Acara wajib dipilih.",
      name: isRequired(form.name) ? "" : "Jenis tiket wajib dipilih.",
      price:
        !isRequired(form.price)
          ? "Harga tiket wajib diisi."
          : !Number.isFinite(price)
            ? "Harga tiket wajib berupa angka."
            : price < 0
            ? "Harga tiket tidak boleh negatif."
            : "",
      quota:
        !isRequired(form.quota)
          ? "Kuota tiket wajib diisi."
          : !Number.isInteger(quota) || quota <= 0
            ? "Kuota tiket harus lebih dari 0."
            : "",
      sale_end_at: optionalDate(form.sale_end_at, "Tanggal akhir penjualan tiket"),
      sale_start_at: optionalDate(form.sale_start_at, "Tanggal mulai penjualan tiket"),
    };

    if (!nextErrors.sale_start_at && !nextErrors.sale_end_at && !isEndDateAfterStartDate(form.sale_start_at, form.sale_end_at)) {
      nextErrors.sale_end_at = "Tanggal akhir penjualan harus lebih besar dari tanggal mulai penjualan.";
    }

    if (!nextErrors.sale_start_at && form.sale_start_at && selectedEvent?.start_at && new Date(form.sale_start_at) > new Date(selectedEvent.start_at)) {
      nextErrors.sale_start_at = "Tanggal mulai penjualan tidak boleh setelah tanggal mulai acara.";
    }

    if (!nextErrors.sale_end_at && form.sale_end_at && selectedEvent?.start_at && new Date(form.sale_end_at) > new Date(selectedEvent.start_at)) {
      nextErrors.sale_end_at = "Tanggal akhir penjualan tidak boleh melewati tanggal mulai acara.";
    }

    if (editingId && selectedTicketType && !nextErrors.quota && Number(selectedTicketType.sold_quantity) > quota) {
      nextErrors.quota = "Kuota tidak boleh lebih kecil dari jumlah terjual.";
    }

    const activeErrors = Object.fromEntries(Object.entries(nextErrors).filter(([, value]) => value));

    setFieldErrors(activeErrors);

    return Object.keys(activeErrors).length === 0;
  };

  const focusForm = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => firstInputRef.current?.focus({ preventScroll: true }), 300);
  };

  const getInputClass = (fieldName) =>
    fieldErrors[fieldName] ? "input-field border-danger focus:border-danger focus:ring-danger/10" : "input-field";

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const [ticketTypesResponse, eventsResponse] = await Promise.all([
        ticketTypeService.getTicketTypes(),
        eventService.getAdminEvents({ limit: 50 }),
      ]);

      setTicketTypes(ticketTypesResponse.data.ticket_types || []);
      setEvents(eventsResponse.data.events || []);
    } catch (requestError) {
      const message = getErrorMessage(requestError);
      setError(message);
      showToast({ message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!form.event_id && events[0]?.id) {
      setForm((currentForm) => ({ ...currentForm, event_id: events[0].id }));
    }
  }, [events, form.event_id]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
    setFieldErrors((currentErrors) => ({
      ...currentErrors,
      [name]: "",
    }));
  };

  const resetForm = () => {
    setEditingId("");
    setFieldErrors({});
    setForm({
      ...emptyForm,
      event_id: events[0]?.id || "",
    });
  };

  const handleCancelEdit = () => {
    resetForm();
    showToast({ message: "Mode edit dibatalkan.", type: "info" });
  };

  const handleEdit = (ticketType) => {
    setEditingId(ticketType.id);
    setForm({
      description: ticketType.description || "",
      event_id: ticketType.event_id,
      name: ticketType.name,
      price: String(Number(ticketType.price)),
      quota: String(ticketType.quota),
      sale_end_at: toDateTimeLocal(ticketType.sale_end_at),
      sale_start_at: toDateTimeLocal(ticketType.sale_start_at),
    });
    showToast({ message: "Mode edit jenis tiket aktif.", type: "info" });
    focusForm();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!validateForm()) {
      showToast({ message: "Periksa kembali data yang wajib diisi.", type: "warning" });
      return;
    }

    setSaving(true);
    const isEditing = Boolean(editingId);

    const payload = {
      ...form,
      price: Number(form.price),
      quota: Number(form.quota),
      sale_end_at: toPayloadDate(form.sale_end_at),
      sale_start_at: toPayloadDate(form.sale_start_at),
    };

    try {
      if (isEditing) {
        await ticketTypeService.updateTicketType(editingId, payload);
        showToast({ message: "Data berhasil diperbarui.", type: "success" });
      } else {
        await ticketTypeService.createTicketType(payload);
        showToast({ message: "Data berhasil ditambahkan.", type: "success" });
      }

      resetForm();
      await loadData();
    } catch (requestError) {
      const message = getErrorMessage(requestError);
      setError(message);
      showToast({ message: isEditing ? "Gagal memperbarui data." : "Gagal menambahkan data.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget?.id) {
      return;
    }

    setError("");
    setDeleteLoading(true);

    try {
      await ticketTypeService.deleteTicketType(deleteTarget.id);
      showToast({ message: "Jenis tiket berhasil dihapus.", type: "success" });
      setDeleteTarget(null);
      await loadData();
    } catch (requestError) {
      const message = requestError?.response?.status === 409
        ? ticketTypeUsedMessage
        : "Gagal menghapus jenis tiket.";
      setError(message);
      showToast({ message, type: "error" });
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="badge-category">Jenis Tiket</p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-navy">Kelola jenis tiket</h1>
      </div>

      {error ? <div className="rounded-xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm font-semibold text-danger">{error}</div> : null}

      <form ref={formRef} className="surface-card grid scroll-mt-24 gap-4 p-5 lg:grid-cols-2" noValidate onSubmit={handleSubmit}>
        <div className="flex flex-wrap items-center gap-3 lg:col-span-2">
          <h2 className="text-xl font-extrabold tracking-tight text-navy">{editingId ? "Edit Jenis Tiket" : "Buat Jenis Tiket"}</h2>
          {editingId ? <span className="badge-category">Mode Edit</span> : null}
        </div>
        <div className="lg:col-span-2">
          <label className="mb-2 block text-sm font-semibold text-navy" htmlFor="ticket-event">Acara</label>
          <select ref={firstInputRef} className={getInputClass("event_id")} id="ticket-event" name="event_id" onChange={handleChange} value={form.event_id}>
            <option value="">Pilih acara</option>
            {events.map((event) => <option key={event.id} value={event.id}>{event.title}</option>)}
          </select>
          {fieldErrors.event_id ? <p className="mt-2 text-xs font-semibold text-danger">{fieldErrors.event_id}</p> : null}
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-navy" htmlFor="ticket-name">Jenis Tiket</label>
          <select className={getInputClass("name")} id="ticket-name" name="name" onChange={handleChange} value={form.name}>
            <option disabled value="">{ticketNamePlaceholder}</option>
            {ticketNameSelectOptions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
          {fieldErrors.name ? <p className="mt-2 text-xs font-semibold text-danger">{fieldErrors.name}</p> : null}
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-navy" htmlFor="ticket-price">Harga Tiket</label>
          <input className={getInputClass("price")} id="ticket-price" min="0" name="price" onChange={handleChange} placeholder="Harga" type="number" value={form.price} />
          {fieldErrors.price ? <p className="mt-2 text-xs font-semibold text-danger">{fieldErrors.price}</p> : null}
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-navy" htmlFor="ticket-quota">Kuota Tiket</label>
          <input className={getInputClass("quota")} id="ticket-quota" min="1" name="quota" onChange={handleChange} placeholder="Kuota" type="number" value={form.quota} />
          {fieldErrors.quota ? <p className="mt-2 text-xs font-semibold text-danger">{fieldErrors.quota}</p> : null}
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-navy" htmlFor="ticket-sale-start-at">Tanggal Mulai Penjualan Tiket</label>
          <input className={getInputClass("sale_start_at")} id="ticket-sale-start-at" name="sale_start_at" onChange={handleChange} type="datetime-local" value={form.sale_start_at} />
          <p className="mt-2 text-xs font-medium text-muted">Tanggal mulai penjualan menentukan kapan tiket mulai bisa dibeli.</p>
          {fieldErrors.sale_start_at ? <p className="mt-2 text-xs font-semibold text-danger">{fieldErrors.sale_start_at}</p> : null}
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-navy" htmlFor="ticket-sale-end-at">Tanggal Akhir Penjualan Tiket</label>
          <input className={getInputClass("sale_end_at")} id="ticket-sale-end-at" name="sale_end_at" onChange={handleChange} type="datetime-local" value={form.sale_end_at} />
          <p className="mt-2 text-xs font-medium text-muted">Tanggal akhir penjualan menentukan kapan tiket berhenti dijual.</p>
          <p className="mt-1 text-xs font-medium text-muted">Periode penjualan tiket sebaiknya berakhir sebelum acara dimulai.</p>
          {fieldErrors.sale_end_at ? <p className="mt-2 text-xs font-semibold text-danger">{fieldErrors.sale_end_at}</p> : null}
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-navy" htmlFor="ticket-description">Deskripsi</label>
          <input className="input-field" id="ticket-description" name="description" onChange={handleChange} placeholder="Deskripsi" value={form.description} />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row lg:col-span-2">
          <button className="btn-primary w-full sm:w-auto" disabled={saving} type="submit">
            <Plus size={16} />
            {saving ? (editingId ? "Memperbarui..." : "Menyimpan...") : editingId ? "Perbarui" : "Simpan"}
          </button>
          {editingId ? (
            <button className="btn-secondary w-full sm:w-auto" onClick={handleCancelEdit} type="button">
              <X size={16} />
              Batal Edit
            </button>
          ) : null}
        </div>
      </form>

      <div className="surface-card overflow-hidden">
        {loading ? <div className="p-8 text-center text-sm font-semibold text-muted">Memuat jenis tiket...</div> : null}
        {!loading ? (
          <div className="divide-y divide-line">
            {ticketTypes.map((ticketType) => (
              <div className="grid gap-4 p-5 xl:grid-cols-[1fr_180px_120px_120px_140px] xl:items-center" key={ticketType.id}>
                <div>
                  <p className="font-bold text-navy">{ticketType.name}</p>
                  <p className="mt-1 text-sm text-muted">{ticketType.event?.title || "-"}</p>
                </div>
                <p className="text-sm font-bold text-navy">{formatCurrency(Number(ticketType.price))}</p>
                <p className="text-sm text-muted">Kuota {ticketType.quota}</p>
                <p className="text-sm text-muted">Terjual {ticketType.sold_quantity}</p>
                <div className="flex gap-2 xl:justify-end">
                  <button className="btn-secondary px-3 py-2" onClick={() => handleEdit(ticketType)} type="button">
                    <Edit3 size={16} />
                  </button>
                  <button className="btn-secondary px-3 py-2 text-danger" onClick={() => setDeleteTarget(ticketType)} type="button">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
            {ticketTypes.length === 0 ? <div className="p-8 text-center text-sm text-muted">Belum ada jenis tiket.</div> : null}
          </div>
        ) : null}
      </div>

      {deleteTarget ? (
        <ConfirmModal
          loading={deleteLoading}
          message={`Apakah Anda yakin ingin menghapus jenis tiket "${deleteTarget.name}"? Data yang dihapus tidak dapat dikembalikan.`}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          title="Hapus jenis tiket"
        />
      ) : null}
    </div>
  );
}

export default ManageTicketTypes;
