import React from 'react';
import Svg, { Rect, Path, Circle, Line } from 'react-native-svg';

interface Props {
  color: string;
  size?: number;
}

export function GalleryIcon({ color, size = 24 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* 외곽 프레임 */}
      <Rect
        x="3" y="3" width="18" height="18" rx="2"
        stroke={color}
        strokeWidth={1.5}
        fill={color}
        fillOpacity={0.1}
      />
      {/* 산 모양 풍경 */}
      <Path
        d="M3,15 L8,10 L13,14 L16,11 L21,16"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* 태양 */}
      <Circle
        cx="7" cy="8" r="2"
        fill={color}
        fillOpacity={0.4}
      />
      {/* 하단선 */}
      <Line
        x1="3" y1="18" x2="21" y2="18"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </Svg>
  );
}
