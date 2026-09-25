import React, { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useI18n } from '../i18n';
import { countryName, getCountry } from '../data/countries';
import { formatNumber } from '../lib/format';
import { colors, fontFamily, space } from '../theme';
import { Icon } from './Icon';
import { USE_NATIVE_DRIVER, usePop, useReducedMotion, useAnimatedValue } from './motion';

/**
 * Boarding-pass style route: ORIGIN ——✈—— DESTINATION.
 * The plane flies along the arc and the destination "pops" when it changes.
 */
export function RouteHeader({ origin, destination, km, compact }) {
  const { lang } = useI18n();
  const reduced = useReducedMotion();
  const [arcWidth, setArcWidth] = useState(0);
  const progress = useAnimatedValue(1);
  const pop = usePop(destination);

  useEffect(() => {
    if (reduced) {
      progress.setValue(1);
      return;
    }
    progress.setValue(0);
    Animated.timing(progress, { toValue: 1, duration: 1300, easing: Easing.inOut(Easing.cubic), useNativeDriver: USE_NATIVE_DRIVER }).start();
  }, [destination, reduced, progress]);

  const o = getCountry(origin);
  const d = getCountry(destination);
  const arcH = 26;
  // Parametric arc: x linear, y follows a sine hump.
  const steps = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1];
  const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [0, Math.max(0, arcWidth - 22)] });
  const translateY = progress.interpolate({ inputRange: steps, outputRange: steps.map((s) => -Math.sin(Math.PI * s) * (arcH - 6)) });
  const rotate = progress.interpolate({ inputRange: [0, 0.5, 1], outputRange: ['-18deg', '0deg', '18deg'] });

  return (
    <View
      style={styles.row}
      accessible
      accessibilityLabel={`${countryName(origin, lang)} → ${countryName(destination, lang)}${km ? `, ~${formatNumber(km, lang)} km` : ''}`}
    >
      <View style={styles.end}>
        <Text style={[styles.code, compact && styles.codeCompact]}>{origin}</Text>
        <Text style={styles.city} numberOfLines={1}>{o?.hub}</Text>
        <Text style={styles.country} numberOfLines={2}>{countryName(origin, lang)}</Text>
      </View>
      <View style={styles.arc} onLayout={(e) => setArcWidth(e.nativeEvent.layout.width)}>
        {arcWidth > 0 ? (
          <Svg width={arcWidth} height={arcH + 6} style={styles.arcSvg}>
            <Path
              d={`M4 ${arcH + 2} Q ${arcWidth / 2} ${-arcH + 8} ${arcWidth - 4} ${arcH + 2}`}
              stroke="rgba(255,255,255,0.55)"
              strokeWidth={2}
              strokeDasharray="2 7"
              strokeLinecap="round"
              fill="none"
            />
          </Svg>
        ) : null}
        <Animated.View style={[styles.plane, { transform: [{ translateX }, { translateY }, { rotate }] }]}>
          <Icon name="plane" size={20} color={colors.sun} strokeWidth={2.2} />
        </Animated.View>
        {km ? <Text style={styles.km}>~{formatNumber(km, lang)} km</Text> : null}
      </View>
      <Animated.View style={[styles.end, styles.endRight, { transform: [{ scale: pop }] }]}>
        <Text style={[styles.code, styles.codeDest, compact && styles.codeCompact]}>{destination}</Text>
        <Text style={[styles.city, { textAlign: 'right' }]} numberOfLines={1}>{d?.hub}</Text>
        <Text style={[styles.country, { textAlign: 'right' }]} numberOfLines={2}>{countryName(destination, lang)}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space(3) },
  end: { flexShrink: 1, maxWidth: '38%' },
  endRight: { alignItems: 'flex-end' },
  code: { fontFamily, fontSize: 44, lineHeight: 48, fontWeight: '800', color: colors.onNight, letterSpacing: -1 },
  codeCompact: { fontSize: 36, lineHeight: 40 },
  codeDest: { color: colors.sun },
  city: { fontFamily, fontSize: 13, fontWeight: '700', color: colors.onNightMuted, marginTop: 2 },
  country: { fontFamily, fontSize: 16, fontWeight: '800', color: colors.onNight },
  arc: { flex: 1, height: 64, justifyContent: 'center' },
  arcSvg: { position: 'absolute', top: 6 },
  plane: { position: 'absolute', left: 0, top: 24 },
  km: { fontFamily, position: 'absolute', bottom: -4, alignSelf: 'center', fontSize: 12, fontWeight: '700', color: colors.onNightMuted },
});
