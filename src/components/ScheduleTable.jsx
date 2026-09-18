import React from 'react';
import { Table, Download, Lightbulb } from 'lucide-react';
import { formatNumber, formatCurrency, translations } from '../utils/localization';

export function ScheduleTable({ scheduleData, rawScenario, lang }) {
  const t = translations[lang];

  if (!scheduleData || !rawScenario) return null;

  const hours = scheduleData.hourly_plan;
  const rawHours = rawScenario.hours;

  const exportCsv = () => {
    const header = "Hour,Demand(kWh),Solar(kWh),SolarUsed(kWh),Tariff(BDT),BatteryAction,BatteryKwh,SOC_After(kWh),GridImport(kWh),HourlyCost(BDT),DecisionRationale\n";
    const rows = hours.map((h, idx) => {
      const raw = rawHours[idx];
      const cost = Math.round(h.grid_kwh * raw.tariff_bdt_per_kwh * 100) / 100;
      const rationale = (lang === 'bn' ? h.decision_rationale_bn : h.decision_rationale_en).replace(/,/g, ';');
      return `${h.hour},${raw.demand_kwh},${raw.solar_kwh},${h.solar_used_kwh},${raw.tariff_bdt_per_kwh},${h.battery_action},${h.battery_kwh},${h.battery_energy_after_kwh},${h.grid_kwh},${cost},"${rationale}"`;
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
    <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2.5rem', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Table size={24} color="var(--primary-600)" />
            {t.tabSchedule} ({formatNumber(24, lang)} {lang === 'bn' ? 'ঘণ্টার সম্পূর্ণ অডিট' : 'Hourly Complete Audit'})
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            {lang === 'bn' ? 'প্রতি ঘণ্টার এনার্জি ভারসাম্য ও গাণিতিক সিদ্ধান্তের পূর্ণাঙ্গ বিবরণ' : 'Comprehensive hourly dispatch telemetry, BESS cycling, and decision intelligence rationale'}
          </p>
        </div>

        <button className="btn-secondary" onClick={exportCsv} style={{ fontSize: '0.85rem', padding: '0.6rem 1.25rem' }}>
          <Download size={16} />
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
              <th>{lang === 'bn' ? 'সিদ্ধান্তের কারণ (Rationale)' : 'Decision Intelligence Rationale'}</th>
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
                  <td style={{ fontWeight: 800, color: 'var(--primary-700)' }}>
                    {formatNumber(entry.hour, lang)}:00
                  </td>
                  <td>{formatNumber(raw.demand_kwh, lang)}</td>
                  <td>{formatNumber(raw.solar_kwh, lang)}</td>
                  <td style={{ color: 'var(--primary-700)', fontWeight: 700 }}>
                    {formatNumber(entry.solar_used_kwh, lang)}
                  </td>
                  <td style={{ color: 'var(--accent-amber)', fontWeight: 800 }}>
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
                  <td style={{ fontWeight: 800, color: '#0284c7' }}>
                    {formatNumber(entry.battery_energy_after_kwh, lang)}
                  </td>
                  <td style={{ fontWeight: 900, color: '#2563eb' }}>
                    {formatNumber(entry.grid_kwh, lang)}
                  </td>
                  <td style={{ fontWeight: 800, color: 'var(--text-main)' }}>
                    {formatCurrency(cost, lang)}
                  </td>
                  <td style={{ maxWidth: '320px', fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'inherit' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
                      <Lightbulb size={14} color="var(--accent-amber)" style={{ flexShrink: 0, marginTop: '3px' }} />
                      <span>{lang === 'bn' ? entry.decision_rationale_bn : entry.decision_rationale_en}</span>
                    </div>
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
