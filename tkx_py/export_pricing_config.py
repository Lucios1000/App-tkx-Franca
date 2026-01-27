import json
import os
import sqlite3
from datetime import datetime

from tkx_py.paths import get_db_path


def _safe_float(value, default):
    try:
        if value is None:
            return default
        return float(value)
    except Exception:
        return default


def _fetchone_dict(cursor, query, params=()):
    cursor.execute(query, params)
    row = cursor.fetchone()
    if not row:
        return None
    columns = [d[0] for d in cursor.description]
    return dict(zip(columns, row))


def export_pricing_config(output_path: str | None = None) -> str:
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    resolved_output_path = output_path or os.path.join(project_root, 'public', 'pricing_config.json')
    os.makedirs(os.path.dirname(resolved_output_path), exist_ok=True)

    defaults = {
        'tariff': {
            'base_fare': 4.00,
            'per_km': 2.02,
            'min_fare': 9.00,
            'tech_fee_fixed': 0.70,
            'take_rate_pct': 15.0,
            'included_km': 0.0,
        },
        'dynamic_schedules': [
            {'periodo': 'Madrugada', 'hora_inicio': '00:00', 'hora_fim': '05:59', 'multiplicador': 1.2},
            {'periodo': 'Normal', 'hora_inicio': '06:00', 'hora_fim': '17:59', 'multiplicador': 1.0},
            {'periodo': 'Pico', 'hora_inicio': '18:00', 'hora_fim': '20:59', 'multiplicador': 1.1},
            {'periodo': 'Noite', 'hora_inicio': '21:00', 'hora_fim': '23:59', 'multiplicador': 1.2},
        ],
        'heat_zones': [
            {'zone': 'Centro/Estação', 'multiplier': 1.40},
            {'zone': 'Leporace/Brasilândia', 'multiplier': 1.20},
            {'zone': 'City Petrópolis/Aeroporto', 'multiplier': 1.10},
            {'zone': 'Distrito Industrial', 'multiplier': 1.00},
        ],
        'event_multipliers': {
            'evento': {'min': 1.80, 'max': 2.50},
            'chuva': {'min': 1.80, 'max': 2.50},
        },
        'source': {
            'db_path': get_db_path(),
            'generated_at': datetime.utcnow().isoformat() + 'Z',
        },
    }

    config = json.loads(json.dumps(defaults))

    conn = sqlite3.connect(get_db_path())
    cursor = conn.cursor()

    try:
        try:
            row = _fetchone_dict(
                cursor,
                """
                SELECT
                    tarifa_base,
                    valor_por_km,
                    km_incluso,
                    tarifa_minima,
                    tech_fee_fixo,
                    take_rate_pct
                FROM pricing_config
                WHERE municipio = 'Franca'
                ORDER BY id DESC
                LIMIT 1
                """,
            )
        except sqlite3.Error:
            row = None

        if row:
            config['tariff']['base_fare'] = _safe_float(row.get('tarifa_base'), config['tariff']['base_fare'])
            config['tariff']['per_km'] = _safe_float(row.get('valor_por_km'), config['tariff']['per_km'])
            config['tariff']['included_km'] = _safe_float(row.get('km_incluso'), config['tariff']['included_km'])
            config['tariff']['min_fare'] = _safe_float(row.get('tarifa_minima'), config['tariff']['min_fare'])
            config['tariff']['tech_fee_fixed'] = _safe_float(row.get('tech_fee_fixo'), config['tariff']['tech_fee_fixed'])
            config['tariff']['take_rate_pct'] = _safe_float(row.get('take_rate_pct'), config['tariff']['take_rate_pct'])

        try:
            row = _fetchone_dict(
                cursor,
                """
                SELECT
                    tarifa_base_fixa,
                    valor_por_km,
                    custo_gateway_percentual,
                    seguro_app_fixo,
                    manutencao_app_fixo
                FROM configuracoes_estrategicas
                WHERE municipio = 'Franca'
                ORDER BY id DESC
                LIMIT 1
                """,
            )
        except sqlite3.Error:
            row = None

        if row:
            if not config.get('tariff', {}).get('base_fare'):
                config['tariff']['base_fare'] = _safe_float(row.get('tarifa_base_fixa'), config['tariff']['base_fare'])
                config['tariff']['per_km'] = _safe_float(row.get('valor_por_km'), config['tariff']['per_km'])

            gateway_pct = _safe_float(row.get('custo_gateway_percentual'), 2.5)
            config['costs'] = {
                'gateway_fee_pct': gateway_pct,
                'insurance_fixed': _safe_float(row.get('seguro_app_fixo'), 0.60),
                'maintenance_fixed': _safe_float(row.get('manutencao_app_fixo'), 0.40),
            }
        else:
            config['costs'] = {
                'gateway_fee_pct': 2.5,
                'insurance_fixed': 0.60,
                'maintenance_fixed': 0.40,
            }

        try:
            cursor.execute(
                """
                SELECT periodo, hora_inicio, hora_fim, multiplicador
                FROM tarifas_dinamicas
                ORDER BY hora_inicio
                """
            )
            rows = cursor.fetchall()
            if rows:
                config['dynamic_schedules'] = [
                    {
                        'periodo': r[0],
                        'hora_inicio': r[1],
                        'hora_fim': r[2],
                        'multiplicador': _safe_float(r[3], 1.0),
                    }
                    for r in rows
                ]
        except sqlite3.Error:
            pass

    finally:
        conn.close()

    with open(resolved_output_path, 'w', encoding='utf-8') as f:
        json.dump(config, f, ensure_ascii=False, indent=2)

    return resolved_output_path


if __name__ == '__main__':
    out = export_pricing_config()
    print(f"pricing_config.json gerado em: {out}")
