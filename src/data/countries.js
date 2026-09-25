// Reference data for departure and destination countries.
//
// `priceIndex` is a rough relative cost-of-travel index (Germany ≈ 1.0) used
// only by the demo estimator in src/services/pricingService.js. It is NOT a
// live price and must never be presented as one.
// `hub` is the main arrival city used for distance estimates and search links.
// `styles` lists the holiday styles a destination is commonly chosen for.

const LANGS = ['en', 'uk', 'ru', 'es', 'fr', 'de', 'it'];

// code, lat, lon, priceIndex, hub, styles, names (en, uk, ru, es, fr, de, it)
const RAW = [
  ['UA', 50.45, 30.52, 0.45, 'Kyiv', 'culture food nature', 'Ukraine|Україна|Украина|Ucrania|Ukraine|Ukraine|Ucraina'],
  ['PL', 50.06, 19.94, 0.6, 'Kraków', 'culture food nature', 'Poland|Польща|Польша|Polonia|Pologne|Polen|Polonia'],
  ['CZ', 50.08, 14.44, 0.7, 'Prague', 'culture food', 'Czechia|Чехія|Чехия|Chequia|Tchéquie|Tschechien|Cechia'],
  ['SK', 48.15, 17.11, 0.65, 'Bratislava', 'nature adventure culture', 'Slovakia|Словаччина|Словакия|Eslovaquia|Slovaquie|Slowakei|Slovacchia'],
  ['HU', 47.5, 19.04, 0.6, 'Budapest', 'culture relax food', 'Hungary|Угорщина|Венгрия|Hungría|Hongrie|Ungarn|Ungheria'],
  ['RO', 44.43, 26.1, 0.55, 'Bucharest', 'nature culture adventure', 'Romania|Румунія|Румыния|Rumanía|Roumanie|Rumänien|Romania'],
  ['BG', 42.7, 23.32, 0.5, 'Sofia', 'sea nature relax', 'Bulgaria|Болгарія|Болгария|Bulgaria|Bulgarie|Bulgarien|Bulgaria'],
  ['MD', 47.01, 28.86, 0.45, 'Chișinău', 'food culture', 'Moldova|Молдова|Молдова|Moldavia|Moldavie|Moldau|Moldavia'],
  ['GE', 41.72, 44.79, 0.45, 'Tbilisi', 'food nature adventure culture', 'Georgia|Грузія|Грузия|Georgia|Géorgie|Georgien|Georgia'],
  ['AM', 40.18, 44.51, 0.5, 'Yerevan', 'culture nature food', 'Armenia|Вірменія|Армения|Armenia|Arménie|Armenien|Armenia'],
  ['TR', 41.01, 28.98, 0.55, 'Istanbul', 'sea culture food relax', 'Türkiye|Туреччина|Турция|Turquía|Turquie|Türkei|Turchia'],
  ['GR', 37.98, 23.73, 0.8, 'Athens', 'sea culture food relax', 'Greece|Греція|Греция|Grecia|Grèce|Griechenland|Grecia'],
  ['CY', 34.92, 33.62, 0.85, 'Larnaca', 'sea relax', 'Cyprus|Кіпр|Кипр|Chipre|Chypre|Zypern|Cipro'],
  ['MT', 35.9, 14.51, 0.85, 'Valletta', 'sea culture', 'Malta|Мальта|Мальта|Malta|Malte|Malta|Malta'],
  ['IT', 41.9, 12.5, 1.0, 'Rome', 'culture food sea', 'Italy|Італія|Италия|Italia|Italie|Italien|Italia'],
  ['ES', 40.42, -3.7, 0.9, 'Madrid', 'sea culture food', 'Spain|Іспанія|Испания|España|Espagne|Spanien|Spagna'],
  ['PT', 38.72, -9.14, 0.8, 'Lisbon', 'sea food culture adventure', 'Portugal|Португалія|Португалия|Portugal|Portugal|Portugal|Portogallo'],
  ['FR', 48.86, 2.35, 1.1, 'Paris', 'culture food', 'France|Франція|Франция|Francia|France|Frankreich|Francia'],
  ['DE', 52.52, 13.4, 1.0, 'Berlin', 'culture food', 'Germany|Німеччина|Германия|Alemania|Allemagne|Deutschland|Germania'],
  ['AT', 48.21, 16.37, 1.05, 'Vienna', 'culture nature adventure', 'Austria|Австрія|Австрия|Austria|Autriche|Österreich|Austria'],
  ['CH', 47.37, 8.54, 1.6, 'Zurich', 'nature adventure relax', 'Switzerland|Швейцарія|Швейцария|Suiza|Suisse|Schweiz|Svizzera'],
  ['NL', 52.37, 4.9, 1.15, 'Amsterdam', 'culture', 'Netherlands|Нідерланди|Нидерланды|Países Bajos|Pays-Bas|Niederlande|Paesi Bassi'],
  ['BE', 50.85, 4.35, 1.05, 'Brussels', 'food culture', 'Belgium|Бельгія|Бельгия|Bélgica|Belgique|Belgien|Belgio'],
  ['GB', 51.51, -0.13, 1.25, 'London', 'culture', 'United Kingdom|Велика Британія|Великобритания|Reino Unido|Royaume-Uni|Vereinigtes Königreich|Regno Unito'],
  ['IE', 53.35, -6.26, 1.2, 'Dublin', 'nature culture', 'Ireland|Ірландія|Ирландия|Irlanda|Irlande|Irland|Irlanda'],
  ['DK', 55.68, 12.57, 1.3, 'Copenhagen', 'culture food', 'Denmark|Данія|Дания|Dinamarca|Danemark|Dänemark|Danimarca'],
  ['SE', 59.33, 18.07, 1.1, 'Stockholm', 'nature culture', 'Sweden|Швеція|Швеция|Suecia|Suède|Schweden|Svezia'],
  ['NO', 59.91, 10.75, 1.4, 'Oslo', 'nature adventure', 'Norway|Норвегія|Норвегия|Noruega|Norvège|Norwegen|Norvegia'],
  ['FI', 60.17, 24.94, 1.1, 'Helsinki', 'nature relax', 'Finland|Фінляндія|Финляндия|Finlandia|Finlande|Finnland|Finlandia'],
  ['IS', 64.15, -21.94, 1.6, 'Reykjavík', 'nature adventure', 'Iceland|Ісландія|Исландия|Islandia|Islande|Island|Islanda'],
  ['EE', 59.44, 24.75, 0.8, 'Tallinn', 'culture nature', 'Estonia|Естонія|Эстония|Estonia|Estonie|Estland|Estonia'],
  ['LV', 56.95, 24.11, 0.7, 'Riga', 'culture relax', 'Latvia|Латвія|Латвия|Letonia|Lettonie|Lettland|Lettonia'],
  ['LT', 54.69, 25.28, 0.7, 'Vilnius', 'culture nature', 'Lithuania|Литва|Литва|Lituania|Lituanie|Litauen|Lituania'],
  ['HR', 43.51, 16.44, 0.8, 'Split', 'sea nature', 'Croatia|Хорватія|Хорватия|Croacia|Croatie|Kroatien|Croazia'],
  ['SI', 46.06, 14.51, 0.8, 'Ljubljana', 'nature adventure', 'Slovenia|Словенія|Словения|Eslovenia|Slovénie|Slowenien|Slovenia'],
  ['ME', 42.43, 18.7, 0.6, 'Kotor', 'sea nature adventure', 'Montenegro|Чорногорія|Черногория|Montenegro|Monténégro|Montenegro|Montenegro'],
  ['AL', 41.33, 19.82, 0.5, 'Tirana', 'sea nature', 'Albania|Албанія|Албания|Albania|Albanie|Albanien|Albania'],
  ['RS', 44.79, 20.45, 0.55, 'Belgrade', 'culture food', 'Serbia|Сербія|Сербия|Serbia|Serbie|Serbien|Serbia'],
  ['EG', 30.04, 31.24, 0.4, 'Cairo', 'sea culture relax', 'Egypt|Єгипет|Египет|Egipto|Égypte|Ägypten|Egitto'],
  ['MA', 31.63, -7.99, 0.45, 'Marrakesh', 'culture food adventure', 'Morocco|Марокко|Марокко|Marruecos|Maroc|Marokko|Marocco'],
  ['TN', 36.81, 10.18, 0.4, 'Tunis', 'sea relax', 'Tunisia|Туніс|Тунис|Túnez|Tunisie|Tunesien|Tunisia'],
  ['AE', 25.2, 55.27, 1.2, 'Dubai', 'sea relax', 'United Arab Emirates|Обʼєднані Арабські Емірати|Объединённые Арабские Эмираты|Emiratos Árabes Unidos|Émirats arabes unis|Vereinigte Arabische Emirate|Emirati Arabi Uniti'],
  ['JO', 31.95, 35.93, 0.75, 'Amman', 'culture adventure', 'Jordan|Йорданія|Иордания|Jordania|Jordanie|Jordanien|Giordania'],
  ['TH', 13.76, 100.5, 0.45, 'Bangkok', 'sea food relax', 'Thailand|Таїланд|Таиланд|Tailandia|Thaïlande|Thailand|Thailandia'],
  ['VN', 21.03, 105.85, 0.35, 'Hanoi', 'food nature culture', 'Vietnam|Вʼєтнам|Вьетнам|Vietnam|Viêt Nam|Vietnam|Vietnam'],
  ['ID', -8.65, 115.22, 0.45, 'Bali', 'sea relax nature', 'Indonesia|Індонезія|Индонезия|Indonesia|Indonésie|Indonesien|Indonesia'],
  ['JP', 35.68, 139.69, 1.0, 'Tokyo', 'culture food', 'Japan|Японія|Япония|Japón|Japon|Japan|Giappone'],
  ['KR', 37.57, 126.98, 0.9, 'Seoul', 'culture food', 'South Korea|Південна Корея|Южная Корея|Corea del Sur|Corée du Sud|Südkorea|Corea del Sud'],
  ['CN', 39.9, 116.4, 0.6, 'Beijing', 'culture food', 'China|Китай|Китай|China|Chine|China|Cina'],
  ['IN', 28.61, 77.21, 0.3, 'Delhi', 'culture food', 'India|Індія|Индия|India|Inde|Indien|India'],
  ['LK', 6.93, 79.86, 0.35, 'Colombo', 'sea nature', 'Sri Lanka|Шрі-Ланка|Шри-Ланка|Sri Lanka|Sri Lanka|Sri Lanka|Sri Lanka'],
  ['MV', 4.18, 73.51, 1.8, 'Malé', 'sea relax', 'Maldives|Мальдіви|Мальдивы|Maldivas|Maldives|Malediven|Maldive'],
  ['KZ', 43.24, 76.89, 0.45, 'Almaty', 'nature adventure', 'Kazakhstan|Казахстан|Казахстан|Kazajistán|Kazakhstan|Kasachstan|Kazakistan'],
  ['UZ', 41.3, 69.24, 0.4, 'Tashkent', 'culture food', 'Uzbekistan|Узбекистан|Узбекистан|Uzbekistán|Ouzbékistan|Usbekistan|Uzbekistan'],
  ['US', 40.71, -74.01, 1.35, 'New York', 'culture nature food', 'United States|США|США|Estados Unidos|États-Unis|Vereinigte Staaten|Stati Uniti'],
  ['CA', 43.65, -79.38, 1.15, 'Toronto', 'nature adventure', 'Canada|Канада|Канада|Canadá|Canada|Kanada|Canada'],
  ['MX', 21.16, -86.85, 0.6, 'Cancún', 'sea culture food', 'Mexico|Мексика|Мексика|México|Mexique|Mexiko|Messico'],
  ['BR', -22.91, -43.17, 0.55, 'Rio de Janeiro', 'sea nature', 'Brazil|Бразилія|Бразилия|Brasil|Brésil|Brasilien|Brasile'],
  ['AR', -34.6, -58.38, 0.5, 'Buenos Aires', 'culture food nature', 'Argentina|Аргентина|Аргентина|Argentina|Argentine|Argentinien|Argentina'],
  ['ZA', -33.92, 18.42, 0.5, 'Cape Town', 'nature adventure food', 'South Africa|Південна Африка|Южная Африка|Sudáfrica|Afrique du Sud|Südafrika|Sudafrica'],
  ['KE', -1.29, 36.82, 0.65, 'Nairobi', 'nature adventure', 'Kenya|Кенія|Кения|Kenia|Kenya|Kenia|Kenya'],
  ['AU', -33.87, 151.21, 1.2, 'Sydney', 'sea nature adventure', 'Australia|Австралія|Австралия|Australia|Australie|Australien|Australia'],
  ['NZ', -36.85, 174.76, 1.15, 'Auckland', 'nature adventure', 'New Zealand|Нова Зеландія|Новая Зеландия|Nueva Zelanda|Nouvelle-Zélande|Neuseeland|Nuova Zelanda'],
];

export const COUNTRIES = RAW.map(([code, lat, lon, priceIndex, hub, styles, names]) => {
  const parts = names.split('|');
  const byLang = {};
  LANGS.forEach((lang, i) => {
    byLang[lang] = parts[i] || parts[0];
  });
  return { code, lat, lon, priceIndex, hub, styles: styles.split(' '), names: byLang };
});

const BY_CODE = Object.fromEntries(COUNTRIES.map((c) => [c.code, c]));

export function getCountry(code) {
  return BY_CODE[code] || null;
}

export function countryName(code, lang) {
  const c = BY_CODE[code];
  if (!c) return code || '';
  return c.names[lang] || c.names.en;
}

/** Countries sorted alphabetically in the given UI language. */
export function sortedCountries(lang, list = COUNTRIES) {
  const locale = lang || 'en';
  return [...list].sort((a, b) => {
    const an = a.names[locale] || a.names.en;
    const bn = b.names[locale] || b.names.en;
    try {
      return an.localeCompare(bn, locale);
    } catch {
      return an < bn ? -1 : an > bn ? 1 : 0;
    }
  });
}
