import React from 'react';
import { 
  Zap, 
  Sun, 
  BatteryCharging, 
  Coins, 
  TrendingUp, 
  CheckCircle2 
} from 'lucide-react';
import { formatNumber, formatCurrency, translations } from '../utils/localization';

export function MetricCards({ scheduleData, rawScenario, lang }) {
  const t = translations[lang];

  if (!scheduleData || !rawScenario) return null;

  const totalDemand = rawScenario.hours.reduce((acc, h) => acc + h.demand_kwh, 0);
  const totalSolarUsed = scheduleData.hourly_plan.reduce((acc, h) => acc + h.solar_used_kwh, 0);
  const solarShare = totalDemand > 0 ? Math.round((totalSolarUsed / totalDemand) * 100) : 0;
  
  const initialBat = rawScenario.battery.initial_energy_kwh;
  const finalBat = scheduleData.hourly_plan[23]?.battery_energy_after_kwh ?? initialBat;
  const isNeutral = Math.abs(finalBat - initialBat) < 0.1;

  const cards = [
    {
      label: t.metricTotalDemand,
      value: `${formatNumber(Math.round(totalDemand), lang)} kWh`,
      subtext: `${formatNumber(24, lang)} ${lang === 'bn' ? 'ঘণ্টা পরিকল্পনা' : 'Hours Planning Horizon'}`,
      icon: Zap,
      color: 'var(--accent-cyan)'
    },
    {
      label: t.metricTotalGrid,
      value: `${formatNumber(Math.round(scheduleData.total_grid_kwh), lang)} kWh`,
      subtext: `${lang === 'bn' ? 'গ্রিড আমদানি অংশ' : 'Grid Supply Ratio'}: ${formatNumber(100 - solarShare, lang)}%`,
      icon: TrendingUp,
      color: '#3b82f6'
    },
    {
      label: t.metricSolarUsed,
      value: `${formatNumber(Math.round(totalSolarUsed), lang)} kWh`,
      subtext: `${lang === 'bn' ? 'সৌরশক্তির অবদান' : 'Solar Coverage'}: ${formatNumber(solarShare, lang)}%`,
      icon: Sun,
      color: 'var(--primary-400)'
    },
    {
      label: t.metricTotalCost,
      value: formatCurrency(scheduleData.total_cost_bdt, lang),
      subtext: `${lang === 'bn' ? 'সর্বনিম্ন খরচ নিশ্চিত' : 'Optimized Procurement'}`,
      icon: Coins,
      color: 'var(--accent-amber)'
    },
    {
      label: t.metricPeakLoad,
      value: `${formatNumber(Math.round(scheduleData.peak_grid_kwh), lang)} kW`,
      subtext: `${lang === 'bn' ? 'পিক লোড শেভিং সম্পন্ন' : 'Peak Shaved via BESS'}`,
      icon: BatteryCharging,
      color: '#ec4899'
    },
    {
      label: t.metricBatteryNeutrality,
      value: isNeutral ? (lang === 'bn' ? '১০০% নিরপেক্ষ' : '100% Balanced') : (lang === 'bn' ? 'অসামঞ্জস্য' : 'Imbalanced'),
      subtext: `${formatNumber(initialBat, lang)} kWh → ${formatNumber(finalBat, lang)} kWh`,
      icon: CheckCircle2,
      color: isNeutral ? 'var(--primary-400)' : 'var(--accent-rose)'
    }
  ];

  return (
    <div className="metrics-grid">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div key={idx} className="glass-panel metric-card">
            <div className="metric-header">
              <span className="metric-label">{card.label}</span>
              <div className="metric-icon-wrap" style={{ color: card.color }}>
                <Icon size={18} strokeWidth={2.4} />
              </div>
            </div>
            <div className="metric-value">{card.value}</div>
            <div className="metric-subtext">
              <span>{card.subtext}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
