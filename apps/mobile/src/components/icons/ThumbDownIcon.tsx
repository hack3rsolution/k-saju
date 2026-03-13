import Svg, { G, Rect, Path } from 'react-native-svg';

interface Props { color: string; size?: number; }

export function ThumbDownIcon({ color, size = 24 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <G transform="scale(1,-1) translate(0,-24)">
        {/* Handle/wrist bar */}
        <Rect x={3} y={10} width={4} height={11} rx={1} fill={color} opacity={0.4} />
        {/* Thumb body */}
        <Path
          d="M7,10 L9,4 Q10,2 12,3 L12,8 L18,8 Q20,8 20,10 L19,18 Q19,20 17,20 L7,20 Z"
          fill={color}
        />
      </G>
    </Svg>
  );
}
