import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import {
  buildPayload,
  initialForm,
  profileToForm,
  validateForm,
} from '../src/features/matrimony/form/form-model.ts';

const validForm = {
  ...initialForm,
  firstName: ' Dev ',
  lastName: ' Parihar ',
  dateOfBirth: '1998-05-21',
};

test('draft payload trims text and preserves nullable and numeric fields', () => {
  const payload = buildPayload({
    ...validForm,
    heightCm: '170',
    annualIncome: '1200000',
    contactPhone: ' +919876543210 ',
    country: '',
    manglik: 'NO',
    brothers: '2',
    sisters: '0',
  });
  assert.equal(payload.firstName, 'Dev');
  assert.equal(payload.lastName, 'Parihar');
  assert.equal(payload.contactPhone, '+919876543210');
  assert.equal(payload.heightCm, 170);
  assert.equal(payload.annualIncome, 1200000);
  assert.equal(payload.country, 'India');
  assert.equal(payload.manglik, false);
  assert.equal(payload.brothers, 2);
  assert.equal(payload.sisters, 0);
  assert.equal(payload.contactEmail, null);
  assert.equal(payload.about, null);
});

test('loading and saving an existing profile retains every editable field', () => {
  const filled = Object.fromEntries(
    Object.entries(validForm).map(([key, value]) => [key, value === '' ? `sample ${key}` : value]),
  );
  Object.assign(filled, {
    heightCm: '170',
    annualIncome: '500000',
    brothers: '2',
    sisters: '1',
    manglik: 'YES',
    postalCode: '452001',
  });
  const payload = buildPayload(filled);
  const loaded = profileToForm({ ...payload, dateOfBirth: `${payload.dateOfBirth}T00:00:00.000Z` });
  assert.deepEqual(buildPayload(loaded), payload);
  for (const manglik of [true, false, null]) {
    assert.equal(buildPayload(profileToForm({ ...payload, manglik })).manglik, manglik);
  }
});

test('validation retains required, age, height and Indian postal-code checks', () => {
  const today = new Date('2026-09-26T12:00:00Z');
  assert.equal(validateForm(validForm, today), null);
  assert.ok(validateForm({ ...validForm, firstName: ' ' }, today));
  assert.ok(validateForm({ ...validForm, dateOfBirth: 'bad-date' }, today));
  assert.ok(validateForm({ ...validForm, dateOfBirth: '2008-09-27' }, today));
  assert.equal(validateForm({ ...validForm, dateOfBirth: '2008-09-26' }, today), null);
  assert.ok(validateForm({ ...validForm, heightCm: '99' }, today));
  assert.ok(validateForm({ ...validForm, heightCm: '251' }, today));
  assert.ok(validateForm({ ...validForm, postalCode: '45200' }, today));
  assert.equal(validateForm({ ...validForm, postalCode: '452001' }, today), null);
});
