import { test, expect } from '@playwright/test';

function parseBRLCurrency(text: string): number {
  // e.g., "R$ 19,25" → 19.25
  const normalized = text.replace(/[^0-9,\.]/g, '')
                         .replace(/\./g, '')
                         .replace(/,/g, '.');
  const val = Number(normalized);
  return isNaN(val) ? 0 : val;
}

async function setRangeValue(page, testId: string, value: number) {
  const locator = page.getByTestId(testId);
  await locator.evaluate((el, v) => {
    (el as HTMLInputElement).value = String(v);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, value);
}

async function setNumberInput(page, testId: string, value: string | number) {
  const locator = page.getByTestId(testId);
  await locator.evaluate((el, v) => {
    (el as HTMLInputElement).value = String(v);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, value);
}

test('Simulador Técnico: controles e cálculo do ticket', async ({ page }) => {
  await page.goto('/#tab=16');

  // Controles presentes
  const minFare = page.getByTestId('sim-min-fare');
  const hourMult = page.getByTestId('sim-hour-multiplier');
  const baseFare = page.getByTestId('sim-base-fare');
  const kmRate = page.getByTestId('sim-km-rate');
  const simKm = page.getByTestId('sim-km');
  const simMinutes = page.getByTestId('sim-minutes');
  const dynamicPct = page.getByTestId('sim-dynamic-pct');
  const technicalTicket = page.getByTestId('sim-technical-ticket');

  await expect(minFare).toBeVisible();
  await expect(hourMult).toBeVisible();
  await expect(baseFare).toBeVisible();
  await expect(kmRate).toBeVisible();
  await expect(simKm).toBeVisible();
  await expect(simMinutes).toBeVisible();
  await expect(dynamicPct).toBeVisible();
  await expect(technicalTicket).toBeVisible();

  // Valor inicial esperado: [(1.0*1.0) + 11.5 + (2.0*2.5)] * 1.10 = 19.25
  let text = await technicalTicket.textContent();
  const initial = parseBRLCurrency(text || '0');
  expect(initial).toBeGreaterThan(19.2);
  expect(initial).toBeLessThan(19.3);

  // Ajusta multiplicador horário: Tabela 3 (30%) → 1.3
  await hourMult.selectOption('1.3');
  text = await technicalTicket.textContent();
  let val = parseBRLCurrency(text || '0');
  // Esperado: (1*1.3)+11.5+(2*2.5)=17.8 *1.1=19.58
  expect(val).toBeGreaterThan(19.57);
  expect(val).toBeLessThan(19.59);

  // Mantém base e km; valida somente multiplicador
  // Continuar com outras validações sem editar inputs numéricos

  // Minutos são informativos: mudar não deve alterar o ticket
  const beforeMinutes = val;
  await setNumberInput(page, 'sim-minutes', '30');
  text = await technicalTicket.textContent();
  val = parseBRLCurrency(text || '0');
  expect(Math.abs(val - beforeMinutes)).toBeLessThan(0.01);

  // Zera dinâmica e valida efeito
  await page.getByTestId('sim-dynamic-pct').fill('0');
  text = await technicalTicket.textContent();
  val = parseBRLCurrency(text || '0');
  // Esperado após multiplicador 1.3: (1.3+11.5+5)=17.8
  expect(val).toBeGreaterThan(17.79);
  expect(val).toBeLessThan(17.81);
});

test('Multiplicador Horário: labels das opções', async ({ page }) => {
  await page.goto('/#tab=16');
  const sel = page.getByTestId('sim-hour-multiplier');
  await expect(sel).toBeVisible();
  const optionsText = await sel.locator('option').allTextContents();
  expect(optionsText.some(t => t.includes('Tabela 0'))).toBeTruthy();
  expect(optionsText.some(t => t.includes('Tabela 1'))).toBeTruthy();
  expect(optionsText.some(t => t.includes('Tabela 2'))).toBeTruthy();
  expect(optionsText.some(t => t.includes('Tabela 3'))).toBeTruthy();
});
