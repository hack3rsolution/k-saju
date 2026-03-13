import Svg, { Rect, Path } from 'react-native-svg';

interface Props { color: string; size?: number; }

export function CareerIcon({ color, size = 24 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={2} y={8} width={20} height={13} rx={2} stroke={color} strokeWidth={1.5} />
      <Path d="M16 8V6a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Path d="M12 13v4M10 15h4" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}
