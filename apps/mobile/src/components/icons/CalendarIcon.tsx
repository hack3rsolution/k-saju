import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface Props {
  color: string;
  size?: number;
}

export function CalendarIcon({ color, size = 24 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* 초승달: 바깥 큰 원호 - 안쪽 작은 원호 (달이 왼쪽 방향) */}
      <Path
        d="M14,3 A9,9 0 1,0 14,21 A6,6 0 1,1 14,3"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* 별 큰 것 (4-point diamond star) */}
      <Path
        d="M17.5,4 L18.2,6.3 L20.5,6.5 L18.2,7.2 L17.5,9 L16.8,7.2 L14.5,6.5 L16.8,6.3 Z"
        stroke={color}
        strokeWidth={1}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* 별 작은 것 (scale 0.6 적용) */}
      <Path
        d="M19,11.2 L19.42,12.58 L20.8,12.7 L19.42,13.12 L19,14.5 L18.58,13.12 L17.2,12.7 L18.58,12.58 Z"
        stroke={color}
        strokeWidth={1}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}
