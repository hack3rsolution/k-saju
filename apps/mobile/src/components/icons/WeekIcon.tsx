import Svg, { Rect, Line, Circle } from 'react-native-svg';

interface Props { color: string; size?: number; }

export function WeekIcon({ color, size = 24 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={4} width={18} height={17} rx={2} stroke={color} strokeWidth={1.5} />
      <Line x1={3} y1={9} x2={21} y2={9} stroke={color} strokeWidth={1.5} />
      <Line x1={8} y1={2} x2={8} y2={6} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Line x1={16} y1={2} x2={16} y2={6} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      {/* Row 1: 4 dots */}
      <Circle cx={7}  cy={13} r={1.2} fill={color} />
      <Circle cx={11} cy={13} r={1.2} fill={color} />
      <Circle cx={15} cy={13} r={1.2} fill={color} />
      <Circle cx={19} cy={13} r={1.2} fill={color} />
      {/* Row 2: 3 dots */}
      <Circle cx={7}  cy={17} r={1.2} fill={color} />
      <Circle cx={11} cy={17} r={1.2} fill={color} />
      <Circle cx={15} cy={17} r={1.2} fill={color} />
    </Svg>
  );
}
