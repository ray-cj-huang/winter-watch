export interface Source {
  publisher: string
  title: string
  url: string
  note: string
  /** Official NOAA products drive the app; the rest are context. */
  kind: 'noaa' | 'forecast' | 'pass'
}

export const SOURCES: Source[] = [
  {
    publisher: 'NOAA Climate Prediction Center',
    title: 'Weekly Nino region SST anomalies (wksst9120)',
    url: 'https://www.cpc.ncep.noaa.gov/data/indices/wksst9120.for',
    note: 'Live feed behind the ocean-state panel. Updated each Monday; anomalies are against the 1991-2020 base period.',
    kind: 'noaa',
  },
  {
    publisher: 'NOAA Climate Prediction Center',
    title: 'Oceanic Nino Index (ONI)',
    url: 'https://www.cpc.ncep.noaa.gov/data/indices/oni.ascii.txt',
    note: 'Live feed. The official 3-month running mean used to classify historical events.',
    kind: 'noaa',
  },
  {
    publisher: 'NOAA / NCEP',
    title: 'Global Forecast System (GFS)',
    url: 'https://www.ncei.noaa.gov/products/weather-climate-models/global-forecast',
    note: 'Live feed behind every resort forecast, delivered via Open-Meteo. Runs four times daily at 00/06/12/18Z.',
    kind: 'noaa',
  },
  {
    publisher: 'NOAA Climate Prediction Center',
    title: 'ENSO: Recent Evolution, Current Status and Predictions',
    url: 'https://www.cpc.ncep.noaa.gov/products/analysis_monitoring/lanina/enso_evolution-status-fcsts-web.pdf',
    note: 'The full monthly diagnostic deck, published the second Monday of each month.',
    kind: 'noaa',
  },
  {
    publisher: 'NOAA Climate Prediction Center',
    title: 'Seasonal temperature and precipitation outlooks',
    url: 'https://www.cpc.ncep.noaa.gov/products/predictions/long_range/seasonal.php',
    note: 'Official probabilistic outlook maps. The seasonal model here is calibrated to these patterns but is not a CPC product.',
    kind: 'noaa',
  },
  {
    publisher: 'NOAA Climate Prediction Center',
    title: 'ENSO Blog',
    url: 'https://www.climate.gov/news-features/department/enso-blog',
    note: 'Plain-language discussion of what the current state means.',
    kind: 'noaa',
  },
  {
    publisher: 'National Weather Service',
    title: 'NWS point forecasts',
    url: 'https://www.weather.gov',
    note: 'Authoritative local forecast and any active winter storm or avalanche headlines. Linked per resort.',
    kind: 'noaa',
  },
  {
    publisher: 'OpenSnow',
    title: '2026-2027 Winter Forecast',
    url: 'https://opensnow.com/news/post/2026-2027-winter-forecast-preview',
    note: 'Regional North America, Alps and Japan snowfall calls.',
    kind: 'forecast',
  },
  {
    publisher: 'Severe Weather Europe',
    title: 'Stratospheric reversal & the 2026/2027 El Nino winter forecast',
    url: 'https://www.severe-weather.eu/long-range-2/major-stratospheric-reversal-el-nino-winter-2026-2027-forecast-united-states-canada-europe-fa/',
    note: 'QBO phase, polar vortex and European pattern discussion.',
    kind: 'forecast',
  },
  {
    publisher: 'SnowBrains',
    title: 'El Nino 2026-27 ski forecast',
    url: 'https://snowbrains.com/el-nino-2026-27-ski-forecast/',
    note: 'CPC seasonal outlook coverage and the 1997-98 analog.',
    kind: 'forecast',
  },
  {
    publisher: 'Avalanche.org',
    title: 'US avalanche forecasts',
    url: 'https://avalanche.org',
    note: 'Backcountry danger ratings. Big El Nino years often mean a thin, faceted early-season base.',
    kind: 'forecast',
  },
  {
    publisher: 'Ikon Pass',
    title: 'Official destinations, access and blackout dates',
    url: 'https://www.ikonpass.com/en/destinations',
    note: 'Authoritative on the roster. Alterra adjusts both roster and blackouts between announcement and season -- verify here before buying.',
    kind: 'pass',
  },
]
