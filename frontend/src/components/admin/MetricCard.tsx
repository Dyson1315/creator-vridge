'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { 
  ArrowUpIcon, 
  ArrowDownIcon,
  MinusIcon 
} from '@heroicons/react/24/outline';

type TrendType = 'up' | 'down' | 'neutral';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  trend?: {
    type: TrendType;
    value: string;
    period: string;
  };
  icon?: React.ElementType;
  className?: string;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
}

const colorStyles = {
  primary: {
    iconBg: 'bg-primary-100',
    iconColor: 'text-primary-600',
    trendUp: 'text-primary-600',
    trendDown: 'text-red-600',
  },
  secondary: {
    iconBg: 'bg-secondary-100',
    iconColor: 'text-secondary-600',
    trendUp: 'text-secondary-600',
    trendDown: 'text-red-600',
  },
  success: {
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    trendUp: 'text-green-600',
    trendDown: 'text-red-600',
  },
  warning: {
    iconBg: 'bg-yellow-100',
    iconColor: 'text-yellow-600',
    trendUp: 'text-green-600',
    trendDown: 'text-red-600',
  },
  error: {
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    trendUp: 'text-green-600',
    trendDown: 'text-red-600',
  },
};

const getTrendIcon = (type: TrendType) => {
  switch (type) {
    case 'up':
      return ArrowUpIcon;
    case 'down':
      return ArrowDownIcon;
    default:
      return MinusIcon;
  }
};

const getTrendColor = (type: TrendType, colorScheme: keyof typeof colorStyles) => {
  const colors = colorStyles[colorScheme];
  switch (type) {
    case 'up':
      return colors.trendUp;
    case 'down':
      return colors.trendDown;
    default:
      return 'text-calm-500';
  }
};

export default function MetricCard({ 
  title, 
  value, 
  unit, 
  trend, 
  icon: Icon, 
  className,
  color = 'primary'
}: MetricCardProps) {
  const styles = colorStyles[color];
  const TrendIcon = trend ? getTrendIcon(trend.type) : null;
  const trendColor = trend ? getTrendColor(trend.type, color) : '';

  return (
    <Card className={cn('hover:shadow-soft transition-all duration-200', className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-calm-600 mb-1">{title}</p>
            <div className="flex items-baseline space-x-2">
              <p className="text-2xl font-bold text-calm-900">
                {typeof value === 'number' ? value.toLocaleString() : value}
              </p>
              {unit && (
                <span className="text-sm text-calm-500">{unit}</span>
              )}
            </div>
            
            {trend && (
              <div className={cn('flex items-center space-x-1 mt-2', trendColor)}>
                {TrendIcon && <TrendIcon className="h-4 w-4" />}
                <span className="text-sm font-medium">{trend.value}</span>
                <span className="text-xs text-calm-500">{trend.period}</span>
              </div>
            )}
          </div>
          
          {Icon && (
            <div className={cn('p-3 rounded-xl', styles.iconBg)}>
              <Icon className={cn('h-6 w-6', styles.iconColor)} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}