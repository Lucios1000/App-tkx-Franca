# Changelog

## v0.1.0 — TKX Franca (PWA + Otimizações)

- Deploy automático via GitHub Pages (Actions) com SPA fallback (404.html)
- Vite `base` configurado para `/Lucios1000-novos-apps/`
- PWA: manifesto, service worker e ícone SVG (installable + offline básico)
- Performance: split de chunks (react, recharts, xlsx, lucide) e import dinâmico do `xlsx`
- UI/Funcionalidades:
  - Nova aba “PROJEÇÕES DE FESTAS/EVENTOS” (calendário, distribuição Constante/Curva S, intensidade/pico, KPI, gráfico, exportação Excel)
  - Suspender/Reativar Campanhas (zera e desabilita Adesão/Parcerias/Indique + Elite/Fidelidade/Reserva; mantém Mídia OFF / Tráfego Pago)
  - Sliders de Marketing reorganizados e “Despesas Básicas” em destaque
  - Remoção de “Custos Mínimos” do UI
  - Título comparativo: “Comparativo semestral (mesmo período até 36º Mês)”
- Engine: usuários iniciais = 0 para cenários zerados
- Docs: README com Live Demo + instrução PWA
