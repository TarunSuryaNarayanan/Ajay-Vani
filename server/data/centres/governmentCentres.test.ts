import { describe, it, expect } from 'vitest';
import {
  matchDistrict,
  searchGovernmentCentres,
  getSnapshot,
  getSnapshotProvenance,
} from './governmentCentres';
import { normaliseRow } from './normalise';
import { GovCentre } from './govCentres.types';

const record = (over: Partial<GovCentre> = {}): GovCentre => ({
  centreName: 'Government ITI Varanasi',
  scheme: 'ITI',
  state: 'Uttar Pradesh',
  district: 'Varanasi',
  sourceRow: {},
  sourceDataset: 'test',
  sourceResourceId: 'uuid',
  ...over,
});

describe('matchDistrict', () => {
  const records = [
    record({ district: 'Varanasi' }),
    record({ district: 'Gorakhpur' }),
    record({ district: 'Sant Ravidas Nagar' }),
  ];

  it('matches exactly, case-insensitively', () => {
    expect(matchDistrict(records, 'Varanasi')).toHaveLength(1);
    expect(matchDistrict(records, 'varanasi')).toHaveLength(1);
    expect(matchDistrict(records, '  VARANASI ')).toHaveLength(1);
  });

  it('matches on a partial district name', () => {
    expect(matchDistrict(records, 'Gorakh')).toHaveLength(1);
    expect(matchDistrict(records, 'Sant Ravidas')).toHaveLength(1);
  });

  it('returns nothing for an empty query rather than everything', () => {
    expect(matchDistrict(records, '')).toHaveLength(0);
    expect(matchDistrict(records, '   ')).toHaveLength(0);
  });

  it('ignores records with no district', () => {
    expect(matchDistrict([record({ district: '' })], 'Varanasi')).toHaveLength(0);
  });
});

describe('searchGovernmentCentres against the loaded snapshot', () => {
  // The snapshot is committed (Karnataka CMKKY training centres). The invariant
  // this guards is unchanged: a district with no records must report
  // found=false with an empty list, never a fabricated centre.
  it('reports not-found for a district with no records', () => {
    const result = searchGovernmentCentres('Varanasi');
    expect(result.found).toBe(false);
    expect(result.centres).toEqual([]);
    // The snapshot itself is present — provenance is real, not invented.
    expect(getSnapshot()).not.toBeNull();
    expect(getSnapshotProvenance()).not.toBeNull();
  });

  it('returns real records for a district that exists in the snapshot', () => {
    const result = searchGovernmentCentres('Udupi');
    expect(result.found).toBe(true);
    expect(result.centres.length).toBeGreaterThan(0);
    expect(result.centres[0].district.toLowerCase()).toContain('udupi');
  });
});

describe('normaliseRow', () => {
  const fieldMap = {
    centreName: ['centre_name'],
    district: ['district'],
    state: ['state'],
    address: ['address'],
    phone: ['mobile'],
    latitude: ['lat'],
    longitude: ['lon'],
  } as any;

  it('maps real fields and keeps the raw row for audit', () => {
    const centre = normaliseRow(
      {
        centre_name: 'Government ITI Bhagalpur',
        district: 'Bhagalpur',
        state: 'Bihar',
        address: 'Bhagalpur, Bihar',
        mobile: '+91 90000 00000',
        lat: '25.24',
        lon: '86.98',
      },
      fieldMap,
      'Test dataset',
      'uuid-1'
    );

    expect(centre).not.toBeNull();
    expect(centre!.centreName).toBe('Government ITI Bhagalpur');
    expect(centre!.district).toBe('Bhagalpur');
    expect(centre!.latitude).toBeCloseTo(25.24);
    expect(centre!.sourceDataset).toBe('Test dataset');
    expect(centre!.sourceRow).toHaveProperty('centre_name');
  });

  it('drops rows with no centre name or no district', () => {
    expect(normaliseRow({ district: 'Patna' }, fieldMap, 'd', 'u')).toBeNull();
    expect(normaliseRow({ centre_name: 'Some ITI' }, fieldMap, 'd', 'u')).toBeNull();
  });

  it('never fabricates coordinates when they are absent or impossible', () => {
    const missing = normaliseRow(
      { centre_name: 'X ITI', district: 'Patna' },
      fieldMap,
      'd',
      'u'
    );
    expect(missing!.latitude).toBeUndefined();
    expect(missing!.longitude).toBeUndefined();

    const bogus = normaliseRow(
      { centre_name: 'Y ITI', district: 'Patna', lat: '999', lon: 'abc' },
      fieldMap,
      'd',
      'u'
    );
    expect(bogus!.latitude).toBeUndefined();
    expect(bogus!.longitude).toBeUndefined();
  });

  it('does not invent a QP code or a vacancy count', () => {
    const centre = normaliseRow(
      { centre_name: 'Z ITI', district: 'Patna' },
      fieldMap,
      'd',
      'u'
    );
    expect(centre).not.toHaveProperty('qpCode');
    expect(centre).not.toHaveProperty('vacancies');
    expect(centre).not.toHaveProperty('monthlyStipend');
  });
});
