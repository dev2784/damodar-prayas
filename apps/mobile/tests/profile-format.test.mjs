import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { calculateAge, heightLabel } from '../src/lib/profile-format.ts';
import { isValidNewPassword } from '../src/lib/password.ts';

test('age changes on the birthday, not before it', () => {
  assert.equal(calculateAge('2000-09-17T00:00:00.000Z', new Date(2026, 8, 16)), 25);
  assert.equal(calculateAge('2000-09-17T00:00:00.000Z', new Date(2026, 8, 17)), 26);
  assert.equal(calculateAge('bad-date'), 0);
});

test('rounded height never displays twelve inches', () => {
  assert.equal(heightLabel(182), '6\' 0" (182 cm)');
  assert.equal(heightLabel(170), '5\' 7" (170 cm)');
  assert.equal(heightLabel(null), null);
});

test('new passwords match backend requirements', () => {
  assert.equal(isValidNewPassword('abcdefgh'), false);
  assert.equal(isValidNewPassword('12345678'), false);
  assert.equal(isValidNewPassword('Abcd123'), false);
  assert.equal(isValidNewPassword('Abcd1234'), true);
  assert.equal(isValidNewPassword('A1' + 'x'.repeat(127)), false);
});
