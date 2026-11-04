// Crunchlab is a fictional brand. Every flavor drives the page theme,
// the generated pack art and the 3D lighting.
export const BRAND = 'CRUNCHLAB';

export const FLAVORS = [
  {
    id: 'classic',
    name: 'Classic Sea Salt',
    lines: ['Classic', 'Sea Salt'],
    color: '#F6C21C', ring1: '#F7C52A', ring2: '#EDB30E',
    deep: '#3A2600', glow: '#FFE58A', ink: '#2A1A00', season: '#FFFFFF',
    icon: 'crystal', heat: 0,
    tagline: 'Where it all starts. Thin, golden and salted just enough.',
    notes: ['Sea salt', 'Golden fry', 'Light crunch'],
  },
  {
    id: 'chili',
    name: 'Fire Chili Lime',
    lines: ['Fire Chili', 'Lime'],
    color: '#D7262E', ring1: '#C81E2A', ring2: '#B01523',
    deep: '#2B0306', glow: '#FF8A4C', ink: '#FFF3E8', season: '#8E0E16',
    icon: 'chili', heat: 4,
    tagline: 'Heat first, lime second, crunch the whole way through.',
    notes: ['Red chili', 'Lime zest', 'Big heat'],
  },
  {
    id: 'sourcream',
    name: 'Sour Cream & Chive',
    lines: ['Sour Cream', '& Chive'],
    color: '#2FA54F', ring1: '#2C9A4A', ring2: '#23873E',
    deep: '#04210E', glow: '#C6F59A', ink: '#F2FFF0', season: '#1E6B2E',
    icon: 'leaf', heat: 0,
    tagline: 'Cool, tangy and herby. The bag that disappears first.',
    notes: ['Sour cream', 'Fresh chive', 'Cool tang'],
  },
  {
    id: 'bbq',
    name: 'Smoky BBQ',
    lines: ['Smoky', 'BBQ'],
    color: '#9A4317', ring1: '#8C3A12', ring2: '#78300D',
    deep: '#1F0A02', glow: '#FFB25C', ink: '#FFF1E2', season: '#4A1C06',
    icon: 'flame', heat: 2,
    tagline: 'Slow-smoked, sweet and a little sticky. Backyard in a bag.',
    notes: ['Hickory smoke', 'Brown sugar', 'Paprika'],
  },
  {
    id: 'vinegar',
    name: 'Salt & Vinegar',
    lines: ['Salt &', 'Vinegar'],
    color: '#1F6FD1', ring1: '#1E66C2', ring2: '#1857A8',
    deep: '#03142E', glow: '#9AD6FF', ink: '#EEF6FF', season: '#E9F3FF',
    icon: 'drop', heat: 1,
    tagline: 'Sharp, puckery and impossible to stop eating.',
    notes: ['Malt vinegar', 'Sea salt', 'Sharp tang'],
  },
  {
    id: 'peri',
    name: 'Peri Peri Blaze',
    lines: ['Peri Peri', 'Blaze'],
    color: '#7A2CBF', ring1: '#6F26B0', ring2: '#5D1F96',
    deep: '#16052A', glow: '#FF6FB0', ink: '#F8EEFF', season: '#B0123F',
    icon: 'spark', heat: 5,
    tagline: "Bird's-eye chili, garlic and citrus. Our hottest bag yet.",
    notes: ['Peri peri', 'Garlic', 'Max heat'],
  },
];

export const DEFAULT_FLAVOR = 1;
