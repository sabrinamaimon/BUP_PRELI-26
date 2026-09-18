import React, { useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { 
  Sparkles, 
  RotateCw, 
  ChevronRight, 
  Activity, 
  Cpu, 
  Server 
} from 'lucide-react';
import { Navbar } from './components/Navbar';
import { MetricCards } from './components/MetricCards';
import { PowerFlowVisualizer } from './components/PowerFlowVisualizer';
import { OperatorStudio } from './components/OperatorStudio';
import { DispatchChart } from './components/DispatchChart';
import { ScheduleTable } from './components/ScheduleTable';
import { JudgeHarnessModal } from './components/JudgeHarnessModal';
import { DigitalPassport } from './components/DigitalPassport';
import { Footer } from './components/Footer';

import { sampleScenarios } from './data/sampleScenarios';
import { parseOperatorNote } from './utils/directiveParser';
import { optimizeEnergySchedule } from './utils/optimizer';
import { translations, formatNumber } from './utils/localization';

export default function App() {
  const [lang, setLang] = useState('en');
  const [theme, setTheme] = useState('light'); // Default to modern Light Theme
  const [activeTab, setActiveTab] = useState('overview');
  const [backendUrl, setBackendUrl] = useState('http://localhost:8000');
  const [backendConnected, setBackendConnected] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);

  // Active scenario state
  const [selectedScenarioIndex, setSelectedScenarioIndex] = useState(0);
  const activeScenario = sampleScenarios[selectedScenarioIndex];

  // Operator notes for current scenario
  const [operatorNotes, setOperatorNotes] = useState(activeScenario.operator_notes);

  // Whenever scenario changes, reset notes
  useEffect(() => {
    setOperatorNotes(activeScenario.operator_notes);
  }, [selectedScenarioIndex]);

  // Check backend health periodically or on mount
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch(`${backendUrl}/health`, { method: 'GET' });
        const data = await res.json();
        setBackendConnected(res.ok && data.status === 'ok');
      } catch (err) {
        setBackendConnected(false);
      }
    };
    checkHealth();
  }, [backendUrl]);

  // Handle Theme switching
  useEffect(() => {
    if (theme === 'dark') {
      document.body.classList.add('theme-dark');
    } else {
      document.body.classList.remove('theme-dark');
    }
  }, [theme]);

  // Toggle html body class for Bengali typography
  useEffect(() => {
    if (lang === 'bn') {
      document.body.classList.add('lang-bn');
    } else {
      document.body.classList.remove('lang-bn');
    }
  }, [lang]);

  // Interpret notes using canonical directive parser
  const parsedDirectives = useMemo(() => {
    return operatorNotes.map((note, idx) => parseOperatorNote(note, idx));
  }, [operatorNotes]);

  // Compute optimized 24-hour schedule
  const scheduleData = useMemo(() => {
    return optimizeEnergySchedule(activeScenario, parsedDirectives);
  }, [activeScenario, parsedDirectives]);

  const handleReoptimize = () => {
    setIsOptimizing(true);
    setTimeout(() => {
      setIsOptimizing(false);
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
      });
    }, 400);
  };

  const t = translations[lang];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navigation & Mobile 2-Row Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        lang={lang}
        setLang={setLang}
        theme={theme}
        setTheme={setTheme}
        backendConnected={backendConnected}
        scenarioId={activeScenario.scenario_id}
      />

      <main style={{ flex: 1, maxWidth: '1440px', margin: '0 auto', width: '100%', padding: '1.5rem 1.5rem 0 1.5rem' }}>
        {/* Scenario Selector & Quick Action Bar */}
        <div className="glass-panel scenario-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {t.scenarioLabel}:
            </span>
            <div className="scenario-pills-wrap">
              {sampleScenarios.map((sc, idx) => (
                <button
                  key={sc.id}
                  className={`scenario-pill ${selectedScenarioIndex === idx ? 'active' : ''}`}
                  onClick={() => setSelectedScenarioIndex(idx)}
                >
                  <span>{sc.id}</span>
                  <span style={{ opacity: 0.75, marginLeft: '0.35rem', fontSize: '0.75rem' }}>
                    ({formatNumber(sc.operator_notes.length, lang)} {lang === 'bn' ? 'নোট' : 'notes'})
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="scenario-actions">
            <button 
              className="btn-primary" 
              onClick={handleReoptimize}
              disabled={isOptimizing}
            >
              <RotateCw size={16} className={isOptimizing ? 'pulse-dot' : ''} />
              <span>{isOptimizing ? t.optimizing : t.runOptimization}</span>
            </button>
          </div>
        </div>

        {/* High-Impact Statistics Showcase Bar */}
        <MetricCards
          scheduleData={scheduleData}
          rawScenario={activeScenario}
          lang={lang}
        />

        {/* Tab View Routing */}
        {activeTab === 'overview' && (
          <>
            {/* Live 24-Hour Power Flow Simulator & Savings Header */}
            <PowerFlowVisualizer
              scheduleData={scheduleData}
              rawScenario={activeScenario}
              lang={lang}
            />

            {/* Visual 24-Hour Dispatch Chart & SOC Line */}
            <DispatchChart
              scheduleData={scheduleData}
              rawScenario={activeScenario}
              lang={lang}
            />

            {/* Operator Directives Studio Preview */}
            <OperatorStudio
              operatorNotes={operatorNotes}
              setOperatorNotes={setOperatorNotes}
              parsedDirectives={parsedDirectives}
              planSummary={scheduleData.plan_summary}
              lang={lang}
            />
          </>
        )}

        {activeTab === 'directives' && (
          <OperatorStudio
            operatorNotes={operatorNotes}
            setOperatorNotes={setOperatorNotes}
            parsedDirectives={parsedDirectives}
            planSummary={scheduleData.plan_summary}
            lang={lang}
          />
        )}

        {activeTab === 'schedule' && (
          <ScheduleTable
            scheduleData={scheduleData}
            rawScenario={activeScenario}
            lang={lang}
          />
        )}

        {activeTab === 'passport' && (
          <DigitalPassport
            scheduleData={scheduleData}
            rawScenario={activeScenario}
            lang={lang}
          />
        )}

        {activeTab === 'harness' && (
          <JudgeHarnessModal
            rawScenario={activeScenario}
            currentSchedule={scheduleData}
            backendUrl={backendUrl}
            setBackendUrl={setBackendUrl}
            lang={lang}
          />
        )}
      </main>

      {/* Footer & Emergency Control Strip */}
      <Footer activeTab={activeTab} lang={lang} />
    </div>
  );
}
