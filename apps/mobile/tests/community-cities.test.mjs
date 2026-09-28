import assert from 'node:assert/strict';
import test from 'node:test';
import { mpCities } from '../src/features/community/mp-cities.ts';
import { mpCities as apiCities } from '../../api/src/modules/community/mp-cities.ts';

test('bundled city IDs match the API catalogue used for submission and filters', () => {
  assert.deepEqual(mpCities, apiCities);
  assert.equal(mpCities.length, 420);
  assert.equal(new Set(mpCities.map((city) => city.id)).size, 420);
  assert.ok(mpCities.some((city) => city.name === 'Indore'));
  assert.ok(mpCities.some((city) => city.name === 'Bhopal'));
});
