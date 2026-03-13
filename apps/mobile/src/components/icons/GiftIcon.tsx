import Svg, { Rect, Line, Path } from 'react-native-svg';

interface Props { color: string; size?: number; }

export function GiftIcon({ color, size = 24 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Ribbon horizontal bar */}
      <Rect x={3} y={8} width={18} height={3} rx={1} fill={color} opacity={0.3} />
      {/* Box body */}
      <Rect x={4} y={11} width={16} height={10} rx={1.5} stroke={color} strokeWidth={1.5} fill="none" />
      {/* Ribbon vertical line */}
      <Line x1={12} y1={8} x2={12} y2={21} stroke={color} strokeWidth={1.5} />
      {/* Left bow loop */}
      <Path d="M12,8 Q8,8 8,5 Q8,2 12,4" stroke={color} strokeWidth={1.5} fill="none" strokeLinecap="round" />
      {/* Right bow loop */}
      <Path d="M12,8 Q16,8 16,5 Q16,2 12,4" stroke={color} strokeWidth={1.5} fill="none" strokeLinecap="round" />
    </Svg>
  );
}
