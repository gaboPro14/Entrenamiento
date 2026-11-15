// La rutina de Gabriel, tal cual la escribió. No agregar ejercicios ni rutinas aquí.
// Las «claves» de cada ejercicio son el texto literal de la rutina.

export type Carga = "mancuernas" | "mancuerna" | "barra" | "corporal" | "tiempo";

/** Un movimiento concreto (una variante). Su `key` agrupa el historial. */
export type Movimiento = {
  key: string;
  nombre: string;
  anim: string;
  carga: Carga;
  /** Error común a evitar, solo donde es obvio. */
  error?: string;
  /** Clave propia de la variante cuando la rutina la da (p. ej. pájaros). */
  clave?: string;
};

export type Parte = {
  /** Etiqueta del selector de variante. */
  variantes: { etiqueta: string; mov: Movimiento }[];
};

export type Ejercicio = {
  id: string;
  /** Nombre tal cual en la rutina. */
  nombre: string;
  series: number;
  repMin: number;
  repMax: number;
  porLado?: "pierna" | "lado";
  /** "cada uno" en la superserie. */
  cadaUno?: boolean;
  /** Ejercicio básico: descanso de 2-3 minutos. */
  basico?: boolean;
  /** Segundos de descanso que usa el temporizador. */
  descanso: number;
  /** Texto del descanso para mostrar. */
  descansoTexto: string;
  clave: string;
  /** 1 parte normal; 2 partes = superserie sin descanso entre ambas. */
  partes: Parte[];
  /** Referencia de otro día (Día 4: igualar lo del Día 1). */
  referencia?: { dia: number; key: string };
  /** Unidad de las repeticiones ("reps" o "s"). */
  unidad?: "reps" | "s";
};

export type Dia = {
  num: number;
  titulo: string;
  ejercicios: Ejercicio[];
  opcional?: boolean;
};

// Descansos (no cambiar): 2-3 min en básicos, 60-90 s en el resto, 90 s en la superserie del Día 4.
// El temporizador arranca en el punto medio del rango; con «+30 s» llegas al tope.
export const DESCANSO_BASICO = 150;
export const DESCANSO_RESTO = 75;
export const DESCANSO_SUPERSERIE = 90;
const TXT_BASICO = "2-3 min";
const TXT_RESTO = "60-90 s";

// ---------- Movimientos ----------
const M = {
  pressBancaMancuernas: {
    key: "press-banca-mancuernas",
    nombre: "Press en banco con mancuernas",
    anim: "press-banca",
    carga: "mancuernas",
    error: "Evita: rebotar las mancuernas o despegar los omóplatos del banco.",
  },
  pressBancaBarra: {
    key: "press-banca-barra",
    nombre: "Press en banco con barra",
    anim: "press-banca-barra",
    carga: "barra",
    error: "Evita: rebotar la barra en el pecho o despegar la cadera del banco.",
  },
  flexionesMedio: {
    key: "flexiones-medio",
    nombre: "Flexiones en tabla (agarre medio)",
    anim: "flexiones",
    carga: "corporal",
    error: "Evita: dejar caer la cadera o subirla en pico.",
  },
  flexionesCerrado: {
    key: "flexiones-cerrado",
    nombre: "Flexiones en tabla (agarre cerrado)",
    anim: "flexiones-cerradas",
    carga: "corporal",
    error: "Evita: abrir los codos hacia los lados.",
  },
  pressInclinado: {
    key: "press-inclinado-mancuernas",
    nombre: "Press inclinado con mancuernas",
    anim: "press-inclinado",
    carga: "mancuernas",
    error: "Evita: arquear de más la espalda baja.",
  },
  pressMilitar: {
    key: "press-militar-sentado",
    nombre: "Press militar con mancuernas, sentado",
    anim: "press-militar",
    carga: "mancuernas",
    error: "Evita: arquear la espalda para empujar.",
  },
  laterales: {
    key: "elevaciones-laterales",
    nombre: "Elevaciones laterales",
    anim: "laterales",
    carga: "mancuernas",
    error: "Evita: balancear el cuerpo o subir por encima del hombro.",
  },
  extTriceps: {
    key: "extension-triceps-cabeza",
    nombre: "Extensión de tríceps tras la cabeza con una mancuerna",
    anim: "extension-triceps",
    carga: "mancuerna",
    error: "Evita: abrir los codos hacia los lados.",
  },
  sentadillaCopa: {
    key: "sentadilla-copa",
    nombre: "Sentadilla copa (goblet) con mancuerna",
    anim: "sentadilla-copa",
    carga: "mancuerna",
    error: "Evita: que las rodillas se vayan hacia adentro.",
  },
  sentadillaBarra: {
    key: "sentadilla-barra",
    nombre: "Sentadilla con barra",
    anim: "sentadilla-barra",
    carga: "barra",
    error: "Evita: que las rodillas se vayan hacia adentro o despegar los talones.",
  },
  pesoMuerto: {
    key: "peso-muerto-rumano",
    nombre: "Peso muerto rumano con barra",
    anim: "peso-muerto",
    carga: "barra",
    error: "Evita: redondear la espalda o alejar la barra de las piernas.",
  },
  zancadas: {
    key: "zancadas",
    nombre: "Zancadas con mancuernas",
    anim: "zancada",
    carga: "mancuernas",
    error: "Evita: inclinar el torso hacia adelante o bajar de golpe.",
  },
  bulgara: {
    key: "sentadilla-bulgara",
    nombre: "Sentadilla búlgara con mancuernas (pie trasero en el banco)",
    anim: "bulgara",
    carga: "mancuernas",
    error: "Evita: inclinar el torso hacia adelante o bajar de golpe.",
  },
  zancadasCaminando: {
    key: "zancadas-caminando",
    nombre: "Zancadas caminando con mancuernas",
    anim: "zancada",
    carga: "mancuernas",
    error: "Evita: inclinar el torso hacia adelante o bajar de golpe.",
  },
  hipThrust: {
    key: "hip-thrust",
    nombre: "Puente de glúteo con barra (hip thrust en el banco)",
    anim: "hip-thrust",
    carga: "barra",
    error: "Evita: arquear la espalda baja arriba en vez de apretar el glúteo.",
  },
  gemelos: {
    key: "gemelos-de-pie",
    nombre: "Elevación de gemelos de pie con mancuernas",
    anim: "gemelos",
    carga: "mancuernas",
    error: "Evita: rebotar o hacer medio recorrido.",
  },
  remoBarra: {
    key: "remo-barra",
    nombre: "Remo con barra inclinado",
    anim: "remo-barra",
    carga: "barra",
    error: "Evita: balancearte o levantar el torso para subir la barra.",
  },
  remoUnaMano: {
    key: "remo-una-mano",
    nombre: "Remo a una mano con mancuerna, apoyado en el banco",
    anim: "remo-una-mano",
    carga: "mancuerna",
    error: "Evita: girar el torso para subir la mancuerna.",
  },
  remoMenton: {
    key: "remo-menton",
    nombre: "Remo al mentón suave",
    anim: "remo-menton",
    carga: "mancuernas",
    error: "Evita: subir los codos por encima del hombro o usar peso pesado.",
  },
  facePull: {
    key: "face-pull-improvisado",
    nombre: "Face pull improvisado (remo alto con mancuernas ligeras)",
    anim: "face-pull",
    carga: "mancuernas",
    error: "Evita: encoger los hombros hacia las orejas.",
  },
  pajaros: {
    key: "pajaros",
    nombre: "Pájaros (deltoide posterior) inclinado con mancuernas",
    anim: "pajaros",
    carga: "mancuernas",
    clave: "Pecho apoyado o torso inclinado, abre sin encoger los hombros.",
    error: "Evita: encoger los hombros o balancear el torso.",
  },
  curlBarra: {
    key: "curl-barra",
    nombre: "Curl con barra",
    anim: "curl-barra",
    carga: "barra",
    error: "Evita: empujar con la cadera o adelantar los codos.",
  },
  curlMartillo: {
    key: "curl-martillo",
    nombre: "Curl martillo con mancuernas",
    anim: "curl-martillo",
    carga: "mancuernas",
    error: "Evita: dejar caer la mancuerna de golpe.",
  },
  remoDosManos: {
    key: "remo-mancuernas-dos-manos",
    nombre: "Remo con mancuernas a dos manos, torso inclinado",
    anim: "remo-mancuernas",
    carga: "mancuernas",
    error: "Evita: balancear el torso.",
  },
  curlMancuernas: {
    key: "curl-mancuernas",
    nombre: "Curl con mancuernas",
    anim: "curl-mancuernas",
    carga: "mancuernas",
    error: "Evita: balancear el cuerpo o adelantar los codos.",
  },
  pressFrances: {
    key: "press-frances",
    nombre: "Press francés en banco",
    anim: "press-frances",
    carga: "mancuernas",
    error: "Evita: abrir los codos o mover los brazos hacia atrás.",
  },
  plancha: {
    key: "plancha",
    nombre: "Plancha",
    anim: "plancha",
    carga: "tiempo",
    error: "Evita: dejar caer la cadera.",
  },
  elevPiernas: {
    key: "elevaciones-piernas",
    nombre: "Elevaciones de piernas acostado",
    anim: "elevaciones-piernas",
    carga: "corporal",
    error: "Evita: despegar la espalda baja del piso.",
  },
} satisfies Record<string, Movimiento>;

const una = (etiqueta: string, mov: Movimiento): Parte => ({ variantes: [{ etiqueta, mov }] });

// ---------- Días ----------
export const DIAS: Dia[] = [
  {
    num: 1,
    titulo: "Pecho, hombro y tríceps",
    ejercicios: [
      {
        id: "d1-press-banca",
        nombre: "Press en banco con mancuernas",
        series: 4, repMin: 6, repMax: 10, basico: true,
        descanso: DESCANSO_BASICO, descansoTexto: TXT_BASICO,
        clave: "Omóplatos juntos contra el banco, baja controlado hasta sentir el pecho.",
        partes: [una("Mancuernas", M.pressBancaMancuernas)],
      },
      {
        id: "d1-flexiones",
        nombre: "Flexiones en tabla (agarre medio)",
        series: 3, repMin: 8, repMax: 15,
        descanso: DESCANSO_RESTO, descansoTexto: TXT_RESTO,
        clave: "Cuerpo en línea recta. Si sobra fuerza, mochila con peso o pies elevados en el banco.",
        partes: [una("Agarre medio", M.flexionesMedio)],
      },
      {
        id: "d1-press-inclinado",
        nombre: "Press inclinado con mancuernas",
        series: 3, repMin: 8, repMax: 12,
        descanso: DESCANSO_RESTO, descansoTexto: TXT_RESTO,
        clave: "Apunta a la parte alta del pecho, sin arquear de más la espalda baja.",
        partes: [una("Mancuernas", M.pressInclinado)],
      },
      {
        id: "d1-press-militar",
        nombre: "Press militar con mancuernas, sentado",
        series: 3, repMin: 8, repMax: 12,
        descanso: DESCANSO_RESTO, descansoTexto: TXT_RESTO,
        clave: "Abdomen firme, no empujes arqueando la espalda.",
        partes: [una("Sentado", M.pressMilitar)],
      },
      {
        id: "d1-laterales",
        nombre: "Elevaciones laterales",
        series: 3, repMin: 12, repMax: 20,
        descanso: DESCANSO_RESTO, descansoTexto: TXT_RESTO,
        clave: "Sube hasta la altura del hombro, codos suaves, sin balanceo.",
        partes: [una("Mancuernas", M.laterales)],
      },
      {
        id: "d1-triceps",
        nombre: "Extensión de tríceps tras la cabeza con una mancuerna",
        series: 3, repMin: 10, repMax: 15,
        descanso: DESCANSO_RESTO, descansoTexto: TXT_RESTO,
        clave: "Codos apuntando al frente y quietos.",
        partes: [una("Una mancuerna", M.extTriceps)],
      },
    ],
  },
  {
    num: 2,
    titulo: "Pierna completa",
    ejercicios: [
      {
        id: "d2-sentadilla",
        nombre: "Sentadilla copa (goblet) con mancuerna o sentadilla con barra",
        series: 4, repMin: 6, repMax: 10, basico: true,
        descanso: DESCANSO_BASICO, descansoTexto: TXT_BASICO,
        clave: "Pies firmes, rodillas siguiendo la punta de los pies, baja lo que tu movilidad permita sin dolor.",
        partes: [
          {
            variantes: [
              { etiqueta: "Copa (mancuerna)", mov: M.sentadillaCopa },
              { etiqueta: "Con barra", mov: M.sentadillaBarra },
            ],
          },
        ],
      },
      {
        id: "d2-peso-muerto",
        nombre: "Peso muerto rumano con barra",
        series: 3, repMin: 8, repMax: 12, basico: true,
        descanso: DESCANSO_BASICO, descansoTexto: TXT_BASICO,
        clave: "Cadera hacia atrás, espalda neutra, la barra pegada a las piernas.",
        partes: [una("Barra", M.pesoMuerto)],
      },
      {
        id: "d2-zancadas",
        nombre: "Zancadas o sentadilla búlgara con mancuernas (pie trasero en el banco)",
        series: 3, repMin: 8, repMax: 12, porLado: "pierna",
        descanso: DESCANSO_RESTO, descansoTexto: TXT_RESTO,
        clave: "Torso casi vertical, baja despacio (2-3 segundos).",
        partes: [
          {
            variantes: [
              { etiqueta: "Búlgara (banco)", mov: M.bulgara },
              { etiqueta: "Zancadas", mov: M.zancadas },
            ],
          },
        ],
      },
      {
        id: "d2-hip-thrust",
        nombre: "Puente de glúteo con barra sobre la cadera (hip thrust apoyado en el banco)",
        series: 3, repMin: 10, repMax: 15,
        descanso: DESCANSO_RESTO, descansoTexto: TXT_RESTO,
        clave: "Aprieta el glúteo 1 segundo arriba en cada repetición.",
        partes: [una("Barra", M.hipThrust)],
      },
      {
        id: "d2-gemelos",
        nombre: "Elevación de gemelos de pie con mancuernas",
        series: 4, repMin: 12, repMax: 20,
        descanso: DESCANSO_RESTO, descansoTexto: TXT_RESTO,
        clave: "Pausa de 1 segundo abajo y arriba, rango completo.",
        partes: [una("Mancuernas", M.gemelos)],
      },
    ],
  },
  {
    num: 3,
    titulo: "Espalda y bíceps",
    ejercicios: [
      {
        id: "d3-remo-barra",
        nombre: "Remo con barra inclinado",
        series: 4, repMin: 6, repMax: 10, basico: true,
        descanso: DESCANSO_BASICO, descansoTexto: TXT_BASICO,
        clave: "Torso a unos 45 grados, lleva la barra al abdomen bajo sin balancearte.",
        partes: [una("Barra", M.remoBarra)],
      },
      {
        id: "d3-remo-una-mano",
        nombre: "Remo a una mano con mancuerna, apoyado en el banco",
        series: 3, repMin: 8, repMax: 12, porLado: "lado",
        descanso: DESCANSO_RESTO, descansoTexto: TXT_RESTO,
        clave: "Jala hacia la cadera, no hacia el pecho, y no gires el torso.",
        partes: [una("Una mano", M.remoUnaMano)],
      },
      {
        id: "d3-remo-alto",
        nombre: "Remo al mentón suave o face pull improvisado (remo alto con mancuernas ligeras)",
        series: 2, repMin: 12, repMax: 15,
        descanso: DESCANSO_RESTO, descansoTexto: TXT_RESTO,
        clave: "Peso ligero, hombros sanos primero; si molesta, cambiar por elevaciones laterales inclinado (pájaros).",
        partes: [
          {
            variantes: [
              { etiqueta: "Remo al mentón", mov: M.remoMenton },
              { etiqueta: "Face pull", mov: M.facePull },
              { etiqueta: "Pájaros (si molesta)", mov: M.pajaros },
            ],
          },
        ],
      },
      {
        id: "d3-pajaros",
        nombre: "Pájaros (deltoide posterior) inclinado con mancuernas",
        series: 3, repMin: 12, repMax: 20,
        descanso: DESCANSO_RESTO, descansoTexto: TXT_RESTO,
        clave: "Pecho apoyado o torso inclinado, abre sin encoger los hombros.",
        partes: [una("Mancuernas", M.pajaros)],
      },
      {
        id: "d3-curl-barra",
        nombre: "Curl con barra",
        series: 3, repMin: 8, repMax: 12,
        descanso: DESCANSO_RESTO, descansoTexto: TXT_RESTO,
        clave: "Codos pegados, sin empujar con la cadera.",
        partes: [una("Barra", M.curlBarra)],
      },
      {
        id: "d3-curl-martillo",
        nombre: "Curl martillo con mancuernas",
        series: 3, repMin: 10, repMax: 15,
        descanso: DESCANSO_RESTO, descansoTexto: TXT_RESTO,
        clave: "Agarre neutro, baja en 2 segundos.",
        partes: [una("Mancuernas", M.curlMartillo)],
      },
    ],
  },
  {
    num: 4,
    titulo: "Cuerpo completo y brazos",
    ejercicios: [
      {
        id: "d4-press-banca",
        nombre: "Press en banco con barra o mancuernas",
        series: 3, repMin: 6, repMax: 10, basico: true,
        descanso: DESCANSO_BASICO, descansoTexto: TXT_BASICO,
        clave: "Busca igualar o superar por 1 repetición lo del Día 1.",
        partes: [
          {
            variantes: [
              { etiqueta: "Mancuernas", mov: M.pressBancaMancuernas },
              { etiqueta: "Barra", mov: M.pressBancaBarra },
            ],
          },
        ],
        referencia: { dia: 1, key: M.pressBancaMancuernas.key },
      },
      {
        id: "d4-bulgara",
        nombre: "Sentadilla búlgara o zancadas caminando con mancuernas",
        series: 3, repMin: 8, repMax: 12, porLado: "pierna",
        descanso: DESCANSO_RESTO, descansoTexto: TXT_RESTO,
        clave: "El segundo toque de pierna de la semana, más ligero que el Día 2.",
        partes: [
          {
            variantes: [
              { etiqueta: "Búlgara", mov: M.bulgara },
              { etiqueta: "Zancadas caminando", mov: M.zancadasCaminando },
            ],
          },
        ],
      },
      {
        id: "d4-remo",
        nombre: "Remo con mancuernas a dos manos, torso inclinado",
        series: 3, repMin: 10, repMax: 15,
        descanso: DESCANSO_RESTO, descansoTexto: TXT_RESTO,
        clave: "Aprieta la espalda 1 segundo en cada repetición.",
        partes: [una("Mancuernas", M.remoDosManos)],
      },
      {
        id: "d4-flexiones",
        nombre: "Flexiones en tabla (agarre cerrado) para tríceps",
        series: 2, repMin: 10, repMax: 20,
        descanso: DESCANSO_RESTO, descansoTexto: TXT_RESTO,
        clave: "Manos más juntas, codos pegados al cuerpo.",
        partes: [una("Agarre cerrado", M.flexionesCerrado)],
      },
      {
        id: "d4-superserie",
        nombre: "Superserie de brazos: curl con mancuernas + press francés en banco",
        series: 3, repMin: 10, repMax: 15, cadaUno: true,
        descanso: DESCANSO_SUPERSERIE, descansoTexto: "90 s al terminar la ronda",
        clave: "Sin descanso entre ambos, 90 segundos al terminar la ronda.",
        partes: [una("Curl", M.curlMancuernas), una("Press francés", M.pressFrances)],
      },
    ],
  },
];

// ---------- Día 5 (opcional) ----------
export const DIA5_TITULO = "Bombeo, core y puntos débiles";
export const DIA5_CONDICION = "Solo si se durmió bien y no hay dolor muscular fuerte.";
export const DIA5_CAMINATA = "Terminar con 15-20 minutos de caminata.";

/** Opciones para elegir 3-4: lo que más se quiera mejorar. 3 series de 12-20. */
export const DIA5_OPCIONES: Ejercicio[] = [
  {
    id: "d5-laterales", nombre: "Elevaciones laterales",
    series: 3, repMin: 12, repMax: 20, descanso: DESCANSO_RESTO, descansoTexto: TXT_RESTO,
    clave: "Sube hasta la altura del hombro, codos suaves, sin balanceo.",
    partes: [una("Mancuernas", M.laterales)],
  },
  {
    id: "d5-curl", nombre: "Curl",
    series: 3, repMin: 12, repMax: 20, descanso: DESCANSO_RESTO, descansoTexto: TXT_RESTO,
    clave: "Codos pegados, sin empujar con la cadera.",
    partes: [
      {
        variantes: [
          { etiqueta: "Mancuernas", mov: M.curlMancuernas },
          { etiqueta: "Barra", mov: M.curlBarra },
          { etiqueta: "Martillo", mov: M.curlMartillo },
        ],
      },
    ],
  },
  {
    id: "d5-flexiones", nombre: "Flexiones en tabla",
    series: 3, repMin: 12, repMax: 20, descanso: DESCANSO_RESTO, descansoTexto: TXT_RESTO,
    clave: "Cuerpo en línea recta.",
    partes: [
      {
        variantes: [
          { etiqueta: "Agarre medio", mov: M.flexionesMedio },
          { etiqueta: "Agarre cerrado", mov: M.flexionesCerrado },
        ],
      },
    ],
  },
  {
    id: "d5-gemelos", nombre: "Gemelos",
    series: 3, repMin: 12, repMax: 20, descanso: DESCANSO_RESTO, descansoTexto: TXT_RESTO,
    clave: "Pausa de 1 segundo abajo y arriba, rango completo.",
    partes: [una("Mancuernas", M.gemelos)],
  },
];

export const DIA5_CORE: Ejercicio[] = [
  {
    id: "d5-plancha", nombre: "Plancha",
    series: 3, repMin: 30, repMax: 60, unidad: "s", descanso: DESCANSO_RESTO, descansoTexto: TXT_RESTO,
    clave: "Cierra con core: plancha 3 x 30-60 segundos.",
    partes: [una("Plancha", M.plancha)],
  },
  {
    id: "d5-elev-piernas", nombre: "Elevaciones de piernas acostado",
    series: 3, repMin: 10, repMax: 15, descanso: DESCANSO_RESTO, descansoTexto: TXT_RESTO,
    clave: "Elevaciones de piernas acostado 3 x 10-15.",
    partes: [una("Acostado", M.elevPiernas)],
  },
];

export function diaCinco(seleccion: string[]): Dia {
  return {
    num: 5,
    titulo: DIA5_TITULO,
    opcional: true,
    ejercicios: [...DIA5_OPCIONES.filter((e) => seleccion.includes(e.id)), ...DIA5_CORE],
  };
}

export function getDia(num: number, seleccion5: string[] = []): Dia {
  if (num === 5) return diaCinco(seleccion5);
  return DIAS.find((d) => d.num === num)!;
}

// ---------- Reglas ----------
export const REGLAS = {
  rir: "Esfuerzo RIR 1-3: termina cada serie con 1 a 3 repeticiones en reserva y buena técnica.",
  progresion:
    "Progresión doble: primero llega al tope del rango de repeticiones con un peso; luego sube el menor incremento posible y vuelve a construir repeticiones.",
  descansos: "Descansos: 2-3 minutos en los básicos y 60-90 segundos en el resto.",
  calentamiento: "Calentamiento de 5-8 minutos antes de la primera serie efectiva.",
};

// ---------- Semana tipo ----------
// getDay(): 0 domingo … 6 sábado
export type Plan =
  | { tipo: "dia"; dia: number }
  | { tipo: "descanso-activo" }
  | { tipo: "descanso-total" };

export const SEMANA: { nombre: string; corto: string; plan: Plan }[] = [
  { nombre: "Lunes", corto: "Lu", plan: { tipo: "dia", dia: 1 } },
  { nombre: "Martes", corto: "Ma", plan: { tipo: "dia", dia: 2 } },
  { nombre: "Miércoles", corto: "Mi", plan: { tipo: "descanso-activo" } },
  { nombre: "Jueves", corto: "Ju", plan: { tipo: "dia", dia: 3 } },
  { nombre: "Viernes", corto: "Vi", plan: { tipo: "dia", dia: 4 } },
  { nombre: "Sábado", corto: "Sá", plan: { tipo: "dia", dia: 5 } },
  { nombre: "Domingo", corto: "Do", plan: { tipo: "descanso-total" } },
];

/** Índice 0 = lunes. */
export function indiceSemana(fecha: Date): number {
  return (fecha.getDay() + 6) % 7;
}

export function tituloDia(num: number): string {
  if (num === 5) return DIA5_TITULO;
  return DIAS.find((d) => d.num === num)?.titulo ?? "";
}

export function textoReps(e: Ejercicio): string {
  const u = e.unidad === "s" ? " s" : "";
  const lado = e.porLado ? ` por ${e.porLado}` : e.cadaUno ? " cada uno" : "";
  return `${e.series} x ${e.repMin}-${e.repMax}${u}${lado}`;
}
