import React from 'react';
import { useI18n } from '../i18n';
import { getCities, place } from '../data/cities';
import { SelectModal } from './SelectModal';

/**
 * City picker shown after a country is chosen. An empty value means the
 * country's main city (the first in the list).
 */
export function CitySelect({ countryCode, value, onChange, label, disabled }) {
  const { t } = useI18n();
  const cities = getCities(countryCode);
  if (!countryCode || cities.length === 0) return null;
  const current = place(countryCode, value).city;
  const options = cities.map((c, i) => ({
    value: c.name,
    label: c.name,
    detail: i === 0 ? t('city.main') : c.iata ? `✈ ${c.iata}` : '',
  }));
  return (
    <SelectModal
      label={label}
      title={label}
      value={current}
      options={options}
      searchable={cities.length > 6}
      onChange={(name) => onChange(name === cities[0].name ? '' : name)}
      disabled={disabled}
    />
  );
}
