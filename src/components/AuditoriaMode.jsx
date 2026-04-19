'use client';

import { useState, useEffect, useRef, useMemo } from 'react';

// ============================================================
//  AUDITORÍA — Modo examen individual de certificación BIAN
//  Rediseño visual v1 · Reemplaza src/components/AuditoriaMode.jsx
// ============================================================

// Paleta (cambias un valor y todo se adapta)
const C = {
  base: '#0A0E14', surface: '#14181F', raised: '#1C212B',
  border: '#1C212B', borderStrong: '#3A414F',
  text: '#E6E8EC', muted: '#9CA3AF', hint: '#6B7280',
  accent: '#60A5FA', accentDark: '#042C53',
  success: '#34D399', successDark: '#04342C',
  warning: '#FBBF24', danger: '#F87171',
  paper: '#FAF8F2', paperBorder: '#D4CDB8', paperInner: '#C4BB9C',
  ink: '#2C2824', inkMuted: '#7A7468', inkAccent: '#8B7E5F',
};

const TIME_BY_DIFFICULTY = { 'FÁCIL': 60, 'FACIL': 60, 'MEDIA': 75, 'ALTA': 90, 'EXPERTO': 120 };
const EXAM_SIZE = 20; // preguntas por examen (cambia esto si quieres más o menos)

const ANIM = `
@keyframes ac-pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.04); } }
@keyframes ac-shake { 0%,100% { transform: translateX(0); } 20% { transform: translateX(-7px); } 40% { transform: translateX(6px); } 60% { transform: translateX(-4px); } 80% { transform: translateX(3px); } }
@keyframes ac-fadein { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
@keyframes ac-scalein { from { opacity: 0; transform: scale(.94); } to { opacity: 1; transform: scale(1); } }
@keyframes ac-barfill { from { width: 0 !important; } }
@keyframes ac-spin-once { from { transform: rotate(-180deg); opacity: 0; } to { transform: rotate(0); opacity: 1; } }
@keyframes ac-breath { 0%,100% { opacity: 1; } 50% { opacity: .82; } }
.ac-pulse { animation: ac-pulse 1.4s ease-in-out infinite; }
.ac-shake { animation: ac-shake .45s ease-in-out; }
.ac-fadein { animation: ac-fadein .45s ease-out both; }
.ac-scalein { animation: ac-scalein .55s cubic-bezier(.2,.9,.3,1.1) both; }
.ac-barfill { animation: ac-barfill 1s cubic-bezier(.2,.8,.2,1) both; }
.ac-spin-once { animation: ac-spin-once .9s ease-out both; }
.ac-breath { animation: ac-breath 2.4s ease-in-out infinite; }
.ac-opt { transition: transform .12s ease, border-color .15s ease, background .15s ease; }
.ac-opt:hover { transform: translateY(-1px); border-color: ${C.borderStrong}; }
.ac-opt:active { transform: scale(.99); }
.ac-btn { transition: transform .12s ease, opacity .15s ease; cursor: pointer; }
.ac-btn:hover { opacity: .92; }
.ac-btn:active { transform: scale(.98); }
`;

// ============================================================
//  COMPONENTE PRINCIPAL
// ============================================================
export default function AuditoriaMode({ preguntas: preguntasProp }) {
  const [preguntas, setPreguntas] = useState(preguntasProp || []);
  const [loading, setLoading] = useState(!preguntasProp);
  const [screen, setScreen] = useState('intro');
  const [playerName, setPlayerName] = useState('');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [displayScore, setDisplayScore] = useState(0);
  const [shakeKey, setShakeKey] = useState(0);
  const startTsRef = useRef(0);
  const examStartTsRef = useRef(0);

  // Cargar JSON si no viene como prop
  useEffect(() => {
    if (preguntasProp) return;
    fetch('/configuracion_juego.json')
      .then(r => r.json())
      .then(data => {
        const lista =
          data?.examen_certificacion?.preguntas ??
          data?.examen_certificacion ??
          [];
        setPreguntas(Array.isArray(lista) ? lista : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [preguntasProp]);

  const getTimeLimit = (q) =>
    q?.tiempo_limite_seg ?? q?.tiempoLimite ?? TIME_BY_DIFFICULTY[q?.dificultad?.toUpperCase()] ?? 60;

  const currentQ = preguntas[currentIdx];
  const totalPoints = useMemo(
    () => preguntas.reduce((a, q) => a + (q?.puntos ?? q?.puntaje ?? 10), 0),
    [preguntas]
  );
  const earnedPoints = answers.reduce((a, x) => a + x.score, 0);
  const correctCount = answers.filter(a => a.correct).length;
  const percent = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
  const passed = percent >= 70;
  const fmtTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  // Tick del timer
  useEffect(() => {
    if (screen !== 'question' || timeLeft <= 0) return;
    const t = setTimeout(() => setTimeLeft(x => x - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, screen]);

  // Timeout -> submit vacío
  useEffect(() => {
    if (screen === 'question' && timeLeft === 0 && currentQ) submitAnswer(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, screen]);

  // Count-up del score al entrar a resultados
  useEffect(() => {
    if (screen !== 'results') { setDisplayScore(0); return; }
    const dur = 1100, t0 = performance.now();
    let raf;
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplayScore(Math.round(earnedPoints * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [screen, earnedPoints]);

  const startExam = () => {
    if (!preguntas.length) return;

    // 1. Leer preguntas vistas recientemente (localStorage)
    let recentIds = [];
    try {
      const raw = typeof window !== 'undefined' ? window.localStorage.getItem('ac_auditoria_recent') : null;
      recentIds = raw ? JSON.parse(raw) : [];
    } catch (e) { recentIds = []; }

    // 2. Separar preguntas no vistas vs vistas recientemente
    const notSeen = preguntas.filter(q => !recentIds.includes(q.id));
    const seenRecently = preguntas.filter(q => recentIds.includes(q.id));

    // 3. Barajar cada grupo por separado, las no vistas van primero
    const shuffled = [...shuffleArray(notSeen), ...shuffleArray(seenRecently)];

    // 4. Tomar las primeras EXAM_SIZE preguntas, balanceando por dificultad si hay suficientes
    const selected = selectBalanced(shuffled, EXAM_SIZE);

    // 5. Barajar también las opciones dentro de cada pregunta (para que la correcta no esté siempre en la misma letra)
    const withShuffledOptions = selected.map(q => shuffleQuestionOptions(q));

    // 6. Guardar los IDs de las preguntas usadas en localStorage para la próxima vez
    try {
      const newRecent = [...withShuffledOptions.map(q => q.id), ...recentIds].slice(0, EXAM_SIZE * 2);
      if (typeof window !== 'undefined') window.localStorage.setItem('ac_auditoria_recent', JSON.stringify(newRecent));
    } catch (e) {}

    setPreguntas(withShuffledOptions);
    examStartTsRef.current = Date.now();
    startTsRef.current = Date.now();
    setCurrentIdx(0);
    setAnswers([]);
    setSelectedIdx(null);
    setTimeLeft(getTimeLimit(withShuffledOptions[0]));
    setScreen('question');
  };

  const submitAnswer = (idx) => {
    const q = currentQ;
    if (!q) return;
    const correctIdx = findCorrectIdx(q);
    const isCorrect = idx !== null && idx === correctIdx;
    const points = q.puntos ?? q.puntaje ?? 10;
    const timeSpent = Math.round((Date.now() - startTsRef.current) / 1000);

    setAnswers(prev => [...prev, {
      questionId: q.id,
      selectedIdx: idx,
      correctIdx,
      correct: isCorrect,
      score: isCorrect ? points : 0,
      totalPoints: points,
      categoria: q.categoria ?? 'General',
      timeSpent,
    }]);
    setSelectedIdx(idx);
    setScreen('feedback');
    if (!isCorrect) setShakeKey(k => k + 1);
    // Ya NO hay auto-avance. El jugador avanza con el botón "Siguiente pregunta".
  };

  const advanceToNext = () => {
    if (currentIdx + 1 >= preguntas.length) {
      setTotalTime(Math.round((Date.now() - examStartTsRef.current) / 1000));
      setScreen('results');
    } else {
      const next = currentIdx + 1;
      setCurrentIdx(next);
      setSelectedIdx(null);
      startTsRef.current = Date.now();
      setTimeLeft(getTimeLimit(preguntas[next]));
      setScreen('question');
    }
  };

  const restart = () => {
    setScreen('intro');
    setCurrentIdx(0);
    setAnswers([]);
    setSelectedIdx(null);
  };

  // ---------- Estados de carga/error ----------
  if (loading) return <Shell><div style={{ color: C.muted, textAlign: 'center', padding: 60 }}>Cargando preguntas…</div></Shell>;
  if (!preguntas.length) return <Shell><div style={{ color: C.danger, textAlign: 'center', padding: 60 }}>No se encontraron preguntas en configuracion_juego.json → examen_certificacion.</div></Shell>;

  // ---------- Render ----------
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: ANIM }} />
      <div style={{ maxWidth: 780, margin: '0 auto', padding: 16 }}>
        {screen === 'intro' && (
          <IntroScreen
            totalQ={preguntas.length}
            totalPts={totalPoints}
            playerName={playerName}
            setPlayerName={setPlayerName}
            onStart={startExam}
          />
        )}
        {(screen === 'question' || screen === 'feedback') && (
          <QuestionScreen
            q={currentQ}
            idx={currentIdx}
            total={preguntas.length}
            totalPts={totalPoints}
            earned={earnedPoints}
            timeLeft={timeLeft}
            timeTotal={getTimeLimit(currentQ)}
            selectedIdx={selectedIdx}
            showFeedback={screen === 'feedback'}
            shakeKey={shakeKey}
            onSelect={(i) => { if (screen === 'question') setSelectedIdx(i); }}
            onConfirm={() => submitAnswer(selectedIdx)}
            onSkip={() => submitAnswer(null)}
            onNext={advanceToNext}
            isLast={currentIdx + 1 >= preguntas.length}
          />
        )}
        {screen === 'results' && (
          <ResultsScreen
            displayScore={displayScore}
            earned={earnedPoints}
            totalPts={totalPoints}
            percent={percent}
            passed={passed}
            correct={correctCount}
            total={preguntas.length}
            totalTime={totalTime}
            answers={answers}
            onCertificate={() => setScreen('cert')}
            onReview={() => {/* aquí puedes abrir un modal de review si quieres */}}
            onRestart={restart}
          />
        )}
        {screen === 'cert' && (
          <CertificateScreen
            name={playerName || 'Jugador anónimo'}
            percent={percent}
            earned={earnedPoints}
            totalPts={totalPoints}
            onBack={() => setScreen('results')}
            onRestart={restart}
          />
        )}
      </div>
    </>
  );
}

// ============================================================
//  PANTALLA: INTRO
// ============================================================
function IntroScreen({ totalQ, totalPts, playerName, setPlayerName, onStart }) {
  return (
    <div className="ac-fadein" style={{ background: C.base, border: `1px solid ${C.border}`, borderRadius: 12, padding: '32px 28px', color: C.text }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
        <span style={{ background: C.accent, color: C.accentDark, padding: '3px 9px', borderRadius: 4, fontSize: 11, fontWeight: 500, letterSpacing: '0.08em' }}>AUDITORÍA</span>
        <span style={{ fontSize: 13, color: C.muted }}>Certificación BIAN Foundation</span>
      </div>

      <h1 style={{ fontSize: 28, fontWeight: 500, lineHeight: 1.2, margin: '0 0 10px' }}>Examen de conocimiento</h1>
      <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.6, margin: '0 0 24px', maxWidth: 560 }}>
        {totalQ} preguntas basadas en el examen oficial de certificación BIAN v14. Cada pregunta tiene tiempo límite según su dificultad. Necesitas 70% para aprobar y obtener el certificado digital.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 24 }}>
        <Stat label="PREGUNTAS" value={totalQ} />
        <Stat label="PUNTAJE MÁX" value={totalPts} />
        <Stat label="APROBACIÓN" value="70%" />
      </div>

      <div style={{ marginBottom: 22 }}>
        <label style={{ display: 'block', fontSize: 11, color: C.muted, letterSpacing: '0.08em', fontWeight: 500, marginBottom: 8 }}>TU NOMBRE (APARECERÁ EN EL CERTIFICADO)</label>
        <input
          type="text"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          placeholder="Ej. Renzo Torres"
          style={{
            width: '100%', boxSizing: 'border-box',
            background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6,
            padding: '11px 14px', fontSize: 14, color: C.text, outline: 'none',
            fontFamily: 'inherit',
          }}
          onFocus={(e) => e.target.style.borderColor = C.accent}
          onBlur={(e) => e.target.style.borderColor = C.border}
        />
      </div>

      <button
        className="ac-btn"
        onClick={onStart}
        disabled={!playerName.trim()}
        style={{
          width: '100%',
          background: playerName.trim() ? C.accent : C.raised,
          color: playerName.trim() ? C.accentDark : C.hint,
          border: `1px solid ${playerName.trim() ? C.accent : C.borderStrong}`,
          padding: '13px 22px', borderRadius: 6, fontSize: 14, fontWeight: 500,
          cursor: playerName.trim() ? 'pointer' : 'not-allowed',
        }}
      >
        Iniciar examen →
      </button>
    </div>
  );
}

// ============================================================
//  PANTALLA: PREGUNTA + FEEDBACK
// ============================================================
function QuestionScreen({ q, idx, total, totalPts, earned, timeLeft, timeTotal, selectedIdx, showFeedback, shakeKey, onSelect, onConfirm, onSkip, onNext, isLast }) {
  const rawOpciones = q?.opciones ?? q?.respuestas ?? [];
  // Normaliza: soporta strings u objetos {id, texto, es_correcta, explicacion}
  const opciones = rawOpciones.map(o => typeof o === 'string' ? { texto: o } : o);
  const correctIdx = findCorrectIdx(q);
  // Explicación a mostrar: la de la opción seleccionada (si es objeto) o la general de la pregunta
  const selectedOpt = selectedIdx !== null ? opciones[selectedIdx] : null;
  const correctOpt = opciones[correctIdx];
  const feedbackExplanation = (showFeedback && selectedOpt?.explicacion) || correctOpt?.explicacion || q?.explicacion;
  const progress = ((idx + (showFeedback ? 1 : 0)) / total) * 100;
  const circumference = 150.8; // 2π × 24
  const timerRatio = timeTotal > 0 ? timeLeft / timeTotal : 0;
  const timerOffset = circumference * (1 - timerRatio);
  const timerColor = timeLeft <= 5 ? C.danger : timeLeft <= 15 ? C.warning : C.accent;
  const diffColor = q?.dificultad?.toUpperCase() === 'FÁCIL' || q?.dificultad?.toUpperCase() === 'FACIL' ? C.success
                  : q?.dificultad?.toUpperCase() === 'ALTA' ? C.danger
                  : q?.dificultad?.toUpperCase() === 'EXPERTO' ? '#C084FC'
                  : C.warning;

  const userAnswered = showFeedback && selectedIdx !== null;
  const userCorrect = showFeedback && selectedIdx === correctIdx;

  return (
    <div className="ac-fadein" style={{ background: C.base, border: `1px solid ${C.border}`, borderRadius: 12, padding: '22px 24px', color: C.text }}>

      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ background: C.accent, color: C.accentDark, padding: '3px 9px', borderRadius: 4, fontSize: 11, fontWeight: 500, letterSpacing: '0.08em' }}>AUDITORÍA</span>
          <span style={{ fontSize: 13, color: C.muted }}>Certificación BIAN Foundation</span>
        </div>
        <div style={{ display: 'flex', gap: 20 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: C.muted, letterSpacing: '0.08em', fontWeight: 500 }}>PREGUNTA</div>
            <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 14, fontWeight: 500, marginTop: 1 }}>{String(idx + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: C.muted, letterSpacing: '0.08em', fontWeight: 500 }}>PUNTAJE</div>
            <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 14, fontWeight: 500, marginTop: 1 }}>{earned}<span style={{ color: C.hint }}> / {totalPts}</span></div>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div style={{ height: 3, background: C.raised, borderRadius: 2, overflow: 'hidden', marginBottom: 22 }}>
        <div style={{ height: '100%', width: `${progress}%`, background: C.accent, transition: 'width .45s ease' }} />
      </div>

      {/* Meta row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <span style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.muted, padding: '5px 11px', borderRadius: 4, fontSize: 11, letterSpacing: '0.08em', fontWeight: 500 }}>
            {q?.categoria?.toUpperCase() ?? 'GENERAL'}
          </span>
          <span style={{ background: `${diffColor}1A`, border: `1px solid ${diffColor}55`, color: diffColor, padding: '5px 11px', borderRadius: 4, fontSize: 11, letterSpacing: '0.08em', fontWeight: 500 }}>
            {q?.dificultad?.toUpperCase() ?? 'MEDIA'} · {timeTotal}s
          </span>
        </div>
        <div style={{ position: 'relative', width: 58, height: 58 }}>
          <svg width="58" height="58" viewBox="0 0 58 58" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="29" cy="29" r="24" stroke={C.raised} strokeWidth="3" fill="none" />
            <circle cx="29" cy="29" r="24" stroke={timerColor} strokeWidth="3" fill="none" strokeLinecap="round"
              strokeDasharray={circumference} strokeDashoffset={timerOffset}
              style={{ transition: 'stroke-dashoffset 1s linear, stroke .3s ease' }} />
          </svg>
          <div className={timeLeft <= 3 && timeLeft > 0 ? 'ac-pulse' : ''}
               style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 17, fontWeight: 500, lineHeight: 1, color: timerColor }}>{timeLeft}</span>
            <span style={{ fontSize: 11, color: C.muted, letterSpacing: '0.05em' }}>seg</span>
          </div>
        </div>
      </div>

      {/* Pregunta */}
      <div key={`q-${idx}-${shakeKey}`} className={showFeedback && !userCorrect && userAnswered ? 'ac-shake' : ''} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: '20px 22px', marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: C.muted, letterSpacing: '0.08em', fontWeight: 500, marginBottom: 10 }}>PREGUNTA {String(idx + 1).padStart(2, '0')}</div>
        <div style={{ fontSize: 17, fontWeight: 500, lineHeight: 1.55 }} dangerouslySetInnerHTML={{ __html: highlightKeywords(q?.pregunta ?? '') }} />
      </div>

      {/* Opciones */}
      <div style={{ display: 'grid', gap: 8, marginBottom: 16 }}>
        {opciones.map((opt, i) => {
          const letter = String.fromCharCode(65 + i);
          const isSelected = selectedIdx === i;
          const isCorrect = showFeedback && i === correctIdx;
          const isWrongPick = showFeedback && isSelected && i !== correctIdx;

          let borderColor = C.border, bg = C.surface, letterBg = C.raised, letterColor = C.muted, opacity = 1;
          if (showFeedback) {
            if (isCorrect) { borderColor = C.success; bg = `${C.success}15`; letterBg = C.success; letterColor = C.successDark; }
            else if (isWrongPick) { borderColor = C.danger; bg = `${C.danger}15`; letterBg = C.danger; letterColor = '#501313'; }
            else { opacity = 0.4; }
          } else if (isSelected) {
            borderColor = C.accent; letterBg = C.accent; letterColor = C.accentDark;
          }

          return (
            <button key={i}
              className="ac-opt"
              onClick={() => onSelect(i)}
              disabled={showFeedback}
              style={{
                background: bg, border: `1px solid ${borderColor}`, borderRadius: 8,
                padding: '13px 16px', textAlign: 'left', color: C.text,
                display: 'flex', alignItems: 'center', gap: 14, fontSize: 14,
                fontFamily: 'inherit', cursor: showFeedback ? 'default' : 'pointer',
                opacity, width: '100%',
              }}>
              <span style={{
                width: 28, height: 28, background: letterBg, borderRadius: 4,
                fontFamily: 'ui-monospace, monospace', fontSize: 12, color: letterColor,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 500, flexShrink: 0,
              }}>{letter}</span>
              <span style={{ flex: 1 }}>{opt.texto ?? String(opt)}</span>
              {showFeedback && isCorrect && <span style={{ fontSize: 11, color: C.success, letterSpacing: '0.05em', fontWeight: 500 }}>✓ correcta</span>}
              {showFeedback && isWrongPick && <span style={{ fontSize: 11, color: C.danger, letterSpacing: '0.05em', fontWeight: 500 }}>✗ tu elección</span>}
              {!showFeedback && isSelected && <span style={{ fontSize: 11, color: C.accent, letterSpacing: '0.05em' }}>seleccionada</span>}
            </button>
          );
        })}
      </div>

      {/* Explicación (cuando hay feedback) */}
      {showFeedback && feedbackExplanation && (
        <div className="ac-fadein" style={{ background: C.raised, border: `1px solid ${C.border}`, borderRadius: 8, padding: '12px 16px', marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: C.muted, letterSpacing: '0.08em', fontWeight: 500, marginBottom: 6 }}>EXPLICACIÓN</div>
          <div style={{ fontSize: 13, color: C.text, lineHeight: 1.6 }}>{feedbackExplanation}</div>
        </div>
      )}

      {/* Footer acciones */}
      {!showFeedback && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
          <button className="ac-btn" onClick={onSkip}
            style={{ background: 'transparent', border: `1px solid ${C.borderStrong}`, color: C.muted, padding: '9px 14px', borderRadius: 6, fontSize: 12, fontWeight: 500 }}>
            Saltar pregunta
          </button>
          <button className="ac-btn" onClick={onConfirm} disabled={selectedIdx === null}
            style={{
              background: selectedIdx !== null ? C.accent : C.raised,
              color: selectedIdx !== null ? C.accentDark : C.hint,
              border: `1px solid ${selectedIdx !== null ? C.accent : C.borderStrong}`,
              padding: '10px 22px', borderRadius: 6, fontSize: 13, fontWeight: 500,
              cursor: selectedIdx !== null ? 'pointer' : 'not-allowed',
            }}>
            Confirmar respuesta →
          </button>
        </div>
      )}

      {/* Footer cuando hay feedback: botón siguiente, sin límite de tiempo */}
      {showFeedback && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 14, borderTop: `1px solid ${C.border}`, gap: 12 }}>
          <div style={{ fontSize: 12, color: C.muted, fontStyle: 'italic' }}>
            {userCorrect ? '✓ Respuesta correcta. ' : userAnswered ? '✗ Respuesta incorrecta. ' : '⏱ Tiempo agotado. '}
            Tómate tu tiempo para leer la explicación.
          </div>
          <button className="ac-btn ac-breath" onClick={onNext}
            style={{
              background: C.accent, color: C.accentDark,
              border: `1px solid ${C.accent}`,
              padding: '10px 22px', borderRadius: 6, fontSize: 13, fontWeight: 500,
              whiteSpace: 'nowrap',
            }}>
            {isLast ? 'Ver resultados →' : 'Siguiente pregunta →'}
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================
//  PANTALLA: RESULTADOS
// ============================================================
function ResultsScreen({ displayScore, earned, totalPts, percent, passed, correct, total, totalTime, answers, onCertificate, onRestart }) {
  // Breakdown por categoría
  const byCat = useMemo(() => {
    const map = {};
    answers.forEach(a => {
      if (!map[a.categoria]) map[a.categoria] = { correct: 0, total: 0, score: 0, max: 0 };
      map[a.categoria].total += 1;
      map[a.categoria].max += a.totalPoints;
      map[a.categoria].score += a.score;
      if (a.correct) map[a.categoria].correct += 1;
    });
    return Object.entries(map).map(([cat, d]) => ({ cat, ...d, pct: d.max ? Math.round((d.score / d.max) * 100) : 0 }));
  }, [answers]);

  const bestCat = [...byCat].sort((a, b) => b.pct - a.pct)[0];

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="ac-fadein" style={{ background: C.base, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24, color: C.text }}>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
        <span style={{ background: C.accent, color: C.accentDark, padding: '3px 9px', borderRadius: 4, fontSize: 11, fontWeight: 500, letterSpacing: '0.08em' }}>AUDITORÍA</span>
        <span style={{ fontSize: 13, color: C.muted }}>Resultados · Certificación BIAN Foundation</span>
      </div>

      {/* Hero */}
      <div className="ac-scalein" style={{ background: C.surface, border: `1px solid ${passed ? C.success + '55' : C.warning + '55'}`, borderRadius: 10, padding: 22, marginBottom: 14, display: 'grid', gridTemplateColumns: '72px 1fr auto', gap: 20, alignItems: 'center' }}>
        <div style={{ width: 72, height: 72, background: passed ? `${C.success}1A` : `${C.warning}1A`, border: `1px solid ${passed ? C.success + '66' : C.warning + '66'}`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {passed ? (
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><path d="M9 16 L14 21 L23 11" stroke={C.success} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          ) : (
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="11" stroke={C.warning} strokeWidth="2.2" fill="none" /><path d="M16 10 L16 17" stroke={C.warning} strokeWidth="2.2" strokeLinecap="round" /><circle cx="16" cy="21" r="1.3" fill={C.warning} /></svg>
          )}
        </div>
        <div>
          <div style={{ color: passed ? C.success : C.warning, fontSize: 12, letterSpacing: '0.14em', fontWeight: 500, marginBottom: 6 }}>{passed ? 'APROBADO' : 'NO APROBADO'}</div>
          <div style={{ fontSize: 22, fontWeight: 500, lineHeight: 1.2 }}>{passed ? 'Has superado la certificación' : 'Aún no alcanzas el umbral'}</div>
          <div style={{ color: C.muted, fontSize: 12, marginTop: 6 }}>Umbral: 70% · Tu nota: {percent}%</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 40, fontWeight: 500, lineHeight: 1 }}>{displayScore}</div>
          <div style={{ color: C.muted, fontSize: 12, marginTop: 3 }}>/ {totalPts} pts</div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
        <Stat label="CORRECTAS" value={`${correct} / ${total}`} mono />
        <Stat label="TIEMPO" value={fmt(totalTime)} mono />
        <Stat label="MEJOR ÁREA" value={bestCat?.cat ?? '—'} color={C.success} />
      </div>

      {/* Breakdown */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: '16px 18px', marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: C.muted, letterSpacing: '0.08em', fontWeight: 500, marginBottom: 14 }}>DESGLOSE POR CATEGORÍA</div>
        {byCat.map((row, i) => {
          const barColor = row.pct >= 70 ? C.success : C.warning;
          return (
            <div key={row.cat} style={{ display: 'grid', gridTemplateColumns: '170px 1fr 70px', gap: 12, alignItems: 'center', marginBottom: i === byCat.length - 1 ? 0 : 10 }}>
              <span style={{ fontSize: 13 }}>{row.cat}</span>
              <div style={{ height: 5, background: C.raised, borderRadius: 2, overflow: 'hidden' }}>
                <div className="ac-barfill" style={{ height: '100%', width: `${row.pct}%`, background: barColor, animationDelay: `${i * 80}ms` }} />
              </div>
              <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12, textAlign: 'right', color: row.pct >= 70 ? C.text : C.warning }}>{row.score} / {row.max}</span>
            </div>
          );
        })}
      </div>

      {/* Acciones */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
        <button className="ac-btn" onClick={onRestart}
          style={{ background: 'transparent', border: `1px solid ${C.borderStrong}`, color: C.text, padding: '9px 14px', borderRadius: 6, fontSize: 12, fontWeight: 500 }}>
          Intentar de nuevo
        </button>
        {passed ? (
          <button className="ac-btn ac-breath" onClick={onCertificate}
            style={{ background: C.success, border: `1px solid ${C.success}`, color: C.successDark, padding: '10px 22px', borderRadius: 6, fontSize: 13, fontWeight: 500 }}>
            Ver certificado →
          </button>
        ) : (
          <button className="ac-btn" onClick={onRestart}
            style={{ background: C.accent, border: `1px solid ${C.accent}`, color: C.accentDark, padding: '10px 22px', borderRadius: 6, fontSize: 13, fontWeight: 500 }}>
            Reintentar →
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================
//  PANTALLA: CERTIFICADO
// ============================================================
function CertificateScreen({ name, percent, earned, totalPts, onBack, onRestart }) {
  const hoy = new Date();
  const fecha = `${String(hoy.getDate()).padStart(2, '0')} · ${String(hoy.getMonth() + 1).padStart(2, '0')} · ${hoy.getFullYear()}`;
  const verif = `AC-${earned}-BIAN14`;

  const handlePrint = () => window.print();

  return (
    <>
      <div className="ac-scalein" style={{ background: C.paper, border: `1px solid ${C.paperBorder}`, borderRadius: 4, padding: '36px 40px', color: C.ink, position: 'relative', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
        {/* marco interno */}
        <div style={{ position: 'absolute', top: 10, left: 10, right: 10, bottom: 10, border: `1px solid ${C.paperInner}`, borderRadius: 2, pointerEvents: 'none' }} />

        <div style={{ position: 'relative', padding: '12px 8px' }}>
          {/* sello superior */}
          <div style={{ textAlign: 'center', marginBottom: 22 }}>
            <div className="ac-spin-once" style={{ display: 'inline-block', width: 36, height: 36, background: C.inkAccent, borderRadius: 6, transform: 'rotate(45deg)', position: 'relative' }}>
              <div style={{ position: 'absolute', inset: 9, border: `1.5px solid ${C.paper}`, borderRadius: 2 }} />
            </div>
          </div>

          {/* título */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, letterSpacing: '0.35em', color: C.inkAccent, fontWeight: 500 }}>CERTIFICADO DE CONOCIMIENTO</div>
            <div style={{ width: 60, height: 1, background: C.paperInner, margin: '14px auto' }} />
            <div style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontSize: 26, color: C.ink, lineHeight: 1.2 }}>BIAN Foundation v14</div>
            <div style={{ fontSize: 11, color: C.inkMuted, marginTop: 6, letterSpacing: '0.1em' }}>Banking Industry Architecture Network</div>
          </div>

          {/* otorgado a */}
          <div style={{ textAlign: 'center', margin: '26px 0 22px' }}>
            <div style={{ fontSize: 12, color: C.inkMuted, letterSpacing: '0.06em', marginBottom: 12 }}>Se otorga a</div>
            <div style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontSize: 32, color: C.ink, fontStyle: 'italic', fontWeight: 400, lineHeight: 1.1 }}>{name}</div>
            <div style={{ width: 220, height: 1, background: C.paperInner, margin: '12px auto' }} />
          </div>

          {/* cuerpo */}
          <div style={{ textAlign: 'center', fontSize: 13, color: '#4A443A', lineHeight: 1.75, maxWidth: 450, margin: '0 auto 24px' }}>
            Por haber superado satisfactoriamente la auditoría de conocimiento en los estándares BIAN v14 de arquitectura bancaria, demostrando dominio en fundamentos, metamodelo y herramientas del framework.
          </div>

          {/* score */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 24, marginBottom: 28 }}>
            <CertStat value={`${percent}%`} label="CALIFICACIÓN" />
            <div style={{ width: 1, height: 36, background: C.paperBorder }} />
            <CertStat value={`${earned} / ${totalPts}`} label="PUNTAJE" />
            <div style={{ width: 1, height: 36, background: C.paperBorder }} />
            <CertStat value={fecha} label="FECHA" />
          </div>

          {/* firma + sello */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: 20, borderTop: `1px solid #E0D9C0` }}>
            <div>
              <div style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 20, color: C.ink, paddingBottom: 4, borderBottom: `1px solid ${C.inkMuted}`, width: 170, lineHeight: 1 }}>A. Chaos</div>
              <div style={{ fontSize: 11, color: C.inkMuted, marginTop: 6 }}>Architecture Chaos Platform</div>
              <div style={{ fontSize: 11, color: C.inkAccent, letterSpacing: '0.05em', marginTop: 2 }}>Verificación: {verif}</div>
            </div>
            <div style={{ width: 78, height: 78, border: `2px solid ${C.inkAccent}`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(139,126,95,0.06)' }}>
              <div style={{ textAlign: 'center', color: C.inkAccent }}>
                <div style={{ fontSize: 11, letterSpacing: '0.18em', fontWeight: 500 }}>BIAN</div>
                <div style={{ fontFamily: 'Georgia, serif', fontSize: 17, fontStyle: 'italic', lineHeight: 1.1, marginTop: 1 }}>Certified</div>
                <div style={{ fontSize: 11, letterSpacing: '0.12em', fontWeight: 500, marginTop: 1 }}>{hoy.getFullYear()}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', marginTop: 12 }}>
        <button className="ac-btn" onClick={onBack}
          style={{ background: 'transparent', border: `1px solid ${C.borderStrong}`, color: C.text, padding: '9px 14px', borderRadius: 6, fontSize: 13, fontWeight: 500 }}>
          ← Volver a resultados
        </button>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="ac-btn" onClick={onRestart}
            style={{ background: 'transparent', border: `1px solid ${C.borderStrong}`, color: C.text, padding: '9px 14px', borderRadius: 6, fontSize: 13, fontWeight: 500 }}>
            Nuevo intento
          </button>
          <button className="ac-btn" onClick={handlePrint}
            style={{ background: C.accent, border: `1px solid ${C.accent}`, color: C.accentDark, padding: '9px 14px', borderRadius: 6, fontSize: 13, fontWeight: 500 }}>
            Imprimir / Guardar PDF ↓
          </button>
        </div>
      </div>
    </>
  );
}

// ============================================================
//  HELPERS INTERNOS
// ============================================================
function Shell({ children }) {
  return <div style={{ maxWidth: 780, margin: '0 auto', padding: 16 }}><div style={{ background: C.base, border: `1px solid ${C.border}`, borderRadius: 12, padding: 40 }}>{children}</div></div>;
}

function Stat({ label, value, mono, color }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: '11px 14px' }}>
      <div style={{ color: C.muted, fontSize: 11, letterSpacing: '0.08em', fontWeight: 500 }}>{label}</div>
      <div style={{ color: color || C.text, fontFamily: mono ? 'ui-monospace, monospace' : 'inherit', fontSize: mono ? 16 : 14, fontWeight: 500, marginTop: 3 }}>{value}</div>
    </div>
  );
}

function CertStat({ value, label }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontFamily: 'Georgia, serif', fontSize: 22, color: C.ink, fontWeight: 500, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: C.inkMuted, letterSpacing: '0.12em', marginTop: 4 }}>{label}</div>
    </div>
  );
}

// Detecta el índice de la respuesta correcta soportando:
//  - q.respuesta_correcta (número)
//  - q.correcta (número)
//  - opciones con flag { es_correcta: true } dentro de cada opción
function findCorrectIdx(q) {
  if (!q) return 0;
  if (typeof q.respuesta_correcta === 'number') return q.respuesta_correcta;
  if (typeof q.correcta === 'number') return q.correcta;
  const ops = q.opciones ?? q.respuestas ?? [];
  const found = ops.findIndex(o => o && typeof o === 'object' && (o.es_correcta === true || o.correcta === true));
  return found >= 0 ? found : 0;
}

// Resalta "NO" o "NO es" en ámbar dentro del texto de la pregunta
function highlightKeywords(text) {
  if (!text) return '';
  const escape = (s) => s.replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' }[c]));
  const safe = escape(text);
  return safe.replace(/\b(NO|EXCEPTO|FALSA|INCORRECTA)\b/g, `<span style="color:${C.warning};font-weight:500">$1</span>`);
}

// Fisher-Yates shuffle (in-place copy, no muta el original)
function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Selecciona N preguntas intentando balancear dificultades.
// Si no hay suficiente variedad, toma las primeras N después del shuffle.
function selectBalanced(shuffled, n) {
  if (shuffled.length <= n) return shuffled;
  // Agrupa por dificultad
  const byDiff = {};
  shuffled.forEach(q => {
    const d = (q.dificultad || 'MEDIA').toUpperCase();
    if (!byDiff[d]) byDiff[d] = [];
    byDiff[d].push(q);
  });
  // Intenta distribuir proporcionalmente
  const totalDiffs = Object.keys(byDiff).length;
  const perDiff = Math.floor(n / totalDiffs);
  const result = [];
  Object.values(byDiff).forEach(group => {
    result.push(...group.slice(0, perDiff));
  });
  // Rellenar hasta N con las preguntas restantes
  const remaining = shuffled.filter(q => !result.includes(q));
  while (result.length < n && remaining.length > 0) {
    result.push(remaining.shift());
  }
  return shuffleArray(result).slice(0, n); // re-shuffle para que no queden agrupadas por dificultad
}

// Baraja las opciones de una pregunta manteniendo la referencia a la correcta
function shuffleQuestionOptions(q) {
  const rawOps = q.opciones ?? q.respuestas ?? [];
  if (!rawOps.length) return q;
  // Marca el índice original de la correcta antes de barajar
  const originalCorrectIdx = findCorrectIdx(q);
  // Crea array con índice original para rastrear después del shuffle
  const withIdx = rawOps.map((op, i) => ({ op, originalIdx: i }));
  const shuffled = shuffleArray(withIdx);
  const newOps = shuffled.map(x => x.op);
  const newCorrectIdx = shuffled.findIndex(x => x.originalIdx === originalCorrectIdx);
  // Devuelve la pregunta con opciones barajadas y nuevo índice correcto
  return {
    ...q,
    opciones: newOps,
    respuesta_correcta: newCorrectIdx, // sobreescribe por si el JSON usaba índice numérico
  };
}

