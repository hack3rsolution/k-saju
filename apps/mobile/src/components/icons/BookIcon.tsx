import Svg, { Rect, Path, Line } from 'react-native-svg';

interface Props { color: string; size?: number; }

export function BookIcon({ color, size = 24 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={3} width={14} height={18} rx={2} stroke={color} strokeWidth={1.5} />
      <Path d="M17 3h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-2" stroke={color} strokeWidth={1.5} />
      <Line x1={7} y1={8} x2={13} y2={8} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Line x1={7} y1={12} x2={13} y2={12} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Line x1={7} y1={16} x2={11} y2={16} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}
