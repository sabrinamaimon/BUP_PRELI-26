import React, { useState, useEffect } from 'react';
import { 
  Sun, 
  Zap, 
  Battery, 
  Building2, 
  Play, 
  Pause, 
  RotateCcw, 
  Clock, 
  TrendingDown,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { formatNumber, formatCurrency, translations } from '../utils/localization';

export function PowerFlowVisualizer({ scheduleData, rawScenario, lang }) {
  const t = translations[lang];
  const [currentHour, setCurrentHour] = useState(13); // Default to midday hour 13:00
  const [isPlaying, setIsPlaying] = useState(false);

  // Auto-play simulation loop
  useEffect(() => {
    let interval = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentHour(prev => (prev >= 23 ? 0 : prev + 1));
      }, 1200);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  if (!scheduleData || !rawScenario) return null;

  const planEntry = scheduleData.hourly_plan[currentHour];
  const rawEntry = rawScenario.hours[currentHour];
  const battery = rawScenario.battery;

  const demand = rawEntry.demand_kwh;
  const solarUsed = planEntry.solar_used_kwh;
  const grid = planEntry.grid_kwh;
  const batteryAction = planEntry.battery_action;
  const batteryKwh = planEntry.battery_kwh;
  const batterySoc = planEntry.battery_energy_after_kwh;
  const socPct = Math.round((batterySoc / battery.capacity_kwh) * 100);

  // Calculate unoptimized baseline (demand * tariff with zero solar/storage optimization)
  const baselineCost = rawScenario.hours.reduce((acc, h) => acc + h.demand_kwh * h.tariff_bdt_per_kwh, 0);
  const optimizedCost = scheduleData.total_cost_bdt;
  const savedCost = Math.max(0, baselineCost - optimizedCost);
  const savingsPct = baselineCost > 0 ? Math.round((savedCost / baselineCost) * 100) : 0;

  // Format 12-hour AM/PM label
  const hourAmPm = (h) => {
    if (h === 0) return '12:00 AM';
    if (h < 12) return `${h}:00 AM`;
    if (h === 12) return '12:00 PM';
    return `${h - 12}:00 PM`;
  };

  return (
    <div className="glass-panel" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
      {/* Top Banner: Savings Highlight */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(6, 182, 212, 0.1))',
        border: '1.5px solid var(--border-glass-bright)',
        borderRadius: 'var(--radius-md)',
        padding: '1rem 1.5rem',
        marginBottom: '1.5rem',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            width: 42,
            height: 42,
            borderRadius: '50%',
            background: 'var(--primary-600)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)'
          }}>
            <TrendingDown size={22} strokeWidth={2.6} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--primary-700)', letterSpacing: '0.05em' }}>
              {lang === 'bn' ? 'স্মার্ট এনার্জি সাশ্রয় বিশ্লেষণ' : 'Autonomous Optimization Savings'}
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
              {formatCurrency(savedCost, lang)} {lang === 'bn' ? 'সাশ্রয় নিশ্চিত' : 'Cost Reduction'} ({formatNumber(savingsPct, lang)}% {lang === 'bn' ? 'সাশ্রয়ী' : 'Savings'})
            </div>
          </div>
        </div>

        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'right' }}>
          <div>{lang === 'bn' ? 'সাধারণ খরচ' : 'Unmanaged Baseline'}: {formatCurrency(baselineCost, lang)}</div>
          <div style={{ color: 'var(--primary-700)', fontWeight: 700 }}>
            {lang === 'bn' ? 'অপ্টিমাইজড খরচ' : 'Optimized Cost'}: {formatCurrency(optimizedCost, lang)}
          </div>
        </div>
      </div>

      {/* Header & Scrubber Controls */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Sparkles size={20} color="var(--primary-600)" />
            {lang === 'bn' ? 'লাইভ এনার্জি ফ্লো ও ২৪-ঘণ্টা সিমুলেটর' : 'Live Campus Power Flow Simulator'}
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            {lang === 'bn' ? 'ঘণ্টা অনুযায়ী বিদ্যুৎ প্রবাহের গতিশীল রূপরেখা' : 'Real-time node-to-node power dispatch and BESS cycling simulation'}
          </p>
        </div>

        {/* Play/Pause & Scrubber controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <button 
            className="btn-primary" 
            onClick={() => setIsPlaying(!isPlaying)}
            style={{ padding: '0.55rem 1rem', fontSize: '0.8rem' }}
          >
            {isPlaying ? <Pause size={15} /> : <Play size={15} />}
            <span>{isPlaying ? (lang === 'bn' ? 'পজ' : 'Pause') : (lang === 'bn' ? 'চালান' : 'Play 24h')}</span>
          </button>

          <button 
            className="btn-secondary" 
            onClick={() => { setIsPlaying(false); setCurrentHour(0); }}
            style={{ padding: '0.55rem', borderRadius: 'var(--radius-sm)' }}
            title="Reset to 0:00"
          >
            <RotateCcw size={15} />
          </button>

          <div style={{
            padding: '0.45rem 0.85rem',
            borderRadius: 'var(--radius-full)',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-glass)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.85rem',
            fontWeight: 800,
            color: 'var(--primary-700)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}>
            <Clock size={15} />
            <span>{hourAmPm(currentHour)}</span>
          </div>
        </div>
      </div>

      {/* Hour Scrubber Slider */}
      <div style={{ marginBottom: '2rem' }}>
        <input 
          type="range"
          min="0"
          max="23"
          value={currentHour}
          onChange={(e) => setCurrentHour(parseInt(e.target.value, 10))}
          style={{
            width: '100%',
            accentColor: 'var(--primary-600)',
            cursor: 'pointer',
            height: '6px'
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '0.35rem' }}>
          <span>00:00 (12 AM)</span>
          <span>06:00 (6 AM)</span>
          <span>12:00 (12 PM)</span>
          <span>18:00 (6 PM)</span>
          <span>23:00 (11 PM)</span>
        </div>
      </div>

      {/* Interactive Power Flow Grid Nodes */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1.25rem',
        position: 'relative'
      }}>
        {/* Node 1: Rooftop Solar PV */}
        <div className="glass-panel" style={{
          padding: '1.25rem',
          textAlign: 'center',
          background: solarUsed > 0 ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-surface)',
          borderColor: solarUsed > 0 ? 'var(--primary-500)' : 'var(--border-glass)'
        }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: 'rgba(16, 185, 129, 0.15)',
            color: 'var(--primary-600)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 0.75rem auto'
          }}>
            <Sun size={24} className={solarUsed > 0 ? 'pulse-dot' : ''} style={{ background: 'transparent', boxShadow: 'none' }} />
          </div>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            {lang === 'bn' ? 'সোলার পিভি' : 'Rooftop Solar'}
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary-600)', fontFamily: 'var(--font-mono)' }}>
            {formatNumber(solarUsed, lang)} <span style={{ fontSize: '0.85rem' }}>kWh</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            {lang === 'bn' ? 'উৎপাদন' : 'Available'}: {formatNumber(rawEntry.solar_kwh, lang)} kWh
          </div>
        </div>

        {/* Node 2: National Grid Import */}
        <div className="glass-panel" style={{
          padding: '1.25rem',
          textAlign: 'center',
          background: grid > 0 ? 'rgba(37, 99, 235, 0.08)' : 'var(--bg-surface)',
          borderColor: grid > 0 ? 'var(--accent-blue)' : 'var(--border-glass)'
        }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: 'rgba(37, 99, 235, 0.15)',
            color: 'var(--accent-blue)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 0.75rem auto'
          }}>
            <Zap size={24} />
          </div>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            {lang === 'bn' ? 'গ্রিড বিদ্যুৎ' : 'National Grid'}
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-blue)', fontFamily: 'var(--font-mono)' }}>
            {formatNumber(grid, lang)} <span style={{ fontSize: '0.85rem' }}>kWh</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--accent-amber)', fontWeight: 700, marginTop: '0.2rem' }}>
            {formatCurrency(rawEntry.tariff_bdt_per_kwh, lang)} / kWh
          </div>
        </div>

        {/* Node 3: Battery Energy Storage (BESS) with Gauge */}
        <div className="glass-panel" style={{
          padding: '1.25rem',
          textAlign: 'center',
          background: batteryAction !== 'idle' ? 'rgba(217, 119, 6, 0.08)' : 'var(--bg-surface)',
          borderColor: batteryAction === 'charge' ? 'var(--accent-amber)' : batteryAction === 'discharge' ? 'var(--accent-rose)' : 'var(--border-glass)'
        }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: batteryAction === 'charge' ? 'rgba(217, 119, 6, 0.15)' : batteryAction === 'discharge' ? 'rgba(225, 29, 72, 0.15)' : 'rgba(100, 116, 139, 0.15)',
            color: batteryAction === 'charge' ? 'var(--accent-amber)' : batteryAction === 'discharge' ? 'var(--accent-rose)' : 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 0.75rem auto'
          }}>
            <Battery size={24} />
          </div>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            {lang === 'bn' ? 'ব্যাটারি স্টোরেজ' : 'Battery (BESS)'}
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
            {formatNumber(batterySoc, lang)} <span style={{ fontSize: '0.85rem' }}>kWh ({formatNumber(socPct, lang)}%)</span>
          </div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginTop: '0.2rem', color: batteryAction === 'charge' ? 'var(--accent-amber)' : batteryAction === 'discharge' ? 'var(--accent-rose)' : 'var(--text-muted)' }}>
            {batteryAction === 'charge' ? `▲ Charging +${formatNumber(batteryKwh, lang)}` : batteryAction === 'discharge' ? `▼ Discharging -${formatNumber(batteryKwh, lang)}` : '• Battery Idle'}
          </div>
        </div>

        {/* Node 4: Smart Campus Load */}
        <div className="glass-panel" style={{
          padding: '1.25rem',
          textAlign: 'center',
          background: 'rgba(6, 182, 212, 0.08)',
          borderColor: 'var(--accent-cyan)'
        }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: 'rgba(6, 182, 212, 0.15)',
            color: 'var(--accent-cyan)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 0.75rem auto'
          }}>
            <Building2 size={24} />
          </div>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            {lang === 'bn' ? 'ক্যাম্পাস চাহিদা' : 'Campus Demand'}
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
            {formatNumber(demand, lang)} <span style={{ fontSize: '0.85rem' }}>kWh</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--primary-700)', fontWeight: 700, marginTop: '0.2rem' }}>
            {lang === 'bn' ? '১০০% নিশ্চিত সরবরাহ' : '100% Demand Supplied'}
          </div>
        </div>
      </div>
    </div>
  );
}
