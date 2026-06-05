export const FIRST_NAMES = [
  'Liam','Noah','Lucas','Mateo','Leo','Hugo','Louis','Jules','Adam','Sofia',
  'Marco','Diego','Carlos','Pablo','Sergio','Andrés','Joaquín','Iván','Rafa','Bruno',
  'Kai','Erik','Lars','Jonas','Felix','Maximilian','Jan','Tobias','Anton','Niko',
  'Pierre','Antoine','Théo','Mathis','Romain','Quentin','Enzo','Yanis','Nathan','Tom',
  'Mohamed','Yusuf','Omar','Hassan','Karim','Riad','Ismael','Adil','Zayd','Tariq',
  'Kenji','Hiro','Sho','Daiki','Ren','Min-jun','Ji-ho','Sung','Tao','Wei',
  'Kwame','Kofi','Sadio','Jamal','Aaron','Marcus','Jordan','Tyler','Ethan','Dylan'
];
export const LAST_NAMES = [
  'Silva','García','Martínez','Rodríguez','Hernández','López','Pérez','Sánchez','Ramírez','Torres',
  'Müller','Schmidt','Schneider','Fischer','Weber','Wagner','Becker','Hoffmann','Schäfer','Koch',
  'Dubois','Laurent','Martin','Bernard','Petit','Moreau','Lefebvre','Rousseau','Fontaine','Girard',
  'Rossi','Russo','Ferrari','Esposito','Bianchi','Romano','Colombo','Ricci','Marino','Greco',
  'Smith','Jones','Williams','Brown','Taylor','Wilson','Davies','Evans','Walker','Wright',
  'Diallo','Touré','Koné','Mensah','Owusu','Adeyemi','Okafor','Mbappé','Sané','Nkunku',
  'Tanaka','Suzuki','Sato','Watanabe','Ito','Kim','Park','Lee','Wang','Chen'
];
export const NATIONS = [
  '🇪🇸 ESP','🇩🇪 GER','🇫🇷 FRA','🇮🇹 ITA','🇬🇧 ENG','🇧🇷 BRA','🇦🇷 ARG','🇵🇹 POR',
  '🇳🇱 NED','🇧🇪 BEL','🇲🇽 MEX','🇺🇸 USA','🇯🇵 JPN','🇰🇷 KOR','🇲🇦 MAR','🇨🇮 CIV',
  '🇸🇳 SEN','🇳🇬 NGA','🇨🇴 COL','🇺🇾 URU','🇨🇭 SUI','🇦🇹 AUT','🇩🇰 DEN','🇸🇪 SWE',
];

export const FORMATIONS: Record<string, { GK:number; DEF:number; MID:number; ATT:number }> = {
  '4-3-3': { GK:1, DEF:4, MID:3, ATT:3 },
  '4-4-2': { GK:1, DEF:4, MID:4, ATT:2 },
  '4-2-3-1': { GK:1, DEF:4, MID:5, ATT:1 },
  '3-5-2': { GK:1, DEF:3, MID:5, ATT:2 },
  '5-3-2': { GK:1, DEF:5, MID:3, ATT:2 },
};

export const BADGES = ['⚽','🦅','🦁','🐺','⚓','⚔️','🌟','🛡️','🏰','🐉','🔥','⚡','🌹','👑','🐂','🦈'];
export const COLORS = [
  { primary: '#dc2626', secondary: '#0f172a' },
  { primary: '#2563eb', secondary: '#f8fafc' },
  { primary: '#16a34a', secondary: '#0f172a' },
  { primary: '#facc15', secondary: '#1e293b' },
  { primary: '#7c3aed', secondary: '#f8fafc' },
  { primary: '#ea580c', secondary: '#1e293b' },
  { primary: '#0891b2', secondary: '#f8fafc' },
  { primary: '#db2777', secondary: '#0f172a' },
];

export const CLUB_PRESETS_D1 = [
  { name: 'Manchester Rovers', short: 'MRV', badge: '🦁', city: 'Manchester' },
  { name: 'Real Madrigal', short: 'MAD', badge: '👑', city: 'Madrid' },
  { name: 'Bayern Stern', short: 'BST', badge: '⭐', city: 'Munich' },
  { name: 'Paris Lumière', short: 'PAR', badge: '🗼', city: 'Paris' },
  { name: 'Milano Nero', short: 'MIL', badge: '🛡️', city: 'Milan' },
  { name: 'Barcelona Azul', short: 'BAR', badge: '🔵', city: 'Barcelona' },
  { name: 'Liverpool Tides', short: 'LIV', badge: '⚓', city: 'Liverpool' },
  { name: 'Juventus Bianco', short: 'JUV', badge: '⚪', city: 'Turin' },
  { name: 'Amsterdam Ajax', short: 'AJX', badge: '⚔️', city: 'Amsterdam' },
  { name: 'Lisboa Águia', short: 'LIS', badge: '🦅', city: 'Lisbon' },
  { name: 'Porto Drago', short: 'POR', badge: '🐉', city: 'Porto' },
  { name: 'Roma Lupi', short: 'ROM', badge: '🐺', city: 'Rome' },
  { name: 'Sevilla Rosa', short: 'SEV', badge: '🌹', city: 'Seville' },
  { name: 'Dortmund Storm', short: 'DOR', badge: '⚡', city: 'Dortmund' },
  { name: 'Napoli Vesuvio', short: 'NAP', badge: '🔥', city: 'Naples' },
  { name: 'Glasgow Bulls', short: 'GLA', badge: '🐂', city: 'Glasgow' },
  { name: 'London Lions', short: 'LON', badge: '🦁', city: 'London' },
  { name: 'Madrid Atlético', short: 'ATM', badge: '🛡️', city: 'Madrid' },
  { name: 'Marseille Voile', short: 'MAR', badge: '⛵', city: 'Marseille' },
  { name: 'Valencia Bats', short: 'VAL', badge: '🦇', city: 'Valencia' },
];

export const CLUB_PRESETS_D2 = [
  'Leeds United','Norwich Canaries','Sunderland Black Cats','Sheffield Steel','Bristol City',
  'Espanyol Pericos','Real Betis','Celta Vigo','Mallorca Isla','Cádiz Submarino',
  'Schalke 04','Hamburger SV','Werder Bremen','Hertha Berlin','Köln Goats',
  'Lyon Olympique','Toulouse Pastel','Nice Aigles','Rennes Roussillon','Lille Mastiff',
].map((name, i) => ({ name, short: name.slice(0,3).toUpperCase(), badge: BADGES[i % BADGES.length], city: name.split(' ')[0] }));
