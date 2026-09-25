import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, LayoutAnimation, Platform, Text, useWindowDimensions } from 'react-native';
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

export function Reveal({ children, delay = 0, distance = 18, style, ...rest }) {
  const reduced = useReducedMotion();
  const progress = useAnimatedValue(reduced ? 1 : 0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    if (reduced) {
      progress.setValue(1);
      return undefined;
    }
    const run = () => {
      if (started.current) return;
      started.current = true;
      Animated.timing(progress, {
        toValue: 1,
        duration: motion.slow,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: USE_NATIVE_DRIVER,
      }).start();
    };
    const node = ref.current;
    if (Platform.OS === 'web' && typeof IntersectionObserver !== 'undefined' && node instanceof Element) {
      const io = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            run();
            io.disconnect();
          }
        },
        { rootMargin: '0px 0px -8% 0px', threshold: 0.05 },
      );
      io.observe(node);
      return () => io.disconnect();
    }
    run();
    return undefined;
  }, [reduced, delay, progress]);

  return (
    <Animated.View
      ref={ref}
      style={[
        style,
        {
          opacity: progress,
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
