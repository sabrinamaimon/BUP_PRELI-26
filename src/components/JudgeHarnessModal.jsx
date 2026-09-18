import React, { useState } from 'react';
import { 
  Terminal, 
  Play, 
  CheckCircle2, 
  XCircle, 
  Copy, 
  Check, 
  Server, 
  ShieldAlert,
  Zap
} from 'lucide-react';
import { auditScheduleCorrectness } from '../utils/optimizer';
import { translations } from '../utils/localization';

export function JudgeHarnessModal({ 
  rawScenario, 
  currentSchedule, 
  backendUrl, 
  setBackendUrl,
  lang 
}) {
  const t = translations[lang];
  const [healthStatus, setHealthStatus] = useState(null);
  const [testingHealth, setTestingHealth] = useState(false);
  const [testingOptimize, setTestingOptimize] = useState(false);
  const [apiResponse, setApiResponse] = useState(null);
  const [copied, setCopied] = useState(false);
  const [auditReport, setAuditReport] = useState(() => 
    auditScheduleCorrectness(rawScenario, currentSchedule)
  );

  // Test GET /health
  const testHealthEndpoint = async () => {
    setTestingHealth(true);
    setHealthStatus(null);
    try {
      const res = await fetch(`${backendUrl}/health`, { method: 'GET' });
      const data = await res.json();
      if (res.ok && data.status === 'ok') {
        setHealthStatus({ success: true, message: 'GET /health responded 200 OK {"status": "ok"}' });
      } else {
        setHealthStatus({ success: false, message: `Status ${res.status}: ${JSON.stringify(data)}` });
      }
    } catch (err) {
      setHealthStatus({ success: false, message: `Connection failed: ${err.message}. Ensure backend is running.` });
    } finally {
      setTestingHealth(false);
    }
  };

  // Test POST /optimize-energy with current scenario
  const testOptimizeEndpoint = async () => {
    setTestingOptimize(true);
    setApiResponse(null);
    try {
      const res = await fetch(`${backendUrl}/optimize-energy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rawScenario)
      });
      const data = await res.json();
      setApiResponse(data);
      if (res.ok) {
        const audit = auditScheduleCorrectness(rawScenario, data);
        setAuditReport(audit);
      }
    } catch (err) {
      setApiResponse({ error: err.message, note: "Could not reach endpoint. Falling back to local audit." });
      const audit = auditScheduleCorrectness(rawScenario, currentSchedule);
      setAuditReport(audit);
    } finally {
      setTestingOptimize(false);
    }
  };

  const copyJson = (data) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass-panel" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
      <div style={{ borderBottom: '1px solid var(--border-glass)', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Terminal size={22} color="var(--primary-400)" />
          {t.tabHarness} — Official Evaluation & Rubric Compliance Harness
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
          Verify endpoint contracts, health readiness, and mathematical constraints against the 7-category evaluation rubric.
        </p>
      </div>

      {/* Backend URL & Test Actions */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div style={{ flex: 1, minWidth: '280px', display: 'flex', alignItems: 'center', background: 'rgba(255, 255, 255, 0.05)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)', padding: '0.35rem 0.75rem' }}>
          <Server size={16} color="var(--primary-300)" style={{ marginRight: '0.5rem' }} />
          <input
            type="text"
            value={backendUrl}
            onChange={(e) => setBackendUrl(e.target.value)}
            placeholder="http://localhost:8000"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#fff',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.85rem',
              width: '100%',
              outline: 'none'
            }}
          />
        </div>

        <button 
          className="btn-secondary" 
          onClick={testHealthEndpoint}
          disabled={testingHealth}
        >
          <Play size={14} />
          <span>{testingHealth ? 'Testing /health...' : 'Test GET /health'}</span>
        </button>

        <button 
          className="btn-primary" 
          onClick={testOptimizeEndpoint}
          disabled={testingOptimize}
        >
          <Zap size={14} />
          <span>{testingOptimize ? 'Optimizing...' : 'Test POST /optimize-energy'}</span>
        </button>
      </div>

      {/* Health status banner */}
      {healthStatus && (
        <div style={{
          padding: '0.85rem 1.25rem',
          borderRadius: 'var(--radius-sm)',
          marginBottom: '1.5rem',
          background: healthStatus.success ? 'rgba(16, 185, 129, 0.12)' : 'rgba(244, 63, 94, 0.12)',
          border: `1px solid ${healthStatus.success ? 'rgba(16, 185, 129, 0.4)' : 'rgba(244, 63, 94, 0.4)'}`,
          color: healthStatus.success ? 'var(--primary-300)' : '#fb7185',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          fontSize: '0.85rem'
        }}>
          {healthStatus.success ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
          <span>{healthStatus.message}</span>
        </div>
      )}

      {/* 7-Point Compliance Checklist */}
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-main)' }}>
            Mathematical Audit & Constraint Verification ({auditReport.checks.filter(c => c.passed).length}/{auditReport.checks.length})
          </span>
          <span style={{
            fontWeight: 800,
            fontSize: '0.85rem',
            padding: '0.2rem 0.75rem',
            borderRadius: 'var(--radius-full)',
            background: auditReport.passed ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.2)',
            color: auditReport.passed ? 'var(--primary-300)' : 'var(--accent-rose)',
            border: `1px solid ${auditReport.passed ? 'rgba(16, 185, 129, 0.4)' : 'rgba(244, 63, 94, 0.4)'}`
          }}>
            Score: {auditReport.score}/100
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {auditReport.checks.map((c, idx) => (
            <div 
              key={idx}
              style={{
                padding: '0.85rem 1rem',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-glass)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem'
              }}
            >
              {c.passed ? (
                <CheckCircle2 size={18} color="var(--primary-400)" style={{ marginTop: '2px', flexShrink: 0 }} />
              ) : (
                <XCircle size={18} color="var(--accent-rose)" style={{ marginTop: '2px', flexShrink: 0 }} />
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: c.passed ? 'var(--text-main)' : 'var(--accent-rose)' }}>
                  {c.name}
                </div>
                <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                  {c.details}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* JSON Inspector */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>
            Active Optimization Response JSON ({rawScenario.scenario_id})
          </span>
          <button 
            className="btn-secondary" 
            onClick={() => copyJson(apiResponse || currentSchedule)}
            style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
          >
            {copied ? <Check size={14} color="var(--primary-400)" /> : <Copy size={14} />}
            <span>{copied ? 'Copied!' : 'Copy JSON'}</span>
          </button>
        </div>

        <pre style={{
          maxHeight: '260px',
          overflowY: 'auto',
          background: 'rgba(0, 0, 0, 0.6)',
          borderRadius: 'var(--radius-sm)',
          padding: '1rem',
          fontSize: '0.75rem',
          fontFamily: 'var(--font-mono)',
          color: 'var(--primary-200)',
          border: '1px solid var(--border-glass)'
        }}>
          {JSON.stringify(apiResponse || currentSchedule, null, 2)}
        </pre>
      </div>
    </div>
  );
}
