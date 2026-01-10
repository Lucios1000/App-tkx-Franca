import { describe, it, expect } from 'vitest';
import { calculateTechnicalTicket } from './InitialPlanningTab';

describe('Cálculo do Ticket Técnico (Unit Economics)', () => {
  // Cenário 1: Corrida padrão onde o custo técnico supera a tarifa mínima
  it('deve calcular o custo base corretamente (sem dinâmica)', () => {
    const baseFare = 2.00;
    const costPerKm = 2.00;
    const avgDistance = 5; // 5km * 2.00 = 10.00
    const costPerMin = 0.30;
    const avgTime = 10; // 10min * 0.30 = 3.00
    const minFare = 5.00;
    const dynamic = 1.0;

    // Cálculo esperado: 2.00 + 10.00 + 3.00 = 15.00
    const result = calculateTechnicalTicket(baseFare, costPerKm, avgDistance, costPerMin, avgTime, minFare, dynamic);
    expect(result).toBe(15.00);
  });

  // Cenário 2: Corrida curta onde a tarifa mínima deve prevalecer
  it('deve aplicar a tarifa mínima quando o custo calculado for menor', () => {
    const baseFare = 2.00;
    const costPerKm = 2.00;
    const avgDistance = 1; // 2.00
    const costPerMin = 0.30;
    const avgTime = 5; // 1.50
    const minFare = 11.50; // Mínima alta
    const dynamic = 1.0;

    // Custo bruto: 2.00 + 2.00 + 1.50 = 5.50. Mínima é 11.50.
    const result = calculateTechnicalTicket(baseFare, costPerKm, avgDistance, costPerMin, avgTime, minFare, dynamic);
    expect(result).toBe(11.50);
  });

  // Cenário 3: Aplicação de Dinâmica (ex: Madrugada)
  it('deve multiplicar o resultado final pelo fator dinâmico', () => {
    // Usando os mesmos valores do Cenário 1 (Base 15.00)
    // Dinâmica de 1.4x
    const result = calculateTechnicalTicket(2.00, 2.00, 5, 0.30, 10, 5.00, 1.4);
    
    // Esperado: 15.00 * 1.4 = 21.00
    expect(result).toBeCloseTo(21.00, 2);
  });
});
