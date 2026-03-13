import Svg, { Path, Line } from 'react-native-svg';

interface Props { color: string; size?: number; }

export function ChatIcon({ color, size = 24 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Bubble fill */}
      <Path
        d="M4,4 L20,4 Q22,4 22,6 L22,16 Q22,18 20,18 L13,18 L8,22 L8,18 L4,18 Q2,18 2,16 L2,6 Q2,4 4,4 Z"
        fill={color}
        opacity={0.15}
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      {/* Inner lines */}
      <Line x1={7} y1={9} x2={17} y2={9} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Line x1={7} y1={13} x2={13} y2={13} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}
