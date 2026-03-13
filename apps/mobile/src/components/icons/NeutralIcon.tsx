import Svg, { Circle, Line } from 'react-native-svg';

interface Props { color: string; size?: number; }

export function NeutralIcon({ color, size = 24 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={1.5} />
      <Line x1={8.5} y1={15} x2={15.5} y2={15} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Circle cx={9} cy={10} r={1} fill={color} />
      <Circle cx={15} cy={10} r={1} fill={color} />
    </Svg>
  );
}
