import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { doIntervalsOverlap } from '../src/services/conflictService.js';

describe('Overlap Detection Service Unit Tests', () => {
  test('1. Back-to-back visits DO NOT conflict (EndA === StartB)', () => {
    // Visit A: 10:00 to 11:00
    const startA = new Date('2026-11-10T10:00:00Z');
    const endA = new Date('2026-11-10T11:00:00Z');

    // Visit B: 11:00 to 12:00
    const startB = new Date('2026-11-10T11:00:00Z');
    const endB = new Date('2026-11-10T12:00:00Z');

    assert.equal(doIntervalsOverlap(startA, endA, startB, endB), false);
    assert.equal(doIntervalsOverlap(startB, endB, startA, endA), false);
  });

  test('2. Partial overlap: Visit B starts before Visit A ends', () => {
    // Visit A: 10:00 to 11:30
    const startA = new Date('2026-11-10T10:00:00Z');
    const endA = new Date('2026-11-10T11:30:00Z');

    // Visit B: 11:00 to 12:30
    const startB = new Date('2026-11-10T11:00:00Z');
    const endB = new Date('2026-11-10T12:30:00Z');

    assert.equal(doIntervalsOverlap(startA, endA, startB, endB), true);
    assert.equal(doIntervalsOverlap(startB, endB, startA, endA), true);
  });

  test('3. Full containment: Visit B is completely inside Visit A', () => {
    // Visit A: 09:00 to 13:00
    const startA = new Date('2026-11-10T09:00:00Z');
    const endA = new Date('2026-11-10T13:00:00Z');

    // Visit B: 10:00 to 11:00
    const startB = new Date('2026-11-10T10:00:00Z');
    const endB = new Date('2026-11-10T11:00:00Z');

    assert.equal(doIntervalsOverlap(startA, endA, startB, endB), true);
    assert.equal(doIntervalsOverlap(startB, endB, startA, endA), true);
  });

  test('4. Exact identical time slot', () => {
    const start = new Date('2026-11-10T14:00:00Z');
    const end = new Date('2026-11-10T15:30:00Z');

    assert.equal(doIntervalsOverlap(start, end, start, end), true);
  });

  test('5. Non-overlapping disjoint intervals (gap between them)', () => {
    // Visit A: 09:00 to 10:00
    const startA = new Date('2026-11-10T09:00:00Z');
    const endA = new Date('2026-11-10T10:00:00Z');

    // Visit B: 14:00 to 15:00
    const startB = new Date('2026-11-10T14:00:00Z');
    const endB = new Date('2026-11-10T15:00:00Z');

    assert.equal(doIntervalsOverlap(startA, endA, startB, endB), false);
    assert.equal(doIntervalsOverlap(startB, endB, startA, endA), false);
  });

  test('6. Overlap crossing midnight or different days', () => {
    const startA = new Date('2026-11-10T23:00:00Z');
    const endA = new Date('2026-11-11T01:00:00Z');

    const startB = new Date('2026-11-11T00:30:00Z');
    const endB = new Date('2026-11-11T02:00:00Z');

    assert.equal(doIntervalsOverlap(startA, endA, startB, endB), true);
  });
});
