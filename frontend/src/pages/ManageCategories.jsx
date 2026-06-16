import { Edit3, Plus, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ConfirmModal from "../components/ui/ConfirmModal.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { categoryService } from "../services/categoryService.js";
import { getErrorMessage } from "../utils/errorMessage.js";
import { required } from "../utils/validation.js";

const emptyForm = {
  description: "",
  name: "",
};

function ManageCategories() {
  const [categories, setCategories] = useState([]);
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
      name: required(form.name, "Category name"),
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

  const loadCategories = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await categoryService.getCategories();
      setCategories(response.data.categories || []);
    } catch (requestError) {
      const message = getErrorMessage(requestError);
      setCategories([]);
      setError(message);
      showToast({ message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
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
    setForm(emptyForm);
    setEditingId("");
    setFieldErrors({});
  };

  const handleCancelEdit = () => {
    resetForm();
    showToast({ message: "Mode edit dibatalkan.", type: "info" });
  };

  const handleEdit = (category) => {
    setEditingId(category.id);
    setForm({
      description: category.description || "",
      name: category.name,
    });
    showToast({ message: "Mode edit kategori aktif.", type: "info" });
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

    try {
      if (isEditing) {
        await categoryService.updateCategory(editingId, form);
      } else {
        await categoryService.createCategory(form);
      }

      showToast({ message: isEditing ? "Data berhasil diperbarui." : "Data berhasil ditambahkan.", type: "success" });
      resetForm();
      await loadCategories();
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
      await categoryService.deleteCategory(deleteTarget.id);
      showToast({ message: "Data berhasil dihapus.", type: "success" });
      setDeleteTarget(null);
      await loadCategories();
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
        <p className="badge-category">Kategori</p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-navy">Kelola kategori</h1>
      </div>

      {error ? <div className="rounded-xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm font-semibold text-danger">{error}</div> : null}

      <form ref={formRef} className="surface-card grid scroll-mt-24 gap-4 p-4 sm:p-5 md:grid-cols-[1fr_1.5fr_auto]" noValidate onSubmit={handleSubmit}>
        <div className="flex flex-wrap items-center gap-3 md:col-span-3">
          <h2 className="text-xl font-extrabold tracking-tight text-navy">{editingId ? "Edit Kategori" : "Tambah Kategori"}</h2>
          {editingId ? <span className="badge-category">Mode Edit</span> : null}
        </div>
        <div>
          <input ref={firstInputRef} className={getInputClass("name")} name="name" onChange={handleChange} placeholder="Nama kategori" value={form.name} />
          {fieldErrors.name ? <p className="mt-2 text-xs font-semibold text-danger">{fieldErrors.name}</p> : null}
        </div>
        <input className="input-field" name="description" onChange={handleChange} placeholder="Deskripsi" value={form.description} />
        <div className="flex flex-col gap-2 sm:flex-row md:items-start">
          <button className="btn-primary w-full whitespace-nowrap sm:w-auto" disabled={saving} type="submit">
            <Plus size={16} />
            {saving ? (editingId ? "Memperbarui..." : "Menyimpan...") : editingId ? "Perbarui" : "Simpan"}
          </button>
          {editingId ? (
            <button className="btn-secondary w-full px-3 sm:w-auto" onClick={handleCancelEdit} type="button">
              <X size={16} />
              Batal Edit
            </button>
          ) : null}
        </div>
      </form>

      <div className="surface-card overflow-hidden">
        {loading ? <div className="p-8 text-center text-sm font-semibold text-muted">Memuat kategori...</div> : null}
        {!loading && error ? (
          <div className="p-8 text-center text-sm font-semibold text-danger">Gagal memuat kategori.</div>
        ) : null}
        {!loading && !error && categories.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-[640px] w-full text-left text-sm">
              <thead className="bg-soft text-xs font-semibold uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-5 py-4">Kategori</th>
                  <th className="px-5 py-4">Deskripsi</th>
                  <th className="px-5 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {categories.map((category) => (
                  <tr key={category.id}>
                    <td className="px-5 py-4">
                      <p className="max-w-xs break-words font-bold text-navy">{category.name}</p>
                    </td>
                    <td className="px-5 py-4 text-sm text-muted">
                      <p className="max-w-md break-words">{category.description || "-"}</p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button className="btn-secondary px-3 py-2" onClick={() => handleEdit(category)} type="button">
                          <Edit3 size={16} />
                        </button>
                        <button className="btn-secondary px-3 py-2 text-danger" onClick={() => setDeleteTarget(category)} type="button">
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
        {!loading && !error && categories.length === 0 ? <div className="p-8 text-center text-sm text-muted">Belum ada kategori.</div> : null}
      </div>

      {deleteTarget ? (
        <ConfirmModal
          loading={deleteLoading}
          message={`Apakah Anda yakin ingin menghapus kategori "${deleteTarget.name}"? Data yang dihapus tidak dapat dikembalikan.`}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          title="Hapus kategori"
        />
      ) : null}
    </div>
  );
}

export default ManageCategories;
