/**
 * Los siete temas de la exposición, con sus casos de guardia.
 *
 * Cada tema usa los parámetros reales del experimento del curso, de modo que al
 * elegir una medida la escena y la gráfica muestren el cambio. Ninguna medida es
 * un botón mágico: todas mueven variables del modelo, y algunas parecen proteger
 * sin cambiar la física del fenómeno (esas se marcan como falsa protección).
 *
 * Los valores de partida son los de los ejemplos del material, con la coma
 * decimal del curso ya convertida a número.
 */
import type { DailySpec, OptionSpec, CaseSpec } from './types';
import { goal } from './targets';

/* Parámetros derivados que el caso necesita y el experimento no expone. */
export const extra = {
  /** Cresta fase–tierra y sobretensión de maniobra de un caso de disrupción. */
  maniobra: (Um: number, Fv: number) => Math.sqrt(2 / 3) * Um * Fv,
  /** Impulso de rayo supuesto en los casos de cadena (kV cresta). */
  impulsoCadena: 450,
};

/* ======================================================================= 1 */

const casos1: CaseSpec[] = [
  {
    id: 't1-a',
    name: 'Cadena de 245 kV a nivel del mar',
    brief:
      'La cadena ensayada tiene U₅₀ = 700 kV y dispersión del 6 %. La sobretensión de maniobra es de 2,5 p.u. sobre la cresta fase–tierra de 245 kV. El estudio exige que la tensión que falla solo el 5 % de las veces quede por encima del esfuerzo.',
    params: { u50: 700, sigmaPct: 6, pTarget: 5, Um: 245, Fv: 2.5 },
    goals: [goal('t1-cuantil')],
    forecast: 'sostiene',
    lesson: 'Û_man = 2,5·200 = 500 kV y U₅ = 700 − 1,645·42 = 630,9 kV: 131 kV de margen en la cola.',
  },
  {
    id: 't1-b',
    name: 'La misma cadena en un corredor de altura',
    brief:
      'A 3 300 m la densidad relativa cae a 0,65: U₅₀ baja a 507 kV con la misma dispersión del 6 %. El esfuerzo de maniobra sigue en 500 kV.',
    params: { u50: 507, sigmaPct: 6, pTarget: 5, Um: 245, Fv: 2.5 },
    goals: [goal('t1-cuantil')],
    forecast: 'falla',
    lesson:
      'U₅ = 507 − 1,645·30,4 = 457 kV: el esfuerzo de 500 kV queda por encima. La altitud no cambia la tensión; cambia la resistencia del aire.',
  },
  {
    id: 't1-d',
    name: 'Estudio con menos margen',
    brief:
      'Un proyecto con presupuesto ajustado acepta el 20 % de probabilidad de disrupción. La cadena tiene U₅₀ = 700 kV y s = 6 %; el esfuerzo de maniobra es de 2,4 p.u. en 245 kV.',
    params: { u50: 700, sigmaPct: 6, pTarget: 20, Um: 245, Fv: 2.4 },
    goals: [goal('t1-cuantil')],
    forecast: 'sostiene',
    lesson: 'U₂₀ = 700 − 0,842·42 = 664,6 kV frente a 480,1 kV de esfuerzo: margen enorme. Aceptar más riesgo no cambia la física, pero sí el criterio.',
  },
  {
    id: 't1-e',
    name: 'Aislamiento degradado en servicio',
    brief:
      'Tras diez años de servicio la cadena perdió rigidez: U₅₀ bajó a 620 kV con s = 8 %. El esfuerzo de maniobra se mantiene en 2,5 p.u. sobre 245 kV y el objetivo es el 10 %.',
    params: { u50: 620, sigmaPct: 8, pTarget: 10, Um: 245, Fv: 2.5 },
    goals: [goal('t1-cuantil'), goal('t1-firmeza')],
    forecast: 'sostiene',
    lesson: 'U₁₀ = 620 − 1,282·49,6 = 556,4 kV contra 500,1 kV: pasa con 56 kV, la mitad del margen que tenía de nuevo. La degradación no se ve en la placa.',
  },
  {
    id: 't1-c',
    name: 'Lote con dispersión alta',
    brief:
      'Un lote sale con dispersión del 9 % de U₅₀. En la misma línea de 245 kV la sobretensión de maniobra sube a 3,2 p.u. y el objetivo de probabilidad es el 10 %.',
    params: { u50: 700, sigmaPct: 9, pTarget: 10, Um: 245, Fv: 3.2 },
    goals: [goal('t1-cuantil'), goal('t1-dispersion')],
    forecast: 'falla',
    lesson:
      'Û_man = 3,2·200 = 640 kV y U₁₀ = 700 − 1,282·63 = 619 kV: no alcanza. Con dispersión del 6 %, U₁₀ subiría a 646 kV y pasaría.',
  },
];

const opciones1: OptionSpec[] = [
  {
    id: 't1-subir50',
    label: 'Reformar la cadena: U₅₀ + 80 kV',
    icon: 'chain',
    apply: (p) => ({ u50: p.u50 + 80 }),
    effect: 'Sube la mediana: toda la curva se desplaza y el cuantil sube con ella.',
  },
  {
    id: 't1-bajar',
    label: 'Bajar la sobretensión a 2,0 p.u.',
    icon: 'bolt',
    apply: () => ({ Fv: 2 }),
    effect: 'Menos cresta que resistir, con el mismo aislamiento.',
  },
  {
    id: 't1-control',
    label: 'Control de calidad: σ al 6 %',
    icon: 'target',
    apply: (p) => ({ sigmaPct: Math.min(6, p.sigmaPct) }),
    effect: 'Estrechar la campana reduce la cola sin mover la mediana. Es la palanca menos intuitiva y la más eficaz.',
  },
  {
    id: 't1-objetivo',
    label: 'Declarar el objetivo de probabilidad en el 50 %',
    icon: 'info',
    apply: () => ({ pTarget: 50 }),
    effect: 'Cambia el criterio de aceptación, no el aislamiento.',
    falseProtection:
      'Aceptar el 50 % de disrupción convierte a U₅₀ en «cumple». El criterio de la exposición es justamente no confundir la mediana con la tensión segura.',
  },
  {
    id: 't1-medir',
    label: 'Medir U₅₀ con más ensayos',
    icon: 'eye',
    apply: () => ({}),
    effect: 'Mejora el conocimiento del valor, no el valor.',
    falseProtection:
      'Más ensayos reducen la incertidumbre de la estimación, pero no modifican ni la rigidez ni la distribución del aislamiento.',
  },
];

const tema1: DailySpec = {
  mission: 'Decidir con una distribución, no con un número',
  brief:
    'U₅₀ no es «la tensión que aguanta»: es la que falla la mitad de las veces. Aquí se juega con la mediana, la dispersión y el criterio de probabilidad aceptable.',
  cases: casos1,
  options: opciones1,
  debrief: {
    good: 'Trabajaste con la cola de la distribución y no solo con el margen entre dos números.',
    bad: 'Recuerda: U₅₀ es una mediana. Un margen grande sobre U₅₀ no garantiza nada si la dispersión es alta.',
  },
  tip: 'La dispersión relativa s se mide respecto de U₅₀, no respecto de la tensión nominal. Es un dato del proceso de fabricación y del tipo de onda.',
};

/* ======================================================================= 2 */

const casos2: CaseSpec[] = [
  {
    id: 't2-a',
    name: '245 kV en contaminación fuerte',
    brief:
      'El estudio exige k_f = 25 mm/kV y hay discos de 292 mm con paso de 0,146 m. La cadena montada tiene 20 discos y la torre admite 2,95 m.',
    params: { Um: 245, kf: 25, lfDisc: 292, pitch: 0.146, nInst: 20, delta: 0.724, impulso: 450, cadMax: 2.95 },
    goals: [goal('t2-fuga'), goal('t2-largo')],
    forecast: 'falla',
    lesson:
      '20 discos dan 5 840 mm, un 4,7 % por debajo de los 6 125 exigidos. El criterio de fuga no se cumple y el resto del cálculo no importa.',
  },
  {
    id: 't2-b',
    name: 'La fuga cumple, la torre no',
    brief:
      'En la misma línea se monta la cadena que exige la fuga con discos de 292 mm, y la torre admite 3,9 m. El criterio de contaminación está cumplido, pero hay que verificar la geometría.',
    params: { Um: 245, kf: 25, lfDisc: 292, pitch: 0.146, nInst: 27, delta: 0.724, impulso: 450, cadMax: 3.9 },
    goals: [goal('t2-fuga'), goal('t2-largo')],
    forecast: 'falla',
    lesson:
      '27 discos cumplen la fuga (7 884 mm) pero miden 3,94 m y la torre admite 3,9: faltan 4 cm. Un criterio aprobado no salva los demás.',
  },
  {
    id: 't2-d',
    name: '69 kV con discos de 146 mm',
    brief:
      'Línea de 69 kV, k_f = 20 mm/kV y discos de 146 mm de fuga con paso de 0,146 m. Cadena montada: 10 discos; la torre admite 1,8 m.',
    params: { Um: 69, kf: 20, lfDisc: 146, pitch: 0.146, nInst: 10, delta: 0.9, impulso: 200, cadMax: 1.8 },
    goals: [goal('t2-fuga'), goal('t2-largo')],
    forecast: 'sostiene',
    lesson: '20·69 = 1 380 mm; 1 380/146 = 9,45 → 10 discos. Diez discos de 0,146 m son 1,46 m: cabe en la torre.',
  },
  {
    id: 't2-e',
    name: 'Cambio de criterio por nuevo estudio',
    brief:
      'La misma línea de 69 kV recibe un estudio actualizado: k_f sube a 25 mm/kV por la cercanía a una cementera. Los discos siguen siendo de 146 mm y la cadena montada es de 10.',
    params: { Um: 69, kf: 25, lfDisc: 146, pitch: 0.146, nInst: 10, delta: 0.9, impulso: 200, cadMax: 2.0 },
    goals: [goal('t2-fuga'), goal('t2-largo')],
    forecast: 'falla',
    lesson: '25·69 = 1 725 mm; 1 725/146 = 11,8 → 12 discos = 1,75 m. Dos discos más y la cadena sigue cabiendo: el problema es solo la fuga.',
  },
  {
    id: 't2-c',
    name: '145 kV con discos cortos',
    brief:
      'Línea de 145 kV, k_f = 25 mm/kV, discos de 250 mm y paso de 0,146 m. Cadena instalada: 14 discos. La torre admite 2,7 m.',
    params: { Um: 145, kf: 25, lfDisc: 250, pitch: 0.146, nInst: 14, delta: 0.85, impulso: 300, cadMax: 2.7 },
    goals: [goal('t2-fuga')],
    forecast: 'falla',
    lesson: '3 625/250 = 14,5 → 15 discos. Faltaba uno (250 mm de fuga), pero ese uno es toda la diferencia.',
  },
];

const opciones2: OptionSpec[] = [
  {
    id: 't2-add',
    label: 'Montar los discos que exige la fuga',
    icon: 'chain',
    apply: (p) => ({ nInst: Math.ceil((p.kf * p.Um) / p.lfDisc - 1e-9) }),
    effect: 'Calcula el mínimo por fuga y monta exactamente ese número de discos.',
  },
  {
    id: 't2-denso',
    label: 'Montar la cadena con paso de 0,125 m',
    icon: 'tower',
    apply: (p) => ({ pitch: 0.125, nInst: Math.ceil((p.kf * p.Um) / p.lfDisc - 1e-9) }),
    effect: 'Discos más juntos: la misma fuga ocupa menos altura de torre.',
  },
  {
    id: 't2-larga',
    label: 'Cambiar a discos de 380 mm',
    icon: 'chain',
    apply: (p) => ({ lfDisc: 380, nInst: Math.ceil((p.kf * p.Um) / 380 - 1e-9) }),
    effect: 'Con más fuga por unidad se cumple el criterio con menos discos y la cadena no crece.',
  },
  {
    id: 't2-ampliar',
    label: 'Ampliar la torre para que admita la cadena',
    icon: 'tower',
    apply: (p) => ({ cadMax: Math.max(p.cadMax, +((p.nInst * p.pitch) + 0.2).toFixed(2)) }),
    effect: 'Sube el límite geométrico de la torre para que la cadena montada quepa.',
  },
  {
    id: 't2-lavar',
    label: 'Lavar los aisladores cada año',
    icon: 'wind',
    apply: () => ({}),
    effect: 'El lavado es mantenimiento: no cambia el criterio de fuga del cálculo.',
    falseProtection:
      'Sin datos de ensuciamiento medidos, k_f sigue siendo el mismo. El lavado mejora la operación, pero no mueve la cuenta.',
  },
  {
    id: 't2-grasa',
    label: 'Recubrir con grasa siliconada',
    icon: 'eye',
    apply: () => ({}),
    effect: 'Puede ayudar en campo, pero no es una variable de este cálculo.',
    falseProtection: 'La grasa cambia el comportamiento superficial; no suma milímetros de fuga al criterio.',
  },
];

const tema2: DailySpec = {
  mission: 'Elegir la cadena por contaminación y verificar la torre',
  brief:
    'La cadena se dimensiona por fuga, pero cada disco añadido la alarga y la torre tiene un límite. Este día se ven las dos caras del mismo cálculo.',
  cases: casos2,
  options: opciones2,
  debrief: {
    good: 'Elegiste la cadena por el criterio correcto y verificaste el efecto de alargarla.',
    bad: 'La cadena no se elige por la tensión nominal: manda la contaminación y después se verifica todo lo demás.',
  },
  tip: 'No mezcles metodologías: D = (V/√3)·k_f/k_a usa tensión fase–tierra; el ejercicio de clase usa 245 kV entre fases. Hay que declarar la base.',
};

/* ======================================================================= 3 */

const casos3: CaseSpec[] = [
  {
    id: 't3-a',
    name: 'Cadena de 3,066 m con 30° de viento',
    brief:
      'La distancia en reposo es 3,50 m y el estudio exige 2,42 m. Con el viento de diseño la cadena se inclina 30°.',
    params: { L: 3.066, theta: 30, d0: 3.5, required: 2.42 },
    goals: [goal('t3-separacion')],
    forecast: 'falla',
    lesson: 'Δx = 3,066·sen 30° = 1,533 m. La distancia baja a 1,967 m: faltan 45 cm sobre lo exigido.',
  },
  {
    id: 't3-b',
    name: 'Vano corto con viento moderado',
    brief: 'Cadena de 1,80 m inclinada 25° con una distancia en reposo de 3,40 m y una exigencia de 2,45 m.',
    params: { L: 1.8, theta: 25, d0: 3.4, required: 2.45 },
    goals: [goal('t3-separacion'), goal('t3-desplazamiento')],
    forecast: 'sostiene',
    lesson: 'Δx = 0,76 m y d_h = 2,64 m: pasa la separación y el desplazamiento queda bajo la mitad de d₀.',
  },
  {
    id: 't3-d',
    name: 'Cadena larga y viento moderado',
    brief:
      'Cadena de 3,07 m inclinada 15°, distancia en reposo de 3,80 m y separación exigida de 3,00 m.',
    params: { L: 3.066, theta: 15, d0: 3.8, required: 3.0 },
    goals: [goal('t3-separacion')],
    forecast: 'sostiene',
    lesson: 'Δx = 0,79 m; d_h = 3,01 m frente a 3,00 exigidos: pasa por un centímetro. Los márgenes de un centímetro no son márgenes.',
  },
  {
    id: 't3-e',
    name: 'Vano con viento de frente y cadena corta',
    brief:
      'Cadena de 1,5 m con 40° de inclinación, distancia en reposo de 4,0 m y separación exigida de 3,1 m.',
    params: { L: 1.5, theta: 40, d0: 4.0, required: 3.0 },
    goals: [goal('t3-separacion'), goal('t3-desplazamiento')],
    forecast: 'sostiene',
    lesson: 'Δx = 0,96 m; d_h = 3,04 m frente a 3,00 exigidos: pasa por 4 cm. El desplazamiento es menos de la mitad de d₀, pero el margen real es mínimo.',
  },
  {
    id: 't3-c',
    name: 'Torre con viento extremo',
    brief:
      'Cadena de 2,50 m que puede inclinarse 45° con viento extremo, distancia en reposo de 3,60 m y una separación exigida de 2,50 m.',
    params: { L: 2.5, theta: 45, d0: 3.6, required: 2.5 },
    goals: [goal('t3-separacion')],
    forecast: 'falla',
    lesson: 'Δx = 1,77 m: la separación real cae a 1,83 m. El viento extremo no es el de operación normal.',
  },
];

const opciones3: OptionSpec[] = [
  {
    id: 't3-d0',
    label: 'Cruceta más larga: d₀ + 0,7 m',
    icon: 'tower',
    apply: (p) => ({ d0: +(p.d0 + 0.7).toFixed(2) }),
    effect: 'Es la palanca directa: la distancia disponible crece sin tocar la cadena.',
  },
  {
    id: 't3-short',
    label: 'Acortar la cadena de suspensión',
    icon: 'chain',
    apply: (p) => ({ L: +(p.L * 0.7).toFixed(3) }),
    effect: 'Una cadena más corta se desplaza menos para el mismo ángulo, pero reduce la fuga.',
  },
  {
    id: 't3-wind',
    label: 'Adoptar θ = 20° por estudio de viento',
    icon: 'wind',
    apply: () => ({ theta: 20 }),
    effect: 'Solo es legítimo si el estudio del sitio lo respalda; si no, es maquillar el caso.',
  },
  {
    id: 't3-bajar',
    label: 'Aceptar la separación que hay',
    icon: 'target',
    apply: (p) => ({ required: Math.max(0.5, +(p.d0 - p.L * Math.sin((p.theta * Math.PI) / 180)).toFixed(2)) }),
    effect: 'Cambia el requisito, no la física.',
    falseProtection:
      'Igualar la exigencia a la distancia que ya hay hace pasar la cuenta sin mover la fase ni un milímetro. La exigencia es un dato del estudio, no un parámetro libre.',
  },
  {
    id: 't3-aislador',
    label: 'Poner un aislador más grande',
    icon: 'eye',
    apply: () => ({}),
    effect: 'No cambia ni la posición ni la distancia.',
    falseProtection: 'Un aislador de mayor diámetro no acerca ni aleja la fase de la torre: la palanca es d₀ o L.',
  },
];

const tema3: DailySpec = {
  mission: 'Mantener la distancia fase–estructura con viento',
  brief:
    'Una separación que cumple en reposo puede dejar de cumplir cuando la cadena se inclina. El reto es distinguir la palanca geométrica real de los parches que solo cambian el número.',
  cases: casos3,
  options: opciones3,
  debrief: {
    good: 'Atacaste la geometría —d₀ o L— y no la cifra del requisito.',
    bad: 'Dos trampas frecuentes: bajar la exigencia o añadir un aislador no cambian la posición real de la fase.',
  },
  tip: 'Los 2,42 m son un requisito supuesto del ejercicio; en un proyecto salen de la norma y del estudio de viento del sitio.',
};

/* ======================================================================= 4 */

const casos4: CaseSpec[] = [
  {
    id: 't4-a',
    name: 'Torre de 245 kV con la guarda a un lado',
    brief:
      'La guarda está 5 m sobre la fase y 4 m a un lado (α = 38,7°). La corriente de diseño es 31 kA. ¿Cumple el apantallamiento?',
    params: { dh: 5, dx: 4, current: 31 },
    goals: [goal('t4-angulo')],
    forecast: 'falla',
    lesson: '38,7° supera el límite de 30°. El radio de atracción (93,2 m) es enorme, pero el ángulo delata la exposición.',
  },
  {
    id: 't4-b',
    name: 'Guarda más alta y más centrada',
    brief: 'Guarda 6,5 m sobre la fase y 2,5 m a un lado, con la misma corriente de 31 kA.',
    params: { dh: 6.5, dx: 2.5, current: 31 },
    goals: [goal('t4-angulo'), goal('t4-electro')],
    forecast: 'sostiene',
    lesson: 'α = 21,0° y una separación de 7,0 m: geometría holgada para el mismo rayo.',
  },
  {
    id: 't4-d',
    name: 'Torre baja con guarda centrada',
    brief: 'En 115 kV la guarda va 4 m sobre la fase y 1,5 m a un lado; la corriente de diseño es 20 kA.',
    params: { dh: 4, dx: 1.5, current: 20 },
    goals: [goal('t4-angulo'), goal('t4-electro')],
    forecast: 'sostiene',
    lesson: 'α = 20,6° y r_c = 70,1 m: geometría cómoda para un rayo de 20 kA.',
  },
  {
    id: 't4-e',
    name: 'Guarda descolgada hacia el lado de la fase',
    brief:
      'La misma torre, pero la guarda quedó a 3 m sobre la fase y 4,5 m a un lado por un error de montaje. Corriente de diseño 20 kA.',
    params: { dh: 3, dx: 4.5, current: 20 },
    goals: [goal('t4-angulo')],
    forecast: 'falla',
    lesson: 'α = 56,3°: la fase queda prácticamente fuera de la sombra. Un error de montaje de metro y medio arruina el apantallamiento.',
  },
  {
    id: 't4-c',
    name: 'Línea de 500 kV con guarda lateral',
    brief: 'En 500 kV la guarda va 7 m sobre la fase y 6 m a un lado; la corriente de diseño sube a 40 kA.',
    params: { dh: 7, dx: 6, current: 40 },
    goals: [goal('t4-angulo')],
    forecast: 'falla',
    lesson: 'α = 40,6°: aunque r_c = 110 m, el ángulo delata una fase demasiado expuesta.',
  },
];

const opciones4: OptionSpec[] = [
  {
    id: 't4-alta',
    label: 'Subir la guarda 2,5 m',
    icon: 'tower',
    apply: (p) => ({ dh: p.dh + 2.5 }),
    effect: 'Aumenta Δh, reduce el ángulo y sube la guarda en la silueta de la torre.',
  },
  {
    id: 't4-centro',
    label: 'Acercar la guarda al eje de la fase',
    icon: 'target',
    apply: (p) => ({ dx: +(p.dx * 0.6).toFixed(2) }),
    effect: 'Reduce Δx: el ángulo cae y la fase queda más dentro de la sombra.',
  },
  {
    id: 't4-segunda',
    label: 'Instalar una segunda guarda',
    icon: 'shield',
    apply: (p) => ({ dx: Math.max(0.5, +(p.dx - 2.5).toFixed(2)), dh: +(p.dh + 1).toFixed(1) }),
    effect: 'Dos guardas cubren lo que una sola deja expuesto hacia el lado exterior.',
  },
  {
    id: 't4-resist',
    label: 'Bajar la resistencia de puesta a tierra',
    icon: 'ground',
    apply: () => ({}),
    effect: 'Mejora el flameo inverso, no la probabilidad de que el rayo alcance la fase.',
    falseProtection:
      'La puesta a tierra actúa después de que el rayo impactó la guarda. La falla de apantallamiento ocurre antes: el líder alcanza la fase directamente.',
  },
  {
    id: 't4-angulo',
    label: 'Declarar el ángulo desde la horizontal',
    icon: 'arrows',
    apply: () => ({}),
    effect: 'Cambia la convención del dibujo, no la posición de la guarda.',
    falseProtection:
      'La convención debe declararse, pero no altera la geometría: 38,7° desde la vertical son 51,3° desde la horizontal en el mismo sitio.',
  },
];

const tema4: DailySpec = {
  mission: 'Decidir dónde va el cable de guarda',
  brief:
    'El ángulo describe la geometría; el método electrogeométrico añade la corriente del rayo. Aquí se usan los dos y se separa el apantallamiento del flameo inverso.',
  cases: casos4,
  options: opciones4,
  debrief: {
    good: 'Moviste la geometría, que es lo único que cambia qué elemento alcanza el líder.',
    bad: 'Recuerda el orden físico: primero el rayo elige a quién golpear (apantallamiento) y solo después importa la puesta a tierra (flameo inverso).',
  },
  tip: 'Falla de apantallamiento y flameo inverso son mecanismos distintos: el primero golpea la fase, el segundo golpea la torre y descarga hacia la fase.',
};

/* ======================================================================= 5 */

const casos5: CaseSpec[] = [
  {
    id: 't5-a',
    name: 'Torre con 10 kA y R_t = 15 Ω',
    brief:
      'Un rayo de 10 kA entra por la torre. R_t = 15 Ω, L = 1 µH y di/dt = 10 kA/µs. La cadena soporta 700 kV y el objetivo de R_t es 20 Ω.',
    params: { current: 10, Rt: 15, L: 1, diDt: 10, Ucad: 700, Vmax: 300, Rref: 20 },
    goals: [goal('t5-potencial'), goal('t5-personas')],
    forecast: 'sostiene',
    lesson: 'V_t = 150 + 10 = 160 kV: margen amplio, pero el término inductivo ya aporta un 6 %.',
  },
  {
    id: 't5-b',
    name: 'Rayo severo y suelo seco',
    brief: 'La misma torre recibe 20 kA y el suelo se secó: R_t subió a 40 Ω.',
    params: { current: 20, Rt: 40, L: 1, diDt: 10, Ucad: 700, Vmax: 300, Rref: 20 },
    goals: [goal('t5-potencial'), goal('t5-personas')],
    forecast: 'falla',
    lesson: 'V_t = 800 + 10 = 810 kV > 700 kV: flameo inverso. La resistencia explica casi todo el problema.',
  },
  {
    id: 't5-d',
    name: 'Torre muy alta en terreno rocoso',
    brief:
      'Torre de 80 m: L = 12 µH y di/dt = 20 kA/µs con 25 kA. La resistencia es baja (8 Ω) pero el suelo no permite mejorarla más.',
    params: { current: 35, Rt: 12, L: 12, diDt: 25, Ucad: 700, Vmax: 300, Rref: 20 },
    goals: [goal('t5-potencial')],
    forecast: 'falla',
    lesson: 'V_t = 420 + 300 = 720 kV: flameo inverso con R_t de solo 12 Ω. El 42 % del potencial viene de L·di/dt: en torres altas la inductancia manda.',
  },
  {
    id: 't5-e',
    name: 'Rayo múltiple con tierra enmallada',
    brief:
      'Subestación con malla: R_t = 3 Ω. Un rayo de 40 kA con L = 2 µH y di/dt = 15 kA/µs entra por el pararrayos de la torre.',
    params: { current: 40, Rt: 3, L: 2, diDt: 15, Ucad: 700, Vmax: 300, Rref: 20 },
    goals: [goal('t5-potencial'), goal('t5-personas')],
    forecast: 'sostiene',
    lesson: 'V_t = 120 + 30 = 150 kV: la malla hace el trabajo. Con 40 kA una resistencia de 20 Ω habría dado 800 kV.',
  },
  {
    id: 't5-c',
    name: 'Torre alta con inductancia dominante',
    brief:
      'Torre de 60 m: L = 8 µH y di/dt = 15 kA/µs con 20 kA. La puesta a tierra ya está mejorada a 10 Ω.',
    params: { current: 20, Rt: 10, L: 8, diDt: 15, Ucad: 700, Vmax: 350, Rref: 20 },
    goals: [goal('t5-potencial'), goal('t5-personas')],
    forecast: 'sostiene',
    lesson:
      'V_t = 200 + 120 = 320 kV: cumple, pero el término inductivo (120 kV) es más de la mitad de la caída resistiva. En torres altas, bajar R_t ya no es la palanca principal.',
  },
];

const opciones5: OptionSpec[] = [
  {
    id: 't5-rt',
    label: 'Contrapesos: bajar R_t a 10 Ω',
    icon: 'ground',
    apply: (p) => ({ Rt: Math.min(p.Rt, 10) }),
    effect: 'Reduce la caída resistiva I·R_t, que suele ser el término dominante.',
  },
  {
    id: 't5-electrodos',
    label: 'Electrodos profundos: R_t al 60 %',
    icon: 'ground',
    apply: (p) => ({ Rt: Math.max(5, +(p.Rt * 0.6).toFixed(1)) }),
    effect: 'Baja la resistencia efectiva al aumentar el área de contacto con el suelo.',
  },
  {
    id: 't5-cadena',
    label: 'Reforzar la cadena a 900 kV',
    icon: 'chain',
    apply: () => ({ Ucad: 900 }),
    effect: 'Sube el umbral de flameo inverso, pero no reduce la elevación de potencial ni protege a las personas.',
  },
  {
    id: 't5-varilla',
    label: 'Clavar una varilla y medir 5 Ω',
    icon: 'eye',
    apply: () => ({}),
    effect: 'La medición a baja frecuencia no describe la respuesta impulsiva.',
    falseProtection:
      'El rayo tiene un frente de microsegundos: mandan la inductancia y la ionización del suelo. Una R medida a 50 Hz no garantiza el comportamiento impulsivo.',
  },
  {
    id: 't5-senal',
    label: 'Señalizar la torre para el público',
    icon: 'shield',
    apply: () => ({}),
    effect: 'No cambia ni la corriente ni el potencial de la torre.',
    falseProtection: 'La señalización no modifica las tensiones de paso y contacto; hay que medir el potencial superficial.',
  },
];

const tema5: DailySpec = {
  mission: 'Evitar el flameo inverso y entender sus límites',
  brief:
    'El rayo que entra por la torre eleva su potencial. Rara vez basta con R = V/I: el frente de corriente añade L·di/dt y, en torres altas, ese término deja de ser despreciable.',
  cases: casos5,
  options: opciones5,
  debrief: {
    good: 'Combinaste la caída resistiva y la inductiva en lugar de mirar solo la resistencia medida.',
    bad: 'La resistencia de tierra explica buena parte del problema, pero no toda: el frente de la corriente y la geometría de la torre también cuentan.',
  },
  tip: 'Una R baja no demuestra seguridad para las personas: se evalúan tensiones de paso y de contacto en la superficie del terreno.',
};

/* ======================================================================= 6 */

const casos6: CaseSpec[] = [
  {
    id: 't6-a',
    name: 'Pararrayos a 6 m del equipo',
    brief:
      'Sistema de 245 kV: U_c = 150 kV, U_res = 600 kV, BIL = 1 050 kV. El pararrayos está a 6 m del transformador y el margen mínimo es del 20 %.',
    params: { Um: 245, Uc: 150, Ures: 600, withstand: 1050, distance: 6, Lconn: 1, diDt: 10, requiredMargin: 20 },
    goals: [goal('t6-margen'), goal('t6-tov')],
    forecast: 'sostiene',
    lesson: 'U_eq = 660 kV y M = 59,1 %: margen holgado, y la TOV entra con 45 kV de sobra.',
  },
  {
    id: 't6-b',
    name: 'Pararrayos a 8 m y BIL ajustado',
    brief:
      'La bahía nueva obliga a poner el pararrayos a 8 m. El transformador tiene BIL = 750 kV; U_res = 600 kV y U_c = 150 kV.',
    params: { Um: 245, Uc: 150, Ures: 600, withstand: 750, distance: 8, Lconn: 1, diDt: 10, requiredMargin: 20 },
    goals: [goal('t6-margen')],
    forecast: 'falla',
    lesson: 'U_eq = 680 kV y M = 10,3 %: la cuenta da positivo, pero el criterio pide 20 %. Un margen positivo no es suficiente.',
  },
  {
    id: 't6-d',
    name: '115 kV con pararrayos lejos',
    brief:
      'Sistema de 115 kV: U_c = 70 kV, U_res = 280 kV, BIL = 550 kV y el pararrayos está a 12 m con L_c = 1,2 µH/m.',
    params: { Um: 115, Uc: 70, Ures: 280, withstand: 550, distance: 18, Lconn: 1.2, diDt: 10, requiredMargin: 20 },
    goals: [goal('t6-margen'), goal('t6-tov')],
    forecast: 'falla',
    lesson:
      'U_eq = 280 + 216 = 496 kV y M = 10,9 %: la cuenta es positiva y aun así incumple el 20 %. La TOV (83 kV) sí cabe en 1,3·U_c = 91 kV: lo que falla es la conexión.',
  },
  {
    id: 't6-e',
    name: 'Equipo con BIL reforzado',
    brief:
      'La misma bahía de 115 kV con BIL = 650 kV, pararrayos a 18 m, U_res = 280 kV y L_c = 1,2 µH/m.',
    params: { Um: 115, Uc: 70, Ures: 280, withstand: 650, distance: 18, Lconn: 1.2, diDt: 10, requiredMargin: 20 },
    goals: [goal('t6-margen'), goal('t6-tov')],
    forecast: 'sostiene',
    lesson: 'U_eq = 496 kV y M = 31 %: el BIL reforzado compra casi el margen que falta, sin mover el pararrayos.',
  },
  {
    id: 't6-c',
    name: 'Descargador con U_c justa',
    brief:
      'Sistema de 500 kV con U_c = 330 kV. El pararrayos está a 10 m, con U_res = 850 kV, y el equipo soporta 1 425 kV.',
    params: { Um: 500, Uc: 250, Ures: 850, withstand: 1425, distance: 10, Lconn: 1, diDt: 10, requiredMargin: 20 },
    goals: [goal('t6-tov')],
    forecast: 'falla',
    lesson:
      'TOV = 1,25·500/√3 = 360,8 kV contra una capacidad de 1,3·250 = 325 kV: el descargador no aguanta la sobretensión temporal. La U_c se elige para la TOV, no para la tensión nominal.',
  },
];

const opciones6: OptionSpec[] = [
  {
    id: 't6-acercar',
    label: 'Instalar el pararrayos junto al equipo (2 m)',
    icon: 'target',
    apply: () => ({ distance: 2 }),
    effect: 'Corta la caída inductiva L_c·(di/dt)·d: la mejora más barata de la coordinación.',
  },
  {
    id: 't6-cable',
    label: 'Conexiones más cortas y planas (L_c = 0,5)',
    icon: 'bolt',
    apply: () => ({ Lconn: 0.5 }),
    effect: 'Menos inductancia por metro: misma distancia, menos caída.',
  },
  {
    id: 't6-uc',
    label: 'Subir U_c a 396 kV',
    icon: 'shield',
    apply: (p) => ({ Uc: Math.max(p.Uc, 396) }),
    effect: 'Amplía la capacidad TOV, pero no el margen de impulso.',
  },
  {
    id: 't6-margen',
    label: 'Aceptar el margen porque «es positivo»',
    icon: 'info',
    apply: () => ({}),
    effect: 'Un margen positivo no equivale a cumplir el criterio.',
    falseProtection:
      'El criterio del curso exige al menos 20 % de margen. Un 10 % es positivo y aun así insuficiente: la cuenta pasa, la instalación no.',
  },
  {
    id: 't6-tierra',
    label: 'Mejorar la puesta a tierra del pararrayos',
    icon: 'ground',
    apply: () => ({}),
    effect: 'Importa, pero no está en el término que domina este margen.',
    falseProtection:
      'La puesta a tierra del descargador reduce el potencial de su base; el margen que se calcula aquí depende de U_res y de la conexión de fase.',
  },
];

const tema6: DailySpec = {
  mission: 'Que el equipo vea menos de lo que soporta',
  brief:
    'El descargador limita la tensión en sus bornes; el equipo protegido está más lejos. Este día se juega con la distancia, la inductancia de las conexiones y el criterio de margen.',
  cases: casos6,
  options: opciones6,
  debrief: {
    good: 'Trataste la conexión como parte del sistema de protección, no como un cable de colores.',
    bad: 'El margen positivo no basta: el criterio pide 20 % y la caída inductiva crece metro a metro.',
  },
  tip: 'U_c, U_r y U_res no son lo mismo. Subir U_c mejora la TOV y puede empeorar el nivel residual.',
};

/* ======================================================================= 7 */

const casos7: CaseSpec[] = [
  {
    id: 't7-a',
    name: 'Conductor de 1,5 cm en 220 kV',
    brief:
      'f = 60 Hz, δ = 0,90, r = 1,5 cm, s = 600 cm. La tensión de incepción medida es U₀ = 170 kV. El presupuesto de pérdidas es 12 kW/km.',
    params: { f: 60, delta: 0.9, r: 1.5, s: 600, U: 220, U0: 170, budget: 12 },
    goals: [goal('t7-perdidas'), goal('t7-incepcion')],
    forecast: 'falla',
    lesson: 'P = 28,6 kW/km: con 50 kV sobre el umbral, el cuadrado del exceso se come el presupuesto.',
  },
  {
    id: 't7-b',
    name: 'Superficie limpia y tiempo seco',
    brief: 'El mismo conductor, pero con U₀ = 190 kV por condiciones de buen tiempo. Presupuesto de 12 kW/km.',
    params: { f: 60, delta: 0.9, r: 1.5, s: 600, U: 220, U0: 190, budget: 12 },
    goals: [goal('t7-perdidas'), goal('t7-incepcion')],
    forecast: 'sostiene',
    lesson: 'Con U₀ = 190 kV, P = 10,3 kW/km: veinte kilovoltios de umbral cambian el resultado por tres.',
  },
  {
    id: 't7-d',
    name: 'Haz de conductores en 500 kV',
    brief:
      'Línea de 500 kV con haz equivalente de r = 3,0 cm, s = 900 cm, δ = 0,88 y U₀ = 470 kV. Presupuesto 8 kW/km.',
    params: { f: 60, delta: 0.88, r: 3.0, s: 900, U: 500, U0: 470, budget: 14 },
    goals: [goal('t7-perdidas')],
    forecast: 'sostiene',
    lesson: 'P = 12,1 kW/km frente a un presupuesto de 14: el haz equivalente grueso y el umbral alto dejan margen, aunque la incepción está cerca.',
  },
  {
    id: 't7-e',
    name: 'Lluvia sobre el mismo haz',
    brief:
      'El mismo haz de 500 kV, pero con el umbral reducido a 430 kV por lluvia y superficie mojada. Presupuesto 8 kW/km.',
    params: { f: 60, delta: 0.88, r: 3.0, s: 900, U: 500, U0: 430, budget: 14 },
    goals: [goal('t7-perdidas')],
    forecast: 'falla',
    lesson: 'P = 66,1 kW/km: cuarenta kilovoltios menos de umbral multiplican por 5,4 las pérdidas (70² frente a 30²). La lluvia no perdona.',
  },
  {
    id: 't7-c',
    name: 'Conductor delgado en 115 kV',
    brief: 'r = 1,0 cm, s = 400 cm, δ = 0,85, U = 115 kV y U₀ = 95 kV. Presupuesto de 6 kW/km.',
    params: { f: 60, delta: 0.85, r: 1.0, s: 400, U: 115, U0: 95, budget: 6 },
    goals: [goal('t7-perdidas')],
    forecast: 'sostiene',
    lesson: 'P = 4,8 kW/km: poca tensión y poca diferencia sobre el umbral; el conductor delgado alcanza.',
  },
];

const opciones7: OptionSpec[] = [
  {
    id: 't7-incepcion',
    label: 'Subir la tensión de incepción a 1,25·U₀',
    icon: 'grid',
    apply: (p) => ({ U0: +(p.U0 * 1.25).toFixed(0) }),
    effect: 'Limpieza, pulido y geometría que elevan el umbral: es la palanca que manda en (U−U₀)².',
  },
  {
    id: 't7-haz',
    label: 'Haz de dos subconductores',
    icon: 'bolt',
    apply: (p) => ({ r: +(p.r * 1.35).toFixed(2), U0: +(p.U0 * 1.15).toFixed(0) }),
    effect: 'El haz reparte la carga: sube el umbral y el radio equivalente, sin duplicar el peso de cobre.',
  },
  {
    id: 't7-bajarU',
    label: 'Bajar la tensión de operación un 10 %',
    icon: 'gauge',
    apply: (p) => ({ U: Math.max(p.U0, +(p.U * 0.9).toFixed(0)) }),
    effect: 'Reduce el exceso sobre el umbral, pero cambiar la tensión de una línea no es una decisión menor.',
  },
  {
    id: 't7-lluvia',
    label: 'Declarar el cálculo en buen tiempo',
    icon: 'wind',
    apply: () => ({}),
    effect: 'El modelo ya es de buen tiempo: con lluvia las pérdidas suben.',
    falseProtection:
      'Declarar la condición más favorable no cambia la línea. Peek es una correlación de buen tiempo; con lluvia el gradiente local se intensifica.',
  },
  {
    id: 't7-radio',
    label: 'Aumentar el radio conservando U₀',
    icon: 'eye',
    apply: () => ({ r: 2 }),
    effect: 'Con U₀ fijo, √(r/s) sube: la fórmula de Peek empeora.',
    falseProtection:
      'Parece que un conductor más grueso debe perder menos, pero en Peek el radio aparece en √(r/s): si U₀ no cambia, las pérdidas suben. El radio reduce el gradiente, y eso actúa sobre U₀, no sobre este factor.',
  },
];

const tema7: DailySpec = {
  mission: 'Mantener las pérdidas corona dentro del presupuesto',
  brief:
    'El efecto corona no rompe el aislamiento: cuesta energía, hace ruido e interfiere. La fórmula de Peek es cuadrática en (U−U₀), así que el umbral pesa más que cualquier ajuste cosmético.',
  cases: casos7,
  options: opciones7,
  debrief: {
    good: 'Viste que el umbral manda: subir U₀ vale más que cambiar el diámetro a ciegas.',
    bad: 'Peek no es intuitiva: √(r/s) crece con r. Sin tocar U₀, engrosar el conductor no reduce las pérdidas.',
  },
  tip: 'Gradiente crítico E₀, tensión de incepción U₀ y pérdidas P no son lo mismo: campo, tensión y potencia.',
};

/* ======================================================================= */

export interface ThemeSpec {
  id: string;
  num: string;
  expId: string;
  title: string;
  question: string;
  concept: string;
  formula: string;
  trap: string;
  /** Lo que el estudiante debe poder decir al salir del experimento. */
  learn: {
    /** Objetivo de aprendizaje en una frase. */
    goal: string;
    /** Cómo se manifiesta el fenómeno en la escena o en la gráfica. */
    sign: string;
    /** Qué lectura mirar para confirmarlo. */
    watch: string;
  };
  daily: DailySpec;
}

/** Los siete temas de la exposición, en el orden del guion. */
export const THEMES: ThemeSpec[] = [
  {
    id: 'mecanismos',
    num: 'T1',
    expId: 'disrupcion',
    title: 'Cómo y por qué falla un aislamiento',
    question: '¿Qué hace que un aislamiento deje de aislar?',
    concept:
      'La ruptura empieza con ionización local; si el campo y el tiempo alcanzan, se forma una trayectoria conductora. La tensión de ruptura no es un número único: se distribuye alrededor de U₅₀ y depende de la densidad del aire.',
    formula: 'U_p = U₅₀ + z_p·σ · U₅₀(δ) ≈ 700·δ^0,75',
    trap: 'U₅₀ no es la tensión que el aislamiento soporta siempre: es la que falla la mitad de las veces.',
    learn: {
      goal:
        'U₅₀ es una mediana, no un umbral: el aislamiento tiene una distribución y la decisión se toma sobre la cola.',
      sign:
        'En la campana se ve la cola izquierda: bajar U₅₀ o subir la dispersión engorda la zona de falla aunque la mediana no se mueva.',
      watch:
        'La lectura «U₁₀» y la diferencia entre U₅₀, U₁₀ y la tensión de operación.',
    },
    daily: tema1,
  },
  {
    id: 'cadena',
    num: 'T2',
    expId: 'cadena',
    title: 'Longitud de la cadena de aisladores',
    question: '¿Qué capacidad de aislamiento necesitamos?',
    concept:
      'La distancia de fuga es el camino sobre la superficie; la distancia de arco en seco es el camino por el aire. La cadena se dimensiona por contaminación y luego se verifica por impulso, por geometría y por mecánica.',
    formula: 'N = ⌈k_f·Uₘ/L_disco⌉ · L_cadena ≈ N·paso',
    trap: 'Los 25 mm/kV del ejercicio son un supuesto de clase referido a tensión entre fases, no un valor universal.',
    learn: {
      goal:
        'La cadena se dimensiona por la distancia de fuga exigida por la contaminación y se redondea hacia arriba; después se verifica todo lo demás.',
      sign:
        'Cada milímetro de fuga exigida se convierte en discos enteros: la longitud de la cadena salta en escalones de un paso (0,146 m).',
      watch:
        'El número de discos N y la longitud de la cadena; al cambiar k_f la escalera se desplaza.',
    },
    daily: tema2,
  },
  {
    id: 'separacion',
    num: 'T3',
    expId: 'oscilacion',
    title: 'Separación entre conductores y estructura',
    question: '¿Qué distancias eléctricas y mecánicas debemos conservar?',
    concept:
      'La separación fase–estructura responde al esfuerzo fase–tierra y la fase–fase al esfuerzo entre fases. Con viento, la cadena de suspensión se inclina y la distancia real se reduce: hay que evaluarla en la posición deformada.',
    formula: 'd_h = d₀ − L·sen θ',
    trap: 'Que cumpla en reposo no significa que cumpla en operación: el viento y la temperatura mueven la geometría.',
    learn: {
      goal:
        'La separación que importa es la de la posición deformada: el viento inclina la cadena y la fase se acerca a la torre.',
      sign:
        'En la gráfica, la curva de d_h(θ) cruza la línea roja de la separación exigida: a partir de ese ángulo el diseño deja de cumplir.',
      watch:
        'La lectura «distancia con viento» y el punto donde la curva corta la exigencia.',
    },
    daily: tema3,
  },
  {
    id: 'guarda',
    num: 'T4',
    expId: 'guarda',
    title: 'Ubicación del cable de guarda',
    question: '¿Cómo reducimos la probabilidad de impacto directo del rayo?',
    concept:
      'La guarda intercepta descargas y las lleva a las torres. El ángulo de apantallamiento describe la geometría; el método electrogeométrico la relaciona con la corriente del rayo mediante una distancia de choque.',
    formula: 'α = arctan(Δx/Δh) · r_c = 10·I^0,65',
    trap: 'Un ángulo de 38,7° no garantiza protección: describe una posición y hay que verificar con el método electrogeométrico.',
    learn: {
      goal:
        'El ángulo de apantallamiento describe la geometría; el radio de atracción del rayo añade la física. Son dos lentes del mismo problema.',
      sign:
        'Al mover Δx o Δh, el ángulo cambia y la sombra protegida se desplaza; con más corriente, el radio de atracción crece.',
      watch:
        'Las lecturas «ángulo de apantallamiento» y «radio de atracción» frente a la separación real.',
    },
    daily: tema4,
  },
  {
    id: 'tierra',
    num: 'T5',
    expId: 'tierra',
    title: 'Puesta a tierra y flameo inverso',
    question: '¿Qué pasa cuando la corriente del rayo llega a la torre?',
    concept:
      'La corriente eleva el potencial de la torre; si la diferencia con la fase supera la capacidad de la cadena, aparece el flameo inverso. Para frentes rápidos, la resistencia medida no resume la respuesta.',
    formula: 'v(t) ≈ R·i(t) + L·di/dt',
    trap: 'Una R de 20 Ω no garantiza seguridad: cuentan la inductancia, el reparto de corriente y las tensiones de paso y contacto.',
    learn: {
      goal:
        'El potencial de la torre no es solo I·R: el frente de corriente añade L·di/dt y decide el flameo inverso.',
      sign:
        'En la gráfica, el potencial de torre crece con la corriente y con R_t; la componente inductiva se mantiene aunque R_t baje.',
      watch:
        'Las lecturas «caída resistiva», «caída inductiva» y «potencial de torre» frente a la capacidad de la cadena.',
    },
    daily: tema5,
  },
  {
    id: 'pararrayos',
    num: 'T6',
    expId: 'pararrayos',
    title: 'Selección y ubicación del pararrayos',
    question: '¿Cómo limitamos lo que llega al equipo?',
    concept:
      'El descargador de óxido metálico limita la tensión en sus bornes; el equipo está más lejos y la conexión añade L·di/dt. La coordinación verifica U_c, la TOV y el margen de impulso.',
    formula: 'U_eq = U_res + L_c(di/dt)d · M = (BIL/U_eq − 1)·100',
    trap: 'U_c, U_r y U_res no son la misma magnitud, y un margen positivo no equivale a cumplir el criterio.',
    learn: {
      goal:
        'El descargador protege en sus bornes; el equipo protegido ve además la caída inductiva de la conexión.',
      sign:
        'El margen de protección cae metro a metro al alejar el pararrayos, aunque la tensión residual no cambie.',
      watch:
        'La curva de margen frente a la distancia y la tensión que realmente llega al equipo (U_eq).',
    },
    daily: tema6,
  },
  {
    id: 'corona',
    num: 'T7',
    expId: 'corona',
    title: 'Efecto y pérdidas por corona',
    question: '¿Cómo influye el campo eléctrico en el comportamiento de la línea?',
    concept:
      'Sobre un umbral, el campo en la superficie del conductor ioniza el aire: hay pérdidas, ruido, luz e interferencia. La fórmula de Peek es empírica y cuadrática respecto a (U−U₀).',
    formula: 'P = (242/δ)(f+25)√(r/s)(U−U₀)²·10⁻⁵',
    trap: 'Peek no es una ley universal: tiene rango de aplicación y supone buen tiempo con la superficie limpia.',
    learn: {
      goal:
        'Las pérdidas de corona dependen del cuadrado del exceso sobre el umbral; el umbral manda más que el diámetro.',
      sign:
        'En la curva P(U) aparece el codo en U₀: por debajo no hay pérdidas y por encima crecen cuadráticamente.',
      watch:
        'La lectura «pérdidas por corona» y su sensibilidad al mover U₀ y (U − U₀).',
    },
    daily: tema7,
  },
];

export const themeById = (id: string) => THEMES.find((t) => t.id === id);
