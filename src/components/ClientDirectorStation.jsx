// ClientDirectorStation.jsx — Client Director (Phase 2)
// Architecture Chaos — Fase 2
// Two phases: Office Investigation (60s) + Crisis Meeting
// Requiere: React, Zustand (gameStore), Socket.io

import { useState, useEffect, useCallback, useRef } from 'react';
import ImageBasedOffice from './ImageBasedOffice';

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
        { text: "Señor Mendoza, entiendo la presión del board del viernes y la auditoría SOX. Ya identificamos que el Service Domain de Payment Execution tiene un timeout en el gateway SWIFT. Estamos activando el canal de contingencia — en 45 minutos tendremos trazabilidad completa para la auditoría.", correct: true, panicDelta: -25, feedback: "Perfecto. Demuestra conocimiento del perfil, aplica el Service Domain correcto (Payment Execution con Functional Pattern Transact), da timeline concreto y aborda la auditoría." },
        { text: "Señor Mendoza, ya activamos el Service Domain de Transaction Authorization para restablecer el flujo SWIFT. En una hora tendremos un workaround completo y el RCA para su auditoría.", correct: false, panicDelta: 10, feedback: "TRAMPA: Suena técnico y seguro, pero Transaction Authorization evalúa y aprueba transacciones — no ejecuta pagos. El Service Domain correcto para ejecutar pagos es Payment Execution. Confundir autorización con ejecución puede llevar a soluciones incorrectas." },
        { text: "Estamos trabajando en ello. El equipo de TI está investigando y le avisaremos cuando tengamos algo concreto. Estas cosas toman su tiempo.", correct: false, panicDelta: 20, feedback: "Demasiado vago. Este perfil tiene al CEO encima y una auditoría SOX — necesita respuestas concretas con Service Domains identificados y timeline específico, no frases genéricas." },
        { text: "Hemos detectado un fallo en el módulo de pagos. Nuestro equipo necesita entre 24 y 48 horas para hacer un diagnóstico completo y proponer una solución definitiva.", correct: false, panicDelta: 30, feedback: "El timeline de 48 horas es inaceptable. Con 15 años de relación, auditoría SOX inminente y el CEO presionando, necesita resolución en horas, no días. Además no usa ninguna terminología BIAN." }
      ],
      partial: [
        { text: "Señor Mendoza, entendemos la urgencia de los pagos internacionales. Ya estamos aislando el problema en el flujo de Payment Execution. Necesito 10 minutos para confirmar si el Functional Pattern Transact está bloqueado a nivel de gateway o de core, y le doy un timeline preciso.", correct: true, panicDelta: -10, feedback: "Bueno. Reconoce la urgencia, identifica el Service Domain probable, pide un tiempo corto y razonable para confirmar antes de comprometerse." },
        { text: "Señor Mendoza, vamos a levantar inmediatamente un incidente P1 y convocar a todos los equipos involucrados a un war room para resolver esto lo antes posible.", correct: false, panicDelta: 5, feedback: "TRAMPA: Suena decidido y urgente, pero es pura gestión de incidentes sin diagnóstico técnico. No identifica el Service Domain afectado ni ofrece un camino de resolución concreto. El cliente quiere soluciones, no procesos." },
        { text: "Vamos a revisar qué está pasando con el sistema de pagos. Le pido paciencia mientras el equipo investiga la causa raíz del problema.", correct: false, panicDelta: 15, feedback: "Pedir paciencia a un Director de Operaciones con el CEO encima es contraproducente. No demuestra ningún conocimiento previo del problema." },
        { text: "Entiendo su preocupación. Déjeme coordinar con nuestro departamento de infraestructura y le envío un email con la actualización del estado en las próximas horas.", correct: false, panicDelta: 20, feedback: "Email y 'próximas horas' son incompatibles con un perfil que lleva 23 llamadas perdidas. Este cliente necesita resolución inmediata, cara a cara." }
      ],
      none: [
        { text: "Entiendo que es un incidente crítico. Necesito que me confirme: ¿el problema es en la ejecución de las transacciones de pago o en la autorización de las mismas? Con eso puedo activar al equipo correcto de inmediato.", correct: true, panicDelta: 5, feedback: "Sin intel previo, esta pregunta demuestra conocimiento de la diferencia entre Payment Execution y Transaction Authorization — conceptos BIAN clave. Permite dirigir la solución rápido." },
        { text: "Señor Mendoza, dígame exactamente qué Service Domain está fallando y mi equipo lo resuelve en la próxima hora.", correct: false, panicDelta: 10, feedback: "TRAMPA: Suena proactivo, pero pedirle al cliente que identifique el Service Domain es tu trabajo, no el de él. Demuestra que llegaste sin preparación y no entiendes la arquitectura." },
        { text: "Cuénteme los detalles del problema. ¿Desde cuándo ocurre y qué áreas están afectadas?", correct: false, panicDelta: 15, feedback: "Preguntas genéricas de help desk. Un cliente con 15 años de relación espera que ya conozcas su infraestructura." },
        { text: "Buenos días, soy su nuevo punto de contacto. ¿En qué puedo ayudarle hoy?", correct: false, panicDelta: 25, feedback: "Totalmente desconectado del contexto de crisis. No muestra ninguna conciencia de la urgencia." }
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
        { text: "Doctora Herrera, tenemos las métricas de Grafana identificadas. El Service Domain de System Administration muestra degradación en el Functional Pattern Operate — la contención está en el pool de conexiones del core. Le preparo el RCA formal con 3 puntos: causa raíz, mitigación inmediata y plan correctivo alineado con su deadline del jueves.", correct: true, panicDelta: -25, feedback: "Excelente. Habla en datos, aplica System Administration con Functional Pattern Operate correctamente, ofrece RCA estructurado y respeta el deadline del CRO." },
        { text: "Doctora Herrera, el Service Domain de Current Account está generando la latencia por un problema en su Behavior Qualifier de transacciones. Estamos reconfigurando el Control Record para normalizar los tiempos de respuesta.", correct: false, panicDelta: 10, feedback: "TRAMPA: Usa terminología BIAN real (Behavior Qualifier, Control Record) pero el diagnóstico es incorrecto. Current Account gestiona cuentas, no la infraestructura del core. La latencia sistémica es responsabilidad de System Administration (Operate), no de un Service Domain de negocio." },
        { text: "No se preocupe, ya estamos resolviendo el tema de la latencia. Todo estará bien pronto, confíe en nuestro equipo.", correct: false, panicDelta: 25, feedback: "'No se preocupe' es la peor respuesta para una Gerente de Riesgos con certificación ISO 31000 que necesita datos cuantificados, no confianza ciega." },
        { text: "Hemos reiniciado los servidores y la latencia bajó temporalmente a 3 segundos. Seguimos monitoreando la situación para ver si se estabiliza.", correct: false, panicDelta: 15, feedback: "Reiniciar sin RCA es un parche. Este perfil necesita la causa raíz documentada. Un reinicio que 'bajó temporalmente' confirma que el problema va a regresar y no tienes diagnóstico." }
      ],
      partial: [
        { text: "Doctora Herrera, hemos identificado anomalías en el patrón Operate del core bancario. Estamos correlacionando las métricas de latencia con los logs del pool de conexiones para construir el RCA. ¿Puede compartirnos los umbrales definidos en su matriz de riesgo operacional para alinear el análisis?", correct: true, panicDelta: -10, feedback: "Bien. Muestra proceso analítico, referencia el Functional Pattern correcto (Operate), y pide información que demuestra que entiende su framework de riesgos." },
        { text: "Doctora Herrera, ya activamos el Service Domain de Financial Transaction Analysis para detectar el patrón de degradación. Le tendremos los resultados mañana temprano.", correct: false, panicDelta: 5, feedback: "TRAMPA: Financial Transaction Analysis analiza patrones en transacciones financieras (fraude, anomalías de negocio), no latencia de infraestructura. El SD correcto para infraestructura es System Administration. Además, 'mañana' no respeta su deadline del jueves." },
        { text: "Estamos investigando la causa de la latencia. Le enviaremos un reporte cuando lo tengamos completo.", correct: false, panicDelta: 10, feedback: "Demasiado pasivo y sin timeline. Una Gerente de Riesgos con deadline del jueves no acepta 'cuando lo tengamos'." },
        { text: "La latencia probablemente se debe a un pico de transacciones. Recomendamos esperar a que baje la carga y reevaluar mañana.", correct: false, panicDelta: 20, feedback: "Especular sin datos frente a una analítica es suicidio profesional. Ella tiene Grafana abierto y sabe que la carga no es el problema." }
      ],
      none: [
        { text: "Necesito entender el alcance del problema. ¿Puede mostrarme los dashboards de monitoreo y los SLAs comprometidos? Con esos datos puedo determinar si la degradación viene del Functional Pattern Operate del core o de un Service Domain específico.", correct: true, panicDelta: 5, feedback: "Correcto sin información previa. Pide datos técnicos como ella espera y demuestra conocimiento de la diferencia entre problemas de infraestructura (Operate) y de negocio." },
        { text: "Doctora Herrera, ¿cuál es el Service Domain que está presentando el problema? Así asigno al equipo correcto de inmediato.", correct: false, panicDelta: 10, feedback: "TRAMPA: Suena proactivo, pero una Gerente de Riesgos espera que TÚ diagnostiques qué Service Domain falla. Ella reporta métricas, tú identificas la causa." },
        { text: "Déjeme revisar qué está pasando con el core y le llamo en una hora con los resultados.", correct: false, panicDelta: 15, feedback: "Inaceptable. Ella tiene los datos en Grafana frente a ella y espera que tú llegues preparado para analizar juntos, no que te vayas." },
        { text: "Entiendo la preocupación. Voy a escalar este caso a nuestro nivel más alto de soporte para que lo atiendan con prioridad.", correct: false, panicDelta: 20, feedback: "Escalar suena bien pero es evasivo. Ella quiere RCA, no cadenas de escalamiento. Demuestra que no puedes resolver el problema tú mismo." }
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
        { text: "Don Fernando, entiendo la presión de la asamblea. Le propongo esto: corregimos el error del Channel Activity Management con Functional Pattern Fulfill esta semana, y le preparamos un informe ejecutivo con roadmap visual que muestre el plan de mejora de la app. Así usted presenta avance concreto a los socios con un plan creíble.", correct: true, panicDelta: -25, feedback: "Perfecto. Entiende que necesita un 'entregable político' (informe con roadmap) además de la solución técnica. Identifica Channel Activity Management como el SD correcto con Fulfill." },
        { text: "Don Fernando, el problema de la app es que el Service Domain de Customer Offer no está procesando correctamente las solicitudes. Vamos a reconfigurar el Behavior Qualifier de ofertas para que las transferencias vuelvan a funcionar.", correct: false, panicDelta: 10, feedback: "TRAMPA: Customer Offer orquesta ofertas comerciales al cliente, no gestiona canales digitales. Las transferencias en la app dependen de Channel Activity Management (canales) y Payment Execution (pagos). Mezclar Service Domains genera soluciones que no resuelven el problema." },
        { text: "El error 500 en la app es un bug del backend en el endpoint de transferencias. Lo corregiremos en el próximo sprint de desarrollo, probablemente en 3 semanas.", correct: false, panicDelta: 15, feedback: "Demasiado técnico para un perfil político y el timeline se pasa de la asamblea. No le da el 'entregable' que necesita para el directorio." },
        { text: "Don Fernando, con todo respeto, deberían haber actualizado la app cuando se lo recomendamos hace 6 meses. El problema actual es consecuencia de no seguir nuestras recomendaciones.", correct: false, panicDelta: 30, feedback: "Culpar al cliente es la peor estrategia posible con un perfil político que tiene 9 directores observándolo. Le das munición a sus detractores en el directorio." }
      ],
      partial: [
        { text: "Don Fernando, ya estamos al tanto del problema con la app móvil. Le propongo una reunión de 30 minutos para definir qué necesita presentar en la asamblea — alineamos la solución técnica del canal digital con ese timeline político y le preparamos material ejecutivo.", correct: true, panicDelta: -10, feedback: "Bien. Se enfoca en lo que importa al cliente (la narrativa para el directorio) y ofrece ayuda concreta con el material de presentación." },
        { text: "Don Fernando, vamos a priorizar su caso. Activaremos el Service Domain de Customer Relationship Management para gestionar la situación con los socios mientras resolvemos el problema técnico.", correct: false, panicDelta: 5, feedback: "TRAMPA: Suena empático y usa BIAN, pero CRM gestiona la relación general con clientes, no resuelve errores de aplicación. El problema real está en Channel Activity Management. Además, 'gestionar la situación con los socios' no es tu responsabilidad." },
        { text: "Vamos a revisar el problema técnico de la app y le damos un diagnóstico lo antes posible.", correct: false, panicDelta: 10, feedback: "No aborda su preocupación real: la asamblea y el directorio. Un diagnóstico técnico no es lo que necesita presentar." },
        { text: "Le recomiendo que en la asamblea explique que estos problemas son normales en transformación digital y que el equipo está trabajando en ello.", correct: false, panicDelta: 20, feedback: "Decirle qué presentar a su directorio sin resolver el problema es condescendiente. Necesita hechos, no excusas." }
      ],
      none: [
        { text: "Don Fernando, cuénteme más sobre la situación. ¿Qué es lo más importante: resolver el problema técnico de la app o tener material que presentar en la asamblea? Quiero asegurarme de que atacamos lo que usted más necesita primero.", correct: true, panicDelta: 5, feedback: "Sin información previa, esta pregunta abierta le permite al cliente revelar su prioridad real (que probablemente es la asamblea, no el bug)." },
        { text: "Don Fernando, ¿puede darme acceso al log de errores de la app? Necesito ver el stack trace para diagnosticar el problema técnico.", correct: false, panicDelta: 15, feedback: "TRAMPA: Técnicamente correcto pero totalmente desalineado con el perfil. Un Subgerente General de cooperativa no tiene stack traces — necesita soluciones de negocio, no depuración técnica." },
        { text: "Necesitamos abrir un ticket formal con todos los detalles del incidente para poder asignar recursos.", correct: false, panicDelta: 20, feedback: "Pedir burocracia a un cliente en crisis política demuestra total desconexión. El presidente del directorio lo está presionando y tú pides un formulario." },
        { text: "Entiendo. ¿Cuántos usuarios están afectados y desde cuándo está ocurriendo el problema?", correct: false, panicDelta: 10, feedback: "Preguntas operativas válidas pero no conectan con su urgencia real. Él no se preocupa por métricas — se preocupa por su puesto en la asamblea." }
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
        { text: "Alejandra, revisé los logs — el rate limit del Product Directory se disparó por un cambio en el burst policy de las 2am. El Functional Pattern Register del catálogo no soporta la volumetría actual de tu integración. Estoy escalando el throughput del API Gateway y te mando el nuevo rate limit por Slack en 20 minutos. También quiero revisar tu evaluación de proveedores — podemos ofrecerte un tier dedicado.", correct: true, panicDelta: -25, feedback: "Habla su idioma técnico, identifica Product Directory con patrón Register, conoce el cambio en la policy, responde por Slack (su canal preferido) y aborda proactivamente el riesgo de churn." },
        { text: "Alejandra, el problema es que tu integración está golpeando el Service Domain de Party Routing Profile en lugar del Product Directory. El enrutamiento incorrecto causa los rate limits. Necesitamos reconfigurar tu endpoint para apuntar al Control Record correcto.", correct: false, panicDelta: 10, feedback: "TRAMPA: Party Routing Profile gestiona cómo se enruta la atención a clientes (segmentación), no tiene nada que ver con el catálogo de productos ni con APIs. El error dice claramente 'Product Directory'. Inventar un problema de routing cuando el error es de rate limit es perder credibilidad con una CTO." },
        { text: "Lamentamos las molestias. Nuestro equipo de soporte está revisando su caso con prioridad P1 y le enviaremos una actualización por email en las próximas horas.", correct: false, panicDelta: 30, feedback: "Respuesta corporate que una CTO de fintech detesta. Email es el canal equivocado (usa Slack), 'próximas horas' es demasiado lento, y 'lamentamos las molestias' es lenguaje de call center." },
        { text: "Los rate limits están configurados según el contrato vigente. Si necesita mayor throughput, podemos agendar una reunión con el equipo comercial para revisar un upgrade de plan.", correct: false, panicDelta: 20, feedback: "Esconderse detrás del contrato cuando la cliente tiene un documento de evaluación de competidores abierto es suicidio comercial. Ella puede migrar en días." }
      ],
      partial: [
        { text: "Alejandra, estoy viendo los rate limits del API Gateway sobre Product Directory. El patrón Register tiene un cap que pudo haber cambiado. Dame 15 minutos para verificar la burst policy y te paso la solución. ¿Slack o aquí mismo?", correct: true, panicDelta: -10, feedback: "Habla técnico, identifica el SD y patrón, da timeline corto (15 min), y pregunta por canal de preferencia." },
        { text: "Alejandra, probablemente el Functional Pattern Fulfill de tu catálogo está saturado. Vamos a optimizar el Control Record del Product Directory para mejorar el rendimiento.", correct: false, panicDelta: 5, feedback: "TRAMPA: Product Directory usa patrón Register (mantener catálogo), no Fulfill (completar proceso). Confundir patrones frente a una CTO técnica destruye tu credibilidad — ella probablemente conoce BIAN." },
        { text: "Vamos a abrir un ticket con el equipo de infraestructura para que revisen los rate limits de la API y te den una respuesta.", correct: false, panicDelta: 15, feedback: "Demasiado lento y burocrático para una fintech que se mueve rápido. Un ticket implica cola, SLA, escalamientos... ella puede migrar antes de que lo resuelvas." },
        { text: "¿Puedes enviarme los headers de la respuesta HTTP? Necesito ver el X-RateLimit-Remaining para confirmar qué endpoint está limitado.", correct: false, panicDelta: 8, feedback: "Técnicamente razonable pero reactivo. Ella ya te dijo qué API falla (Product Directory). Pedir datos que ella ya te dio demuestra que no leíste su reporte." }
      ],
      none: [
        { text: "Pásame el endpoint exacto y los headers del error. ¿Es el Product Directory completo o un Behavior Qualifier específico del catálogo? Lo reviso directo en el API Gateway.", correct: true, panicDelta: 5, feedback: "Sin contexto previo, pedir datos técnicos específicos y mencionar Behavior Qualifiers es lo correcto con una CTO. Demuestra competencia técnica desde el primer contacto." },
        { text: "Entiendo la urgencia. ¿Cuál es tu volumetría actual de requests por segundo? Así puedo verificar si estás dentro del tier contratado.", correct: false, panicDelta: 10, feedback: "TRAMPA: Suena técnico y razonable, pero implica que el problema podría ser culpa de ella (excedió el tier). Una CTO evaluando competidores no quiere oír que el problema es suyo." },
        { text: "¿Puedes enviarme un email con la descripción completa del problema y los logs? Así lo puedo distribuir al equipo correcto.", correct: false, panicDelta: 25, feedback: "Pedir email a una CTO de fintech que vive en Slack es la señal definitiva de que estás desconectado de su mundo." },
        { text: "Necesito revisar internamente qué cambios se hicieron en la API. Te contacto mañana con una respuesta.", correct: false, panicDelta: 20, feedback: "Mañana es inaceptable. Ella tiene una evaluación de proveedores abierta. Cada hora que pasa sin resolución la acerca más a migrar." }
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
        { text: "Doctor Paredes, entiendo la criticidad del requerimiento de la SBS. Plan: primero, estabilizamos el Service Domain de Compliance Reporting esta semana para desagotar las 847 alertas. Segundo, activamos Financial Transaction Analysis con Functional Pattern Analyze para el filtrado automático de operaciones sospechosas. Le entrego un informe documentado de cada paso para su archivo regulatorio. No le digo 'garantía' porque sería irresponsable — le digo plan concreto con evidencia auditable.", correct: true, panicDelta: -25, feedback: "Excepcional. No promete garantías (un abogado las rechazaría), ofrece plan auditable con los dos Service Domains correctos: Compliance Reporting (generar reportes regulatorios) y Financial Transaction Analysis (analizar patrones sospechosos)." },
        { text: "Doctor Paredes, activamos el Service Domain de Fraud Evaluation para procesar las 847 alertas AML pendientes. Con el Functional Pattern Assess vamos a evaluar cada transacción sospechosa y generar el reporte para la SBS en el plazo establecido.", correct: false, panicDelta: 10, feedback: "TRAMPA: Fraud Evaluation evalúa si una transacción es fraudulenta (caso a caso), pero el problema aquí son alertas AML MASIVAS sin procesar que requieren Compliance Reporting (reporte regulatorio) y Financial Transaction Analysis (análisis de patrones). Fraud Evaluation no genera reportes regulatorios ni procesa colas de alertas." },
        { text: "Le garantizo que todo estará resuelto antes del plazo de la SBS. Puede confiar en nuestro equipo — nunca hemos fallado un deadline regulatorio.", correct: false, panicDelta: 15, feedback: "Un Chief Compliance Officer con certificación CAMS sabe que las garantías verbales no tienen valor legal ni regulatorio. Cualquier garantía verbal puede ser usada en su contra si falla." },
        { text: "Podemos asignar personal adicional para procesar las 847 alertas manualmente mientras arreglamos el sistema automatizado. Así cumplimos con el plazo.", correct: false, panicDelta: 20, feedback: "847 alertas procesadas manualmente implican riesgo de error humano inaceptable en compliance AML. Un falso negativo en una operación sospechosa puede significar multa o responsabilidad penal." }
      ],
      partial: [
        { text: "Doctor Paredes, conozco la presión regulatoria de la SBS. Necesito revisar el estado del sistema para entregarle un plan con pasos documentados y trazables. ¿Puede darme acceso a la cola de alertas y al formato del reporte que la SBS está solicitando? Así alineamos la solución con el requerimiento exacto.", correct: true, panicDelta: -10, feedback: "Bien. Pide datos concretos del regulador (el formato del reporte) y habla de documentación y trazabilidad — exactamente el idioma de un compliance officer." },
        { text: "Doctor Paredes, vamos a configurar el Service Domain de Party Routing Profile para que redirija las alertas AML al equipo de compliance más rápido y puedan procesarlas a tiempo.", correct: false, panicDelta: 8, feedback: "TRAMPA: Party Routing Profile gestiona segmentación y enrutamiento de atención al cliente, no tiene relación con flujos de alertas AML. Suena a solución pero no resuelve el problema de procesamiento de alertas." },
        { text: "Vamos a asignar más recursos técnicos al problema para acelerar la resolución del sistema AML.", correct: false, panicDelta: 10, feedback: "Vago e impreciso. Un CCO necesita un plan con pasos, responsables, fechas y evidencia — no promesas genéricas de 'más recursos'." },
        { text: "Estamos al tanto de la situación. Le sugiero que solicite a la SBS una prórroga mientras resolvemos el problema técnico.", correct: false, panicDelta: 25, feedback: "Sugerir a un CCO que pida prórroga al regulador demuestra desconocimiento total. Pedir prórroga es señal de debilidad regulatoria que puede desencadenar una inspección completa." }
      ],
      none: [
        { text: "Doctor Paredes, necesito entender el requerimiento regulatorio exacto. ¿Tiene el oficio de la SBS para dimensionar el alcance? Quiero asegurarme de que la solución técnica que implementemos genere la evidencia auditable que el regulador espera.", correct: true, panicDelta: 5, feedback: "Correcto sin información previa. Pide el documento regulatorio oficial y habla de 'evidencia auditable' — demuestra que entiende el contexto legal y que la solución técnica debe servir al compliance, no al revés." },
        { text: "Doctor Paredes, ¿cuántas de las 847 alertas son verdaderos positivos? Podríamos descartar las falsas alarmas rápidamente y enfocarnos en las reales.", correct: false, panicDelta: 12, feedback: "TRAMPA: Suena eficiente, pero descartar alertas AML sin procesarlas formalmente es una violación regulatoria. TODAS las alertas deben ser evaluadas, documentadas y clasificadas — incluso las falsas alarmas necesitan un registro de por qué se descartaron." },
        { text: "No se preocupe Doctor Paredes, estos temas regulatorios se resuelven siempre antes de los plazos. Tenemos experiencia con este tipo de situaciones.", correct: false, panicDelta: 30, feedback: "Minimizar riesgo regulatorio frente a un Chief Compliance Officer es la peor señal posible. Él sabe exactamente cuánto cuesta cada día de incumplimiento." },
        { text: "Entiendo la urgencia. Voy a revisar el sistema y le preparo una propuesta para la próxima semana.", correct: false, panicDelta: 18, feedback: "Con el regulador ya habiendo llamado directamente, 'próxima semana' comunica que no entiendes la urgencia. El reloj ya está corriendo." }
      ]
    }
  }
};


// ─── PANIC METER ─────────────────────────────────────────────────────
const PanicMeter = ({ value }) => {
  const color = value > 70 ? '#ef4444' : value > 40 ? '#f59e0b' : '#22c55e';
  const label = value > 70 ? 'CRÍTICO' : value > 40 ? 'ELEVADO' : 'CONTROLADO';
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-zinc-500 font-mono">PÁNICO</span>
      <div className="relative w-32 h-3 bg-zinc-800 rounded-full overflow-hidden">
        <div className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
          style={{ width: `${Math.min(100, Math.max(0, value))}%`, backgroundColor: color }} />
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
  // Tema aleatorio — se elige una vez al montar

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

  // Get available responses based on intel level — shuffled
  const getResponses = useCallback(() => {
    const responses = profile.responses[intelLevel] || profile.responses.none;
    // Deterministic shuffle based on profile + intel to keep order stable during render
    const seed = profile.id.length + intelLevel.length;
    const shuffled = [...responses];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = (seed * (i + 1) * 7 + 3) % (i + 1);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, [profile, intelLevel]);

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
        <div className="relative w-full" style={{ height: '60vh', minHeight: '400px' }}>
          <ImageBasedOffice
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