// Popular cities per country. The first city of each country is its "hub"
// (same as `hub` in countries.js) and the default choice.
//
// Row: [name, lat, lon, priceFactor, iata]
//  - name: local/English proper name (not translated on purpose)
//  - priceFactor: DEMO multiplier on the country's price index (1 = country
//    average used by the hub); only feeds the approximate cost model
//  - iata: city/airport code for flight searches, or null when the city has
//    no airport of its own (the country's main code is used instead)

import { cityCode, getCountry } from './countries.js';

const RAW = {
  UA: [['Kyiv', 50.45, 30.52, 1, 'IEV'], ['Lviv', 49.84, 24.03, 0.9, 'LWO'], ['Odesa', 46.48, 30.72, 0.9, 'ODS'], ['Kharkiv', 49.99, 36.23, 0.85, 'HRK'], ['Uzhhorod', 48.62, 22.29, 0.85, 'UDJ']],
  PL: [['Kraków', 50.06, 19.94, 1, 'KRK'], ['Warsaw', 52.23, 21.01, 1.1, 'WAW'], ['Gdańsk', 54.35, 18.65, 1, 'GDN'], ['Wrocław', 51.11, 17.03, 0.95, 'WRO'], ['Zakopane', 49.3, 19.95, 1, null]],
  CZ: [['Prague', 50.08, 14.44, 1, 'PRG'], ['Brno', 49.2, 16.61, 0.85, 'BRQ'], ['Český Krumlov', 48.81, 14.32, 0.9, null], ['Karlovy Vary', 50.23, 12.87, 0.95, 'KLV']],
  SK: [['Bratislava', 48.15, 17.11, 1, 'BTS'], ['Košice', 48.72, 21.26, 0.85, 'KSC'], ['Poprad', 49.06, 20.3, 0.9, 'TAT']],
  HU: [['Budapest', 47.5, 19.04, 1, 'BUD'], ['Debrecen', 47.53, 21.63, 0.8, 'DEB'], ['Pécs', 46.07, 18.23, 0.8, null], ['Siófok', 46.9, 18.05, 0.95, null]],
  RO: [['Bucharest', 44.43, 26.1, 1, 'BUH'], ['Cluj-Napoca', 46.77, 23.59, 0.95, 'CLJ'], ['Brașov', 45.66, 25.61, 0.95, null], ['Sibiu', 45.79, 24.15, 0.9, 'SBZ'], ['Constanța', 44.17, 28.64, 0.9, 'CND']],
  BG: [['Sofia', 42.7, 23.32, 1, 'SOF'], ['Varna', 43.21, 27.91, 1, 'VAR'], ['Burgas', 42.5, 27.47, 1, 'BOJ'], ['Plovdiv', 42.14, 24.75, 0.9, 'PDV'], ['Bansko', 41.84, 23.49, 1, null]],
  MD: [['Chișinău', 47.01, 28.86, 1, 'RMO'], ['Bălți', 47.76, 27.93, 0.8, null]],
  GE: [['Tbilisi', 41.72, 44.79, 1, 'TBS'], ['Batumi', 41.64, 41.64, 1.05, 'BUS'], ['Kutaisi', 42.27, 42.7, 0.85, 'KUT'], ['Stepantsminda', 42.66, 44.64, 0.9, null]],
  AM: [['Yerevan', 40.18, 44.51, 1, 'EVN'], ['Gyumri', 40.79, 43.85, 0.8, 'LWN'], ['Dilijan', 40.74, 44.86, 0.9, null]],
  TR: [['Istanbul', 41.01, 28.98, 1, 'IST'], ['Antalya', 36.9, 30.7, 1, 'AYT'], ['Izmir', 38.42, 27.14, 0.9, 'IZM'], ['Bodrum', 37.03, 27.43, 1.15, 'BJV'], ['Göreme (Cappadocia)', 38.64, 34.83, 1, 'NAV']],
  GR: [['Athens', 37.98, 23.73, 1, 'ATH'], ['Thessaloniki', 40.64, 22.94, 0.9, 'SKG'], ['Heraklion (Crete)', 35.34, 25.13, 1, 'HER'], ['Santorini', 36.39, 25.46, 1.4, 'JTR'], ['Rhodes', 36.43, 28.22, 1.05, 'RHO']],
  CY: [['Larnaca', 34.92, 33.62, 1, 'LCA'], ['Paphos', 34.77, 32.42, 1.05, 'PFO'], ['Limassol', 34.68, 33.04, 1.1, null], ['Ayia Napa', 34.99, 34, 1.1, null]],
  MT: [['Valletta', 35.9, 14.51, 1, 'MLA'], ['Sliema', 35.91, 14.5, 1.05, null], ['Victoria (Gozo)', 36.04, 14.24, 0.95, null]],
  IT: [['Rome', 41.9, 12.5, 1, 'ROM'], ['Milan', 45.46, 9.19, 1.1, 'MIL'], ['Venice', 45.44, 12.33, 1.25, 'VCE'], ['Florence', 43.77, 11.26, 1.1, 'FLR'], ['Naples', 40.85, 14.27, 0.9, 'NAP'], ['Palermo', 38.12, 13.36, 0.85, 'PMO']],
  ES: [['Madrid', 40.42, -3.7, 1, 'MAD'], ['Barcelona', 41.39, 2.17, 1.1, 'BCN'], ['Seville', 37.39, -5.98, 0.95, 'SVQ'], ['Valencia', 39.47, -0.38, 0.95, 'VLC'], ['Málaga', 36.72, -4.42, 1, 'AGP'], ['Palma de Mallorca', 39.57, 2.65, 1.15, 'PMI']],
  PT: [['Lisbon', 38.72, -9.14, 1, 'LIS'], ['Porto', 41.15, -8.61, 0.95, 'OPO'], ['Faro', 37.02, -7.93, 1, 'FAO'], ['Funchal (Madeira)', 32.65, -16.91, 1, 'FNC']],
  FR: [['Paris', 48.86, 2.35, 1, 'PAR'], ['Nice', 43.7, 7.27, 1, 'NCE'], ['Lyon', 45.76, 4.84, 0.85, 'LYS'], ['Marseille', 43.3, 5.37, 0.85, 'MRS'], ['Bordeaux', 44.84, -0.58, 0.85, 'BOD']],
  DE: [['Berlin', 52.52, 13.4, 1, 'BER'], ['Munich', 48.14, 11.58, 1.15, 'MUC'], ['Hamburg', 53.55, 9.99, 1.05, 'HAM'], ['Cologne', 50.94, 6.96, 0.95, 'CGN'], ['Dresden', 51.05, 13.74, 0.85, 'DRS']],
  AT: [['Vienna', 48.21, 16.37, 1, 'VIE'], ['Salzburg', 47.81, 13.06, 1.05, 'SZG'], ['Innsbruck', 47.27, 11.39, 1.05, 'INN'], ['Graz', 47.07, 15.44, 0.9, 'GRZ']],
  CH: [['Zurich', 47.37, 8.54, 1, 'ZRH'], ['Geneva', 46.2, 6.14, 1.05, 'GVA'], ['Lucerne', 47.05, 8.31, 0.95, null], ['Interlaken', 46.69, 7.86, 1, null], ['Zermatt', 46.02, 7.75, 1.15, null]],
  NL: [['Amsterdam', 52.37, 4.9, 1, 'AMS'], ['Rotterdam', 51.92, 4.48, 0.85, 'RTM'], ['Utrecht', 52.09, 5.12, 0.85, null], ['The Hague', 52.08, 4.3, 0.85, null]],
  BE: [['Brussels', 50.85, 4.35, 1, 'BRU'], ['Bruges', 51.21, 3.22, 1.05, null], ['Antwerp', 51.22, 4.4, 0.95, null], ['Ghent', 51.05, 3.72, 0.95, null]],
  GB: [['London', 51.51, -0.13, 1, 'LON'], ['Edinburgh', 55.95, -3.19, 0.9, 'EDI'], ['Manchester', 53.48, -2.24, 0.8, 'MAN'], ['Liverpool', 53.41, -2.99, 0.75, 'LPL'], ['Bath', 51.38, -2.36, 0.85, null]],
  IE: [['Dublin', 53.35, -6.26, 1, 'DUB'], ['Galway', 53.27, -9.05, 0.85, null], ['Cork', 51.9, -8.47, 0.85, 'ORK']],
  DK: [['Copenhagen', 55.68, 12.57, 1, 'CPH'], ['Aarhus', 56.16, 10.2, 0.85, 'AAR'], ['Odense', 55.4, 10.39, 0.85, null]],
  SE: [['Stockholm', 59.33, 18.07, 1, 'STO'], ['Gothenburg', 57.71, 11.97, 0.9, 'GOT'], ['Malmö', 55.6, 13, 0.9, 'MMX'], ['Kiruna', 67.86, 20.23, 1.05, 'KRN']],
  NO: [['Oslo', 59.91, 10.75, 1, 'OSL'], ['Bergen', 60.39, 5.32, 1, 'BGO'], ['Tromsø', 69.65, 18.96, 1.05, 'TOS'], ['Stavanger', 58.97, 5.73, 0.95, 'SVG']],
  FI: [['Helsinki', 60.17, 24.94, 1, 'HEL'], ['Rovaniemi', 66.5, 25.73, 1.1, 'RVN'], ['Turku', 60.45, 22.27, 0.85, 'TKU'], ['Tampere', 61.5, 23.76, 0.85, 'TMP']],
  IS: [['Reykjavík', 64.15, -21.94, 1, 'REK'], ['Akureyri', 65.68, -18.09, 0.95, 'AEY'], ['Vík', 63.42, -19.01, 1, null]],
  EE: [['Tallinn', 59.44, 24.75, 1, 'TLL'], ['Tartu', 58.38, 26.72, 0.8, null], ['Pärnu', 58.39, 24.5, 0.9, null]],
  LV: [['Riga', 56.95, 24.11, 1, 'RIX'], ['Jūrmala', 56.97, 23.77, 1.05, null], ['Sigulda', 57.15, 24.85, 0.85, null]],
  LT: [['Vilnius', 54.69, 25.28, 1, 'VNO'], ['Kaunas', 54.9, 23.9, 0.85, 'KUN'], ['Klaipėda', 55.7, 21.14, 0.9, 'PLQ']],
  HR: [['Split', 43.51, 16.44, 1, 'SPU'], ['Dubrovnik', 42.65, 18.09, 1.25, 'DBV'], ['Zagreb', 45.81, 15.98, 0.85, 'ZAG'], ['Zadar', 44.12, 15.23, 0.95, 'ZAD'], ['Pula', 44.87, 13.85, 0.95, 'PUY']],
  SI: [['Ljubljana', 46.06, 14.51, 1, 'LJU'], ['Bled', 46.37, 14.11, 1.1, null], ['Piran', 45.53, 13.57, 1.05, null]],
  ME: [['Kotor', 42.43, 18.7, 1, 'TIV'], ['Budva', 42.29, 18.84, 1, null], ['Podgorica', 42.44, 19.26, 0.8, 'TGD'], ['Žabljak', 43.15, 19.12, 0.85, null]],
  AL: [['Tirana', 41.33, 19.82, 1, 'TIA'], ['Sarandë', 39.88, 20, 0.95, null], ['Berat', 40.71, 19.95, 0.8, null], ['Durrës', 41.32, 19.45, 0.9, null]],
  RS: [['Belgrade', 44.79, 20.45, 1, 'BEG'], ['Novi Sad', 45.27, 19.83, 0.85, null], ['Niš', 43.32, 21.9, 0.75, 'INI']],
  EG: [['Cairo', 30.04, 31.24, 1, 'CAI'], ['Hurghada', 27.26, 33.81, 1.1, 'HRG'], ['Sharm El Sheikh', 27.92, 34.33, 1.2, 'SSH'], ['Luxor', 25.69, 32.64, 0.9, 'LXR']],
  MA: [['Marrakesh', 31.63, -7.99, 1, 'RAK'], ['Casablanca', 33.57, -7.59, 0.95, 'CAS'], ['Fes', 34.03, -5, 0.85, 'FEZ'], ['Agadir', 30.43, -9.6, 0.95, 'AGA'], ['Chefchaouen', 35.17, -5.27, 0.8, null]],
  TN: [['Tunis', 36.81, 10.18, 1, 'TUN'], ['Djerba', 33.81, 10.86, 1, 'DJE'], ['Sousse', 35.83, 10.64, 0.95, null], ['Hammamet', 36.4, 10.62, 1, 'NBE']],
  AE: [['Dubai', 25.2, 55.27, 1, 'DXB'], ['Abu Dhabi', 24.45, 54.38, 0.95, 'AUH'], ['Ras Al Khaimah', 25.79, 55.94, 0.85, 'RKT']],
  JO: [['Amman', 31.95, 35.93, 1, 'AMM'], ['Aqaba', 29.53, 35.01, 1, 'AQJ'], ['Wadi Musa (Petra)', 30.32, 35.48, 1.05, null]],
  TH: [['Bangkok', 13.76, 100.5, 1, 'BKK'], ['Phuket', 7.88, 98.39, 1.15, 'HKT'], ['Chiang Mai', 18.79, 98.98, 0.8, 'CNX'], ['Krabi', 8.09, 98.91, 1, 'KBV'], ['Koh Samui', 9.51, 100.01, 1.2, 'USM']],
  VN: [['Hanoi', 21.03, 105.85, 1, 'HAN'], ['Ho Chi Minh City', 10.82, 106.63, 1.05, 'SGN'], ['Da Nang', 16.05, 108.21, 1, 'DAD'], ['Hoi An', 15.88, 108.34, 1.05, null], ['Nha Trang', 12.24, 109.19, 0.95, 'CXR']],
  ID: [['Bali', -8.65, 115.22, 1, 'DPS'], ['Jakarta', -6.21, 106.85, 0.9, 'JKT'], ['Yogyakarta', -7.8, 110.36, 0.75, 'YIA'], ['Lombok', -8.58, 116.1, 0.9, 'LOP']],
  JP: [['Tokyo', 35.68, 139.69, 1, 'TYO'], ['Kyoto', 35.01, 135.77, 1, null], ['Osaka', 34.69, 135.5, 0.95, 'OSA'], ['Sapporo', 43.06, 141.35, 0.9, 'SPK'], ['Fukuoka', 33.59, 130.4, 0.85, 'FUK']],
  KR: [['Seoul', 37.57, 126.98, 1, 'SEL'], ['Busan', 35.18, 129.08, 0.9, 'PUS'], ['Jeju', 33.5, 126.53, 1, 'CJU'], ['Gyeongju', 35.86, 129.22, 0.85, null]],
  CN: [['Beijing', 39.9, 116.4, 1, 'BJS'], ['Shanghai', 31.23, 121.47, 1.1, 'SHA'], ["Xi'an", 34.34, 108.94, 0.85, 'SIA'], ['Chengdu', 30.57, 104.07, 0.85, 'CTU'], ['Guilin', 25.27, 110.29, 0.8, 'KWL']],
  IN: [['Delhi', 28.61, 77.21, 1, 'DEL'], ['Mumbai', 19.08, 72.88, 1.1, 'BOM'], ['Jaipur', 26.91, 75.79, 0.9, 'JAI'], ['Goa', 15.49, 73.83, 1, 'GOI'], ['Agra', 27.18, 78.01, 0.85, 'AGR']],
  LK: [['Colombo', 6.93, 79.86, 1, 'CMB'], ['Kandy', 7.29, 80.63, 0.9, null], ['Galle', 6.03, 80.22, 1, null], ['Ella', 6.87, 81.05, 0.9, null]],
  MV: [['Malé', 4.18, 73.51, 1, 'MLE'], ['Maafushi', 3.94, 73.49, 0.7, null]],
  KZ: [['Almaty', 43.24, 76.89, 1, 'ALA'], ['Astana', 51.17, 71.45, 1, 'NQZ'], ['Shymkent', 42.34, 69.59, 0.8, 'CIT']],
  UZ: [['Tashkent', 41.3, 69.24, 1, 'TAS'], ['Samarkand', 39.65, 66.96, 0.95, 'SKD'], ['Bukhara', 39.77, 64.42, 0.9, 'BHK'], ['Khiva', 41.38, 60.36, 0.85, 'UGC']],
  US: [['New York', 40.71, -74.01, 1, 'NYC'], ['Los Angeles', 34.05, -118.24, 0.95, 'LAX'], ['Miami', 25.76, -80.19, 0.95, 'MIA'], ['San Francisco', 37.77, -122.42, 1.05, 'SFO'], ['Las Vegas', 36.17, -115.14, 0.85, 'LAS'], ['Chicago', 41.88, -87.63, 0.9, 'CHI']],
  CA: [['Toronto', 43.65, -79.38, 1, 'YTO'], ['Vancouver', 49.28, -123.12, 1.05, 'YVR'], ['Montréal', 45.5, -73.57, 0.95, 'YMQ'], ['Banff', 51.18, -115.57, 1.1, null], ['Québec City', 46.81, -71.21, 0.95, 'YQB']],
  MX: [['Cancún', 21.16, -86.85, 1, 'CUN'], ['Mexico City', 19.43, -99.13, 0.85, 'MEX'], ['Tulum', 20.21, -87.47, 1.15, null], ['Oaxaca', 17.07, -96.73, 0.75, 'OAX'], ['Puerto Vallarta', 20.65, -105.23, 1, 'PVR']],
  BR: [['Rio de Janeiro', -22.91, -43.17, 1, 'RIO'], ['São Paulo', -23.55, -46.63, 1, 'SAO'], ['Salvador', -12.97, -38.5, 0.85, 'SSA'], ['Florianópolis', -27.6, -48.55, 0.95, 'FLN'], ['Foz do Iguaçu', -25.52, -54.59, 0.85, 'IGU']],
  AR: [['Buenos Aires', -34.6, -58.38, 1, 'BUE'], ['Mendoza', -32.89, -68.85, 0.9, 'MDZ'], ['Bariloche', -41.13, -71.31, 1.05, 'BRC'], ['El Calafate', -50.34, -72.26, 1.1, 'FTE'], ['Ushuaia', -54.8, -68.3, 1.15, 'USH']],
  ZA: [['Cape Town', -33.92, 18.42, 1, 'CPT'], ['Johannesburg', -26.2, 28.05, 0.9, 'JNB'], ['Durban', -29.86, 31.03, 0.85, 'DUR'], ['Hazyview (Kruger)', -25.04, 31.13, 1.1, null]],
  KE: [['Nairobi', -1.29, 36.82, 1, 'NBO'], ['Mombasa', -4.04, 39.67, 0.95, 'MBA'], ['Diani', -4.28, 39.59, 1, null], ['Maasai Mara', -1.49, 35.14, 1.4, null]],
  AU: [['Sydney', -33.87, 151.21, 1, 'SYD'], ['Melbourne', -37.81, 144.96, 0.95, 'MEL'], ['Brisbane', -27.47, 153.03, 0.9, 'BNE'], ['Cairns', -16.92, 145.77, 0.95, 'CNS'], ['Perth', -31.95, 115.86, 0.95, 'PER']],
  NZ: [['Auckland', -36.85, 174.76, 1, 'AKL'], ['Queenstown', -45.03, 168.66, 1.15, 'ZQN'], ['Wellington', -41.29, 174.78, 0.95, 'WLG'], ['Christchurch', -43.53, 172.64, 0.9, 'CHC'], ['Rotorua', -38.14, 176.25, 0.9, 'ROT']],
};

export function getCities(countryCode) {
  return (RAW[countryCode] || []).map(([name, lat, lon, priceFactor, iata]) => ({ name, lat, lon, priceFactor, iata }));
}

/** A known city of the country, or null. */
export function findCity(countryCode, cityName) {
  if (!cityName) return null;
  return getCities(countryCode).find((c) => c.name === cityName) || null;
}

/**
 * The concrete place of a trip end: the chosen city, or the country's hub.
 * @returns {{ countryCode, city, lat, lon, priceIndex, iata, isHub }} or null
 */
export function place(countryCode, cityName) {
  const country = getCountry(countryCode);
  if (!country) return null;
  const city = findCity(countryCode, cityName) || getCities(countryCode)[0];
  if (!city) {
    return { countryCode, city: country.hub, lat: country.lat, lon: country.lon, priceIndex: country.priceIndex, iata: cityCode(countryCode), isHub: true };
  }
  return {
    countryCode,
    city: city.name,
    lat: city.lat,
    lon: city.lon,
    priceIndex: country.priceIndex * city.priceFactor,
    // Cities without an airport use the country's main code for flight searches.
    iata: city.iata || cityCode(countryCode),
    isHub: city.name === country.hub,
  };
}
