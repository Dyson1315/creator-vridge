'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '@/store/auth';
import { apiClient } from '@/lib/api';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

interface LoginFormData {
  email: string;
  password: string;
}

export default function LoginForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.login(data.email, data.password);
      
      if (response.data) {
        login(response.data.user, response.data.token);
        router.push('/dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ログインに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto animate-fade-in">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl text-primary-400">
          ログイン
        </CardTitle>
        <p className="text-calm-600 mt-2">
          CreatorVridgeへようこそ
        </p>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
            {...register('password', {
              required: 'パスワードを入力してください',
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
            ログイン
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-calm-600 text-sm">
            アカウントをお持ちでない方は{' '}
            <button
              onClick={() => router.push('/auth/register')}
              className="text-primary-400 hover:text-primary-500 font-medium"
            >
              新規登録
            </button>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}