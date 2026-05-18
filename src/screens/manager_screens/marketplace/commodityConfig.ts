export interface SpecField {
  key:   string;
  label: string;
  unit:  string;   // e.g. "%", "ppb", "mm", or "" for free-text
}

export interface CommodityConfig {
  grades: string[];
  specs:  SpecField[];
}

export const COMMODITY_CONFIG: Record<string, CommodityConfig> = {
  Maize: {
    grades: ['Grade 1 – White', 'Grade 2 – White', 'Grade 1 – Yellow', 'Grade 2 – Yellow', 'Aflatoxin-Tested', 'Export Quality'],
    specs:  [
      { key: 'moisture',     label: 'Moisture Content', unit: '%' },
      { key: 'aflatoxin',    label: 'Aflatoxin Level',  unit: 'ppb' },
      { key: 'foreignMatter',label: 'Foreign Matter',   unit: '%' },
      { key: 'brokenGrains', label: 'Broken Grains',    unit: '%' },
    ],
  },
  'Rice (Paddy)': {
    grades: ['Extra Long Grain', 'Long Grain', 'Medium Grain', 'Short Grain', 'Parboiled', 'Organic'],
    specs:  [
      { key: 'moisture',       label: 'Moisture Content', unit: '%' },
      { key: 'millingRecovery',label: 'Milling Recovery', unit: '%' },
      { key: 'foreignMatter',  label: 'Foreign Matter',   unit: '%' },
      { key: 'brokenGrains',   label: 'Broken Grains',    unit: '%' },
    ],
  },
  Soybean: {
    grades: ['Food Grade', 'Feed Grade', 'Oil Grade', 'High Protein (>40%)', 'Export Quality'],
    specs:  [
      { key: 'moisture',      label: 'Moisture Content', unit: '%' },
      { key: 'protein',       label: 'Protein Content',  unit: '%' },
      { key: 'oilContent',    label: 'Oil Content',      unit: '%' },
      { key: 'aflatoxin',     label: 'Aflatoxin Level',  unit: 'ppb' },
      { key: 'foreignMatter', label: 'Foreign Matter',   unit: '%' },
    ],
  },
  Sorghum: {
    grades: ['Grade 1 – White', 'Grade 2 – White', 'Red Sorghum', 'Low Tannin', 'Brewing Grade', 'Export Quality'],
    specs:  [
      { key: 'moisture',      label: 'Moisture Content', unit: '%' },
      { key: 'tannin',        label: 'Tannin Level',     unit: '' },
      { key: 'foreignMatter', label: 'Foreign Matter',   unit: '%' },
      { key: 'brokenGrains',  label: 'Broken Grains',    unit: '%' },
    ],
  },
  Groundnut: {
    grades: ['Shelled – Grade A', 'Shelled – Grade B', 'Aflatoxin-Tested', 'Oil Grade', 'Confectionery Grade', 'Export Quality'],
    specs:  [
      { key: 'moisture',      label: 'Moisture Content', unit: '%' },
      { key: 'oilContent',    label: 'Oil Content',      unit: '%' },
      { key: 'aflatoxin',     label: 'Aflatoxin Level',  unit: 'ppb' },
      { key: 'foreignMatter', label: 'Foreign Matter',   unit: '%' },
    ],
  },
  Millet: {
    grades: ['Grade 1 – Pearl', 'Grade 2 – Pearl', 'Finger Millet', 'Low Moisture', 'Export Quality'],
    specs:  [
      { key: 'moisture',      label: 'Moisture Content', unit: '%' },
      { key: 'foreignMatter', label: 'Foreign Matter',   unit: '%' },
      { key: 'brokenGrains',  label: 'Broken Grains',    unit: '%' },
    ],
  },
  Cowpea: {
    grades: ['Grade A – White', 'Grade B – White', 'Brown / Honey-Eye', 'Black-Eyed', 'Insect-Free', 'Export Quality'],
    specs:  [
      { key: 'moisture',      label: 'Moisture Content', unit: '%' },
      { key: 'protein',       label: 'Protein Content',  unit: '%' },
      { key: 'foreignMatter', label: 'Foreign Matter',   unit: '%' },
      { key: 'insectDamage',  label: 'Insect Damage',    unit: '%' },
    ],
  },
  Sesame: {
    grades: ['White – Export Grade', 'Mixed', 'Brown', 'High Oil (>52%)', 'Natural / Organic'],
    specs:  [
      { key: 'moisture',      label: 'Moisture Content', unit: '%' },
      { key: 'oilContent',    label: 'Oil Content',      unit: '%' },
      { key: 'foreignMatter', label: 'Foreign Matter',   unit: '%' },
      { key: 'ffa',           label: 'Free Fatty Acid',  unit: '%' },
    ],
  },
  'Cocoa Beans': {
    grades: ['Grade 1 – Main Crop', 'Grade 2', 'Off-Grade', 'Export Quality', 'Fermented & Dried'],
    specs:  [
      { key: 'moisture',     label: 'Moisture Content', unit: '%' },
      { key: 'fermentation', label: 'Fermentation',     unit: '' },
      { key: 'mouldy',       label: 'Mouldy Beans',     unit: '%' },
      { key: 'slaty',        label: 'Slaty Beans',      unit: '%' },
    ],
  },
  Cassava: {
    grades: ['Fresh – Grade A', 'Fresh – Grade B', 'Premium Large Tubers', 'Dried Chips'],
    specs:  [
      { key: 'moisture',      label: 'Moisture Content',  unit: '%' },
      { key: 'starchContent', label: 'Starch Content',    unit: '%' },
      { key: 'foreignMatter', label: 'Foreign Matter',    unit: '%' },
    ],
  },
  'Palm Oil': {
    grades: ['Crude (CPO)', 'RBD Refined', 'Special Grade', 'Double Refined', 'Low FFA (<3%)'],
    specs:  [
      { key: 'ffa',       label: 'Free Fatty Acid',  unit: '%' },
      { key: 'moisture',  label: 'Moisture',          unit: '%' },
      { key: 'carotene',  label: 'Carotene Content',  unit: 'ppm' },
      { key: 'iodineVal', label: 'Iodine Value',      unit: '' },
    ],
  },
  'Palm Kernel': {
    grades: ['Grade A – Low Shell', 'Grade B', 'High Oil', 'Export Quality'],
    specs:  [
      { key: 'oilContent',    label: 'Oil Content',   unit: '%' },
      { key: 'shellContent',  label: 'Shell Content', unit: '%' },
      { key: 'moisture',      label: 'Moisture',      unit: '%' },
      { key: 'ffa',           label: 'Free Fatty Acid',unit: '%' },
    ],
  },
  'Irish Potato': {
    grades: ['Grade A – Large (>80mm)', 'Grade B – Medium (50–80mm)', 'Processing Grade', 'Seed Potato'],
    specs:  [
      { key: 'size',          label: 'Size Range',      unit: 'mm' },
      { key: 'moisture',      label: 'Moisture',         unit: '%' },
      { key: 'foreignMatter', label: 'Foreign Matter',   unit: '%' },
    ],
  },
};

export const ALL_COMMODITIES = [
  'Maize', 'Rice (Paddy)', 'Soybean', 'Sorghum', 'Groundnut', 'Millet',
  'Cowpea', 'Sesame', 'Cocoa Beans', 'Cassava', 'Palm Oil', 'Palm Kernel', 'Irish Potato',
];

export const NIGERIAN_STATES = [
  'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno',
  'Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT – Abuja','Gombe',
  'Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos',
  'Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto',
  'Taraba','Yobe','Zamfara',
];
