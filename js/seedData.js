/**
 * WC HUNTER — Base de Datos Seed V1.0
 * Incluye WCs reales verificados, logros completos, colecciones, misiones y rankings.
 */

export const INITIAL_USER = {
  id: "usr_pol_01",
  username: "Pol",
  avatar: "🧔‍♂️",
  level: 27,
  xp: 4820,
  reputation: 94,
  title: "🚽 Señor del Retrete",
  streak_days: 12,
  unlocked_titles: [
    "🚽 Señor del Retrete",
    "💩 El Caganer",
    "🧻 Príncipe del Papel",
    "🧼 Inspector de Higiene",
    "👃 Nariz de Hierro",
    "👑 Duque del Papel"
  ],
  stats: {
    visited_count: 87,
    discovered_count: 14,
    verifications_count: 132,
    photos_count: 46,
    cities_count: 12,
    countries_count: 4,
    achievements_count: 18,
    secrets_found: 6
  },
  unlocked_achievements: [
    "first_wc",
    "paper_hero",
    "clean_inspector",
    "city_explorer",
    "railway_caganer",
    "emergency_caganer",
    "night_caganer",
    "stadium_caganer"
  ],
  collection_stickers: [
    "trans_train",
    "trans_airport",
    "culture_prado",
    "culture_reina_sofia",
    "secret_hotel_w",
    "secret_circulo_bellas_artes",
    "secret_corte_ingles_callao"
  ]
};

export const ACHIEVEMENTS_CATALOG = [
  // Básicos
  {
    id: "first_wc",
    name: "🚽 Primer Cagón",
    description: "Utiliza y verifica tu primer WC en la aplicación.",
    category: "basic",
    rarity: "COMMON",
    xp: 50,
    hidden: false,
    icon: "🚽"
  },
  {
    id: "paper_hero",
    name: "🧻 Héroe del Papel",
    description: "Encuentra y reporta 10 WC con papel higiénico confirmado.",
    category: "basic",
    rarity: "COMMON",
    xp: 100,
    hidden: false,
    icon: "🧻"
  },
  {
    id: "clean_inspector",
    name: "🧼 Inspector de Higiene",
    description: "Valora la limpieza de al menos 10 WC diferentes.",
    category: "basic",
    rarity: "COMMON",
    xp: 100,
    hidden: false,
    icon: "🧼"
  },
  {
    id: "city_explorer",
    name: "🌍 Explorador Urbano",
    description: "Utiliza y verifica WC en al menos 3 ciudades diferentes.",
    category: "exploration",
    rarity: "RARE",
    xp: 150,
    hidden: false,
    icon: "🌍"
  },

  // Especiales / Categorías
  {
    id: "altitude_caganer",
    name: "✈️ Cagón de Altura",
    description: "Verifica el WC de un avión a más de 10.000 metros.",
    category: "special",
    rarity: "MYTHIC",
    xp: 500,
    hidden: true,
    icon: "✈️"
  },
  {
    id: "railway_caganer",
    name: "🚆 Cagón Ferroviario",
    description: "Usa el WC de un tren de media o larga distancia en marcha.",
    category: "special",
    rarity: "EPIC",
    xp: 200,
    hidden: false,
    icon: "🚆"
  },
  {
    id: "stadium_caganer",
    name: "🏟️ Cagón de Estadio",
    description: "Sobrevive al baño de un gran estadio en día de partido o concierto.",
    category: "special",
    rarity: "EPIC",
    xp: 250,
    hidden: false,
    icon: "🏟️"
  },
  {
    id: "beach_caganer",
    name: "🏖️ Cagón Playero",
    description: "Localiza un WC a pie de playa con ducha o lavapiés funcional.",
    category: "special",
    rarity: "RARE",
    xp: 120,
    hidden: false,
    icon: "🏖️"
  },
  {
    id: "institutional_caganer",
    name: "👮 Cagón Institucional",
    description: "Documenta el servicio de un edificio público o administrativo.",
    category: "special",
    rarity: "RARE",
    xp: 150,
    hidden: false,
    icon: "🏛️"
  },
  {
    id: "hospital_caganer",
    name: "🏥 Cagón Hospitalario",
    description: "Encuentra el WC más tranquilo y limpio de un hospital.",
    category: "special",
    rarity: "RARE",
    xp: 120,
    hidden: false,
    icon: "🏥"
  },
  {
    id: "university_caganer",
    name: "🎓 Cagón Universitario",
    description: "Documenta el mítico baño secreto de la última planta de la facultad.",
    category: "special",
    rarity: "RARE",
    xp: 120,
    hidden: false,
    icon: "🎓"
  },

  // Dinámicos / Circunstanciales
  {
    id: "night_caganer",
    name: "🌙 Cagón Nocturno",
    description: "Verifica un WC abierto entre la 01:00 y las 06:00 de la madrugada.",
    category: "dynamic",
    rarity: "RARE",
    xp: 180,
    hidden: false,
    icon: "🌙"
  },
  {
    id: "emergency_caganer",
    name: "🚨 Cagón de Emergencia",
    description: "Activa el modo 'Necesito WC' y completa una valoración tras usarlo.",
    category: "dynamic",
    rarity: "RARE",
    xp: 150,
    hidden: false,
    icon: "🚨"
  },
  {
    id: "speed_caganer",
    name: "⏱️ Speed Caganer",
    description: "Llega y verifica un WC en menos de 4 minutos tras la emergencia.",
    category: "dynamic",
    rarity: "EPIC",
    xp: 250,
    hidden: true,
    icon: "⚡"
  },
  {
    id: "secret_master",
    name: "🔐 Maestro de los Secretos",
    description: "Descubre y documenta 3 WCs clasificados como Secretos.",
    category: "special",
    rarity: "LEGENDARY",
    xp: 350,
    hidden: false,
    icon: "🔐"
  }
];

export const MISSIONS_LIST = [
  {
    id: "mis_paper_10",
    title: "🧻 Operación Papel",
    description: "Verifica el papel higiénico de 2 WC hoy.",
    progress: 1,
    target: 2,
    xp_reward: 80,
    badge: "Diaria",
    completed: false
  },
  {
    id: "mis_clean_check",
    title: "🧼 Patrulla de Limpieza",
    description: "Confirma el estado de limpieza en cualquier WC de tu ciudad.",
    progress: 0,
    target: 1,
    xp_reward: 50,
    badge: "Diaria",
    completed: false
  },
  {
    id: "mis_secret_hunt",
    title: "🔐 Cazador de Secretos",
    description: "Visita o descubre 1 WC secreto no documentado.",
    progress: 0,
    target: 1,
    xp_reward: 150,
    badge: "Semanal",
    completed: false
  }
];

export const COLLECTIONS = [
  {
    id: "col_transports",
    title: "Colección: Transportes",
    description: "Domina los retretes de la movilidad terrestre y aérea.",
    reward_title: "🏆 Viajero del Retrete",
    stickers: [
      { id: "trans_train", name: "Tren de Larga Distancia", icon: "🚆", collected: true },
      { id: "trans_airport", name: "Aeropuerto Adolfo Suárez", icon: "✈️", collected: true },
      { id: "trans_metro", name: "Estación de Metro", icon: "🚇", collected: false },
      { id: "trans_plane", name: "Avión en Crucero", icon: "💺", collected: false }
    ]
  },
  {
    id: "col_culture",
    title: "Templos de la Cultura",
    description: "Los baños de los grandes museos y teatros.",
    reward_title: "🎨 Intelectual del Baño",
    stickers: [
      { id: "culture_prado", name: "Museo del Prado", icon: "🏛️", collected: true },
      { id: "culture_reina_sofia", name: "Reina Sofía", icon: "🖼️", collected: true },
      { id: "culture_teatro_real", name: "Teatro Real", icon: "🎭", collected: false },
      { id: "culture_sagrada_fam", name: "Cripta Sagrada Família", icon: "⛪", collected: false }
    ]
  },
  {
    id: "col_secrets",
    title: "WCs Secretos & Clandestinos",
    description: "Oasis de tranquilidad ocultos a simple vista.",
    reward_title: "🔐 Fantasma de la Porcelana",
    stickers: [
      { id: "secret_hotel_w", name: "Hotel W Barcelona (Planta 26)", icon: "🏨", collected: true },
      { id: "secret_circulo_bellas_artes", name: "Círculo de Bellas Artes", icon: "🎨", collected: true },
      { id: "secret_corte_ingles_callao", name: "Gourmet Experience Callao", icon: "🛍️", collected: true },
      { id: "secret_palacio_cibeles", name: "Palacio de Cibeles (Planta 6)", icon: "🏰", collected: false }
    ]
  }
];

export const INITIAL_WCS = [
  {
    id: "wc_mad_prado",
    name: "WC Museo del Prado (Claustro Planta Baja)",
    latitude: 40.41378,
    longitude: -3.69212,
    address: "Calle de Ruiz de Alarcón, 23",
    city: "Madrid",
    country: "España",
    type: "museum",
    rarity: "RARE",
    difficulty: 3,
    access_type: "ticket_required",
    access_label: "🎫 Entrada al Museo / Gratuito 18-20h",
    price: 0.0,
    opening_hours: "10:00 - 20:00",
    equipment: {
      paper: true,
      soap: true,
      water: true,
      mirror: true,
      dryer: true,
      baby_changing: true,
      wheelchair: true,
      bidet: false,
      lock_functional: true
    },
    score: 93,
    score_breakdown: {
      cleanliness: 96,
      odor: 92,
      paper: 100,
      soap: 95,
      privacy: 90,
      condition: 94,
      price: 85
    },
    confidence: 96,
    current_status: "open",
    personality_tag: "👑 EL PALACIO",
    personality_desc: "Mármol impoluto, música clásica de fondo y dispensadores automáticos siempre llenos.",
    last_verified_at: new Date(Date.now() - 1000 * 60 * 18).toISOString(), // hace 18 min
    would_return_ratio: { yes: 94, no: 6 },
    is_secret: false,
    photos: [
      {
        url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80",
        caption: "Lavabos de diseño en la planta baja",
        uploaded_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
        category: "cleanliness"
      }
    ],
    creator_name: "Pol",
    reviews_count: 52
  },
  {
    id: "wc_mad_atocha",
    name: "WC Estación Atocha Cercanías (Jardín Tropical)",
    latitude: 40.40656,
    longitude: -3.69085,
    address: "Plaza del Emperador Carlos V",
    city: "Madrid",
    country: "España",
    type: "train",
    rarity: "COMMON",
    difficulty: 4,
    access_type: "paid",
    access_label: "💰 1,00 € (Torno con tarjeta)",
    price: 1.0,
    opening_hours: "06:00 - 23:30",
    equipment: {
      paper: true,
      soap: true,
      water: true,
      mirror: true,
      dryer: true,
      baby_changing: true,
      wheelchair: true,
      bidet: false,
      lock_functional: true
    },
    score: 82,
    score_breakdown: {
      cleanliness: 88,
      odor: 80,
      paper: 95,
      soap: 90,
      privacy: 85,
      condition: 84,
      price: 60
    },
    confidence: 91,
    current_status: "open",
    personality_tag: "💎 EL WC PREMIUM",
    personality_desc: "De pago (One Hundred Restrooms), pero con asiento autodesinfectante y música chillout.",
    last_verified_at: new Date(Date.now() - 1000 * 60 * 42).toISOString(), // hace 42 min
    would_return_ratio: { yes: 88, no: 12 },
    is_secret: false,
    photos: [
      {
        url: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?auto=format&fit=crop&w=600&q=80",
        caption: "Tornos de acceso y pantallas interactivas",
        uploaded_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
        category: "access"
      }
    ],
    creator_name: "CaganerPro",
    reviews_count: 88
  },
  {
    id: "wc_mad_callao_corte",
    name: "WC Secreto Gourmet Callao (Planta 9)",
    latitude: 40.42012,
    longitude: -3.70582,
    address: "Plaza del Callao, 2",
    city: "Madrid",
    country: "España",
    type: "shopping_mall",
    rarity: "LEGENDARY",
    difficulty: 6,
    access_type: "free",
    access_label: "🆓 Gratis (Entra al fondo a la derecha del Gourmet)",
    price: 0.0,
    opening_hours: "10:00 - 22:00",
    equipment: {
      paper: true,
      soap: true,
      water: true,
      mirror: true,
      dryer: true,
      baby_changing: false,
      wheelchair: true,
      bidet: false,
      lock_functional: true
    },
    score: 95,
    score_breakdown: {
      cleanliness: 98,
      odor: 95,
      paper: 100,
      soap: 98,
      privacy: 96,
      condition: 96,
      price: 100
    },
    confidence: 94,
    current_status: "open",
    personality_tag: "👑 EL PALACIO",
    personality_desc: "El mejor baño gratuito del centro de Madrid. Vistas panorámicas y privacidad absoluta.",
    last_verified_at: new Date(Date.now() - 1000 * 60 * 12).toISOString(), // hace 12 min
    would_return_ratio: { yes: 98, no: 2 },
    is_secret: true,
    photos: [
      {
        url: "https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=600&q=80",
        caption: "Cabinas individuales amplias y silenciosas",
        uploaded_at: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString(),
        category: "cleanliness"
      }
    ],
    creator_name: "Pol",
    reviews_count: 42
  },
  {
    id: "wc_mad_sol_public",
    name: "Cabina Autolimpiable Puerta del Sol",
    latitude: 40.41695,
    longitude: -3.70356,
    address: "Puerta del Sol esquina Calle Alcalá",
    city: "Madrid",
    country: "España",
    type: "public_street",
    rarity: "COMMON",
    difficulty: 2,
    access_type: "paid",
    access_label: "💰 0,50 € (Moneda exacta)",
    price: 0.5,
    opening_hours: "24 Horas",
    equipment: {
      paper: true,
      soap: true,
      water: true,
      mirror: false,
      dryer: true,
      baby_changing: false,
      wheelchair: true,
      bidet: false,
      lock_functional: true
    },
    score: 64,
    score_breakdown: {
      cleanliness: 60,
      odor: 55,
      paper: 80,
      soap: 70,
      privacy: 75,
      condition: 60,
      price: 70
    },
    confidence: 88,
    current_status: "open",
    personality_tag: "🏚️ EL SUPERVIVIENTE",
    personality_desc: "Suelo habitualmente mojado tras el lavado automático. Te saca de un apuro de madrugada.",
    last_verified_at: new Date(Date.now() - 1000 * 60 * 75).toISOString(),
    would_return_ratio: { yes: 61, no: 39 },
    is_secret: false,
    photos: [],
    creator_name: "SolWalker",
    reviews_count: 34
  },
  {
    id: "wc_mad_cibeles_palace",
    name: "WC CentroCentro Palacio de Cibeles (Planta 3)",
    latitude: 40.41873,
    longitude: -3.69234,
    address: "Plaza de Cibeles, 1",
    city: "Madrid",
    country: "España",
    type: "public_building",
    rarity: "RARE",
    difficulty: 4,
    access_type: "free",
    access_label: "🆓 Entrada libre al edificio cultural",
    price: 0.0,
    opening_hours: "10:00 - 20:00",
    equipment: {
      paper: true,
      soap: true,
      water: true,
      mirror: true,
      dryer: true,
      baby_changing: true,
      wheelchair: true,
      bidet: false,
      lock_functional: true
    },
    score: 91,
    score_breakdown: {
      cleanliness: 94,
      odor: 90,
      paper: 95,
      soap: 92,
      privacy: 88,
      condition: 92,
      price: 95
    },
    confidence: 90,
    current_status: "open",
    personality_tag: "👑 EL PALACIO",
    personality_desc: "Muy poco transitado entre semana. Cabinas de madera y lavamanos siempre impecables.",
    last_verified_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    would_return_ratio: { yes: 93, no: 7 },
    is_secret: true,
    photos: [],
    creator_name: "MadridHunter",
    reviews_count: 26
  },
  {
    id: "wc_mad_retiro_lake",
    name: "WC Público Parque de El Retiro (Junto al Estanque)",
    latitude: 40.41682,
    longitude: -3.68351,
    address: "Paseo de Colombia, Parque de El Retiro",
    city: "Madrid",
    country: "España",
    type: "public_park",
    rarity: "COMMON",
    difficulty: 2,
    access_type: "free",
    access_label: "🆓 Gratuito (Horario parque)",
    price: 0.0,
    opening_hours: "09:00 - 21:00",
    equipment: {
      paper: false,
      soap: true,
      water: true,
      mirror: true,
      dryer: false,
      baby_changing: true,
      wheelchair: true,
      bidet: false,
      lock_functional: true
    },
    score: 52,
    score_breakdown: {
      cleanliness: 48,
      odor: 42,
      paper: 30,
      soap: 60,
      privacy: 70,
      condition: 50,
      price: 90
    },
    confidence: 84,
    current_status: "open",
    personality_tag: "🌵 EL DESIERTO",
    personality_desc: "Casi siempre sin papel higiénico. Lleva tus propios pañuelos o sufre las consecuencias.",
    last_verified_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    would_return_ratio: { yes: 45, no: 55 },
    is_secret: false,
    photos: [],
    creator_name: "RunnerRetiro",
    reviews_count: 65
  },
  {
    id: "wc_bcn_placa_cat",
    name: "WC El Triangle (Plaza Catalunya)",
    latitude: 41.38672,
    longitude: 2.16912,
    address: "Plaça de Catalunya, 1-4",
    city: "Barcelona",
    country: "España",
    type: "shopping_mall",
    rarity: "COMMON",
    difficulty: 3,
    access_type: "paid",
    access_label: "💰 0,80 € (O ticket de compra)",
    price: 0.8,
    opening_hours: "09:30 - 21:30",
    equipment: {
      paper: true,
      soap: true,
      water: true,
      mirror: true,
      dryer: true,
      baby_changing: true,
      wheelchair: true,
      bidet: false,
      lock_functional: true
    },
    score: 84,
    score_breakdown: {
      cleanliness: 90,
      odor: 86,
      paper: 95,
      soap: 90,
      privacy: 82,
      condition: 85,
      price: 70
    },
    confidence: 93,
    current_status: "open",
    personality_tag: "💎 EL WC PREMIUM",
    personality_desc: "Rápido, limpio y con personal constante de limpieza en la puerta.",
    last_verified_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    would_return_ratio: { yes: 89, no: 11 },
    is_secret: false,
    photos: [],
    creator_name: "BcnRamblas",
    reviews_count: 112
  },
  {
    id: "wc_bcn_hotel_w",
    name: "WC Secreto Eclipse Lounge Hotel W (Planta 26)",
    latitude: 41.36884,
    longitude: 2.19015,
    address: "Plaça Rosa dels Vents, 1",
    city: "Barcelona",
    country: "España",
    type: "luxury_hotel",
    rarity: "MYTHIC",
    difficulty: 9,
    access_type: "customers_only",
    access_label: "🍸 Solo clientes o acceso seguro por ascensor",
    price: 0.0,
    opening_hours: "18:00 - 02:00",
    equipment: {
      paper: true,
      soap: true,
      water: true,
      mirror: true,
      dryer: true,
      baby_changing: false,
      wheelchair: true,
      bidet: true,
      lock_functional: true
    },
    score: 98,
    score_breakdown: {
      cleanliness: 100,
      odor: 100,
      paper: 100,
      soap: 100,
      privacy: 98,
      condition: 100,
      price: 88
    },
    confidence: 89,
    current_status: "open",
    personality_tag: "👑 EL PALACIO",
    personality_desc: "El santo grial de los baños con vistas al mar Mediterráneo desde 100 metros de altura.",
    last_verified_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    would_return_ratio: { yes: 99, no: 1 },
    is_secret: true,
    photos: [],
    creator_name: "Pol",
    reviews_count: 19
  }
];

export const TOP_HUNTERS_LEADERBOARD = [
  { rank: 1, name: "🚽 MasterFlush_99", title: "👑 Leyenda del Retrete", xp: 12450, discovered: 42, verifs: 310, rep: 98, city: "Madrid" },
  { rank: 2, name: "Pol (Tú)", title: "🚽 Señor del Retrete", xp: 4820, discovered: 14, verifs: 132, rep: 94, city: "Madrid" },
  { rank: 3, name: "🧻 PapelMan", title: "Príncipe del Papel", xp: 4100, discovered: 11, verifs: 98, rep: 92, city: "Barcelona" },
  { rank: 4, name: "LaReinaDelTrono", title: "Inspectora Suprema", xp: 3750, discovered: 9, verifs: 114, rep: 95, city: "Valencia" },
  { rank: 5, name: "CaganerNinja", title: "Explorador de Cloacas", xp: 3200, discovered: 8, verifs: 76, rep: 89, city: "Sevilla" }
];
