// src/components/ClientDirectorStation.jsx
// Rediseño v2 · Client Director
// Usa OfficeScene (5 oficinas SVG estilizadas, una por cliente)
// Mantiene toda la lógica original: 3 fases, intel level, panic meter, socket emits

import { useState, useEffect, useCallback, useRef } from 'react';
import OfficeScene from './OfficeScene';

// ============================================================================
//  PALETA Y ANIMACIONES
// ============================================================================
const C = {
  base: '#0A0E14', surface: '#14181F', raised: '#1C212B',
  border: '#1C212B', borderStrong: '#3A414F',
  text: '#E6E8EC', muted: '#9CA3AF', hint: '#6B7280',
  // Client Director: indigo
  role: '#818CF8', roleDark: '#1E1B4B',
  // Estados
  success: '#34D399', successDark: '#04342C',
  danger: '#F87171', dangerDark: '#3F0A0A',
  warning: '#FBBF24', warningDark: '#412402',
  info: '#60A5FA',
};

const ANIM = `
@keyframes cd-fadein { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
@keyframes cd-pop { from { opacity: 0; transform: scale(.94); } to { opacity: 1; transform: scale(1); } }
@keyframes cd-slidein { from { opacity: 0; transform: translateX(-12px); } to { opacity: 1; transform: translateX(0); } }
@keyframes cd-pulse { 0%,100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.12); opacity: .75; } }
@keyframes cd-breathe { 0%,100% { opacity: 1; } 50% { opacity: .6; } }
@keyframes cd-shake { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
.cd-fadein { animation: cd-fadein .4s ease-out both; }
.cd-pop { animation: cd-pop .3s cubic-bezier(.2,.9,.3,1.1) both; }
.cd-slidein { animation: cd-slidein .4s ease-out both; }
.cd-pulse { animation: cd-pulse 1.4s ease-in-out infinite; }
.cd-breathe { animation: cd-breathe 2s ease-in-out infinite; }
.cd-btn { transition: opacity .15s, transform .12s, background .15s, border-color .15s; cursor: pointer; }
.cd-btn:hover:not(:disabled) { opacity: .92; }
.cd-btn:active:not(:disabled) { transform: scale(.98); }
.cd-btn:disabled { cursor: not-allowed; opacity: .5; }
.cd-resp-card { transition: background .15s, border-color .15s, transform .12s; cursor: pointer; }
.cd-resp-card:hover { background: #1C212B; border-color: #3A414F; }
.cd-resp-card:active { transform: scale(.99); }
`;

// ============================================================================
//  PERFILES DE CLIENTES (mismo dataset que la versión anterior, intacto)
// ============================================================================
const CLIENT_PROFILES = {
  'director-agresivo': {
    id: 'director-agresivo',
    name: 'Ricardo Mendoza',
    title: 'Director de Operaciones · Banco Continental',
    personality: 'Agresivo, orientado a resultados, sin paciencia',
    initials: 'RM',
    accentColor: '#B8860B',
    intel: {
      trofeos:     { label: 'Trofeos y Placas', value: '15 años — lealtad alta', description: "Trofeos de 'Mejor Rendimiento' 2019-2024. Placa: '15 años de relación con el banco'." },
      organigrama: { label: 'Organigrama',       value: 'Reporta al CEO — presión extrema', description: "Reporta directamente al CEO. Nota adhesiva: 'Board meeting viernes'." },
      documentos:  { label: 'Documentos SOX',    value: 'Auditoría SOX — Pagos Internacionales', description: 'Informe de auditoría SOX abierto. Área señalada: Pagos Internacionales.' },
      celular:     { label: 'Celular',           value: '23 llamadas — urgencia CRÍTICA', description: '23 llamadas perdidas en las últimas 2 horas. 8 mensajes sin leer del equipo de TI.' },
      computador:  { label: 'Monitor SWIFT',     value: 'SWIFT Gateway — Payment Execution', description: "Dashboard de SWIFT con transacciones en cola. Error: 'Gateway Timeout'." },
    },
    openingLine: 'Llevamos 3 horas con los pagos internacionales caídos. Tengo al CEO encima y una auditoría SOX la próxima semana. Necesito una solución YA, no excusas.',
    responses: {
      full: [
        { text: "Señor Mendoza, entiendo la presión del board del viernes y la auditoría SOX. Ya identificamos que el Service Domain de Payment Execution tiene un timeout en el gateway SWIFT. Estamos activando el canal de contingencia — en 45 minutos tendremos trazabilidad completa para la auditoría.", correct: true, panicDelta: -25, feedback: 'Perfecto. Demuestra conocimiento del perfil, aplica el Service Domain correcto (Payment Execution con Functional Pattern Transact), da timeline concreto y aborda la auditoría.' },
        { text: 'Señor Mendoza, ya activamos el Service Domain de Transaction Authorization para restablecer el flujo SWIFT. En una hora tendremos un workaround completo y el RCA para su auditoría.', correct: false, panicDelta: 10, feedback: 'TRAMPA: Suena técnico y seguro, pero Transaction Authorization evalúa y aprueba transacciones — no ejecuta pagos. El Service Domain correcto para ejecutar pagos es Payment Execution. Confundir autorización con ejecución puede llevar a soluciones incorrectas.' },
        { text: 'Estamos trabajando en ello. El equipo de TI está investigando y le avisaremos cuando tengamos algo concreto. Estas cosas toman su tiempo.', correct: false, panicDelta: 20, feedback: 'Demasiado vago. Este perfil tiene al CEO encima y una auditoría SOX — necesita respuestas concretas con Service Domains identificados y timeline específico, no frases genéricas.' },
        { text: 'Hemos detectado un fallo en el módulo de pagos. Nuestro equipo necesita entre 24 y 48 horas para hacer un diagnóstico completo y proponer una solución definitiva.', correct: false, panicDelta: 30, feedback: 'El timeline de 48 horas es inaceptable. Con 15 años de relación, auditoría SOX inminente y el CEO presionando, necesita resolución en horas, no días.' },
      ],
      partial: [
        { text: 'Señor Mendoza, entendemos la urgencia de los pagos internacionales. Ya estamos aislando el problema en el flujo de Payment Execution. Necesito 10 minutos para confirmar si el Functional Pattern Transact está bloqueado a nivel de gateway o de core, y le doy un timeline preciso.', correct: true, panicDelta: -10, feedback: 'Bueno. Reconoce la urgencia, identifica el Service Domain probable, pide un tiempo corto y razonable para confirmar antes de comprometerse.' },
        { text: 'Señor Mendoza, vamos a levantar inmediatamente un incidente P1 y convocar a todos los equipos involucrados a un war room para resolver esto lo antes posible.', correct: false, panicDelta: 5, feedback: 'TRAMPA: Suena decidido y urgente, pero es pura gestión de incidentes sin diagnóstico técnico. No identifica el Service Domain afectado ni ofrece un camino de resolución concreto.' },
        { text: 'Vamos a revisar qué está pasando con el sistema de pagos. Le pido paciencia mientras el equipo investiga la causa raíz del problema.', correct: false, panicDelta: 15, feedback: 'Pedir paciencia a un Director de Operaciones con el CEO encima es contraproducente. No demuestra ningún conocimiento previo del problema.' },
        { text: 'Entiendo su preocupación. Déjeme coordinar con nuestro departamento de infraestructura y le envío un email con la actualización del estado en las próximas horas.', correct: false, panicDelta: 20, feedback: "Email y 'próximas horas' son incompatibles con un perfil que lleva 23 llamadas perdidas. Este cliente necesita resolución inmediata, cara a cara." },
      ],
      none: [
        { text: 'Entiendo que es un incidente crítico. Necesito que me confirme: ¿el problema es en la ejecución de las transacciones de pago o en la autorización de las mismas? Con eso puedo activar al equipo correcto de inmediato.', correct: true, panicDelta: 5, feedback: 'Sin intel previo, esta pregunta demuestra conocimiento de la diferencia entre Payment Execution y Transaction Authorization — conceptos BIAN clave.' },
        { text: 'Señor Mendoza, dígame exactamente qué Service Domain está fallando y mi equipo lo resuelve en la próxima hora.', correct: false, panicDelta: 10, feedback: 'TRAMPA: Pedirle al cliente que identifique el Service Domain es tu trabajo, no el de él. Demuestra que llegaste sin preparación.' },
        { text: 'Cuénteme los detalles del problema. ¿Desde cuándo ocurre y qué áreas están afectadas?', correct: false, panicDelta: 15, feedback: 'Preguntas genéricas de help desk. Un cliente con 15 años de relación espera que ya conozcas su infraestructura.' },
        { text: 'Buenos días, soy su nuevo punto de contacto. ¿En qué puedo ayudarle hoy?', correct: false, panicDelta: 25, feedback: 'Totalmente desconectado del contexto de crisis. No muestra ninguna conciencia de la urgencia.' },
      ],
    },
  },
  'directora-analitica': {
    id: 'directora-analitica',
    name: 'Carmen Herrera',
    title: 'Gerente de Riesgos · Banco Nacional',
    personality: 'Analítica, metódica, necesita datos',
    initials: 'CH',
    accentColor: '#60A5FA',
    intel: {
      trofeos:     { label: 'Certificaciones',  value: '8 años — orientada a estándares', description: "Certificados ISO 27001, ISO 31000. Placa: '8 años como cliente preferente'." },
      organigrama: { label: 'Organigrama',       value: 'Reporta al CRO — necesita métricas', description: 'Reporta al Chief Risk Officer. Su área tiene 45 personas.' },
      documentos:  { label: 'Matriz de Riesgo',  value: 'Riesgo Operacional — Disponibilidad Core', description: 'Matriz de Riesgo Operacional Q4. Resaltado: scoring de disponibilidad del core.' },
      celular:     { label: 'Celular',           value: 'Necesita RCA — deadline jueves', description: "5 llamadas. Mensaje: 'Carmen, necesito el RCA antes del jueves'." },
      computador:  { label: 'Grafana',           value: 'Core Bancario — System Administration', description: 'Grafana con latencia del core: 12,000ms. Alertas en rojo.' },
    },
    openingLine: 'La latencia del core lleva 6 horas por encima de los 12 segundos. Necesito el Root Cause Analysis con datos concretos. ¿Tienen métricas o estamos adivinando?',
    responses: {
      full: [
        { text: 'Doctora Herrera, tenemos las métricas de Grafana identificadas. El Service Domain de System Administration muestra degradación en el Functional Pattern Operate — la contención está en el pool de conexiones del core. Le preparo el RCA formal con 3 puntos: causa raíz, mitigación inmediata y plan correctivo alineado con su deadline del jueves.', correct: true, panicDelta: -25, feedback: 'Excelente. Habla en datos, aplica System Administration con Functional Pattern Operate correctamente, ofrece RCA estructurado y respeta el deadline del CRO.' },
        { text: 'Doctora Herrera, el Service Domain de Current Account está generando la latencia por un problema en su Behavior Qualifier de transacciones. Estamos reconfigurando el Control Record para normalizar los tiempos de respuesta.', correct: false, panicDelta: 10, feedback: 'TRAMPA: Usa terminología BIAN real (Behavior Qualifier, Control Record) pero el diagnóstico es incorrecto. Current Account gestiona cuentas, no infraestructura. La latencia sistémica es de System Administration (Operate).' },
        { text: 'No se preocupe, ya estamos resolviendo el tema de la latencia. Todo estará bien pronto, confíe en nuestro equipo.', correct: false, panicDelta: 25, feedback: "'No se preocupe' es la peor respuesta para una Gerente de Riesgos con certificación ISO 31000 que necesita datos cuantificados, no confianza ciega." },
        { text: 'Hemos reiniciado los servidores y la latencia bajó temporalmente a 3 segundos. Seguimos monitoreando la situación para ver si se estabiliza.', correct: false, panicDelta: 15, feedback: "Reiniciar sin RCA es un parche. Un reinicio que 'bajó temporalmente' confirma que el problema va a regresar y no tienes diagnóstico." },
      ],
      partial: [
        { text: 'Doctora Herrera, hemos identificado anomalías en el patrón Operate del core bancario. Estamos correlacionando las métricas de latencia con los logs del pool de conexiones para construir el RCA. ¿Puede compartirnos los umbrales definidos en su matriz de riesgo operacional para alinear el análisis?', correct: true, panicDelta: -10, feedback: 'Bien. Muestra proceso analítico, referencia el Functional Pattern correcto (Operate), y pide información que demuestra que entiende su framework de riesgos.' },
        { text: 'Doctora Herrera, ya activamos el Service Domain de Financial Transaction Analysis para detectar el patrón de degradación. Le tendremos los resultados mañana temprano.', correct: false, panicDelta: 5, feedback: "TRAMPA: Financial Transaction Analysis analiza patrones de transacciones (fraude, anomalías de negocio), no latencia de infraestructura. Además, 'mañana' no respeta su deadline del jueves." },
        { text: 'Estamos investigando la causa de la latencia. Le enviaremos un reporte cuando lo tengamos completo.', correct: false, panicDelta: 10, feedback: "Demasiado pasivo y sin timeline. Una Gerente de Riesgos con deadline del jueves no acepta 'cuando lo tengamos'." },
        { text: 'La latencia probablemente se debe a un pico de transacciones. Recomendamos esperar a que baje la carga y reevaluar mañana.', correct: false, panicDelta: 20, feedback: 'Especular sin datos frente a una analítica es suicidio profesional. Ella tiene Grafana abierto y sabe que la carga no es el problema.' },
      ],
      none: [
        { text: 'Necesito entender el alcance del problema. ¿Puede mostrarme los dashboards de monitoreo y los SLAs comprometidos? Con esos datos puedo determinar si la degradación viene del Functional Pattern Operate del core o de un Service Domain específico.', correct: true, panicDelta: 5, feedback: 'Correcto sin información previa. Pide datos técnicos como ella espera y demuestra conocimiento de la diferencia entre problemas de infraestructura (Operate) y de negocio.' },
        { text: 'Doctora Herrera, ¿cuál es el Service Domain que está presentando el problema? Así asigno al equipo correcto de inmediato.', correct: false, panicDelta: 10, feedback: 'TRAMPA: Suena proactivo, pero una Gerente de Riesgos espera que TÚ diagnostiques qué Service Domain falla. Ella reporta métricas, tú identificas la causa.' },
        { text: 'Déjeme revisar qué está pasando con el core y le llamo en una hora con los resultados.', correct: false, panicDelta: 15, feedback: 'Inaceptable. Ella tiene los datos en Grafana frente a ella y espera que tú llegues preparado para analizar juntos, no que te vayas.' },
        { text: 'Entiendo la preocupación. Voy a escalar este caso a nuestro nivel más alto de soporte para que lo atiendan con prioridad.', correct: false, panicDelta: 20, feedback: 'Escalar suena bien pero es evasivo. Ella quiere RCA, no cadenas de escalamiento. Demuestra que no puedes resolver el problema tú mismo.' },
      ],
    },
  },
  'gerente-politico': {
    id: 'gerente-politico',
    name: 'Fernando Castillo',
    title: 'Subgerente General · Cooperativa Financiera del Sur',
    personality: 'Político, diplomático, preocupado por imagen',
    initials: 'FC',
    accentColor: '#7C2D3A',
    intel: {
      trofeos:     { label: 'Pared de fotos',    value: '4 años — perfil público',           description: "Fotos con políticos y empresarios. Premio 'Cooperativa del Año 2022'." },
      organigrama: { label: 'Directorio',         value: 'Directorio 9 miembros — asamblea en 15 días', description: "Directorio de 9 personas. Post-it: 'Asamblea de socios en 15 días'." },
      documentos:  { label: 'Carta de reclamo',   value: 'Reclamo socio — App Móvil',         description: "Reclamo de socio mayoritario sobre la app móvil: 'experiencia inaceptable'." },
      celular:     { label: 'WhatsApp',           value: 'Presidente presiona — deadline político', description: "WhatsApp del presidente del directorio: 'Fernando, resuelve esto antes de la asamblea'." },
      computador:  { label: 'App Móvil',          value: 'App Móvil — Channel Activity Management', description: 'App móvil con error 500 en transferencias. Review de 1 estrella visible.' },
    },
    openingLine: 'Los socios están furiosos con la app. Tengo una asamblea en 15 días y el presidente del directorio me está presionando. Necesito algo que yo pueda presentar como avance.',
    responses: {
      full: [
        { text: 'Don Fernando, entiendo la presión de la asamblea. Le propongo esto: corregimos el error del Channel Activity Management con Functional Pattern Fulfill esta semana, y le preparamos un informe ejecutivo con roadmap visual que muestre el plan de mejora de la app. Así usted presenta avance concreto a los socios con un plan creíble.', correct: true, panicDelta: -25, feedback: "Perfecto. Entiende que necesita un 'entregable político' (informe con roadmap) además de la solución técnica. Identifica Channel Activity Management como el SD correcto con Fulfill." },
        { text: 'Don Fernando, el problema de la app es que el Service Domain de Customer Offer no está procesando correctamente las solicitudes. Vamos a reconfigurar el Behavior Qualifier de ofertas para que las transferencias vuelvan a funcionar.', correct: false, panicDelta: 10, feedback: 'TRAMPA: Customer Offer orquesta ofertas comerciales al cliente, no gestiona canales digitales. Las transferencias dependen de Channel Activity Management y Payment Execution.' },
        { text: 'El error 500 en la app es un bug del backend en el endpoint de transferencias. Lo corregiremos en el próximo sprint de desarrollo, probablemente en 3 semanas.', correct: false, panicDelta: 15, feedback: "Demasiado técnico para un perfil político y el timeline se pasa de la asamblea. No le da el 'entregable' que necesita para el directorio." },
        { text: 'Don Fernando, con todo respeto, deberían haber actualizado la app cuando se lo recomendamos hace 6 meses. El problema actual es consecuencia de no seguir nuestras recomendaciones.', correct: false, panicDelta: 30, feedback: 'Culpar al cliente es la peor estrategia posible con un perfil político que tiene 9 directores observándolo.' },
      ],
      partial: [
        { text: 'Don Fernando, ya estamos al tanto del problema con la app móvil. Le propongo una reunión de 30 minutos para definir qué necesita presentar en la asamblea — alineamos la solución técnica del canal digital con ese timeline político y le preparamos material ejecutivo.', correct: true, panicDelta: -10, feedback: 'Bien. Se enfoca en lo que importa al cliente (la narrativa para el directorio) y ofrece ayuda concreta con el material de presentación.' },
        { text: 'Don Fernando, vamos a priorizar su caso. Activaremos el Service Domain de Customer Relationship Management para gestionar la situación con los socios mientras resolvemos el problema técnico.', correct: false, panicDelta: 5, feedback: 'TRAMPA: CRM gestiona la relación general con clientes, no resuelve errores de aplicación. El problema está en Channel Activity Management.' },
        { text: 'Vamos a revisar el problema técnico de la app y le damos un diagnóstico lo antes posible.', correct: false, panicDelta: 10, feedback: 'No aborda su preocupación real: la asamblea y el directorio.' },
        { text: 'Le recomiendo que en la asamblea explique que estos problemas son normales en transformación digital y que el equipo está trabajando en ello.', correct: false, panicDelta: 20, feedback: 'Decirle qué presentar a su directorio sin resolver el problema es condescendiente.' },
      ],
      none: [
        { text: 'Don Fernando, cuénteme más sobre la situación. ¿Qué es lo más importante: resolver el problema técnico de la app o tener material que presentar en la asamblea? Quiero asegurarme de que atacamos lo que usted más necesita primero.', correct: true, panicDelta: 5, feedback: 'Sin información previa, esta pregunta abierta le permite al cliente revelar su prioridad real (que probablemente es la asamblea, no el bug).' },
        { text: 'Don Fernando, ¿puede darme acceso al log de errores de la app? Necesito ver el stack trace para diagnosticar el problema técnico.', correct: false, panicDelta: 15, feedback: 'TRAMPA: Técnicamente correcto pero totalmente desalineado con el perfil. Un Subgerente General de cooperativa no tiene stack traces.' },
        { text: 'Necesitamos abrir un ticket formal con todos los detalles del incidente para poder asignar recursos.', correct: false, panicDelta: 20, feedback: 'Pedir burocracia a un cliente en crisis política demuestra total desconexión.' },
        { text: 'Entiendo. ¿Cuántos usuarios están afectados y desde cuándo está ocurriendo el problema?', correct: false, panicDelta: 10, feedback: 'Preguntas operativas válidas pero no conectan con su urgencia real. Él se preocupa por su puesto en la asamblea.' },
      ],
    },
  },
  'cto-tecnico': {
    id: 'cto-tecnico',
    name: 'Alejandra Vega',
    title: 'CTO · Fintech Rápida',
    personality: 'Técnica, directa, habla en código',
    initials: 'AV',
    accentColor: '#A855F7',
    intel: {
      trofeos:     { label: 'Hackathon trophies', value: '2 años — evalúa alternativas', description: "Hackathon trophies y certificaciones AWS/GCP. Sticker: 'Move fast and break things'." },
      organigrama: { label: 'Org Flat',           value: 'Startup — velocidad es la métrica', description: 'Organigrama flat — 3 niveles. Reporta a los founders.' },
      documentos:  { label: 'Eval. Proveedores',  value: 'Evaluando competidores — riesgo de churn', description: "Documento: 'Evaluación de proveedores API - Q1'. Tu empresa está en amarillo." },
      celular:     { label: 'Slack',              value: 'Slack > Teléfono — canal digital', description: 'Slack con canal #infra: 200 mensajes no leídos. Status: 🔥.' },
      computador:  { label: 'Terminal',           value: 'API Gateway — Product Directory', description: "curl commands fallando. Error: 'API Rate Limit Exceeded — Product Directory'." },
    },
    openingLine: 'Su API de Product Directory nos está tirando rate limits desde las 3am. Estamos evaluando migrar a otro proveedor. Necesito saber si pueden escalar o no — sin vueltas.',
    responses: {
      full: [
        { text: 'Alejandra, revisé los logs — el rate limit del Product Directory se disparó por un cambio en el burst policy de las 2am. El Functional Pattern Register del catálogo no soporta la volumetría actual de tu integración. Estoy escalando el throughput del API Gateway y te mando el nuevo rate limit por Slack en 20 minutos. También quiero revisar tu evaluación de proveedores — podemos ofrecerte un tier dedicado.', correct: true, panicDelta: -25, feedback: 'Habla su idioma técnico, identifica Product Directory con patrón Register, conoce el cambio en la policy, responde por Slack (su canal preferido) y aborda proactivamente el riesgo de churn.' },
        { text: 'Alejandra, el problema es que tu integración está golpeando el Service Domain de Party Routing Profile en lugar del Product Directory. El enrutamiento incorrecto causa los rate limits. Necesitamos reconfigurar tu endpoint para apuntar al Control Record correcto.', correct: false, panicDelta: 10, feedback: "TRAMPA: Party Routing Profile gestiona segmentación de clientes, no APIs. El error dice claramente 'Product Directory'." },
        { text: 'Lamentamos las molestias. Nuestro equipo de soporte está revisando su caso con prioridad P1 y le enviaremos una actualización por email en las próximas horas.', correct: false, panicDelta: 30, feedback: "Respuesta corporate que una CTO de fintech detesta. Email es el canal equivocado, 'próximas horas' es demasiado lento, y 'lamentamos las molestias' es lenguaje de call center." },
        { text: 'Los rate limits están configurados según el contrato vigente. Si necesita mayor throughput, podemos agendar una reunión con el equipo comercial para revisar un upgrade de plan.', correct: false, panicDelta: 20, feedback: 'Esconderse detrás del contrato cuando la cliente tiene un documento de evaluación de competidores abierto es suicidio comercial.' },
      ],
      partial: [
        { text: 'Alejandra, estoy viendo los rate limits del API Gateway sobre Product Directory. El patrón Register tiene un cap que pudo haber cambiado. Dame 15 minutos para verificar la burst policy y te paso la solución. ¿Slack o aquí mismo?', correct: true, panicDelta: -10, feedback: 'Habla técnico, identifica el SD y patrón, da timeline corto (15 min), y pregunta por canal de preferencia.' },
        { text: 'Alejandra, probablemente el Functional Pattern Fulfill de tu catálogo está saturado. Vamos a optimizar el Control Record del Product Directory para mejorar el rendimiento.', correct: false, panicDelta: 5, feedback: 'TRAMPA: Product Directory usa patrón Register (mantener catálogo), no Fulfill. Confundir patrones frente a una CTO técnica destruye tu credibilidad.' },
        { text: 'Vamos a abrir un ticket con el equipo de infraestructura para que revisen los rate limits de la API y te den una respuesta.', correct: false, panicDelta: 15, feedback: 'Demasiado lento y burocrático para una fintech que se mueve rápido.' },
        { text: '¿Puedes enviarme los headers de la respuesta HTTP? Necesito ver el X-RateLimit-Remaining para confirmar qué endpoint está limitado.', correct: false, panicDelta: 8, feedback: 'Técnicamente razonable pero reactivo. Ella ya te dijo qué API falla (Product Directory).' },
      ],
      none: [
        { text: 'Pásame el endpoint exacto y los headers del error. ¿Es el Product Directory completo o un Behavior Qualifier específico del catálogo? Lo reviso directo en el API Gateway.', correct: true, panicDelta: 5, feedback: 'Sin contexto previo, pedir datos técnicos específicos y mencionar Behavior Qualifiers es lo correcto con una CTO.' },
        { text: 'Entiendo la urgencia. ¿Cuál es tu volumetría actual de requests por segundo? Así puedo verificar si estás dentro del tier contratado.', correct: false, panicDelta: 10, feedback: 'TRAMPA: Implica que el problema podría ser culpa de ella (excedió el tier). Una CTO evaluando competidores no quiere oír eso.' },
        { text: '¿Puedes enviarme un email con la descripción completa del problema y los logs? Así lo puedo distribuir al equipo correcto.', correct: false, panicDelta: 25, feedback: 'Pedir email a una CTO de fintech que vive en Slack es la señal definitiva de que estás desconectado de su mundo.' },
        { text: 'Necesito revisar internamente qué cambios se hicieron en la API. Te contacto mañana con una respuesta.', correct: false, panicDelta: 20, feedback: 'Mañana es inaceptable. Cada hora que pasa la acerca más a migrar.' },
      ],
    },
  },
  'compliance-officer': {
    id: 'compliance-officer',
    name: 'Eduardo Paredes',
    title: 'CCO · Banco de Inversiones Pacífico',
    personality: 'Cauteloso, normativo, cada palabra tiene peso legal',
    initials: 'EP',
    accentColor: '#7C2D3A',
    intel: {
      trofeos:     { label: 'Diplomas',           value: '12 años — cada promesa es contractual', description: "Diplomas de Derecho y MBA. Certificación CAMS (Anti-lavado). '12 años de relación'." },
      organigrama: { label: 'Board Compliance',   value: 'Board + SBS — presión regulatoria', description: "Reporta al Board de Compliance. 'Revisión regulatoria SBS próximo mes'." },
      documentos:  { label: 'Circular SBS',       value: 'SBS — AML/KYC — 30 días',          description: "Circular SBS sobre operaciones sospechosas. Post-it: 'Plazo: 30 días'." },
      celular:     { label: 'Teléfono fijo',      value: 'Regulador contactó directamente — riesgo sanción', description: "2 llamadas del regulador. Email: 'Requerimiento de información — plazo perentorio'." },
      computador:  { label: 'Sistema AML',        value: 'Sistema AML — Compliance Reporting', description: 'Monitoreo de transacciones con 847 alertas AML sin procesar.' },
    },
    openingLine: 'El sistema de monitoreo AML tiene 847 alertas sin procesar y la SBS nos pidió un reporte en 30 días. Si no cumplimos, la sanción es millonaria. Necesito que me garanticen que el sistema va a funcionar.',
    responses: {
      full: [
        { text: "Doctor Paredes, entiendo la criticidad del requerimiento de la SBS. Plan: primero, estabilizamos el Service Domain de Compliance Reporting esta semana para desagotar las 847 alertas. Segundo, activamos Financial Transaction Analysis con Functional Pattern Analyze para el filtrado automático de operaciones sospechosas. Le entrego un informe documentado de cada paso para su archivo regulatorio. No le digo 'garantía' porque sería irresponsable — le digo plan concreto con evidencia auditable.", correct: true, panicDelta: -25, feedback: 'Excepcional. No promete garantías (un abogado las rechazaría), ofrece plan auditable con los dos Service Domains correctos.' },
        { text: 'Doctor Paredes, activamos el Service Domain de Fraud Evaluation para procesar las 847 alertas AML pendientes. Con el Functional Pattern Assess vamos a evaluar cada transacción sospechosa y generar el reporte para la SBS en el plazo establecido.', correct: false, panicDelta: 10, feedback: 'TRAMPA: Fraud Evaluation evalúa fraude caso a caso, pero el problema son alertas AML masivas que requieren Compliance Reporting y Financial Transaction Analysis.' },
        { text: 'Le garantizo que todo estará resuelto antes del plazo de la SBS. Puede confiar en nuestro equipo — nunca hemos fallado un deadline regulatorio.', correct: false, panicDelta: 15, feedback: 'Un Chief Compliance Officer con CAMS sabe que las garantías verbales no tienen valor legal.' },
        { text: 'Podemos asignar personal adicional para procesar las 847 alertas manualmente mientras arreglamos el sistema automatizado. Así cumplimos con el plazo.', correct: false, panicDelta: 20, feedback: '847 alertas manuales implican riesgo de error humano inaceptable en compliance AML.' },
      ],
      partial: [
        { text: 'Doctor Paredes, conozco la presión regulatoria de la SBS. Necesito revisar el estado del sistema para entregarle un plan con pasos documentados y trazables. ¿Puede darme acceso a la cola de alertas y al formato del reporte que la SBS está solicitando?', correct: true, panicDelta: -10, feedback: 'Bien. Pide datos concretos del regulador y habla de documentación y trazabilidad.' },
        { text: 'Doctor Paredes, vamos a configurar el Service Domain de Party Routing Profile para que redirija las alertas AML al equipo de compliance más rápido y puedan procesarlas a tiempo.', correct: false, panicDelta: 8, feedback: 'TRAMPA: Party Routing Profile gestiona segmentación de atención, no flujos de alertas AML.' },
        { text: 'Vamos a asignar más recursos técnicos al problema para acelerar la resolución del sistema AML.', correct: false, panicDelta: 10, feedback: "Vago e impreciso. Un CCO necesita un plan con pasos, responsables, fechas — no promesas genéricas." },
        { text: 'Estamos al tanto de la situación. Le sugiero que solicite a la SBS una prórroga mientras resolvemos el problema técnico.', correct: false, panicDelta: 25, feedback: 'Sugerir a un CCO que pida prórroga al regulador es señal de debilidad regulatoria.' },
      ],
      none: [
        { text: 'Doctor Paredes, necesito entender el requerimiento regulatorio exacto. ¿Tiene el oficio de la SBS para dimensionar el alcance? Quiero asegurarme de que la solución técnica que implementemos genere la evidencia auditable que el regulador espera.', correct: true, panicDelta: 5, feedback: "Correcto sin información previa. Pide el documento regulatorio oficial y habla de 'evidencia auditable'." },
        { text: 'Doctor Paredes, ¿cuántas de las 847 alertas son verdaderos positivos? Podríamos descartar las falsas alarmas rápidamente y enfocarnos en las reales.', correct: false, panicDelta: 12, feedback: 'TRAMPA: Descartar alertas AML sin procesarlas formalmente es violación regulatoria.' },
        { text: 'No se preocupe Doctor Paredes, estos temas regulatorios se resuelven siempre antes de los plazos. Tenemos experiencia con este tipo de situaciones.', correct: false, panicDelta: 30, feedback: 'Minimizar riesgo regulatorio frente a un Chief Compliance Officer es la peor señal posible.' },
        { text: 'Entiendo la urgencia. Voy a revisar el sistema y le preparo una propuesta para la próxima semana.', correct: false, panicDelta: 18, feedback: "Con el regulador ya habiendo llamado directamente, 'próxima semana' comunica que no entiendes la urgencia." },
      ],
    },
  },
};

const PROFILE_KEYS = Object.keys(CLIENT_PROFILES);

// Fisher-Yates true random shuffle
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ============================================================================
//  COMPONENTE PRINCIPAL
// ============================================================================
export default function ClientDirectorStation({
  socket = null,
  gameStore = null,
  soloMode = true,
  profileId = null,        // Si null, se elige random; si viene fijo, se respeta
  onComplete = null,
}) {
  // Selección de perfil: respeta profileId si viene, si no random
  const [currentProfileId, setCurrentProfileId] = useState(() => profileId || PROFILE_KEYS[Math.floor(Math.random() * PROFILE_KEYS.length)]);
  const profile = CLIENT_PROFILES[currentProfileId] || CLIENT_PROFILES['director-agresivo'];

  const [phase, setPhase] = useState('investigation'); // investigation | meeting | result
  const [discoveredKeys, setDiscoveredKeys] = useState([]);
  const [activeClue, setActiveClue] = useState(null);
  const [intelGathered, setIntelGathered] = useState([]);
  const [timeLeft, setTimeLeft] = useState(60);
  const [panic, setPanic] = useState(50);
  const [shuffledResponses, setShuffledResponses] = useState(null);
  const [selectedResponse, setSelectedResponse] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const timerRef = useRef(null);

  const totalClues = Object.keys(profile.intel).length;
  const intelLevel = intelGathered.length >= 4 ? 'full' : intelGathered.length >= 2 ? 'partial' : 'none';

  // Timer fase investigación
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

  // Cuando se entra a la fase meeting, se baraja las respuestas (random verdadero)
  useEffect(() => {
    if (phase === 'meeting' && !shuffledResponses) {
      const responses = profile.responses[intelLevel] || profile.responses.none;
      setShuffledResponses(shuffle(responses));
    }
  }, [phase, profile, intelLevel, shuffledResponses]);

  const handleClueClick = useCallback((key) => {
    if (phase !== 'investigation') return;
    const clueData = profile.intel[key];
    if (!clueData) return;
    if (!discoveredKeys.includes(key)) {
      setDiscoveredKeys(prev => [...prev, key]);
      setIntelGathered(prev => [...prev, { key, ...clueData }]);
    }
    setActiveClue({ key, ...clueData });
  }, [phase, profile, discoveredKeys]);

  const handleSkipToMeeting = useCallback(() => {
    clearInterval(timerRef.current);
    setPhase('meeting');
  }, []);

  const handleSelectResponse = useCallback((response) => {
    setSelectedResponse(response);
    setPanic(prev => Math.min(100, Math.max(0, prev + response.panicDelta)));
    setShowFeedback(true);

    if (socket && !soloMode) {
      socket.emit('panicUpdate', {
        delta: response.panicDelta,
        source: 'clientDirector',
        correct: response.correct,
      });
    }
  }, [socket, soloMode]);

  const handleFinish = useCallback(() => {
    setPhase('result');
  }, []);

  const handleRestart = useCallback(() => {
    // Si no había profileId fijo, se rotea a otro cliente random
    if (!profileId) {
      const others = PROFILE_KEYS.filter(k => k !== currentProfileId);
      setCurrentProfileId(others[Math.floor(Math.random() * others.length)]);
    }
    setPhase('investigation');
    setDiscoveredKeys([]);
    setActiveClue(null);
    setIntelGathered([]);
    setTimeLeft(60);
    setPanic(50);
    setShuffledResponses(null);
    setSelectedResponse(null);
    setShowFeedback(false);
  }, [profileId, currentProfileId]);

  // ──────────────────────────────────────────────────────────────────────
  // FASE 1: INVESTIGACIÓN
  // ──────────────────────────────────────────────────────────────────────
  if (phase === 'investigation') {
    return (
      <div style={{
        minHeight: '100vh', background: C.base, color: C.text,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        display: 'flex', flexDirection: 'column',
      }}>
        <style dangerouslySetInnerHTML={{ __html: ANIM }} />

        <InvestigationHeader profile={profile} timeLeft={timeLeft} onSkip={handleSkipToMeeting} />
        <IntelBar profile={profile} discoveredKeys={discoveredKeys} totalClues={totalClues} />

        {/* Escena de la oficina */}
        <div style={{ flex: 1, padding: '20px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <OfficeScene
            clientId={currentProfileId}
            discoveredKeys={discoveredKeys}
            activeClueKey={activeClue?.key}
            onClueClick={handleClueClick}
          />
        </div>

        {/* Tira de intel descubierta */}
        {intelGathered.length > 0 && (
          <div style={{ padding: '10px 20px', background: C.surface, borderTop: `1px solid ${C.border}`, overflowX: 'auto' }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: 10, color: C.muted, letterSpacing: '0.08em', fontWeight: 500, marginRight: 6, whiteSpace: 'nowrap' }}>
                INTEL RECOPILADA:
              </span>
              {intelGathered.map((intel, i) => (
                <span key={i} style={{
                  flexShrink: 0,
                  padding: '4px 10px',
                  background: `${C.role}15`, border: `1px solid ${C.role}55`,
                  borderRadius: 4, fontSize: 11, fontFamily: 'ui-monospace, monospace',
                  color: C.role, fontWeight: 500,
                }}>
                  {intel.value.split(' — ')[0]}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Popup de pista */}
        {activeClue && <CluePopup clue={activeClue} accentColor={profile.accentColor} onClose={() => setActiveClue(null)} />}
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────
  // FASE 2: REUNIÓN
  // ──────────────────────────────────────────────────────────────────────
  if (phase === 'meeting') {
    return (
      <MeetingPhase
        profile={profile}
        intelLevel={intelLevel}
        intelGathered={intelGathered}
        totalClues={totalClues}
        panic={panic}
        responses={shuffledResponses || []}
        selectedResponse={selectedResponse}
        showFeedback={showFeedback}
        onSelectResponse={handleSelectResponse}
        onFinish={handleFinish}
      />
    );
  }

  // ──────────────────────────────────────────────────────────────────────
  // FASE 3: RESULTADOS
  // ──────────────────────────────────────────────────────────────────────
  return (
    <ResultsPhase
      profile={profile}
      discoveredKeys={discoveredKeys}
      totalClues={totalClues}
      intelGathered={intelGathered}
      intelLevel={intelLevel}
      selectedResponse={selectedResponse}
      panic={panic}
      onRestart={handleRestart}
      onContinue={() => onComplete?.({ panic, correct: selectedResponse?.correct, intelLevel })}
    />
  );
}

// ============================================================================
//  HEADER FASE INVESTIGACIÓN
// ============================================================================
function InvestigationHeader({ profile, timeLeft, onSkip }) {
  const timerColor = timeLeft <= 10 ? C.danger : timeLeft <= 20 ? C.warning : C.role;
  const pulse = timeLeft <= 5 && timeLeft > 0;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 20px', background: C.surface, borderBottom: `1px solid ${C.border}`,
      flexWrap: 'wrap', gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 30, height: 30, background: C.role, borderRadius: 6,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="6" r="3" stroke={C.roleDark} strokeWidth="1.5" fill="none" />
            <path d="M3 14 Q3 10 8 10 Q13 10 13 14" stroke={C.roleDark} strokeWidth="1.5" fill="none" strokeLinecap="round" />
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 11, color: C.muted, letterSpacing: '0.08em', fontWeight: 500 }}>
            CLIENT DIRECTOR · FASE 1 — INVESTIGACIÓN
          </div>
          <div style={{ fontSize: 14, color: C.text, fontWeight: 500, marginTop: 1 }}>
            Oficina de {profile.name} <span style={{ color: C.hint, fontWeight: 400 }}>· {profile.title}</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div className={pulse ? 'cd-pulse' : ''} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 14px', borderRadius: 8,
          background: `${timerColor}15`, border: `1px solid ${timerColor}55`,
        }}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="9" r="5.5" stroke={timerColor} strokeWidth="1.5" fill="none" />
            <path d="M8 6 L8 9 L10.5 10" stroke={timerColor} strokeWidth="1.5" strokeLinecap="round" />
            <path d="M6 2 L10 2" stroke={timerColor} strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 16, fontWeight: 500, color: timerColor, letterSpacing: '0.02em' }}>
            0:{String(timeLeft).padStart(2, '0')}
          </span>
        </div>

        <button onClick={onSkip} className="cd-btn" style={{
          background: C.role, color: C.roleDark,
          border: `1px solid ${C.role}`, padding: '8px 16px', borderRadius: 6,
          fontSize: 13, fontWeight: 500, fontFamily: 'inherit',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          Ir a la reunión <span style={{ fontSize: 16, lineHeight: 1 }}>→</span>
        </button>
      </div>
    </div>
  );
}

// ============================================================================
//  BARRA DE INTEL (5 puntos arriba)
// ============================================================================
function IntelBar({ profile, discoveredKeys, totalClues }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '10px 20px', background: C.base, borderBottom: `1px solid ${C.border}`,
    }}>
      <span style={{ fontSize: 11, color: C.muted, letterSpacing: '0.08em', fontWeight: 500 }}>
        INTEL
      </span>
      <div style={{ display: 'flex', gap: 6 }}>
        {Object.entries(profile.intel).map(([key, c]) => {
          const found = discoveredKeys.includes(key);
          return (
            <div key={key} title={found ? c.label : 'Por descubrir'} style={{
              width: 26, height: 26, borderRadius: 5,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: found ? `${C.success}20` : C.raised,
              border: `1px solid ${found ? C.success : C.borderStrong}`,
              fontSize: 12, color: found ? C.success : C.hint, fontFamily: 'ui-monospace, monospace',
              transition: 'all .2s ease',
            }}>
              {found ? (
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8 L7 12 L13 5" stroke={C.success} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : '?'}
            </div>
          );
        })}
      </div>
      <span style={{ fontSize: 12, color: C.muted, fontFamily: 'ui-monospace, monospace', fontWeight: 500 }}>
        {discoveredKeys.length}/{totalClues}
      </span>
    </div>
  );
}

// ============================================================================
//  POPUP DE PISTA DESCUBIERTA
// ============================================================================
function CluePopup({ clue, accentColor, onClose }) {
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 50,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }}>
      <div onClick={e => e.stopPropagation()} className="cd-pop" style={{
        width: '100%', maxWidth: 460,
        background: C.base, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 18px', background: C.surface, borderBottom: `1px solid ${C.border}`,
        }}>
          <div>
            <div style={{ fontSize: 14, color: C.text, fontWeight: 500 }}>{clue.label}</div>
            <div style={{ fontSize: 11, color: C.muted, fontFamily: 'ui-monospace, monospace', marginTop: 2 }}>Pista descubierta</div>
          </div>
          <button onClick={onClose} className="cd-btn" style={{
            background: 'transparent', border: 'none', color: C.muted,
            width: 28, height: 28, borderRadius: 4, fontSize: 18,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>×</button>
        </div>

        <div style={{ padding: '16px 18px' }}>
          <div style={{
            background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6,
            padding: '12px 14px', marginBottom: 14,
            fontSize: 13, color: C.text, lineHeight: 1.6,
            fontFamily: 'ui-monospace, monospace',
          }}>
            {clue.description}
          </div>

          <div style={{
            background: `${C.role}12`, border: `1px solid ${C.role}55`, borderRadius: 8,
            padding: '12px 14px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.role }} />
              <span style={{ fontSize: 11, color: C.role, letterSpacing: '0.08em', fontWeight: 500 }}>
                INTEL CLAVE
              </span>
            </div>
            <p style={{ fontSize: 13, color: C.text, lineHeight: 1.5, margin: 0 }}>
              {clue.value}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
//  FASE 2: REUNIÓN
// ============================================================================
function MeetingPhase({
  profile, intelLevel, intelGathered, totalClues, panic, responses,
  selectedResponse, showFeedback, onSelectResponse, onFinish,
}) {
  const intelLabel = intelLevel === 'full' ? 'COMPLETA' : intelLevel === 'partial' ? 'PARCIAL' : 'SIN INTEL';
  const intelColor = intelLevel === 'full' ? C.success : intelLevel === 'partial' ? C.warning : C.danger;

  return (
    <div style={{
      minHeight: '100vh', background: C.base, color: C.text,
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
      display: 'flex', flexDirection: 'column',
    }}>
      <style dangerouslySetInnerHTML={{ __html: ANIM }} />

      {/* Header de la reunión */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 20px', background: C.surface, borderBottom: `1px solid ${C.border}`,
        flexWrap: 'wrap', gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 30, height: 30, background: C.danger, borderRadius: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
              <path d="M8 2 L14 13 L2 13 Z" stroke={C.dangerDark} strokeWidth="1.5" fill="none" />
              <path d="M8 6 L8 10 M8 11.5 L8 12" stroke={C.dangerDark} strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 11, color: C.muted, letterSpacing: '0.08em', fontWeight: 500 }}>
              CLIENT DIRECTOR · FASE 2 — REUNIÓN DE CRISIS
            </div>
            <div style={{ fontSize: 13, color: C.text, fontWeight: 500, marginTop: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>Intel disponible:</span>
              <span style={{ color: intelColor, fontWeight: 600 }}>● {intelLabel}</span>
              <span style={{ color: C.hint, fontFamily: 'ui-monospace, monospace', fontSize: 11 }}>({intelGathered.length}/{totalClues})</span>
            </div>
          </div>
        </div>

        <PanicMeter value={panic} />
      </div>

      {/* Cuerpo */}
      <div style={{
        flex: 1, padding: '24px 20px', display: 'flex', flexDirection: 'column',
        maxWidth: 760, margin: '0 auto', width: '100%',
      }}>
        {/* Cliente: avatar + opening line */}
        <div className="cd-fadein" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 12 }}>
            <ClientAvatar profile={profile} />
            <div>
              <div style={{ fontSize: 15, color: C.text, fontWeight: 600 }}>{profile.name}</div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{profile.title}</div>
              <div style={{ fontSize: 11, color: C.hint, marginTop: 4, fontStyle: 'italic' }}>{profile.personality}</div>
            </div>
          </div>

          {/* Speech bubble */}
          <div style={{
            position: 'relative',
            background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10,
            padding: '14px 18px', marginLeft: 64,
          }}>
            <div style={{
              position: 'absolute', left: -8, top: 14,
              width: 14, height: 14,
              background: C.surface, borderLeft: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`,
              transform: 'rotate(45deg)',
            }} />
            <p style={{ fontSize: 14, color: C.text, lineHeight: 1.6, margin: 0, fontStyle: 'italic' }}>
              "{profile.openingLine}"
            </p>
          </div>
        </div>

        {/* Respuestas o feedback */}
        {!showFeedback ? (
          <div className="cd-fadein">
            <div style={{ fontSize: 11, color: C.muted, letterSpacing: '0.08em', fontWeight: 500, marginBottom: 12 }}>
              ELIGE TU RESPUESTA
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {responses.map((resp, i) => (
                <div
                  key={i}
                  onClick={() => onSelectResponse(resp)}
                  className="cd-resp-card"
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 12,
                    padding: '14px 16px',
                    background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8,
                  }}
                >
                  <div style={{
                    flexShrink: 0,
                    width: 26, height: 26, borderRadius: 5,
                    background: C.raised, border: `1px solid ${C.borderStrong}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 600, color: C.muted,
                    fontFamily: 'ui-monospace, monospace',
                    marginTop: 1,
                  }}>
                    {String.fromCharCode(65 + i)}
                  </div>
                  <p style={{ fontSize: 14, color: C.text, lineHeight: 1.55, margin: 0 }}>
                    {resp.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <FeedbackBlock response={selectedResponse} onContinue={onFinish} />
        )}
      </div>
    </div>
  );
}

// ============================================================================
//  AVATAR DEL CLIENTE
// ============================================================================
function ClientAvatar({ profile }) {
  return (
    <div style={{
      width: 50, height: 50, borderRadius: '50%',
      background: profile.accentColor, color: C.text,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 16, fontWeight: 600, fontFamily: 'Georgia, serif',
      border: `2px solid ${C.borderStrong}`,
      flexShrink: 0,
    }}>
      {profile.initials}
    </div>
  );
}

// ============================================================================
//  PANIC METER
// ============================================================================
function PanicMeter({ value }) {
  const v = Math.min(100, Math.max(0, value));
  const color = v > 70 ? C.danger : v > 40 ? C.warning : C.success;
  const label = v > 70 ? 'CRÍTICO' : v > 40 ? 'ELEVADO' : 'CONTROLADO';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ fontSize: 11, color: C.muted, letterSpacing: '0.08em', fontWeight: 500 }}>PÁNICO</span>
      <div style={{
        position: 'relative', width: 140, height: 8, borderRadius: 4,
        background: C.raised, overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0, width: `${v}%`,
          background: color, transition: 'width .5s ease, background .3s ease',
        }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, color, letterSpacing: '0.05em', fontFamily: 'ui-monospace, monospace' }}>
        {label}
      </span>
    </div>
  );
}

// ============================================================================
//  BLOQUE DE FEEDBACK
// ============================================================================
function FeedbackBlock({ response, onContinue }) {
  const isCorrect = response.correct;
  const color = isCorrect ? C.success : C.danger;
  const bg = isCorrect ? `${C.success}10` : `${C.danger}10`;
  const deltaColor = response.panicDelta < 0 ? C.success : C.danger;

  return (
    <div className="cd-pop">
      <div style={{
        background: bg, border: `1px solid ${color}66`, borderRadius: 10, padding: 16, marginBottom: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: color, color: C.base,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {isCorrect ? (
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M3 8 L7 12 L13 5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M4 4 L12 12 M12 4 L4 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color, letterSpacing: '0.08em', fontWeight: 600 }}>
              {isCorrect ? 'RESPUESTA EFECTIVA' : 'RESPUESTA INADECUADA'}
            </div>
          </div>
          <div style={{
            padding: '4px 10px', borderRadius: 4,
            background: `${deltaColor}20`, border: `1px solid ${deltaColor}55`,
            fontSize: 11, fontWeight: 600, color: deltaColor, fontFamily: 'ui-monospace, monospace',
          }}>
            Pánico {response.panicDelta > 0 ? '+' : ''}{response.panicDelta}
          </div>
        </div>

        <p style={{ fontSize: 13, color: C.text, lineHeight: 1.6, margin: '0 0 12px', fontStyle: 'italic' }}>
          "{response.text}"
        </p>

        <div style={{
          background: C.base, border: `1px solid ${C.border}`, borderRadius: 6,
          padding: '10px 12px',
        }}>
          <div style={{ fontSize: 11, color: C.muted, letterSpacing: '0.08em', fontWeight: 500, marginBottom: 6 }}>
            ANÁLISIS
          </div>
          <p style={{ fontSize: 13, color: C.text, lineHeight: 1.55, margin: 0 }}>
            {response.feedback}
          </p>
        </div>
      </div>

      <button onClick={onContinue} className="cd-btn" style={{
        width: '100%', padding: '12px 16px',
        background: C.role, color: C.roleDark,
        border: `1px solid ${C.role}`, borderRadius: 6,
        fontSize: 14, fontWeight: 500, fontFamily: 'inherit',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      }}>
        Ver resultados <span style={{ fontSize: 16 }}>→</span>
      </button>
    </div>
  );
}

// ============================================================================
//  FASE 3: RESULTADOS
// ============================================================================
function ResultsPhase({ profile, discoveredKeys, totalClues, intelGathered, intelLevel, selectedResponse, panic, onRestart, onContinue }) {
  // Cálculo de grade combinando intel + correctness + panic
  const intelScore = (discoveredKeys.length / totalClues) * 35;
  const correctScore = selectedResponse?.correct ? 35 : 10;
  const panicScore = Math.max(0, 30 - (panic - 50) * 0.6);
  const totalScore = Math.min(100, Math.round(intelScore + correctScore + panicScore));
  const grade = totalScore >= 90 ? 'S' : totalScore >= 75 ? 'A' : totalScore >= 60 ? 'B' : totalScore >= 40 ? 'C' : 'D';
  const gradeColor = { S: C.warning, A: C.success, B: C.info, C: '#FB923C', D: C.danger }[grade];

  return (
    <div style={{
      minHeight: '100vh', background: C.base, color: C.text,
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }}>
      <style dangerouslySetInnerHTML={{ __html: ANIM }} />

      <div className="cd-fadein" style={{
        width: '100%', maxWidth: 620,
        background: C.base, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden',
      }}>
        {/* Hero */}
        <div style={{
          padding: '28px 24px', textAlign: 'center',
          background: C.surface, borderBottom: `1px solid ${C.border}`,
        }}>
          <div style={{ fontSize: 11, color: C.muted, letterSpacing: '0.15em', fontWeight: 500, marginBottom: 12 }}>
            CLIENT DIRECTOR · RESULTADOS
          </div>
          <div style={{
            fontSize: 72, fontWeight: 500, color: gradeColor, lineHeight: 1,
            fontFamily: 'Georgia, serif',
          }}>
            {grade}
          </div>
          <div style={{ fontSize: 13, color: C.muted, marginTop: 10 }}>
            {totalScore}% · Reunión con {profile.name}
          </div>
        </div>

        {/* Stats */}
        <div style={{ padding: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 18 }}>
            <Stat label="INTEL" value={`${discoveredKeys.length}/${totalClues}`} sub={intelLevel.toUpperCase()} color={C.role} />
            <Stat
              label="RESPUESTA"
              value={selectedResponse?.correct ? '✓' : '✗'}
              sub={selectedResponse?.correct ? 'Correcta' : 'Incorrecta'}
              color={selectedResponse?.correct ? C.success : C.danger}
            />
            <Stat
              label="PÁNICO"
              value={`${panic}%`}
              sub={panic <= 40 ? 'Bajo' : panic <= 70 ? 'Medio' : 'Alto'}
              color={panic <= 40 ? C.success : panic <= 70 ? C.warning : C.danger}
            />
          </div>

          {intelGathered.length > 0 && (
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 11, color: C.muted, letterSpacing: '0.08em', fontWeight: 500, marginBottom: 8 }}>
                INTEL DESCUBIERTA
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {intelGathered.map((intel, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 12px',
                    background: `${C.role}10`, border: `1px solid ${C.role}33`,
                    borderRadius: 6,
                  }}>
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8 L7 12 L13 5" stroke={C.role} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span style={{ fontSize: 12, color: C.text, flex: 1 }}>
                      {intel.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onRestart} className="cd-btn" style={{
              flex: 1, background: 'transparent', border: `1px solid ${C.borderStrong}`,
              color: C.text, padding: '11px 14px', borderRadius: 6,
              fontSize: 13, fontWeight: 500, fontFamily: 'inherit',
            }}>
              Otro cliente
            </button>
            <button onClick={onContinue} className="cd-btn" style={{
              flex: 1, background: C.role, color: C.roleDark,
              border: `1px solid ${C.role}`, padding: '11px 14px', borderRadius: 6,
              fontSize: 13, fontWeight: 500, fontFamily: 'inherit',
            }}>
              Continuar →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, sub, color }) {
  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8,
      padding: '12px 14px', textAlign: 'center',
    }}>
      <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 18, fontWeight: 500, color: color || C.text, lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: 10, color: C.muted, letterSpacing: '0.08em', fontWeight: 500, marginTop: 6 }}>
        {label}
      </div>
      {sub && (
        <div style={{ fontSize: 10, color: C.hint, marginTop: 2 }}>
          {sub}
        </div>
      )}
    </div>
  );
}
