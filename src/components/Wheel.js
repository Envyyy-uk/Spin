import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, PanResponder, Platform, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G, Path, Text as SvgText } from 'react-native-svg';
import { useI18n } from '../i18n';
import { colors, fontFamily, wheelPalette } from '../theme';
import { Touchable } from './ui';

const USE_NATIVE_DRIVER = Platform.OS !== 'web';

// --- geometry helpers (exported for tests) ---------------------------------

/** Rotation (deg, clockwise) that puts the centre of segment `index` under the top pointer. */
export function rotationForIndex(index, count) {
  const a = 360 / count;
  return ((-(index + 0.5) * a) % 360 + 360) % 360;
}

/** Segment index currently under the top pointer for a given wheel rotation. */
export function indexAtRotation(rotation, count) {
  const a = 360 / count;
  const pointer = ((-rotation % 360) + 360) % 360;
  return Math.floor(pointer / a) % count;
}

function polar(cx, cy, r, deg) {
  const rad = (deg * Math.PI) / 180;
  return [cx + r * Math.sin(rad), cy - r * Math.cos(rad)];
}

function segmentPath(cx, cy, r, start, end) {
  const [x1, y1] = polar(cx, cy, r, start);
  const [x2, y2] = polar(cx, cy, r, end);
  const large = end - start > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
}

function truncate(label, max) {
  return label.length > max ? `${label.slice(0, max - 1)}…` : label;
}

function segmentColor(i, n) {
  let c = i % wheelPalette.length;
  // Avoid identical neighbours where the wheel closes the circle.
  if (i === n - 1 && n > 1 && c === 0) c = (c + 2) % wheelPalette.length;
  return wheelPalette[c];
}

// --- component ----------------------------------------------------------------

/**
 * Interactive, animated wheel.
 * - Tap / click / Enter / Space: spin to a random option.
 * - Horizontal swipe (touch or mouse drag): spin.
 * - Arrow keys (web) or the ‹ › buttons: step to the previous/next option.
 */
export function Wheel({ title, options, selectedIndex, onSelect, spinSignal, size = 260, disabled }) {
  const { t } = useI18n();
  const n = options.length;
  const rotation = useRef(new Animated.Value(0)).current;
  const current = useRef(0);
  const [spinning, setSpinning] = useState(false);
  const spinningRef = useRef(false);
  const reduceMotion = useRef(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled?.()
      .then((v) => {
        reduceMotion.current = !!v;
      })
      .catch(() => {});
  }, []);

  const animateTo = useCallback(
    (index, { full, onDone } = {}) => {
      if (n < 1) return;
      const a = 360 / n;
      const base = rotationForIndex(index, n);
      const jitter = full ? (Math.random() - 0.5) * a * 0.6 : 0;
      const target = (((base + jitter) % 360) + 360) % 360;
      const from = current.current;
      let delta = (((target - from) % 360) + 360) % 360;
      if (full) delta += 360 * (4 + Math.floor(Math.random() * 3));
      else if (delta > 180) delta -= 360; // shortest way for small steps
      const to = from + delta;
      const duration = reduceMotion.current ? 250 : full ? 3600 + Math.random() * 800 : 350;
      spinningRef.current = true;
      setSpinning(true);
      Animated.timing(rotation, {
        toValue: to,
        duration,
        easing: full ? Easing.out(Easing.cubic) : Easing.inOut(Easing.quad),
        useNativeDriver: USE_NATIVE_DRIVER,
      }).start(() => {
        current.current = to;
        spinningRef.current = false;
        setSpinning(false);
        onDone?.();
      });
    },
    [n, rotation],
  );

  const spin = useCallback(() => {
    if (disabled || n < 1 || spinningRef.current) return;
    const index = Math.floor(Math.random() * n);
    animateTo(index, { full: true, onDone: () => onSelect(index) });
  }, [animateTo, disabled, n, onSelect]);

  const step = useCallback(
    (dir) => {
      if (disabled || n < 1 || spinningRef.current) return;
      const from = selectedIndex >= 0 ? selectedIndex : dir > 0 ? -1 : 0;
      const index = (from + dir + n) % n;
      onSelect(index);
    },
    [disabled, n, onSelect, selectedIndex],
  );

  // Follow external (manual) selection changes with a short animation.
  useEffect(() => {
    if (n < 1 || selectedIndex < 0 || selectedIndex >= n || spinningRef.current) return;
    if (indexAtRotation(current.current, n) !== selectedIndex) animateTo(selectedIndex);
  }, [selectedIndex, n, animateTo]);

  // "Spin all" from the parent.
  const lastSignal = useRef(spinSignal);
  useEffect(() => {
    if (spinSignal !== lastSignal.current) {
      lastSignal.current = spinSignal;
      spin();
    }
  }, [spinSignal, spin]);

  const pan = useRef(null);
  pan.current = PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 12 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
    onPanResponderRelease: (_, g) => {
      if (Math.abs(g.vx) > 0.2 || Math.abs(g.dx) > 40) spin();
    },
    onPanResponderTerminationRequest: () => true,
  });

  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 6;
  const a = n > 0 ? 360 / n : 360;
  const fontSize = n <= 8 ? 14 : n <= 14 ? 12 : n <= 24 ? 10 : 8.5;
  const maxChars = n <= 6 ? 14 : n <= 10 ? 11 : 9;
  const current_ = selectedIndex >= 0 && options[selectedIndex] ? options[selectedIndex].label : t('wheels.notSpun');

  const spinDeg = rotation.interpolate({ inputRange: [-360000, 360000], outputRange: ['-360000deg', '360000deg'] });

  const onKeyDown = (e) => {
    const k = e.nativeEvent?.key || e.key;
    if (k === 'ArrowRight' || k === 'ArrowDown') {
      e.preventDefault?.();
      step(1);
    } else if (k === 'ArrowLeft' || k === 'ArrowUp') {
      e.preventDefault?.();
      step(-1);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.wheelWrap, { width: size, height: size + 14 }]} {...pan.current.panHandlers}>
        <Touchable
          accessibilityRole="button"
          accessibilityLabel={t('wheels.a11yWheel', { title, value: current_ })}
          accessibilityHint={t('wheels.keyboardHint')}
          accessibilityState={{ disabled: !!disabled || n < 1, busy: spinning }}
          disabled={disabled || n < 1}
          onPress={spin}
          onKeyDown={Platform.OS === 'web' ? onKeyDown : undefined}
          style={[styles.pressArea, { width: size, height: size, borderRadius: size / 2, marginTop: 14 }]}
        >
          <Animated.View style={{ width: size, height: size, transform: [{ rotate: spinDeg }] }}>
            <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
              <Circle cx={cx} cy={cy} r={r + 4} fill={colors.primaryDark} />
              {n === 0 ? <Circle cx={cx} cy={cy} r={r} fill={colors.surfaceAlt} /> : null}
              {n === 1 ? <Circle cx={cx} cy={cy} r={r} fill={segmentColor(0, 1)} /> : null}
              {n > 1
                ? options.map((o, i) => (
                    <Path
                      key={`seg-${o.value}`}
                      d={segmentPath(cx, cy, r, i * a, (i + 1) * a)}
                      fill={segmentColor(i, n)}
                      stroke={i === selectedIndex ? colors.text : colors.surface}
                      strokeWidth={i === selectedIndex ? 2.5 : 1}
                    />
                  ))
                : null}
              {options.map((o, i) => {
                const mid = n === 1 ? 0 : (i + 0.5) * a;
                const [tx, ty] = polar(cx, cy, n === 1 ? r * 0.45 : n > 24 ? r * 0.8 : r * 0.6, mid);
                const label = n > 24 && o.short ? o.short : truncate(o.label, maxChars);
                return (
                  <G key={`lbl-${o.value}`} transform={`rotate(${n === 1 ? 0 : mid - 90} ${tx} ${ty})`}>
                    <SvgText
                      x={tx}
                      y={ty + fontSize / 3}
                      fill={colors.text}
                      fontSize={fontSize}
                      fontWeight="700"
                      fontFamily={Platform.OS === 'web' ? 'Manrope, system-ui, sans-serif' : undefined}
                      textAnchor="middle"
                    >
                      {label}
                    </SvgText>
                  </G>
                );
              })}
              <Circle cx={cx} cy={cy} r={size * 0.09} fill={colors.surface} stroke={colors.primaryDark} strokeWidth={3} />
              <Circle cx={cx} cy={cy} r={size * 0.035} fill={colors.accent} />
            </Svg>
          </Animated.View>
        </Touchable>
        <View style={styles.pointer} pointerEvents="none" aria-hidden>
          <Svg width={28} height={30} viewBox="0 0 28 30">
            <Path d="M14 30 L2 4 Q14 -2 26 4 Z" fill={colors.coral} stroke={colors.surface} strokeWidth={2} />
          </Svg>
        </View>
      </View>
      <View style={styles.controls}>
        <Touchable
          accessibilityRole="button"
          accessibilityLabel={t('wheels.prev')}
          disabled={disabled || n < 2}
          onPress={() => step(-1)}
          style={[styles.stepBtn, (disabled || n < 2) && { opacity: 0.4 }]}
        >
          <Text style={styles.stepText}>‹</Text>
        </Touchable>
        <Touchable
          accessibilityRole="button"
          accessibilityLabel={`${t('wheels.spin')}: ${title}`}
          disabled={disabled || n < 1 || spinning}
          onPress={spin}
          style={({ pressed }) => [styles.spinBtn, pressed && { backgroundColor: colors.primaryDark }, (disabled || n < 1) && { opacity: 0.45 }]}
        >
          <Text style={styles.spinText}>{spinning ? t('wheels.spinning') : `⟳ ${t('wheels.spin')}`}</Text>
        </Touchable>
        <Touchable
          accessibilityRole="button"
          accessibilityLabel={t('wheels.next')}
          disabled={disabled || n < 2}
          onPress={() => step(1)}
          style={[styles.stepBtn, (disabled || n < 2) && { opacity: 0.4 }]}
        >
          <Text style={styles.stepText}>›</Text>
        </Touchable>
      </View>
      <Text style={styles.result} accessibilityLiveRegion="polite" aria-live="polite">
        {spinning ? t('wheels.spinning') : `${t('wheels.result')}: `}
        {!spinning ? <Text style={styles.resultValue}>{current_}</Text> : null}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center' },
  wheelWrap: { alignItems: 'center', position: 'relative' },
  pressArea: { overflow: 'hidden' },
  pointer: { position: 'absolute', top: 0, alignSelf: 'center', zIndex: 2 },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 },
  stepBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  stepText: { fontSize: 24, lineHeight: 26, color: colors.primaryDark, fontWeight: '700' },
  spinBtn: {
    minWidth: 130,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  spinText: { fontFamily, color: colors.onPrimary, fontWeight: '800', fontSize: 16 },
  result: { fontFamily, marginTop: 10, fontSize: 15, color: colors.textMuted, textAlign: 'center' },
  resultValue: { color: colors.text, fontWeight: '800' },
});
