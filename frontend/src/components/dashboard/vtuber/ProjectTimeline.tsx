'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface ProjectPhase {
  id: string;
  name: string;
  status: 'completed' | 'current' | 'upcoming' | 'blocked';
  startDate: string;
  endDate: string;
  progress: number;
}

interface Project {
  id: string;
  title: string;
  artistName: string;
  type: string;
  status: 'planning' | 'in_progress' | 'review' | 'completed' | 'cancelled';
  priority: 'high' | 'medium' | 'low';
  budget: number;
  deadline: string;
  phases: ProjectPhase[];
  nextMilestone: string;
  daysUntilDeadline: number;
}

export default function ProjectTimeline() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  useEffect(() => {
    // プロジェクトデータを取得
    const fetchProjects = async () => {
      try {
        // TODO: API呼び出し
        // 仮のデータ
        setProjects([
          {
            id: '1',
            title: 'メインキャラクターデザイン',
            artistName: '桜咲アーティスト',
            type: 'キャラクターデザイン',
            status: 'in_progress',
            priority: 'high',
            budget: 80000,
            deadline: '2024-10-15',
            daysUntilDeadline: 12,
            nextMilestone: 'ラフ案確認',
            phases: [
              { id: '1', name: '企画・打ち合わせ', status: 'completed', startDate: '2024-09-01', endDate: '2024-09-05', progress: 100 },
              { id: '2', name: 'ラフ制作', status: 'current', startDate: '2024-09-06', endDate: '2024-09-15', progress: 75 },
              { id: '3', name: '線画制作', status: 'upcoming', startDate: '2024-09-16', endDate: '2024-09-25', progress: 0 },
              { id: '4', name: '着色', status: 'upcoming', startDate: '2024-09-26', endDate: '2024-10-10', progress: 0 },
              { id: '5', name: '最終調整', status: 'upcoming', startDate: '2024-10-11', endDate: '2024-10-15', progress: 0 },
            ]
          },
          {
            id: '2',
            title: 'Live2Dモデル制作',
            artistName: 'BlueArt Studio',
            type: 'Live2D',
            status: 'planning',
            priority: 'medium',
            budget: 120000,
            deadline: '2024-11-30',
            daysUntilDeadline: 58,
            nextMilestone: '仕様確定',
            phases: [
              { id: '1', name: '要件定義', status: 'current', startDate: '2024-09-18', endDate: '2024-09-25', progress: 30 },
              { id: '2', name: 'ベースモデル作成', status: 'upcoming', startDate: '2024-09-26', endDate: '2024-10-15', progress: 0 },
              { id: '3', name: 'アニメーション設定', status: 'upcoming', startDate: '2024-10-16', endDate: '2024-11-10', progress: 0 },
              { id: '4', name: 'テスト・調整', status: 'upcoming', startDate: '2024-11-11', endDate: '2024-11-30', progress: 0 },
            ]
          },
          {
            id: '3',
            title: 'サムネイル用イラスト',
            artistName: 'みどりの絵師さん',
            type: 'イラスト',
            status: 'review',
            priority: 'low',
            budget: 25000,
            deadline: '2024-09-30',
            daysUntilDeadline: 7,
            nextMilestone: '最終確認',
            phases: [
              { id: '1', name: '構図案作成', status: 'completed', startDate: '2024-09-10', endDate: '2024-09-12', progress: 100 },
              { id: '2', name: 'ラフ制作', status: 'completed', startDate: '2024-09-13', endDate: '2024-09-16', progress: 100 },
              { id: '3', name: '線画・着色', status: 'completed', startDate: '2024-09-17', endDate: '2024-09-22', progress: 100 },
              { id: '4', name: '最終確認', status: 'current', startDate: '2024-09-23', endDate: '2024-09-30', progress: 80 },
            ]
          },
        ]);
        setSelectedProject('1');
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch projects:', error);
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-secondary-500';
      case 'current':
        return 'bg-primary-500';
      case 'upcoming':
        return 'bg-calm-300';
      case 'blocked':
        return 'bg-red-500';
      default:
        return 'bg-calm-300';
    }
  };

  const getProjectStatusColor = (status: string) => {
    switch (status) {
      case 'planning':
        return 'text-blue-600 bg-blue-100';
      case 'in_progress':
        return 'text-primary-600 bg-primary-100';
      case 'review':
        return 'text-yellow-600 bg-yellow-100';
      case 'completed':
        return 'text-secondary-600 bg-secondary-100';
      case 'cancelled':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-calm-600 bg-calm-100';
    }
  };

  const getProjectStatusText = (status: string) => {
    switch (status) {
      case 'planning':
        return '企画中';
      case 'in_progress':
        return '制作中';
      case 'review':
        return '確認中';
      case 'completed':
        return '完了';
      case 'cancelled':
        return 'キャンセル';
      default:
        return '不明';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-secondary-600 bg-secondary-50 border-secondary-200';
      default:
        return 'text-calm-600 bg-calm-50 border-calm-200';
    }
  };

  const selectedProjectData = projects.find(p => p.id === selectedProject);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>プロジェクト進捗</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="flex space-x-4 mb-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-calm-200 rounded-lg flex-1"></div>
              ))}
            </div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="w-4 h-4 bg-calm-200 rounded-full"></div>
                  <div className="flex-1 h-4 bg-calm-200 rounded"></div>
                  <div className="w-16 h-4 bg-calm-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span>プロジェクト進捗</span>
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.location.href = '/dashboard/vtuber/projects'}
          >
            すべて見る
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* プロジェクト選択タブ */}
        <div className="flex space-x-2 mb-6 overflow-x-auto">
          {projects.map((project) => (
            <button
              key={project.id}
              onClick={() => setSelectedProject(project.id)}
              className={cn(
                'flex-shrink-0 px-4 py-3 rounded-lg border-2 transition-colors text-left min-w-[200px]',
                selectedProject === project.id
                  ? 'border-primary-300 bg-primary-50'
                  : 'border-calm-200 hover:border-calm-300 bg-white'
              )}
            >
              <div className="font-medium text-sm text-calm-900 mb-1">
                {project.title}
              </div>
              <div className="flex items-center justify-between text-xs text-calm-600">
                <span>{project.artistName}</span>
                <span className={cn(
                  'px-2 py-0.5 rounded-full font-medium',
                  getProjectStatusColor(project.status)
                )}>
                  {getProjectStatusText(project.status)}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* 選択されたプロジェクトの詳細 */}
        {selectedProjectData && (
          <div className="space-y-6">
            {/* プロジェクト概要 */}
            <div className="bg-calm-50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-calm-900 mb-1">
                    {selectedProjectData.title}
                  </h3>
                  <p className="text-sm text-calm-600">
                    {selectedProjectData.artistName} • {selectedProjectData.type}
                  </p>
                </div>
                <div className={cn(
                  'px-3 py-1 rounded-full border font-medium text-sm',
                  getPriorityColor(selectedProjectData.priority)
                )}>
                  {selectedProjectData.priority === 'high' ? '高優先度' : 
                   selectedProjectData.priority === 'medium' ? '中優先度' : '低優先度'}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-calm-600">予算</span>
                  <p className="font-semibold">¥{selectedProjectData.budget.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-calm-600">期限</span>
                  <p className="font-semibold">{selectedProjectData.deadline}</p>
                </div>
                <div>
                  <span className="text-calm-600">残り日数</span>
                  <p className="font-semibold">{selectedProjectData.daysUntilDeadline}日</p>
                </div>
                <div>
                  <span className="text-calm-600">次のステップ</span>
                  <p className="font-semibold">{selectedProjectData.nextMilestone}</p>
                </div>
              </div>
            </div>

            {/* タイムライン */}
            <div className="space-y-4">
              <h4 className="font-semibold text-calm-900">制作フェーズ</h4>
              <div className="space-y-4">
                {selectedProjectData.phases.map((phase, index) => (
                  <div key={phase.id} className="flex items-center space-x-4">
                    {/* ステータスインジケーター */}
                    <div className="flex flex-col items-center">
                      <div className={cn(
                        'w-4 h-4 rounded-full',
                        getStatusColor(phase.status)
                      )}></div>
                      {index < selectedProjectData.phases.length - 1 && (
                        <div className="w-0.5 h-8 bg-calm-200 mt-2"></div>
                      )}
                    </div>

                    {/* フェーズ情報 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-calm-900">{phase.name}</h5>
                        <span className="text-sm text-calm-600">
                          {phase.startDate} - {phase.endDate}
                        </span>
                      </div>
                      
                      {/* プログレスバー */}
                      <div className="w-full bg-calm-200 rounded-full h-2">
                        <div 
                          className={cn(
                            'h-2 rounded-full transition-all duration-300',
                            phase.status === 'completed' ? 'bg-secondary-500' :
                            phase.status === 'current' ? 'bg-primary-500' :
                            'bg-calm-300'
                          )}
                          style={{ width: `${phase.progress}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <span className={cn(
                          'text-xs font-medium',
                          phase.status === 'completed' ? 'text-secondary-600' :
                          phase.status === 'current' ? 'text-primary-600' :
                          'text-calm-600'
                        )}>
                          {phase.status === 'completed' ? '完了' :
                           phase.status === 'current' ? '進行中' :
                           phase.status === 'blocked' ? 'ブロック中' : '未開始'}
                        </span>
                        <span className="text-xs text-calm-600">
                          {phase.progress}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* アクションボタン */}
            <div className="flex space-x-3 pt-4 border-t border-calm-200">
              <Button size="sm">
                進捗確認
              </Button>
              <Button variant="outline" size="sm">
                メッセージ
              </Button>
              <Button variant="ghost" size="sm">
                詳細
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}