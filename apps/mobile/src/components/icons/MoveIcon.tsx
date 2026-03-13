import Svg, { Rect, Path, Circle } from 'react-native-svg';

interface Props { color: string; size?: number; }

export function MoveIcon({ color, size = 24 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={7} width={18} height={13} rx={2} stroke={color} strokeWidth={1.5} />
      <Path d="M3 10h18" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Path d="M9 15h6" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}
