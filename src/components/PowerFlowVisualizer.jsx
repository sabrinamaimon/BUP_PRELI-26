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
  ArrowRight,
  ShieldCheck,
  Activity
} from 'lucide-react';
import { formatNumber, formatCurrency, translations } from '../utils/localization';

export function PowerFlowVisualizer({ scheduleData, rawScenario, lang }) {
  const t = translations[lang];
  const [currentHour, setCurrentHour] = useState(13); // Midday 13:00
  const [isPlaying, setIsPlaying] = useState(false);

  // Auto-play simulation loop
  useEffect(() => {
    let interval = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentHour(prev => (prev >= 23 ? 0 : prev + 1));
      }, 1000);
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

  // Calculate unoptimized baseline
  const baselineCost = rawScenario.hours.reduce((acc, h) => acc + h.demand_kwh * h.tariff_bdt_per_kwh, 0);
  const optimizedCost = scheduleData.total_cost_bdt;
  const savedCost = Math.max(0, baselineCost - optimizedCost);
  const savingsPct = baselineCost > 0 ? Math.round((savedCost / baselineCost) * 100) : 0;

  const hourAmPm = (h) => {
    if (h === 0) return '12:00 AM (Midnight)';
    if (h < 12) return `${h}:00 AM`;
    if (h === 12) return '12:00 PM (Noon)';
    return `${h - 12}:00 PM`;
  };

  // Circular gauge calculations
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (socPct / 100) * circumference;

  return (
    <div className="glass-panel power-flow-container" style={{ marginBottom: '2.5rem', width: '100%' }}>
      {/* Top Banner: Lucrative Cost Savings & Efficiency */}
      <div className="savings-banner" style={{
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(6, 182, 212, 0.15))',
        border: '2px solid var(--border-glass-bright)',
        borderRadius: 'var(--radius-md)',
        marginBottom: '2rem',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 8px 30px rgba(16, 185, 129, 0.15)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--primary-500), var(--primary-700))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 0 25px rgba(16, 185, 129, 0.6)'
          }}>
            <TrendingDown size={28} strokeWidth={2.6} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--primary-700)', letterSpacing: '0.08em' }}>
              {lang === 'bn' ? 'স্মার্ট এনার্জি সাশ্রয় বিশ্লেষণ' : 'Autonomous Optimization Efficiency Gain'}
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
              {formatCurrency(savedCost, lang)} {lang === 'bn' ? 'সাশ্রয় নিশ্চিত' : 'Net Cost Savings'} 
              <span style={{ fontSize: '1.1rem', color: 'var(--primary-600)', marginLeft: '0.75rem', fontWeight: 800 }}>
                ({formatNumber(savingsPct, lang)}% {lang === 'bn' ? 'সাশ্রয়ী' : 'Reduction'})
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '2rem', textAlign: 'right' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
              {lang === 'bn' ? 'সাধারণ গ্রিড বিল' : 'Unmanaged Baseline'}
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-muted)', textDecoration: 'line-through' }}>
              {formatCurrency(baselineCost, lang)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--primary-700)', fontWeight: 800, textTransform: 'uppercase' }}>
              {lang === 'bn' ? 'অপ্টিমাইজড বিদ্যুৎ বিল' : 'Optimized Dispatch'}
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--primary-600)', fontFamily: 'var(--font-mono)' }}>
              {formatCurrency(optimizedCost, lang)}
            </div>
          </div>
        </div>
      </div>

      {/* Header & Scrubber Controls */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem', marginBottom: '1.75rem' }}>
        <div>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Sparkles size={24} color="var(--primary-500)" />
            {lang === 'bn' ? 'লাইভ এনার্জি ফ্লো ও ২৪-ঘণ্টা সিমুলেটর' : 'Real-Time Campus Power Flow & Dispatch Simulator'}
          </h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
            {lang === 'bn' ? 'সৌরশক্তি, জাতীয় গ্রিড ও ব্যাটারির মধ্যে বিদ্যুৎ প্রবাহের লাইভ রূপরেখা' : 'Dynamic multi-node power equilibrium with live telemetry and energy state transitions'}
          </p>
        </div>

        {/* Play/Pause & Scrubber controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <button 
            className="btn-primary" 
            onClick={() => setIsPlaying(!isPlaying)}
            style={{ padding: '0.65rem 1.35rem', fontSize: '0.9rem' }}
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            <span>{isPlaying ? (lang === 'bn' ? 'পজ' : 'Pause') : (lang === 'bn' ? 'চালান (Play 24h)' : 'Play 24h')}</span>
          </button>

          <button 
            className="btn-secondary" 
            onClick={() => { setIsPlaying(false); setCurrentHour(0); }}
            style={{ padding: '0.65rem', borderRadius: 'var(--radius-sm)' }}
            title="Reset to 00:00"
          >
            <RotateCcw size={18} />
          </button>

          <div style={{
            padding: '0.55rem 1.25rem',
            borderRadius: 'var(--radius-full)',
            background: 'var(--bg-surface)',
            border: '1.5px solid var(--border-glass-bright)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.95rem',
            fontWeight: 800,
            color: 'var(--primary-700)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.04)'
          }}>
            <Clock size={18} />
            <span>{hourAmPm(currentHour)}</span>
          </div>
        </div>
      </div>

      {/* Hour Scrubber Slider with Glowing Track */}
      <div style={{ marginBottom: '2.5rem' }}>
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
            height: '8px'
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '0.5rem', fontWeight: 700 }}>
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
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1.5rem',
        position: 'relative',
        width: '100%'
      }}>
        {/* Node 1: Rooftop Solar PV */}
        <div className={`glass-panel ${solarUsed > 0 ? 'power-node-active' : ''}`} style={{
          padding: '1.75rem',
          textAlign: 'center',
          background: solarUsed > 0 ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-surface)',
          borderColor: solarUsed > 0 ? 'var(--primary-500)' : 'var(--border-glass)'
        }}>
          <div style={{
            width: 58,
            height: 58,
            borderRadius: '50%',
            background: 'rgba(16, 185, 129, 0.18)',
            color: 'var(--primary-600)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem auto',
            boxShadow: solarUsed > 0 ? '0 0 25px rgba(16, 185, 129, 0.5)' : 'none'
          }}>
            <Sun size={30} className={solarUsed > 0 ? 'pulse-dot' : ''} style={{ background: 'transparent', boxShadow: 'none' }} />
          </div>
          <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {lang === 'bn' ? 'সোলার পিভি উৎপাদন' : 'Rooftop Solar PV'}
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 900, color: 'var(--primary-600)', fontFamily: 'var(--font-mono)', margin: '0.4rem 0' }}>
            {formatNumber(solarUsed, lang)} <span style={{ fontSize: '1rem' }}>kWh</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            {lang === 'bn' ? 'মোট সূর্যালোক' : 'Max Available'}: {formatNumber(rawEntry.solar_kwh, lang)} kWh
          </div>
          {solarUsed > 0 && (
            <div style={{ marginTop: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: 'var(--primary-700)', fontWeight: 800, background: 'rgba(16, 185, 129, 0.2)', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)' }}>
              <span>⚡ Supplying Free Solar</span>
            </div>
          )}
        </div>

        {/* Node 2: National Grid Import */}
        <div className={`glass-panel ${grid > 0 ? 'power-node-active' : ''}`} style={{
          padding: '1.75rem',
          textAlign: 'center',
          background: grid > 0 ? 'rgba(37, 99, 235, 0.1)' : 'var(--bg-surface)',
          borderColor: grid > 0 ? 'var(--accent-blue)' : 'var(--border-glass)'
        }}>
          <div style={{
            width: 58,
            height: 58,
            borderRadius: '50%',
            background: 'rgba(37, 99, 235, 0.18)',
            color: 'var(--accent-blue)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem auto',
            boxShadow: grid > 0 ? '0 0 25px rgba(37, 99, 235, 0.4)' : 'none'
          }}>
            <Zap size={30} />
          </div>
          <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {lang === 'bn' ? 'গ্রিড বিদ্যুৎ আমদানি' : 'National Grid'}
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 900, color: 'var(--accent-blue)', fontFamily: 'var(--font-mono)', margin: '0.4rem 0' }}>
            {formatNumber(grid, lang)} <span style={{ fontSize: '1rem' }}>kWh</span>
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--accent-amber)', fontWeight: 800 }}>
            {formatCurrency(rawEntry.tariff_bdt_per_kwh, lang)} / kWh
          </div>
          {grid === 0 && (
            <div style={{ marginTop: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: 'var(--primary-600)', fontWeight: 800, background: 'rgba(16, 185, 129, 0.15)', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)' }}>
              <span>✓ 100% Grid Free Hour</span>
            </div>
          )}
        </div>

        {/* Node 3: Battery Energy Storage (BESS) with Circular Ring Gauge */}
        <div className={`glass-panel ${batteryAction !== 'idle' ? 'power-node-active' : ''}`} style={{
          padding: '1.75rem',
          textAlign: 'center',
          background: batteryAction !== 'idle' ? 'rgba(217, 119, 6, 0.1)' : 'var(--bg-surface)',
          borderColor: batteryAction === 'charge' ? 'var(--accent-amber)' : batteryAction === 'discharge' ? 'var(--accent-rose)' : 'var(--border-glass)'
        }}>
          {/* Circular SOC Ring Gauge */}
          <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto 0.75rem auto' }}>
            <svg width="80" height="80" style={{ transform: 'rotate(-90deg)' }}>
              <circle
                cx="40"
                cy="40"
                r={radius}
                fill="transparent"
                stroke="var(--border-glass)"
                strokeWidth="6"
              />
              <circle
                cx="40"
                cy="40"
                r={radius}
                fill="transparent"
                stroke={batteryAction === 'charge' ? 'var(--accent-amber)' : batteryAction === 'discharge' ? 'var(--accent-rose)' : 'var(--primary-500)'}
                strokeWidth="6"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.5s ease' }}
              />
            </svg>
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-mono)',
              fontWeight: 900,
              fontSize: '0.9rem',
              color: 'var(--text-main)'
            }}>
              {formatNumber(socPct, lang)}%
            </div>
          </div>

          <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {lang === 'bn' ? 'ব্যাটারি স্টোরেজ' : 'Battery (BESS)'}
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 900, color: 'var(--text-main)', fontFamily: 'var(--font-mono)', margin: '0.4rem 0' }}>
            {formatNumber(batterySoc, lang)} <span style={{ fontSize: '1rem' }}>kWh</span>
          </div>
          <div style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', color: batteryAction === 'charge' ? 'var(--accent-amber)' : batteryAction === 'discharge' ? 'var(--accent-rose)' : 'var(--text-muted)' }}>
            {batteryAction === 'charge' ? `▲ Charging +${formatNumber(batteryKwh, lang)} kWh` : batteryAction === 'discharge' ? `▼ Discharging -${formatNumber(batteryKwh, lang)} kWh` : '• Battery Idle'}
          </div>
        </div>

        {/* Node 4: Smart Campus Load */}
        <div className="glass-panel" style={{
          padding: '1.75rem',
          textAlign: 'center',
          background: 'rgba(6, 182, 212, 0.1)',
          borderColor: 'var(--accent-cyan)'
        }}>
          <div style={{
            width: 58,
            height: 58,
            borderRadius: '50%',
            background: 'rgba(6, 182, 212, 0.18)',
            color: 'var(--accent-cyan)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem auto',
            boxShadow: '0 0 25px rgba(6, 182, 212, 0.4)'
          }}>
            <Building2 size={30} />
          </div>
          <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {lang === 'bn' ? 'ক্যাম্পাস বিদ্যুৎ চাহিদা' : 'Smart Campus Load'}
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 900, color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)', margin: '0.4rem 0' }}>
            {formatNumber(demand, lang)} <span style={{ fontSize: '1rem' }}>kWh</span>
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--primary-700)', fontWeight: 800 }}>
            {lang === 'bn' ? '১০০% নিশ্চিত ভারসাম্য' : '100% Demand Supplied'}
          </div>
          <div style={{ marginTop: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: 'var(--primary-700)', fontWeight: 800, background: 'rgba(6, 182, 212, 0.2)', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)' }}>
            <Activity size={14} />
            <span>Grid + Solar + BESS = Load</span>
          </div>
        </div>
      </div>
    </div>
  );
}
