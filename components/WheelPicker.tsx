import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  Animated,
  StyleSheet,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';

const ITEM_HEIGHT = 52;
const VISIBLE_COUNT = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_COUNT;

interface WheelPickerProps {
  min: number;
  max: number;
  value: number;
  onValueChange: (value: number) => void;
  suffix?: string;
}

export default function WheelPicker({
  min,
  max,
  value,
  onValueChange,
  suffix = '',
}: WheelPickerProps) {
  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<any>(null);
  const data = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  useEffect(() => {
    const index = value - min;
    const timer = setTimeout(() => {
      scrollRef.current?.scrollTo({ y: index * ITEM_HEIGHT, animated: false });
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  const handleScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = e.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(index, data.length - 1));
    onValueChange(data[clamped]);
  };

  return (
    <View style={styles.container}>
      {/* 선택 영역 표시 */}
      <View style={[styles.indicator, { top: ITEM_HEIGHT * 2 }]} />
      <View style={[styles.indicator, { top: ITEM_HEIGHT * 3 }]} />
      <View style={styles.selectedBg} />

      <Animated.ScrollView
        ref={scrollRef}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        bounces={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        onMomentumScrollEnd={handleScrollEnd}
        contentContainerStyle={{ paddingVertical: ITEM_HEIGHT * 2 }}
      >
        {data.map((num, index) => {
          const inputRange = [
            (index - 2) * ITEM_HEIGHT,
            (index - 1) * ITEM_HEIGHT,
            index * ITEM_HEIGHT,
            (index + 1) * ITEM_HEIGHT,
            (index + 2) * ITEM_HEIGHT,
          ];

          const opacity = scrollY.interpolate({
            inputRange,
            outputRange: [0.15, 0.35, 1, 0.35, 0.15],
            extrapolate: 'clamp',
          });

          const scale = scrollY.interpolate({
            inputRange,
            outputRange: [0.8, 0.9, 1.05, 0.9, 0.8],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              key={num}
              style={[
                styles.item,
                { opacity, transform: [{ scale }] },
              ]}
            >
              <Text style={styles.itemText}>
                {num}
                {suffix}
              </Text>
            </Animated.View>
          );
        })}
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: PICKER_HEIGHT,
    overflow: 'hidden',
    position: 'relative',
  },
  indicator: {
    position: 'absolute',
    left: 20,
    right: 20,
    height: 1,
    backgroundColor: '#CBD5E1',
    zIndex: 1,
  },
  selectedBg: {
    position: 'absolute',
    top: ITEM_HEIGHT * 2,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    backgroundColor: 'rgba(59, 130, 246, 0.06)',
    zIndex: 0,
  },
  item: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
  },
});
