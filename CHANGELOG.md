# Changelog

## 0.1.1 - 2026-01-08

- Eventos: KPIs, distribuição Curva S (intensidade/pico), gráfico com pico, e exportação Excel com abas "Eventos" e "Eventos_Diário".
- Campanhas: suspensão/restauração por cenário, com persistência local e sincronização de backup. Sliders afetados desabilitados e zerados durante suspensão.
- Não-afetados preservados: Mídia OFF e Tráfego Pago mantidos ativos; restauração retorna aos valores antes da suspensão.
- MKT/CF: Prioridade visual para "Despesas Básicas" e "Marketing"; remoção de gating por "Custos Mínimos".
- Seletores estáveis (data-testid) para botões e sliders, visando robustez de testes.
- E2E: Adicionado `e2e/campaigns.spec.ts` (suspender/restaurar + persistência por cenário) e ampliado `e2e/events.spec.ts` (KPIs + exportação).
- Correções: ajustes em `renderKpis` e melhorias de sincronização/backup.

Notas:
- CI/E2E e Lighthouse configurados; GitHub Pages para preview.
- PWA habilitado (manifest + service worker) via Vite Plugin PWA.# Changelog

## v0.1.1 — Unreleased

### Added
- 

### Changed
- 

### Fixed
- 

### Performance
- 

### Docs
- 

## v0.1.0 — TKX Franca (PWA + Otimizações)

### Added
- Nova aba “PROJEÇÕES DE FESTAS/EVENTOS” com:
  - Entrada de período (calendário) e parâmetros de demanda (dinâmico %, corridas extra %, motoristas)
  - Distribuição “Constante” vs “Curva S” com intensidade (k) e posição de pico
  - KPIs, gráfico diário com `ReferenceLine` no pico e capacidade
  - Exportação Excel com “Eventos” e “Eventos_Diário” (inclui Distribuição, Intensidade e Pico)
- PWA (installable + offline básico): manifesto, service worker e ícone SVG

### Changed
- Marketing: sliders reorganizados priorizando “Despesas Básicas” e “Marketing” no topo
- Título comparativo atualizado para “Comparativo semestral (mesmo período até 36º Mês)”
- `vite.config.ts`: `base` em produção para `/Lucios1000-novos-apps/` (GitHub Pages)

### Fixed
- Remoção de “Custos Mínimos” do UI para evitar dependências ocultas de custos
- Oculta seletor de cenário na aba Eventos
- Tipagens e ErrorBoundary para evitar travamentos em runtime
- Engine: usuários iniciais começam em 0 quando cenário está zerado

### Performance
- Import dinâmico do `xlsx` (carrega apenas ao exportar)
- Split de chunks: `react`, `recharts`, `xlsx`, `lucide-react`

### Docs/Infra
- Deploy automático via GitHub Pages (Actions) com fallback SPA (404.html)
- README com Live Demo e instruções PWA
