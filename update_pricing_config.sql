CREATE TABLE IF NOT EXISTS pricing_config (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  municipio TEXT NOT NULL DEFAULT 'Franca',
  tarifa_base REAL NOT NULL DEFAULT 4.00,
  valor_por_km REAL NOT NULL DEFAULT 2.02,
  km_incluso REAL NOT NULL DEFAULT 0.00,
  tarifa_minima REAL NOT NULL DEFAULT 9.00,
  tech_fee_fixo REAL NOT NULL DEFAULT 0.70,
  take_rate_pct REAL NOT NULL DEFAULT 15.00,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO pricing_config (
  municipio,
  tarifa_base,
  valor_por_km,
  km_incluso,
  tarifa_minima,
  tech_fee_fixo,
  take_rate_pct
)
SELECT
  'Franca',
  4.00,
  2.02,
  0.00,
  9.00,
  0.70,
  15.00
WHERE NOT EXISTS (
  SELECT 1 FROM pricing_config WHERE municipio = 'Franca'
);
