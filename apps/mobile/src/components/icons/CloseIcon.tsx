import Svg, { Line } from 'react-native-svg';

interface Props { color: string; size?: number; }

export function CloseIcon({ color, size = 24 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1={6} y1={6} x2={18} y2={18} stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Line x1={18} y1={6} x2={6} y2={18} stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}
