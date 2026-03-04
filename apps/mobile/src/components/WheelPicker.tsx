/**
 * WheelPicker — drum-roll style picker using FlatList snap scrolling.
 *
 * Pads the data array with empty slots so the first and last real items
 * can be centred in the 5-item visible window. Offset math:
 *   offset = selectedIndex × ITEM_H  (maps to paddedData[selectedIndex + SIDE])
 */
import { useRef, useEffect, useCallback } from 'react';
import {
  FlatList,
  View,
  Text,
  StyleSheet,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';

const ITEM_H = 48;
const SIDE = 2; // blank rows above/below the selected slot

interface Props {
  data: readonly string[];
  selectedIndex: number;
  onIndexChange: (i: number) => void;
  width?: number;
}

export function WheelPicker({ data, selectedIndex, onIndexChange, width = 80 }: Props) {
  const ref = useRef<FlatList>(null);
  const paddedData = [...Array(SIDE).fill(''), ...data, ...Array(SIDE).fill('')];

  // Scroll to the initial selection after layout
  useEffect(() => {
    const timer = setTimeout(() => {
      ref.current?.scrollToOffset({ offset: selectedIndex * ITEM_H, animated: false });
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  const onMomentumScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const idx = Math.round(e.nativeEvent.contentOffset.y / ITEM_H);
      onIndexChange(Math.min(Math.max(idx, 0), data.length - 1));
    },
    [data.length, onIndexChange],
  );

  return (
    <View style={[styles.container, { width }]}>
      {/* Selection highlight bar */}
      <View style={styles.selector} pointerEvents="none" />
      <FlatList
        ref={ref}
        data={paddedData}
        keyExtractor={(_, i) => String(i)}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_H}
        decelerationRate="fast"
        removeClippedSubviews={false}
        onMomentumScrollEnd={onMomentumScrollEnd}
        style={styles.list}
        renderItem={({ item, index }) => {
          const actualIdx = index - SIDE;
          const isSelected = actualIdx === selectedIndex;
          return (
            <View style={styles.item}>
              <Text style={[styles.text, isSelected && styles.textSelected]}>{item}</Text>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { height: ITEM_H * 5, overflow: 'hidden' },
  selector: {
    position: 'absolute',
    top: ITEM_H * 2,
    left: 0,
    right: 0,
    height: ITEM_H,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#7c3aed',
    zIndex: 1,
  },
  list: { flex: 1 },
  item: { height: ITEM_H, alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 18, color: '#5a4d7a' },
  textSelected: { fontSize: 20, fontWeight: '700', color: '#fff' },
});
