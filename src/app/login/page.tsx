'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Lock, Mail, Store, ArrowLeft, AlertCircle, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function LoginPage() {
    const router = useRouter();
    const [loginType, setLoginType] = useState<'tenant' | 'affiliate'>('tenant');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [subdomain, setSubdomain] = useState('alsarh-express');
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMessage('');

        try {
            const res = await api.post(
                '/auth/login',
                { email, password },
                {
                    headers: loginType === 'tenant' ? { 'x-tenant-subdomain': subdomain.trim() } : {}
                }
            );

            const token = res.data.token;
            const user = res.data.data || res.data.user;

            localStorage.setItem('sarh_token', token);
            localStorage.setItem('sarh_user', JSON.stringify(user));

            // التوجيه الذكي حسب الدور والنوع المختار
            if (user?.role === 'AFFILIATE' || loginType === 'affiliate') {
                router.push('/affiliate/dashboard');
            } else {
                localStorage.setItem('sarh_tenant_subdomain', subdomain.trim());
                router.push('/pos');
            }
        } catch (err: any) {
            setErrorMessage(err.response?.data?.error || 'البريد الإلكتروني أو كلمة المرور غير صحيحة');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans text-slate-100" dir="rtl">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

                {/* التبديل بين نوع الحساب (منشأة / كاشير VS مسوق بالعمولة) */}
                <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800 mb-6">
                    <button
                        type="button"
                        onClick={() => setLoginType('tenant')}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${loginType === 'tenant'
                            ? 'bg-blue-600 text-white shadow-lg'
                            : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        <Store size={14} /> كاشير / منشأة
                    </button>
                    <button
                        type="button"
                        onClick={() => setLoginType('affiliate')}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${loginType === 'affiliate'
                            ? 'bg-emerald-600 text-white shadow-lg'
                            : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        <Users size={14} /> شريك / مسوق
                    </button>
                </div>

                <div className="text-center mb-6">
                    <h2 className="text-xl font-bold text-white">
                        {loginType === 'tenant' ? 'دخول نظام المنشأة والكاشير' : 'دخول بوابة شركاء صَرْح'}
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                        {loginType === 'tenant'
                            ? 'ادخل بيانات حسابك للوصول لنقاط البيع السحابية'
                            : 'تابع أرباحك وعمولاتك ونشاط المشتركين لحظياً'}
                    </p>
                </div>

                {errorMessage && (
                    <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                        <AlertCircle size={16} className="shrink-0" />
                        <span>{errorMessage}</span>
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                    {/* حقل النطاق يظهر فقط لأصحاب المنشآت */}
                    {loginType === 'tenant' && (
                        <div>
                            <label className="text-xs text-slate-300 block mb-1.5 font-medium">نطاق المنشأة (Subdomain)</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    required
                                    value={subdomain}
                                    onChange={e => setSubdomain(e.target.value)}
                                    placeholder="alsarh-express"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-blue-500"
                                />
                                <span className="absolute left-3 top-2.5 text-xs text-slate-500 font-mono">.sarh.cloud</span>
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="text-xs text-slate-300 block mb-1.5 font-medium">البريد الإلكتروني</label>
                        <div className="relative">
                            <Mail className="absolute right-3.5 top-3 text-slate-500" size={16} />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder={loginType === 'tenant' ? 'cashier@alsarh.cloud' : 'affiliate@sarh.cloud'}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-10 pl-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs text-slate-300 block mb-1.5 font-medium">كلمة المرور</label>
                        <div className="relative">
                            <Lock className="absolute right-3.5 top-3 text-slate-500" size={16} />
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-10 pl-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                            />
                        </div>
                    </div>

                    <Button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-3 mt-2 text-sm font-bold flex items-center justify-center gap-2 ${loginType === 'affiliate' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-blue-600 hover:bg-blue-500'
                            }`}
                    >
                        {loading ? 'جارٍ التحقق...' : loginType === 'tenant' ? 'دخول شاشة الكاشير' : 'دخول لوحة الأرباح'}
                        <ArrowLeft size={16} />
                    </Button>
                </form>
            </div>
        </div>
    );
}