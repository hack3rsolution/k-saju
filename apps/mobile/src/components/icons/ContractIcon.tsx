import Svg, { Rect, Path, Line } from 'react-native-svg';

interface Props { color: string; size?: number; }

export function ContractIcon({ color, size = 24 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={4} y={2} width={16} height={20} rx={2} stroke={color} strokeWidth={1.5} />
      <Line x1={8} y1={8} x2={16} y2={8} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Line x1={8} y1={12} x2={16} y2={12} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Path d="M8 16h4" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Path d="M14 15l1.5 1.5L18 14" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
