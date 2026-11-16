/**
 * "Las funciones de la exposición": un reto de comprensión por cada idea que
 * el material considera crítica (8 mapas conceptuales + 6 puntos de refuerzo).
 *
 * Cada función es una afirmación engañosa con cuatro cierres posibles. Se
 * desbloquea resolviendo los retos del bloque al que pertenece, y se verifica
 * abriendo el experimento que la demuestra: la teoría y el simulador van juntos.
 */
export interface FuncionOpcion {
  id: string;
  text: string;
  ok?: boolean;
  why: string;
}

export interface FuncionSpec {
  id: string;
  chapter: string;
  icon: string;
  tema: string;
  titulo: string;
  claim: string;
  options: FuncionOpcion[];
  demo: string;
  expIds: string[];
  extra: string;
}

export interface FuncionChapter {
  id: string;
  name: string;
  color: string;
  blurb: string;
}

export const FUNCION_CHAPTERS: FuncionChapter[] = [
  { id: 'esfuerzos', name: 'Esfuerzos', color: '#38e1ff', blurb: 'Qué tensión llega y qué significa saber que un aislamiento "aguanta".' },
  { id: 'ambiente', name: 'Ambiente y aislamiento', color: '#2ee6a8', blurb: 'Cómo el aire, la contaminación y el viento cambian lo que el aislamiento puede.' },
  { id: 'proteccion', name: 'Protección', color: '#ffc247', blurb: 'Rayo, tierra y descargadores: qué protege de verdad y qué solo lo parece.' },
  { id: 'sintesis', name: 'Síntesis', color: '#b48cff', blurb: 'Corona y coordinación completa: el criterio final es el conjunto.' },
];

export const FUNCIONES: FuncionSpec[] = [
  /* ------------------------------------------------------------ esfuerzos */
  {
    id: 'f-u50',
    chapter: 'esfuerzos',
    icon: 'target',
    tema: 'T1 · U₅₀ y dispersión',
    titulo: 'La cifra "segura"',
    claim: 'Un aislamiento con U₅₀ = 700 kV soporta 700 kV…',
    options: [
      { id: 'siempre', text: '…siempre: ese es justamente su nivel de soporte.', why: 'No. U₅₀ es la tensión que produce disrupción en la mitad de los ensayos, no el umbral de inmunidad.' },
      { id: 'mitad', text: '…en la mitad de los ensayos; en la otra mitad falla.', ok: true, why: 'Exacto. U₅₀ es una mediana estadística: por definición, P(disrupción) = 50 %. Para "casi nunca falla" hay que ir a un cuantil bajo, como U₁₀.' },
      { id: 'nominal', text: '…siempre que la tensión nominal del sistema no la supere.', why: 'La tensión nominal no interviene: lo que importa es la distribución de la tensión disruptiva del aislamiento.' },
      { id: 'cresta', text: '…pero solo en cresta; en eficaz soporta menos.', why: 'Es al revés: la cresta es mayor que el valor eficaz (×√2). Comparar magnitudes exige la misma convención.' },
    ],
    demo: 'Experimento 04 con U₅₀ = 700 kV y s = 6 %: U₁₀ = 646,2 kV. Con U₅₀ = 700 y s = 9 %, U₁₀ ≈ 619 kV: el mismo "nivel" cambia con la dispersión.',
    expIds: ['disrupcion'],
    extra: 'Si el profesor pregunta "¿y si subo U₅₀ un 10 %?", la respuesta no es "soporta un 10 % más": sube la mediana, pero la cola de falla se mueve con σ.',
  },
  {
    id: 'f-cresta',
    chapter: 'esfuerzos',
    icon: 'bolt',
    tema: 'T1 · convención de tensiones',
    titulo: 'Eficaz contra cresta',
    claim: 'Para comparar la tensión del sistema (245 kV eficaces) con un ensayo de impulso (kV cresta)…',
    options: [
      { id: 'directo', text: '…se comparan directamente: ambas son kilovoltios.', why: 'No. 245 kV eficaces fase–fase equivalen a 200 kV cresta fase–tierra; comparar 245 con 900 da un margen falso.' },
      { id: 'sqrt3', text: '…se multiplica por √3 la tensión del sistema.', why: 'Ese factor pasa de fase–tierra a fase–fase, no de eficaz a cresta.' },
      { id: 'conv', text: '…se convierte con Û_f = √(2/3)·Uₘ antes de comparar.', ok: true, why: 'Correcto. Primero se pasa a fase–tierra (÷√3) y luego a cresta (×√2): en total √(2/3). Así 245 kV → 200 kV cresta, y la sobretensión de maniobra 2,5 p.u. → 500 kV.' },
      { id: 'pico', text: '…se usa el valor pico de la onda de impulso sin corregir.', why: 'La onda de impulso ya está en cresta; el que hay que convertir es la tensión del sistema.' },
    ],
    demo: 'Experimentos 01 y 02: con Uₘ = 245 kV, Û_f = 200,04 kV; con Fᵥ = 2,5 la sobretensión de maniobra es 500,1 kV, no 612,5.',
    expIds: ['tensiones', 'maniobra'],
    extra: 'Este es uno de los errores que más se penalizan en una sustentación: mezclar eficaz, cresta y fase–tierra en la misma cuenta.',
  },
  {
    id: 'f-onda',
    chapter: 'esfuerzos',
    icon: 'wave',
    tema: 'T1 · forma de onda',
    titulo: 'El nombre de la onda',
    claim: 'Una onda "1,2/50 µs" significa que…',
    options: [
      { id: 'duracion', text: '…dura 1,2 µs en subir y 50 µs en bajar del todo.', why: 'Los 50 µs no son el final de la onda: son el tiempo al 50 % de la cresta en la cola (t₂).' },
      { id: 'frente', text: '…tiene frente de 1,2 µs y cola de 50 µs; t₂ se mide al 50 % de la cresta.', ok: true, why: 'Exacto. t₁ es el frente virtual y t₂ el tiempo al semivalor en la cola. Con U = 1 000 kV, t₁ = 1,21 µs y t₂ = 48,3 µs en el modelo del experimento.' },
      { id: 'energia', text: '…entrega 1,2 J en 50 µs.', why: 'Son tiempos, no energía. La energía depende de la forma y de la impedancia del circuito, no del nombre normalizado.' },
      { id: 'frecuencia', text: '…equivale a una frecuencia de 50 Hz.', why: 'Nada que ver: es un impulso tipo rayo, no una onda de potencia.' },
    ],
    demo: 'Experimento 03: ajusta el frente y la cola y observa cómo t₁ y t₂ se separan del valor nominal de la onda normalizada.',
    expIds: ['impulso'],
    extra: 'La onda de maniobra es mucho más lenta (250/2500 µs): por eso el material la trata como "frente lento" y el rayo como "frente rápido".',
  },
  {
    id: 'f-cola',
    chapter: 'esfuerzos',
    icon: 'flame',
    tema: 'T1 · refuerzo: probabilidad',
    titulo: 'La cola de la campana',
    claim: 'Si el esfuerzo se mantiene por debajo de U₁₀…',
    options: [
      { id: 'cero', text: '…la probabilidad de falla es cero.', why: 'Nunca es cero: la distribución normal tiene cola infinita. U₁₀ significa 10 % de probabilidad, no 0 %.' },
      { id: 'diez', text: '…la probabilidad de falla es del 10 % o menos.', ok: true, why: 'Correcto. U₁₀ es el cuantil del 10 %: falla una vez de cada diez. Para probabilidades menores hay que ir más abajo en la curva.' },
      { id: 'garantia', text: '…está garantizado por la norma.', why: 'La norma fija criterios y factores de seguridad; no convierte una distribución estadística en un valor determinista.' },
      { id: 'sube', text: '…la probabilidad aumenta con la altitud aunque σ no cambie.', why: 'La altitud mueve U₅₀ (y con ella toda la curva); la dispersión relativa es otra cosa.' },
    ],
    demo: 'Experimento 04: baja la probabilidad objetivo y mira cuánto cae U_p. Con s = 6 %, pasar de 50 % a 1 % cuesta 2,33 σ.',
    expIds: ['disrupcion'],
    extra: 'En coordinación de aislamiento se elige un riesgo aceptable (por ejemplo U₁₀ o U₅ para ciertos equipos), no "la tensión segura".',
  },

  /* -------------------------------------------------------------- ambiente */
  {
    id: 'f-delta',
    chapter: 'ambiente',
    icon: 'wind',
    tema: 'T2 · corrección atmosférica',
    titulo: 'La altura no es la densidad',
    claim: 'A 2 640 m el aire aísla menos porque…',
    options: [
      { id: 'altura', text: '…la altura por sí sola reduce la rigidez.', why: 'La altura es una forma cómoda de estimar la presión; la rigidez depende de la densidad del aire, que también depende de la temperatura.' },
      { id: 'densidad', text: '…baja la densidad del aire y con ella U₅₀ ≈ 700·δ^0,75.', ok: true, why: 'Correcto. La presión cae y δ baja a 0,724 en Bogotá: U₅₀ pasa de 700 a 549,5 kV, un 21,5 % menos. Un día frío y otro cálido dan δ distinto a la misma altura.' },
      { id: 'humedad', text: '…la humedad relativa es mayor y eso siempre reduce la rigidez.', why: 'La humedad tiene efectos menores y no uniformes; la variable dominante en la corrección es la densidad (presión y temperatura).' },
      { id: 'fugas', text: '…aumentan las distancias de fuga por la lluvia.', why: 'La lluvia afecta la superficie; la corrección por altitud se aplica a la rigidez del aire (distancia de arco).' },
    ],
    demo: 'Experimento 05: a 2 640 m y 15 °C, δ = 0,724 y U₅₀ = 549,5 kV; a nivel del mar, 700 kV. Cambia la temperatura y verás moverse δ sin cambiar la altura.',
    expIds: ['atmosfera'],
    extra: 'Dos instalaciones a la misma altitud pueden requerir correcciones distintas si una está en un valle cálido y húmedo y otra en páramo frío.',
  },
  {
    id: 'f-fuga',
    chapter: 'ambiente',
    icon: 'chain',
    tema: 'T2 · cadena de aisladores',
    titulo: 'Por qué se elige la cadena',
    claim: 'El número de discos de una cadena se decide principalmente por…',
    options: [
      { id: 'nominal', text: '…la tensión nominal de la línea.', why: 'La tensión entra en la cuenta, pero quien manda el número es la contaminación del sitio: a igual tensión, una zona industrial exige más fuga.' },
      { id: 'fuga', text: '…la distancia de fuga exigida por la contaminación del sitio.', ok: true, why: 'Correcto. N = ⌈k_f·Uₘ/L_disco⌉. En 245 kV con 25 mm/kV y discos de 292 mm: 6 125/292 = 20,98 → 21 discos, 3,066 m. Luego se verifica por impulso y por mecánica.' },
      { id: 'mecanica', text: '…la carga mecánica del conductor.', why: 'La mecánica dimensiona herrajes y esfuerzos, pero no fija el número mínimo por aislamiento.' },
      { id: 'altura', text: '…la altitud de la torre.', why: 'La altitud corrige la rigidez del aire; el criterio de fuga es de contaminación superficial.' },
    ],
    demo: 'Experimento 06: con k_f = 25 y discos de 292 mm salen 21 discos; sube k_f a 31 y verás 27. Cambiar Uₘ a 145 kV da 13 discos.',
    expIds: ['cadena'],
    extra: 'El redondeo nunca es hacia abajo: 20,98 discos son 21, porque no existe un disco fraccionario.',
  },
  {
    id: 'f-viento',
    chapter: 'ambiente',
    icon: 'tower',
    tema: 'T2 · separación',
    titulo: 'La distancia que no se ve',
    claim: 'Una separación fase–estructura que cumple en reposo…',
    options: [
      { id: 'cumple', text: '…cumple en operación.', why: 'Con viento la cadena de suspensión se inclina y la fase se acerca a la torre: hay que evaluar la posición deformada.' },
      { id: 'deformada', text: '…puede dejar de cumplir cuando la cadena se inclina: d_h = d₀ − L·sen θ.', ok: true, why: 'Correcto. En el caso del curso, L = 3,066 m y θ = 30° dan Δx = 1,533 m: la distancia baja de 3,50 a 1,967 m y no alcanza los 2,42 m.' },
      { id: 'aislador', text: '…se corrige poniendo un aislador más grande.', why: 'Un aislador más grande alarga la cadena: aumenta la palanca y empeora el desplazamiento.' },
      { id: 'requisito', text: '…se arregla ajustando la distancia exigida.', why: 'La exigencia es un dato del estudio; cambiarla no mueve la fase ni un milímetro.' },
    ],
    demo: 'Experimento 07: con 3,066 m, 30° y d₀ = 3,50 m la distancia es 1,967 m. Sube d₀ a 4,2 m y el margen aparece.',
    expIds: ['oscilacion', 'separacion'],
    extra: 'La separación fase–fase responde a la tensión entre fases (D ≈ K√(F+L) + Vₙ/150); la fase–estructura, a la tensión fase–tierra. No son el mismo esfuerzo.',
  },
  {
    id: 'f-altura-cadena',
    chapter: 'ambiente',
    icon: 'gauge',
    tema: 'T2 · refuerzo: verificación',
    titulo: 'Una cadena, muchas verificaciones',
    claim: 'Elegir los discos por fuga es suficiente para aprobar la cadena…',
    options: [
      { id: 'si', text: '…sí: el resto es detalle constructivo.', why: 'Falta verificar impulso de rayo, separación con viento, mecánica y altitud. Cada criterio puede tumbar el diseño.' },
      { id: 'no', text: '…no: hay que verificar impulso, separación, mecánica y altitud.', ok: true, why: 'Correcto. El material insiste: la cadena se dimensiona por fuga y se verifica por impulso (U₅₀ de la cadena), por viento y por esfuerzos mecánicos.' },
      { id: 'impulso', text: '…solo hay que sumar la verificación de impulso.', why: 'Es una de varias. En el mismo ejercicio de 21 discos hay que revisar la separación con 30° de viento.' },
      { id: 'norma', text: '…lo que diga el fabricante prevalece sobre el cálculo.', why: 'El fabricante da datos (fuga, paso, carga); el criterio de aceptación es del proyecto y de la norma.' },
    ],
    demo: 'Experimentos 05, 06 y 07 encadenados: la misma línea se revisa por densidad, por fuga y por separación.',
    expIds: ['cadena', 'atmosfera', 'oscilacion'],
    extra: 'En la sustentación, "cumple" sin decir qué criterio se verificó es una respuesta incompleta.',
  },

  /* ------------------------------------------------------------ protección */
  {
    id: 'f-guarda',
    chapter: 'proteccion',
    icon: 'shield',
    tema: 'T3 · apantallamiento',
    titulo: 'Dos fallas que se confunden',
    claim: 'Una falla de apantallamiento y un flameo inverso…',
    options: [
      { id: 'igual', text: '…son lo mismo vistas desde la línea.', why: 'Tienen causas distintas y se corrigen con medidas distintas: una es geométrica y la otra eléctrica.' },
      { id: 'orden', text: '…son mecanismos distintos: el rayo golpea la fase en uno y la torre en el otro.', ok: true, why: 'Correcto. En el apantallamiento el líder alcanza la fase directamente (falla la geometría). En el flameo inverso golpea la guarda o la torre, sube el potencial y descarga a la fase a través de la cadena.' },
      { id: 'tierra', text: '…se corrigen ambos bajando la resistencia de tierra.', why: 'Bajar R_t ayuda contra el flameo inverso; no evita que el rayo elija la fase si la geometría la deja expuesta.' },
      { id: 'angulo', text: '…se explican solo con el ángulo de apantallamiento.', why: 'El ángulo describe la geometría; el flameo inverso depende de la corriente, la impedancia de tierra y la cadena.' },
    ],
    demo: 'Experimentos 09 y 10: sube el ángulo de apantallamiento y verás cambiar la exposición; sube la corriente y R_t y verás cambiar el potencial de torre.',
    expIds: ['guarda', 'tierra'],
    extra: 'El método electrogeométrico usa r_c = 10·I^0,65: la protección depende de la corriente que se decida considerar.',
  },
  {
    id: 'f-gamma',
    chapter: 'proteccion',
    icon: 'wave',
    tema: 'T3 · ondas viajeras',
    titulo: 'Lo que puede y no puede hacer una onda',
    claim: 'En una onda viajera que llega a un extremo abierto…',
    options: [
      { id: 'duplica', text: '…la tensión se duplica (Γ = +1) y la energía reflejada también.', why: 'La tensión se duplica, pero la energía no: la onda reflejada tiene la misma amplitud y se superpone; la energía se conserva en el conjunto.' },
      { id: 'tension', text: '…la tensión se duplica (Γ = +1): el coeficiente nunca supera 1.', ok: true, why: 'Correcto. Con Z₂ → ∞, Γ = +1 y τ = 2: la tensión en el extremo abierto alcanza 2·V_i. El caso extremo de Γ = −1 es el cortocircuito (V = 0).' },
      { id: 'energia', text: '…la energía se duplica y por eso falla el equipo.', why: 'La energía no se duplica: lo que se duplica es la tensión, y el esfuerzo dieléctrico depende de ella.' },
      { id: 'cero', text: '…Γ = 0 porque no hay impedancia de carga.', why: 'Justo al revés: sin carga (Z₂ → ∞) Γ tiende a +1, no a 0.' },
    ],
    demo: 'Experimento 11: con Z₁ = 400 Ω y Z₂ = 100 Ω, Γ = −0,60 y τ = 0,40; con Z₂ muy grande, Γ → +1 y la tensión se acerca al doble.',
    expIds: ['ondas'],
    extra: 'Γ = (Z₂−Z₁)/(Z₂+Z₁) siempre está entre −1 y +1 para impedancias positivas. Una "reflexión del 150 %" es imposible; lo que puede duplicarse es la tensión total.',
  },
  {
    id: 'f-tierra',
    chapter: 'proteccion',
    icon: 'ground',
    tema: 'T3 · puesta a tierra',
    titulo: 'El número de la resistencia',
    claim: 'Una torre con R_t = 20 Ω garantiza que no habrá flameo inverso…',
    options: [
      { id: 'garantiza', text: '…siempre que la corriente no pase de 10 kA.', why: 'El umbral depende de la cadena, de la corriente y del frente; 20 Ω no es un valor mágico.' },
      { id: 'frente', text: '…solo si se evalúa con el frente real: V ≈ R·i + L·di/dt.', ok: true, why: 'Correcto. Para un rayo de 20 kA con 40 Ω, V_t = 800 kV y la cadena de 700 kV flamea. Además, la R medida a 50 Hz no describe la respuesta impulsiva del terreno.' },
      { id: 'personas', text: '…y además protege a las personas de paso y contacto.', why: 'Son criterios distintos: las tensiones de paso y contacto se evalúan aparte, a partir del potencial superficial.' },
      { id: 'varilla', text: '…basta con clavar una varilla y medir 5 Ω.', why: 'La medición de baja frecuencia no captura la ionización del suelo ni la inductancia del electrodo.' },
    ],
    demo: 'Experimento 10: 20 kA sobre 40 Ω dan 810 kV; sobre 10 Ω, 210 kV. La inductancia de la torre añade L·di/dt.',
    expIds: ['tierra'],
    extra: 'Pregunta de repregunta típica: "¿y si baja R_t pero sube di/dt?" Ahí el término inductivo puede volver a dominar.',
  },
  {
    id: 'f-margen',
    chapter: 'proteccion',
    icon: 'chip',
    tema: 'T3 · pararrayos',
    titulo: 'El margen que parece margen',
    claim: 'Si el margen de protección del pararrayos es +8 %…',
    options: [
      { id: 'ok', text: '…el equipo está protegido: el margen es positivo.', why: 'Positivo no es suficiente: el criterio del curso exige al menos 20 %. Un 8 % deja el equipo al borde.' },
      { id: 'veinte', text: '…no alcanza: el criterio pide al menos 20 % de margen.', ok: true, why: 'Correcto. M = (BIL/U_eq − 1)·100. Con BIL = 750 kV y U_eq = 680 kV, M = 10,3 %: la cuenta pasa, el criterio no.' },
      { id: 'residual', text: '…hay que subir U_res para mejorar el margen.', why: 'Subir U_res empeora el margen: es la tensión que el descargador deja pasar. Se baja U_res o se acorta la conexión.' },
      { id: 'uc', text: '…hay que subir U_c para mejorar el margen.', why: 'U_c es la capacidad de tensión continua del descargador (TOV); no es el término que domina el margen de impulso.' },
    ],
    demo: 'Experimento 12: con U_res = 600, d = 6 m y BIL = 1 050 kV, M = 59,1 %. Sube d a 8 m y baja BIL a 750: M = 10,3 %.',
    expIds: ['pararrayos'],
    extra: 'U_c, U_r y U_res no son lo mismo. Confundirlas es la vía rápida a un descargador mal seleccionado.',
  },

  /* --------------------------------------------------------------- síntesis */
  {
    id: 'f-fase-tierra',
    chapter: 'esfuerzos',
    icon: 'gauge',
    tema: 'T1 · configuración del esfuerzo',
    titulo: 'Fase–tierra no es fase–fase',
    claim: 'Un aislamiento de 245 kV entre fases se verifica contra 245 kV…',
    options: [
      { id: 'entre-fases', text: '…entre fases, porque es la tensión del sistema.', why: 'El aislamiento fase–estructura ve tensión fase–tierra: 245/√3 = 141,5 kV eficaces. Comparar con 245 deja el cálculo inflado o el margen falso.' },
      { id: 'fase-tierra', text: '…fase–tierra: U_f = Uₘ/√3 = 141,5 kV, y en cresta 200,0 kV.', ok: true, why: 'Correcto. La configuración manda: fase–estructura responde a fase–tierra; fase–fase, a la tensión entre fases; longitudinal, a la diferencia entre fases.' },
      { id: 'cresta', text: '…con la cresta fase–fase, que es el caso más severo.', why: 'La cresta fase–fase (√2·245 = 346 kV) no aparece entre fase y torre; usar ese número da un diseño artificialmente conservador y caro.' },
      { id: 'igual', text: '…da igual mientras las dos estén en kV.', why: 'Este es justo el error que el material señala: mezclar configuraciones en la misma comparación invalida el resultado.' },
    ],
    demo: 'Experimento 01: 245 kV → U_f = 141,45 kV y Û_f = 200,04 kV. El experimento 07 usa esos 200 kV para la separación fase–estructura.',
    expIds: ['tensiones', 'oscilacion'],
    extra: 'Antes de calcular, escribe las tres configuraciones: fase–tierra (÷√3), fase–fase (directa) y longitudinal (entre fases, con su propia onda).',
  },
  {
    id: 'f-fuga-vs-arco',
    chapter: 'ambiente',
    icon: 'chain',
    tema: 'T2 · dos distancias',
    titulo: 'Fuga no es arco',
    claim: 'La distancia de fuga de una cadena es…',
    options: [
      { id: 'misma', text: '…la misma distancia que el aire debe soportar.', why: 'Son caminos distintos: la fuga recorre la superficie del aislador y el arco en seco va por el aire, en línea recta.' },
      { id: 'distinta', text: '…el camino sobre la superficie; la distancia de arco es la recta por el aire.', ok: true, why: 'Correcto. Por eso una cadena puede cumplir la fuga y fallar la separación: 21 discos dan 6 125 mm de fuga, pero la cadena mide 3,066 m y se inclina con el viento.' },
      { id: 'suma', text: '…la suma de las dos.', why: 'No se suman: son dos verificaciones independientes que se hacen por separado.' },
      { id: 'iguales', text: '…mayor que el arco, así que el arco nunca falla.', why: 'La fuga siempre es mayor que la distancia en línea recta, pero el arco depende del aire (densidad, humedad) y del tiempo, no de la fuga.' },
    ],
    demo: 'Experimentos 06 y 07: la cadena de 21 discos cumple la fuga (3,066 m) y aun así no conserva los 2,42 m con 30° de viento.',
    expIds: ['cadena', 'oscilacion'],
    extra: 'Regla práctica para la sustentación: la fuga se dimensiona por contaminación; la distancia de arco, por tensión y por sobretensión.',
  },
  {
    id: 'f-onda-viajera',
    chapter: 'proteccion',
    icon: 'wave',
    tema: 'T3 · ondas viajeras',
    titulo: 'La impedancia no es la resistencia',
    claim: 'La impedancia característica Z_c = √(L′/C′) de una línea…',
    options: [
      { id: 'perdidas', text: '…mide la resistencia óhmica del conductor.', why: 'No: Z_c describe cómo se reparten tensión y corriente en la onda viajera; la resistencia óhmica es otra cosa y mucho menor.' },
      { id: 'onda', text: '…es la relación V/i de la onda que viaja, y decide Γ en cada transición.', ok: true, why: 'Correcto. Con L′ = 0,9 mH/km y C′ = 12 nF/km sale Z_c ≈ 274 Ω, y con Z₁ = 400 Ω y Z₂ = 100 Ω, Γ = −0,60.' },
      { id: 'frecuencia', text: '…depende de la frecuencia de la red.', why: 'Depende de L′ y C′ (geometría y material), no de la frecuencia de operación.' },
      { id: 'cero', text: '…es cero en un extremo abierto.', why: 'En el extremo abierto Z₂ → ∞ y Γ → +1: la tensión se duplica. La Z_c de la línea no cambia.' },
    ],
    demo: 'Experimento 11: con los valores del curso Z_c = 273,9 Ω; mueve Z₂ y verás Γ pasar de −0,60 a +1.',
    expIds: ['ondas'],
    extra: 'En un cambio de impedancia, Γ y τ son coeficientes de tensión: la corriente usa los mismos con signo contrario.',
  },
  {
    id: 'f-tov',
    chapter: 'proteccion',
    icon: 'chip',
    tema: 'T3 · descargador',
    titulo: 'La sobretensión que no es rayo',
    claim: 'La TOV es la sobretensión temporal a frecuencia industrial que…',
    options: [
      { id: 'impulso', text: '…se compara con la tensión residual del descargador.', why: 'U_res es una tensión de impulso (cresta); la TOV se compara con la capacidad de tensión continua U_c del descargador.' },
      { id: 'uc', text: '…se compara con U_c: el descargador debe aguantarla sin degradarse.', ok: true, why: 'Correcto. La TOV aparece por rechazo de carga o falla a tierra y puede durar ciclos; U_c es su límite. En 245 kV, TOV = 1,25·245/√3 = 176,8 kV frente a 195 kV de capacidad.' },
      { id: 'bil', text: '…se compara con el BIL del equipo.', why: 'El BIL es una tensión soportada de impulso; la TOV es una onda de frecuencia industrial y su límite lo pone el descargador.' },
      { id: 'no', text: '…no es un criterio de coordinación.', why: 'Sí lo es: un descargador con U_c insuficiente se degrada o falla, y deja el equipo sin protección.' },
    ],
    demo: 'Experimento 12: con U_c = 150 kV y 245 kV de sistema, la TOV de 176,8 kV queda por debajo de 1,3·150 = 195 kV.',
    expIds: ['pararrayos'],
    extra: 'Tres magnitudes que se confunden: U_c (continua), U_r (referencia de operación) y U_res (residual de impulso). Ninguna es la TOV.',
  },
  {
    id: 'f-altitud',
    chapter: 'ambiente',
    icon: 'gauge',
    tema: 'T2 · corrección atmosférica',
    titulo: 'Dos sitios con la misma altura',
    claim: 'Dos subestaciones a 2 640 m tienen siempre el mismo factor de corrección…',
    options: [
      { id: 'si', text: '…sí, porque δ solo depende de la altura.', why: 'La altura solo estima la presión. δ = (p/p₀)(T₀/T): la temperatura cambia de un sitio a otro y de un día a otro.' },
      { id: 'no', text: '…no: δ depende de presión y temperatura; la altura solo estima la presión.', ok: true, why: 'Correcto. A 2 640 m con 15 °C, δ = 0,724; con 30 °C en un valle cálido, δ baja a ≈ 0,69 y U₅₀ cae otro 4 %.' },
      { id: 'humedad', text: '…no, porque la humedad entra en δ.', why: 'La humedad no entra en δ; su efecto es menor y se trata aparte en la corrección de ensayos.' },
      { id: 'altura2', text: '…solo si las dos están en el mismo país.', why: 'La geografía no importa: importan presión, temperatura y, en su caso, la humedad.' },
    ],
    demo: 'Experimento 05: fija la altitud y mueve la temperatura; δ y U₅₀ se mueven con ella. Con 30 °C la rigidez cae por debajo de lo que sugiere la altura.',
    expIds: ['atmosfera'],
    extra: 'Si hay dato de presión medida en sitio, úsalo (el experimento tiene el interruptor): la altura es una aproximación.',
  },
  {
    id: 'f-tierra-personas',
    chapter: 'proteccion',
    icon: 'ground',
    tema: 'T3 · puesta a tierra',
    titulo: 'Proteger el equipo no es proteger a la gente',
    claim: 'Bajar la resistencia de la torre a 10 Ω…',
    options: [
      { id: 'todo', text: '…resuelve el flameo inverso y la seguridad de las personas.', why: 'Son criterios distintos: el flameo depende de V_t frente a la cadena; las personas, de las tensiones de paso y contacto en la superficie.' },
      { id: 'equipo', text: '…mejora el flameo inverso, pero no basta para paso y contacto.', ok: true, why: 'Correcto. Con 20 kA y 40 Ω el potencial llega a 810 kV; bajarlo ayuda al aislamiento, pero las tensiones de paso y contacto exigen malla, capa superficial y geometría de electrodos.' },
      { id: 'nada', text: '…no sirve para nada.', why: 'Sí sirve: es la palanca principal frente al flameo inverso, sobre todo en suelos de resistividad media.' },
      { id: 'medicion', text: '…y se demuestra midiendo 10 Ω a 50 Hz.', why: 'La medición de baja frecuencia no describe la respuesta impulsiva: cuentan la inductancia y la ionización del terreno.' },
    ],
    demo: 'Experimento 10: con 20 kA, R_t = 40 Ω da 810 kV y R_t = 10 Ω da 210 kV. La seguridad de personas se evalúa aparte, con el potencial superficial.',
    expIds: ['tierra'],
    extra: 'No confundas "resistencia de puesta a tierra" con "tensión de paso": la primera es una propiedad del electrodo; la segunda, un efecto en el terreno.',
  },
  {
    id: 'f-seleccion',
    chapter: 'sintesis',
    icon: 'target',
    tema: 'T4 · método',
    titulo: 'Qué va primero',
    claim: 'Al coordinar aislamiento, lo primero es elegir el pararrayos…',
    options: [
      { id: 'pararrayos', text: '…porque es lo que define las tensiones del sistema.', why: 'El descargador es una de las últimas decisiones: primero se fijan los esfuerzos (sobretensiones representativas) y el nivel de aislamiento.' },
      { id: 'esfuerzos', text: '…definir las sobretensiones representativas y el nivel de aislamiento; el descargador se elige para cumplirlas.', ok: true, why: 'Correcto. El orden del material es: sobretensiones → nivel de aislamiento (BIL/SIL) → descargador y su ubicación → márgenes. Elegir primero el descargador es empezar por el final.' },
      { id: 'bil', text: '…porque el BIL se deduce de su tensión residual.', why: 'Se deduce del nivel de aislamiento requerido, que sale de las sobretensiones representativas y del margen que se decida.' },
      { id: 'norma', text: '…copiando el descargador de otra subestación parecida.', why: 'Una referencia sirve para empezar, pero la selección depende de la TOV, del sistema de neutro y del nivel de contaminación de este sitio.' },
    ],
    demo: 'Experimento 14: la misión solo cierra cuando el conjunto es coherente, no cuando cada pieza se eligió por separado.',
    expIds: ['mision', 'pararrayos'],
    extra: 'IEC 60071-1/-2 fija ese orden: sobretensiones representativas, nivel de aislamiento, y después la protección.',
  },
  {
    id: 'f-peek',
    chapter: 'sintesis',
    icon: 'spark',
    tema: 'T4 · corona',
    titulo: 'El cuadrado del exceso',
    claim: 'Si la tensión de operación supera el umbral de corona, duplicar el exceso sobre U₀…',
    options: [
      { id: 'duplica', text: '…duplica las pérdidas.', why: 'Lineal, no: la fórmula de Peek tiene (U−U₀)². Duplicar el exceso multiplica las pérdidas por cuatro.' },
      { id: 'cuatro', text: '…multiplica las pérdidas por cuatro.', ok: true, why: 'Correcto. P ∝ (U−U₀)². Por eso pasar de 28,6 kW/km (U−U₀ = 50 kV) a 10,3 kW/km (U−U₀ = 30 kV) no es un cambio del 50 %: es casi un tercio.' },
      { id: 'nada', text: '…no cambia nada mientras U > U₀.', why: 'Sí cambia: la curva es continua y cuadrática por encima del umbral.' },
      { id: 'raiz', text: '…crece con la raíz del exceso.', why: 'La raíz aparece en √(r/s), no en la tensión.' },
    ],
    demo: 'Experimento 13: con r = 1,5 cm, s = 600 cm y δ = 0,9, U = 220 kV y U₀ = 170 dan 28,6 kW/km; con U₀ = 190, 10,3 kW/km.',
    expIds: ['corona'],
    extra: 'Peek es una correlación empírica de buen tiempo: no es una ley universal. Con lluvia o superficie sucia el umbral baja.',
  },
  {
    id: 'f-corona',
    chapter: 'sintesis',
    icon: 'eye',
    tema: 'T4 · coordinación completa',
    titulo: 'El criterio final',
    claim: 'Una línea está coordinada cuando…',
    options: [
      { id: 'uno', text: '…cumple el criterio de la cadena.', why: 'Un criterio aislado no demuestra nada: la coordinación es la verificación conjunta de todos los esfuerzos y aislamientos.' },
      { id: 'todos', text: '…todos los criterios se cumplen a la vez, con sus márgenes.', ok: true, why: 'Correcto. Es la idea de la misión final: sobretensión, cadena, separación, apantallamiento, tierra, descargador y corona se verifican en conjunto; si uno falla, el proyecto no está coordinado.' },
      { id: 'economico', text: '…el costo del aislamiento es el mínimo posible.', why: 'El óptimo económico solo es válido dentro del conjunto de diseños que cumplen todos los criterios.' },
      { id: 'bil', text: '…el BIL del equipo es mayor que la tensión residual del pararrayos.', why: 'Es uno de los criterios (y con 20 % de margen), no la definición completa.' },
    ],
    demo: 'Experimento 14: la misión solo se resuelve cuando los siete criterios pasan a la vez.',
    expIds: ['mision'],
    extra: 'En la sustentación, la respuesta fuerte es siempre de dos capas: el criterio y el margen, y después qué pasa si ese criterio falla.',
  },
];

export const funcionesByChapter = (id: string) => FUNCIONES.filter((f) => f.chapter === id);
export const funcionById = (id: string) => FUNCIONES.find((f) => f.id === id);
