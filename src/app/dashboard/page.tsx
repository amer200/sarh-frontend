// src/app/dashboard/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import {
    UtensilsCrossed, Shirt, Truck, Settings,
    ArrowLeft, LogOut, Sparkles, AlertCircle, Play, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function CentralDashboardPage() {
    const router = useRouter();
    const [tenant, setTenant] = useState<any>(null);
    const [subs, setSubs] = useState<any>({
        pos: { status: 'inactive', isBlocked: true },
        retail: { status: 'inactive', isBlocked: true },
        fleet: { status: 'inactive', isBlocked: true }
    });
    const [isFrozen, setIsFrozen] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchPortalData = async () => {
        try {
            // التحقق من المسار الحرج بدون ابتلاع الـ 401
            const [statusRes, setRes] = await Promise.all([
                api.get('/subscriptions/status'),
                api.get('/pos/settings').catch(() => ({ data: { data: null } }))
            ]);

            if (statusRes.data?.data) {
                setSubs(statusRes.data.data);
            }
            if (setRes.data?.data) {
                setTenant(setRes.data.data);
            }
        } catch (err: any) {
            if (err.response?.status === 401) {
                localStorage.removeItem('sarh_token');
                localStorage.removeItem('sarh_user');
                router.replace('/login');
                return;
            }

            if (err.response?.status === 403 && err.response?.data?.requiresPayment) {
                setIsFrozen(true);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // فحص أمني استباقي: طرد فوري بدون انتظار الـ Network إذا كان التوكن مفقوداً
        const token = localStorage.getItem('sarh_token');
        if (!token) {
            router.replace('/login');
            return;
        }

        fetchPortalData();
    }, []);

    const handleStartTrial = async (appModule: 'pos' | 'retail') => {
        try {
            const res = await api.post('/subscriptions/start-trial', { appModule });
            alert(res.data.message);
            fetchPortalData();
        } catch (err: any) {
            alert(err.response?.data?.error || 'فشل بدء التجربة');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('sarh_token');
        localStorage.removeItem('sarh_user');
        router.replace('/login');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 text-slate-400 flex items-center justify-center text-xs gap-2">
                <RefreshCw className="animate-spin text-blue-500" size={16} />
                <span>جارٍ تحميل بوابة المنظومة...</span>
            </div>
        );
    }

    const isPosAccessible = subs.pos && !subs.pos.isBlocked && (subs.pos.status === 'active' || subs.pos.status === 'trial' || subs.pos.status === 'pending_approval');
    const isRetailAccessible = subs.retail && !subs.retail.isBlocked && (subs.retail.status === 'active' || subs.retail.status === 'trial' || subs.retail.status === 'pending_approval');

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-6 font-sans selection:bg-blue-600 selection:text-white" dir="rtl">
            <div className="max-w-6xl mx-auto space-y-8">

                {/* شريط التحذير إذا كانت المنشأة موقوفة بالكامل */}
                {isFrozen && (
                    <div className="bg-rose-500/10 border border-rose-500/30 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-lg">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                                <AlertCircle size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-sm">حساب المنشأة موقوف أو غير مسدد!</h3>
                                <p className="text-slate-400 text-[11px]">
                                    جميع نقاط البيع والمستودعات متوقفة مؤقتاً حتى تجديد الاشتراك.
                                </p>
                            </div>
                        </div>
                        <Button
                            onClick={() => router.push('/checkout')}
                            className="bg-rose-600 hover:bg-rose-500 text-white font-black text-xs py-2.5 px-5 rounded-xl shrink-0 shadow-lg"
                        >
                            تجديد الاشتراك الآن
                        </Button>
                    </div>
                )}

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-blue-600 border border-blue-500 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-blue-600/30">
                            ص
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-white flex items-center gap-2">
                                بوابة صَرْح المركزية — {tenant ? tenant.name : 'مؤسستك'}
                            </h1>
                            <p className="text-xs text-slate-400">إدارة الاشتراكات المستقلة وإطلاق الأنظمة</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link
                            href="/pos/settings"
                            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition"
                        >
                            <Settings size={15} /> إعدادات المنشأة
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 transition text-xs font-bold flex items-center gap-1.5"
                        >
                            <LogOut size={15} /> تسجيل الخروج
                        </button>
                    </div>
                </div>

                {/* كروت التطبيقات */}
                <div className="space-y-4">
                    <div>
                        <h2 className="text-base font-black text-white flex items-center gap-2">
                            <Sparkles size={18} className="text-amber-400" /> تطبيقات المنظومة واشتراكاتها المستقلة
                        </h2>
                        <p className="text-xs text-slate-400 mt-0.5">كل تطبيق يعمل باشتراك منفصل تماماً ليناسب نشاطك الفعلي</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                        {/* 1. تطبيق صَرْح POS */}
                        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between space-y-5 shadow-xl">
                            <div className="space-y-4">
                                <div className="flex justify-between items-start">
                                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shadow-lg">
                                        <UtensilsCrossed size={24} />
                                    </div>
                                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${subs.pos?.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                            subs.pos?.status === 'trial' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                                subs.pos?.status === 'pending_approval' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                                    'bg-slate-800 text-slate-400'
                                        }`}>
                                        {subs.pos?.status === 'active' ? 'مشترك نشط' :
                                            subs.pos?.status === 'trial' ? 'تجربة مجانية' :
                                                subs.pos?.status === 'pending_approval' ? 'سماح 24 ساعة' : 'غير مشترك'}
                                    </span>
                                </div>

                                <div>
                                    <h3 className="text-lg font-black text-white">صَرْح POS — المطاعم والكافيهات</h3>
                                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                                        كاشير المطاعم، إدارة الطاولات، الشيفتات ومطابقة الكاش والضرائب.
                                    </p>
                                    <p className="text-xs font-mono font-bold text-amber-400 mt-2">250 ج.م / شهرياً</p>
                                </div>
                            </div>

                            {!isPosAccessible ? (
                                <Button
                                    onClick={() => handleStartTrial('pos')}
                                    className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5"
                                >
                                    <Play size={14} /> بدء أسبوع تجربة مجاني
                                </Button>
                            ) : (
                                <Link
                                    href="/pos"
                                    className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-amber-600/10"
                                >
                                    <span>فتح كاشير المطاعم</span> <ArrowLeft size={16} />
                                </Link>
                            )}
                        </div>

                        {/* 2. تطبيق صَرْح Retail */}
                        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between space-y-5 shadow-xl">
                            <div className="space-y-4">
                                <div className="flex justify-between items-start">
                                    <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shadow-lg">
                                        <Shirt size={24} />
                                    </div>
                                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${subs.retail?.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                            subs.retail?.status === 'trial' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                                subs.retail?.status === 'pending_approval' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                                    'bg-slate-800 text-slate-400'
                                        }`}>
                                        {subs.retail?.status === 'active' ? 'مشترك نشط' :
                                            subs.retail?.status === 'trial' ? 'تجربة مجانية' :
                                                subs.retail?.status === 'pending_approval' ? 'سماح 24 ساعة' : 'غير مشترك'}
                                    </span>
                                </div>

                                <div>
                                    <h3 className="text-lg font-black text-white">صَرْح Retail — الملابس والتجزئة</h3>
                                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                                        مصفوفة المقاسات والألوان، طباعة ملصقات الباركود الحرارية، ومناقلات الفروع.
                                    </p>
                                    <p className="text-xs font-mono font-bold text-blue-400 mt-2">250 ج.م / شهرياً</p>
                                </div>
                            </div>

                            {!isRetailAccessible ? (
                                <Button
                                    onClick={() => handleStartTrial('retail')}
                                    className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-blue-400 border border-blue-500/30 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5"
                                >
                                    <Play size={14} /> بدء أسبوع تجربة مجاني
                                </Button>
                            ) : (
                                <div className="grid grid-cols-2 gap-2">
                                    <Link
                                        href="/retail/pos"
                                        className="py-3 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1 transition shadow-lg"
                                    >
                                        <span>كاشير الملابس</span> <ArrowLeft size={14} />
                                    </Link>
                                    <Link
                                        href="/retail"
                                        className="py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl flex items-center justify-center transition border border-slate-700"
                                    >
                                        لوحة التجزئة
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* 3. تطبيق صَرْح Fleet */}
                        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between space-y-5 shadow-xl opacity-75">
                            <div className="space-y-4">
                                <div className="flex justify-between items-start">
                                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-lg">
                                        <Truck size={24} />
                                    </div>
                                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-lg font-mono font-bold">
                                        قيد الإطلاق (Beta)
                                    </span>
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-white">صَرْح Fleet — التوصيل واللوجستيات</h3>
                                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                                        إدارة أسطول التوصيل الذكي، توزيع الطلبات على الطيارين والتتبع الحي.
                                    </p>
                                    <p className="text-xs font-mono font-bold text-emerald-400 mt-2">350 ج.م / شهرياً</p>
                                </div>
                            </div>

                            <button
                                disabled
                                className="w-full py-3 bg-slate-800 text-slate-500 font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-not-allowed border border-slate-800"
                            >
                                <span>جاري إطلاق النظام قريباً</span>
                            </button>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
}