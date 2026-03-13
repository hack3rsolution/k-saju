import Svg, { Circle, Path, Line } from 'react-native-svg';

interface Props { color: string; size?: number; }

export function FinanceIcon({ color, size = 24 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={1.5} />
      <Path d="M14.5 9.5a2.5 2.5 0 0 0-5 0c0 1.4 1 2 2.5 2.5s2.5 1.1 2.5 2.5a2.5 2.5 0 0 1-5 0" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Line x1={12} y1={7} x2={12} y2={8.5} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Line x1={12} y1={15.5} x2={12} y2={17} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}
