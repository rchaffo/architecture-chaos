// ClientDirectorStation.jsx — Client Director (Phase 2)
// Architecture Chaos — Fase 2
// Two phases: Office Investigation (60s) + Crisis Meeting
// Requiere: React, Zustand (gameStore), Socket.io

import { useState, useEffect, useCallback, useRef } from 'react';

// Import dialogue data (in production, import from ./clientDialogues.json)
// For now, embedded inline for portability
const CLIENT_PROFILES = {
  "director-agresivo": {
    id: "director-agresivo",
    name: "Ricardo Mendoza",
    title: "Director de Operaciones — Banco Continental",
    personality: "Agresivo, orientado a resultados, sin paciencia",
    avatar: "👔",
    officeClues: {
      trofeos: {
        icon: "🏆", label: "Trofeos y Placas",
        x: 8, y: 15,
        description: "Trofeos de 'Mejor Rendimiento' 2019-2024. Placa: '15 años de relación con el banco'.",
        intel: { key: "loyalty", value: "15 años — lealtad alta" }
      },
      organigrama: {
        icon: "📋", label: "Organigrama",
        x: 35, y: 8,
        description: "Reporta directamente al CEO. Nota adhesiva: 'Board meeting viernes'.",
        intel: { key: "pressure", value: "Reporta al CEO — presión extrema" }
      },
      documentos: {
        icon: "📄", label: "Documentos",
        x: 55, y: 50,
        description: "Informe de auditoría SOX abierto. Área señalada: Pagos Internacionales.",
        intel: { key: "audit", value: "Auditoría SOX — Pagos Internacionales" }
      },
      celular: {
        icon: "📱", label: "Celular",
        x: 70, y: 55,
        description: "23 llamadas perdidas en las últimas 2 horas. 8 mensajes sin leer del equipo de TI.",
        intel: { key: "urgency", value: "23 llamadas — urgencia CRÍTICA" }
      },
      computador: {
        icon: "🖥️", label: "Computador",
        x: 80, y: 30,
        description: "Dashboard de SWIFT con transacciones en cola. Error: 'Gateway Timeout'.",
        intel: { key: "system", value: "SWIFT Gateway — Payment Execution" }
      }
    },
    openingLine: "Llevamos 3 horas con los pagos internacionales caídos. Tengo al CEO encima y una auditoría SOX la próxima semana. Necesito una solución YA, no excusas.",
    responses: {
      full: [
        { text: "Señor Mendoza, entiendo la presión del board del viernes y la auditoría SOX. Ya identificamos que el Service Domain de Payment Execution tiene un timeout en el gateway SWIFT. Estamos activando el canal de contingencia — en 45 minutos tendremos trazabilidad completa para la auditoría.", correct: true, panicDelta: -25, feedback: "Perfecto. Demuestra conocimiento del perfil, usa terminología BIAN correcta, da timeline concreto y aborda la auditoría." },
        { text: "Estamos trabajando en ello. El equipo de TI está investigando el problema y le avisaremos cuando tengamos algo.", correct: false, panicDelta: 20, feedback: "Demasiado vago. Este perfil necesita respuestas concretas y timeline específico." },
        { text: "Hemos detectado un fallo en el módulo de pagos. Podríamos tener una solución en 24-48 horas.", correct: false, panicDelta: 30, feedback: "El timeline de 48 horas es inaceptable para un cliente con auditoría SOX inminente." }
      ],
      partial: [
        { text: "Señor Mendoza, entendemos la urgencia. Nuestro equipo ya está sobre el incidente de pagos internacionales. Déjeme confirmar los detalles del impacto para darle un timeline preciso.", correct: true, panicDelta: -10, feedback: "Bueno. Reconoce la urgencia y pide detalles sin prometer en falso." },
        { text: "Vamos a revisar qué está pasando con el sistema de pagos. Le pido paciencia mientras investigamos.", correct: false, panicDelta: 15, feedback: "Pedir paciencia a este perfil es contraproducente." }
      ],
      none: [
        { text: "Cuénteme los detalles del problema. ¿Desde cuándo está ocurriendo y qué sistemas están afectados?", correct: true, panicDelta: 5, feedback: "Es lo único disponible sin información previa, pero este perfil esperaba que ya supieras." },
        { text: "Buenos días, ¿en qué puedo ayudarle?", correct: false, panicDelta: 25, feedback: "Totalmente desconectado del contexto de crisis." }
      ]
    }
  },
  "directora-analitica": {
    id: "directora-analitica",
    name: "Carmen Herrera",
    title: "Gerente de Riesgos — Banco Nacional",
    personality: "Analítica, metódica, necesita datos",
    avatar: "👩‍💼",
    officeClues: {
      trofeos: {
        icon: "🏆", label: "Certificaciones",
        x: 8, y: 15,
        description: "Certificados ISO 27001, ISO 31000. Placa: '8 años como cliente preferente'.",
        intel: { key: "loyalty", value: "8 años — orientada a estándares" }
      },
      organigrama: {
        icon: "📋", label: "Organigrama",
        x: 35, y: 8,
        description: "Reporta al Chief Risk Officer. Su área tiene 45 personas.",
        intel: { key: "pressure", value: "Reporta al CRO — necesita métricas" }
      },
      documentos: {
        icon: "📄", label: "Documentos",
        x: 55, y: 50,
        description: "Matriz de Riesgo Operacional Q4. Resaltado: scoring de disponibilidad del core.",
        intel: { key: "audit", value: "Riesgo Operacional — Disponibilidad Core" }
      },
      celular: {
        icon: "📱", label: "Celular",
        x: 70, y: 55,
        description: "5 llamadas. Mensaje: 'Carmen, necesito el RCA antes del jueves'.",
        intel: { key: "urgency", value: "Necesita RCA — deadline jueves" }
      },
      computador: {
        icon: "🖥️", label: "Computador",
        x: 80, y: 30,
        description: "Grafana con latencia del core: 12,000ms. Alertas en rojo.",
        intel: { key: "system", value: "Core Bancario — System Administration" }
      }
    },
    openingLine: "La latencia del core lleva 6 horas por encima de los 12 segundos. Necesito el Root Cause Analysis con datos concretos. ¿Tienen métricas o estamos adivinando?",
    responses: {
      full: [
        { text: "Doctora Herrera, tenemos las métricas de Grafana identificadas. El Service Domain de System Administration muestra degradación en el Functional Pattern Operate. Le preparo el RCA formal con timeline de 3 puntos: causa, mitigación inmediata y plan correctivo para el jueves.", correct: true, panicDelta: -25, feedback: "Excelente. Habla en datos, usa terminología BIAN, respeta el deadline." },
        { text: "No se preocupe, ya estamos resolviendo el tema de la latencia. Todo estará bien pronto.", correct: false, panicDelta: 25, feedback: "'No se preocupe' es la peor respuesta para una analista que necesita datos." },
        { text: "Hemos reiniciado los servidores y la latencia bajó temporalmente. Seguimos monitoreando.", correct: false, panicDelta: 15, feedback: "Reiniciar sin RCA es un parche. Necesita la causa raíz." }
      ],
      partial: [
        { text: "Doctora Herrera, hemos identificado anomalías en el core bancario. Estamos recopilando las métricas de latencia para construir el RCA. ¿Puede compartirnos los umbrales de su matriz de riesgo?", correct: true, panicDelta: -10, feedback: "Bien. Muestra proceso analítico." },
        { text: "Estamos investigando la causa. Le enviaremos un reporte.", correct: false, panicDelta: 10, feedback: "Demasiado pasivo para alguien con deadline del jueves." }
      ],
      none: [
        { text: "Necesito entender el alcance. ¿Puede mostrarme los dashboards actuales y los SLAs comprometidos?", correct: true, panicDelta: 5, feedback: "Correcto — pide datos técnicos como ella espera." },
        { text: "Déjeme revisar qué está pasando y le llamo en una hora.", correct: false, panicDelta: 20, feedback: "Inaceptable. Ella tiene datos y espera que tú llegues preparado." }
      ]
    }
  },
  "gerente-politico": {
    id: "gerente-politico",
    name: "Fernando Castillo",
    title: "Subgerente General — Cooperativa Financiera del Sur",
    personality: "Político, diplomático, preocupado por imagen",
    avatar: "🤵",
    officeClues: {
      trofeos: {
        icon: "🏆", label: "Fotos y Premios",
        x: 8, y: 15,
        description: "Fotos con políticos y empresarios. Premio 'Cooperativa del Año 2022'.",
        intel: { key: "loyalty", value: "4 años — perfil público" }
      },
      organigrama: {
        icon: "📋", label: "Organigrama",
        x: 35, y: 8,
        description: "Directorio de 9 personas. Post-it: 'Asamblea de socios en 15 días'.",
        intel: { key: "pressure", value: "Directorio 9 miembros — asamblea en 15 días" }
      },
      documentos: {
        icon: "📄", label: "Carta de Reclamo",
        x: 55, y: 50,
        description: "Reclamo de socio mayoritario sobre la app móvil: 'experiencia inaceptable'.",
        intel: { key: "audit", value: "Reclamo socio — App Móvil" }
      },
      celular: {
        icon: "📱", label: "WhatsApp",
        x: 70, y: 55,
        description: "WhatsApp del presidente del directorio: 'Fernando, resuelve esto antes de la asamblea'.",
        intel: { key: "urgency", value: "Presidente presiona — deadline político" }
      },
      computador: {
        icon: "🖥️", label: "App Móvil",
        x: 80, y: 30,
        description: "App móvil con error 500 en transferencias. Review de 1 estrella visible.",
        intel: { key: "system", value: "App Móvil — Channel Activity Management" }
      }
    },
    openingLine: "Los socios están furiosos con la app. Tengo una asamblea en 15 días y el presidente del directorio me está presionando. Necesito algo que yo pueda presentar como avance.",
    responses: {
      full: [
        { text: "Don Fernando, entiendo la presión de la asamblea y del directorio. Solucionamos el error del Channel Activity Management esta semana, y le preparamos un informe ejecutivo que muestre el plan de mejora. Así tiene una narrativa concreta para los socios.", correct: true, panicDelta: -25, feedback: "Entiende que necesita un 'entregable político' además de la solución técnica." },
        { text: "El error 500 en la app es un bug del backend. Lo corregiremos en el próximo sprint.", correct: false, panicDelta: 15, feedback: "Demasiado técnico. No le da lo que necesita para la asamblea." },
        { text: "Deberían haber actualizado la app cuando se lo recomendamos hace 6 meses.", correct: false, panicDelta: 30, feedback: "Culpar al cliente es la peor estrategia con un perfil político." }
      ],
      partial: [
        { text: "Don Fernando, estamos al tanto del problema con la app. Le propongo definir qué necesita presentar en la asamblea y alineamos la solución con ese timeline.", correct: true, panicDelta: -10, feedback: "Se enfoca en lo que importa: la narrativa para el directorio." },
        { text: "Vamos a revisar el problema técnico y le damos un diagnóstico.", correct: false, panicDelta: 10, feedback: "No aborda su preocupación real." }
      ],
      none: [
        { text: "Cuénteme más. ¿Qué es lo más importante que necesita resolver primero?", correct: true, panicDelta: 5, feedback: "Pregunta abierta que permite al cliente revelar su prioridad real." },
        { text: "Necesitamos un ticket formal para empezar a investigar.", correct: false, panicDelta: 20, feedback: "Pedir burocracia en crisis política es desconectarse." }
      ]
    }
  },
  "cto-tecnico": {
    id: "cto-tecnico",
    name: "Alejandra Vega",
    title: "CTO — Fintech Rápida",
    personality: "Técnica, directa, habla en código",
    avatar: "👩‍💻",
    officeClues: {
      trofeos: {
        icon: "🏆", label: "Hackathon Trophies",
        x: 8, y: 15,
        description: "Hackathon trophies y certificaciones AWS/GCP. Sticker: 'Move fast and break things'.",
        intel: { key: "loyalty", value: "2 años — evalúa alternativas" }
      },
      organigrama: {
        icon: "📋", label: "Org Flat",
        x: 35, y: 8,
        description: "Organigrama flat — 3 niveles. Reporta a los founders.",
        intel: { key: "pressure", value: "Startup — velocidad es la métrica" }
      },
      documentos: {
        icon: "📄", label: "Evaluación Proveedores",
        x: 55, y: 50,
        description: "Documento: 'Evaluación de proveedores API - Q1'. Tu empresa está en amarillo.",
        intel: { key: "audit", value: "Evaluando competidores — riesgo de churn" }
      },
      celular: {
        icon: "📱", label: "Slack",
        x: 70, y: 55,
        description: "Slack con canal #infra: 200 mensajes no leídos. Status: 🔥.",
        intel: { key: "urgency", value: "Slack > Teléfono — canal digital" }
      },
      computador: {
        icon: "🖥️", label: "Terminal",
        x: 80, y: 30,
        description: "curl commands fallando. Error: 'API Rate Limit Exceeded — Product Directory'.",
        intel: { key: "system", value: "API Gateway — Product Directory" }
      }
    },
    openingLine: "Su API de Product Directory nos está tirando rate limits desde las 3am. Estamos evaluando migrar a otro proveedor. Necesito saber si pueden escalar o no — sin vueltas.",
    responses: {
      full: [
        { text: "Alejandra, revisé los logs — el rate limit del Product Directory se disparó por un cambio en el burst policy de las 2am. Estoy escalando el throughput del API Gateway y te mando el nuevo rate limit por Slack en 20 minutos. También quiero revisar tu evaluación de proveedores — podemos ofrecerte un tier dedicado.", correct: true, panicDelta: -25, feedback: "Habla su idioma técnico, conoce el problema, responde por su canal, aborda el riesgo de churn." },
        { text: "Lamentamos las molestias. Nuestro equipo de soporte está revisando su caso y le enviaremos una actualización por email.", correct: false, panicDelta: 30, feedback: "Respuesta corporate que una CTO de fintech detesta." },
        { text: "Los rate limits están según el contrato. Podemos revisar un upgrade de plan.", correct: false, panicDelta: 20, feedback: "Esconderse detrás del contrato cuando evalúa competidores es suicidio comercial." }
      ],
      partial: [
        { text: "Alejandra, estoy viendo los rate limits del API Gateway. Dame 15 minutos para verificar qué cambió en el burst policy. ¿Slack o aquí?", correct: true, panicDelta: -10, feedback: "Habla técnico, da timeline corto, pregunta canal preferido." },
        { text: "Vamos a abrir un ticket con infraestructura para revisar los rate limits.", correct: false, panicDelta: 15, feedback: "Demasiado lento y burocrático." }
      ],
      none: [
        { text: "Pásame los logs del error y el endpoint afectado. Lo reviso directo.", correct: true, panicDelta: 5, feedback: "Sin contexto, pedir logs técnicos es lo correcto." },
        { text: "¿Puede enviarme un email describiendo el problema?", correct: false, panicDelta: 25, feedback: "Pedir email a una CTO de fintech en crisis = desconexión total." }
      ]
    }
  },
  "compliance-officer": {
    id: "compliance-officer",
    name: "Eduardo Paredes",
    title: "CCO — Banco de Inversiones Pacífico",
    personality: "Cauteloso, normativo, cada palabra tiene peso legal",
    avatar: "⚖️",
    officeClues: {
      trofeos: {
        icon: "🏆", label: "Diplomas",
        x: 8, y: 15,
        description: "Diplomas de Derecho y MBA. Certificación CAMS (Anti-lavado). '12 años de relación'.",
        intel: { key: "loyalty", value: "12 años — cada promesa es contractual" }
      },
      organigrama: {
        icon: "📋", label: "Board Compliance",
        x: 35, y: 8,
        description: "Reporta al Board de Compliance. 'Revisión regulatoria SBS próximo mes'.",
        intel: { key: "pressure", value: "Board + SBS — presión regulatoria" }
      },
      documentos: {
        icon: "📄", label: "Circular SBS",
        x: 55, y: 50,
        description: "Circular SBS sobre operaciones sospechosas. Post-it: 'Plazo: 30 días'.",
        intel: { key: "audit", value: "SBS — AML/KYC — 30 días" }
      },
      celular: {
        icon: "📱", label: "Llamadas Regulador",
        x: 70, y: 55,
        description: "2 llamadas del regulador. Email: 'Requerimiento de información — plazo perentorio'.",
        intel: { key: "urgency", value: "Regulador contactó directamente — riesgo sanción" }
      },
      computador: {
        icon: "🖥️", label: "Sistema AML",
        x: 80, y: 30,
        description: "Monitoreo de transacciones con 847 alertas AML sin procesar.",
        intel: { key: "system", value: "Sistema AML — Compliance Reporting" }
      }
    },
    openingLine: "El sistema de monitoreo AML tiene 847 alertas sin procesar y la SBS nos pidió un reporte en 30 días. Si no cumplimos, la sanción es millonaria. Necesito que me garanticen que el sistema va a funcionar.",
    responses: {
      full: [
        { text: "Doctor Paredes, entiendo la criticidad del requerimiento de la SBS. Plan: primero, estabilizamos el Service Domain de Compliance Reporting para procesar las 847 alertas esta semana. Segundo, activamos Financial Transaction Analysis para filtrado automático. Le entrego un informe documentado para su archivo regulatorio. No le digo 'garantía' — le digo plan concreto con evidencia auditable.", correct: true, panicDelta: -25, feedback: "No promete garantías (que un abogado rechazaría), ofrece plan auditable." },
        { text: "Le garantizo que todo estará resuelto antes del plazo de la SBS.", correct: false, panicDelta: 15, feedback: "Un compliance officer sabe que las garantías verbales no tienen valor legal." },
        { text: "Podemos procesar las alertas manualmente mientras arreglamos el sistema.", correct: false, panicDelta: 20, feedback: "847 alertas manuales implican error humano — inaceptable para compliance." }
      ],
      partial: [
        { text: "Doctor Paredes, conozco la presión regulatoria. Necesito revisar el estado del sistema AML para darle un plan documentado y trazable. ¿Puede darme acceso a los logs?", correct: true, panicDelta: -10, feedback: "Pide datos y habla de documentación y trazabilidad." },
        { text: "Vamos a asignar más recursos al problema.", correct: false, panicDelta: 10, feedback: "Vago. Necesita plan, no promesas de recursos." }
      ],
      none: [
        { text: "Necesito entender el requerimiento regulatorio exacto. ¿Tiene el oficio de la SBS para dimensionar el alcance?", correct: true, panicDelta: 5, feedback: "Pide el documento regulatorio — demuestra contexto legal." },
        { text: "No se preocupe, estos temas se resuelven siempre a tiempo.", correct: false, panicDelta: 30, feedback: "Minimizar riesgo regulatorio frente a un compliance officer = peor señal." }
      ]
    }
  }
};

// ─── OFFICE SVG — CINEMATIC VERSION ──────────────────────────────────
const OfficeSVG = ({ clues, discoveredKeys, onClueClick, activeClueKey }) => {
  const clueHitArea = (key, x, y, w, h) => {
    const isDiscovered = discoveredKeys.includes(key);
    const isActive = activeClueKey === key;
    return (
      <g key={`hit-${key}`} onClick={() => onClueClick(key)} className="cursor-pointer">
        <rect x={x} y={y} width={w} height={h} fill="transparent" />
        {/* Subtle glow for undiscovered */}
        {!isDiscovered && (
          <rect x={x - 3} y={y - 3} width={w + 6} height={h + 6} rx="4" fill="#f59e0b" opacity="0.06">
            <animate attributeName="opacity" values="0.04;0.1;0.04" dur="2.5s" repeatCount="indefinite" />
          </rect>
        )}
        {/* Active selection ring */}
        {isActive && (
          <rect x={x - 4} y={y - 4} width={w + 8} height={h + 8} rx="5" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="5 3" opacity="0.9">
            <animate attributeName="stroke-dashoffset" values="0;16" dur="1.2s" repeatCount="indefinite" />
          </rect>
        )}
        {/* Discovered dim overlay */}
        {isDiscovered && (
          <rect x={x} y={y} width={w} height={h} rx="3" fill="#09090b" opacity="0.4" />
        )}
      </g>
    );
  };

  return (
    <svg viewBox="0 0 800 520" className="w-full h-full" style={{ filter: 'drop-shadow(0 0 40px rgba(251,191,36,0.04))' }}>
      <defs>
        {/* Gradients */}
        <linearGradient id="off-bg" x1="0" y1="0" x2="0.2" y2="1">
          <stop offset="0%" stopColor="#1a1814" />
          <stop offset="100%" stopColor="#0a0908" />
        </linearGradient>
        <linearGradient id="wall-main" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#21201d" />
          <stop offset="100%" stopColor="#17160f" />
        </linearGradient>
        <linearGradient id="wall-side" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#141310" />
          <stop offset="100%" stopColor="#1c1b16" />
        </linearGradient>
        <linearGradient id="desk-top" x1="0" y1="0" x2="1" y2="0.3">
          <stop offset="0%" stopColor="#3d3428" />
          <stop offset="30%" stopColor="#4a3f30" />
          <stop offset="60%" stopColor="#3d3428" />
          <stop offset="100%" stopColor="#302920" />
        </linearGradient>
        <linearGradient id="desk-front" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#352e22" />
          <stop offset="100%" stopColor="#231e16" />
        </linearGradient>
        <linearGradient id="win-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a2d4a" />
          <stop offset="40%" stopColor="#0f1f36" />
          <stop offset="100%" stopColor="#0a1525" />
        </linearGradient>
        <linearGradient id="lamp-light" x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="lamp-glow" cx="50%" cy="30%" r="60%">
          <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="leather-chair" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2a2520" />
          <stop offset="50%" stopColor="#1e1a15" />
          <stop offset="100%" stopColor="#161310" />
        </linearGradient>
        <linearGradient id="shelf-wood" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#352e24" />
          <stop offset="100%" stopColor="#251f18" />
        </linearGradient>
        <filter id="soft-shadow">
          <feGaussianBlur in="SourceAlpha" stdDeviation="4" />
          <feOffset dx="2" dy="4" />
          <feComposite in2="SourceAlpha" operator="out" />
          <feFlood floodColor="#000" floodOpacity="0.35" />
          <feComposite in2="SourceAlpha" operator="in" />
          <feComposite in="SourceGraphic" />
        </filter>
        <filter id="screen-glow">
          <feGaussianBlur stdDeviation="2" />
          <feComposite in="SourceGraphic" />
        </filter>
        {/* Wood grain pattern */}
        <pattern id="wood-grain" x="0" y="0" width="200" height="8" patternUnits="userSpaceOnUse">
          <line x1="0" y1="2" x2="200" y2="2.5" stroke="#4a3f30" strokeWidth="0.3" opacity="0.3" />
          <line x1="0" y1="5" x2="200" y2="4.8" stroke="#3d3428" strokeWidth="0.2" opacity="0.2" />
        </pattern>
        {/* Floor pattern */}
        <pattern id="floor-tile" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse" patternTransform="skewY(-3)">
          <rect width="60" height="60" fill="#131210" />
          <rect width="29" height="29" fill="#16140f" />
          <rect x="31" y="31" width="29" height="29" fill="#16140f" />
        </pattern>
      </defs>

      {/* ═══ ROOM STRUCTURE ═══ */}
      <rect width="800" height="520" fill="url(#off-bg)" />

      {/* Floor with tile pattern */}
      <rect x="0" y="340" width="800" height="180" fill="url(#floor-tile)" opacity="0.7" />
      {/* Floor shadow gradient */}
      <rect x="0" y="340" width="800" height="40" fill="url(#off-bg)" opacity="0.6" />

      {/* Back wall */}
      <rect x="20" y="15" width="760" height="330" fill="url(#wall-main)" />
      {/* Wall panel molding lines */}
      <line x1="25" y1="20" x2="775" y2="20" stroke="#2a2720" strokeWidth="1" />
      <line x1="25" y1="340" x2="775" y2="340" stroke="#2a2720" strokeWidth="1.5" />
      {/* Baseboard */}
      <rect x="20" y="335" width="760" height="10" fill="#1e1c16" />
      <line x1="20" y1="335" x2="780" y2="335" stroke="#2e2a22" strokeWidth="0.5" />

      {/* ═══ WINDOW — panoramic ═══ */}
      <g>
        {/* Window frame outer */}
        <rect x="250" y="30" width="300" height="175" fill="#1a1710" rx="2" stroke="#3a352a" strokeWidth="3" />
        {/* Window glass */}
        <rect x="256" y="36" width="288" height="163" fill="url(#win-sky)" rx="1" />
        {/* Window dividers */}
        <line x1="400" y1="36" x2="400" y2="199" stroke="#3a352a" strokeWidth="3" />
        <line x1="256" y1="120" x2="544" y2="120" stroke="#3a352a" strokeWidth="3" />
        {/* City skyline — layered depth */}
        {/* Far buildings */}
        {[270, 295, 330, 365, 395, 430, 460, 490, 515].map((bx, i) => (
          <rect key={`far-${i}`} x={bx} y={135 - (i % 4) * 12 - (i % 3) * 8} width={12 + (i % 3) * 8} height={64 + (i % 4) * 12 + (i % 3) * 8} fill="#0d1a2e" opacity="0.6" />
        ))}
        {/* Near buildings */}
        {[275, 310, 350, 410, 450, 500, 520].map((bx, i) => (
          <rect key={`near-${i}`} x={bx} y={155 - (i % 3) * 20 - (i % 2) * 15} width={18 + (i % 4) * 10} height={44 + (i % 3) * 20 + (i % 2) * 15} fill="#0a1322" opacity="0.8" />
        ))}
        {/* Building windows (lit) */}
        {Array.from({ length: 45 }).map((_, i) => {
          const bx = 268 + (i * 6.3) % 270;
          const by = 130 + (i * 7.7) % 55;
          const lit = (i * 7 + 3) % 5 !== 0;
          return lit ? (
            <rect key={`wlight-${i}`} x={bx} y={by} width="3" height="2.5" fill="#fbbf24" opacity={0.15 + (i % 4) * 0.1} rx="0.3" />
          ) : null;
        })}
        {/* Window reflection/glare */}
        <rect x="257" y="37" width="140" height="80" fill="#fff" opacity="0.015" />
        {/* Curtains */}
        <rect x="248" y="26" width="12" height="180" fill="#1e1c16" rx="1" opacity="0.7" />
        <rect x="540" y="26" width="12" height="180" fill="#1e1c16" rx="1" opacity="0.7" />
        {/* Curtain folds */}
        <line x1="251" y1="30" x2="251" y2="200" stroke="#27241e" strokeWidth="1" opacity="0.4" />
        <line x1="255" y1="30" x2="255" y2="200" stroke="#27241e" strokeWidth="0.5" opacity="0.3" />
        <line x1="543" y1="30" x2="543" y2="200" stroke="#27241e" strokeWidth="1" opacity="0.4" />
        <line x1="547" y1="30" x2="547" y2="200" stroke="#27241e" strokeWidth="0.5" opacity="0.3" />
        {/* Light rays from window */}
        <polygon points="256,199 200,380 340,380 544,199" fill="#c4a54a" opacity="0.015" />
      </g>

      {/* ═══ BOOKSHELF / TROPHY WALL (left) ═══ */}
      <g onClick={() => onClueClick('trofeos')} className="cursor-pointer">
        {/* Shelf structure */}
        <rect x="30" y="35" width="190" height="260" fill="url(#shelf-wood)" rx="4" stroke="#3a3528" strokeWidth="1.5" />
        {/* Shelf boards */}
        {[0, 1, 2, 3].map(i => (
          <g key={`sh-${i}`}>
            <rect x="34" y={100 + i * 52} width="182" height="4" fill="#4a4030" rx="1" />
            <rect x="34" y={104 + i * 52} width="182" height="1" fill="#221e16" opacity="0.5" />
          </g>
        ))}
        {/* Books row 1 */}
        {[
          { x: 38, w: 10, h: 42, c: '#7f1d1d' }, { x: 50, w: 8, h: 38, c: '#1e3a5f' },
          { x: 60, w: 12, h: 44, c: '#365314' }, { x: 74, w: 7, h: 36, c: '#4a1d7a' },
          { x: 83, w: 11, h: 40, c: '#713f12' }, { x: 96, w: 9, h: 43, c: '#1e3a5f' },
          { x: 107, w: 13, h: 38, c: '#7f1d1d' }, { x: 122, w: 8, h: 41, c: '#365314' }
        ].map((b, i) => (
          <rect key={`b1-${i}`} x={b.x} y={100 - b.h} width={b.w} height={b.h} fill={b.c} rx="1" opacity="0.55" />
        ))}
        {/* Trophy on shelf 1 */}
        <g transform="translate(155, 58)">
          <rect x="-8" y="30" width="16" height="4" fill="#b8860b" rx="1" />
          <rect x="-4" y="20" width="8" height="12" fill="#daa520" rx="1" />
          <circle cx="0" cy="16" r="7" fill="#ffd700" opacity="0.7" />
          <circle cx="0" cy="16" r="4" fill="#fbbf24" opacity="0.5" />
          <text x="0" y="19" textAnchor="middle" fill="#92400e" fontSize="5" fontWeight="bold">★</text>
        </g>
        {/* Trophy on shelf 2 */}
        <g transform="translate(180, 110)">
          <rect x="-6" y="28" width="12" height="3" fill="#b8860b" rx="1" />
          <rect x="-3" y="18" width="6" height="12" fill="#c0c0c0" rx="1" />
          <circle cx="0" cy="14" r="5" fill="#d4d4d8" opacity="0.6" />
        </g>
        {/* Plaque */}
        <rect x="38" y="115" width="80" height="25" fill="#292218" rx="2" stroke="#b8860b" strokeWidth="0.5" opacity="0.8" />
        <text x="78" y="129" textAnchor="middle" fill="#daa520" fontSize="5" fontFamily="serif" opacity="0.7">15 AÑOS</text>
        <text x="78" y="136" textAnchor="middle" fill="#b8860b" fontSize="4" fontFamily="serif" opacity="0.5">RELACIÓN BANCARIA</text>
        {/* More books row 3 */}
        {[
          { x: 38, w: 14, h: 36, c: '#713f12' }, { x: 54, w: 9, h: 40, c: '#4a1d7a' },
          { x: 65, w: 11, h: 34, c: '#1e3a5f' }, { x: 78, w: 8, h: 38, c: '#7f1d1d' },
          { x: 88, w: 12, h: 42, c: '#365314' }
        ].map((b, i) => (
          <rect key={`b3-${i}`} x={b.x} y={204 - b.h} width={b.w} height={b.h} fill={b.c} rx="1" opacity="0.45" />
        ))}
        {/* Framed photo on shelf */}
        <rect x="140" y="168" width="28" height="32" fill="#1a1710" rx="1" stroke="#4a4030" strokeWidth="1" />
        <rect x="143" y="171" width="22" height="22" fill="#1e2a3a" opacity="0.5" rx="0.5" />
      </g>
      {clueHitArea('trofeos', 30, 35, 190, 260)}

      {/* ═══ ORGANIGRAMA ON WALL ═══ */}
      <g onClick={() => onClueClick('organigrama')} className="cursor-pointer">
        {/* Frame */}
        <rect x="568" y="40" width="185" height="130" fill="#1a1710" rx="3" stroke="#3a352a" strokeWidth="2" />
        <rect x="574" y="46" width="173" height="118" fill="#f5f0e6" opacity="0.08" rx="1" />
        {/* Org chart content */}
        {/* CEO box */}
        <rect x="630" y="55" width="60" height="18" fill="#1e3a5f" opacity="0.5" rx="2" />
        <text x="660" y="67" textAnchor="middle" fill="#60a5fa" fontSize="6" fontFamily="monospace" opacity="0.7">CEO</text>
        {/* Lines down */}
        <line x1="660" y1="73" x2="660" y2="82" stroke="#3f3f46" strokeWidth="0.8" />
        <line x1="620" y1="82" x2="700" y2="82" stroke="#3f3f46" strokeWidth="0.8" />
        <line x1="620" y1="82" x2="620" y2="90" stroke="#3f3f46" strokeWidth="0.8" />
        <line x1="660" y1="82" x2="660" y2="90" stroke="#3f3f46" strokeWidth="0.8" />
        <line x1="700" y1="82" x2="700" y2="90" stroke="#3f3f46" strokeWidth="0.8" />
        {/* VP boxes */}
        <rect x="600" y="90" width="40" height="14" fill="#1e3a5f" opacity="0.3" rx="1.5" />
        <rect x="640" y="90" width="40" height="14" fill="#1e3a5f" opacity="0.3" rx="1.5" />
        <rect x="680" y="90" width="40" height="14" fill="#1e3a5f" opacity="0.3" rx="1.5" />
        <text x="620" y="100" textAnchor="middle" fill="#94a3b8" fontSize="4.5" fontFamily="monospace">VP OPS</text>
        <text x="660" y="100" textAnchor="middle" fill="#94a3b8" fontSize="4.5" fontFamily="monospace">VP FIN</text>
        <text x="700" y="100" textAnchor="middle" fill="#94a3b8" fontSize="4.5" fontFamily="monospace">VP TEC</text>
        {/* More subordinate boxes */}
        {[605, 625, 645, 665, 685, 705].map((bx, i) => (
          <rect key={`org-${i}`} x={bx} y="115" width="16" height="10" fill="#27272a" opacity="0.4" rx="1" />
        ))}
        {/* Post-it on frame */}
        <rect x="730" y="58" width="30" height="28" fill="#fbbf24" opacity="0.65" rx="1" transform="rotate(5, 745, 72)" />
        <text x="745" y="70" textAnchor="middle" fill="#1a1710" fontSize="4" fontFamily="monospace" transform="rotate(5, 745, 72)">Board</text>
        <text x="745" y="77" textAnchor="middle" fill="#92400e" fontSize="3.5" fontFamily="monospace" fontWeight="bold" transform="rotate(5, 745, 72)">VIERNES</text>
      </g>
      {clueHitArea('organigrama', 568, 40, 195, 130)}

      {/* ═══ EXECUTIVE DESK ═══ */}
      <g>
        {/* Desk shadow on floor */}
        <ellipse cx="420" cy="395" rx="260" ry="15" fill="#000" opacity="0.3" />
        {/* Desk top surface — perspective trapezoid */}
        <polygon points="140,290 680,290 710,310 110,310" fill="url(#desk-top)" stroke="#4a4030" strokeWidth="1" />
        {/* Wood grain overlay */}
        <polygon points="142,291 678,291 708,309 112,309" fill="url(#wood-grain)" opacity="0.3" />
        {/* Desk front panel */}
        <rect x="110" y="310" width="600" height="60" fill="url(#desk-front)" rx="2" />
        <line x1="115" y1="312" x2="705" y2="312" stroke="#4a4030" strokeWidth="0.5" opacity="0.3" />
        {/* Desk drawers */}
        <rect x="130" y="318" width="100" height="45" fill="#251f16" rx="2" stroke="#3a3428" strokeWidth="0.5" />
        <ellipse cx="180" cy="340" rx="8" ry="3" fill="#b8860b" opacity="0.4" />
        <rect x="590" y="318" width="100" height="45" fill="#251f16" rx="2" stroke="#3a3428" strokeWidth="0.5" />
        <ellipse cx="640" cy="340" rx="8" ry="3" fill="#b8860b" opacity="0.4" />
        {/* Desk legs */}
        <rect x="115" y="370" width="8" height="30" fill="#231e16" />
        <rect x="697" y="370" width="8" height="30" fill="#231e16" />
      </g>

      {/* ═══ DESK LAMP ═══ */}
      <g>
        {/* Lamp glow on desk */}
        <ellipse cx="200" cy="292" rx="80" ry="20" fill="url(#lamp-glow)" />
        {/* Lamp base */}
        <ellipse cx="195" cy="290" rx="18" ry="5" fill="#3a352a" />
        {/* Lamp stem */}
        <line x1="195" y1="285" x2="185" y2="245" stroke="#52504a" strokeWidth="3" strokeLinecap="round" />
        <line x1="185" y1="245" x2="210" y2="250" stroke="#52504a" strokeWidth="3" strokeLinecap="round" />
        {/* Lamp shade */}
        <polygon points="195,242 225,255 210,258 180,248" fill="#44403c" />
        <polygon points="197,243 223,254 210,256 182,247" fill="#52504a" />
        {/* Light cone */}
        <polygon points="210,256 170,300 260,305" fill="url(#lamp-light)" opacity="0.6" />
        {/* Warm light spot on desk */}
        <ellipse cx="215" cy="297" rx="50" ry="8" fill="#fbbf24" opacity="0.04" />
      </g>

      {/* ═══ DOCUMENTS ON DESK (clickeable) ═══ */}
      <g onClick={() => onClueClick('documentos')} className="cursor-pointer">
        {/* Stack of papers */}
        <rect x="320" y="272" width="70" height="28" fill="#e8e0d0" opacity="0.12" rx="1" transform="rotate(-8, 355, 286)" />
        <rect x="322" y="270" width="70" height="28" fill="#e8e0d0" opacity="0.15" rx="1" transform="rotate(-5, 357, 284)" />
        <rect x="325" y="268" width="70" height="28" fill="#e8e0d0" opacity="0.18" rx="1" transform="rotate(-2, 360, 282)" />
        {/* Text lines on top paper */}
        {[275, 279, 283, 287].map((ly, i) => (
          <line key={`dl-${i}`} x1="332" y1={ly} x2={370 - i * 5} y2={ly} stroke="#44403c" strokeWidth="0.5" opacity="0.3" transform="rotate(-2, 360, 282)" />
        ))}
        {/* Red marking */}
        <circle cx="375" cy="280" r="6" fill="none" stroke="#ef4444" strokeWidth="0.8" opacity="0.5" transform="rotate(-2, 360, 282)" />
        {/* Pen next to papers */}
        <rect x="400" y="276" width="40" height="3" fill="#1e3a5f" rx="1" transform="rotate(15, 420, 277)" />
        <rect x="398" y="276" width="4" height="3" fill="#c0c0c0" rx="0.5" transform="rotate(15, 420, 277)" />
      </g>
      {clueHitArea('documentos', 315, 262, 130, 40)}

      {/* ═══ CELULAR ON DESK (clickeable) ═══ */}
      <g onClick={() => onClueClick('celular')} className="cursor-pointer">
        {/* Phone body */}
        <rect x="470" y="272" width="32" height="24" fill="#09090b" rx="3" stroke="#27272a" strokeWidth="1" transform="rotate(12, 486, 284)" />
        {/* Phone screen */}
        <rect x="473" y="274" width="26" height="18" fill="#0c1929" rx="2" transform="rotate(12, 486, 284)" />
        {/* Notification dot */}
        <circle cx="496" cy="272" r="5" fill="#ef4444" opacity="0.9" transform="rotate(12, 486, 284)">
          <animate attributeName="opacity" values="0.9;0.4;0.9" dur="1.2s" repeatCount="indefinite" />
        </circle>
        <text x="496" y="274.5" textAnchor="middle" fill="#fff" fontSize="5" fontWeight="bold" transform="rotate(12, 486, 284)">!</text>
        {/* Screen text lines */}
        <line x1="477" y1="280" x2="492" y2="280" stroke="#3b82f6" strokeWidth="0.5" opacity="0.3" transform="rotate(12, 486, 284)" />
        <line x1="477" y1="283" x2="488" y2="283" stroke="#3b82f6" strokeWidth="0.5" opacity="0.2" transform="rotate(12, 486, 284)" />
      </g>
      {clueHitArea('celular', 460, 260, 55, 40)}

      {/* ═══ COMPUTER MONITOR (clickeable) ═══ */}
      <g onClick={() => onClueClick('computador')} className="cursor-pointer">
        {/* Monitor shadow */}
        <ellipse cx="600" cy="292" rx="55" ry="4" fill="#000" opacity="0.2" />
        {/* Monitor frame */}
        <rect x="555" y="200" width="100" height="75" fill="#18181b" rx="4" stroke="#27272a" strokeWidth="1.5" />
        {/* Screen */}
        <rect x="560" y="205" width="90" height="63" fill="#09101a" rx="2" />
        {/* Screen content — dashboard */}
        <rect x="564" y="209" width="82" height="5" fill="#1e3a5f" opacity="0.4" rx="1" />
        <text x="605" y="213" textAnchor="middle" fill="#60a5fa" fontSize="3.5" fontFamily="monospace">SWIFT GATEWAY</text>
        {/* Chart bars */}
        {[570, 580, 590, 600, 610, 620, 630].map((bx, i) => (
          <rect key={`bar-${i}`} x={bx} y={250 - [15, 20, 8, 5, 3, 2, 1][i]} width="6" height={[15, 20, 8, 5, 3, 2, 1][i]} fill={i < 2 ? '#22c55e' : i < 4 ? '#f59e0b' : '#ef4444'} opacity="0.6" rx="0.5" />
        ))}
        {/* Error text */}
        <text x="605" y="228" textAnchor="middle" fill="#ef4444" fontSize="4" fontFamily="monospace" opacity="0.8">TIMEOUT</text>
        <text x="605" y="258" textAnchor="middle" fill="#ef4444" fontSize="3" fontFamily="monospace" opacity="0.6">
          <animate attributeName="opacity" values="0.6;0.2;0.6" dur="1s" repeatCount="indefinite" />
          Gateway Error
        </text>
        {/* Monitor stand */}
        <rect x="598" y="275" width="14" height="10" fill="#27272a" />
        <rect x="585" y="285" width="40" height="4" fill="#27272a" rx="2" />
        {/* Screen glow */}
        <rect x="560" y="205" width="90" height="63" fill="#3b82f6" opacity="0.03" rx="2" filter="url(#screen-glow)" />
        {/* Keyboard */}
        <rect x="565" y="292" width="70" height="12" fill="#1a1a1a" rx="2" stroke="#27272a" strokeWidth="0.5" />
        {Array.from({ length: 10 }).map((_, i) => (
          <rect key={`k-${i}`} x={569 + (i % 5) * 13} y={294 + Math.floor(i / 5) * 5} width="10" height="3.5" fill="#222" rx="0.5" />
        ))}
      </g>
      {clueHitArea('computador', 553, 198, 105, 110)}

      {/* ═══ LEATHER CHAIR ═══ */}
      <g>
        {/* Chair shadow */}
        <ellipse cx="410" cy="460" rx="55" ry="10" fill="#000" opacity="0.25" />
        {/* Chair base star */}
        {[0, 72, 144, 216, 288].map((angle, i) => (
          <line key={`cl-${i}`} x1="410" y1="455" x2={410 + Math.cos(angle * Math.PI / 180) * 30} y2={455 + Math.sin(angle * Math.PI / 180) * 8} stroke="#27272a" strokeWidth="2" strokeLinecap="round" />
        ))}
        {/* Wheels */}
        {[0, 72, 144, 216, 288].map((angle, i) => (
          <circle key={`cw-${i}`} cx={410 + Math.cos(angle * Math.PI / 180) * 30} cy={455 + Math.sin(angle * Math.PI / 180) * 8} r="3" fill="#1a1a1a" stroke="#27272a" strokeWidth="0.5" />
        ))}
        {/* Seat post */}
        <rect x="406" y="420" width="8" height="35" fill="#27272a" />
        {/* Seat */}
        <ellipse cx="410" cy="420" rx="45" ry="12" fill="url(#leather-chair)" stroke="#3a352a" strokeWidth="1" />
        {/* Back rest */}
        <rect x="370" y="350" width="80" height="72" fill="url(#leather-chair)" rx="8" stroke="#3a352a" strokeWidth="1" />
        {/* Backrest cushion lines */}
        <line x1="390" y1="358" x2="390" y2="415" stroke="#2a2520" strokeWidth="0.5" opacity="0.4" />
        <line x1="410" y1="355" x2="410" y2="415" stroke="#2a2520" strokeWidth="0.5" opacity="0.4" />
        <line x1="430" y1="358" x2="430" y2="415" stroke="#2a2520" strokeWidth="0.5" opacity="0.4" />
        {/* Armrests */}
        <rect x="358" y="395" width="15" height="6" fill="#3a352a" rx="3" />
        <rect x="447" y="395" width="15" height="6" fill="#3a352a" rx="3" />
      </g>

      {/* ═══ COFFEE CUP ═══ */}
      <g>
        <ellipse cx="265" cy="292" rx="10" ry="3.5" fill="#1c1917" stroke="#3a352a" strokeWidth="0.5" />
        <rect x="255" y="282" width="20" height="10" fill="#1c1917" rx="1" stroke="#3a352a" strokeWidth="0.5" />
        <ellipse cx="265" cy="282" rx="10" ry="3.5" fill="#292218" stroke="#3a352a" strokeWidth="0.5" />
        <ellipse cx="265" cy="282" rx="7" ry="2.5" fill="#3d2e1a" opacity="0.6" />
        {/* Steam */}
        <path d="M262,278 Q260,272 264,268 Q268,264 265,258" fill="none" stroke="#a8a29e" strokeWidth="0.5" opacity="0.15">
          <animate attributeName="d" values="M262,278 Q260,272 264,268 Q268,264 265,258;M262,278 Q264,271 260,266 Q256,261 260,255;M262,278 Q260,272 264,268 Q268,264 265,258" dur="3s" repeatCount="indefinite" />
        </path>
        <path d="M268,277 Q270,271 266,266 Q262,261 268,256" fill="none" stroke="#a8a29e" strokeWidth="0.5" opacity="0.1">
          <animate attributeName="d" values="M268,277 Q270,271 266,266 Q262,261 268,256;M268,277 Q266,270 270,265 Q274,260 270,254;M268,277 Q270,271 266,266 Q262,261 268,256" dur="4s" repeatCount="indefinite" />
        </path>
      </g>

      {/* ═══ PEN HOLDER ═══ */}
      <g>
        <rect x="515" y="276" width="14" height="18" fill="#27272a" rx="2" stroke="#3f3f46" strokeWidth="0.5" />
        <line x1="518" y1="276" x2="516" y2="262" stroke="#b8860b" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="522" y1="276" x2="524" y2="265" stroke="#1e3a5f" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="525" y1="276" x2="527" y2="268" stroke="#7f1d1d" strokeWidth="1.5" strokeLinecap="round" />
      </g>

      {/* ═══ SMALL PLANT ═══ */}
      <g transform="translate(155, 274)">
        <rect x="-8" y="5" width="16" height="16" fill="#292218" rx="2" stroke="#3a352a" strokeWidth="0.5" />
        <ellipse cx="0" cy="5" rx="8" ry="3" fill="#1e3314" opacity="0.6" />
        <path d="M0,4 Q-6,-5 -3,-15" fill="none" stroke="#365314" strokeWidth="1.5" />
        <path d="M0,4 Q4,-8 8,-12" fill="none" stroke="#365314" strokeWidth="1.5" />
        <path d="M0,3 Q-2,-10 2,-18" fill="none" stroke="#365314" strokeWidth="1.5" />
        <ellipse cx="-4" cy="-14" rx="5" ry="3" fill="#365314" opacity="0.5" transform="rotate(-20, -4, -14)" />
        <ellipse cx="7" cy="-11" rx="4" ry="2.5" fill="#365314" opacity="0.5" transform="rotate(15, 7, -11)" />
        <ellipse cx="1" cy="-17" rx="5" ry="3" fill="#365314" opacity="0.4" transform="rotate(-5, 1, -17)" />
      </g>

      {/* ═══ WALL CLOCK ═══ */}
      <g>
        <circle cx="510" cy="75" r="22" fill="#1a1710" stroke="#3a352a" strokeWidth="1.5" />
        <circle cx="510" cy="75" r="19" fill="#0f0e0b" />
        {/* Hour markers */}
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i * 30 - 90) * Math.PI / 180;
          return (
            <line key={`hm-${i}`} x1={510 + Math.cos(angle) * 15} y1={75 + Math.sin(angle) * 15} x2={510 + Math.cos(angle) * 17} y2={75 + Math.sin(angle) * 17} stroke="#52504a" strokeWidth={i % 3 === 0 ? "1.5" : "0.5"} />
          );
        })}
        {/* Hour hand */}
        <line x1="510" y1="75" x2="510" y2="62" stroke="#a8a29e" strokeWidth="1.5" strokeLinecap="round" />
        {/* Minute hand */}
        <line x1="510" y1="75" x2="520" y2="67" stroke="#a8a29e" strokeWidth="1" strokeLinecap="round" />
        {/* Center dot */}
        <circle cx="510" cy="75" r="1.5" fill="#b8860b" />
        {/* Second hand */}
        <line x1="510" y1="75" x2="505" y2="59" stroke="#ef4444" strokeWidth="0.5" strokeLinecap="round">
          <animateTransform attributeName="transform" type="rotate" from="0 510 75" to="360 510 75" dur="60s" repeatCount="indefinite" />
        </line>
      </g>

      {/* ═══ PAINTING ON WALL ═══ */}
      <g>
        <rect x="40" y="310" width="55" height="40" fill="#1a1710" rx="1" stroke="#3a352a" strokeWidth="1" />
        <rect x="43" y="313" width="49" height="34" fill="#162233" rx="0.5" opacity="0.5" />
        {/* Abstract landscape */}
        <path d="M43,340 Q55,325 68,332 Q80,340 92,335 L92,347 L43,347 Z" fill="#1a3320" opacity="0.4" />
        <circle cx="82" cy="320" r="4" fill="#fbbf24" opacity="0.1" />
      </g>

      {/* ═══ AMBIENT LIGHTING ═══ */}
      {/* Overall warm ambient from lamp */}
      <rect x="0" y="0" width="800" height="520" fill="url(#lamp-glow)" opacity="0.3" style={{ mixBlendMode: 'screen' }} />
      {/* Vignette */}
      <rect x="0" y="0" width="800" height="520" fill="url(#off-bg)" opacity="0.15" />

      {/* ═══ INSTRUCTION ═══ */}
      <text x="400" y="505" textAnchor="middle" fill="#3f3f46" fontSize="9" fontFamily="monospace" letterSpacing="1">
        OFICINA DEL CLIENTE — Investiga los objetos antes de la reunión
      </text>
    </svg>
  );
};

// ─── PANIC METER ─────────────────────────────────────────────────────
const PanicMeter = ({ value }) => {
  const color = value > 70 ? '#ef4444' : value > 40 ? '#f59e0b' : '#22c55e';
  const label = value > 70 ? 'CRÍTICO' : value > 40 ? 'ELEVADO' : 'CONTROLADO';

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-zinc-500 font-mono">PÁNICO</span>
      <div className="relative w-32 h-3 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
          style={{ width: `${Math.min(100, Math.max(0, value))}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs font-mono font-bold" style={{ color }}>{label}</span>
    </div>
  );
};

// ─── MAIN COMPONENT ──────────────────────────────────────────────────
export default function ClientDirectorStation({
  socket = null,
  gameStore = null,
  soloMode = true,
  profileId = 'director-agresivo',
  onComplete = null
}) {
  const profile = CLIENT_PROFILES[profileId] || CLIENT_PROFILES['director-agresivo'];

  const [phase, setPhase] = useState('investigation'); // investigation | meeting | result
  const [discoveredKeys, setDiscoveredKeys] = useState([]);
  const [activeClue, setActiveClue] = useState(null);
  const [intelGathered, setIntelGathered] = useState([]);
  const [timeLeft, setTimeLeft] = useState(60);
  const [panic, setPanic] = useState(50);
  const [selectedResponse, setSelectedResponse] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const timerRef = useRef(null);

  const totalClues = Object.keys(profile.officeClues).length;
  const intelLevel = intelGathered.length >= 4 ? 'full' : intelGathered.length >= 2 ? 'partial' : 'none';

  // Investigation timer
  useEffect(() => {
    if (phase !== 'investigation') return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setPhase('meeting');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase]);

  const handleClueClick = useCallback((key) => {
    if (phase !== 'investigation') return;
    const clue = profile.officeClues[key];
    if (!discoveredKeys.includes(key)) {
      setDiscoveredKeys(prev => [...prev, key]);
      setIntelGathered(prev => [...prev, clue.intel]);
    }
    setActiveClue({ key, ...clue });
  }, [phase, profile, discoveredKeys]);

  const handleSkipToMeeting = useCallback(() => {
    clearInterval(timerRef.current);
    setPhase('meeting');
  }, []);

  const handleSelectResponse = useCallback((response) => {
    setSelectedResponse(response);
    setPanic(prev => Math.min(100, Math.max(0, prev + response.panicDelta)));
    setShowFeedback(true);

    // Emit panic change via socket in team mode
    if (socket && !soloMode) {
      socket.emit('panicUpdate', {
        delta: response.panicDelta,
        source: 'clientDirector',
        correct: response.correct
      });
    }
  }, [socket, soloMode]);

  const handleFinish = useCallback(() => {
    setPhase('result');
  }, []);

  const handleRestart = useCallback(() => {
    setPhase('investigation');
    setDiscoveredKeys([]);
    setActiveClue(null);
    setIntelGathered([]);
    setTimeLeft(60);
    setPanic(50);
    setSelectedResponse(null);
    setShowFeedback(false);
  }, []);

  // Get available responses based on intel level
  const getResponses = () => {
    return profile.responses[intelLevel] || profile.responses.none;
  };

  // ─── INVESTIGATION PHASE ────────────────────────────────────────
  if (phase === 'investigation') {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
        <style>{`
          @keyframes popIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        `}</style>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-xs text-blue-400 font-mono font-bold">FASE 1 — INVESTIGACIÓN</span>
            <span className="text-zinc-600 font-mono text-xs">|</span>
            <span className="text-xs text-zinc-400 font-mono">Oficina de {profile.name}</span>
          </div>
          <div className={`px-3 py-1 rounded font-mono text-sm font-bold ${timeLeft <= 15 ? 'bg-red-950 text-red-400' : 'bg-zinc-800 text-zinc-300'}`}>
            ⏱ 0:{String(timeLeft).padStart(2, '0')}
          </div>
        </div>

        {/* Intel bar */}
        <div className="px-4 py-2 bg-zinc-900/50 border-b border-zinc-800/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500 font-mono">INTEL:</span>
            <div className="flex gap-1">
              {Object.keys(profile.officeClues).map((key, i) => (
                <div
                  key={key}
                  className={`w-6 h-6 rounded flex items-center justify-center text-xs ${discoveredKeys.includes(key) ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-700' : 'bg-zinc-800 text-zinc-600 border border-zinc-700'
                    }`}
                >
                  {discoveredKeys.includes(key) ? '✓' : '?'}
                </div>
              ))}
            </div>
            <span className="text-xs text-zinc-500 font-mono ml-2">{discoveredKeys.length}/{totalClues}</span>
          </div>
          <button
            onClick={handleSkipToMeeting}
            className="px-3 py-1 text-xs bg-amber-900/50 hover:bg-amber-900 text-amber-400 font-mono rounded transition-colors border border-amber-800/50"
          >
            Ir a la reunión →
          </button>
        </div>

        {/* Office SVG */}
        <div className="flex-1 relative">
          <OfficeSVG
            clues={profile.officeClues}
            discoveredKeys={discoveredKeys}
            onClueClick={handleClueClick}
            activeClueKey={activeClue?.key}
          />
        </div>

        {/* Clue popup */}
        {activeClue && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setActiveClue(null)}>
            <div
              className="w-full max-w-md mx-4 bg-zinc-900 border border-zinc-700 rounded-lg overflow-hidden"
              onClick={e => e.stopPropagation()}
              style={{ animation: 'popIn 0.2s ease-out' }}
            >
              <div className="flex items-center gap-2 px-4 py-3 bg-zinc-800/80 border-b border-zinc-700">
                <span className="text-xl">{activeClue.icon}</span>
                <span className="text-sm font-bold text-zinc-100 font-mono">{activeClue.label}</span>
              </div>
              <div className="p-4 space-y-3">
                <p className="text-sm text-zinc-300 font-mono leading-relaxed">{activeClue.description}</p>
                <div className="p-2 bg-blue-950/30 border border-blue-900/30 rounded">
                  <p className="text-xs text-blue-300 font-mono">
                    <span className="text-blue-500 font-bold">INTEL:</span> {activeClue.intel.value}
                  </p>
                </div>
              </div>
              <div className="px-4 py-2 bg-zinc-800/30 border-t border-zinc-800">
                <button onClick={() => setActiveClue(null)} className="w-full py-1.5 text-xs text-zinc-400 font-mono hover:text-zinc-200 transition-colors">
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Intel gathered bar */}
        {intelGathered.length > 0 && (
          <div className="px-4 py-2 bg-zinc-900 border-t border-zinc-800 overflow-x-auto">
            <div className="flex gap-2">
              {intelGathered.map((intel, i) => (
                <div key={i} className="flex-shrink-0 px-2 py-1 bg-blue-950/30 border border-blue-900/30 rounded text-xs font-mono text-blue-400">
                  {intel.value.split(' — ')[0]}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── MEETING PHASE ──────────────────────────────────────────────
  if (phase === 'meeting') {
    const responses = getResponses();

    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs text-red-400 font-mono font-bold">FASE 2 — REUNIÓN DE CRISIS</span>
          </div>
          <PanicMeter value={panic} />
        </div>

        {/* Intel summary */}
        <div className="px-4 py-2 bg-zinc-900/50 border-b border-zinc-800/50">
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500 font-mono">INTEL DISPONIBLE:</span>
            <span className={`text-xs font-mono font-bold ${intelLevel === 'full' ? 'text-emerald-400' : intelLevel === 'partial' ? 'text-amber-400' : 'text-red-400'}`}>
              {intelLevel === 'full' ? '● COMPLETA' : intelLevel === 'partial' ? '◐ PARCIAL' : '○ SIN INTEL'}
            </span>
            <span className="text-xs text-zinc-600 font-mono">({discoveredKeys.length}/{totalClues} objetos)</span>
          </div>
        </div>

        {/* Meeting room */}
        <div className="flex-1 flex flex-col justify-center px-4 py-6 max-w-3xl mx-auto w-full">
          {/* Client avatar & speech */}
          <div className="mb-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-14 h-14 bg-zinc-800 rounded-full flex items-center justify-center text-3xl border-2 border-zinc-700 flex-shrink-0">
                {profile.avatar}
              </div>
              <div>
                <p className="text-sm font-bold text-zinc-100 font-mono">{profile.name}</p>
                <p className="text-xs text-zinc-500 font-mono">{profile.title}</p>
              </div>
            </div>
            <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-4 relative ml-4">
              <div className="absolute -left-2 top-4 w-4 h-4 bg-zinc-900 border-l border-b border-zinc-700 rotate-45" />
              <p className="text-sm text-zinc-200 font-mono leading-relaxed italic">"{profile.openingLine}"</p>
            </div>
          </div>

          {/* Response options */}
          {!showFeedback ? (
            <div className="space-y-3">
              <p className="text-xs text-zinc-500 font-mono mb-2">ELIGE TU RESPUESTA:</p>
              {responses.map((resp, i) => (
                <button
                  key={i}
                  onClick={() => handleSelectResponse(resp)}
                  className="w-full text-left p-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-600 rounded-lg transition-all group"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xs text-zinc-500 font-mono mt-0.5 bg-zinc-800 px-1.5 py-0.5 rounded group-hover:bg-zinc-700">{String.fromCharCode(65 + i)}</span>
                    <p className="text-sm text-zinc-300 font-mono leading-relaxed group-hover:text-zinc-100">{resp.text}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-4" style={{ animation: 'popIn 0.3s ease-out' }}>
              {/* Selected response */}
              <div className={`p-4 rounded-lg border ${selectedResponse.correct ? 'bg-emerald-950/30 border-emerald-700' : 'bg-red-950/30 border-red-700'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-lg ${selectedResponse.correct ? '✅' : '❌'}`}>{selectedResponse.correct ? '✅' : '❌'}</span>
                  <span className={`text-sm font-bold font-mono ${selectedResponse.correct ? 'text-emerald-400' : 'text-red-400'}`}>
                    {selectedResponse.correct ? 'RESPUESTA CORRECTA' : 'RESPUESTA INCORRECTA'}
                  </span>
                  <span className={`text-xs font-mono ml-auto ${selectedResponse.panicDelta < 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    Pánico: {selectedResponse.panicDelta > 0 ? '+' : ''}{selectedResponse.panicDelta}
                  </span>
                </div>
                <p className="text-sm text-zinc-300 font-mono leading-relaxed mb-3">{selectedResponse.text}</p>
                <p className="text-xs text-zinc-400 font-mono italic border-t border-zinc-700 pt-2">{selectedResponse.feedback}</p>
              </div>

              <button
                onClick={handleFinish}
                className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-mono rounded-lg transition-colors"
              >
                Ver Resultados →
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── RESULTS PHASE ──────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
        <div className="p-6 bg-zinc-800/50 border-b border-zinc-700 text-center">
          <p className="text-xs text-zinc-500 font-mono mb-2">CLIENT DIRECTOR — RESULTADOS</p>
          <div className="text-4xl mb-2">{profile.avatar}</div>
          <p className="text-sm text-zinc-300 font-mono">{profile.name}</p>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-zinc-800/50 rounded p-3">
              <p className="text-xl font-bold text-zinc-100 font-mono">{discoveredKeys.length}/{totalClues}</p>
              <p className="text-xs text-zinc-500 font-mono">Intel</p>
            </div>
            <div className="bg-zinc-800/50 rounded p-3">
              <p className={`text-xl font-bold font-mono ${selectedResponse?.correct ? 'text-emerald-400' : 'text-red-400'}`}>
                {selectedResponse?.correct ? '✓' : '✗'}
              </p>
              <p className="text-xs text-zinc-500 font-mono">Respuesta</p>
            </div>
            <div className="bg-zinc-800/50 rounded p-3">
              <p className={`text-xl font-bold font-mono ${panic <= 40 ? 'text-emerald-400' : panic <= 70 ? 'text-amber-400' : 'text-red-400'}`}>
                {panic}%
              </p>
              <p className="text-xs text-zinc-500 font-mono">Pánico</p>
            </div>
          </div>

          {intelGathered.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-zinc-500 font-mono">INTEL DESCUBIERTA:</p>
              {intelGathered.map((intel, i) => (
                <div key={i} className="px-3 py-1.5 bg-blue-950/20 border border-blue-900/20 rounded text-xs font-mono text-blue-300">
                  {intel.value}
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3 mt-4">
            <button onClick={handleRestart} className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-mono rounded transition-colors">
              🔄 Reintentar
            </button>
            <button onClick={() => onComplete?.({ panic, correct: selectedResponse?.correct, intelLevel })} className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-mono rounded transition-colors">
              ✓ Continuar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
