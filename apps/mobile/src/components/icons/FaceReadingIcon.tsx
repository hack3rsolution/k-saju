import React from 'react';
import Svg, { Path, Line, Circle } from 'react-native-svg';

interface Props {
  color: string;
  size?: number;
}

export function FaceReadingIcon({ color, size = 24 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* 얼굴 외곽 */}
      <Path
        d="M12,3 Q17,3 19,8 Q21,13 19,18 Q17,21 12,21 Q7,21 5,18 Q3,13 5,8 Q7,3 12,3 Z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={color}
        fillOpacity={0.1}
      />
      {/* 눈 좌 */}
      <Path
        d="M8,10 Q9,9 10,10 Q9,11 8,10 Z"
        stroke={color}
        strokeWidth={1}
        fill={color}
        fillOpacity={0.6}
      />
      {/* 눈 우 */}
      <Path
        d="M14,10 Q15,9 16,10 Q15,11 14,10 Z"
        stroke={color}
        strokeWidth={1}
        fill={color}
        fillOpacity={0.6}
      />
      {/* 코 */}
      <Line
        x1="12" y1="11" x2="11" y2="14"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      {/* 입 */}
      <Path
        d="M9,16 Q12,18 15,16"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        fill="none"
      />
      {/* 이마 관상 포인트 */}
      <Circle
        cx="12" cy="6" r="1"
        fill={color}
        fillOpacity={0.5}
      />
    </Svg>
  );
}
