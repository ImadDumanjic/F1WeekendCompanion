const CIRCUIT_MAP_NAMES = {
  bahrain:       'Bahrain',
  jeddah:        'Saudi_Arabia',
  albert_park:   'Australia',
  suzuka:        'Japan',
  shanghai:      'China',
  miami:         'Miami',
  imola:         'Emilia_Romagna',
  monaco:        'Monaco',
  villeneuve:    'Canadian',
  catalunya:     'Spain',
  red_bull_ring: 'Austrian',
  silverstone:   'British',
  hungaroring:   'Hungarian',
  spa:           'Belgium',
  zandvoort:     'Dutch',
  monza:         'Italian',
  baku:          'Baku_City',
  marina_bay:    'Singapore',
  americas:      'United_States',
  rodriguez:     'Mexico_City',
  interlagos:    'Sao_Paulo',
  vegas:         'Las_Vegas',
  losail:        'Qatar',
  yas_marina:    'Abu_Dhabi',
};

const F1_CDN = 'https://www.formula1.com/content/dam/fom-website/2018-redesign-assets/Circuit%20maps%2016x9';

export function getCircuitFallbackUrl(circuitId) {
  const name = CIRCUIT_MAP_NAMES[circuitId?.toLowerCase()];
  return name ? `${F1_CDN}/${name}_Circuit.png.transform/5col/image.png` : null;
}
