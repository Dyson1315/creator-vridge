import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface QuickAction {
  title: string;
  description: string;
  icon: React.ReactNode;
  action: () => void;
  badge?: string;
  variant?: 'default' | 'primary' | 'secondary';
}

interface QuickActionsProps {
  title: string;
  actions: QuickAction[];
  className?: string;
}

export default function QuickActions({ title, actions, className }: QuickActionsProps) {
  const getActionVariant = (variant?: string) => {
    switch (variant) {
      case 'primary':
        return 'primary';
      case 'secondary':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span>{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {actions.map((action, index) => (
            <div
              key={index}
              className="group p-4 border border-calm-200 rounded-xl hover:border-primary-300 hover:shadow-soft transition-all duration-200 cursor-pointer"
              onClick={action.action}
            >
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-primary-50 group-hover:bg-primary-100 rounded-lg transition-colors">
                  <div className="text-primary-600 group-hover:text-primary-700">
                    {action.icon}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-calm-900 group-hover:text-primary-700 transition-colors">
                      {action.title}
                    </h4>
                    {action.badge && (
                      <span className="ml-2 px-2 py-0.5 bg-primary-100 text-primary-800 rounded-full text-xs font-medium">
                        {action.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-calm-600 mb-3 line-clamp-2">
                    {action.description}
                  </p>
                  <Button
                    size="sm"
                    variant={getActionVariant(action.variant) as any}
                    onClick={(e) => {
                      e.stopPropagation();
                      action.action();
                    }}
                    className="w-full"
                  >
                    実行
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}