'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import {
    Building2, Mail, Lock, Phone, Globe,
    ArrowLeft, CheckCircle2, AlertCircle, Sparkles,
    Tag, Shirt, UtensilsCrossed, Gift, Users2
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

function RegisterForm() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        storeName: '',
        subdomain: '',
        activityType: 'pos' as 'pos' | 'retail',
        referralCode: ''
    });

    const [referralLocked, setReferralLocked] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    // التقاط كود المسوق تلقائياً من رابط الإحالة (مثل: /register?ref=AMER2026 أو ?marketer=CODE)
    useEffect(() => {
        const refCode = searchParams.get('ref') || searchParams.get('marketer') || searchParams.get('code');
        if (refCode) {
            setFormData(prev => ({ ...prev, referralCode: refCode.trim().toUpperCase() }));
            setReferralLocked(true);
        }
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');

        try {
            const payload = {
                name: formData.name,
                email: formData.email,
                password: formData.password,
                phone: formData.phone,
                tenantName: formData.storeName,
                subdomain: formData.subdomain.toLowerCase().trim().replace(/[^a-z0-9-]/g, ''),
                activityType: formData.activityType,
                referralCode: formData.referralCode ? formData.referralCode.trim().toUpperCase() : undefined
            };

            const res = await api.post('/auth/register', payload);

            if (res.data && res.data.token) {
                localStorage.setItem('sarh_token', res.data.token);
                if (res.data.data?.tenant?.subdomain) {
                    localStorage.setItem('sarh_tenant_subdomain', res.data.data.tenant.subdomain);
                }
                if (res.data.data?.user) {
                    localStorage.setItem('sarh_user', JSON.stringify(res.data.data.user));
                }
                router.push('/dashboard');
            } else {
                router.push('/login');
            }
        } catch (err: any) {
            setErrorMsg((err.response && err.response.data && err.response.data.error) || 'فشل في إنشاء الحساب، يرجى مراجعة البيانات');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-xl w-full space-y-6">

            {/* Brand Header */}
            <div className="text-center space-y-2">
                <Link href="/" className="inline-flex items-center gap-2.5">
                    <div className="w-11 h-11 rounded-2xl bg-blue-600 border border-blue-500 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-blue-600/30">
                        ص
                    </div>
                    <span className="text-xl font-black tracking-wide text-white">صَرْح</span>
                </Link>
                <h1 className="text-lg font-black text-white">ابدأ تجربة مجانية لمدة 7 أيام</h1>
                <p className="text-xs text-slate-400">أنشئ حساب منشأتك وفعّل نظامك المفضل فوراً وبدون بطاقة ائتمان</p>
            </div>

            {/* Form Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 text-xs">

                {/* شارة كود المسوق / الخصم إن وجد */}
                {formData.referralCode && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Gift size={16} />
                            <span>تم تفعيل رابط دعوة المسوق: <b className="font-mono">{formData.referralCode}</b></span>
                        </div>
                        <span className="text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded-md font-bold">شريك معتمد</span>
                    </div>
                )}

                {errorMsg && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl flex items-center gap-2">
                        <AlertCircle size={16} className="shrink-0" />
                        <span>{errorMsg}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">

                    {/* 1. اختيار النظام الأساسي لبدء التجربة المجانية */}
                    <div>
                        <label className="text-slate-300 block mb-1.5 font-bold">1. اختر النظام المراد بدء تجربة الـ 7 أيام له:</label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, activityType: 'pos' })}
                                className={`p-3.5 rounded-2xl border text-right transition flex items-center gap-2.5 ${formData.activityType === 'pos'
                                        ? 'bg-amber-500/10 border-amber-500 text-white font-bold shadow-lg'
                                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                                    }`}
                            >
                                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                                    <UtensilsCrossed size={16} />
                                </div>
                                <div>
                                    <span className="block text-xs text-white">صَرْح POS للمطاعم</span>
                                    <span className="text-[10px] text-slate-400">كاشير، طاولات، وشيفتات</span>
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, activityType: 'retail' })}
                                className={`p-3.5 rounded-2xl border text-right transition flex items-center gap-2.5 ${formData.activityType === 'retail'
                                        ? 'bg-blue-600/10 border-blue-500 text-white font-bold shadow-lg'
                                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                                    }`}
                            >
                                <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                                    <Shirt size={16} />
                                </div>
                                <div>
                                    <span className="block text-xs text-white">صَرْح Retail للملابس</span>
                                    <span className="text-[10px] text-slate-400">مقاسات، باركود، وفروع</span>
                                </div>
                            </button>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1.5">
                            * ستتمكن من تجربة أو تفعيل الأنظمة الأخرى وقتما تشاء بشكل مستقل من داخل حسابك.
                        </p>
                    </div>

                    {/* 2. بيانات المتجر والنطاق */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div>
                            <label className="text-slate-400 block mb-1 font-semibold flex items-center gap-1.5">
                                <Building2 size={14} className="text-blue-400" /> اسم المتجر / البراند:
                            </label>
                            <input
                                type="text"
                                required
                                placeholder="مثال: كافيه العمدة أو زارا ستور"
                                value={formData.storeName}
                                onChange={e => setFormData({ ...formData, storeName: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-blue-500 transition"
                            />
                        </div>

                        <div>
                            <label className="text-slate-400 block mb-1 font-semibold flex items-center gap-1.5">
                                <Globe size={14} className="text-amber-400" /> رابط النطاق (Subdomain):
                            </label>
                            <div className="relative flex items-center">
                                <input
                                    type="text"
                                    required
                                    placeholder="mybrand"
                                    value={formData.subdomain}
                                    onChange={e => setFormData({ ...formData, subdomain: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-3.5 pl-24 py-2.5 text-white font-mono text-left focus:outline-none focus:border-blue-500 transition dir-ltr"
                                />
                                <span className="absolute left-3 text-[11px] text-slate-500 font-mono select-none">.sarh.cloud</span>
                            </div>
                        </div>
                    </div>

                    {/* 3. بيانات المسؤول والاتصال */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="text-slate-400 block mb-1 font-semibold">اسم صاحب الحساب / المسؤول:</label>
                            <input
                                type="text"
                                required
                                placeholder="الاسم ثلاثي"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-blue-500 transition"
                            />
                        </div>

                        <div>
                            <label className="text-slate-400 block mb-1 font-semibold flex items-center gap-1.5">
                                <Phone size={14} className="text-emerald-400" /> رقم الهاتف:
                            </label>
                            <input
                                type="tel"
                                required
                                placeholder="010xxxxxxxx"
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-blue-500 transition"
                            />
                        </div>
                    </div>

                    {/* 4. الحساب وكلمة المرور */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="text-slate-400 block mb-1 font-semibold flex items-center gap-1.5">
                                <Mail size={14} className="text-sky-400" /> البريد الإلكتروني:
                            </label>
                            <input
                                type="email"
                                required
                                placeholder="name@company.com"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-blue-500 transition"
                            />
                        </div>

                        <div>
                            <label className="text-slate-400 block mb-1 font-semibold flex items-center gap-1.5">
                                <Lock size={14} className="text-rose-400" /> كلمة المرور:
                            </label>
                            <input
                                type="password"
                                required
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-blue-500 transition"
                            />
                        </div>
                    </div>

                    {/* 5. كود المسوق / الشريك التسويقي */}
                    <div>
                        <label className="text-slate-400 block mb-1 font-semibold flex items-center gap-1.5">
                            <Users2 size={14} className="text-purple-400" /> كود المسوق أو الشريك المعتمد (اختياري):
                        </label>
                        <input
                            type="text"
                            readOnly={referralLocked}
                            placeholder="مثال: MARKETER10"
                            value={formData.referralCode}
                            onChange={e => setFormData({ ...formData, referralCode: e.target.value.toUpperCase() })}
                            className={`w-full bg-slate-950 border rounded-xl px-3.5 py-2 text-white font-mono uppercase focus:outline-none transition ${referralLocked
                                    ? 'border-emerald-500/50 bg-emerald-950/20 text-emerald-300 cursor-not-allowed'
                                    : 'border-slate-800 focus:border-purple-500'
                                }`}
                        />
                    </div>

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-xl shadow-xl transition active:scale-98 mt-2"
                    >
                        {loading ? 'جارٍ إنشاء المنشأة وتفعيل التجربة...' : 'إنشاء الحساب وبدء التجربة المجانية 🚀'}
                    </Button>
                </form>

                <div className="text-center pt-3 border-t border-slate-800 text-slate-400">
                    لديك حساب مسجل بالفعل؟{' '}
                    <Link href="/login" className="text-blue-400 font-bold hover:underline">
                        تسجيل الدخول
                    </Link>
                </div>
            </div>

        </div>
    );
}

export default function RegisterPage() {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 font-sans selection:bg-blue-600 selection:text-white" dir="rtl">
            <Suspense fallback={<div className="text-xs text-slate-500">جارٍ تحميل نموذج التسجيل...</div>}>
                <RegisterForm />
            </Suspense>
        </div>
    );
}