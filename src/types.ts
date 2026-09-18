export type VesselStatus = 'underway' | 'docked' | 'maintenance' | 'standby';
export type VesselType = 'Kontainer' | 'Tanker Minyak' | 'Bulk Carrier (Curah)' | 'Kapal Ro-Ro' | 'Tugboat & Tongkang';

export interface Vessel {
  id: string;
  name: string;
  imoNumber: string;
  callSign: string;
  type: VesselType;
  capacityDwt: number;
  teuCapacity?: number;
  yearBuilt: number;
  flag: string;
  status: VesselStatus;
  currentLocation: string;
  homePort: string;
  createdAt: string;
  updatedAt: string;
}

export type VoyageStatus = 'scheduled' | 'in_transit' | 'arrived' | 'delayed' | 'completed';

export interface Voyage {
  id: string;
  voyageNumber: string;
  vesselId: string;
  vesselName: string;
  originPort: string;
  destinationPort: string;
  departureDate: string;
  arrivalDate: string;
  status: VoyageStatus;
  cargoLoadTon: number;
  fuelRemainingPercent: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export type CargoType = 'dry_container' | 'liquid_bulk' | 'break_bulk' | 'refrigerated' | 'vehicles';
export type CargoStatus = 'booked' | 'loaded' | 'in_transit' | 'discharged' | 'released';

export interface Cargo {
  id: string;
  blNumber: string;
  shipper: string;
  consignee: string;
  cargoType: CargoType;
  weightTon: number;
  containerCount?: number;
  vesselName: string;
  voyageNumber: string;
  status: CargoStatus;
  specialHandling: string;
  createdAt: string;
  updatedAt: string;
}

export type CrewRole = 
  | 'Nakhoda / Master' 
  | 'Mualim I (Chief Officer)' 
  | 'Mualim II (Second Officer)' 
  | 'KKM (Chief Engineer)' 
  | 'Masinis II (Second Engineer)' 
  | 'Bosun / Serang' 
  | 'Juru Mudi (Able Seaman)' 
  | 'Juru Minyak (Oiler)';

export type CrewStatus = 'on_board' | 'on_leave' | 'standby';

export interface CrewMember {
  id: string;
  fullName: string;
  seamanBookNo: string;
  role: CrewRole;
  vesselName: string;
  certificateValidity: string;
  status: CrewStatus;
  contactPhone: string;
  createdAt: string;
  updatedAt: string;
}

export interface FeedbackToast {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: number;
}

export interface AuthUser {
  uid: string;
  email: string;
  displayName: string;
  role: string;
  isAnonymous?: boolean;
}

