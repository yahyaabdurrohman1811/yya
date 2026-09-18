import React, { useState, useMemo } from 'react';
import { 
  Ship, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Anchor, 
  Layers, 
  Calendar, 
  Flag, 
  X, 
  Save, 
  Loader2,
  Navigation,
  Wrench,
  CheckCircle,
  Clock
} from 'lucide-react';
import { Vessel, VesselStatus, VesselType } from '../types';
import { createVessel, updateVessel, deleteVessel } from '../services/firestoreService';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';

interface VesselsModuleProps {
  vessels: Vessel[];
  onNotify: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

export const VesselsModule: React.FC<VesselsModuleProps> = ({ vessels, onNotify }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVessel, setEditingVessel] = useState<Vessel | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<Vessel | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form states
  const [formName, setFormName] = useState('');
  const [formImo, setFormImo] = useState('');
  const [formCallSign, setFormCallSign] = useState('');
  const [formType, setFormType] = useState<VesselType>('Kontainer');
  const [formCapacity, setFormCapacity] = useState<string>('15000');
  const [formTeu, setFormTeu] = useState<string>('');
  const [formYear, setFormYear] = useState<string>('2020');
  const [formFlag, setFormFlag] = useState('Indonesia');
  const [formStatus, setFormStatus] = useState<VesselStatus>('docked');
  const [formLocation, setFormLocation] = useState('');
  const [formHomePort, setFormHomePort] = useState('Tanjung Priok, Jakarta');

  // Form error states
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  const resetForm = () => {
    setFormName('');
    setFormImo('');
    setFormCallSign('');
    setFormType('Kontainer');
    setFormCapacity('15000');
    setFormTeu('');
    setFormYear('2020');
    setFormFlag('Indonesia');
    setFormStatus('docked');
    setFormLocation('');
    setFormHomePort('Tanjung Priok, Jakarta');
    setFormErrors({});
    setEditingVessel(null);
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (vessel: Vessel) => {
    setEditingVessel(vessel);
    setFormName(vessel.name);
    setFormImo(vessel.imoNumber);
    setFormCallSign(vessel.callSign || '');
    setFormType(vessel.type);
    setFormCapacity(vessel.capacityDwt.toString());
    setFormTeu(vessel.teuCapacity ? vessel.teuCapacity.toString() : '');
    setFormYear(vessel.yearBuilt.toString());
    setFormFlag(vessel.flag);
    setFormStatus(vessel.status);
    setFormLocation(vessel.currentLocation || '');
    setFormHomePort(vessel.homePort);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    if (!formName.trim() || formName.trim().length < 3) {
      errors.name = 'Nama kapal minimal harus 3 karakter.';
    }

    const cleanedImo = formImo.trim().replace(/\D/g, '');
    if (!cleanedImo || cleanedImo.length !== 7) {
      errors.imo = 'Nomor IMO harus tepat 7 digit angka standar maritim internasional.';
    }

    if (!formCallSign.trim()) {
      errors.callSign = 'Tanda panggilan (Call Sign) wajib diisi.';
    }

    const numCapacity = Number(formCapacity);
    if (isNaN(numCapacity) || numCapacity <= 0) {
      errors.capacity = 'Kapasitas DWT harus berupa angka positif lebih dari 0.';
    }

    const currentYear = new Date().getFullYear();
    const numYear = Number(formYear);
    if (isNaN(numYear) || numYear < 1960 || numYear > currentYear + 1) {
      errors.year = `Tahun pembuatan harus antara 1960 dan ${currentYear + 1}.`;
    }

    if (!formHomePort.trim()) {
      errors.homePort = 'Pelabuhan pangkalan induk wajib diisi.';
    }

    if (!formLocation.trim()) {
      errors.location = 'Posisi lokasi saat ini kapal wajib diisi.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const vesselPayload = {
        name: formName.trim(),
        imoNumber: formImo.trim(),
        callSign: formCallSign.trim().toUpperCase(),
        type: formType,
        capacityDwt: Number(formCapacity),
        teuCapacity: formTeu ? Number(formTeu) : undefined,
        yearBuilt: Number(formYear),
        flag: formFlag.trim(),
        status: formStatus,
        currentLocation: formLocation.trim(),
        homePort: formHomePort.trim(),
      };

      if (editingVessel) {
        await updateVessel(editingVessel.id, vesselPayload);
        onNotify('success', 'Armada Diperbarui', `Data kapal "${vesselPayload.name}" berhasil diperbarui di Firestore.`);
      } else {
        await createVessel(vesselPayload);
        onNotify('success', 'Kapal Ditambahkan', `Kapal baru "${vesselPayload.name}" berhasil didaftarkan ke armada.`);
      }

      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      console.error("Error saving vessel:", err);
      onNotify('error', 'Gagal Menyimpan Data', 'Terjadi kendala saat menyimpan data kapal ke Firestore.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      await deleteVessel(deleteTarget.id);
      onNotify('success', 'Kapal Dihapus', `Data kapal "${deleteTarget.name}" berhasil dihapus dari database.`);
      setDeleteTarget(null);
    } catch (err) {
      console.error("Error deleting vessel:", err);
      onNotify('error', 'Gagal Menghapus', 'Tidak dapat menghapus kapal dari Firestore.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered vessels
  const filteredVessels = useMemo(() => {
    return vessels.filter((v) => {
      const matchSearch =
        v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.imoNumber.includes(searchQuery) ||
        (v.callSign && v.callSign.toLowerCase().includes(searchQuery.toLowerCase())) ||
        v.homePort.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchStatus = statusFilter === 'all' || v.status === statusFilter;
      const matchType = typeFilter === 'all' || v.type === typeFilter;

      return matchSearch && matchStatus && matchType;
    });
  }, [vessels, searchQuery, statusFilter, typeFilter]);

  // Statistics
  const stats = useMemo(() => {
    return {
      total: vessels.length,
      underway: vessels.filter((v) => v.status === 'underway').length,
      docked: vessels.filter((v) => v.status === 'docked').length,
      maintenance: vessels.filter((v) => v.status === 'maintenance').length,
      standby: vessels.filter((v) => v.status === 'standby').length,
    };
  }, [vessels]);

  const getStatusBadge = (status: VesselStatus) => {
    switch (status) {
      case 'underway':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
            <Navigation className="w-3 h-3 text-sky-600 animate-pulse" />
            Sedang Berlayar
          </span>
        );
      case 'docked':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Anchor className="w-3 h-3 text-emerald-600" />
            Sandar di Dermaga
          </span>
        );
      case 'maintenance':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Wrench className="w-3 h-3 text-amber-600" />
            Perawatan Dok
          </span>
        );
      case 'standby':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <Clock className="w-3 h-3 text-slate-500" />
            Siaga / Labuh Jangkar
          </span>
        );
    }
  };

  return (
    <div id="vessels-module" className="space-y-6">
      {/* Top summary stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Ship className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 leading-tight">{stats.total}</div>
            <div className="text-xs font-medium text-slate-500">Total Armada Aktif</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
            <Navigation className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-sky-700 leading-tight">{stats.underway}</div>
            <div className="text-xs font-medium text-slate-500">Kapal di Laut (Underway)</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Anchor className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-700 leading-tight">{stats.docked}</div>
            <div className="text-xs font-medium text-slate-500">Sandar di Pelabuhan</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-700 leading-tight">{stats.maintenance}</div>
            <div className="text-xs font-medium text-slate-500">Dalam Perawatan Dok</div>
          </div>
        </div>
      </div>

      {/* Control bar: Search, Filters, Add button */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex-1 flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="vessel-search-input"
              type="text"
              placeholder="Cari kapal, nomor IMO, atau pelabuhan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>

          {/* Status Filter */}
          <select
            id="vessel-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="all">Semua Status Operasi</option>
            <option value="underway">Sedang Berlayar</option>
            <option value="docked">Sandar di Dermaga</option>
            <option value="maintenance">Perawatan Dok</option>
            <option value="standby">Siaga / Labuh Jangkar</option>
          </select>

          {/* Type Filter */}
          <select
            id="vessel-type-filter"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="all">Semua Tipe Kapal</option>
            <option value="Kontainer">Kontainer</option>
            <option value="Tanker Minyak">Tanker Minyak</option>
            <option value="Bulk Carrier (Curah)">Bulk Carrier</option>
            <option value="Kapal Ro-Ro">Kapal Ro-Ro</option>
            <option value="Tugboat & Tongkang">Tugboat & Tongkang</option>
          </select>
        </div>

        {/* Add Vessel Button */}
        <button
          id="add-vessel-btn"
          type="button"
          onClick={handleOpenAddModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs shadow-blue-600/30 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Kapal Baru</span>
        </button>
      </div>

      {/* Vessel List Table / Cards */}
      {filteredVessels.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Ship className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">Tidak ada kapal yang cocok</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchQuery || statusFilter !== 'all' || typeFilter !== 'all'
              ? 'Silakan sesuaikan kata kunci pencarian atau filter status Anda.'
              : 'Belum ada data kapal terdaftar di database Firestore.'}
          </p>
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Kapal Pertama</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredVessels.map((vessel) => (
            <div
              key={vessel.id}
              id={`vessel-card-${vessel.id}`}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-blue-300 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Card Header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-bold text-slate-900 hover:text-blue-600 transition-colors">
                        {vessel.name}
                      </h4>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                      <span>IMO: <strong className="text-slate-700">{vessel.imoNumber}</strong></span>
                      <span>&bull;</span>
                      <span>Call Sign: <strong className="text-slate-700">{vessel.callSign}</strong></span>
                      <span>&bull;</span>
                      <span className="inline-flex items-center gap-1">
                        <Flag className="w-3 h-3 text-slate-400" />
                        {vessel.flag}
                      </span>
                    </div>
                  </div>

                  <div>{getStatusBadge(vessel.status)}</div>
                </div>

                {/* Specs Pill Grid */}
                <div className="grid grid-cols-3 gap-2 mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Tipe Armada</span>
                    <span className="font-semibold text-slate-800">{vessel.type}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Kapasitas DWT</span>
                    <span className="font-semibold text-slate-800">{vessel.capacityDwt.toLocaleString()} Ton</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Tahun Buat</span>
                    <span className="font-semibold text-slate-800">{vessel.yearBuilt}</span>
                  </div>
                </div>

                {/* Locations Info */}
                <div className="mt-3.5 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Navigation className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>Posisi Terkini:</span>
                    <strong className="text-slate-800 font-semibold truncate">{vessel.currentLocation || 'Di Pelabuhan Pangkalan'}</strong>
                  </div>
                  <div className="flex items-center gap-2">
                    <Anchor className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Home Port:</span>
                    <span className="text-slate-700">{vessel.homePort}</span>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  ID: {vessel.id.slice(0, 8)}...
                </span>
                <div className="flex items-center gap-2">
                  <button
                    id={`edit-vessel-${vessel.id}`}
                    type="button"
                    onClick={() => handleOpenEditModal(vessel)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    id={`delete-vessel-${vessel.id}`}
                    type="button"
                    onClick={() => setDeleteTarget(vessel)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT VESSEL MODAL */}
      {isModalOpen && (
        <div id="vessel-form-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Ship className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingVessel ? 'Perbarui Data Kapal' : 'Registrasi Kapal Baru'}
                  </h3>
                  <p className="text-xs text-slate-500">Validasi standar International Maritime Organization</p>
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
                {/* Nama Kapal */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Kapal <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="form-vessel-name"
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Contoh: KM Samudera Perkasa XI"
                    className={`w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border rounded-xl focus:outline-none focus:bg-white ${
                      formErrors.name ? 'border-rose-400 ring-1 ring-rose-400' : 'border-slate-200 focus:ring-2 focus:ring-blue-500'
                    }`}
                  />
                  {formErrors.name && <p className="text-[11px] text-rose-500 mt-1">{formErrors.name}</p>}
                </div>

                {/* Nomor IMO */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nomor IMO (7 Digit) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="form-vessel-imo"
                    type="text"
                    maxLength={7}
                    value={formImo}
                    onChange={(e) => setFormImo(e.target.value.replace(/\D/g, ''))}
                    placeholder="Contoh: 9845124"
                    className={`w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border rounded-xl focus:outline-none focus:bg-white ${
                      formErrors.imo ? 'border-rose-400 ring-1 ring-rose-400' : 'border-slate-200 focus:ring-2 focus:ring-blue-500'
                    }`}
                  />
                  {formErrors.imo && <p className="text-[11px] text-rose-500 mt-1">{formErrors.imo}</p>}
                </div>

                {/* Call Sign */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tanda Panggilan (Call Sign) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="form-vessel-callsign"
                    type="text"
                    value={formCallSign}
                    onChange={(e) => setFormCallSign(e.target.value.toUpperCase())}
                    placeholder="Contoh: YBDA"
                    className={`w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border rounded-xl focus:outline-none focus:bg-white ${
                      formErrors.callSign ? 'border-rose-400 ring-1 ring-rose-400' : 'border-slate-200 focus:ring-2 focus:ring-blue-500'
                    }`}
                  />
                  {formErrors.callSign && <p className="text-[11px] text-rose-500 mt-1">{formErrors.callSign}</p>}
                </div>

                {/* Tipe Kapal */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tipe Kapal
                  </label>
                  <select
                    id="form-vessel-type"
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as VesselType)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="Kontainer">Kontainer</option>
                    <option value="Tanker Minyak">Tanker Minyak</option>
                    <option value="Bulk Carrier (Curah)">Bulk Carrier (Curah)</option>
                    <option value="Kapal Ro-Ro">Kapal Ro-Ro</option>
                    <option value="Tugboat & Tongkang">Tugboat & Tongkang</option>
                  </select>
                </div>

                {/* Status Kapal */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status Operasional
                  </label>
                  <select
                    id="form-vessel-status"
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as VesselStatus)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="docked">Sandar di Dermaga</option>
                    <option value="underway">Sedang Berlayar</option>
                    <option value="maintenance">Perawatan Dok</option>
                    <option value="standby">Siaga / Labuh Jangkar</option>
                  </select>
                </div>

                {/* Kapasitas DWT */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kapasitas DWT (Ton) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="form-vessel-capacity"
                    type="number"
                    min="1"
                    value={formCapacity}
                    onChange={(e) => setFormCapacity(e.target.value)}
                    placeholder="15000"
                    className={`w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border rounded-xl focus:outline-none focus:bg-white ${
                      formErrors.capacity ? 'border-rose-400 ring-1 ring-rose-400' : 'border-slate-200 focus:ring-2 focus:ring-blue-500'
                    }`}
                  />
                  {formErrors.capacity && <p className="text-[11px] text-rose-500 mt-1">{formErrors.capacity}</p>}
                </div>

                {/* Tahun Pembuatan */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tahun Pembuatan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="form-vessel-year"
                    type="number"
                    value={formYear}
                    onChange={(e) => setFormYear(e.target.value)}
                    placeholder="2020"
                    className={`w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border rounded-xl focus:outline-none focus:bg-white ${
                      formErrors.year ? 'border-rose-400 ring-1 ring-rose-400' : 'border-slate-200 focus:ring-2 focus:ring-blue-500'
                    }`}
                  />
                  {formErrors.year && <p className="text-[11px] text-rose-500 mt-1">{formErrors.year}</p>}
                </div>

                {/* Lokasi Sekarang */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Posisi / Lokasi Terkini <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="form-vessel-location"
                    type="text"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    placeholder="Contoh: Dermaga Berlian Tanjung Perak Surabaya / Laut Jawa"
                    className={`w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border rounded-xl focus:outline-none focus:bg-white ${
                      formErrors.location ? 'border-rose-400 ring-1 ring-rose-400' : 'border-slate-200 focus:ring-2 focus:ring-blue-500'
                    }`}
                  />
                  {formErrors.location && <p className="text-[11px] text-rose-500 mt-1">{formErrors.location}</p>}
                </div>

                {/* Home Port */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pelabuhan Pangkalan Induk (Home Port) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="form-vessel-homeport"
                    type="text"
                    value={formHomePort}
                    onChange={(e) => setFormHomePort(e.target.value)}
                    placeholder="Contoh: Tanjung Priok, Jakarta"
                    className={`w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border rounded-xl focus:outline-none focus:bg-white ${
                      formErrors.homePort ? 'border-rose-400 ring-1 ring-rose-400' : 'border-slate-200 focus:ring-2 focus:ring-blue-500'
                    }`}
                  />
                  {formErrors.homePort && <p className="text-[11px] text-rose-500 mt-1">{formErrors.homePort}</p>}
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
                  id="save-vessel-submit-btn"
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
                      <span>{editingVessel ? 'Simpan Perubahan' : 'Daftarkan Kapal'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      <DeleteConfirmationModal
        isOpen={!!deleteTarget}
        title="Hapus Data Kapal"
        itemName={deleteTarget?.name || ''}
        itemType="Kapal Armada"
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
