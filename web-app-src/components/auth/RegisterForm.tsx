'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '@/store/auth';
import { apiClient } from '@/lib/api';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  userType: 'VTUBER' | 'ARTIST';
  displayName: string;
}

export default function RegisterForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuthStore();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>();

  const password = watch('password');

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.register(
        data.email,
        data.password,
        data.userType,
        data.displayName
      );
      
      if (response.data) {
        login(response.data.user, response.data.token);
        router.push('/dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '登録に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto animate-fade-in">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl text-primary-400">
          新規登録
        </CardTitle>
        <p className="text-calm-600 mt-2">
          アカウントを作成してCreatorVridgeを始めましょう
        </p>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-calm-700 mb-3">
              ユーザータイプ
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="relative">
                <input
                  type="radio"
                  value="VTUBER"
                  className="sr-only"
                  {...register('userType', { required: 'ユーザータイプを選択してください' })}
                />
                <div className="border-2 border-calm-300 rounded-xl p-4 text-center cursor-pointer transition-all duration-200 hover:border-primary-400 has-[:checked]:border-primary-400 has-[:checked]:bg-primary-50">
                  <div className="text-2xl mb-2">🎭</div>
                  <div className="font-medium text-calm-700">VTuber</div>
                  <div className="text-xs text-calm-500">キャラクター制作を依頼</div>
                </div>
              </label>
              <label className="relative">
                <input
                  type="radio"
                  value="ARTIST"
                  className="sr-only"
                  {...register('userType', { required: 'ユーザータイプを選択してください' })}
                />
                <div className="border-2 border-calm-300 rounded-xl p-4 text-center cursor-pointer transition-all duration-200 hover:border-primary-400 has-[:checked]:border-primary-400 has-[:checked]:bg-primary-50">
                  <div className="text-2xl mb-2">🎨</div>
                  <div className="font-medium text-calm-700">絵師</div>
                  <div className="text-xs text-calm-500">イラストを制作</div>
                </div>
              </label>
            </div>
            {errors.userType && (
              <p className="mt-2 text-sm text-red-600">{errors.userType.message}</p>
            )}
          </div>

          <Input
            label="表示名"
            placeholder="表示名を入力"
            error={errors.displayName?.message}
            {...register('displayName', {
              required: '表示名を入力してください',
              minLength: {
                value: 2,
                message: '表示名は2文字以上で入力してください',
              },
            })}
          />

          <Input
            label="メールアドレス"
            type="email"
            placeholder="your@email.com"
            error={errors.email?.message}
            {...register('email', {
              required: 'メールアドレスを入力してください',
              pattern: {
                value: /^\S+@\S+$/i,
                message: '有効なメールアドレスを入力してください',
              },
            })}
          />

          <Input
            label="パスワード"
            type="password"
            placeholder="パスワードを入力"
            error={errors.password?.message}
            helperText="8文字以上、大文字・小文字・数字・記号を含む"
            {...register('password', {
              required: 'パスワードを入力してください',
              minLength: {
                value: 8,
                message: 'パスワードは8文字以上で入力してください',
              },
              pattern: {
                value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
                message: '大文字・小文字・数字・記号をそれぞれ含めてください',
              },
            })}
          />

          <Input
            label="パスワード（確認）"
            type="password"
            placeholder="パスワードを再入力"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword', {
              required: 'パスワードの確認入力を行ってください',
              validate: (value) =>
                value === password || 'パスワードが一致しません',
            })}
          />

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 animate-slide-up">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            loading={isLoading}
            className="w-full"
            size="lg"
          >
            アカウント作成
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-calm-600 text-sm">
            すでにアカウントをお持ちの方は{' '}
            <button
              onClick={() => router.push('/auth/login')}
              className="text-primary-400 hover:text-primary-500 font-medium"
            >
              ログイン
            </button>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}