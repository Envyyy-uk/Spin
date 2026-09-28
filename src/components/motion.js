import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, LayoutAnimation, Platform, Text, View, useWindowDimensions } from 'react-native';
import { breakpoints, motion } from '../theme';

export const USE_NATIVE_DRIVER = Platform.OS !== 'web';

/** A stable Animated.Value (react-native-web has no built-in useAnimatedValue). */
export function useAnimatedValue(initial) {
  const [value] = useState(() => new Animated.Value(initial));
  return value;
}

// ---------------------------------------------------------------------------
// Reduced motion
// ---------------------------------------------------------------------------

let cachedReduced = false;

/** Live value of the OS / browser "reduce motion" preference. */
export function useReducedMotion() {
  const [reduced, setReduced] = useState(cachedReduced);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled?.()
      .then((v) => {
        cachedReduced = !!v;
        if (alive) setReduced(!!v);
      })
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener?.('reduceMotionChanged', (v) => {
      cachedReduced = !!v;
      setReduced(!!v);
    });
    return () => {
      alive = false;
      sub?.remove?.();
    };
  }, []);
  return reduced;
}

/** Smoothly animate the next layout change on native (e.g. expanding a panel). */
export function animateNextLayout(reduced) {
  if (reduced || Platform.OS === 'web') return;
  LayoutAnimation.configureNext(LayoutAnimation.create(motion.base, 'easeInEaseOut', 'opacity'));
}

// ---------------------------------------------------------------------------
// Responsive helpers
// ---------------------------------------------------------------------------

/** 'phone' < 600 ≤ 'tablet' < 1024 ≤ 'desktop' */
export function useBreakpoint() {
  const { width } = useWindowDimensions();
  const bp = width >= breakpoints.desktop ? 'desktop' : width >= breakpoints.tablet ? 'tablet' : 'phone';
  return { width, bp, isPhone: bp === 'phone', isTablet: bp === 'tablet', isDesktop: bp === 'desktop' };
}

// ---------------------------------------------------------------------------
// Reveal: fade + rise when the element scrolls into view (web) or mounts (native)
// ---------------------------------------------------------------------------

export function Reveal({ children, delay = 0, distance = 14, style, ...rest }) {
  // Animates once on mount. It never waits for scrolling or an observer, so no
  // content can stay hidden (embedded web views don't always report visibility),
  // and it starts from a partly visible state.
  const reduced = useReducedMotion();
  const progress = useAnimatedValue(reduced ? 1 : 0);

  useEffect(() => {
    if (reduced) {
      progress.setValue(1);
      return;
    }
    Animated.timing(progress, {
      toValue: 1,
      duration: motion.slow,
      delay: Math.min(delay, 240),
      easing: Easing.out(Easing.cubic),
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start();
  }, [reduced, delay, progress]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }),
          transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] }) }],
        },
      ]}
      {...rest}
    >
      {children}
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// StepTransition: cross-fade + slide whenever `stepKey` changes
// ---------------------------------------------------------------------------

export function StepTransition({ stepKey, direction = 1, children, style }) {
  const reduced = useReducedMotion();
  const progress = useAnimatedValue(1);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (reduced) {
      progress.setValue(1);
      return;
    }
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: motion.slow,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start();
  }, [stepKey, reduced, progress]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: progress,
          transform: [{ translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [28 * direction, 0] }) }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// CardTransition: the new screen slides in as a card over the previous one,
// which steps back (scales down and fades). Direction follows the navigation.
// ---------------------------------------------------------------------------

const CARD_MS = 460;

export function CardTransition({ stepKey, direction = 1, render, cardStyle }) {
  const reduced = useReducedMotion();
  const enter = useAnimatedValue(1);
  const leave = useAnimatedValue(0);
  const [shownKey, setShownKey] = useState(stepKey);
  const [leaving, setLeaving] = useState(null);

  // Derive the leaving screen during render when the key changes.
  if (stepKey !== shownKey) {
    setLeaving(reduced ? null : { key: shownKey, direction });
    setShownKey(stepKey);
  }

  const leavingKey = leaving?.key;
  useEffect(() => {
    if (!leavingKey) return;
    enter.setValue(0);
    leave.setValue(0);
    Animated.parallel([
      Animated.timing(enter, { toValue: 1, duration: CARD_MS, easing: Easing.out(Easing.cubic), useNativeDriver: USE_NATIVE_DRIVER }),
      Animated.timing(leave, { toValue: 1, duration: CARD_MS, easing: Easing.out(Easing.quad), useNativeDriver: USE_NATIVE_DRIVER }),
    ]).start(() => setLeaving(null));
  }, [leavingKey, enter, leave]);

  const dir = leaving ? leaving.direction : 1;
  return (
    <View style={{ position: 'relative' }}>
      {leaving ? (
        <Animated.View
          pointerEvents="none"
          aria-hidden
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            opacity: leave.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
            transform: [
              { translateX: leave.interpolate({ inputRange: [0, 1], outputRange: [0, -40 * dir] }) },
              { scale: leave.interpolate({ inputRange: [0, 1], outputRange: [1, 0.93] }) },
            ],
          }}
        >
          {render(leaving.key)}
        </Animated.View>
      ) : null}
      <Animated.View
        style={[
          leaving ? cardStyle : null,
          {
            opacity: enter.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 1, 1] }),
            transform: [
              { translateX: enter.interpolate({ inputRange: [0, 1], outputRange: [90 * dir, 0] }) },
              { translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [28, 0] }) },
              { scale: enter.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) },
            ],
          },
        ]}
      >
        {render(stepKey)}
      </Animated.View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// AnimatedNumber: tweens a number and renders it through `format`
// ---------------------------------------------------------------------------

export function AnimatedNumber({ value, format, style, ...rest }) {
  const reduced = useReducedMotion();
  const anim = useAnimatedValue(value);
  const [shown, setShown] = useState(value);

  useEffect(() => {
    const id = anim.addListener(({ value: v }) => setShown(v));
    return () => anim.removeListener(id);
  }, [anim]);

  useEffect(() => {
    if (reduced || !Number.isFinite(value)) {
      anim.setValue(value); // listener updates `shown`
      return;
    }
    Animated.timing(anim, { toValue: value, duration: motion.slow, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [value, reduced, anim]);

  return (
    <Text style={style} {...rest}>
      {format(reduced ? value : shown)}
    </Text>
  );
}

// ---------------------------------------------------------------------------
// useAnimatedFraction: animated 0..1 value for bars (width in %)
// ---------------------------------------------------------------------------

export function useAnimatedFraction(fraction) {
  const reduced = useReducedMotion();
  const anim = useAnimatedValue(0);
  useEffect(() => {
    const target = Math.max(0, Math.min(1, fraction || 0));
    if (reduced) {
      anim.setValue(target);
      return;
    }
    Animated.timing(anim, { toValue: target, duration: motion.slow + 180, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [fraction, reduced, anim]);
  return anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
}

/** Short "pop" scale animation, re-triggered whenever `trigger` changes. */
export function usePop(trigger) {
  const reduced = useReducedMotion();
  const scale = useAnimatedValue(1);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (reduced || trigger == null) return;
    scale.setValue(0.92);
    Animated.spring(scale, { toValue: 1, friction: 5, tension: 160, useNativeDriver: USE_NATIVE_DRIVER }).start();
  }, [trigger, reduced, scale]);
  return scale;
}
