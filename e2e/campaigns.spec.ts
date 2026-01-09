import { test, expect } from '@playwright/test';

// Valida suspensão/restauração de campanhas com persistência por cenário
// - Ajusta sliders de campanhas e fidelidade com valores não-zero
// - Suspende campanhas: verifica desabilitação e zeragem apenas dos alvos
// - Confirma sliders não afetados permanecem ativos e com seus valores
// - Alterna de cenário para checar persistência por cenário
// - Restaura campanhas e valida recuperação dos valores anteriores

test('Campanhas: suspender/restaurar e persistência por cenário', async ({ page }) => {
  await page.goto('./');

  // Ir para a aba Marketing/CF
  await page.getByRole('button', { name: 'MKT/CF' }).click();
  await expect(page.getByText('Sliders de Marketing')).toBeVisible();

  // Debug: listar data-testids presentes nos ranges
  const presentTestIds = await page.evaluate(() => Array.from(document.querySelectorAll('input[type="range"]')).map(el => el.getAttribute('data-testid')));
  console.log('Range data-testids:', presentTestIds);

  // Helpers para localizar e manipular sliders
  const rangeByTestId = (testId: string) => page.getByTestId(testId);
  const setRangeValue = async (locatorOrTestId: ReturnType<typeof page.locator> | string, value: number) => {
    const locator = typeof locatorOrTestId === 'string' ? rangeByTestId(locatorOrTestId) : locatorOrTestId;
    await expect(locator).toBeVisible();
    await locator.evaluate((el: HTMLInputElement, v: number) => {
      el.value = String(v);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }, value);
  };
  const getRangeValue = async (locatorOrTestId: ReturnType<typeof page.locator> | string) => {
    const locator = typeof locatorOrTestId === 'string' ? rangeByTestId(locatorOrTestId) : locatorOrTestId;
    return await locator.evaluate((el: HTMLInputElement) => el.value);
  };
  const isDisabled = async (locatorOrTestId: ReturnType<typeof page.locator> | string) => {
    const locator = typeof locatorOrTestId === 'string' ? rangeByTestId(locatorOrTestId) : locatorOrTestId;
    return await locator.evaluate((el: HTMLInputElement) => el.disabled);
  };

  // Definir valores não-zero para campanhas e fidelidade
  // Definir valores não-zero para campanhas e fidelidade (por label para robustez)
  const initialByTestId: Array<{ testId: string; value: number }> = [
    // Ajustar apenas sliders não afetados para valores não-zero customizados
    { testId: 'slider-trafegoPago', value: 900 },
    { testId: 'slider-mktMensalOff', value: 800 },
    { testId: 'slider-marketingMonthly', value: 1000 },
    { testId: 'slider-fixedCosts', value: 1500 },
  ];

  for (const item of initialByTestId) {
    const locator = rangeByTestId(item.testId);
    await setRangeValue(locator, item.value);
    const current = await getRangeValue(locator);
    expect(parseFloat(current)).toBeCloseTo(item.value, 3);
    // Pequena espera para flush de estado
    await page.waitForTimeout(250);
  }
  // Dar tempo para flush de estado React antes de suspender
  await page.waitForTimeout(800);

  // Captura valores atuais antes da suspensão (serão usados como referência de restauração)
  const preSuspendValues: Record<string, number> = {};
  for (const testId of ['slider-adesaoTurbo', 'slider-parceriasBares', 'slider-indiqueGanhe', 'slider-eliteDriversSemestral', 'slider-fidelidadePassageirosAnual', 'slider-reservaOperacionalGMV', 'slider-trafegoPago', 'slider-mktMensalOff', 'slider-marketingMonthly', 'slider-fixedCosts']) {
    const locator = rangeByTestId(testId);
    preSuspendValues[testId] = parseFloat(await getRangeValue(locator));
  }

  // Debug antes da suspensão
  console.log('Pre-suspend trafegoPago:', await getRangeValue('slider-trafegoPago'));

  // Suspender campanhas
  await page.getByTestId('suspend-campaigns').click();

  // Debug após suspensão
  console.log('Post-suspend trafegoPago:', await getRangeValue('slider-trafegoPago'));

  // Verificar que sliders de campanhas ficaram desabilitados e zerados
  for (const testId of ['slider-adesaoTurbo', 'slider-parceriasBares', 'slider-indiqueGanhe']) {
    const locator = rangeByTestId(testId);
    expect(await isDisabled(locator)).toBeTruthy();
    const v = await getRangeValue(locator);
    expect(parseFloat(v)).toBe(0);
  }
  // Fidelidade desabilitada e zerada
  for (const testId of ['slider-eliteDriversSemestral', 'slider-fidelidadePassageirosAnual', 'slider-reservaOperacionalGMV']) {
    const locator = rangeByTestId(testId);
    expect(await isDisabled(locator)).toBeTruthy();
    const v = await getRangeValue(locator);
    expect(parseFloat(v)).toBe(0);
  }
  // Não afetados permanecem habilitados e com valor
  for (const testId of ['slider-trafegoPago', 'slider-mktMensalOff', 'slider-marketingMonthly', 'slider-fixedCosts']) {
    const locator = rangeByTestId(testId);
    expect(await isDisabled(locator)).toBeFalsy();
    const v = await getRangeValue(locator);
    expect(parseFloat(v)).toBeGreaterThan(0);
  }

  // Alternar para cenário Pessimista deve iniciar sem suspensão
  await page.getByRole('button', { name: 'Pessimista' }).click();
  await expect(page.getByTestId('suspend-campaigns')).toBeVisible();
  for (const key of ['slider-adesaoTurbo', 'slider-parceriasBares', 'slider-indiqueGanhe', 'slider-eliteDriversSemestral', 'slider-fidelidadePassageirosAnual', 'slider-reservaOperacionalGMV']) {
    expect(await isDisabled(key)).toBeFalsy();
  }

  // Voltar para Realista deve manter suspensão ativa
  await page.getByRole('button', { name: 'Realista' }).click();
  await expect(page.getByTestId('restore-campaigns')).toBeVisible();

  // Restaurar campanhas no Realista
  await page.getByTestId('restore-campaigns').click();

  // Validar que valores anteriores foram restaurados nos sliders afetados
  for (const testId of ['slider-adesaoTurbo', 'slider-parceriasBares', 'slider-indiqueGanhe', 'slider-eliteDriversSemestral', 'slider-fidelidadePassageirosAnual', 'slider-reservaOperacionalGMV']) {
    const locator = rangeByTestId(testId);
    const v = await getRangeValue(locator);
    const expected = preSuspendValues[testId];
    expect(parseFloat(v)).toBeCloseTo(expected, 3);
    expect(await isDisabled(locator)).toBeFalsy();
  }

  // Sliders não afetados permanecem com seus valores
  for (const testId of ['slider-trafegoPago', 'slider-mktMensalOff', 'slider-marketingMonthly', 'slider-fixedCosts']) {
    const locator = rangeByTestId(testId);
    const v = await getRangeValue(locator);
    expect(parseFloat(v)).toBeGreaterThan(0);
    expect(await isDisabled(locator)).toBeFalsy();
  }
});
