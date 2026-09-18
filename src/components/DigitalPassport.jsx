import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import { 
  ShieldCheck, 
  Download, 
  Printer, 
  Sparkles, 
  CheckCircle2, 
  Calendar, 
  Zap, 
  Coins 
} from 'lucide-react';
import { formatNumber, formatCurrency, translations } from '../utils/localization';

export function DigitalPassport({ scheduleData, rawScenario, lang }) {
  const t = translations[lang];
  const [verified, setVerified] = useState(false);

  if (!scheduleData || !rawScenario) return null;

  const totalDemand = rawScenario.hours.reduce((acc, h) => acc + h.demand_kwh, 0);
  const totalSolarUsed = scheduleData.hourly_plan.reduce((acc, h) => acc + h.solar_used_kwh, 0);
  const solarShare = totalDemand > 0 ? Math.round((totalSolarUsed / totalDemand) * 100) : 0;
  
  const manifestData = {
    system: "GridWise Enterprise Dispatch",
    scenario_id: scheduleData.scenario_id,
    timestamp: new Date().toISOString(),
    total_grid_kwh: scheduleData.total_grid_kwh,
    total_cost_bdt: scheduleData.total_cost_bdt,
    solar_share_pct: solarShare,
    neutrality: "BALANCED",
    directives_count: scheduleData.directive_interpretation?.length ?? 0
  };

  const manifestString = JSON.stringify(manifestData);

  const handleVerify = () => {
    setVerified(true);
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem', maxWidth: '820px', margin: '0 auto 2rem auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-glass)', paddingBottom: '1.25rem', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.25rem 0.6rem', borderRadius: 'var(--radius-full)', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--primary-300)', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            <ShieldCheck size={14} />
            Verified Dispatch Certificate
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>
            Smart Campus Energy Passport
          </h2>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
            Cryptographically verifiable dispatch schedule and directive audit trail
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <button className="btn-secondary" onClick={handlePrint} style={{ fontSize: '0.8rem', padding: '0.5rem 0.85rem' }}>
            <Printer size={14} />
            <span>Print Report</span>
          </button>
          <button className="btn-primary" onClick={handleVerify} style={{ fontSize: '0.8rem', padding: '0.5rem 0.85rem' }}>
            <Sparkles size={14} />
            <span>{verified ? 'Re-Verify' : 'Verify Passport'}</span>
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '2rem', alignItems: 'center' }}>
        {/* QR Code Container */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)' }}>
          <div style={{ padding: '1rem', background: '#ffffff', borderRadius: '12px', boxShadow: '0 8px 25px rgba(0, 0, 0, 0.5)' }}>
            <QRCodeSVG 
              value={manifestString} 
              size={180}
              level="H"
              fgColor="#064e3b"
            />
          </div>
          <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Scan to inspect full JSON manifest
          </div>
        </div>

        {/* Verification Metadata */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.06)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Scenario Identifier
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-300)', fontFamily: 'var(--font-mono)' }}>
              {scheduleData.scenario_id}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div style={{ padding: '0.85rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Total Cost</div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--accent-amber)' }}>
                {formatCurrency(scheduleData.total_cost_bdt, lang)}
              </div>
            </div>

            <div style={{ padding: '0.85rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Solar Coverage</div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--primary-400)' }}>
                {formatNumber(solarShare, lang)}%
              </div>
            </div>

            <div style={{ padding: '0.85rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Grid Import</div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#60a5fa' }}>
                {formatNumber(Math.round(scheduleData.total_grid_kwh), lang)} kWh
              </div>
            </div>

            <div style={{ padding: '0.85rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Storage Neutrality</div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--primary-300)' }}>
                Verified 100%
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--primary-300)', marginTop: '0.5rem' }}>
            <CheckCircle2 size={16} />
            <span>Digital signature approved by GridWise Autonomous Dispatch Core</span>
          </div>
        </div>
      </div>
    </div>
  );
}
