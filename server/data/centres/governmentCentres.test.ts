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

describe('searchGovernmentCentres with no snapshot loaded', () => {
  it('reports not-found rather than inventing a result', () => {
    const result = searchGovernmentCentres('Varanasi');
    // Before `npm run data:fetch` has run there is no snapshot at all.
    // A null snapshot must never be reported as a successful empty search.
    expect(result.found).toBe(false);
    expect(result.centres).toEqual([]);
    expect(getSnapshot()).toBeNull();
    expect(getSnapshotProvenance()).toBeNull();
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
