import React, { useEffect } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import { useI18n } from '../i18n';
import { COUNTRIES } from '../data/countries';
import { LANGUAGES } from '../i18n/languages';
import { colors, fontFamily, maxContentWidth, radius, space, type, wheelPalette } from '../theme';
import { Button, Card, Eyebrow, H3, P, SectionHeader } from './ui';
import { Icon } from './Icon';
import { Reveal, USE_NATIVE_DRIVER, useBreakpoint, useReducedMotion, useAnimatedValue } from './motion';

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** Gradient night sky with a dotted flight path that draws itself in. */
function HeroBackdrop({ showPath }) {
  const reduced = useReducedMotion();
  const draw = useAnimatedValue(reduced ? 0 : 1);
  useEffect(() => {
    if (reduced) {
      draw.setValue(0);
      return;
    }
    Animated.timing(draw, { toValue: 0, duration: 2200, delay: 300, easing: Easing.inOut(Easing.cubic), useNativeDriver: false }).start();
  }, [reduced, draw]);
  const offset = draw.interpolate({ inputRange: [0, 1], outputRange: [0, 700] });
  return (
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" viewBox="0 0 1200 640" preserveAspectRatio="xMaxYMid slice" aria-hidden>
      <Defs>
        <LinearGradient id="sky" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#0b1b2b" />
          <Stop offset="0.55" stopColor="#123a52" />
          <Stop offset="1" stopColor="#1b5a66" />
        </LinearGradient>
        <RadialGradient id="glow" cx="0.86" cy="0.12" r="0.55">
          <Stop offset="0" stopColor="#f26b3a" stopOpacity="0.45" />
          <Stop offset="0.5" stopColor="#f5b041" stopOpacity="0.12" />
          <Stop offset="1" stopColor="#f5b041" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Rect x="0" y="0" width="1200" height="640" fill="url(#sky)" />
      <Rect x="0" y="0" width="1200" height="640" fill="url(#glow)" />
      {/* latitude lines of a faint globe */}
      <G stroke="#ffffff" strokeOpacity="0.07" fill="none" strokeWidth="1.2">
        <Circle cx="980" cy="700" r="420" />
        <Circle cx="980" cy="700" r="330" />
        <Circle cx="980" cy="700" r="240" />
        <Path d="M560 700 Q980 380 1400 700" />
        <Path d="M620 560 Q980 250 1340 560" />
      </G>
      {showPath ? (
        <>
      <AnimatedPath
        d="M700 650 C 820 460, 900 260, 1090 150"
        stroke="#f5b041"
        strokeOpacity="0.85"
        strokeWidth="2.5"
        strokeDasharray="2 12"
        strokeLinecap="round"
        fill="none"
        strokeDashoffset={offset}
      />
      <Circle cx="1090" cy="150" r="9" fill="#f26b3a" />
      <Circle cx="1090" cy="150" r="18" fill="#f26b3a" fillOpacity="0.25" />
        </>
      ) : null}
    </Svg>
  );
}

/** Decorative wheel that turns very slowly (static with reduced motion). */
function PreviewWheel({ size }) {
  const reduced = useReducedMotion();
  const spin = useAnimatedValue(0);
  useEffect(() => {
    if (reduced) {
      spin.stopAnimation();
      return undefined;
    }
    const loop = Animated.loop(Animated.timing(spin, { toValue: 1, duration: 60000, easing: Easing.linear, useNativeDriver: USE_NATIVE_DRIVER }));
    loop.start();
    return () => loop.stop();
  }, [reduced, spin]);
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const n = 8;
  const r = size / 2 - 8;
  const c = size / 2;
  const seg = (i) => {
    const a0 = ((i * 360) / n - 90) * (Math.PI / 180);
    const a1 = (((i + 1) * 360) / n - 90) * (Math.PI / 180);
    return `M${c} ${c} L${c + r * Math.cos(a0)} ${c + r * Math.sin(a0)} A${r} ${r} 0 0 1 ${c + r * Math.cos(a1)} ${c + r * Math.sin(a1)} Z`;
  };
  return (
    <View style={{ width: size, height: size + 18, alignItems: 'center' }} aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Animated.View style={{ marginTop: 18, width: size, height: size, transform: [{ rotate }] }}>
        <Svg width={size} height={size}>
          <Circle cx={c} cy={c} r={r + 7} fill="rgba(255,255,255,0.12)" />
          {Array.from({ length: n }, (_, i) => (
            <Path key={i} d={seg(i)} fill={wheelPalette[i % wheelPalette.length]} stroke="#0b1b2b" strokeOpacity={0.25} strokeWidth={1.5} />
          ))}
          <Circle cx={c} cy={c} r={size * 0.11} fill="#ffffff" />
          <Circle cx={c} cy={c} r={size * 0.045} fill={colors.accent} />
        </Svg>
      </Animated.View>
      <View style={styles.previewPointer}>
        <Svg width={30} height={32} viewBox="0 0 28 30">
          <Path d="M14 30 L2 4 Q14 -2 26 4 Z" fill={colors.accent} stroke="#ffffff" strokeWidth={2} />
        </Svg>
      </View>
    </View>
  );
}

export function Hero({ onStart, hasProgress, onResume }) {
  const { t } = useI18n();
  const { bp, width } = useBreakpoint();
  const wide = width >= 900;
  const displaySize = bp === 'desktop' ? 60 : bp === 'tablet' ? 50 : Math.max(34, Math.min(42, width / 9.5));
  const stats = [
    { value: String(COUNTRIES.length - 1), label: t('hero.statDestinations') },
    { value: '4', label: t('hero.statWheels') },
    { value: String(LANGUAGES.length), label: t('hero.statLanguages') },
  ];
  const steps = [
    { icon: 'calendar', title: t('how.step1'), desc: t('how.step1Desc') },
    { icon: 'spin', title: t('how.step2'), desc: t('how.step2Desc') },
    { icon: 'wallet', title: t('how.step3'), desc: t('how.step3Desc') },
  ];

  return (
    <View style={styles.wrap}>
      <View style={[styles.hero, { minHeight: wide ? 560 : bp === 'tablet' ? 520 : 0 }]}>
        <HeroBackdrop showPath={wide} />
        <View style={[styles.heroInner, wide && styles.heroInnerWide]}>
          <View style={[styles.heroCopy, wide && { flex: 1.25 }]}>
            <Reveal>
              <Eyebrow color={colors.sun}>{t('hero.eyebrow')}</Eyebrow>
            </Reveal>
            <Reveal delay={80}>
              <Text accessibilityRole="header" aria-level={1} style={[type.display, styles.display, { fontSize: displaySize, lineHeight: displaySize * 1.06 }]}>
                {t('hero.title')}
              </Text>
            </Reveal>
            <Reveal delay={160}>
              <P style={styles.heroLead}>{t('hero.lead')}</P>
            </Reveal>
            <Reveal delay={240} style={styles.ctaRow}>
              <Button large variant="accent" label={t('hero.cta')} iconRight="arrowRight" onPress={onStart} />
              {hasProgress ? <Button large variant="light" icon="map" label={t('hero.resume')} onPress={onResume} /> : null}
            </Reveal>
            <Reveal delay={320} style={styles.stats}>
              {stats.map((s) => (
                <View key={s.label} style={styles.stat}>
                  <Text style={styles.statValue}>{s.value}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
              ))}
            </Reveal>
          </View>
          {bp !== 'phone' ? (
            <Reveal delay={200} style={[styles.heroArt, !wide && { alignSelf: 'center', marginTop: space(6) }]}>
              <PreviewWheel size={wide ? Math.min(340, width * 0.28) : 260} />
            </Reveal>
          ) : null}
        </View>
      </View>

      <View style={styles.section}>
        <Reveal>
          <SectionHeader eyebrow={t('how.eyebrow')} title={t('how.title')} />
        </Reveal>
        <View style={[styles.steps, bp !== 'phone' && styles.stepsRow]}>
          {steps.map((s, i) => (
            <Reveal key={s.title} delay={i * 110} style={bp !== 'phone' ? { flex: 1 } : null}>
              <Card style={styles.stepCard}>
                <View style={styles.stepTop}>
                  <View style={styles.stepIcon}>
                    <Icon name={s.icon} size={22} color={colors.primary} />
                  </View>
                  <Text style={styles.stepNum}>0{i + 1}</Text>
                </View>
                <H3>{s.title}</H3>
                <P muted>{s.desc}</P>
              </Card>
            </Reveal>
          ))}
        </View>
        <Reveal>
          <Card style={styles.honest}>
            <View style={styles.honestIcon}>
              <Icon name="info" size={22} color={colors.accentDark} />
            </View>
            <View style={{ flex: 1, gap: space(1) }}>
              <H3>{t('how.honestTitle')}</H3>
              <P muted>{t('how.honestDesc')}</P>
            </View>
          </Card>
        </Reveal>
        <Reveal style={{ alignItems: 'center' }}>
          <Button large label={t('hero.cta')} iconRight="arrowRight" onPress={onStart} />
        </Reveal>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space(10) },
  hero: { borderRadius: radius.xl, overflow: 'hidden', backgroundColor: colors.night },
  heroInner: { padding: space(6), paddingVertical: space(10), gap: space(4), maxWidth: maxContentWidth },
  heroInnerWide: { flexDirection: 'row', alignItems: 'center', padding: space(14) },
  heroCopy: { gap: space(4) },
  display: { color: colors.onNight },
  heroLead: { color: colors.onNightMuted, fontSize: 17.5, lineHeight: 27, maxWidth: 560 },
  ctaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space(3), marginTop: space(2) },
  stats: { flexDirection: 'row', gap: space(8), marginTop: space(4), flexWrap: 'wrap' },
  stat: { gap: 2 },
  statValue: { fontFamily, fontSize: 28, fontWeight: '800', color: colors.onNight, letterSpacing: -0.5 },
  statLabel: { fontFamily, fontSize: 13, color: colors.onNightMuted },
  heroArt: { alignItems: 'center', justifyContent: 'center' },
  previewPointer: { position: 'absolute', top: 0 },
  section: { gap: space(6) },
  steps: { gap: space(4) },
  stepsRow: { flexDirection: 'row' },
  stepCard: { gap: space(2), height: '100%' },
  stepTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space(2) },
  stepIcon: { width: 46, height: 46, borderRadius: 14, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  stepNum: { fontFamily, fontSize: 28, fontWeight: '800', color: colors.border },
  honest: { flexDirection: 'row', gap: space(4), alignItems: 'flex-start', backgroundColor: colors.accentSoft, borderColor: 'transparent' },
  honestIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
});
