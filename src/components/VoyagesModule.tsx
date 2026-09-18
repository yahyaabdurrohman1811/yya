import React, { useState, useMemo } from 'react';
import { 
  Compass, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Calendar, 
  Ship, 
  Fuel, 
  Weight, 
  ArrowRight, 
  X, 
  Save, 
  Loader2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  PlayCircle
} from 'lucide-react';
import { Voyage, VoyageStatus, Vessel } from '../types';
import { createVoyage, updateVoyage, deleteVoyage } from '../services/firestoreService';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';

interface VoyagesModuleProps {
  voyages: Voyage[];
  vessels: Vessel[];
  onNotify: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

export const VoyagesModule: React.FC<VoyagesModuleProps> = ({ voyages, vessels, onNotify }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVoyage, setEditingVoyage] = useState<Voyage | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<Voyage | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form states
  const [formVoyageNo, setFormVoyageNo] = useState('');
  const [formVesselName, setFormVesselName] = useState('');
  const [formOrigin, setFormOrigin] = useState('Pelabuhan Tanjung Priok (Jakarta)');
  const [formDestination, setFormDestination] = useState('Pelabuhan Tanjung Perak (Surabaya)');
  const [formEtd, setFormEtd] = useState('');
  const [formEta, setFormEta] = useState('');
  const [formStatus, setFormStatus] = useState<VoyageStatus>('scheduled');
  const [formCargoLoad, setFormCargoLoad] = useState('10000');
  const [formFuel, setFormFuel] = useState('90');
  const [formNotes, setFormNotes] = useState('');

  // Form error state
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  const resetForm = () => {
    const now = new Date();
    const defaultEtd = new Date(now.getTime() + 24 * 3600 * 1000).toISOString().slice(0, 16);
    const defaultEta = new Date(now.getTime() + 72 * 3600 * 1000).toISOString().slice(0, 16);

    setFormVoyageNo('');
    setFormVesselName(vessels.length > 0 ? vessels[0].name : '');
    setFormOrigin('Pelabuhan Tanjung Priok (Jakarta)');
    setFormDestination('Pelabuhan Tanjung Perak (Surabaya)');
    setFormEtd(defaultEtd);
    setFormEta(defaultEta);
    setFormStatus('scheduled');
    setFormCargoLoad('5000');
    setFormFuel('90');
    setFormNotes('');
    setFormErrors({});
    setEditingVoyage(null);
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (voyage: Voyage) => {
    setEditingVoyage(voyage);
    setFormVoyageNo(voyage.voyageNumber);
    setFormVesselName(voyage.vesselName);
    setFormOrigin(voyage.originPort);
    setFormDestination(voyage.destinationPort);
    setFormEtd(voyage.departureDate);
    setFormEta(voyage.arrivalDate);
    setFormStatus(voyage.status);
    setFormCargoLoad(voyage.cargoLoadTon.toString());
    setFormFuel(voyage.fuelRemainingPercent ? voyage.fuelRemainingPercent.toString() : '90');
    setFormNotes(voyage.notes || '');
    setFormErrors({});
    setIsModalOpen(true);
  };

  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    if (!formVoyageNo.trim() || formVoyageNo.trim().length < 3) {
      errors.voyageNo = 'Nomor trayek/voyage wajib diisi (minimal 3 karakter).';
    }

    if (!formVesselName.trim()) {
      errors.vesselName = 'Nama kapal penugasan wajib dipilih.';
    }

    if (!formOrigin.trim()) {
      errors.origin = 'Pelabuhan tolak/keberangkatan wajib diisi.';
    }

    if (!formDestination.trim()) {
      errors.destination = 'Pelabuhan tujuan sandar wajib diisi.';
    }

    if (formOrigin.trim().toLowerCase() === formDestination.trim().toLowerCase()) {
      errors.destination = 'Pelabuhan tujuan tidak boleh sama dengan pelabuhan asal.';
    }

    if (!formEtd) {
      errors.etd = 'Waktu keberangkatan (ETD) wajib diisi.';
    }

    if (!formEta) {
      errors.eta = 'Estimasi waktu kedatangan (ETA) wajib diisi.';
    }

    if (formEtd && formEta) {
      const etdTime = new Date(formEtd).getTime();
      const etaTime = new Date(formEta).getTime();
      if (etaTime <= etdTime) {
        errors.eta = 'Waktu kedatangan (ETA) harus setelah waktu keberangkatan (ETD).';
      }
    }

    const numCargo = Number(formCargoLoad);
    if (isNaN(numCargo) || numCargo < 0) {
      errors.cargoLoad = 'Muatan kargo harus berupa angka valid (minimal 0 ton).';
    }

    const numFuel = Number(formFuel);
    if (isNaN(numFuel) || numFuel < 0 || numFuel > 100) {
      errors.fuel = 'Bahan bakar harus berkisar antara 0% dan 100%.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const matchedVessel = vessels.find((v) => v.name === formVesselName);

      const voyagePayload = {
        voyageNumber: formVoyageNo.trim().toUpperCase(),
        vesselId: matchedVessel?.id || 'vessel-manual',
        vesselName: formVesselName.trim(),
        originPort: formOrigin.trim(),
        destinationPort: formDestination.trim(),
        departureDate: formEtd,
        arrivalDate: formEta,
        status: formStatus,
        cargoLoadTon: Number(formCargoLoad),
        fuelRemainingPercent: Number(formFuel),
        notes: formNotes.trim(),
      };

      if (editingVoyage) {
        await updateVoyage(editingVoyage.id, voyagePayload);
        onNotify('success', 'Jadwal Diperbarui', `Jadwal rute ${voyagePayload.voyageNumber} berhasil diperbarui.`);
      } else {
        await createVoyage(voyagePayload);
        onNotify('success', 'Jadwal Dibuat', `Jadwal baru ${voyagePayload.voyageNumber} berhasil disimpan ke Firestore.`);
      }

      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      console.error("Error saving voyage:", err);
      onNotify('error', 'Gagal Menyimpan Jadwal', 'Terjadi masalah saat menyimpan jadwal pelayaran ke Firestore.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      await deleteVoyage(deleteTarget.id);
      onNotify('success', 'Jadwal Dihapus', `Jadwal ${deleteTarget.voyageNumber} berhasil dihapus dari database.`);
      setDeleteTarget(null);
    } catch (err) {
      console.error("Error deleting voyage:", err);
      onNotify('error', 'Gagal Menghapus', 'Tidak dapat menghapus jadwal pelayaran.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter
  const filteredVoyages = useMemo(() => {
    return voyages.filter((v) => {
      const matchSearch =
        v.voyageNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.vesselName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.originPort.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.destinationPort.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchStatus = statusFilter === 'all' || v.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [voyages, searchQuery, statusFilter]);

  const getStatusBadge = (status: VoyageStatus) => {
    switch (status) {
      case 'in_transit':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
            <PlayCircle className="w-3 h-3 text-sky-600 animate-pulse" />
            Dalam Perjalanan
          </span>
        );
      case 'scheduled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Clock className="w-3 h-3 text-blue-600" />
            Dijadwalkan
          </span>
        );
      case 'arrived':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Tiba di Tujuan
          </span>
        );
      case 'delayed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle className="w-3 h-3 text-rose-600" />
            Tertunda (Delayed)
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <CheckCircle2 className="w-3 h-3 text-slate-500" />
            Selesai
          </span>
        );
    }
  };

  const formatDate = (isoString: string) => {
    if (!isoString) return '-';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div id="voyages-module" className="space-y-6">
      {/* Control bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex-1 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="voyage-search-input"
              type="text"
              placeholder="Cari nomor voyage, nama kapal, atau rute pelabuhan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          <select
            id="voyage-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="all">Semua Status Rute</option>
            <option value="scheduled">Dijadwalkan</option>
            <option value="in_transit">Dalam Perjalanan</option>
            <option value="arrived">Tiba di Tujuan</option>
            <option value="delayed">Tertunda</option>
            <option value="completed">Selesai</option>
          </select>
        </div>

        <button
          id="add-voyage-btn"
          type="button"
          onClick={handleOpenAddModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs shadow-blue-600/30 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Jadwalkan Pelayaran Baru</span>
        </button>
      </div>

      {/* Voyages Cards */}
      {filteredVoyages.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Compass className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">Tidak ada jadwal pelayaran ditemukan</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Belum ada rute pelayaran yang cocok dengan pencarian Anda.
          </p>
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Jadwal Pertama</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredVoyages.map((voyage) => (
            <div
              key={voyage.id}
              id={`voyage-card-${voyage.id}`}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-blue-300 transition-all"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Left section: Voyage code & Ship */}
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                      {voyage.voyageNumber}
                    </span>
                    {getStatusBadge(voyage.status)}
                  </div>

                  <div className="mt-2 flex items-center gap-2 text-sm font-bold text-slate-800">
                    <Ship className="w-4 h-4 text-slate-500" />
                    <span>{voyage.vesselName}</span>
                  </div>

                  {/* Route Bar */}
                  <div className="mt-3 flex items-center gap-2 text-xs sm:text-sm">
                    <span className="font-semibold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 truncate">
                      {voyage.originPort}
                    </span>
                    <ArrowRight className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="font-semibold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 truncate">
                      {voyage.destinationPort}
                    </span>
                  </div>
                </div>

                {/* Center section: Dates (ETD / ETA) */}
                <div className="grid grid-cols-2 gap-3 lg:border-l lg:border-r border-slate-100 lg:px-6 py-2">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Waktu Tolak (ETD)</span>
                    <span className="text-xs font-semibold text-slate-800">{formatDate(voyage.departureDate)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Estimasi Tiba (ETA)</span>
                    <span className="text-xs font-semibold text-slate-800">{formatDate(voyage.arrivalDate)}</span>
                  </div>
                </div>

                {/* Right section: Cargo load & Actions */}
                <div className="flex items-center justify-between lg:justify-end gap-6 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                  <div className="text-xs space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Weight className="w-3.5 h-3.5 text-slate-400" />
                      <span>Muatan: <strong>{voyage.cargoLoadTon.toLocaleString()} Ton</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Fuel className="w-3.5 h-3.5 text-amber-500" />
                      <span>BBM: <strong>{voyage.fuelRemainingPercent}%</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      id={`edit-voyage-${voyage.id}`}
                      type="button"
                      onClick={() => handleOpenEditModal(voyage)}
                      className="p-2 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                      title="Edit Jadwal"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      id={`delete-voyage-${voyage.id}`}
                      type="button"
                      onClick={() => setDeleteTarget(voyage)}
                      className="p-2 text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                      title="Hapus Jadwal"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {voyage.notes && (
                <div className="mt-3 text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <strong className="text-slate-700">Catatan Navigasi:</strong> {voyage.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT VOYAGE MODAL */}
      {isModalOpen && (
        <div id="voyage-form-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingVoyage ? 'Perbarui Jadwal Pelayaran' : 'Buat Rute & Jadwal Pelayaran'}
                  </h3>
                  <p className="text-xs text-slate-500">Validasi tanggal ETD dan ETA navigasi</p>
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
                {/* Nomor Voyage */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nomor Trayek (Voyage No.) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="form-voyage-number"
                    type="text"
                    value={formVoyageNo}
                    onChange={(e) => setFormVoyageNo(e.target.value.toUpperCase())}
                    placeholder="VY-2026-JKT-SBY-01"
                    className={`w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border rounded-xl focus:outline-none focus:bg-white ${
                      formErrors.voyageNo ? 'border-rose-400 ring-1 ring-rose-400' : 'border-slate-200 focus:ring-2 focus:ring-blue-500'
                    }`}
                  />
                  {formErrors.voyageNo && <p className="text-[11px] text-rose-500 mt-1">{formErrors.voyageNo}</p>}
                </div>

                {/* Kapal yang Ditugaskan */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kapal Armada <span className="text-rose-500">*</span>
                  </label>
                  {vessels.length > 0 ? (
                    <select
                      id="form-voyage-vessel-select"
                      value={formVesselName}
                      onChange={(e) => setFormVesselName(e.target.value)}
                      className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    >
                      {vessels.map((v) => (
                        <option key={v.id} value={v.name}>
                          {v.name} ({v.type})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={formVesselName}
                      onChange={(e) => setFormVesselName(e.target.value)}
                      placeholder="Masukkan nama kapal"
                      className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  )}
                  {formErrors.vesselName && <p className="text-[11px] text-rose-500 mt-1">{formErrors.vesselName}</p>}
                </div>

                {/* Pelabuhan Asal */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pelabuhan Keberangkatan (Origin) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="form-voyage-origin"
                    type="text"
                    value={formOrigin}
                    onChange={(e) => setFormOrigin(e.target.value)}
                    placeholder="Pelabuhan Tanjung Priok (Jakarta)"
                    className={`w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border rounded-xl focus:outline-none focus:bg-white ${
                      formErrors.origin ? 'border-rose-400 ring-1 ring-rose-400' : 'border-slate-200 focus:ring-2 focus:ring-blue-500'
                    }`}
                  />
                  {formErrors.origin && <p className="text-[11px] text-rose-500 mt-1">{formErrors.origin}</p>}
                </div>

                {/* Pelabuhan Tujuan */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pelabuhan Sandar (Destination) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="form-voyage-destination"
                    type="text"
                    value={formDestination}
                    onChange={(e) => setFormDestination(e.target.value)}
                    placeholder="Pelabuhan Tanjung Perak (Surabaya)"
                    className={`w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border rounded-xl focus:outline-none focus:bg-white ${
                      formErrors.destination ? 'border-rose-400 ring-1 ring-rose-400' : 'border-slate-200 focus:ring-2 focus:ring-blue-500'
                    }`}
                  />
                  {formErrors.destination && <p className="text-[11px] text-rose-500 mt-1">{formErrors.destination}</p>}
                </div>

                {/* Waktu Tolak ETD */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Waktu Tolak / Keberangkatan (ETD) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="form-voyage-etd"
                    type="datetime-local"
                    value={formEtd}
                    onChange={(e) => setFormEtd(e.target.value)}
                    className={`w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border rounded-xl focus:outline-none focus:bg-white ${
                      formErrors.etd ? 'border-rose-400 ring-1 ring-rose-400' : 'border-slate-200 focus:ring-2 focus:ring-blue-500'
                    }`}
                  />
                  {formErrors.etd && <p className="text-[11px] text-rose-500 mt-1">{formErrors.etd}</p>}
                </div>

                {/* Estimasi Waktu Tiba ETA */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Estimasi Tiba (ETA) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="form-voyage-eta"
                    type="datetime-local"
                    value={formEta}
                    onChange={(e) => setFormEta(e.target.value)}
                    className={`w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border rounded-xl focus:outline-none focus:bg-white ${
                      formErrors.eta ? 'border-rose-400 ring-1 ring-rose-400' : 'border-slate-200 focus:ring-2 focus:ring-blue-500'
                    }`}
                  />
                  {formErrors.eta && <p className="text-[11px] text-rose-500 mt-1">{formErrors.eta}</p>}
                </div>

                {/* Status Pelayaran */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status Pelayaran
                  </label>
                  <select
                    id="form-voyage-status"
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as VoyageStatus)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="scheduled">Dijadwalkan</option>
                    <option value="in_transit">Dalam Perjalanan (In Transit)</option>
                    <option value="arrived">Tiba di Tujuan</option>
                    <option value="delayed">Tertunda (Delayed)</option>
                    <option value="completed">Selesai (Completed)</option>
                  </select>
                </div>

                {/* Beban Kargo */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Beban Muatan (Ton)
                  </label>
                  <input
                    id="form-voyage-cargo"
                    type="number"
                    min="0"
                    value={formCargoLoad}
                    onChange={(e) => setFormCargoLoad(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Bahan Bakar Tersisa */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Sisa BBM Bunker (%)
                  </label>
                  <input
                    id="form-voyage-fuel"
                    type="number"
                    min="0"
                    max="100"
                    value={formFuel}
                    onChange={(e) => setFormFuel(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Catatan */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Catatan Navigasi / Instruksi Khusus
                  </label>
                  <textarea
                    id="form-voyage-notes"
                    rows={2}
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="Contoh: Melewati Selat Sunda saat surut, waspada kabut tebal"
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white"
                  />
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
                  id="save-voyage-submit-btn"
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
                      <span>{editingVoyage ? 'Simpan Perubahan' : 'Terbitkan Jadwal'}</span>
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
        title="Hapus Jadwal Pelayaran"
        itemName={deleteTarget?.voyageNumber || ''}
        itemType="Jadwal Pelayaran"
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
