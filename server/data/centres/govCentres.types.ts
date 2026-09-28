// Canonical shapes for the government training-centre snapshot.

export interface GovCentre {
  centreName: string;
  scheme: string;
  trade?: string;
  state: string;
  district: string;
  address?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  coordinatorName?: string;
  phone?: string;
  email?: string;
  sourceRow: Record<string, unknown>;
  sourceDataset: string;
  sourceResourceId: string;
}

export interface SnapshotProvenance {
  fetchedAt: string;
  publisher: string;
  datasetTitle: string;
  resourceId: string;
  sourceUrl: string;
  lastUpdated: string | null;
  licence: 'Government Open Data License – India (GODL)';
  recordCount: number;
  filtersApplied: {
    states: string[];
    districts: string[];
  };
}

export interface GovCentreSnapshot {
  provenance: SnapshotProvenance;
  records: GovCentre[];
}