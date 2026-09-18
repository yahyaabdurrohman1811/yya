import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Ship, 
  Award, 
  Phone, 
  Calendar, 
  X, 
  Save, 
  Loader2, 
  UserCheck, 
  Clock, 
  Coffee,
  ShieldAlert
} from 'lucide-react';
import { CrewMember, CrewRole, CrewStatus, Vessel } from '../types';
import { createCrew, updateCrew, deleteCrew } from '../services/firestoreService';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';

interface CrewModuleProps {
  crews: CrewMember[];
  vessels: Vessel[];
  onNotify: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

export const CrewModule: React.FC<CrewModuleProps> = ({
  crews,
  vessels,
  onNotify
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCrew, setEditingCrew] = useState<CrewMember | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<CrewMember | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form states
  const [formName, setFormName] = useState('');
  const [formSeamanBook, setFormSeamanBook] = useState('');
  const [formRole, setFormRole] = useState<CrewRole>('Mualim I (Chief Officer)');
  const [formVesselName, setFormVesselName] = useState('');
  const [formCertValidity, setFormCertValidity] = useState('2028-12-31');
  const [formStatus, setFormStatus] = useState<CrewStatus>('on_board');
  const [formPhone, setFormPhone] = useState('+62 812-');

  // Form errors
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  const resetForm = () => {
    setFormName('');
    setFormSeamanBook('');
    setFormRole('Mualim I (Chief Officer)');
    setFormVesselName(vessels.length > 0 ? vessels[0].name : '');
    setFormCertValidity('2028-12-31');
    setFormStatus('on_board');
    setFormPhone('+62 812-');
    setFormErrors({});
    setEditingCrew(null);
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (crew: CrewMember) => {
    setEditingCrew(crew);
    setFormName(crew.fullName);
    setFormSeamanBook(crew.seamanBookNo);
    setFormRole(crew.role);
    setFormVesselName(crew.vesselName);
    setFormCertValidity(crew.certificateValidity);
    setFormStatus(crew.status);
    setFormPhone(crew.contactPhone);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    if (!formName.trim() || formName.trim().length < 3) {
      errors.name = 'Nama lengkap pelaut minimal 3 karakter.';
    }

    if (!formSeamanBook.trim() || formSeamanBook.trim().length < 4) {
      errors.seamanBook = 'Nomor buku pelaut resmi wajib diisi.';
    }

    if (!formCertValidity) {
      errors.certValidity = 'Masa berlaku sertifikasi CoC/STCW wajib diisi.';
    }

    if (!formPhone.trim() || formPhone.trim().length < 8) {
      errors.phone = 'Nomor kontak darurat minimal 8 karakter.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const crewPayload = {
        fullName: formName.trim(),
        seamanBookNo: formSeamanBook.trim().toUpperCase(),
        role: formRole,
        vesselName: formVesselName.trim() || 'Cadangan Armada',
        certificateValidity: formCertValidity,
        status: formStatus,
        contactPhone: formPhone.trim(),
      };

      if (editingCrew) {
        await updateCrew(editingCrew.id, crewPayload);
        onNotify('success', 'Personil Diperbarui', `Data kru "${crewPayload.fullName}" berhasil diperbarui di Firestore.`);
      } else {
        await createCrew(crewPayload);
        onNotify('success', 'Pelaut Didaftarkan', `Awak kapal "${crewPayload.fullName}" berhasil ditambahkan ke manifes kru.`);
      }

      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      console.error("Error saving crew:", err);
      onNotify('error', 'Gagal Menyimpan Data', 'Terjadi kesalahan saat menyimpan awak kapal.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      await deleteCrew(deleteTarget.id);
      onNotify('success', 'Kru Dihapus', `Data awak kapal "${deleteTarget.fullName}" berhasil dihapus.`);
      setDeleteTarget(null);
    } catch (err) {
      console.error("Error deleting crew:", err);
      onNotify('error', 'Gagal Menghapus', 'Tidak dapat menghapus data awak kapal.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter
  const filteredCrew = useMemo(() => {
    return crews.filter((c) => {
      const matchSearch =
        c.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.seamanBookNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.vesselName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.role.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus = statusFilter === 'all' || c.status === statusFilter;
      const matchRole = roleFilter === 'all' || c.role === roleFilter;

      return matchSearch && matchStatus && matchRole;
    });
  }, [crews, searchQuery, statusFilter, roleFilter]);

  const getStatusBadge = (status: CrewStatus) => {
    switch (status) {
      case 'on_board':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
            Bertugas On-Board
          </span>
        );
      case 'on_leave':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Coffee className="w-3.5 h-3.5 text-blue-600" />
            Cuti Darat
          </span>
        );
      case 'standby':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Siaga Penugasan
          </span>
        );
    }
  };

  return (
    <div id="crew-module" className="space-y-6">
      {/* Control bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex-1 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="crew-search-input"
              type="text"
              placeholder="Cari nama pelaut, no. buku pelaut, jabatan, atau kapal..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          <select
            id="crew-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="all">Semua Status Penugasan</option>
            <option value="on_board">Bertugas On-Board</option>
            <option value="on_leave">Cuti Darat</option>
            <option value="standby">Siaga Penugasan</option>
          </select>

          <select
            id="crew-role-filter"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="all">Semua Jabatan Kapal</option>
            <option value="Nakhoda / Master">Nakhoda / Master</option>
            <option value="Mualim I (Chief Officer)">Mualim I (Chief Officer)</option>
            <option value="KKM (Chief Engineer)">KKM (Chief Engineer)</option>
            <option value="Bosun / Serang">Bosun / Serang</option>
            <option value="Juru Mudi (Able Seaman)">Juru Mudi (Able Seaman)</option>
            <option value="Juru Minyak (Oiler)">Juru Minyak (Oiler)</option>
          </select>
        </div>

        <button
          id="add-crew-btn"
          type="button"
          onClick={handleOpenAddModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs shadow-blue-600/30 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Daftarkan Awak Kapal</span>
        </button>
      </div>

      {/* Crew Cards */}
      {filteredCrew.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">Tidak ada data awak kapal yang cocok</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Silakan sesuaikan filter pencarian atau tambahkan awak kapal baru.
          </p>
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Personil Pertama</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCrew.map((crew) => (
            <div
              key={crew.id}
              id={`crew-card-${crew.id}`}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-blue-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{crew.fullName}</h4>
                    <span className="text-xs font-semibold text-blue-700 block mt-0.5">{crew.role}</span>
                  </div>
                  <div>{getStatusBadge(crew.status)}</div>
                </div>

                <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-semibold">Buku Pelaut:</span>
                    <strong className="text-slate-800 font-mono">{crew.seamanBookNo}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-semibold">Penugasan:</span>
                    <span className="font-semibold text-slate-800 truncate max-w-[170px]">
                      {crew.vesselName || 'Standby Cadangan'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-semibold">Berlaku CoC:</span>
                    <span className="text-slate-700">{crew.certificateValidity}</span>
                  </div>
                </div>

                <div className="mt-3 text-xs text-slate-600 flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>Kontak: {crew.contactPhone}</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  ID: {crew.id.slice(0, 6)}...
                </span>
                <div className="flex items-center gap-2">
                  <button
                    id={`edit-crew-${crew.id}`}
                    type="button"
                    onClick={() => handleOpenEditModal(crew)}
                    className="p-1.5 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                    title="Edit Kru"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    id={`delete-crew-${crew.id}`}
                    type="button"
                    onClick={() => setDeleteTarget(crew)}
                    className="p-1.5 text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                    title="Hapus Kru"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT CREW MODAL */}
      {isModalOpen && (
        <div id="crew-form-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingCrew ? 'Perbarui Data Awak Kapal' : 'Pendaftaran Pelaut Baru'}
                  </h3>
                  <p className="text-xs text-slate-500">Standar Sertifikasi Maritim STCW & CoC</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Nama Lengkap */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Lengkap & Gelar Maritim <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="form-crew-name"
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Contoh: Capt. Hendra Gunawan, M.Mar"
                    className={`w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border rounded-xl focus:outline-none focus:bg-white ${
                      formErrors.name ? 'border-rose-400 ring-1 ring-rose-400' : 'border-slate-200 focus:ring-2 focus:ring-blue-500'
                    }`}
                  />
                  {formErrors.name && <p className="text-[11px] text-rose-500 mt-1">{formErrors.name}</p>}
                </div>

                {/* Nomor Buku Pelaut */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    No. Buku Pelaut (Seaman Book) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="form-crew-seamanbook"
                    type="text"
                    value={formSeamanBook}
                    onChange={(e) => setFormSeamanBook(e.target.value.toUpperCase())}
                    placeholder="ID-089123-A"
                    className={`w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border rounded-xl focus:outline-none focus:bg-white ${
                      formErrors.seamanBook ? 'border-rose-400 ring-1 ring-rose-400' : 'border-slate-200 focus:ring-2 focus:ring-blue-500'
                    }`}
                  />
                  {formErrors.seamanBook && <p className="text-[11px] text-rose-500 mt-1">{formErrors.seamanBook}</p>}
                </div>

                {/* Jabatan Kapal */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jabatan Kapal (Rank / Role)
                  </label>
                  <select
                    id="form-crew-role"
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as CrewRole)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="Nakhoda / Master">Nakhoda / Master</option>
                    <option value="Mualim I (Chief Officer)">Mualim I (Chief Officer)</option>
                    <option value="Mualim II (Second Officer)">Mualim II (Second Officer)</option>
                    <option value="KKM (Chief Engineer)">KKM (Chief Engineer)</option>
                    <option value="Masinis II (Second Engineer)">Masinis II (Second Engineer)</option>
                    <option value="Bosun / Serang">Bosun / Serang</option>
                    <option value="Juru Mudi (Able Seaman)">Juru Mudi (Able Seaman)</option>
                    <option value="Juru Minyak (Oiler)">Juru Minyak (Oiler)</option>
                  </select>
                </div>

                {/* Kapal Penugasan */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kapal Penugasan
                  </label>
                  {vessels.length > 0 ? (
                    <select
                      id="form-crew-vessel-select"
                      value={formVesselName}
                      onChange={(e) => setFormVesselName(e.target.value)}
                      className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    >
                      <option value="">Cadangan Armada (Standby)</option>
                      {vessels.map((v) => (
                        <option key={v.id} value={v.name}>
                          {v.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={formVesselName}
                      onChange={(e) => setFormVesselName(e.target.value)}
                      placeholder="Nama kapal"
                      className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  )}
                </div>

                {/* Status Penugasan */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status Tugas
                  </label>
                  <select
                    id="form-crew-status"
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as CrewStatus)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="on_board">Bertugas On-Board</option>
                    <option value="on_leave">Cuti Darat</option>
                    <option value="standby">Siaga Penugasan</option>
                  </select>
                </div>

                {/* Masa Berlaku Sertifikat */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Berlaku Sertifikat STCW/CoC <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="form-crew-cert"
                    type="date"
                    value={formCertValidity}
                    onChange={(e) => setFormCertValidity(e.target.value)}
                    className={`w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border rounded-xl focus:outline-none focus:bg-white ${
                      formErrors.certValidity ? 'border-rose-400 ring-1 ring-rose-400' : 'border-slate-200 focus:ring-2 focus:ring-blue-500'
                    }`}
                  />
                  {formErrors.certValidity && <p className="text-[11px] text-rose-500 mt-1">{formErrors.certValidity}</p>}
                </div>

                {/* Nomor Telepon Darurat */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nomor Telepon / Darurat <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="form-crew-phone"
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="+62 812-8899-2311"
                    className={`w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border rounded-xl focus:outline-none focus:bg-white ${
                      formErrors.phone ? 'border-rose-400 ring-1 ring-rose-400' : 'border-slate-200 focus:ring-2 focus:ring-blue-500'
                    }`}
                  />
                  {formErrors.phone && <p className="text-[11px] text-rose-500 mt-1">{formErrors.phone}</p>}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  id="save-crew-submit-btn"
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs shadow-blue-600/30 transition-colors disabled:opacity-60 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menyimpan ke Firestore...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>{editingCrew ? 'Simpan Perubahan' : 'Daftarkan Pelaut'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      <DeleteConfirmationModal
        isOpen={!!deleteTarget}
        title="Hapus Personil Awak Kapal"
        itemName={deleteTarget?.fullName || ''}
        itemType="Personil Pelaut"
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
