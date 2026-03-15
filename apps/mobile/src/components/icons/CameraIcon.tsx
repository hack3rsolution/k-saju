import React from 'react';
import Svg, { Rect, Circle, Path } from 'react-native-svg';

interface Props {
  color: string;
  size?: number;
}

export function CameraIcon({ color, size = 24 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* 카메라 몸통 */}
      <Rect
        x="2" y="7" width="20" height="14" rx="2"
        stroke={color}
        strokeWidth={1.5}
        fill={color}
        fillOpacity={0.1}
      />
      {/* 뷰파인더 상단 돌출 */}
      <Path
        d="M8,7 L8,5 Q8,4 9,4 L15,4 Q16,4 16,5 L16,7"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* 렌즈 외원 */}
      <Circle
        cx="12" cy="14" r="4"
        stroke={color}
        strokeWidth={1.5}
        fill="none"
      />
      {/* 렌즈 내원 */}
      <Circle
        cx="12" cy="14" r="2"
        fill={color}
        fillOpacity={0.3}
      />
      {/* 플래시 */}
      <Circle
        cx="18" cy="10" r="1.5"
        fill={color}
        fillOpacity={0.6}
      />
    </Svg>
  );
}
