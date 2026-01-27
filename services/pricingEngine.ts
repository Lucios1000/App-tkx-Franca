export type PricingTariffConfig = {
  baseFare: number;
  perKm: number;
  includedKm?: number;
  minFare: number;
  techFeeFixed: number;
  takeRatePct: number;
};

export type PricingOptions = {
  distanceKm: number;
  dynamicMultiplier?: number;
  includeTechFee?: boolean;
};

export type PricingResult = {
  distanceKm: number;
  dynamicMultiplier: number;

  tariffBeforeDynamic: number;
  tariff: number;
  techFeeApplied: number;
  passengerPrice: number;

  takeRatePct: number;
  platformCommission: number;
  driverRepasse: number;
};

export type SplitFromPassengerPriceInput = {
  passengerPrice: number;
  techFeeFixed: number;
  takeRatePct: number;
  includeTechFee?: boolean;
};

export type SplitFromPassengerPriceResult = {
  passengerPrice: number;
  techFeeApplied: number;
  tariff: number;
  takeRatePct: number;
  platformCommission: number;
  driverRepasse: number;
};

const clampMin = (value: number, min: number) => (value < min ? min : value);

export const calcTariffBeforeDynamic = (cfg: PricingTariffConfig, distanceKm: number): number => {
  const included = typeof cfg.includedKm === 'number' ? cfg.includedKm : 0;
  const billableKm = Math.max(0, distanceKm - included);
  const raw = cfg.baseFare + cfg.perKm * billableKm;
  return clampMin(raw, cfg.minFare);
};

export const calcTariff = (cfg: PricingTariffConfig, distanceKm: number, dynamicMultiplier: number): number => {
  const base = calcTariffBeforeDynamic(cfg, distanceKm);
  return clampMin(base * dynamicMultiplier, cfg.minFare);
};

export const calcPricing = (cfg: PricingTariffConfig, opts: PricingOptions): PricingResult => {
  const dynamicMultiplier = typeof opts.dynamicMultiplier === 'number' ? opts.dynamicMultiplier : 1.0;
  const includeTechFee = opts.includeTechFee !== false;

  const tariffBeforeDynamic = calcTariffBeforeDynamic(cfg, opts.distanceKm);
  const tariff = calcTariff(cfg, opts.distanceKm, dynamicMultiplier);

  const techFeeApplied = includeTechFee ? cfg.techFeeFixed : 0;
  const passengerPrice = tariff + techFeeApplied;

  const takeRatePct = cfg.takeRatePct;
  const commissionBase = clampMin(tariff, 0);
  const platformCommission = commissionBase * (takeRatePct / 100);
  const driverRepasse = passengerPrice - techFeeApplied - platformCommission;

  return {
    distanceKm: opts.distanceKm,
    dynamicMultiplier,
    tariffBeforeDynamic,
    tariff,
    techFeeApplied,
    passengerPrice,
    takeRatePct,
    platformCommission,
    driverRepasse,
  };
};

export const calcSplitFromPassengerPrice = (input: SplitFromPassengerPriceInput): SplitFromPassengerPriceResult => {
  const includeTechFee = input.includeTechFee !== false;
  const passengerPrice = clampMin(input.passengerPrice, 0);
  const techFeeApplied = includeTechFee ? clampMin(Math.min(clampMin(input.techFeeFixed, 0), passengerPrice), 0) : 0;
  const tariff = Math.max(0, passengerPrice - techFeeApplied);

  const takeRatePct = input.takeRatePct;
  const platformCommission = tariff * (takeRatePct / 100);
  const driverRepasse = passengerPrice - techFeeApplied - platformCommission;

  return {
    passengerPrice,
    techFeeApplied,
    tariff,
    takeRatePct,
    platformCommission,
    driverRepasse,
  };
};
