import React from 'react';
import { Table, Download } from 'lucide-react';
import { formatNumber, formatCurrency, translations } from '../utils/localization';

export function ScheduleTable({ scheduleData, rawScenario, lang }) {
  const t = translations[lang];

  if (!scheduleData || !rawScenario) return null;

  const hours = scheduleData.hourly_plan;
  const rawHours = rawScenario.hours;

  const exportCsv = () => {
    const header = "Hour,Demand(kWh),Solar(kWh),SolarUsed(kWh),Tariff(BDT),BatteryAction,BatteryKwh,SOC_After(kWh),GridImport(kWh),HourlyCost(BDT)\n";
    const rows = hours.map((h, idx) => {
      const raw = rawHours[idx];
      const cost = Math.round(h.grid_kwh * raw.tariff_bdt_per_kwh * 100) / 100;
      return `${h.hour},${raw.demand_kwh},${raw.solar_kwh},${h.solar_used_kwh},${raw.tariff_bdt_per_kwh},${h.battery_action},${h.battery_kwh},${h.battery_energy_after_kwh},${h.grid_kwh},${cost}`;
    }).join('\n');

    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `gridwise_schedule_${scheduleData.scenario_id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Table size={20} color="var(--primary-400)" />
            {t.tabSchedule} ({formatNumber(24, lang)} {lang === 'bn' ? 'ঘণ্টা' : 'Hours'})
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Comprehensive hourly dispatch telemetry and storage state machine audit
          </p>
        </div>

        <button className="btn-secondary" onClick={exportCsv} style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}>
          <Download size={14} />
          <span>Export CSV</span>
        </button>
      </div>

      <div className="table-responsive-wrap">
        <table className="schedule-table">
          <thead>
            <tr>
              <th>{t.hourCol}</th>
              <th>{t.demandCol}</th>
              <th>{t.solarCol}</th>
              <th>{t.effectiveSolarCol}</th>
              <th>{t.tariffCol}</th>
              <th>{t.actionCol}</th>
              <th>{t.batteryKwhCol}</th>
              <th>{t.socAfterCol}</th>
              <th>{t.gridImportCol}</th>
              <th>{t.costCol}</th>
            </tr>
          </thead>
          <tbody>
            {hours.map((entry, idx) => {
              const raw = rawHours[idx];
              const cost = entry.grid_kwh * raw.tariff_bdt_per_kwh;

              let actionBadgeClass = 'badge-idle';
              if (entry.battery_action === 'charge') actionBadgeClass = 'badge-charge';
              if (entry.battery_action === 'discharge') actionBadgeClass = 'badge-discharge';

              return (
                <tr key={idx}>
                  <td style={{ fontWeight: 700, color: 'var(--primary-300)' }}>
                    {formatNumber(entry.hour, lang)}:00
                  </td>
                  <td>{formatNumber(raw.demand_kwh, lang)}</td>
                  <td>{formatNumber(raw.solar_kwh, lang)}</td>
                  <td style={{ color: 'var(--primary-400)' }}>
                    {formatNumber(entry.solar_used_kwh, lang)}
                  </td>
                  <td style={{ color: 'var(--accent-amber)' }}>
                    {formatCurrency(raw.tariff_bdt_per_kwh, lang)}
                  </td>
                  <td>
                    <span className={`badge-action ${actionBadgeClass}`}>
                      {entry.battery_action}
                    </span>
                  </td>
                  <td>
                    {entry.battery_kwh > 0 ? formatNumber(entry.battery_kwh, lang) : '—'}
                  </td>
                  <td style={{ fontWeight: 600, color: '#38bdf8' }}>
                    {formatNumber(entry.battery_energy_after_kwh, lang)}
                  </td>
                  <td style={{ fontWeight: 700, color: '#60a5fa' }}>
                    {formatNumber(entry.grid_kwh, lang)}
                  </td>
                  <td style={{ fontWeight: 700, color: '#f1f5f9' }}>
                    {formatCurrency(cost, lang)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
