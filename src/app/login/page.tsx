'use client';

import React, { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LogIn, ArrowRight } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrorMsg('');

        try {
            const res = await axios.post('http://localhost:5000/api/v1/auth/login', formData);
            const { token, data } = res.data;

            // حفظ التوكن وبيانات الجلسة في LocalStorage
            localStorage.setItem('sarh_token', token);
            localStorage.setItem('sarh_user', JSON.stringify(data));

            // التوجيه بناءً على الدور
            if (data.role === 'AFFILIATE') {
                router.push('/affiliate/dashboard');
            } else if (data.role === 'SUPER_ADMIN') {
                router.push('/admin/dashboard');
            } else {
                router.push('/');
            }
        } catch (err: any) {
            setErrorMsg(err.response?.data?.error || 'فشل تسجيل الدخول، تحقق من صحة البيانات');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="min-h-screen flex items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950">
            <div className="max-w-md w-full bg-slate-900/70 border border-slate-800 backdrop-blur-xl rounded-2xl p-8 shadow-2xl">
                <div className="text-center mb-8">
                    <div className="w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto mb-3">
                        <LogIn size={22} />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-1">تسجيل الدخول</h1>
                    <p className="text-slate-400 text-sm">الوصول إلى لوحة التحكم وحسابك السحابي</p>
                </div>

                {errorMsg && (
                    <div className="mb-6 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm text-right">
                        {errorMsg}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                    <Input
                        label="البريد الإلكتروني"
                        type="email"
                        required
                        dir="ltr"
                        placeholder="user@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />

                    <Input
                        label="كلمة المرور"
                        type="password"
                        required
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />

                    <Button type="submit" isLoading={isSubmitting} className="w-full py-3.5 mt-2 text-base font-semibold">
                        دخول للوحة التحكم
                    </Button>
                </form>

                <div className="mt-8 pt-6 border-t border-slate-800/80 text-center flex items-center justify-between text-xs text-slate-400">
                    <Link href="/register" className="hover:text-white transition">إنشاء منشأة جديدة</Link>
                    <Link href="/affiliate/register" className="text-blue-400 hover:underline">التسجيل كمسوق</Link>
                </div>
            </div>
        </main>
    );
}