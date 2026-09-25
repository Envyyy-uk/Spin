import React, { useEffect, useMemo, useRef } from 'react';
import { ActivityIndicator, Platform, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { getLocales } from 'expo-localization';
import { I18nProvider, useI18n } from './src/i18n';
import { getCountry } from './src/data/countries';
import { todayISO } from './src/lib/dates';
import { useTripStore } from './src/state/store';
import { derive } from './src/state/derived';
import { colors, fontFamily, radius, space } from './src/theme';
import { LanguageSwitcher } from './src/components/LanguageSwitcher';
import { Touchable } from './src/components/ui';
import { SetupScreen } from './src/screens/SetupScreen';
import { WheelsScreen } from './src/screens/WheelsScreen';
import { PlanScreen } from './src/screens/PlanScreen';

function deviceCountry() {
  try {
    const region = getLocales()?.[0]?.regionCode;
    return region && getCountry(region) ? region : '';
  } catch {
    return '';
  }
}

const STEPS = ['setup', 'wheels', 'plan'];

function StepNav({ step, canGo, onGo }) {
  const { t } = useI18n();
  const { width } = useWindowDimensions();
  const narrow = width < 520;
  return (
    <View style={styles.steps} accessibilityRole="tablist">
      {STEPS.map((s, i) => {
        const active = s === step;
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
            style={[styles.stepTab, narrow && !active && styles.stepTabCompact, active && styles.stepTabActive, !enabled && { opacity: 0.5 }]}
          >
            <View style={[styles.stepNum, active && styles.stepNumActive]}>
              <Text style={[styles.stepNumText, active && { color: colors.onPrimary }]}>{i + 1}</Text>
            </View>
            {!narrow || active ? (
              <Text style={[styles.stepLabel, active && styles.stepLabelActive]} numberOfLines={1}>
                {t(`nav.${s}`)}
              </Text>
            ) : null}
          </Touchable>
        );
      })}
    </View>
  );
}

function Planner() {
  const { t, ready } = useI18n();
  const defaultOrigin = useMemo(deviceCountry, []);
  const [state, dispatch, hydrated] = useTripStore(defaultOrigin);
  const today = todayISO();
  const derived = useMemo(() => derive(state, today), [state, today]);
  const scrollRef = useRef(null);

  const canGo = (s) => s === 'setup' || (s === 'wheels' && derived.setupCheck.valid) || (s === 'plan' && derived.trip != null);
  const go = (s) => {
    if (canGo(s)) dispatch({ type: 'step', step: s });
  };
  // Never show a step whose prerequisites are no longer met (e.g. after editing).
  const step = canGo(state.step) ? state.step : derived.setupCheck.valid ? 'wheels' : 'setup';

  useEffect(() => {
    scrollRef.current?.scrollTo?.({ y: 0, animated: false });
  }, [step]);

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
      <View style={styles.header} accessibilityRole="banner">
        <View style={styles.headerInner}>
          <View style={styles.brand}>
            <View style={styles.logo} aria-hidden>
              <Text style={styles.logoText}>✺</Text>
            </View>
            <View style={{ flexShrink: 1 }}>
              <Text style={styles.brandName}>{t('app.name')}</Text>
              <Text style={styles.tagline} numberOfLines={1}>
                {t('app.tagline')}
              </Text>
            </View>
          </View>
          <LanguageSwitcher />
        </View>
      </View>
      <ScrollView ref={scrollRef} style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.container} accessibilityRole="main">
          <StepNav step={step} canGo={canGo} onGo={go} />
          {step === 'setup' ? <SetupScreen state={state} dispatch={dispatch} derived={derived} onContinue={() => go('wheels')} /> : null}
          {step === 'wheels' ? (
            <WheelsScreen state={state} dispatch={dispatch} derived={derived} onBack={() => go('setup')} onShowPlan={() => go('plan')} />
          ) : null}
          {step === 'plan' ? <PlanScreen state={state} dispatch={dispatch} derived={derived} onRespin={() => go('wheels')} /> : null}
          <Text style={styles.footer} accessibilityRole={Platform.OS === 'web' ? 'contentinfo' : undefined}>
            {t('app.footer')}
          </Text>
        </View>
      </ScrollView>
      <StatusBar style="light" />
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
  safe: { flex: 1, backgroundColor: colors.primaryDark },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg, gap: space(3) },
  loadingText: { fontFamily, color: colors.textMuted, fontSize: 15 },
  header: { backgroundColor: colors.primaryDark, paddingHorizontal: space(4), paddingVertical: space(3) },
  headerInner: { width: '100%', maxWidth: 1120, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space(3) },
  brand: { flexDirection: 'row', alignItems: 'center', gap: space(2.5), flexShrink: 1 },
  logo: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: 22, color: colors.primaryDark, fontWeight: '900' },
  brandName: { fontFamily, color: colors.onPrimary, fontSize: 20, fontWeight: '900', letterSpacing: -0.3 },
  tagline: { fontFamily, color: colors.primarySoft, fontSize: 12.5 },
  scroll: { flex: 1, backgroundColor: colors.bg },
  scrollContent: { paddingHorizontal: space(4), paddingTop: space(4), paddingBottom: space(12) },
  container: { width: '100%', maxWidth: 1120, alignSelf: 'center', gap: space(4) },
  steps: { flexDirection: 'row', gap: space(2), backgroundColor: colors.surface, padding: 6, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border },
  stepTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space(2), minHeight: 44, borderRadius: radius.pill, paddingHorizontal: space(2) },
  stepTabCompact: { flex: 0, width: 52 },
  stepTabActive: { backgroundColor: colors.primarySoft },
  stepNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  stepNumActive: { backgroundColor: colors.primary },
  stepNumText: { fontFamily, fontSize: 13, fontWeight: '800', color: colors.textMuted },
  stepLabel: { fontFamily, fontSize: 14, fontWeight: '700', color: colors.textMuted, flexShrink: 1 },
  stepLabelActive: { color: colors.primaryDark },
  footer: { fontFamily, fontSize: 12.5, color: colors.textMuted, textAlign: 'center', marginTop: space(6), lineHeight: 18 },
});
