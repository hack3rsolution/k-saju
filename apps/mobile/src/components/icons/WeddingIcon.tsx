import Svg, { Circle, Path } from 'react-native-svg';

interface Props { color: string; size?: number; }

export function WeddingIcon({ color, size = 24 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={8} cy={14} r={5} stroke={color} strokeWidth={1.5} />
      <Circle cx={16} cy={14} r={5} stroke={color} strokeWidth={1.5} />
      <Path d="M12 9V7M10 7h4" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}
