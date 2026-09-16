/**
 * WC HUNTER — Base de Datos Seed V2.0
 */

export const INITIAL_USER = {
  id: "usr_pol_01",
  username: "PolM",
  avatar: "🧔‍♂️",
  level: 18,
  xp: 3840,
  reputation: 96,
  title: "🚽 Duque del Retrete",
  streak_days: 7,
  unlocked_titles: [
    "🚽 Duque del Retrete",
    "💩 El Caganer",
    "🧻 Príncipe del Papel",
    "🧼 Inspector de Higiene",
    "👃 Nariz de Hierro",
    "✈️ Cagón de Altura",
    "🔐 Maestro de los Secretos",
    "🌍 Cagador Internacional",
    "👑 Emperador del WC"
  ],
  stats: {
    visited_count: 87,
    discovered_count: 14,
    verifications_count: 132,
    photos_count: 46,
    cities_count: 12,
    countries_count: 4,
    achievements_count: 34,
    secrets_found: 7
  },
  unlocked_achievements: [
    "first_wc",
    "paper_hero",
    "clean_inspector",
    "city_explorer",
    "railway_caganer",
    "emergency_caganer",
    "night_caganer",
    "stadium_caganer",
    "altitude_caganer"
  ],
  collection_counts: {
    collected: 42,
    total: 120
  }
};

export const UPCOMING_ACHIEVEMENTS = [
  { id: "altitude_caganer", name: "✈️ Cagón de altura", progress: "1/1", completed: true, icon: "✈️" },
  { id: "police_caganer", name: "🚓 Cagón de comisaría", progress: "0/1", completed: false, icon: "🚓" },
  { id: "stadium_caganer", name: "🏟️ Cagón de estadio", progress: "2/1", completed: true, icon: "🏟️" },
  { id: "secret_hunter", name: "🔐 Cazador secreto", progress: "4/10", completed: false, icon: "🔐" }
];

export const ACHIEVEMENTS_CATALOG = [
  { id: "first_wc", name: "Primer Marcaje", description: "Descubre o verifica tu primer WC.", xp: 50, icon: "🚽" },
  { id: "paper_hero", name: "Héroe del Papel", description: "Verifica 10 WC que sí tenían papel higiénico.", xp: 100, icon: "🧻" },
  { id: "clean_inspector", name: "Inspector de Higiene", description: "Reporta 5 WC limpios e impecables.", xp: 80, icon: "🧼" },
  { id: "city_explorer", name: "Conquistador Urbano", description: "Visita y verifica WC en 3 ciudades distintas.", xp: 150, icon: "🏙️" },
  { id: "railway_caganer", name: "Cagón de Vía", description: "Usa un WC en estación de tren o metro.", xp: 100, icon: "🚆" },
  { id: "emergency_caganer", name: "Salvador en Apuros", description: "Usa el modo emergencia y encuentra WC a tiempo.", xp: 120, icon: "🚨" },
  { id: "night_caganer", name: "Cagón Nocturno", description: "Verifica un WC entre las 00:00 y las 06:00.", xp: 150, icon: "🌙" },
  { id: "stadium_caganer", name: "Cagón de Estadio", description: "Registra un WC en un estadio deportivo.", xp: 200, icon: "🏟️" },
  { id: "altitude_caganer", name: "Cagón de Altura", description: "Registra un WC en avión o a gran altura.", xp: 300, icon: "✈️" },
  { id: "secret_master", name: "Maestro de los Secretos", description: "Descubre y documenta 5 WC secretos.", xp: 250, icon: "🔐" },
  { id: "vip_caganer", name: "Trono de Oro", description: "Usa un WC con puntuación 95+ de gran confort.", xp: 150, icon: "👑" },
  { id: "police_caganer", name: "Cagón de Comisaría", description: "Usa un WC dentro de una comisaría de policía.", xp: 400, icon: "🚓", hidden: true },
  { id: "lighthouse_caganer", name: "Cagón del Faro", description: "Encuentra un WC en un faro o punto marítimo remoto.", xp: 500, icon: "🗼", hidden: true },
  { id: "iron_stomach", name: "Estómago de Hierro", description: "Sobrevive a un WC con score menor a 30.", xp: 100, icon: "🤢", hidden: true }
];

export const MISSIONS_LIST = [
  { id: "mis_paper_10", title: "Rastreador de Celulosa", description: "Encuentra 5 WC con papel higiénico disponible", progress: 3, target: 5, xp_reward: 75, completed: false },
  { id: "mis_clean_check", title: "Control de Calidad", description: "Verifica 3 WC limpios esta semana", progress: 2, target: 3, xp_reward: 50, completed: false },
  { id: "mis_secret_hunt", title: "Caza Secreta", description: "Descubre 1 WC secreto no documentado", progress: 0, target: 1, xp_reward: 150, completed: false }
];

export const COLLECTIONS = [
  { id: "public", name: "Públicos Urbanos", icon: "🚽", collected: 18, total: 30, color: "emerald" },
  { id: "transport", name: "Transporte y Viajes", icon: "✈️", collected: 5, total: 12, color: "blue" },
  { id: "culture", name: "Cultura y Museos", icon: "🏛️", collected: 4, total: 15, color: "amber" },
  { id: "sports", name: "Deportes y Estadios", icon: "🏟️", collected: 3, total: 8, color: "indigo" },
  { id: "secrets", name: "WCs Secretos", icon: "🔐", collected: 7, total: 20, color: "purple" }
];

export const COLLECTION_CATEGORIES = COLLECTIONS;


export const INITIAL_WCS = [
  {
    id: "wc_mad_prado",
    name: "WC Museo del Prado (Claustro)",
    latitude: 40.41378,
    longitude: -3.69212,
    address: "Calle de Ruiz de Alarcón, 23",
    city: "Madrid",
    country: "España",
    type: "museum",
    rarity: "RARE",
    difficulty: 3,
    access_type: "free",
    access_label: "Entrada Museo / Gratuito 18-20h",
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
    score: 94,
    score_breakdown: {
      cleanliness: 96,
      odor: 92,
      paper: 100,
      soap: 95,
      privacy: 90,
      condition: 94,
      price: 90
    },
    confidence: 96,
    current_status: "open",
    personality_tag: "👑 EL PALACIO",
    personality_desc: "Mármol impoluto, música clásica tenue y dispensadores siempre llenos.",
    last_verified_at: new Date(Date.now() - 1000 * 60 * 4).toISOString(), // hace 4 min
    would_return_ratio: { yes: 48, no: 2 },
    is_secret: false,
    discovered_by: "PolM",
    discovered_date: "16 sept 2026",
    verified_by_count: 14,
    photos: [
      {
        url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80",
        caption: "Lavabos de mármol en planta baja",
        uploaded_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
        category: "cleanliness"
      }
    ],
    reviews_count: 52
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
    access_label: "Entrada libre por planta Gourmet",
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
    score: 96,
    score_breakdown: {
      cleanliness: 98,
      odor: 95,
      paper: 100,
      soap: 98,
      privacy: 96,
      condition: 96,
      price: 100
    },
    confidence: 97,
    current_status: "open",
    personality_tag: "👑 EL PALACIO",
    personality_desc: "El mejor baño gratuito del centro de Madrid con vistas panorámicas.",
    last_verified_at: new Date(Date.now() - 1000 * 60 * 8).toISOString(), // hace 8 min
    would_return_ratio: { yes: 62, no: 1 },
    is_secret: true,
    discovered_by: "PolM",
    discovered_date: "14 sept 2026",
    verified_by_count: 22,
    photos: [],
    reviews_count: 42
  },
  {
    id: "wc_mad_atocha",
    name: "WC Atocha (One Hundred Restrooms)",
    latitude: 40.40656,
    longitude: -3.69085,
    address: "Plaza del Emperador Carlos V",
    city: "Madrid",
    country: "España",
    type: "train",
    rarity: "COMMON",
    difficulty: 4,
    access_type: "paid",
    access_label: "1,00 € con tarjeta en torno",
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
    score: 84,
    score_breakdown: {
      cleanliness: 90,
      odor: 82,
      paper: 95,
      soap: 92,
      privacy: 85,
      condition: 86,
      price: 60
    },
    confidence: 94,
    current_status: "open",
    personality_tag: "💎 EL WC PREMIUM",
    personality_desc: "De pago, pero con autodesinfección de asiento e hilo musical.",
    last_verified_at: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    would_return_ratio: { yes: 78, no: 10 },
    is_secret: false,
    discovered_by: "CaganerPro",
    discovered_date: "10 sept 2026",
    verified_by_count: 35,
    photos: [],
    reviews_count: 88
  },
  {
    id: "wc_mad_sol_public",
    name: "Cabina Autolimpiable Puerta del Sol",
    latitude: 40.41695,
    longitude: -3.70356,
    address: "Puerta del Sol s/n",
    city: "Madrid",
    country: "España",
    type: "public_street",
    rarity: "COMMON",
    difficulty: 2,
    access_type: "paid",
    access_label: "0,50 € (Moneda exacta)",
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
    score: 62,
    score_breakdown: {
      cleanliness: 55,
      odor: 45,
      paper: 75,
      soap: 65,
      privacy: 75,
      condition: 60,
      price: 70
    },
    confidence: 88,
    current_status: "open",
    personality_tag: "🏚️ EL SUPERVIVIENTE",
    personality_desc: "Suelo mojado por el ciclo de lavado. Te salva en una noche de fiesta.",
    last_verified_at: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
    would_return_ratio: { yes: 35, no: 28 },
    is_secret: false,
    discovered_by: "SolWalker",
    discovered_date: "12 sept 2026",
    verified_by_count: 19,
    photos: [],
    reviews_count: 34
  },
  {
    id: "wc_mad_cibeles_palace",
    name: "WC CentroCentro Palacio de Cibeles",
    latitude: 40.41873,
    longitude: -3.69234,
    address: "Plaza de Cibeles, 1 (Planta 3)",
    city: "Madrid",
    country: "España",
    type: "public_building",
    rarity: "RARE",
    difficulty: 4,
    access_type: "free",
    access_label: "Entrada libre al edificio",
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
      cleanliness: 93,
      odor: 90,
      paper: 95,
      soap: 90,
      privacy: 88,
      condition: 90,
      price: 95
    },
    confidence: 92,
    current_status: "open",
    personality_tag: "👑 EL PALACIO",
    personality_desc: "Gran tranquilidad entre semana. Cabinas de madera muy cuidadas.",
    last_verified_at: new Date(Date.now() - 1000 * 60 * 110).toISOString(),
    would_return_ratio: { yes: 41, no: 3 },
    is_secret: true,
    discovered_by: "PolM",
    discovered_date: "15 sept 2026",
    verified_by_count: 8,
    photos: [],
    reviews_count: 26
  },
  {
    id: "wc_bcn_hotel_w",
    name: "WC Eclipse Lounge Hotel W (Planta 26)",
    latitude: 41.36884,
    longitude: 2.19015,
    address: "Plaça Rosa dels Vents, 1",
    city: "Barcelona",
    country: "España",
    type: "luxury_hotel",
    rarity: "MYTHIC",
    difficulty: 9,
    access_type: "customers_only",
    access_label: "Solo clientes o acceso seguro ascensor",
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
      price: 85
    },
    confidence: 90,
    current_status: "open",
    personality_tag: "👑 EL PALACIO",
    personality_desc: "El santo grial con vistas panorámicas al mar a 100 metros de altura.",
    last_verified_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    would_return_ratio: { yes: 54, no: 1 },
    is_secret: true,
    discovered_by: "PolM",
    discovered_date: "15 sept 2026",
    verified_by_count: 18,
    photos: [],
    reviews_count: 19
  }
];

export const TOP_HUNTERS_LEADERBOARD = [
  { rank: 1, name: "🚽 MasterFlush_99", title: "👑 Leyenda del Retrete", xp: 12450, discovered: 42, verifs: 310, rep: 98, city: "Madrid" },
  { rank: 2, name: "PolM (Tú)", title: "🚽 Duque del Retrete", xp: 3840, discovered: 14, verifs: 132, rep: 96, city: "Madrid" },
  { rank: 3, name: "🧻 PapelMan", title: "Príncipe del Papel", xp: 3510, discovered: 11, verifs: 98, rep: 92, city: "Barcelona" },
  { rank: 4, name: "LaReinaDelTrono", title: "Inspectora Suprema", xp: 3250, discovered: 9, verifs: 114, rep: 95, city: "Valencia" },
  { rank: 5, name: "CaganerNinja", title: "Explorador de Cloacas", xp: 2900, discovered: 8, verifs: 76, rep: 89, city: "Sevilla" }
];
