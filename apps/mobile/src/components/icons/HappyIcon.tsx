import Svg, { Circle, Path } from 'react-native-svg';

interface Props { color: string; size?: number; }

export function HappyIcon({ color, size = 24 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={1.5} />
      <Path d="M8.5 14.5s1 2 3.5 2 3.5-2 3.5-2" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Circle cx={9} cy={10} r={1} fill={color} />
      <Circle cx={15} cy={10} r={1} fill={color} />
    </Svg>
  );
}
