import React from 'react';
import { PhoneCall, Shield, Radio, Activity } from 'lucide-react';
import { translations } from '../utils/localization';

export function Footer({ activeTab, lang }) {
  const t = translations[lang];

  return (
    <footer style={{ width: '100%', maxWidth: '100%', padding: '0 2rem 3rem 2rem' }}>
      {/* Emergency Strip (Exclusively on Overview tab) */}
      {activeTab === 'overview' && (
        <div className="emergency-strip">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary-600)'
            }}>
              <Radio size={26} className="pulse-dot" style={{ width: 26, height: 26, borderRadius: '50%', background: 'transparent', boxShadow: 'none' }} />
            </div>
            <div>
              <div style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--text-main)' }}>
                {t.emergencyTitle}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--primary-700)', fontWeight: 600 }}>
                {t.emergencySubtitle}
              </div>
            </div>
          </div>

          <a href="tel:+8801700000000" className="call-operator-btn">
            <PhoneCall size={20} strokeWidth={2.6} />
            <span>{t.callOperator} (+880 1700-000000)</span>
          </a>
        </div>
      )}

      {/* Clean Minimal Copyright Strip */}
      <div className="footer-section">
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', width: '100%' }}>
          <div>
            &copy; {new Date().getFullYear()} {t.allRightsReserved}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--primary-700)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
            <Activity size={16} />
            <span>{t.versionInfo}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
