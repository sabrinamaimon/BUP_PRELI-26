import React, { useState } from 'react';
import { 
  BarChart3, 
  Battery, 
  Sun, 
  TrendingUp, 
  Zap, 
  CheckCircle2, 
  Layers 
} from 'lucide-react';
import { formatNumber, formatCurrency, translations } from '../utils/localization';

export function DispatchChart({ scheduleData, rawScenario, lang }) {
  const t = translations[lang];
  const [hoveredHour, setHoveredHour] = useState(null);

  if (!scheduleData || !rawScenario) return null;

  const hours = scheduleData.hourly_plan;
  const rawHours = rawScenario.hours;
  const battery = rawScenario.battery;

  // Max value for scaling chart
  const maxDemand = Math.max(...rawHours.map(h => h.demand_kwh), 500);

  const activeHourData = hoveredHour !== null ? hours[hoveredHour] : null;
  const activeRawData = hoveredHour !== null ? rawHours[hoveredHour] : null;

  return (
    <div className="glass-panel chart-container">
      {/* Chart Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <BarChart3 size={20} color="var(--primary-400)" />
            {t.energyFlowTitle}
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            24-Hour equilibrium: Grid + Solar + Battery Discharge = Demand + Battery Charge
          </p>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem', fontSize: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: '#3b82f6' }}></span>
            <span style={{ color: 'var(--text-muted)' }}>{t.gridEnergy}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: '#10b981' }}></span>
            <span style={{ color: 'var(--text-muted)' }}>{t.solarEnergy}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: '#ec4899' }}></span>
            <span style={{ color: 'var(--text-muted)' }}>{t.batteryDischarge}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: '#eab308' }}></span>
            <span style={{ color: 'var(--text-muted)' }}>{t.batteryCharge}</span>
          </div>
        </div>
      </div>

      {/* 24-Hour Visual Bar Columns */}
      <div className="chart-bars-wrap">
        {hours.map((entry, idx) => {
          const raw = rawHours[idx];
          const isHovered = hoveredHour === idx;

          // Compute segment heights relative to maxDemand
          const gridHeight = (entry.grid_kwh / maxDemand) * 160;
          const solarHeight = (entry.solar_used_kwh / maxDemand) * 160;
          const dischargeHeight = entry.battery_action === 'discharge' ? (entry.battery_kwh / maxDemand) * 160 : 0;
          const chargeHeight = entry.battery_action === 'charge' ? (entry.battery_kwh / maxDemand) * 160 : 0;

          return (
            <div 
              key={idx} 
              className="hour-column"
              onMouseEnter={() => setHoveredHour(idx)}
              onMouseLeave={() => setHoveredHour(null)}
              style={{ cursor: 'pointer' }}
            >
              {/* Charge Bar indicator floating on top */}
              {chargeHeight > 0 && (
                <div 
                  className="bar-segment bar-charge" 
                  style={{ height: `${Math.max(4, chargeHeight)}px`, marginBottom: 2 }}
                  title={`Charge: ${entry.battery_kwh} kWh`}
                />
              )}

              {/* Stacked Energy Sources */}
              {dischargeHeight > 0 && (
                <div 
                  className="bar-segment bar-discharge" 
                  style={{ height: `${Math.max(4, dischargeHeight)}px` }} 
                />
              )}
              {solarHeight > 0 && (
                <div 
                  className="bar-segment bar-solar" 
                  style={{ height: `${Math.max(4, solarHeight)}px` }} 
                />
              )}
              {gridHeight > 0 && (
                <div 
                  className="bar-segment bar-grid" 
                  style={{ 
                    height: `${Math.max(4, gridHeight)}px`,
                    boxShadow: isHovered ? '0 0 12px #3b82f6' : 'none'
                  }} 
                />
              )}

              <div 
                className="hour-axis-label"
                style={{ color: isHovered ? 'var(--primary-300)' : 'var(--text-muted)', fontWeight: isHovered ? 800 : 400 }}
              >
                {formatNumber(idx, lang)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Tooltip Inspector */}
      {activeHourData && activeRawData && (
        <div style={{
          marginTop: '1rem',
          padding: '0.85rem 1.25rem',
          background: 'rgba(16, 185, 129, 0.08)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-glass-bright)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          fontSize: '0.825rem'
        }}>
          <div>
            <span style={{ fontWeight: 800, color: 'var(--primary-300)', fontSize: '0.95rem' }}>
              Hour {formatNumber(activeHourData.hour, lang)}:00
            </span>
            <span style={{ color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
              Demand: {formatNumber(activeRawData.demand_kwh, lang)} kWh
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span>Grid: <strong style={{ color: '#60a5fa' }}>{formatNumber(activeHourData.grid_kwh, lang)} kWh</strong></span>
            <span>Solar: <strong style={{ color: '#34d399' }}>{formatNumber(activeHourData.solar_used_kwh, lang)} kWh</strong></span>
            <span>BESS: <strong style={{ color: activeHourData.battery_action === 'charge' ? '#fbbf24' : activeHourData.battery_action === 'discharge' ? '#f472b6' : 'var(--text-muted)' }}>
              {activeHourData.battery_action} ({formatNumber(activeHourData.battery_kwh, lang)} kWh)
            </strong></span>
            <span>SOC: <strong style={{ color: '#38bdf8' }}>{formatNumber(activeHourData.battery_energy_after_kwh, lang)} kWh</strong></span>
            <span>Tariff: <strong style={{ color: 'var(--accent-amber)' }}>৳ {formatNumber(activeRawData.tariff_bdt_per_kwh, lang)}</strong></span>
          </div>
        </div>
      )}

      {/* Battery SOC Progression Line */}
      <div style={{ marginTop: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Battery size={16} color="#38bdf8" />
            {t.batterySocTitle}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--primary-400)', fontFamily: 'var(--font-mono)' }}>
            Start: {formatNumber(battery.initial_energy_kwh, lang)} kWh ➔ End: {formatNumber(hours[23].battery_energy_after_kwh, lang)} kWh (100% Balanced)
          </span>
        </div>

        <div className="soc-timeline-wrap">
          {hours.map((entry, idx) => {
            const pct = Math.round((entry.battery_energy_after_kwh / battery.capacity_kwh) * 100);
            return (
              <div 
                key={idx}
                className="soc-chip"
                style={{
                  background: entry.battery_action === 'charge' ? 'rgba(234, 179, 8, 0.15)' : entry.battery_action === 'discharge' ? 'rgba(236, 72, 153, 0.15)' : 'rgba(56, 189, 248, 0.08)',
                  borderColor: entry.battery_action === 'charge' ? 'rgba(234, 179, 8, 0.4)' : entry.battery_action === 'discharge' ? 'rgba(236, 72, 153, 0.4)' : 'rgba(56, 189, 248, 0.2)'
                }}
                title={`Hour ${idx}: ${entry.battery_energy_after_kwh} kWh (${pct}%)`}
              >
                <div>{formatNumber(Math.round(entry.battery_energy_after_kwh), lang)}</div>
                <div style={{ fontSize: '0.55rem', opacity: 0.7 }}>{formatNumber(idx, lang)}h</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
