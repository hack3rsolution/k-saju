import Svg, { Rect, Line, Circle } from 'react-native-svg';

interface Props { color: string; size?: number; }

export function MonthIcon({ color, size = 24 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={4} width={18} height={17} rx={2} stroke={color} strokeWidth={1.5} />
      <Line x1={3} y1={9} x2={21} y2={9} stroke={color} strokeWidth={1.5} />
      <Line x1={8} y1={2} x2={8} y2={6} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Line x1={16} y1={2} x2={16} y2={6} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      {/* Row 1: 5 dots */}
      <Circle cx={7}  cy={12.5} r={0.9} fill={color} />
      <Circle cx={10} cy={12.5} r={0.9} fill={color} />
      <Circle cx={13} cy={12.5} r={0.9} fill={color} />
      <Circle cx={16} cy={12.5} r={0.9} fill={color} />
      <Circle cx={19} cy={12.5} r={0.9} fill={color} />
      {/* Row 2: 5 dots */}
      <Circle cx={7}  cy={16} r={0.9} fill={color} />
      <Circle cx={10} cy={16} r={0.9} fill={color} />
      <Circle cx={13} cy={16} r={0.9} fill={color} />
      <Circle cx={16} cy={16} r={0.9} fill={color} />
      <Circle cx={19} cy={16} r={0.9} fill={color} />
      {/* Row 3: 3 dots */}
      <Circle cx={7}  cy={19.5} r={0.9} fill={color} />
      <Circle cx={10} cy={19.5} r={0.9} fill={color} />
      <Circle cx={13} cy={19.5} r={0.9} fill={color} />
    </Svg>
  );
}
