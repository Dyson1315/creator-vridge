'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  icon?: React.ReactNode;
  className?: string;
}

export default function StatCard({
  title,
  value,
  subtitle,
  trend,
  icon,
  className = '',
}: StatCardProps) {
  return (
    <Card className={`hover:shadow-md transition-shadow ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-calm-600">
          {title}
        </CardTitle>
        {icon && (
          <div className="text-calm-400">
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-calm-900">{value}</div>
        {subtitle && (
          <p className="text-xs text-calm-500 mt-1">
            {subtitle}
          </p>
        )}
        {trend && (
          <div className="flex items-center mt-2">
            <span
              className={`text-sm font-medium ${
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {trend.isPositive ? '+' : ''}{trend.value}%
            </span>
            <span className="text-xs text-calm-500 ml-1">前月比</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}