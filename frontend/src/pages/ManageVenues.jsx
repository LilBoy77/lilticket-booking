import { Edit3, Plus, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ConfirmModal from "../components/ui/ConfirmModal.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { venueService } from "../services/venueService.js";
import { getErrorMessage } from "../utils/errorMessage.js";
import { positiveNumber, required } from "../utils/validation.js";

const emptyForm = {
  address: "",
  capacity: "",
  city: "",
  name: "",
  province: "",
};

function ManageVenues() {
  const [venues, setVenues] = useState([]);
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

  const validateForm = () => {
    const nextErrors = {
      address: required(form.address, "Alamat"),
      capacity: positiveNumber(form.capacity, "Kapasitas"),
      city: required(form.city, "Kota"),
      name: required(form.name, "Nama venue"),
    };
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

  const loadVenues = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await venueService.getVenues();
      setVenues(response.data.venues || []);
    } catch (requestError) {
      const message = getErrorMessage(requestError);
      setVenues([]);
      setError(message);
      showToast({ message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVenues();
  }, []);

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
    setForm(emptyForm);
    setFieldErrors({});
  };

  const handleCancelEdit = () => {
    resetForm();
    showToast({ message: "Mode edit dibatalkan.", type: "info" });
  };

  const handleEdit = (venue) => {
    setEditingId(venue.id);
    setForm({
      address: venue.address,
      capacity: String(venue.capacity),
      city: venue.city,
      name: venue.name,
      province: venue.province || "",
    });
    showToast({ message: "Mode edit venue aktif.", type: "info" });
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
      capacity: Number(form.capacity),
    };

    try {
      if (isEditing) {
        await venueService.updateVenue(editingId, payload);
      } else {
        await venueService.createVenue(payload);
      }

      showToast({ message: isEditing ? "Data berhasil diperbarui." : "Data berhasil ditambahkan.", type: "success" });
      resetForm();
      await loadVenues();
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
      await venueService.deleteVenue(deleteTarget.id);
      showToast({ message: "Data berhasil dihapus.", type: "success" });
      setDeleteTarget(null);
      await loadVenues();
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
        <p className="badge-category">Venue</p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-navy">Kelola venue</h1>
      </div>

      {error ? <div className="rounded-xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm font-semibold text-danger">{error}</div> : null}

      <form ref={formRef} className="surface-card grid scroll-mt-24 gap-4 p-4 sm:p-5 lg:grid-cols-2" noValidate onSubmit={handleSubmit}>
        <div className="flex flex-wrap items-center gap-3 lg:col-span-2">
          <h2 className="text-xl font-extrabold tracking-tight text-navy">{editingId ? "Edit Venue" : "Tambah Venue"}</h2>
          {editingId ? <span className="badge-category">Mode Edit</span> : null}
        </div>
        <div>
          <input ref={firstInputRef} className={getInputClass("name")} name="name" onChange={handleChange} placeholder="Nama venue" value={form.name} />
          {fieldErrors.name ? <p className="mt-2 text-xs font-semibold text-danger">{fieldErrors.name}</p> : null}
        </div>
        <div>
          <input className={getInputClass("capacity")} min="1" name="capacity" onChange={handleChange} placeholder="Kapasitas" type="number" value={form.capacity} />
          {fieldErrors.capacity ? <p className="mt-2 text-xs font-semibold text-danger">{fieldErrors.capacity}</p> : null}
        </div>
        <div className="lg:col-span-2">
          <input className={getInputClass("address")} name="address" onChange={handleChange} placeholder="Alamat" value={form.address} />
          {fieldErrors.address ? <p className="mt-2 text-xs font-semibold text-danger">{fieldErrors.address}</p> : null}
        </div>
        <div>
          <input className={getInputClass("city")} name="city" onChange={handleChange} placeholder="Kota" value={form.city} />
          {fieldErrors.city ? <p className="mt-2 text-xs font-semibold text-danger">{fieldErrors.city}</p> : null}
        </div>
        <input className="input-field" name="province" onChange={handleChange} placeholder="Provinsi" value={form.province} />
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
        {loading ? <div className="p-8 text-center text-sm font-semibold text-muted">Memuat venue...</div> : null}
        {!loading && error ? (
          <div className="p-8 text-center text-sm font-semibold text-danger">Gagal memuat venue.</div>
        ) : null}
        {!loading && !error && venues.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-[760px] w-full text-left text-sm">
              <thead className="bg-soft text-xs font-semibold uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-5 py-4">Venue</th>
                  <th className="px-5 py-4">Alamat</th>
                  <th className="px-5 py-4">Kapasitas</th>
                  <th className="px-5 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {venues.map((venue) => (
                  <tr key={venue.id}>
                    <td className="px-5 py-4">
                      <p className="max-w-xs break-words font-bold text-navy">{venue.name}</p>
                      <p className="text-sm text-muted">{venue.city}{venue.province ? `, ${venue.province}` : ""}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="max-w-md break-words text-sm text-muted">{venue.address}</p>
                    </td>
                    <td className="px-5 py-4 text-sm font-bold text-navy">{venue.capacity}</td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button className="btn-secondary px-3 py-2" onClick={() => handleEdit(venue)} type="button">
                          <Edit3 size={16} />
                        </button>
                        <button className="btn-secondary px-3 py-2 text-danger" onClick={() => setDeleteTarget(venue)} type="button">
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
        {!loading && !error && venues.length === 0 ? <div className="p-8 text-center text-sm text-muted">Belum ada venue.</div> : null}
      </div>

      {deleteTarget ? (
        <ConfirmModal
          loading={deleteLoading}
          message={`Apakah Anda yakin ingin menghapus venue "${deleteTarget.name}"? Data yang dihapus tidak dapat dikembalikan.`}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          title="Hapus venue"
        />
      ) : null}
    </div>
  );
}

export default ManageVenues;
