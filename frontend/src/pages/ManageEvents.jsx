import { Edit3, Image, Plus, Search, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import ConfirmModal from "../components/ui/ConfirmModal.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { categoryService } from "../services/categoryService.js";
import { eventService } from "../services/eventService.js";
import { venueService } from "../services/venueService.js";
import { getErrorMessage } from "../utils/errorMessage.js";
import {
  isEndDateAfterStartDate,
  isRequired,
  optionalDate,
  optionalUrl,
  validDate,
  validateEnum,
} from "../utils/validation.js";
import { getStatusLabel } from "../utils/statusLabel.js";

const emptyForm = {
  category_id: "",
  description: "",
  end_at: "",
  poster_url: "",
  banner_url: "",
  start_at: "",
  status: "PUBLISHED",
  title: "",
  venue_id: "",
};

const eventStatuses = ["DRAFT", "PUBLISHED", "CANCELLED"];

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

function ManageEvents() {
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [venues, setVenues] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [posterPreviewFailed, setPosterPreviewFailed] = useState(false);
  const [bannerPreviewFailed, setBannerPreviewFailed] = useState(false);
  const formRef = useRef(null);
  const firstInputRef = useRef(null);
  const { showToast } = useToast();

  const validateForm = () => {
    const nextErrors = {
      poster_url: optionalUrl(form.poster_url, "URL poster"),
      banner_url: optionalUrl(form.banner_url, "URL banner"),
      category_id: isRequired(form.category_id) ? "" : "Kategori acara wajib dipilih.",
      description: !isRequired(form.description)
        ? "Deskripsi acara wajib diisi."
        : String(form.description).trim().length < 10
          ? "Deskripsi acara minimal 10 karakter."
          : "",
      end_at: optionalDate(form.end_at, "Tanggal selesai acara"),
      start_at: validDate(form.start_at, "Tanggal acara"),
      status: validateEnum(form.status, eventStatuses, "Status"),
      title: !isRequired(form.title)
        ? "Nama acara wajib diisi."
        : String(form.title).trim().length < 3
          ? "Nama acara minimal 3 karakter."
          : "",
      venue_id: isRequired(form.venue_id) ? "" : "Venue acara wajib dipilih.",
    };

    if (!nextErrors.start_at && !nextErrors.end_at && !isEndDateAfterStartDate(form.start_at, form.end_at)) {
      nextErrors.end_at = "Tanggal selesai acara harus lebih besar dari tanggal mulai acara.";
    }

    if (!editingId && !nextErrors.start_at && new Date(form.start_at) < new Date()) {
      nextErrors.start_at = "Tanggal mulai acara tidak boleh di masa lalu.";
    }

    const activeErrors = Object.fromEntries(Object.entries(nextErrors).filter(([, value]) => value));

    setFieldErrors(activeErrors);

    return Object.keys(activeErrors).length === 0;
  };

  const focusForm = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => firstInputRef.current?.focus({ preventScroll: true }), 300);
  };

  const getInputClass = (fieldName, extraClass = "") =>
    `${fieldErrors[fieldName] ? "input-field border-danger focus:border-danger focus:ring-danger/10" : "input-field"} ${extraClass}`.trim();

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const [eventsResponse, categoriesResponse, venuesResponse] = await Promise.all([
        eventService.getAdminEvents({ limit: 50, search: search.trim() || undefined }),
        categoryService.getCategories(),
        venueService.getVenues(),
      ]);

      setEvents(eventsResponse.data.events || []);
      setCategories(categoriesResponse.data.categories || []);
      setVenues(venuesResponse.data.venues || []);
    } catch (requestError) {
      const message = getErrorMessage(requestError);
      setEvents([]);
      setError(message);
      showToast({ message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search]);

  useEffect(() => {
    setPosterPreviewFailed(false);
  }, [form.poster_url]);

  useEffect(() => {
    setBannerPreviewFailed(false);
  }, [form.banner_url]);

  useEffect(() => {
    if (!form.category_id && categories[0]?.id) {
      setForm((currentForm) => ({ ...currentForm, category_id: categories[0].id }));
    }

    if (!form.venue_id && venues[0]?.id) {
      setForm((currentForm) => ({ ...currentForm, venue_id: venues[0].id }));
    }
  }, [categories, form.category_id, form.venue_id, venues]);

  const eventCountLabel = useMemo(() => `${events.length} acara dimuat`, [events.length]);
  const sameImageWarning =
    form.poster_url.trim() && form.banner_url.trim() && form.poster_url.trim() === form.banner_url.trim()
      ? "Sebaiknya poster dan banner menggunakan gambar yang berbeda."
      : "";

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
      category_id: categories[0]?.id || "",
      venue_id: venues[0]?.id || "",
    });
  };

  const handleCancelEdit = () => {
    resetForm();
    showToast({ message: "Mode edit dibatalkan.", type: "info" });
  };

  const handleEdit = (event) => {
    setEditingId(event.id);
    setForm({
      category_id: event.category.id,
      banner_url: event.banner_url || "",
      description: event.description || "",
      end_at: toDateTimeLocal(event.end_at),
      poster_url: event.poster_url || "",
      start_at: toDateTimeLocal(event.start_at),
      status: event.status,
      title: event.title,
      venue_id: event.venue.id,
    });
    showToast({ message: "Mode edit acara aktif.", type: "info" });
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
      end_at: toPayloadDate(form.end_at),
      start_at: toPayloadDate(form.start_at),
    };

    try {
      if (isEditing) {
        await eventService.updateEvent(editingId, payload);
        showToast({ message: "Data berhasil diperbarui.", type: "success" });
      } else {
        await eventService.createEvent(payload);
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
      await eventService.deleteEvent(deleteTarget.id);
      showToast({ message: "Data berhasil dihapus.", type: "success" });
      setDeleteTarget(null);
      await loadData();
    } catch (requestError) {
      const message = getErrorMessage(requestError);
      setError(message);
      showToast({ message: "Gagal menghapus data.", type: "error" });
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="badge-category">Acara</p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-navy">Kelola acara</h1>
        <p className="mt-2 text-sm text-muted">{eventCountLabel}</p>
      </div>

      {error ? <div className="rounded-xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm font-semibold text-danger">{error}</div> : null}

      <form ref={formRef} className="surface-card grid scroll-mt-24 gap-4 p-4 sm:p-5 lg:grid-cols-2" noValidate onSubmit={handleSubmit}>
        <div className="flex flex-wrap items-center gap-3 lg:col-span-2">
          <h2 className="text-xl font-extrabold tracking-tight text-navy">{editingId ? "Edit Acara" : "Tambah Acara"}</h2>
          {editingId ? <span className="badge-category">Mode Edit</span> : null}
        </div>
        <div className="lg:col-span-2">
          <label className="mb-2 block text-sm font-semibold text-navy" htmlFor="event-title">Nama Acara</label>
          <input ref={firstInputRef} className={getInputClass("title")} id="event-title" name="title" onChange={handleChange} placeholder="Nama acara" value={form.title} />
          {fieldErrors.title ? <p className="mt-2 text-xs font-semibold text-danger">{fieldErrors.title}</p> : null}
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-navy" htmlFor="event-category">Kategori Acara</label>
          <select className={getInputClass("category_id")} id="event-category" name="category_id" onChange={handleChange} value={form.category_id}>
            <option value="">Pilih kategori</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
          {fieldErrors.category_id ? <p className="mt-2 text-xs font-semibold text-danger">{fieldErrors.category_id}</p> : null}
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-navy" htmlFor="event-venue">Venue Acara</label>
          <select className={getInputClass("venue_id")} id="event-venue" name="venue_id" onChange={handleChange} value={form.venue_id}>
            <option value="">Pilih venue</option>
            {venues.map((venue) => <option key={venue.id} value={venue.id}>{venue.name} - {venue.city}</option>)}
          </select>
          {fieldErrors.venue_id ? <p className="mt-2 text-xs font-semibold text-danger">{fieldErrors.venue_id}</p> : null}
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-navy" htmlFor="event-start-at">Tanggal Mulai Acara</label>
          <input className={getInputClass("start_at")} id="event-start-at" name="start_at" onChange={handleChange} type="datetime-local" value={form.start_at} />
          <p className="mt-2 text-xs font-medium text-muted">Tanggal mulai acara adalah waktu acara mulai berlangsung.</p>
          {fieldErrors.start_at ? <p className="mt-2 text-xs font-semibold text-danger">{fieldErrors.start_at}</p> : null}
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-navy" htmlFor="event-end-at">Tanggal Selesai Acara</label>
          <input className={getInputClass("end_at")} id="event-end-at" name="end_at" onChange={handleChange} type="datetime-local" value={form.end_at} />
          <p className="mt-2 text-xs font-medium text-muted">Tanggal selesai acara adalah waktu acara berakhir.</p>
          {fieldErrors.end_at ? <p className="mt-2 text-xs font-semibold text-danger">{fieldErrors.end_at}</p> : null}
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-navy" htmlFor="event-status">Status Acara</label>
          <select className={getInputClass("status")} id="event-status" name="status" onChange={handleChange} value={form.status}>
            {eventStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
          {fieldErrors.status ? <p className="mt-2 text-xs font-semibold text-danger">{fieldErrors.status}</p> : null}
        </div>
        <section className="lg:col-span-2 rounded-3xl border border-line bg-white p-4 shadow-sm shadow-navy/5 sm:p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-extrabold tracking-tight text-navy">Media Acara</h2>
              <p className="mt-1 text-sm text-muted">Atur poster kecil dan background halaman detail acara.</p>
            </div>
            {sameImageWarning ? (
              <p className="rounded-xl border border-warning/20 bg-warning/10 px-3 py-2 text-xs font-semibold text-warning sm:max-w-xs">
                {sameImageWarning}
              </p>
            ) : null}
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <div className="rounded-2xl border border-line bg-soft/60 p-4">
              <label className="mb-2 block text-sm font-semibold text-navy" htmlFor="event-poster-url">URL Poster Acara</label>
              <input
                className={getInputClass("poster_url")}
                id="event-poster-url"
                name="poster_url"
                onChange={handleChange}
                placeholder="https://contoh.com/poster.jpg"
                value={form.poster_url}
              />
              <p className="mt-2 text-xs font-medium text-muted">Gunakan gambar vertikal untuk poster acara.</p>
              {fieldErrors.poster_url ? <p className="mt-2 text-xs font-semibold text-danger">{fieldErrors.poster_url}</p> : null}

              <div className="mt-4 flex justify-center">
                {form.poster_url && !fieldErrors.poster_url && !posterPreviewFailed ? (
                  <img
                    alt="Preview poster acara"
                    className="aspect-[3/4] max-h-[280px] w-full max-w-[210px] rounded-2xl border border-line object-cover"
                    onError={() => setPosterPreviewFailed(true)}
                    src={form.poster_url}
                  />
                ) : (
                  <div className="flex aspect-[3/4] max-h-[220px] w-full max-w-[170px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line bg-white px-4 text-center text-muted">
                    <Image size={28} strokeWidth={1.8} />
                    <p className="text-xs font-semibold">
                      {form.poster_url ? "Preview poster belum bisa dimuat." : "Poster acara belum diisi."}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-line bg-soft/60 p-4">
              <label className="mb-2 block text-sm font-semibold text-navy" htmlFor="event-banner-url">URL Banner / Background Acara</label>
              <input
                className={getInputClass("banner_url")}
                id="event-banner-url"
                name="banner_url"
                onChange={handleChange}
                placeholder="https://contoh.com/banner.jpg"
                value={form.banner_url}
              />
              <p className="mt-2 text-xs font-medium text-muted">Gunakan gambar horizontal untuk background halaman detail acara.</p>
              {fieldErrors.banner_url ? <p className="mt-2 text-xs font-semibold text-danger">{fieldErrors.banner_url}</p> : null}

              <div className="mt-4">
                {form.banner_url && !fieldErrors.banner_url && !bannerPreviewFailed ? (
                  <img
                    alt="Preview banner acara"
                    className="aspect-video max-h-[220px] w-full rounded-2xl border border-line object-cover"
                    onError={() => setBannerPreviewFailed(true)}
                    src={form.banner_url}
                  />
                ) : (
                  <div className="flex aspect-video max-h-[180px] w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line bg-white px-4 text-center text-muted">
                    <Image size={28} strokeWidth={1.8} />
                    <p className="text-xs font-semibold">
                      {form.banner_url ? "Preview banner belum bisa dimuat." : "Banner acara belum diisi."}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
        <div className="lg:col-span-2">
          <label className="mb-2 block text-sm font-semibold text-navy" htmlFor="event-description">Deskripsi Acara</label>
          <textarea className={getInputClass("description")} id="event-description" name="description" onChange={handleChange} placeholder="Deskripsi" rows={3} value={form.description} />
          {fieldErrors.description ? <p className="mt-2 text-xs font-semibold text-danger">{fieldErrors.description}</p> : null}
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

      <div className="surface-card flex flex-col gap-3 p-4 sm:p-5 md:flex-row md:items-center md:justify-between">
        <label className="relative block w-full md:max-w-md">
          <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
          <input className="input-field pl-11" onChange={(event) => setSearch(event.target.value)} placeholder="Cari acara" type="search" value={search} />
        </label>
        <p className="text-sm font-semibold text-muted">{eventCountLabel}</p>
      </div>

      <div className="surface-card overflow-hidden">
        {loading ? <div className="p-8 text-center text-sm font-semibold text-muted">Memuat acara...</div> : null}
        {!loading && error ? (
          <div className="p-8 text-center text-sm font-semibold text-danger">Gagal memuat acara.</div>
        ) : null}
        {!loading && !error && events.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-[760px] w-full text-left text-sm">
              <thead className="bg-soft text-xs font-semibold uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-5 py-4">Acara</th>
                  <th className="px-5 py-4">Kategori</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {events.map((event) => (
                  <tr key={event.id}>
                    <td className="px-5 py-4">
                      <p className="max-w-sm break-words font-bold text-navy">{event.title}</p>
                      <p className="mt-1 text-sm text-muted">{event.venue.name}, {event.venue.city}</p>
                    </td>
                    <td className="px-5 py-4 font-semibold text-primary-600">{event.category.name}</td>
                    <td className="px-5 py-4">
                      <span className={event.status === "PUBLISHED" ? "status-paid" : "status-pending"}>{getStatusLabel(event.status)}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button className="btn-secondary px-3 py-2" onClick={() => handleEdit(event)} type="button">
                          <Edit3 size={16} />
                        </button>
                        <button className="btn-secondary px-3 py-2 text-danger" onClick={() => setDeleteTarget(event)} type="button">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
        {!loading && !error && events.length === 0 ? <div className="p-8 text-center text-sm text-muted">Belum ada acara.</div> : null}
      </div>

      {deleteTarget ? (
        <ConfirmModal
          loading={deleteLoading}
          message={`Apakah Anda yakin ingin menghapus acara "${deleteTarget.title}"? Data yang dihapus tidak dapat dikembalikan.`}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          title="Hapus acara"
        />
      ) : null}
    </div>
  );
}

export default ManageEvents;
