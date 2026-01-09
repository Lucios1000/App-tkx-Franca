import { test, expect } from '@playwright/test';

function parseBRLCurrency(text: string): number {
  const normalized = text
    .replace(/[^0-9,\.]/g, '')
    .replace(/\./g, '')
    .replace(/,/g, '.');
  const val = Number(normalized);
  return isNaN(val) ? 0 : val;
}

async function getColumnIndexByHeader(page, headerText: string): Promise<number> {
  const headers = await page.locator('table thead tr th').allTextContents();
  const idx = headers.findIndex(h => h.trim().toLowerCase() === headerText.trim().toLowerCase());
  return idx; // zero-based
}

async function getCellValueByColumnIndex(page, rowIndex: number, colIndex: number): Promise<number> {
  const cell = page.locator(`table tbody tr:nth-of-type(${rowIndex + 1}) td`).nth(colIndex);
  const text = (await cell.textContent()) || '';
  return parseBRLCurrency(text);
}

test.describe('DRE detalhado: descontos e variáveis', () => {
  test('Headers presentes e sem coluna TECH', async ({ page }) => {
    await page.goto('./#tab=7');
    await expect(page.getByText('DRE detalhado')).toBeVisible();

    const headers = await page.locator('table thead tr th').allTextContents();
    const headerTexts = headers.map(h => h.trim().toLowerCase());

    expect(headerTexts).toContain('gateway');
    expect(headerTexts).toContain('seguro');
    expect(headerTexts).toContain('manutenção');
    expect(headerTexts).toContain('provisão');
    expect(headerTexts).toContain('variáveis (total)');

    // Não deve existir coluna TECH
    expect(headerTexts.some(h => h.includes('tech'))).toBeFalsy();
  });

  test('Variáveis (Total) = soma de Gateway + Seguro + Manutenção + Provisão', async ({ page }) => {
    await page.goto('./#tab=7');
    await expect(page.getByText('DRE detalhado')).toBeVisible();

    // Descobrir índices pelas headers para não depender de ordem fixa
    const idxGateway = await getColumnIndexByHeader(page, 'Gateway');
    const idxSeguro = await getColumnIndexByHeader(page, 'Seguro');
    const idxManutencao = await getColumnIndexByHeader(page, 'Manutenção');
    const idxProvisao = await getColumnIndexByHeader(page, 'Provisão');
    const idxVariaveis = await getColumnIndexByHeader(page, 'Variáveis (Total)');

    // Pegar a primeira linha visível
    const gateway = await getCellValueByColumnIndex(page, 0, idxGateway);
    const seguro = await getCellValueByColumnIndex(page, 0, idxSeguro);
    const manutencao = await getCellValueByColumnIndex(page, 0, idxManutencao);
    const provisao = await getCellValueByColumnIndex(page, 0, idxProvisao);
    const variaveisTotal = await getCellValueByColumnIndex(page, 0, idxVariaveis);

    const sum = gateway + seguro + manutencao + provisao;
    // Tolerância pequena para arredondamentos de exibição
    expect(Math.abs(variaveisTotal - sum)).toBeLessThan(0.01);
  });
});
