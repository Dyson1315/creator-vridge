'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

interface DataPoint {
  timestamp: string;
  value: number;
  label?: string;
}

interface RealtimeChartProps {
  title: string;
  data: DataPoint[];
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  unit?: string;
  height?: number;
  showGrid?: boolean;
  className?: string;
}

const colorMap = {
  primary: {
    line: '#6B9BD2',
    gradient: 'from-primary-400/20 to-primary-400/5',
    dot: 'bg-primary-400',
  },
  secondary: {
    line: '#8BC34A',
    gradient: 'from-secondary-400/20 to-secondary-400/5',
    dot: 'bg-secondary-400',
  },
  success: {
    line: '#10B981',
    gradient: 'from-green-400/20 to-green-400/5',
    dot: 'bg-green-400',
  },
  warning: {
    line: '#F59E0B',
    gradient: 'from-yellow-400/20 to-yellow-400/5',
    dot: 'bg-yellow-400',
  },
  error: {
    line: '#EF4444',
    gradient: 'from-red-400/20 to-red-400/5',
    dot: 'bg-red-400',
  },
};

export default function RealtimeChart({
  title,
  data,
  color = 'primary',
  unit = '',
  height = 200,
  showGrid = true,
  className
}: RealtimeChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<DataPoint | null>(null);
  const [viewBox, setViewBox] = useState({ width: 400, height });
  
  const colors = colorMap[color];
  
  // データの正規化
  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const valueRange = maxValue - minValue || 1;
  
  // SVGパスの生成
  const generatePath = () => {
    if (data.length === 0) return '';
    
    const points = data.map((point, index) => {
      const x = (index / (data.length - 1)) * viewBox.width;
      const y = viewBox.height - ((point.value - minValue) / valueRange) * viewBox.height;
      return `${x},${y}`;
    });
    
    return `M ${points.join(' L ')}`;
  };
  
  // グラデーションエリアのパス
  const generateAreaPath = () => {
    const linePath = generatePath();
    if (!linePath) return '';
    
    const lastPoint = data[data.length - 1];
    const firstPoint = data[0];
    const lastX = ((data.length - 1) / (data.length - 1)) * viewBox.width;
    const firstX = 0;
    
    return `${linePath} L ${lastX},${viewBox.height} L ${firstX},${viewBox.height} Z`;
  };
  
  // リアルタイム更新のシミュレーション
  useEffect(() => {
    const interval = setInterval(() => {
      // 実際はここでAPIからデータを取得
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{title}</span>
          <div className="flex items-center space-x-2">
            <div className={cn('w-2 h-2 rounded-full animate-pulse', colors.dot)}></div>
            <span className="text-sm text-calm-500">リアルタイム</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative" style={{ height: `${height}px` }}>
          <svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${viewBox.width} ${viewBox.height}`}
            className="overflow-visible"
          >
            {/* グリッド */}
            {showGrid && (
              <g className="opacity-20">
                {[...Array(5)].map((_, i) => {
                  const y = (i / 4) * viewBox.height;
                  return (
                    <line
                      key={`grid-${i}`}
                      x1="0"
                      y1={y}
                      x2={viewBox.width}
                      y2={y}
                      stroke="currentColor"
                      strokeWidth="1"
                      className="text-calm-300"
                    />
                  );
                })}
              </g>
            )}
            
            {/* グラデーションエリア */}
            <defs>
              <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={colors.line} stopOpacity="0.2" />
                <stop offset="100%" stopColor={colors.line} stopOpacity="0.05" />
              </linearGradient>
            </defs>
            
            <path
              d={generateAreaPath()}
              fill={`url(#gradient-${color})`}
              className="transition-all duration-300"
            />
            
            {/* ライン */}
            <path
              d={generatePath()}
              fill="none"
              stroke={colors.line}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all duration-300"
            />
            
            {/* データポイント */}
            {data.map((point, index) => {
              const x = (index / (data.length - 1)) * viewBox.width;
              const y = viewBox.height - ((point.value - minValue) / valueRange) * viewBox.height;
              
              return (
                <circle
                  key={index}
                  cx={x}
                  cy={y}
                  r="3"
                  fill={colors.line}
                  className="cursor-pointer transition-all duration-200 hover:r-4"
                  onMouseEnter={() => setHoveredPoint(point)}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              );
            })}
          </svg>
          
          {/* ツールチップ */}
          {hoveredPoint && (
            <div className="absolute top-4 right-4 bg-white border border-calm-200 rounded-lg shadow-soft p-3 text-sm">
              <div className="font-medium text-calm-900">
                {hoveredPoint.value.toLocaleString()}{unit}
              </div>
              <div className="text-calm-500">
                {formatTime(hoveredPoint.timestamp)}
              </div>
            </div>
          )}
        </div>
        
        {/* 時間軸ラベル */}
        <div className="flex justify-between text-xs text-calm-500 mt-2">
          <span>{data.length > 0 ? formatTime(data[0].timestamp) : ''}</span>
          <span>{data.length > 0 ? formatTime(data[data.length - 1].timestamp) : ''}</span>
        </div>
      </CardContent>
    </Card>
  );
}