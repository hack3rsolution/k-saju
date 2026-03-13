import Svg, { Circle } from 'react-native-svg';

interface Props { color: string; size?: number; }

export function EtcIcon({ color, size = 24 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={5} cy={12} r={1.5} stroke={color} strokeWidth={1.5} />
      <Circle cx={12} cy={12} r={1.5} stroke={color} strokeWidth={1.5} />
      <Circle cx={19} cy={12} r={1.5} stroke={color} strokeWidth={1.5} />
    </Svg>
  );
}
