'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Mail, Lock, ArrowLeft, AlertCircle, ShieldCheck, Sparkles } from 'lucide-react';
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
            const res = await api.post('/auth/login', { email, password });

            if (res.data && res.data.token) {
                // 1. تخزين التوكن
                localStorage.setItem('sarh_token', res.data.token);

                // 2. قراءة بيانات المستخدم سواء جاءت مباشرة أو متداخلة (Data Normalization)
                const user = res.data.data?.user || res.data.data;

                if (user) {
                    localStorage.setItem('sarh_user', JSON.stringify(user));
                    if (user.role) {
                        localStorage.setItem('sarh_role', user.role);
                    }

                    // 3. التوجيه الصارم حسب الصلاحية
                    if (user.role === 'SUPER_ADMIN') {
                        router.push('/admin');
                        return;
                    }

                    if (user.role === 'AFFILIATE') {
                        router.push('/affiliate/dashboard');
                        return;
                    }
                }

                // 4. استخراج الدومين الفرعي للمستأجر إن وجد
                const subdomain = user?.tenantId?.subdomain || user?.tenant?.subdomain;
                if (subdomain) {
                    localStorage.setItem('sarh_tenant_subdomain', subdomain);
                }

                // 5. مسار منشآت التجار والمطاعم الافتراضي
                router.push('/dashboard');
            } else {
                setErrorMsg('فشل استلام توكن التوثيق من الخادم');
            }
        } catch (err: any) {
            setErrorMsg(
                err.response?.data?.error ||
                err.response?.data?.message ||
                'البريد الإلكتروني أو كلمة المرور غير صحيحة'
            );
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
                        <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl flex items-center gap-2">
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
                                type="password"
                                required
                                placeholder="••••••••"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-blue-500 transition"
                            />
                        </div>

                        <Button
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