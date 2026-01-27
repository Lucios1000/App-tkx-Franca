import { describe, expect, it } from 'vitest';
import { calcPricing, calcSplitFromPassengerPrice } from './pricingEngine';

describe('pricingEngine', () => {
  it('applies includedKm before dynamic and enforces minFare', () => {
    const cfg = {
      baseFare: 10,
      perKm: 2,
      includedKm: 1,
      minFare: 11.5,
      techFeeFixed: 0.7,
      takeRatePct: 15,
    };

    const r = calcPricing(cfg, { distanceKm: 1, dynamicMultiplier: 1.0, includeTechFee: true });
    expect(r.tariffBeforeDynamic).toBeCloseTo(11.5, 6);
    expect(r.tariff).toBeCloseTo(11.5, 6);
    expect(r.passengerPrice).toBeCloseTo(12.2, 6);
  });

  it('computes commission only on tariff (excluding tech fee) and split sums correctly', () => {
    const cfg = {
      baseFare: 10,
      perKm: 2,
      includedKm: 0,
      minFare: 0,
      techFeeFixed: 0.7,
      takeRatePct: 15,
    };

    const r = calcPricing(cfg, { distanceKm: 5, dynamicMultiplier: 1.0, includeTechFee: true });
    // tariff = 10 + 2*5 = 20
    expect(r.tariff).toBeCloseTo(20, 6);
    expect(r.techFeeApplied).toBeCloseTo(0.7, 6);
    expect(r.passengerPrice).toBeCloseTo(20.7, 6);

    // commission = 15% of tariff only
    expect(r.platformCommission).toBeCloseTo(3.0, 6);
    expect(r.driverRepasse).toBeCloseTo(17.0, 6);

    // passengerPrice should equal techFee + commission + driverRepasse
    expect(r.platformCommission + r.techFeeApplied + r.driverRepasse).toBeCloseTo(r.passengerPrice, 6);
  });

  it('applies dynamicMultiplier to tariff (and keeps minFare if it becomes binding)', () => {
    const cfg = {
      baseFare: 10,
      perKm: 2,
      includedKm: 0,
      minFare: 11.5,
      techFeeFixed: 0.7,
      takeRatePct: 15,
    };

    const r = calcPricing(cfg, { distanceKm: 1, dynamicMultiplier: 1.4, includeTechFee: true });
    // base = 12.0, dynamic = 16.8
    expect(r.tariffBeforeDynamic).toBeCloseTo(12.0, 6);
    expect(r.tariff).toBeCloseTo(16.8, 6);
    expect(r.passengerPrice).toBeCloseTo(17.5, 6);
  });

  it('enforces minFare after dynamic when base*dynamic is below minFare', () => {
    const cfg = {
      baseFare: 10,
      perKm: 0,
      includedKm: 0,
      minFare: 11.5,
      techFeeFixed: 0.7,
      takeRatePct: 15,
    };

    const r = calcPricing(cfg, { distanceKm: 0, dynamicMultiplier: 0.8, includeTechFee: true });
    // base=10, base*dynamic=8, minFare=11.5 should prevail
    expect(r.tariffBeforeDynamic).toBeCloseTo(11.5, 6);
    expect(r.tariff).toBeCloseTo(11.5, 6);
    expect(r.passengerPrice).toBeCloseTo(12.2, 6);
  });

  it('calcSplitFromPassengerPrice mirrors the same commission rule (with tech fee)', () => {
    const split = calcSplitFromPassengerPrice({
      passengerPrice: 20.7,
      techFeeFixed: 0.7,
      takeRatePct: 15,
      includeTechFee: true,
    });

    expect(split.techFeeApplied).toBeCloseTo(0.7, 6);
    expect(split.tariff).toBeCloseTo(20.0, 6);
    expect(split.platformCommission).toBeCloseTo(3.0, 6);
    expect(split.driverRepasse).toBeCloseTo(17.0, 6);
  });

  it('calcSplitFromPassengerPrice supports excluding tech fee', () => {
    const split = calcSplitFromPassengerPrice({
      passengerPrice: 20,
      techFeeFixed: 0.7,
      takeRatePct: 15,
      includeTechFee: false,
    });

    expect(split.techFeeApplied).toBe(0);
    expect(split.tariff).toBeCloseTo(20, 6);
    expect(split.platformCommission).toBeCloseTo(3, 6);
    expect(split.driverRepasse).toBeCloseTo(17, 6);
  });

  it('caps tech fee so passengerPrice below tech fee does not produce negative repasse', () => {
    const split = calcSplitFromPassengerPrice({
      passengerPrice: 0.5,
      techFeeFixed: 0.7,
      takeRatePct: 15,
      includeTechFee: true,
    });

    expect(split.techFeeApplied).toBeCloseTo(0.5, 6);
    expect(split.tariff).toBeCloseTo(0, 6);
    expect(split.platformCommission).toBeCloseTo(0, 6);
    expect(split.driverRepasse).toBeCloseTo(0, 6);
  });
});
