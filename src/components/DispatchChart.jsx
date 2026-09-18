import React, { useState } from 'react';
import { 
  BarChart3, 
  Battery, 
  Sun, 
  TrendingUp, 
  Zap, 
  CheckCircle2, 
  Layers,
  Lightbulb,
  SplitSquareVertical,
  ShieldAlert
} from 'lucide-react';
import { formatNumber, formatCurrency, translations } from '../utils/localization';

export function DispatchChart({ scheduleData, rawScenario, baselineData, lang }) {
  const t = translations[lang];
  const [hoveredHour, setHoveredHour] = useState(13);
  const [showDiff, setShowDiff] = useState(false);

  if (!scheduleData || !rawScenario) return null;

  const hours = scheduleData.hourly_plan;
  const rawHours = rawScenario.hours;
  const battery = rawScenario.battery;

  const maxDemand = Math.max(...rawHours.map(h => h.demand_kwh), 500);

  const activeHourData = hoveredHour !== null ? hours[hoveredHour] : hours[13];
  const activeRawData = hoveredHour !== null ? rawHours[hoveredHour] : rawHours[13];
  const activeBaselineData = (baselineData && hoveredHour !== null) ? baselineData.hourly_plan[hoveredHour] : null;

  // Cost difference due to operator directives
  const diffCost = baselineData ? scheduleData.total_cost_bdt - baselineData.total_cost_bdt : 0;

  return (
    <div className="glass-panel chart-container">
      {/* Chart Header & Controls */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1.25rem', marginBottom: '1.5rem' }}>
        <div>
          <h3 style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <BarChart3 size={24} color="var(--primary-600)" />
            {t.energyFlowTitle}
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            {lang === 'bn' ? '২৪ ঘণ্টার ভারসাম্য: গ্রিড + সৌর + ব্যাটারি ডিসচার্জ = চাহিদা + চার্জ' : '24-Hour equilibrium: Grid + Solar + Battery Discharge = Demand + Battery Charge'}
          </p>
        </div>

        {/* Diff Mode Toggle & Legend */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1.25rem' }}>
          {baselineData && (
            <button
              className={`icon-toggle-btn ${showDiff ? 'active' : ''}`}
              onClick={() => setShowDiff(!showDiff)}
              style={{
                borderColor: showDiff ? 'var(--primary-500)' : 'var(--border-glass)',
                background: showDiff ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-surface)'
              }}
            >
              <SplitSquareVertical size={16} color="var(--primary-600)" />
              <span>{lang === 'bn' ? 'নোটের প্রভাব বিশ্লেষণ' : 'Compare Directive Impact'}</span>
            </button>
          )}

          {/* Legend */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem', fontSize: '0.8rem', fontWeight: 700 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ width: 12, height: 12, borderRadius: 3, background: '#3b82f6' }}></span>
              <span style={{ color: 'var(--text-muted)' }}>{t.gridEnergy}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ width: 12, height: 12, borderRadius: 3, background: '#10b981' }}></span>
              <span style={{ color: 'var(--text-muted)' }}>{t.solarEnergy}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ width: 12, height: 12, borderRadius: 3, background: '#ec4899' }}></span>
              <span style={{ color: 'var(--text-muted)' }}>{t.batteryDischarge}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ width: 12, height: 12, borderRadius: 3, background: '#f59e0b' }}></span>
              <span style={{ color: 'var(--text-muted)' }}>{t.batteryCharge}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Diff Mode Alert Banner */}
      {showDiff && baselineData && (
        <div style={{
          background: 'rgba(37, 99, 235, 0.08)',
          border: '1.5px solid rgba(37, 99, 235, 0.3)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.85rem 1.25rem',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          fontSize: '0.85rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <ShieldAlert size={18} color="#3b82f6" />
            <span>
              {lang === 'bn' 
                ? `অপারেটর নির্দেশিকা মানার কারণে বিদ্যুৎ ব্যয়ে পার্থক্য: ${formatCurrency(Math.abs(diffCost), lang)} (${diffCost > 0 ? 'নিরাপত্তা রক্ষণাবেক্ষণ খরচ' : 'অতিরিক্ত সাশ্রয়'})`
                : `Directive Impact Differential: ${formatCurrency(Math.abs(diffCost), lang)} (${diffCost > 0 ? 'Safety Procurement Margin' : 'Additional Direct Savings'})`}
            </span>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--primary-700)' }}>
            Baseline: {formatCurrency(baselineData.total_cost_bdt, lang)} ➔ Directives: {formatCurrency(scheduleData.total_cost_bdt, lang)}
          </div>
        </div>
      )}

      {/* 24-Hour Visual Bar Columns */}
      <div className="chart-bars-wrap">
        {hours.map((entry, idx) => {
          const raw = rawHours[idx];
          const isHovered = hoveredHour === idx;
          const isDirectiveHour = entry.directive_active;

          const gridHeight = (entry.grid_kwh / maxDemand) * 180;
          const solarHeight = (entry.solar_used_kwh / maxDemand) * 180;
          const dischargeHeight = entry.battery_action === 'discharge' ? (entry.battery_kwh / maxDemand) * 180 : 0;
          const chargeHeight = entry.battery_action === 'charge' ? (entry.battery_kwh / maxDemand) * 180 : 0;

          return (
            <div 
              key={idx} 
              className="hour-column"
              onClick={() => setHoveredHour(idx)}
              onMouseEnter={() => setHoveredHour(idx)}
              style={{ cursor: 'pointer' }}
            >
              {/* Directive Active Flag Dot on Top */}
              {isDirectiveHour && (
                <div 
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: 'var(--accent-amber)',
                    margin: '0 auto 4px auto',
                    boxShadow: '0 0 8px var(--accent-amber)'
                  }}
                  title={entry.directive_note}
                />
              )}

              {/* Charge Bar indicator */}
              {chargeHeight > 0 && (
                <div 
                  className="bar-segment bar-charge" 
                  style={{ height: `${Math.max(4, chargeHeight)}px`, marginBottom: 2 }}
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
                    boxShadow: isHovered ? '0 0 14px #3b82f6' : 'none'
                  }} 
                />
              )}

              <div 
                className="hour-axis-label"
                style={{ 
                  color: isHovered ? 'var(--primary-600)' : 'var(--text-muted)', 
                  fontWeight: isHovered ? 900 : 700,
                  transform: isHovered ? 'scale(1.15)' : 'none',
                  transition: 'transform 0.15s ease'
                }}
              >
                {formatNumber(idx, lang)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Decision Intelligence Tooltip Inspector (Why this Decision?) */}
      {activeHourData && activeRawData && (
        <div style={{
          marginTop: '1.5rem',
          padding: '1.25rem 1.75rem',
          background: 'rgba(16, 185, 129, 0.08)',
          borderRadius: 'var(--radius-md)',
          border: '1.5px solid var(--border-glass-bright)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem'
        }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontWeight: 900, color: 'var(--primary-700)', fontSize: '1.15rem' }}>
                Hour {formatNumber(activeHourData.hour, lang)}:00
              </span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Demand: <strong>{formatNumber(activeRawData.demand_kwh, lang)} kWh</strong>
              </span>
              <span style={{ color: 'var(--accent-amber)', fontSize: '0.9rem', fontWeight: 800 }}>
                Tariff: {formatCurrency(activeRawData.tariff_bdt_per_kwh, lang)}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', fontSize: '0.875rem' }}>
              <span>Grid: <strong style={{ color: '#3b82f6' }}>{formatNumber(activeHourData.grid_kwh, lang)} kWh</strong></span>
              <span>Solar: <strong style={{ color: '#10b981' }}>{formatNumber(activeHourData.solar_used_kwh, lang)} kWh</strong></span>
              <span>BESS: <strong style={{ color: activeHourData.battery_action === 'charge' ? '#d97706' : activeHourData.battery_action === 'discharge' ? '#db2777' : 'var(--text-muted)' }}>
                {activeHourData.battery_action} ({formatNumber(activeHourData.battery_kwh, lang)} kWh)
              </strong></span>
              <span>SOC: <strong style={{ color: '#0284c7' }}>{formatNumber(activeHourData.battery_energy_after_kwh, lang)} kWh</strong></span>
            </div>
          </div>

          {/* Decision Intelligence Reason */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.65rem',
            background: 'var(--bg-surface)',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-glass)',
            fontSize: '0.875rem'
          }}>
            <Lightbulb size={20} color="var(--accent-amber)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ color: 'var(--text-main)', marginRight: '0.4rem' }}>
                {lang === 'bn' ? 'অপ্টিমাইজার যুক্তি:' : 'Optimizer Decision Intelligence:'}
              </strong>
              <span style={{ color: 'var(--primary-800)', fontWeight: 600 }}>
                {lang === 'bn' 
                  ? (activeHourData.decision_rationale_bn || scheduleData._ui_metadata?.[activeHourData.hour]?.rationale_bn || 'স্বাভাবিক বিদ্যুৎ বণ্টন')
                  : (activeHourData.decision_rationale_en || scheduleData._ui_metadata?.[activeHourData.hour]?.rationale_en || 'Balanced energy dispatch')}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Battery SOC Progression Line */}
      <div style={{ marginTop: '2.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Battery size={18} color="#0284c7" />
            {t.batterySocTitle}
          </span>
          <span style={{ fontSize: '0.825rem', color: 'var(--primary-700)', fontFamily: 'var(--font-mono)', fontWeight: 800 }}>
            Start: {formatNumber(battery.initial_energy_kwh, lang)} kWh ➔ End: {formatNumber(hours[23].battery_energy_after_kwh, lang)} kWh (100% Balanced Neutrality)
          </span>
        </div>

        <div className="soc-timeline-wrap">
          {hours.map((entry, idx) => {
            const pct = Math.round((entry.battery_energy_after_kwh / battery.capacity_kwh) * 100);
            return (
              <div 
                key={idx}
                className="soc-chip"
                onClick={() => setHoveredHour(idx)}
                style={{
                  cursor: 'pointer',
                  background: entry.battery_action === 'charge' ? 'rgba(245, 158, 11, 0.15)' : entry.battery_action === 'discharge' ? 'rgba(236, 72, 153, 0.15)' : 'var(--bg-surface)',
                  borderColor: hoveredHour === idx ? 'var(--primary-600)' : entry.battery_action === 'charge' ? 'rgba(245, 158, 11, 0.4)' : entry.battery_action === 'discharge' ? 'rgba(236, 72, 153, 0.4)' : 'var(--border-glass)',
                  transform: hoveredHour === idx ? 'translateY(-3px)' : 'none'
                }}
                title={`Hour ${idx}: ${entry.battery_energy_after_kwh} kWh (${pct}%) - Click to inspect`}
              >
                <div>{formatNumber(Math.round(entry.battery_energy_after_kwh), lang)}</div>
                <div style={{ fontSize: '0.65rem', opacity: 0.75 }}>{formatNumber(idx, lang)}h</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
