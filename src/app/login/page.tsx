'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Mail, Lock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');

        try {
            const res = await api.post('/auth/login', {
                email: email.trim(),
                password
            });

            if (res.data && res.data.token) {
                // 1. حفظ التوكن وبيانات الجلسة
                localStorage.setItem('sarh_token', res.data.token);

                const userData = res.data.data?.user || res.data.data;
                const userRole = userData?.role || res.data.role;

                if (userData) {
                    localStorage.setItem('sarh_user', JSON.stringify(userData));
                }
                if (userRole) {
                    localStorage.setItem('sarh_role', userRole);
                }

                const subdomain = userData?.tenantId?.subdomain || userData?.tenant?.subdomain;
                if (subdomain) {
                    localStorage.setItem('sarh_tenant_subdomain', subdomain);
                }

                // 2. التوجيه المباشر والصلب حسب الرول
                if (userRole === 'SUPER_ADMIN') {
                    window.location.href = '/admin';
                    return;
                }

                if (userRole === 'AFFILIATE') {
                    window.location.href = '/affiliate/dashboard';
                    return;
                }

                window.location.href = '/dashboard';
            } else {
                setErrorMsg('استجابة الخادم غير مكتملة (لم يتم استلام التوكن)');
            }
        } catch (err: any) {
            console.error('Login error:', err);
            const backendError =
                err.response?.data?.error ||
                err.response?.data?.message ||
                (err.message === 'Network Error' ? 'تعذر الاتصال بخادم الباك إند (Port 5000)' : 'البريد الإلكتروني أو كلمة المرور غير صحيحة');
            setErrorMsg(backendError);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 font-sans selection:bg-blue-600 selection:text-white" dir="rtl">
            <div className="max-w-md w-full space-y-6">

                {/* Brand Header */}
                <div className="text-center space-y-2">
                    <Logo size={48} showText={true} />
                    <h1 className="text-lg font-black text-white">تسجيل الدخول للمنظومة</h1>
                    <p className="text-xs text-slate-400">ادخل لإدارة كاشير المطاعم، مبيعات التجزئة، أو الاشتراكات</p>
                </div>

                {/* Login Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 text-xs">

                    {errorMsg && (
                        <div id="login-error-alert" className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl flex items-center gap-2">
                            <AlertCircle size={16} className="shrink-0" />
                            <span>{errorMsg}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="text-slate-400 block mb-1 font-semibold flex items-center gap-1.5">
                                <Mail size={14} className="text-blue-400" /> البريد الإلكتروني:
                            </label>
                            <input
                                id="email-input"
                                type="email"
                                required
                                placeholder="name@company.com"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-blue-500 transition"
                            />
                        </div>

                        <div>
                            <label className="text-slate-400 block mb-1 font-semibold flex items-center gap-1.5">
                                <Lock size={14} className="text-amber-400" /> كلمة المرور:
                            </label>
                            <input
                                id="password-input"
                                type="password"
                                required
                                placeholder="••••••••"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-blue-500 transition"
                            />
                        </div>

                        <Button
                            id="login-submit-btn"
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-xl shadow-xl transition active:scale-98"
                        >
                            {loading ? 'جارٍ التحقق...' : 'دخول المنظومة'}
                        </Button>
                    </form>

                    <div className="text-center pt-3 border-t border-slate-800 text-slate-400">
                        ليس لديك حساب بعد؟{' '}
                        <Link href="/register" className="text-blue-400 font-bold hover:underline">
                            ابدأ تجربة مجانية
                        </Link>
                    </div>
                </div>

            </div>
        </div>
    );
}