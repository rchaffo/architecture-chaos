// IntegratorEffects.jsx — Visual Effects for IntegratorStation
// Architecture Chaos — Fase 2
// Import these components and CSS into the existing IntegratorStation.jsx
// Usage: Wrap existing IntegratorStation with <IntegratorEffectsProvider>

import { useState, useEffect, useCallback, createContext, useContext } from 'react';

// ─── EFFECTS CONTEXT ─────────────────────────────────────────────────
const EffectsContext = createContext(null);

export function useIntegratorEffects() {
  return useContext(EffectsContext);
}

// ─── EFFECTS PROVIDER ────────────────────────────────────────────────
export function IntegratorEffectsProvider({ children }) {
  const [activeEffects, setActiveEffects] = useState([]);
  const [screenShake, setScreenShake] = useState(false);
  const [deployState, setDeployState] = useState(null); // null | 'deploying' | 'success' | 'failure'
  const [slotSnap, setSlotSnap] = useState(null);

  const triggerSlotSnap = useCallback((slotId) => {
    setSlotSnap(slotId);
    setTimeout(() => setSlotSnap(null), 600);
  }, []);

  const triggerScreenShake = useCallback((intensity = 'medium') => {
    setScreenShake(intensity);
    const dur = intensity === 'heavy' ? 800 : intensity === 'medium' ? 500 : 300;
    setTimeout(() => setScreenShake(false), dur);
  }, []);

  const triggerDeploy = useCallback((success) => {
    setDeployState('deploying');
    setTimeout(() => {
      setDeployState(success ? 'success' : 'failure');
      if (!success) setScreenShake('heavy');
    }, 2500);
  }, []);

  const clearDeploy = useCallback(() => {
    setDeployState(null);
  }, []);

  const value = {
    slotSnap,
    screenShake,
    deployState,
    triggerSlotSnap,
    triggerScreenShake,
    triggerDeploy,
    clearDeploy
  };

  return (
    <EffectsContext.Provider value={value}>
      <div className={`relative ${screenShake ? `animate-shake-${screenShake}` : ''}`}>
        {children}
        {deployState && <DeployOverlay state={deployState} onDone={clearDeploy} />}
      </div>
    </EffectsContext.Provider>
  );
}

// ─── SLOT SNAP ANIMATION ─────────────────────────────────────────────
export function SlotSnapEffect({ active, children }) {
  return (
    <div className={`relative transition-transform ${active ? 'slot-snap-active' : ''}`}>
      {children}
      {active && (
        <>
          {/* Snap flash */}
          <div className="absolute inset-0 bg-emerald-400/20 rounded-lg pointer-events-none" style={{ animation: 'snapFlash 0.6s ease-out forwards' }} />
          {/* Corner sparks */}
          {['-top-1 -left-1', '-top-1 -right-1', '-bottom-1 -left-1', '-bottom-1 -right-1'].map((pos, i) => (
            <div key={i} className={`absolute ${pos} w-2 h-2 rounded-full bg-emerald-400 pointer-events-none`}
              style={{ animation: `sparkBurst 0.5s ease-out ${i * 0.05}s forwards` }} />
          ))}
          {/* Ripple */}
          <div className="absolute inset-0 rounded-lg border-2 border-emerald-400 pointer-events-none"
            style={{ animation: 'slotRipple 0.6s ease-out forwards' }} />
        </>
      )}
    </div>
  );
}

// ─── GAUGE DANGER EFFECT ─────────────────────────────────────────────
export function GaugeDangerEffect({ value, threshold = 80, children }) {
  const isDanger = value >= threshold;

  return (
    <div className={`relative ${isDanger ? 'gauge-danger' : ''}`}>
      {children}
      {isDanger && (
        <>
          <div className="absolute inset-0 rounded pointer-events-none border border-red-500/50"
            style={{ animation: 'gaugePulse 0.8s ease-in-out infinite' }} />
          <div className="absolute -inset-1 rounded pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(239,68,68,0.15) 0%, transparent 70%)',
              animation: 'gaugeGlow 1.2s ease-in-out infinite'
            }}
          />
        </>
      )}
    </div>
  );
}

// ─── DEPLOY OVERLAY ──────────────────────────────────────────────────
function DeployOverlay({ state, onDone }) {
  useEffect(() => {
    if (state === 'success' || state === 'failure') {
      const t = setTimeout(onDone, 5000);
      return () => clearTimeout(t);
    }
  }, [state, onDone]);

  if (state === 'deploying') {
    return (
      <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center" style={{ animation: 'fadeIn 0.5s ease-out' }}>
        <div className="text-center">
          {/* Terminal-style deploy animation */}
          <div className="w-96 bg-zinc-900 border border-zinc-700 rounded-lg overflow-hidden font-mono shadow-2xl">
            <div className="flex items-center gap-2 px-3 py-2 bg-zinc-800 border-b border-zinc-700">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-xs text-zinc-400 ml-2">deploy.sh</span>
            </div>
            <div className="p-4 text-left space-y-1">
              <DeployLine delay={0} text="$ bian-deploy --validate" />
              <DeployLine delay={300} text="[INFO] Validating Service Domain configuration..." />
              <DeployLine delay={600} text="[INFO] Checking Control Record integrity..." color="text-blue-400" />
              <DeployLine delay={900} text="[INFO] Verifying Behavior Qualifiers..." color="text-blue-400" />
              <DeployLine delay={1200} text="[INFO] Running integration tests..." color="text-cyan-400" />
              <DeployLine delay={1500} text="[INFO] Building deployment package..." color="text-purple-400" />
              <DeployLine delay={1800} text="[INFO] Deploying to production cluster..." color="text-amber-400" />
              <DeployLine delay={2100} text="[....] Waiting for health check..." color="text-amber-400" blink />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (state === 'success') {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ animation: 'fadeIn 0.3s ease-out' }}>
        {/* Background with particles */}
        <div className="absolute inset-0 bg-black/85 overflow-hidden">
          {/* Success particles */}
          {Array.from({ length: 40 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-1.5 h-1.5 rounded-full"
              style={{
                left: `${50 + (Math.random() - 0.5) * 60}%`,
                top: `${50 + (Math.random() - 0.5) * 60}%`,
                backgroundColor: ['#22c55e', '#10b981', '#34d399', '#6ee7b7', '#fbbf24'][i % 5],
                animation: `particleFly ${1.5 + Math.random() * 2}s ease-out ${Math.random() * 0.5}s forwards`
              }}
            />
          ))}
          {/* Central glow */}
          <div className="absolute inset-0" style={{
            background: 'radial-gradient(circle at 50% 50%, rgba(34,197,94,0.2) 0%, transparent 60%)',
            animation: 'successGlow 2s ease-out forwards'
          }} />
        </div>

        {/* Content */}
        <div className="relative z-10 text-center" style={{ animation: 'deployResultIn 0.6s cubic-bezier(0.16,1,0.3,1) forwards' }}>
          <div className="text-8xl mb-4" style={{ animation: 'successIcon 0.8s cubic-bezier(0.34,1.56,0.64,1) 0.2s both' }}>🚀</div>
          <h2 className="text-3xl font-bold font-mono text-emerald-400 mb-2" style={{ animation: 'fadeSlideUp 0.5s ease-out 0.4s both' }}>
            DEPLOY EXITOSO
          </h2>
          <p className="text-sm text-emerald-300/70 font-mono mb-1" style={{ animation: 'fadeSlideUp 0.5s ease-out 0.6s both' }}>
            Arquitectura BIAN desplegada correctamente
          </p>
          <p className="text-xs text-zinc-500 font-mono" style={{ animation: 'fadeSlideUp 0.5s ease-out 0.8s both' }}>
            Todos los Service Domains operativos
          </p>

          {/* Progress bar fill */}
          <div className="w-64 mx-auto mt-6 h-1.5 bg-zinc-800 rounded-full overflow-hidden" style={{ animation: 'fadeSlideUp 0.5s ease-out 1s both' }}>
            <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full" style={{ animation: 'progressFill 1.5s ease-out 1.2s both' }} />
          </div>

          <button
            onClick={onDone}
            className="mt-6 px-6 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-mono rounded transition-colors"
            style={{ animation: 'fadeSlideUp 0.5s ease-out 1.4s both' }}
          >
            Continuar
          </button>
        </div>
      </div>
    );
  }

  if (state === 'failure') {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ animation: 'fadeIn 0.3s ease-out' }}>
        {/* Glitchy background */}
        <div className="absolute inset-0 bg-black/90 overflow-hidden">
          {/* Error scan lines */}
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="absolute left-0 right-0 h-px bg-red-500/30"
              style={{
                top: `${15 + i * 12}%`,
                animation: `errorScanline ${0.3 + Math.random() * 0.5}s ease-in-out ${Math.random() * 0.3}s infinite`,
                transform: `translateX(${(Math.random() - 0.5) * 20}px)`
              }}
            />
          ))}
          {/* Red flash */}
          <div className="absolute inset-0 bg-red-900/20" style={{ animation: 'errorFlash 0.15s ease-out 3 forwards' }} />
        </div>

        {/* Content */}
        <div className="relative z-10 text-center" style={{ animation: 'shakeIn 0.5s ease-out forwards' }}>
          <div className="text-8xl mb-4" style={{ animation: 'failIcon 0.6s ease-out both', filter: 'drop-shadow(0 0 20px rgba(239,68,68,0.5))' }}>💥</div>
          <h2 className="text-3xl font-bold font-mono text-red-400 mb-2">DEPLOY FALLIDO</h2>
          <p className="text-sm text-red-300/70 font-mono mb-1">La arquitectura tiene errores críticos</p>
          <p className="text-xs text-zinc-500 font-mono">Revisa los componentes y vuelve a intentar</p>

          {/* Error terminal */}
          <div className="w-80 mx-auto mt-4 bg-zinc-900 border border-red-900/50 rounded p-3 text-left font-mono text-xs">
            <p className="text-red-400">[FATAL] Integration test failed</p>
            <p className="text-red-300/60">[ERROR] Service Domain mismatch detected</p>
            <p className="text-red-300/60">[ERROR] Rollback initiated...</p>
            <p className="text-amber-400 mt-1">[WARN] System restored to previous state</p>
          </div>

          <button
            onClick={onDone}
            className="mt-6 px-6 py-2 bg-red-800 hover:bg-red-700 text-white text-sm font-mono rounded transition-colors"
          >
            Volver al Blueprint
          </button>
        </div>
      </div>
    );
  }

  return null;
}

// ─── DEPLOY LINE COMPONENT ───────────────────────────────────────────
function DeployLine({ delay, text, color = 'text-zinc-400', blink = false }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  if (!visible) return <div className="h-4" />;

  return (
    <p className={`text-xs ${color} ${blink ? 'animate-pulse' : ''}`} style={{ animation: 'typeIn 0.15s ease-out' }}>
      {text}
    </p>
  );
}

// ─── CSS ANIMATIONS (inject into page) ───────────────────────────────
export function IntegratorEffectsStyles() {
  return (
    <style>{`
      /* ── Screen Shake ── */
      .animate-shake-light {
        animation: shakeLight 0.3s ease-out;
      }
      .animate-shake-medium {
        animation: shakeMedium 0.5s ease-out;
      }
      .animate-shake-heavy {
        animation: shakeHeavy 0.8s ease-out;
      }

      @keyframes shakeLight {
        0%, 100% { transform: translateX(0); }
        20% { transform: translateX(-2px); }
        40% { transform: translateX(2px); }
        60% { transform: translateX(-1px); }
        80% { transform: translateX(1px); }
      }

      @keyframes shakeMedium {
        0%, 100% { transform: translate(0, 0); }
        10% { transform: translate(-4px, -2px); }
        20% { transform: translate(3px, 1px); }
        30% { transform: translate(-3px, -1px); }
        40% { transform: translate(4px, 2px); }
        50% { transform: translate(-2px, -1px); }
        60% { transform: translate(2px, 1px); }
        70% { transform: translate(-1px, 0); }
        80% { transform: translate(1px, 0); }
      }

      @keyframes shakeHeavy {
        0%, 100% { transform: translate(0, 0) rotate(0deg); }
        5% { transform: translate(-8px, -3px) rotate(-0.5deg); }
        10% { transform: translate(6px, 2px) rotate(0.5deg); }
        15% { transform: translate(-6px, -4px) rotate(-0.3deg); }
        20% { transform: translate(8px, 3px) rotate(0.3deg); }
        25% { transform: translate(-5px, -2px) rotate(-0.2deg); }
        30% { transform: translate(5px, 1px) rotate(0.2deg); }
        40% { transform: translate(-3px, -1px) rotate(-0.1deg); }
        50% { transform: translate(3px, 1px) rotate(0.1deg); }
        60% { transform: translate(-2px, 0); }
        70% { transform: translate(2px, 0); }
        80% { transform: translate(-1px, 0); }
      }

      /* ── Slot Snap ── */
      @keyframes snapFlash {
        0% { opacity: 0.6; }
        100% { opacity: 0; }
      }

      @keyframes sparkBurst {
        0% { transform: scale(1); opacity: 1; }
        50% { transform: scale(2.5); opacity: 0.8; }
        100% { transform: scale(0); opacity: 0; }
      }

      @keyframes slotRipple {
        0% { transform: scale(1); opacity: 0.8; }
        100% { transform: scale(1.15); opacity: 0; }
      }

      .slot-snap-active {
        animation: slotBounce 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
      }

      @keyframes slotBounce {
        0% { transform: scale(0.92); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
      }

      /* ── Gauge Effects ── */
      @keyframes gaugePulse {
        0%, 100% { opacity: 0.5; border-color: rgba(239, 68, 68, 0.3); }
        50% { opacity: 1; border-color: rgba(239, 68, 68, 0.8); }
      }

      @keyframes gaugeGlow {
        0%, 100% { opacity: 0.3; }
        50% { opacity: 0.7; }
      }

      .gauge-danger {
        animation: gaugeDangerShake 0.3s ease-out;
      }

      @keyframes gaugeDangerShake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-2px); }
        75% { transform: translateX(2px); }
      }

      /* ── Deploy Animations ── */
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      @keyframes typeIn {
        from { opacity: 0; transform: translateX(-4px); }
        to { opacity: 1; transform: translateX(0); }
      }

      @keyframes deployResultIn {
        from { opacity: 0; transform: scale(0.8) translateY(20px); }
        to { opacity: 1; transform: scale(1) translateY(0); }
      }

      @keyframes successIcon {
        from { opacity: 0; transform: scale(0) rotate(-30deg); }
        to { opacity: 1; transform: scale(1) rotate(0deg); }
      }

      @keyframes fadeSlideUp {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }

      @keyframes progressFill {
        from { width: 0%; }
        to { width: 100%; }
      }

      @keyframes successGlow {
        0% { opacity: 0; }
        30% { opacity: 1; }
        100% { opacity: 0.3; }
      }

      @keyframes particleFly {
        0% {
          transform: translate(0, 0) scale(1);
          opacity: 1;
        }
        100% {
          transform: translate(
            calc((var(--random, 0.5) - 0.5) * 300px),
            calc((var(--random, 0.5) - 0.5) * 300px)
          ) scale(0);
          opacity: 0;
        }
      }

      @keyframes failIcon {
        0% { transform: scale(2); opacity: 0; }
        30% { transform: scale(0.8); opacity: 1; }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); }
      }

      @keyframes shakeIn {
        0% { transform: translateX(-10px); opacity: 0; }
        20% { transform: translateX(8px); }
        40% { transform: translateX(-6px); }
        60% { transform: translateX(4px); }
        80% { transform: translateX(-2px); }
        100% { transform: translateX(0); opacity: 1; }
      }

      @keyframes errorFlash {
        0%, 100% { opacity: 0; }
        50% { opacity: 0.3; }
      }

      @keyframes errorScanline {
        0%, 100% { opacity: 0.3; transform: scaleX(1); }
        50% { opacity: 0.8; transform: scaleX(1.02); }
      }

      /* ── Particle custom properties ── */
      ${Array.from({ length: 40 }).map((_, i) =>
        `.absolute:nth-child(${i + 1}) { --random: ${Math.random().toFixed(3)}; }`
      ).join('\n')}
    `}</style>
  );
}

// ─── USAGE EXAMPLE ───────────────────────────────────────────────────
/*
  // In your existing IntegratorStation.jsx:

  import {
    IntegratorEffectsProvider,
    IntegratorEffectsStyles,
    SlotSnapEffect,
    GaugeDangerEffect,
    useIntegratorEffects
  } from './IntegratorEffects';

  function IntegratorStation() {
    return (
      <IntegratorEffectsProvider>
        <IntegratorEffectsStyles />
        <IntegratorContent />
      </IntegratorEffectsProvider>
    );
  }

  function IntegratorContent() {
    const { triggerSlotSnap, triggerScreenShake, triggerDeploy, slotSnap } = useIntegratorEffects();

    // When a component is placed in a slot:
    const handleDrop = (slotId, component) => {
      triggerSlotSnap(slotId);
      // ... existing logic
    };

    // When gauges go red:
    const handleGaugeUpdate = (gaugeId, value) => {
      if (value > 80) triggerScreenShake('medium');
      // ... existing logic
    };

    // When deploy button is clicked:
    const handleDeploy = (isCorrect) => {
      triggerDeploy(isCorrect);
    };

    return (
      <div>
        {slots.map(slot => (
          <SlotSnapEffect key={slot.id} active={slotSnap === slot.id}>
            <SlotComponent ... />
          </SlotSnapEffect>
        ))}

        {gauges.map(gauge => (
          <GaugeDangerEffect key={gauge.id} value={gauge.value}>
            <GaugeComponent ... />
          </GaugeDangerEffect>
        ))}
      </div>
    );
  }
*/
