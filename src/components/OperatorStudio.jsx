import React, { useState, useEffect } from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles,
  Clock,
  Battery,
  Sun,
  ShieldCheck
} from 'lucide-react';
import { formatNumber, translations } from '../utils/localization';

export function OperatorStudio({ 
  operatorNotes, 
  setOperatorNotes, 
  parsedDirectives, 
  planSummary, 
  lang,
  onApplyDirectives 
}) {
  const t = translations[lang];
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');

  // Setup Web Speech API for Speech-to-Text
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
    }
  }, []);

  const toggleSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert(t.voiceNotSupported);
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = lang === 'bn' ? 'bn-BD' : 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = (e) => {
        console.error("Speech recognition error:", e);
        setIsListening(false);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          if (operatorNotes.length < 3) {
            setOperatorNotes(prev => [...prev, transcript]);
          } else {
            setNewNoteText(transcript);
          }
        }
      };

      recognition.start();
    } catch (err) {
      console.error(err);
      setIsListening(false);
    }
  };

  // Text to Speech playback
  const handleListenSummary = () => {
    if (!('speechSynthesis' in window)) {
      alert("TTS not supported in this browser");
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(planSummary || "Optimized dispatch schedule ready.");
    utterance.lang = lang === 'bn' ? 'bn-BD' : 'en-US';
    utterance.rate = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const handleAddNote = (e) => {
    e.preventDefault();
    if (!newNoteText.trim() || operatorNotes.length >= 3) return;
    setOperatorNotes([...operatorNotes, newNoteText.trim()]);
    setNewNoteText('');
  };

  const handleRemoveNote = (index) => {
    setOperatorNotes(operatorNotes.filter((_, idx) => idx !== index));
  };

  return (
    <div className="glass-panel" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
      {/* Title & Speech Controls */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '1.25rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Sparkles size={20} color="var(--primary-400)" />
            {t.operatorStudioTitle}
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            {t.operatorStudioDesc}
          </p>
        </div>

        {/* Action Buttons: Voice Mic + Audio Playback */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          {/* TTS Button */}
          <button 
            className="btn-secondary"
            onClick={handleListenSummary}
            title={t.listenSummary}
            style={{ borderColor: isSpeaking ? 'var(--primary-400)' : 'var(--border-glass)' }}
          >
            {isSpeaking ? <VolumeX size={18} color="var(--accent-rose)" /> : <Volume2 size={18} color="var(--primary-400)" />}
            <span>{isSpeaking ? t.speaking : t.listenSummary}</span>
          </button>

          {/* Pulsing Mic Button */}
          <button
            className={`voice-mic-btn ${isListening ? 'listening' : ''}`}
            onClick={toggleSpeechRecognition}
            title={isListening ? t.voiceListening : t.voiceInputPrompt}
          >
            {isListening ? <MicOff size={22} /> : <Mic size={22} />}
          </button>
        </div>
      </div>

      <div className="studio-grid">
        {/* Left Column: Notes Input & List */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {t.notesHeading} ({operatorNotes.length}/3)
            </span>
          </div>

          {/* Notes List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1rem' }}>
            {operatorNotes.map((note, index) => (
              <div 
                key={index} 
                className="glass-panel" 
                style={{ padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', background: 'rgba(255, 255, 255, 0.02)' }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', flex: 1 }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, padding: '0.2rem 0.5rem', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--primary-300)', borderRadius: '4px' }}>
                    #{formatNumber(index + 1, lang)}
                  </span>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-main)' }}>{note}</span>
                </div>
                <button
                  onClick={() => handleRemoveNote(index)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.3rem' }}
                  title={t.removeNote}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}

            {operatorNotes.length === 0 && (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', border: '1px dashed var(--border-glass)', borderRadius: 'var(--radius-sm)' }}>
                No active operator notes. Add a note or click the microphone to speak.
              </div>
            )}
          </div>

          {/* Add Note Form */}
          {operatorNotes.length < 3 && (
            <form onSubmit={handleAddNote} style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                placeholder={isListening ? t.voiceListening : t.voiceInputPrompt}
                style={{
                  flex: 1,
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.65rem 1rem',
                  color: '#fff',
                  fontFamily: 'inherit',
                  fontSize: '0.875rem',
                  outline: 'none'
                }}
              />
              <button 
                type="submit" 
                className="btn-primary" 
                disabled={!newNoteText.trim()}
                style={{ padding: '0.65rem 1rem' }}
              >
                <Plus size={16} />
                <span>{t.addNote}</span>
              </button>
            </form>
          )}
        </div>

        {/* Right Column: Interpreted Directives & Guardrail Feedback */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {t.parsedDirectivesTitle}
            </span>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--primary-400)' }}>
              <ShieldCheck size={14} />
              <span>{t.guardrailsPassed}</span>
            </div>
          </div>

          {parsedDirectives.map((dir, idx) => {
            const isNoOp = dir.directive_type === 'no_op';
            const hours = dir.structured_adjustment?.hours || [];

            return (
              <div 
                key={idx} 
                className={`directive-card ${isNoOp ? 'noop-directive' : 'active-directive'}`}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 700, color: isNoOp ? 'var(--text-muted)' : 'var(--primary-300)' }}>
                      {dir.directive_type}
                    </span>
                  </div>

                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '0.2rem 0.6rem',
                    borderRadius: 'var(--radius-full)',
                    background: dir.applies ? 'rgba(16, 185, 129, 0.15)' : 'rgba(148, 163, 184, 0.15)',
                    color: dir.applies ? 'var(--primary-400)' : 'var(--text-muted)',
                    border: `1px solid ${dir.applies ? 'rgba(16, 185, 129, 0.3)' : 'rgba(148, 163, 184, 0.2)'}`
                  }}>
                    {dir.applies ? t.appliesBadge : t.noOpBadge}
                  </span>
                </div>

                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  {dir.explanation}
                </p>

                {dir.structured_adjustment && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{t.affectedHours}:</span>
                    {hours.map(h => (
                      <span key={h} style={{ fontFamily: 'var(--font-mono)', padding: '0.15rem 0.4rem', borderRadius: '4px', background: 'rgba(52, 211, 153, 0.15)', color: 'var(--primary-200)' }}>
                        {formatNumber(h, lang)}:00
                      </span>
                    ))}

                    {dir.structured_adjustment.factor !== undefined && (
                      <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', color: 'var(--accent-amber)' }}>
                        Factor: {dir.structured_adjustment.factor}
                      </span>
                    )}

                    {dir.structured_adjustment.minimum_energy_kwh !== undefined && (
                      <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', color: '#60a5fa' }}>
                        Min: {dir.structured_adjustment.minimum_energy_kwh} kWh
                      </span>
                    )}

                    {dir.structured_adjustment.max_grid_kwh !== undefined && (
                      <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', color: '#f472b6' }}>
                        Cap: {dir.structured_adjustment.max_grid_kwh} kWh
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
