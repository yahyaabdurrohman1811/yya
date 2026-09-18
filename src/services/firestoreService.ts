import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';
import { Vessel, Voyage, Cargo, CrewMember } from '../types';

// ==================== VESSELS CRUD ====================
export function subscribeVessels(callback: (vessels: Vessel[]) => void, onError?: (err: Error) => void) {
  const q = query(collection(db, 'vessels'), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const items: Vessel[] = [];
      snapshot.forEach((d) => {
        items.push({ id: d.id, ...(d.data() as Omit<Vessel, 'id'>) });
      });
      callback(items);
    },
    (err) => {
      console.error("Firestore vessels subscription error:", err);
      onError?.(err);
    }
  );
}

export async function createVessel(data: Omit<Vessel, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const now = new Date().toISOString();
  const docRef = await addDoc(collection(db, 'vessels'), {
    ...data,
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
}

export async function updateVessel(id: string, data: Partial<Omit<Vessel, 'id' | 'createdAt'>>): Promise<void> {
  const docRef = doc(db, 'vessels', id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteVessel(id: string): Promise<void> {
  await deleteDoc(doc(db, 'vessels', id));
}

// ==================== VOYAGES CRUD ====================
export function subscribeVoyages(callback: (voyages: Voyage[]) => void, onError?: (err: Error) => void) {
  const q = query(collection(db, 'voyages'), orderBy('departureDate', 'asc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const items: Voyage[] = [];
      snapshot.forEach((d) => {
        items.push({ id: d.id, ...(d.data() as Omit<Voyage, 'id'>) });
      });
      callback(items);
    },
    (err) => {
      console.error("Firestore voyages subscription error:", err);
      onError?.(err);
    }
  );
}

export async function createVoyage(data: Omit<Voyage, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const now = new Date().toISOString();
  const docRef = await addDoc(collection(db, 'voyages'), {
    ...data,
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
}

export async function updateVoyage(id: string, data: Partial<Omit<Voyage, 'id' | 'createdAt'>>): Promise<void> {
  const docRef = doc(db, 'voyages', id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteVoyage(id: string): Promise<void> {
  await deleteDoc(doc(db, 'voyages', id));
}

// ==================== CARGO CRUD ====================
export function subscribeCargo(callback: (cargos: Cargo[]) => void, onError?: (err: Error) => void) {
  const q = query(collection(db, 'cargos'), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const items: Cargo[] = [];
      snapshot.forEach((d) => {
        items.push({ id: d.id, ...(d.data() as Omit<Cargo, 'id'>) });
      });
      callback(items);
    },
    (err) => {
      console.error("Firestore cargo subscription error:", err);
      onError?.(err);
    }
  );
}

export async function createCargo(data: Omit<Cargo, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const now = new Date().toISOString();
  const docRef = await addDoc(collection(db, 'cargos'), {
    ...data,
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
}

export async function updateCargo(id: string, data: Partial<Omit<Cargo, 'id' | 'createdAt'>>): Promise<void> {
  const docRef = doc(db, 'cargos', id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteCargo(id: string): Promise<void> {
  await deleteDoc(doc(db, 'cargos', id));
}

// ==================== CREW CRUD ====================
export function subscribeCrew(callback: (crew: CrewMember[]) => void, onError?: (err: Error) => void) {
  const q = query(collection(db, 'crews'), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const items: CrewMember[] = [];
      snapshot.forEach((d) => {
        items.push({ id: d.id, ...(d.data() as Omit<CrewMember, 'id'>) });
      });
      callback(items);
    },
    (err) => {
      console.error("Firestore crew subscription error:", err);
      onError?.(err);
    }
  );
}

export async function createCrew(data: Omit<CrewMember, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const now = new Date().toISOString();
  const docRef = await addDoc(collection(db, 'crews'), {
    ...data,
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
}

export async function updateCrew(id: string, data: Partial<Omit<CrewMember, 'id' | 'createdAt'>>): Promise<void> {
  const docRef = doc(db, 'crews', id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteCrew(id: string): Promise<void> {
  await deleteDoc(doc(db, 'crews', id));
}

// ==================== SEED INITIAL FLEET DATA ====================
export async function seedInitialMaritimeData(): Promise<void> {
  const vesselsSnapshot = await getDocs(collection(db, 'vessels'));
  if (!vesselsSnapshot.empty) {
    throw new Error('Database sudah memiliki data armada kapal. Tidak perlu inisialisasi ulang.');
  }

  const batch = writeBatch(db);
  const now = new Date().toISOString();

  // 1. Initial Vessels
  const initialVessels: Omit<Vessel, 'id'>[] = [
    {
      name: 'KM YY Samudra Perkasa IX',
      imoNumber: '9845124',
      callSign: 'YBDA',
      type: 'Kontainer',
      capacityDwt: 28500,
      teuCapacity: 1850,
      yearBuilt: 2021,
      flag: 'Indonesia',
      status: 'underway',
      currentLocation: 'Selat Sunda (Menuju Belawan)',
      homePort: 'Tanjung Priok, Jakarta',
      createdAt: now,
      updatedAt: now
    },
    {
      name: 'MT Nusantara Segara II',
      imoNumber: '9763219',
      callSign: 'PKSR',
      type: 'Tanker Minyak',
      capacityDwt: 35000,
      yearBuilt: 2019,
      flag: 'Indonesia',
      status: 'docked',
      currentLocation: 'Dermaga Khusus Pertamina Plaju, Palembang',
      homePort: 'Tanjung Perak, Surabaya',
      createdAt: now,
      updatedAt: now
    },
    {
      name: 'MV Borneo Mandiri Bulk',
      imoNumber: '9654108',
      callSign: 'YBOE',
      type: 'Bulk Carrier (Curah)',
      capacityDwt: 55000,
      yearBuilt: 2017,
      flag: 'Indonesia',
      status: 'underway',
      currentLocation: 'Selat Makassar (Menuju Morowali)',
      homePort: 'Balikpapan',
      createdAt: now,
      updatedAt: now
    },
    {
      name: 'KM Dharma Bahari Ro-Ro',
      imoNumber: '9522910',
      callSign: 'PKDB',
      type: 'Kapal Ro-Ro',
      capacityDwt: 12000,
      yearBuilt: 2020,
      flag: 'Indonesia',
      status: 'standby',
      currentLocation: 'Kolam Labuh Pelabuhan Merak',
      homePort: 'Tanjung Priok, Jakarta',
      createdAt: now,
      updatedAt: now
    },
    {
      name: 'TB YY Samudra Pioneer 03',
      imoNumber: '9890123',
      callSign: 'PKTP',
      type: 'Tugboat & Tongkang',
      capacityDwt: 7500,
      yearBuilt: 2022,
      flag: 'Indonesia',
      status: 'maintenance',
      currentLocation: 'Galangan Kapal Dok Koja Bahari Jakarta',
      homePort: 'Tanjung Priok, Jakarta',
      createdAt: now,
      updatedAt: now
    }
  ];

  for (const v of initialVessels) {
    const ref = doc(collection(db, 'vessels'));
    batch.set(ref, v);
  }

  // 2. Initial Voyages
  const initialVoyages: Omit<Voyage, 'id'>[] = [
    {
      voyageNumber: 'VY-2026-JKT-BLW-042',
      vesselId: 'seed-v1',
      vesselName: 'KM YY Samudra Perkasa IX',
      originPort: 'Pelabuhan Tanjung Priok (Jakarta)',
      destinationPort: 'Pelabuhan Belawan (Medan)',
      departureDate: new Date(Date.now() - 36 * 3600 * 1000).toISOString().slice(0, 16),
      arrivalDate: new Date(Date.now() + 48 * 3600 * 1000).toISOString().slice(0, 16),
      status: 'in_transit',
      cargoLoadTon: 24200,
      fuelRemainingPercent: 78,
      notes: 'Kecepatan rata-rata 14 knot, kondisi cuaca perairan barat Sumatera tenang.',
      createdAt: now,
      updatedAt: now
    },
    {
      voyageNumber: 'VY-2026-PLB-SBY-015',
      vesselId: 'seed-v2',
      vesselName: 'MT Nusantara Segara II',
      originPort: 'Pelabuhan Plaju (Palembang)',
      destinationPort: 'Pelabuhan Tanjung Perak (Surabaya)',
      departureDate: new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 16),
      arrivalDate: new Date(Date.now() + 96 * 3600 * 1000).toISOString().slice(0, 16),
      status: 'scheduled',
      cargoLoadTon: 32000,
      fuelRemainingPercent: 95,
      notes: 'Tahap final loading muatan solar HSD di terminal tangki Plaju.',
      createdAt: now,
      updatedAt: now
    },
    {
      voyageNumber: 'VY-2026-BPN-MRW-088',
      vesselId: 'seed-v3',
      vesselName: 'MV Borneo Mandiri Bulk',
      originPort: 'Pelabuhan Semayang (Balikpapan)',
      destinationPort: 'Pelabuhan Khusus Smelter (Morowali)',
      departureDate: new Date(Date.now() - 18 * 3600 * 1000).toISOString().slice(0, 16),
      arrivalDate: new Date(Date.now() + 30 * 3600 * 1000).toISOString().slice(0, 16),
      status: 'in_transit',
      cargoLoadTon: 48500,
      fuelRemainingPercent: 82,
      notes: 'Muatan batubara kalori tinggi pesanan industri peleburan nikel.',
      createdAt: now,
      updatedAt: now
    }
  ];

  for (const voy of initialVoyages) {
    const ref = doc(collection(db, 'voyages'));
    batch.set(ref, voy);
  }

  // 3. Initial Cargo
  const initialCargo: Omit<Cargo, 'id'>[] = [
    {
      blNumber: 'BL-YY-2026-00812',
      shipper: 'PT Indofood Sukses Makmur Tbk',
      consignee: 'PT Maju Bersama Logistik Medan',
      cargoType: 'dry_container',
      weightTon: 450,
      containerCount: 22,
      vesselName: 'KM YY Samudra Perkasa IX',
      voyageNumber: 'VY-2026-JKT-BLW-042',
      status: 'in_transit',
      specialHandling: 'Dry Clean Standard, Segel Bea Cukai Terpasang',
      createdAt: now,
      updatedAt: now
    },
    {
      blNumber: 'BL-YY-2026-00945',
      shipper: 'PT Pertamina Patra Niaga',
      consignee: 'Depot TBBM Tanjung Perak Surabaya',
      cargoType: 'liquid_bulk',
      weightTon: 32000,
      vesselName: 'MT Nusantara Segara II',
      voyageNumber: 'VY-2026-PLB-SBY-015',
      status: 'loaded',
      specialHandling: 'Flammable Liquid Class 3, Inert Gas System Aktif',
      createdAt: now,
      updatedAt: now
    },
    {
      blNumber: 'BL-YY-2026-01024',
      shipper: 'PT Toyota Motor Manufacturing Indonesia',
      consignee: 'PT Nusantara Auto Sejahtera Makassar',
      cargoType: 'vehicles',
      weightTon: 280,
      vesselName: 'KM Dharma Bahari Ro-Ro',
      voyageNumber: 'STANDBY-RO-RO',
      status: 'booked',
      specialHandling: 'Lashing Roda 4 Sesuai Manual Keselamatan Ro-Ro',
      createdAt: now,
      updatedAt: now
    }
  ];

  for (const c of initialCargo) {
    const ref = doc(collection(db, 'cargos'));
    batch.set(ref, c);
  }

  // 4. Initial Crew
  const initialCrew: Omit<CrewMember, 'id'>[] = [
    {
      fullName: 'Capt. Hendra Gunawan, M.Mar',
      seamanBookNo: 'ID-089123-A',
      role: 'Nakhoda / Master',
      vesselName: 'KM YY Samudra Perkasa IX',
      certificateValidity: '2029-08-15',
      status: 'on_board',
      contactPhone: '+62 812-8899-2311',
      createdAt: now,
      updatedAt: now
    },
    {
      fullName: 'Bambang Sudiro, S.T., M.Mar.E',
      seamanBookNo: 'ID-075432-E',
      role: 'KKM (Chief Engineer)',
      vesselName: 'MT Nusantara Segara II',
      certificateValidity: '2028-11-20',
      status: 'on_board',
      contactPhone: '+62 813-7744-1290',
      createdAt: now,
      updatedAt: now
    },
    {
      fullName: 'Rian Pratama, A.Md.Pel',
      seamanBookNo: 'ID-104921-N',
      role: 'Mualim I (Chief Officer)',
      vesselName: 'MV Borneo Mandiri Bulk',
      certificateValidity: '2030-04-10',
      status: 'on_board',
      contactPhone: '+62 857-1122-3344',
      createdAt: now,
      updatedAt: now
    },
    {
      fullName: 'Agus Setiawan',
      seamanBookNo: 'ID-091283-B',
      role: 'Bosun / Serang',
      vesselName: 'KM Samudera Perkasa IX',
      certificateValidity: '2027-06-30',
      status: 'on_board',
      contactPhone: '+62 821-4455-6677',
      createdAt: now,
      updatedAt: now
    }
  ];

  for (const cr of initialCrew) {
    const ref = doc(collection(db, 'crews'));
    batch.set(ref, cr);
  }

  await batch.commit();
}
