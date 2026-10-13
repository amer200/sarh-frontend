// src/app/dashboard/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import {
    UtensilsCrossed, Shirt, Truck, Settings,
    LogOut, CreditCard, CheckCircle2,
    Copy, Check, X, Zap, DollarSign, Receipt,
    Clock, AlertTriangle, MessageCircle, ArrowUpRight,
    Package, Layers, ChevronRight, Gamepad2, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

const APP_DETAILS = {
    pos: {
        key: 'pos',
        name: 'صَرْح POS للمطاعم والكافيهات',
        icon: UtensilsCrossed,
        color: 'text-amber-400',
        borderColor: 'border-amber-500/30',
        bgAccent: 'bg-amber-500/10',
        monthlyPrice: 250,
        yearlyPrice: 2500,
        route: '/pos',
        benefits: [
            'استمرار عمل شاشة الكاشير السريع وطباعة الإيصالات',
            'إصدار فواتير ضريبية مبسطة بـ QR Code متوافق مع الفوترة',
            'تقفيل وجرد الشيفتات اليومية ومطابقة العهدة (Z-Report)',
            'إدارة المصروفات النثرية والمرتجعات وإشعارات الدائن'
        ]
    },
    lounge: {
        key: 'lounge',
        name: 'صَرْح Lounge للألعاب والبلايستيشن',
        icon: Gamepad2,
        color: 'text-violet-400',
        borderColor: 'border-violet-500/30',
        bgAccent: 'bg-violet-600/10',
        monthlyPrice: 250,
        yearlyPrice: 2500,
        route: '/lounge',
        benefits: [
            'إدارة طاولات وغرف البلايستيشن ومحاكيات القيادة',
            'حساب دقيق لشرائح الوقت الفردي والـ Multi',
            'صافرة وتنبيهات بصرية لحظية عند انتهاء وقت اللعب',
            'إدارة طلبات الكافيتريا والمشاريب والغرامات في فاتورة موحدة'
        ]
    },
    retail: {
        key: 'retail',
        name: 'صَرْح Retail للملابس والتجزئة',
        icon: Shirt,
        color: 'text-blue-400',
        borderColor: 'border-blue-500/30',
        bgAccent: 'bg-blue-600/10',
        monthlyPrice: 250,
        yearlyPrice: 2500,
        route: '/retail/pos',
        benefits: [
            'توليد مصفوفة المقاسات والألوان وطباعة الباركود الليزري',
            'إدارة ومزامنة أرصدة الفروع والمستودعات في متجر موحد',
            'كاشير بيع ملابس سريع بسكانر الباركود المباشر',
            'إصدار وتتبع أذونات مناقلات البضائع بين الفروع'
        ]
    },
    fleet: {
        key: 'fleet',
        name: 'صَرْح Fleet للتوصيل والأسطول',
        icon: Truck,
        color: 'text-emerald-400',
        borderColor: 'border-emerald-500/30',
        bgAccent: 'bg-emerald-500/10',
        monthlyPrice: 350,
        yearlyPrice: 3500,
        route: '#',
        benefits: [
            'إدارة وتوزيع طلبات الدليفري على المناديب بذكاء',
            'تتبع مسار الشحنات لحظياً عبر الخريطة',
            'تسوية العهد النقدية والتحصيل عند الاستلام (COD)'
        ]
    }
};

export default function CentralDashboardPage() {
    const router = useRouter();
    const [overviewData, setOverviewData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const [payModal, setPayModal] = useState<{
        open: boolean;
        moduleKey: 'pos' | 'retail' | 'fleet' | 'lounge';
        plan: 'monthly' | 'yearly';
    }>({
        open: false,
        moduleKey: 'pos',
        plan: 'monthly'
    });

    const [formData, setFormData] = useState({
        senderPhoneOrName: '',
        paymentMethod: 'instapay' as 'instapay' | 'vodafone_cash' | 'bank_transfer',
        screenshotUrl: '',
        notes: ''
    });
    const [submittingProof, setSubmittingProof] = useState(false);
    const [proofSuccessMsg, setProofSuccessMsg] = useState('');
    const [proofErrorMsg, setProofErrorMsg] = useState('');
    const [copiedKey, setCopiedKey] = useState<string | null>(null);

    const fetchDashboard = async () => {
        try {
            const res = await api.get('/tenants/dashboard-overview');
            setOverviewData(res.data.data);
        } catch (err: any) {
            if (err.response?.status === 401) {
                localStorage.removeItem('sarh_token');
                router.replace('/login');
            }
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const queryToken = params.get('auth_token');
            if (queryToken) {
                localStorage.setItem('sarh_token', queryToken);
                window.history.replaceState({}, '', '/dashboard');
            }
        }

        const token = localStorage.getItem('sarh_token');
        if (!token) {
            router.replace('/login');
            return;
        }
        fetchDashboard();
    }, []);

    const handleCopy = (text: string, key: string) => {
        navigator.clipboard.writeText(text);
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 2000);
    };

    const handleStartTrial = async (appModule: 'pos' | 'retail' | 'lounge') => {
        try {
            const res = await api.post('/subscriptions/start-trial', { appModule });
            alert(res.data.message);
            fetchDashboard();
        } catch (err: any) {
            alert(err.response?.data?.error || 'فشل بدء التجربة');
        }
    };

    const handleSubmitPaymentProof = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmittingProof(true);
        setProofErrorMsg('');
        setProofSuccessMsg('');

        const selectedApp = APP_DETAILS[payModal.moduleKey];
        const finalPrice = payModal.plan === 'yearly' ? selectedApp.yearlyPrice : selectedApp.monthlyPrice;

        try {
            const res = await api.post('/subscriptions/proof', {
                appModule: payModal.moduleKey,
                amount: finalPrice,
                paymentMethod: formData.paymentMethod,
                senderPhoneOrName: formData.senderPhoneOrName,
                screenshotUrl: formData.screenshotUrl || 'https://placehold.co/600x400?text=Payment+Receipt',
                notes: `سداد اشتراك ${payModal.plan === 'yearly' ? 'سنوي' : 'شهري'} لنظام ${selectedApp.name}`
            });

            setProofSuccessMsg(res.data?.message || 'تم إرسال الإشعار بنجاح وتفعيل مهلة الـ 24 ساعة!');
            setFormData({ senderPhoneOrName: '', paymentMethod: 'instapay', screenshotUrl: '', notes: '' });

            setTimeout(() => {
                setPayModal({ open: false, moduleKey: 'pos', plan: 'monthly' });
                setProofSuccessMsg('');
                fetchDashboard();
            }, 1800);
        } catch (err: any) {
            setProofErrorMsg(err.response?.data?.error || 'فشل إرسال إشعار السداد');
        } finally {
            setSubmittingProof(false);
        }
    };

    const openWhatsAppEmergency = () => {
        const subdomain = overviewData?.tenant?.subdomain || 'my-store';
        const phone = overviewData?.tenant?.phone || '';
        const text = `السلام عليكم فريق دعم صَرْح 👋\nمعكم إدارة منشأة (${overviewData?.tenant?.name || 'متجرنا'})\nالنطاق: ${subdomain}.sarh.cloud\nرقم التواصل: ${phone}\nنحتاج دعماً فنياً عاجلاً بخصوص المنظومة.`;
        window.open(`https://wa.me/201000000000?text=${encodeURIComponent(text)}`, '_blank');
    };

    const handleLogout = () => {
        localStorage.removeItem('sarh_token');
        localStorage.removeItem('sarh_user');
        router.replace('/login');
    };

    const { tenant, metrics, quotas, subscriptions } = overviewData || {};
    const posSub = subscriptions?.pos;
    const isPosAccessible = Boolean(posSub && !posSub.isBlocked && posSub.status !== 'inactive' && posSub.status !== 'expired');

    const retailSub = subscriptions?.retail;
    const isRetailAccessible = Boolean(retailSub && !retailSub.isBlocked && retailSub.status !== 'inactive' && retailSub.status !== 'expired');

    const loungeSub = subscriptions?.lounge;
    const isLoungeAccessible = Boolean(loungeSub && !loungeSub.isBlocked && loungeSub.status !== 'inactive' && loungeSub.status !== 'expired');

    const handleShortcutClick = (targetPath: string, moduleKey: 'pos' | 'retail' | 'lounge') => {
        const isAccessible = moduleKey === 'pos' ? isPosAccessible : moduleKey === 'retail' ? isRetailAccessible : isLoungeAccessible;
        if (!isAccessible) {
            setPayModal({ open: true, moduleKey, plan: 'monthly' });
        } else {
            router.push(targetPath);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 text-slate-400 flex items-center justify-center text-xs gap-2">
                <RefreshCw className="animate-spin text-blue-500" size={18} />
                <span>جارٍ تحميل برج المراقبة للمنشأة...</span>
            </div>
        );
    }

    const currency = tenant?.currency || 'ج.م';
    const activeShift = metrics?.activeShift;
    const currentAppConfig = APP_DETAILS[payModal.moduleKey];
    const calculatedPrice = payModal.plan === 'yearly' ? currentAppConfig.yearlyPrice : currentAppConfig.monthlyPrice;

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 font-sans selection:bg-blue-600 selection:text-white" dir="rtl">
            <div className="max-w-7xl mx-auto space-y-7">

                {/* 1. Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                    <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-blue-600 border border-blue-500 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-blue-600/30">
                            ص
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-black text-white">{tenant?.name || 'المنشأة التجارية'}</h1>
                                <span className="bg-slate-900 border border-slate-800 text-blue-400 font-mono text-[11px] px-2 py-0.5 rounded-lg">
                                    {tenant?.subdomain}.sarh.cloud
                                </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">لوحة المراقبة التشغيلية، إجمالي المبيعات، ومتابعة التراخيص</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => { setIsRefreshing(true); fetchDashboard(); }}
                            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
                            title="تحديث البيانات"
                        >
                            <RefreshCw size={15} className={isRefreshing ? 'animate-spin text-blue-400' : ''} />
                        </button>

                        <button
                            onClick={openWhatsAppEmergency}
                            className="px-3 py-2 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                            title="طوارئ الدعم الفني"
                        >
                            <MessageCircle size={15} /> الدعم الفني المباشر
                        </button>

                        <Button
                            onClick={() => setPayModal({ open: true, moduleKey: 'pos', plan: 'monthly' })}
                            className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-2 px-3.5 rounded-xl flex items-center gap-1.5 shadow-lg shadow-blue-600/20"
                        >
                            <CreditCard size={14} /> سداد / تجديد باقة
                        </Button>

                        <Link
                            href="/pos/settings"
                            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition"
                            title="إعدادات المنشأة"
                        >
                            <Settings size={16} />
                        </Link>

                        <button
                            onClick={handleLogout}
                            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 transition"
                            title="تسجيل الخروج"
                        >
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>

                {/* 2. Live Business Pulse */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-2 shadow-lg">
                        <div className="flex justify-between items-center text-slate-400 text-xs">
                            <span className="font-semibold">مبيعات اليوم الإجمالية</span>
                            <DollarSign size={16} className="text-emerald-400" />
                        </div>
                        <div className="text-2xl font-black text-emerald-400 font-mono">
                            {(metrics?.totalRevenueToday || 0).toLocaleString()} {currency}
                        </div>
                        <p className="text-[11px] text-slate-500">مجموع إيرادات نقاط البيع، التجزئة، والصالات اليوم</p>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-2 shadow-lg">
                        <div className="flex justify-between items-center text-slate-400 text-xs">
                            <span className="font-semibold">فواتير وجلسات اليوم الصادرة</span>
                            <Receipt size={16} className="text-blue-400" />
                        </div>
                        <div className="text-2xl font-black text-white font-mono">
                            {metrics?.totalOrdersToday || 0}
                        </div>
                        <p className="text-[11px] text-slate-500">عملية بيع وجلسة مكتملة منذ بداية اليوم</p>
                    </div>

                    <div className={`border p-5 rounded-3xl space-y-2 shadow-lg ${!activeShift
                        ? 'bg-slate-900/60 border-slate-800'
                        : activeShift.isOverdue
                            ? 'bg-rose-500/10 border-rose-500/30'
                            : 'bg-slate-900 border-slate-800'
                        }`}>
                        <div className="flex justify-between items-center text-xs">
                            <span className="font-semibold text-slate-300">الوردية الحالية (POS)</span>
                            <Clock size={16} className={activeShift ? (activeShift.isOverdue ? 'text-rose-400' : 'text-amber-400') : 'text-slate-600'} />
                        </div>
                        {activeShift ? (
                            <div>
                                <div className="flex items-baseline justify-between">
                                    <span className="text-base font-black text-white">{activeShift.cashierName}</span>
                                    <span className="font-mono text-xs font-bold text-amber-400">{activeShift.shiftNumber}</span>
                                </div>
                                <div className="text-[11px] text-slate-400 mt-1 flex justify-between">
                                    <span>مفتوح منذ: <b className="font-mono text-white">{activeShift.hoursOpen} ساعة</b></span>
                                    {activeShift.isOverdue && <span className="text-rose-400 font-bold">تجاوز 12 ساعة!</span>}
                                </div>
                            </div>
                        ) : (
                            <div>
                                <p className="text-sm font-bold text-slate-400 mt-1">لا توجد وردية مفتوحة</p>
                                <p className="text-[10px] text-slate-500">يتم الفتح تلقائياً عند بدء الكاشير</p>
                            </div>
                        )}
                    </div>

                    <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-2 shadow-lg">
                        <div className="flex justify-between items-center text-slate-400 text-xs">
                            <span className="font-semibold">نواقص المخزن الحرجة</span>
                            <AlertTriangle size={16} className={metrics?.lowStockCount > 0 ? 'text-amber-400' : 'text-slate-600'} />
                        </div>
                        <div className="flex items-baseline justify-between">
                            <span className={`text-2xl font-black font-mono ${metrics?.lowStockCount > 0 ? 'text-amber-400' : 'text-white'}`}>
                                {metrics?.lowStockCount || 0}
                            </span>
                            <Link href="/pos/inventory" className="text-[11px] text-blue-400 hover:underline flex items-center gap-0.5 font-bold">
                                جرد النواقص <ChevronRight size={13} className="rotate-180" />
                            </Link>
                        </div>
                        <p className="text-[11px] text-slate-500">أصناف بلغت أو تجاوزت حد إعادة الطلب</p>
                    </div>
                </div>

                {/* 3. الحصص والاختصارات السريعة */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-5 bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-3.5 shadow-lg text-xs">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
                            <span className="font-black text-white flex items-center gap-1.5">
                                <Layers size={15} className="text-indigo-400" /> الحصص المصرح بها للمنشأة
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono">Quotas</span>
                        </div>

                        <div className="space-y-2.5">
                            <div>
                                <div className="flex justify-between text-slate-300 font-semibold mb-1">
                                    <span>الفروع المفعلة:</span>
                                    <span className="font-mono text-white">{quotas?.currentBranches} من أصل {quotas?.maxBranches} فرع</span>
                                </div>
                                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                                    <div
                                        className="bg-indigo-500 h-full rounded-full transition-all"
                                        style={{ width: `${Math.min(100, ((quotas?.currentBranches || 1) / (quotas?.maxBranches || 1)) * 100)}%` }}
                                    />
                                </div>
                            </div>

                            <div className="pt-1 flex items-center justify-between text-slate-400 text-[11px]">
                                <span>الحد الأقصى للكاشيرات المتزامنة:</span>
                                <span className="font-mono font-bold text-white">{quotas?.maxCashiers || 1} كاشير</span>
                            </div>
                        </div>

                        <button
                            onClick={() => setPayModal({ open: true, moduleKey: 'pos', plan: 'yearly' })}
                            className="w-full py-2 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-indigo-300 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1"
                        >
                            طلب زيادة عدد الفروع والكاشيرات <ArrowUpRight size={13} />
                        </button>
                    </div>

                    <div className="md:col-span-7 bg-slate-900 border border-slate-800 p-5 rounded-3xl flex flex-col justify-between space-y-3 shadow-lg text-xs">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
                            <span className="font-black text-white flex items-center gap-1.5">
                                <Zap size={15} className="text-amber-400" /> اختصارات التشغيل السريع
                            </span>
                            <span className="text-[11px] text-slate-400">انتقال فوري للأنظمة المستقلة</span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            <button
                                type="button"
                                onClick={() => handleShortcutClick('/pos', 'pos')}
                                className={`p-3 rounded-2xl flex flex-col items-center justify-center text-center gap-1.5 transition group relative border ${isPosAccessible
                                    ? 'bg-slate-950 hover:bg-amber-500/10 border-slate-800 hover:border-amber-500/30 cursor-pointer'
                                    : 'bg-slate-950/40 border-rose-500/20 opacity-80 hover:border-rose-500/40 cursor-pointer'
                                    }`}
                            >
                                {!isPosAccessible && (
                                    <span className="absolute top-1.5 left-1.5 bg-rose-500/20 text-rose-400 text-[9px] font-bold px-1.5 py-0.5 rounded-md border border-rose-500/30">
                                        تجديد 🔒
                                    </span>
                                )}
                                <UtensilsCrossed size={18} className={`${isPosAccessible ? 'text-amber-400 group-hover:scale-110' : 'text-slate-500'} transition`} />
                                <span className={`font-bold ${isPosAccessible ? 'text-slate-200' : 'text-slate-400'}`}>كاشير المطاعم</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleShortcutClick('/lounge', 'lounge')}
                                className={`p-3 rounded-2xl flex flex-col items-center justify-center text-center gap-1.5 transition group relative border ${isLoungeAccessible
                                    ? 'bg-slate-950 hover:bg-violet-500/10 border-slate-800 hover:border-violet-500/30 cursor-pointer'
                                    : 'bg-slate-950/40 border-rose-500/20 opacity-80 hover:border-rose-500/40 cursor-pointer'
                                    }`}
                            >
                                {!isLoungeAccessible && (
                                    <span className="absolute top-1.5 left-1.5 bg-rose-500/20 text-rose-400 text-[9px] font-bold px-1.5 py-0.5 rounded-md border border-rose-500/30">
                                        تجديد 🔒
                                    </span>
                                )}
                                <Gamepad2 size={18} className={`${isLoungeAccessible ? 'text-violet-400 group-hover:scale-110' : 'text-slate-500'} transition`} />
                                <span className={`font-bold ${isLoungeAccessible ? 'text-slate-200' : 'text-slate-400'}`}>صالة الألعاب</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleShortcutClick('/retail/pos', 'retail')}
                                className={`p-3 rounded-2xl flex flex-col items-center justify-center text-center gap-1.5 transition group relative border ${isRetailAccessible
                                    ? 'bg-slate-950 hover:bg-blue-500/10 border-slate-800 hover:border-blue-500/30 cursor-pointer'
                                    : 'bg-slate-950/40 border-rose-500/20 opacity-80 hover:border-rose-500/40 cursor-pointer'
                                    }`}
                            >
                                {!isRetailAccessible && (
                                    <span className="absolute top-1.5 left-1.5 bg-rose-500/20 text-rose-400 text-[9px] font-bold px-1.5 py-0.5 rounded-md border border-rose-500/30">
                                        تجديد 🔒
                                    </span>
                                )}
                                <Shirt size={18} className={`${isRetailAccessible ? 'text-blue-400 group-hover:scale-110' : 'text-slate-500'} transition`} />
                                <span className={`font-bold ${isRetailAccessible ? 'text-slate-200' : 'text-slate-400'}`}>كاشير الملابس</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleShortcutClick('/pos/inventory', 'pos')}
                                className={`p-3 rounded-2xl flex flex-col items-center justify-center text-center gap-1.5 transition group relative border ${isPosAccessible
                                    ? 'bg-slate-950 hover:bg-sky-500/10 border-slate-800 hover:border-sky-500/30 cursor-pointer'
                                    : 'bg-slate-950/40 border-rose-500/20 opacity-80 hover:border-rose-500/40 cursor-pointer'
                                    }`}
                            >
                                {!isPosAccessible && (
                                    <span className="absolute top-1.5 left-1.5 bg-rose-500/20 text-rose-400 text-[9px] font-bold px-1.5 py-0.5 rounded-md border border-rose-500/30">
                                        تجديد 🔒
                                    </span>
                                )}
                                <Package size={18} className={`${isPosAccessible ? 'text-sky-400 group-hover:scale-110' : 'text-slate-500'} transition`} />
                                <span className={`font-bold ${isPosAccessible ? 'text-slate-200' : 'text-slate-400'}`}>إدارة المخزن</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleShortcutClick('/pos/reports', 'pos')}
                                className={`p-3 rounded-2xl flex flex-col items-center justify-center text-center gap-1.5 transition group relative border ${isPosAccessible
                                    ? 'bg-slate-950 hover:bg-emerald-500/10 border-slate-800 hover:border-emerald-500/30 cursor-pointer'
                                    : 'bg-slate-950/40 border-rose-500/20 opacity-80 hover:border-rose-500/40 cursor-pointer'
                                    }`}
                            >
                                {!isPosAccessible && (
                                    <span className="absolute top-1.5 left-1.5 bg-rose-500/20 text-rose-400 text-[9px] font-bold px-1.5 py-0.5 rounded-md border border-rose-500/30">
                                        تجديد 🔒
                                    </span>
                                )}
                                <Receipt size={18} className={`${isPosAccessible ? 'text-emerald-400 group-hover:scale-110' : 'text-slate-500'} transition`} />
                                <span className={`font-bold ${isPosAccessible ? 'text-slate-200' : 'text-slate-400'}`}>التقارير</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* 4. بطاقات الأنظمة المستقلة وتفاصيل الاشتراك */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-base font-black text-white">حالة اشتراكات الأنظمة السحابية المستقلة</h2>
                            <p className="text-xs text-slate-400">كل نظام مستقل بذاته، يمكنك تجديد أو تشغيل ما تحتاجه منشأتك فقط</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {(['pos', 'lounge', 'retail', 'fleet'] as const).map(appKey => {
                            const appInfo = APP_DETAILS[appKey];
                            const sub = subscriptions?.[appKey] || { status: 'inactive' };
                            const status = sub.status || 'inactive';
                            const isActive = status === 'active';
                            const isTrial = status === 'trial';
                            const isPending = status === 'pending_approval';

                            return (
                                <div key={appKey} className={`bg-slate-900 border ${appInfo.borderColor} p-5 rounded-3xl flex flex-col justify-between space-y-4 shadow-xl`}>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-start">
                                            <div className={`w-10 h-10 rounded-2xl ${appInfo.bgAccent} ${appInfo.color} flex items-center justify-center font-bold`}>
                                                <appInfo.icon size={20} />
                                            </div>
                                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${isActive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                isTrial ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                                    isPending ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                        'bg-slate-800 text-slate-400 border-slate-700'
                                                }`}>
                                                {isActive ? 'اشتراك نشط' : isTrial ? `تجربة (باقي ${sub.daysLeft} يوم)` : isPending ? 'قيد المراجعة' : 'غير مشترك'}
                                            </span>
                                        </div>

                                        <div>
                                            <h3 className="font-bold text-white text-sm">{appInfo.name}</h3>
                                            <p className="text-[11px] text-slate-400 mt-1 font-mono">
                                                {appInfo.monthlyPrice} {currency} / شهرياً
                                            </p>
                                        </div>

                                        <ul className="space-y-1.5 text-[10px] text-slate-400 pt-2 border-t border-slate-800/80">
                                            {appInfo.benefits.slice(0, 3).map((benefit, idx) => (
                                                <li key={idx} className="flex items-center gap-1.5">
                                                    <span className="w-1 h-1 rounded-full bg-slate-500" />
                                                    <span>{benefit}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="pt-2">
                                        {status === 'inactive' ? (
                                            <Button
                                                onClick={() => handleStartTrial(appKey as any)}
                                                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl"
                                            >
                                                بدء تجربة مجانية 7 أيام
                                            </Button>
                                        ) : (
                                            <Button
                                                onClick={() => setPayModal({ open: true, moduleKey: appKey, plan: 'monthly' })}
                                                className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl"
                                            >
                                                {isActive ? 'تجديد الاشتراك' : 'تفعيل الاشتراك الآن'}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 5. نافذة السداد وتأكيد الدفع */}
                {payModal.open && (
                    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full text-xs space-y-4 shadow-2xl">
                            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                                <h3 className="text-sm font-black text-white flex items-center gap-2">
                                    <CreditCard size={16} className="text-blue-400" /> سداد اشتراك {currentAppConfig.name}
                                </h3>
                                <button onClick={() => setPayModal({ ...payModal, open: false })} className="text-slate-400 hover:text-white">
                                    <X size={16} />
                                </button>
                            </div>

                            {/* اختيار الخطة */}
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setPayModal({ ...payModal, plan: 'monthly' })}
                                    className={`p-3 rounded-2xl border text-center transition ${payModal.plan === 'monthly'
                                        ? 'bg-blue-600/10 border-blue-500 text-white'
                                        : 'bg-slate-950 border-slate-800 text-slate-400'
                                        }`}
                                >
                                    <span className="block font-bold">باقة شهرية</span>
                                    <span className="font-mono text-emerald-400 font-bold">{currentAppConfig.monthlyPrice} {currency}</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setPayModal({ ...payModal, plan: 'yearly' })}
                                    className={`p-3 rounded-2xl border text-center transition ${payModal.plan === 'yearly'
                                        ? 'bg-blue-600/10 border-blue-500 text-white'
                                        : 'bg-slate-950 border-slate-800 text-slate-400'
                                        }`}
                                >
                                    <span className="block font-bold">باقة سنوية (خصم شهرين)</span>
                                    <span className="font-mono text-emerald-400 font-bold">{currentAppConfig.yearlyPrice} {currency}</span>
                                </button>
                            </div>

                            {/* بيانات التحويل */}
                            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 font-mono">
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-400 font-sans">عنوان التحويل عبر InstaPay:</span>
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-blue-400 font-bold">sarh.pay@instapay</span>
                                        <button
                                            type="button"
                                            onClick={() => handleCopy('sarh.pay@instapay', 'instapay')}
                                            className="p-1 hover:text-white text-slate-500"
                                        >
                                            {copiedKey === 'instapay' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                                        </button>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-400 font-sans">المبلغ المطلوب:</span>
                                    <span className="text-emerald-400 font-bold text-sm">{calculatedPrice} {currency}</span>
                                </div>
                            </div>

                            {proofSuccessMsg && (
                                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl flex items-center gap-2">
                                    <CheckCircle2 size={16} /> <span>{proofSuccessMsg}</span>
                                </div>
                            )}

                            {proofErrorMsg && (
                                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl flex items-center gap-2">
                                    <AlertTriangle size={16} /> <span>{proofErrorMsg}</span>
                                </div>
                            )}

                            <form onSubmit={handleSubmitPaymentProof} className="space-y-3">
                                <div>
                                    <label className="text-slate-300 block mb-1">اسم صاحب الحساب أو رقم الهاتف المحول منه:</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="مثال: 01012345678 أو أحمد محمد"
                                        value={formData.senderPhoneOrName}
                                        onChange={e => setFormData({ ...formData, senderPhoneOrName: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="text-slate-300 block mb-1">رابط صورة الإشعار (اختياري):</label>
                                    <input
                                        type="url"
                                        placeholder="https://imgur.com/... أو اتركه فارغاً"
                                        value={formData.screenshotUrl}
                                        onChange={e => setFormData({ ...formData, screenshotUrl: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-blue-500"
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    disabled={submittingProof}
                                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl"
                                >
                                    {submittingProof ? 'جارٍ إرسال الإشعار...' : 'تأكيد إرسال الإشعار وتفعيل مهلة 24 ساعة فوراً'}
                                </Button>
                            </form>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}