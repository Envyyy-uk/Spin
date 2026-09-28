import React, { useEffect, useMemo, useRef } from 'react';
import { ActivityIndicator, Animated, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { getLocales } from 'expo-localization';
import Svg, { Circle, Path } from 'react-native-svg';
import { I18nProvider, useI18n } from './src/i18n';
import { getCountry } from './src/data/countries';
import { todayISO } from './src/lib/dates';
import { useTripStore } from './src/state/store';
import { derive } from './src/state/derived';
import { colors, fontFamily, maxContentWidth, radius, shadowRaised, space, wheelPalette } from './src/theme';
import { LanguageSwitcher } from './src/components/LanguageSwitcher';
import { Touchable } from './src/components/ui';
import { Icon } from './src/components/Icon';
import { CardTransition, useAnimatedFraction, useBreakpoint } from './src/components/motion';
import { Hero } from './src/components/Hero';
import { SetupScreen } from './src/screens/SetupScreen';
import { WheelsFooter, WheelsScreen } from './src/screens/WheelsScreen';
import { PlanScreen } from './src/screens/PlanScreen';
import { CalculatorScreen } from './src/screens/CalculatorScreen';
import { RouletteScreen } from './src/screens/RouletteScreen';

function deviceCountry() {
  try {
    const region = getLocales()?.[0]?.regionCode;
    return region && getCountry(region) ? region : '';
  } catch {
    return '';
  }
}

const STEPS = ['setup', 'wheels', 'plan'];

// Load the web font once (native uses the platform system font).
if (Platform.OS === 'web' && typeof document !== 'undefined' && !document.getElementById('spin-fonts')) {
  const link = document.createElement('link');
  link.id = 'spin-fonts';
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap';
  document.head.appendChild(link);
}

function LogoMark({ size = 36 }) {
  const c = size / 2;
  const r = c - 2;
  const segs = 6;
  return (
    <Svg width={size} height={size} aria-hidden>
      {Array.from({ length: segs }, (_, i) => {
        const a0 = ((i * 360) / segs - 90) * (Math.PI / 180);
        const a1 = (((i + 1) * 360) / segs - 90) * (Math.PI / 180);
        return (
          <Path
            key={i}
            d={`M${c} ${c} L${c + r * Math.cos(a0)} ${c + r * Math.sin(a0)} A${r} ${r} 0 0 1 ${c + r * Math.cos(a1)} ${c + r * Math.sin(a1)} Z`}
            fill={i % 2 ? colors.primary : wheelPalette[(i * 3) % wheelPalette.length]}
          />
        );
      })}
      <Circle cx={c} cy={c} r={size * 0.16} fill={colors.surface} />
      <Circle cx={c} cy={c} r={size * 0.07} fill={colors.accent} />
    </Svg>
  );
}

function StepNav({ step, canGo, onGo }) {
  const { t } = useI18n();
  const { isPhone } = useBreakpoint();
  const index = STEPS.indexOf(step);
  const progress = useAnimatedFraction(index / (STEPS.length - 1));
  return (
    <View style={styles.stepsWrap}>
      <View style={styles.progressTrack} aria-hidden>
        <Animated.View style={[styles.progressFill, { width: progress }]} />
      </View>
      <View style={styles.steps} accessibilityRole="tablist">
        {STEPS.map((s, i) => {
          const active = s === step;
          const done = i < index;
          const enabled = canGo(s);
          return (
            <Touchable
              key={s}
              accessibilityRole="tab"
              accessibilityState={{ selected: active, disabled: !enabled }}
              aria-selected={active}
              accessibilityLabel={`${t('nav.stepOf', { n: i + 1, total: STEPS.length })}: ${t(`nav.${s}`)}`}
              accessibilityHint={enabled ? undefined : t('nav.locked')}
              disabled={!enabled}
              onPress={() => onGo(s)}
              style={({ hovered }) => [styles.stepTab, hovered && enabled && !active && styles.stepTabHover, !enabled && { opacity: 0.45 }]}
            >
              <View style={[styles.stepNum, (active || done) && styles.stepNumActive]}>
                {done ? <Icon name="check" size={14} color={colors.onPrimary} strokeWidth={3} /> : <Text style={[styles.stepNumText, active && { color: colors.onPrimary }]}>{i + 1}</Text>}
              </View>
              {!isPhone || active ? (
                <Text style={[styles.stepLabel, active && styles.stepLabelActive]} numberOfLines={1}>
                  {t(`nav.${s}`)}
                </Text>
              ) : null}
            </Touchable>
          );
        })}
      </View>
    </View>
  );
}

/** Top-level switch between the wheel flow and the stand-alone calculator. */
function ModeTabs({ mode, onRoulette, onWheel, onCalc, full }) {
  const { t } = useI18n();
  const tabs = [
    { key: 'roulette', icon: 'sparkle', label: t('nav.modeRoulette'), onPress: onRoulette },
    { key: 'wheel', icon: 'spin', label: t('nav.modeWheel'), onPress: onWheel },
    { key: 'calc', icon: 'wallet', label: t('nav.modeCalc'), onPress: onCalc },
  ];
  return (
    <View style={[styles.modeTabs, full ? styles.modeTabsFull : styles.modeTabsCenter]} accessibilityRole="tablist" aria-label={t('nav.modes')}>
      {tabs.map((tab) => {
        const active = tab.key === mode;
        return (
          <Touchable
            key={tab.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            aria-selected={active}
            onPress={tab.onPress}
            style={({ hovered }) => [styles.modeTab, full && styles.modeTabCompact, hovered && !active && styles.modeTabHover, active && styles.modeTabActive]}
          >
            {!full ? <Icon name={tab.icon} size={16} color={active ? colors.onPrimary : colors.primaryDark} /> : null}
            <Text style={[styles.modeTabText, full && styles.modeTabTextCompact, active && { color: colors.onPrimary }]} numberOfLines={1}>
              {tab.label}
            </Text>
          </Touchable>
        );
      })}
    </View>
  );
}

function Planner() {
  const { t, ready } = useI18n();
  const defaultOrigin = useMemo(() => deviceCountry(), []);
  const [state, dispatch, hydrated] = useTripStore(defaultOrigin);
  const today = todayISO();
  const derived = useMemo(() => derive(state, today), [state, today]);
  const scrollRef = useRef(null);
  const { isPhone, width } = useBreakpoint();
  // Mode tabs share the header row only when there is room for them.
  const tabsInline = width >= 900;

  const canGo = (s) => s === 'home' || s === 'setup' || s === 'calc' || s === 'roulette' || (s === 'wheels' && derived.setupCheck.valid) || (s === 'plan' && derived.trip != null);
  const go = (s) => {
    if (canGo(s)) dispatch({ type: 'step', step: s });
  };
  // Never show a step whose prerequisites are no longer met (e.g. after editing).
  const step = canGo(state.step) ? state.step : derived.setupCheck.valid ? 'wheels' : 'setup';
  const direction = state.stepDirection || 1;

  const resumeTarget = derived.trip ? 'plan' : derived.setupCheck.valid && state.selection.destination ? 'wheels' : null;
  const source = state.plan.source || 'wheel';
  const mode = step === 'calc' || step === 'roulette' ? step : step === 'plan' ? source : step === 'home' ? null : 'wheel';
  const wheelTarget = source === 'wheel' && resumeTarget ? resumeTarget : 'setup';
  const modeTabs = (full) => (
    <ModeTabs
      mode={mode}
      full={full}
      onRoulette={() => go('roulette')}
      onWheel={() => (mode !== 'wheel' ? go(wheelTarget) : null)}
      onCalc={() => go('calc')}
    />
  );

  useEffect(() => {
    scrollRef.current?.scrollTo?.({ y: 0, animated: false });
  }, [step]);

  // Each screen, rendered by key so a leaving screen can animate out as a card.
  const renderStep = (key) => {
    switch (key) {
      case 'home':
        return <Hero onRoulette={() => go('roulette')} onStart={() => go('setup')} onCalc={() => go('calc')} hasProgress={!!resumeTarget} onResume={() => resumeTarget && go(resumeTarget)} />;
      case 'setup':
        return <SetupScreen state={state} dispatch={dispatch} derived={derived} onContinue={() => go('wheels')} />;
      case 'wheels':
        return <WheelsScreen state={state} dispatch={dispatch} derived={derived} />;
      case 'roulette':
        return <RouletteScreen state={state} dispatch={dispatch} onOpenPlan={() => dispatch({ type: 'step', step: 'plan' })} />;
      case 'calc':
        return <CalculatorScreen state={state} dispatch={dispatch} onOpenPlan={() => dispatch({ type: 'step', step: 'plan' })} />;
      case 'plan':
        return derived.trip ? <PlanScreen state={state} dispatch={dispatch} derived={derived} onRespin={() => go(source === 'roulette' ? 'roulette' : source === 'calc' ? 'calc' : 'wheels')} /> : null;
      default:
        return null;
    }
  };

  if (!ready || !hydrated) {
    return (
      <View style={styles.loading} accessibilityLiveRegion="polite">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>{t('app.loading')}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={[styles.header, isPhone && styles.headerPhone]} accessibilityRole="banner">
        <View style={styles.headerInner}>
          <Touchable
            accessibilityRole="link"
            accessibilityLabel={`${t('app.name')} — ${t('nav.home')}`}
            onPress={() => go('home')}
            style={({ hovered }) => [styles.brand, hovered && { opacity: 0.85 }]}
          >
            <LogoMark />
            <View style={{ flexShrink: 1 }}>
              <Text style={styles.brandName}>{t('app.name')}</Text>
              {width >= 1024 ? (
                <Text style={styles.tagline} numberOfLines={1}>
                  {t('app.tagline')}
                </Text>
              ) : null}
            </View>
          </Touchable>
          {tabsInline ? modeTabs(false) : null}
          <LanguageSwitcher />
        </View>
        {!tabsInline ? <View style={styles.modeTabsRow}>{modeTabs(isPhone)}</View> : null}
      </View>
      <ScrollView ref={scrollRef} style={styles.scroll} contentContainerStyle={[styles.scrollContent, isPhone && styles.scrollContentPhone, step === 'wheels' && { paddingBottom: isPhone ? space(30) : space(32) }]} keyboardShouldPersistTaps="handled">
        <View style={styles.container} accessibilityRole="main">
          {['setup', 'wheels'].includes(step) || (step === 'plan' && source === 'wheel') ? <StepNav step={step} canGo={canGo} onGo={go} /> : null}
          <CardTransition stepKey={step} direction={direction} render={renderStep} cardStyle={styles.screenCard} />
          <Text style={styles.footer} accessibilityRole={Platform.OS === 'web' ? 'contentinfo' : undefined}>
            {t('app.footer')}
          </Text>
        </View>
      </ScrollView>
      {step === 'wheels' ? <WheelsFooter state={state} derived={derived} onBack={() => go('setup')} onShowPlan={() => go('plan')} /> : null}
      <StatusBar style="dark" />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <I18nProvider>
        <Planner />
      </I18nProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg, gap: space(3) },
  loadingText: { fontFamily, color: colors.textMuted, fontSize: 15 },
  header: {
    backgroundColor: colors.bg,
    paddingHorizontal: space(4),
    paddingVertical: space(3),
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    zIndex: 2,
  },
  headerInner: { width: '100%', maxWidth: maxContentWidth, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space(3) },
  brand: { flexDirection: 'row', alignItems: 'center', gap: space(2.5), flexShrink: 0, borderRadius: radius.md, paddingVertical: 2, paddingRight: space(2) },
  brandName: { fontFamily, color: colors.text, fontSize: 20, fontWeight: '800', letterSpacing: -0.4 },
  tagline: { fontFamily, color: colors.textMuted, fontSize: 12.5 },
  scroll: { flex: 1, backgroundColor: colors.bg },
  scrollContentPhone: { paddingTop: space(3) },
  scrollContent: { paddingHorizontal: space(4), paddingTop: space(5), paddingBottom: space(14) },
  container: { width: '100%', maxWidth: maxContentWidth, alignSelf: 'center', gap: space(5) },
  screenCard: { backgroundColor: colors.bg, borderRadius: radius.xl, ...shadowRaised },
  modeTabs: { flexDirection: 'row', gap: 4, padding: 4, borderRadius: radius.pill, backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border },
  modeTabsFull: { alignSelf: 'stretch' },
  modeTabsCenter: { alignSelf: 'center' },
  headerPhone: { paddingVertical: space(2) },
  modeTabsRow: { width: '100%', maxWidth: maxContentWidth, alignSelf: 'center', marginTop: space(2) },
  modeTab: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space(1.5), minHeight: 38, paddingHorizontal: space(3.5), borderRadius: radius.pill, ...(Platform.OS === 'web' ? { cursor: 'pointer' } : null) },
  modeTabCompact: { flexGrow: 1, flexShrink: 1, flexBasis: 'auto', paddingHorizontal: space(2), minHeight: 34 },
  modeTabTextCompact: { fontSize: 12.5 },
  modeTabHover: { backgroundColor: colors.surface },
  modeTabActive: { backgroundColor: colors.primary },
  modeTabText: { fontFamily, fontSize: 14, fontWeight: '800', color: colors.primaryDark },
  stepsWrap: { gap: space(2) },
  progressTrack: { height: 3, borderRadius: 2, backgroundColor: colors.border, overflow: 'hidden', marginHorizontal: space(4) },
  progressFill: { height: 3, backgroundColor: colors.accent, borderRadius: 2 },
  steps: { flexDirection: 'row', gap: space(2), justifyContent: 'space-between' },
  stepTab: { flexDirection: 'row', alignItems: 'center', gap: space(2), minHeight: 44, borderRadius: radius.pill, paddingHorizontal: space(3), ...(Platform.OS === 'web' ? { cursor: 'pointer' } : null) },
  stepTabHover: { backgroundColor: colors.surfaceAlt },
  stepNum: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  stepNumActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  stepNumText: { fontFamily, fontSize: 13, fontWeight: '800', color: colors.textMuted },
  stepLabel: { fontFamily, fontSize: 14.5, fontWeight: '700', color: colors.textMuted, flexShrink: 1 },
  stepLabelActive: { color: colors.text },
  footer: { fontFamily, fontSize: 12.5, color: colors.textMuted, textAlign: 'center', marginTop: space(8), lineHeight: 18, maxWidth: 640, alignSelf: 'center' },
});
