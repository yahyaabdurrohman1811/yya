import React, { useState, useMemo } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Ship, 
  Weight, 
  FileText, 
  CheckCircle, 
  Clock, 
  Truck, 
  X, 
  Save, 
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Cargo, CargoStatus, CargoType, Vessel, Voyage } from '../types';
import { createCargo, updateCargo, deleteCargo } from '../services/firestoreService';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';

interface CargoModuleProps {
  cargos: Cargo[];
  vessels: Vessel[];
  voyages: Voyage[];
  onNotify: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

export const CargoModule: React.FC<CargoModuleProps> = ({
  cargos,
  vessels,
  voyages,
  onNotify
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCargo, setEditingCargo] = useState<Cargo | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<Cargo | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form states
  const [formBl, setFormBl] = useState('');
  const [formShipper, setFormShipper] = useState('');
  const [formConsignee, setFormConsignee] = useState('');
  const [formType, setFormType] = useState<CargoType>('dry_container');
  const [formWeight, setFormWeight] = useState('500');
  const [formContainerCount, setFormContainerCount] = useState('');
  const [formVesselName, setFormVesselName] = useState('');
  const [formVoyageNo, setFormVoyageNo] = useState('');
  const [formStatus, setFormStatus] = useState<CargoStatus>('booked');
  const [formSpecialHandling, setFormSpecialHandling] = useState('');

  // Form errors
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  const resetForm = () => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    setFormBl(`BL-YY-2026-${randomSuffix}`);
    setFormShipper('');
    setFormConsignee('');
    setFormType('dry_container');
    setFormWeight('250');
    setFormContainerCount('10');
    setFormVesselName(vessels.length > 0 ? vessels[0].name : '');
    setFormVoyageNo(voyages.length > 0 ? voyages[0].voyageNumber : '');
    setFormStatus('booked');
    setFormSpecialHandling('Standard Maritime Handling');
    setFormErrors({});
    setEditingCargo(null);
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (cargo: Cargo) => {
    setEditingCargo(cargo);
    setFormBl(cargo.blNumber);
    setFormShipper(cargo.shipper);
    setFormConsignee(cargo.consignee);
    setFormType(cargo.cargoType);
    setFormWeight(cargo.weightTon.toString());
    setFormContainerCount(cargo.containerCount ? cargo.containerCount.toString() : '');
    setFormVesselName(cargo.vesselName);
    setFormVoyageNo(cargo.voyageNumber);
    setFormStatus(cargo.status);
    setFormSpecialHandling(cargo.specialHandling || '');
    setFormErrors({});
    setIsModalOpen(true);
  };

  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    if (!formBl.trim() || formBl.trim().length < 4) {
      errors.bl = 'Nomor Bill of Lading (B/L) wajib diisi (minimal 4 karakter).';
    }

    if (!formShipper.trim() || formShipper.trim().length < 3) {
      errors.shipper = 'Nama pihak pengirim (Shipper) minimal 3 karakter.';
    }

    if (!formConsignee.trim() || formConsignee.trim().length < 3) {
      errors.consignee = 'Nama pihak penerima (Consignee) minimal 3 karakter.';
    }

    const numWeight = Number(formWeight);
    if (isNaN(numWeight) || numWeight <= 0) {
      errors.weight = 'Berat kargo harus berupa angka positif lebih dari 0.';
    }

    if (!formVesselName.trim()) {
      errors.vesselName = 'Nama kapal pengangkut wajib dipilih.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const cargoPayload = {
        blNumber: formBl.trim().toUpperCase(),
        shipper: formShipper.trim(),
        consignee: formConsignee.trim(),
        cargoType: formType,
        weightTon: Number(formWeight),
        containerCount: formContainerCount ? Number(formContainerCount) : undefined,
        vesselName: formVesselName.trim(),
        voyageNumber: formVoyageNo.trim().toUpperCase(),
        status: formStatus,
        specialHandling: formSpecialHandling.trim(),
      };

      if (editingCargo) {
        await updateCargo(editingCargo.id, cargoPayload);
        onNotify('success', 'Manifes Diperbarui', `Data muatan B/L ${cargoPayload.blNumber} berhasil diperbarui di Firestore.`);
      } else {
        await createCargo(cargoPayload);
        onNotify('success', 'Kargo Terdaftar', `Kargo B/L ${cargoPayload.blNumber} berhasil didaftarkan ke sistem.`);
      }

      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      console.error("Error saving cargo:", err);
      onNotify('error', 'Gagal Menyimpan Kargo', 'Terjadi kesalahan saat menyimpan kargo ke Firestore.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      await deleteCargo(deleteTarget.id);
      onNotify('success', 'Kargo Dihapus', `Data kargo B/L ${deleteTarget.blNumber} berhasil dihapus.`);
      setDeleteTarget(null);
    } catch (err) {
      console.error("Error deleting cargo:", err);
      onNotify('error', 'Gagal Menghapus', 'Tidak dapat menghapus kargo.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered
  const filteredCargos = useMemo(() => {
    return cargos.filter((c) => {
      const matchSearch =
        c.blNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.shipper.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.consignee.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.vesselName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus = statusFilter === 'all' || c.status === statusFilter;
      const matchType = typeFilter === 'all' || c.cargoType === typeFilter;

      return matchSearch && matchStatus && matchType;
    });
  }, [cargos, searchQuery, statusFilter, typeFilter]);

  const getStatusBadge = (status: CargoStatus) => {
    switch (status) {
      case 'booked':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            Dipesan (Booked)
          </span>
        );
      case 'loaded':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Package className="w-3 h-3 text-blue-600" />
            Termuat di Kapal
          </span>
        );
      case 'in_transit':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
            <Ship className="w-3 h-3 text-sky-600 animate-pulse" />
            Dalam Pengiriman
          </span>
        );
      case 'discharged':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
            <Truck className="w-3 h-3 text-teal-600" />
            Bongkar Muat di Pelabuhan
          </span>
        );
      case 'released':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle className="w-3 h-3 text-emerald-600" />
            Diserahkan ke Consignee
          </span>
        );
    }
  };

  const getCargoTypeLabel = (type: CargoType) => {
    switch (type) {
      case 'dry_container':
        return 'Kontainer Kering (Dry Box)';
      case 'liquid_bulk':
        return 'Curah Cair (Liquid Tank)';
      case 'break_bulk':
        return 'Curah Padat (Bulk)';
      case 'refrigerated':
        return 'Reefer (Pendingin)';
      case 'vehicles':
        return 'Kendaraan / Roda 4';
    }
  };

  return (
    <div id="cargo-module" className="space-y-6">
      {/* Control bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex-1 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="cargo-search-input"
              type="text"
              placeholder="Cari B/L number, pengirim (shipper), atau penerima (consignee)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          <select
            id="cargo-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="all">Semua Status Manifes</option>
            <option value="booked">Dipesan (Booked)</option>
            <option value="loaded">Termuat di Kapal</option>
            <option value="in_transit">Dalam Pengiriman</option>
            <option value="discharged">Bongkar Muat</option>
            <option value="released">Diserahkan</option>
          </select>

          <select
            id="cargo-type-filter"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="all">Semua Jenis Kargo</option>
            <option value="dry_container">Kontainer Kering</option>
            <option value="liquid_bulk">Curah Cair</option>
            <option value="break_bulk">Curah Padat</option>
            <option value="refrigerated">Reefer Pendingin</option>
            <option value="vehicles">Kendaraan</option>
          </select>
        </div>

        <button
          id="add-cargo-btn"
          type="button"
          onClick={handleOpenAddModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs shadow-blue-600/30 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Manifes Kargo</span>
        </button>
      </div>

      {/* Cargo List */}
      {filteredCargos.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">Tidak ada data kargo ditemukan</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Belum ada manifes muatan yang sesuai dengan kriteria filter.
          </p>
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Daftarkan Kargo Pertama</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCargos.map((cargo) => (
            <div
              key={cargo.id}
              id={`cargo-card-${cargo.id}`}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-blue-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-blue-800 bg-blue-50 px-2 py-1 rounded-md border border-blue-200">
                    {cargo.blNumber}
                  </span>
                  {getStatusBadge(cargo.status)}
                </div>

                <div className="mt-3">
                  <div className="text-xs text-slate-400 font-semibold uppercase">Jenis Kargo</div>
                  <div className="text-sm font-bold text-slate-900">{getCargoTypeLabel(cargo.cargoType)}</div>
                </div>

                <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Pengirim (Shipper)</span>
                    <strong className="text-slate-800 block truncate">{cargo.shipper}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Penerima (Consignee)</span>
                    <strong className="text-slate-800 block truncate">{cargo.consignee}</strong>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                    <span className="text-slate-500">Berat Muatan:</span>
                    <strong className="text-slate-900 font-bold">{cargo.weightTon.toLocaleString()} Ton</strong>
                  </div>
                  {cargo.containerCount && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Jumlah Kontainer:</span>
                      <strong className="text-slate-900 font-bold">{cargo.containerCount} TEU</strong>
                    </div>
                  )}
                </div>

                <div className="mt-3 space-y-1 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <Ship className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>Kapal:</span>
                    <strong className="text-slate-800 truncate">{cargo.vesselName}</strong>
                  </div>
                  {cargo.voyageNumber && (
                    <div className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Voyage:</span>
                      <span className="text-slate-700 font-mono text-[11px]">{cargo.voyageNumber}</span>
                    </div>
                  )}
                </div>

                {cargo.specialHandling && (
                  <div className="mt-2.5 text-[11px] text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200/70 flex items-start gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <span>{cargo.specialHandling}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  ID: {cargo.id.slice(0, 6)}...
                </span>
                <div className="flex items-center gap-2">
                  <button
                    id={`edit-cargo-${cargo.id}`}
                    type="button"
                    onClick={() => handleOpenEditModal(cargo)}
                    className="p-1.5 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                    title="Edit Kargo"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    id={`delete-cargo-${cargo.id}`}
                    type="button"
                    onClick={() => setDeleteTarget(cargo)}
                    className="p-1.5 text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                    title="Hapus Kargo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT CARGO MODAL */}
      {isModalOpen && (
        <div id="cargo-form-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingCargo ? 'Perbarui Data Kargo' : 'Registrasi Kargo Baru'}
                  </h3>
                  <p className="text-xs text-slate-500">Bill of Lading & Manifes Kapal</p>
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
                {/* No B/L */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nomor Bill of Lading (B/L) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="form-cargo-bl"
                    type="text"
                    value={formBl}
                    onChange={(e) => setFormBl(e.target.value.toUpperCase())}
                    placeholder="BL-SB-2026-1029"
                    className={`w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border rounded-xl focus:outline-none focus:bg-white ${
                      formErrors.bl ? 'border-rose-400 ring-1 ring-rose-400' : 'border-slate-200 focus:ring-2 focus:ring-blue-500'
                    }`}
                  />
                  {formErrors.bl && <p className="text-[11px] text-rose-500 mt-1">{formErrors.bl}</p>}
                </div>

                {/* Jenis Kargo */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jenis Muatan
                  </label>
                  <select
                    id="form-cargo-type"
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as CargoType)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="dry_container">Kontainer Kering (Dry Box)</option>
                    <option value="liquid_bulk">Curah Cair (Liquid Bulk)</option>
                    <option value="break_bulk">Curah Padat (Break Bulk)</option>
                    <option value="refrigerated">Reefer (Pendingin)</option>
                    <option value="vehicles">Kendaraan Bermotor</option>
                  </select>
                </div>

                {/* Shipper */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pihak Pengirim (Shipper) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="form-cargo-shipper"
                    type="text"
                    value={formShipper}
                    onChange={(e) => setFormShipper(e.target.value)}
                    placeholder="PT Indofood Sukses Makmur Tbk"
                    className={`w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border rounded-xl focus:outline-none focus:bg-white ${
                      formErrors.shipper ? 'border-rose-400 ring-1 ring-rose-400' : 'border-slate-200 focus:ring-2 focus:ring-blue-500'
                    }`}
                  />
                  {formErrors.shipper && <p className="text-[11px] text-rose-500 mt-1">{formErrors.shipper}</p>}
                </div>

                {/* Consignee */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pihak Penerima (Consignee) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="form-cargo-consignee"
                    type="text"
                    value={formConsignee}
                    onChange={(e) => setFormConsignee(e.target.value)}
                    placeholder="PT Logistik Nusantara Jaya Medan"
                    className={`w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border rounded-xl focus:outline-none focus:bg-white ${
                      formErrors.consignee ? 'border-rose-400 ring-1 ring-rose-400' : 'border-slate-200 focus:ring-2 focus:ring-blue-500'
                    }`}
                  />
                  {formErrors.consignee && <p className="text-[11px] text-rose-500 mt-1">{formErrors.consignee}</p>}
                </div>

                {/* Berat Ton */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Berat Muatan (Ton) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="form-cargo-weight"
                    type="number"
                    min="0.1"
                    step="any"
                    value={formWeight}
                    onChange={(e) => setFormWeight(e.target.value)}
                    className={`w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border rounded-xl focus:outline-none focus:bg-white ${
                      formErrors.weight ? 'border-rose-400 ring-1 ring-rose-400' : 'border-slate-200 focus:ring-2 focus:ring-blue-500'
                    }`}
                  />
                  {formErrors.weight && <p className="text-[11px] text-rose-500 mt-1">{formErrors.weight}</p>}
                </div>

                {/* Jumlah TEU Kontainer */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jumlah Kontainer (TEU)
                  </label>
                  <input
                    id="form-cargo-teu"
                    type="number"
                    min="0"
                    value={formContainerCount}
                    onChange={(e) => setFormContainerCount(e.target.value)}
                    placeholder="10"
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Kapal Pembawa */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kapal Angkut <span className="text-rose-500">*</span>
                  </label>
                  {vessels.length > 0 ? (
                    <select
                      id="form-cargo-vessel-select"
                      value={formVesselName}
                      onChange={(e) => setFormVesselName(e.target.value)}
                      className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    >
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
                      placeholder="Masukkan nama kapal"
                      className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  )}
                </div>

                {/* Status Kargo */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status Muatan
                  </label>
                  <select
                    id="form-cargo-status"
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as CargoStatus)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="booked">Dipesan (Booked)</option>
                    <option value="loaded">Termuat di Kapal</option>
                    <option value="in_transit">Dalam Pengiriman</option>
                    <option value="discharged">Bongkar Muat</option>
                    <option value="released">Diserahkan ke Consignee</option>
                  </select>
                </div>

                {/* Penanganan Khusus */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Instruksi Penanganan Khusus (Dangerous Goods / Suhu)
                  </label>
                  <input
                    id="form-cargo-handling"
                    type="text"
                    value={formSpecialHandling}
                    onChange={(e) => setFormSpecialHandling(e.target.value)}
                    placeholder="Contoh: Segel Bea Cukai Terpasang, Fragile, Suhu -18°C"
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
                  id="save-cargo-submit-btn"
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
                      <span>{editingCargo ? 'Simpan Perubahan' : 'Daftarkan Kargo'}</span>
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
        title="Hapus Kargo"
        itemName={deleteTarget ? `B/L ${deleteTarget.blNumber}` : ''}
        itemType="Manifes Kargo"
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
