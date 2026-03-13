import Svg, { Rect, Path } from 'react-native-svg';

interface Props { color: string; size?: number; }

export function LockIcon({ color, size = 24 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={5} y={11} width={14} height={10} rx={2} stroke={color} strokeWidth={1.5} />
      <Path d="M8 11V7a4 4 0 0 1 8 0v4" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Path d="M12 15v2" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}
