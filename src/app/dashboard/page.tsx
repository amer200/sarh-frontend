// src/app/dashboard/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import {
    UtensilsCrossed, Shirt, Truck, Settings,
    ArrowLeft, LogOut, Sparkles, AlertCircle, Play,
    RefreshCw, CreditCard, CheckCircle2, ShieldCheck,
    Copy, Check, X, Zap, DollarSign, Receipt,
    Clock, AlertTriangle, MessageCircle, ArrowUpRight,
    Package, Layers, Store, ChevronRight, Gamepad2
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

// تفاصيل كل تطبيق وسبب وأهمية الاشتراك فيه
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
            'إدارة وتوزيع طلبات الدليفري على الطيارين بذكاء',
            'تتبع مسار الشحنات والمناديب لحظياً عبر الخريطة',
            'تسوية العهد النقدية والتحصيل عند الاستلام (COD)'
        ]
    }
};

export default function CentralDashboardPage() {
    const router = useRouter();
    const [overviewData, setOverviewData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // نافذة الاشتراك والسداد
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

    const handleStartTrial = async (appModule: 'pos' | 'retail') => {
        try {
            const res = await api.post('/subscriptions/start-trial', { appModule });
            alert(res.data.message);
            fetchDashboard();
        } catch (err: any) {
            alert(err.response?.data?.error || 'فشل بدء التجربة');
        }
    };

    // إرسال إشعار السداد وطلب التفعيل المستقل
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

    // فحص صلاحية موديول المطاعم وموديول التجزئة بدقة
    const { tenant, metrics, quotas, subscriptions, paymentProofs } = overviewData || {};
    const posSub = subscriptions?.pos;
    const isPosAccessible = Boolean(
        posSub &&
        !posSub.isBlocked &&
        posSub.status !== 'inactive' &&
        posSub.status !== 'expired'
    );

    const retailSub = subscriptions?.retail;
    const isRetailAccessible = Boolean(
        retailSub &&
        !retailSub.isBlocked &&
        retailSub.status !== 'inactive' &&
        retailSub.status !== 'expired'
    );

    const loungeSub = subscriptions?.lounge;
    const isLoungeAccessible = Boolean(
        loungeSub && !loungeSub.isBlocked && loungeSub.status !== 'inactive' && loungeSub.status !== 'expired'
    );
    // دالة حماية الاختصارات السريعة وتوجيه المستخدم للتجديد في حال الانتهاء
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

                {/* 1. Header & Direct Actions */}
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

                {/* 2. Live Business Pulse (نبض المتجر اليومي) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* مبيعات اليوم */}
                    <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-2 shadow-lg">
                        <div className="flex justify-between items-center text-slate-400 text-xs">
                            <span className="font-semibold">مبيعات اليوم الإجمالية</span>
                            <DollarSign size={16} className="text-emerald-400" />
                        </div>
                        <div className="text-2xl font-black text-emerald-400 font-mono">
                            {(metrics?.totalRevenueToday || 0).toLocaleString()} {currency}
                        </div>
                        <p className="text-[11px] text-slate-500">مجموع إيرادات نقاط البيع والتجزئة اليوم</p>
                    </div>

                    {/* عدد العمليات */}
                    <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-2 shadow-lg">
                        <div className="flex justify-between items-center text-slate-400 text-xs">
                            <span className="font-semibold">فواتير اليوم الصادرة</span>
                            <Receipt size={16} className="text-blue-400" />
                        </div>
                        <div className="text-2xl font-black text-white font-mono">
                            {metrics?.totalOrdersToday || 0}
                        </div>
                        <p className="text-[11px] text-slate-500">عملية بيع مكتملة منذ بداية اليوم</p>
                    </div>

                    {/* ودجت الشيفت المفتوح */}
                    <div className={`border p-5 rounded-3xl space-y-2 shadow-lg ${!activeShift
                        ? 'bg-slate-900/60 border-slate-800'
                        : activeShift.isOverdue
                            ? 'bg-rose-500/10 border-rose-500/30'
                            : 'bg-slate-900 border-slate-800'
                        }`}>
                        <div className="flex justify-between items-center text-xs">
                            <span className="font-semibold text-slate-300">الوردية الحالية</span>
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

                    {/* نواقص المخزن */}
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

                {/* 3. الحصص التشغيلية والاختصارات السريعة المحمية بالاشتراك */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    {/* استهلاك الحصص والتراخيص */}
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

                    {/* اختصارات العمل اليومي السريع المحمية بحالة الاشتراك */}
                    <div className="md:col-span-7 bg-slate-900 border border-slate-800 p-5 rounded-3xl flex flex-col justify-between space-y-3 shadow-lg text-xs">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
                            <span className="font-black text-white flex items-center gap-1.5">
                                <Zap size={15} className="text-amber-400" /> اختصارات التشغيل السريع
                            </span>
                            <span className="text-[11px] text-slate-400">انتقال فوري للأنظمة النشطة</span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {/* 1. كاشير المطاعم */}
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
                            {/* 2. كاشير الملابس */}
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

                            {/* 3. إدارة المخزن (تابع لنظام POS) */}
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

                            {/* 4. التقارير المالية (تابع لنظام POS) */}
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
                                <span className={`font-bold ${isPosAccessible ? 'text-slate-200' : 'text-slate-400'}`}>التقارير المالية</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* 4. كروت الأنظمة والاشتراكات مع العداد التنازلي الشفاف */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-base font-black text-white flex items-center gap-2">
                            <Sparkles size={18} className="text-amber-400" /> باقات التطبيقات المنفصلة والعداد الزمني
                        </h2>
                        <span className="text-xs text-slate-400">تجديد مستقل لكل برنامج</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {(['pos', 'retail', 'fleet', 'lounge',] as const).map(appKey => {
                            const app = APP_DETAILS[appKey];
                            const subInfo = subscriptions ? subscriptions[appKey] : null;
                            const isAccessible = subInfo && !subInfo.isBlocked && subInfo.status !== 'inactive' && subInfo.status !== 'expired';
                            const isTrial = subInfo && subInfo.status === 'trial';
                            const isPaid = subInfo && subInfo.status === 'active';
                            const daysLeft = subInfo?.daysLeft || 0;

                            return (
                                <div key={appKey} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col justify-between space-y-4 shadow-xl hover:border-slate-700 transition">
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-start">
                                            <div className={`w-11 h-11 rounded-2xl ${app.bgAccent} border ${app.borderColor} ${app.color} flex items-center justify-center shadow-lg`}>
                                                <app.icon size={22} />
                                            </div>
                                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${isPaid ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                                isTrial ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                                    subInfo?.status === 'pending_approval' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                                        'bg-slate-800 text-slate-400'
                                                }`}>
                                                {isPaid ? 'اشتراك مدفوع' : isTrial ? 'تجربة مجانية' : subInfo?.status === 'pending_approval' ? 'سماح 24 ساعة ⏳' : 'غير مشترك'}
                                            </span>
                                        </div>

                                        <div>
                                            <h3 className="text-base font-black text-white">{app.name.split('—')[0]}</h3>
                                            <div className="mt-1 flex items-baseline gap-1 font-mono">
                                                <span className="text-base font-black text-white">{app.monthlyPrice}</span>
                                                <span className="text-[11px] text-slate-400">ج.م / شهرياً</span>
                                            </div>
                                        </div>

                                        {/* عداد الأيام المتبقية */}
                                        {isAccessible && (
                                            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1.5">
                                                <div className="flex justify-between text-[11px]">
                                                    <span className="text-slate-400">الرصيد الزمني المتبقي:</span>
                                                    <span className={`font-mono font-bold ${daysLeft <= 3 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                                        {daysLeft} يوم
                                                    </span>
                                                </div>
                                                <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${daysLeft <= 3 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                                                        style={{ width: `${Math.min(100, (daysLeft / 30) * 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-2 border-t border-slate-800/80">
                                        {appKey === 'fleet' ? (
                                            <button disabled className="w-full py-2.5 bg-slate-950 text-slate-600 rounded-xl text-xs font-bold cursor-not-allowed">
                                                قيد الإطلاق (Beta)
                                            </button>
                                        ) : isAccessible ? (
                                            <div className="grid grid-cols-2 gap-2">
                                                <Link
                                                    href={app.route}
                                                    className="py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1 shadow-lg"
                                                >
                                                    فتح النظام <ArrowLeft size={14} />
                                                </Link>
                                                <button
                                                    onClick={() => setPayModal({ open: true, moduleKey: appKey, plan: 'monthly' })}
                                                    className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl border border-slate-700"
                                                >
                                                    تجديد الباقة
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-2 gap-2">
                                                <Button
                                                    onClick={() => handleStartTrial(appKey as 'pos' | 'retail')}
                                                    className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl"
                                                >
                                                    <Play size={12} className="ml-1" /> أسبوع تجربة
                                                </Button>
                                                <Button
                                                    onClick={() => setPayModal({ open: true, moduleKey: appKey, plan: 'monthly' })}
                                                    className="py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl"
                                                >
                                                    تفعيل واشتراك
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 5. سجل إيصالات السداد والتحويلات (Payment Proofs Ledger) */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl text-xs">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                        <div>
                            <h3 className="text-sm font-black text-white flex items-center gap-2">
                                <ShieldCheck size={16} className="text-blue-400" /> سجل عمليات السداد وإشعارات التحويل
                            </h3>
                            <p className="text-[11px] text-slate-400">متابعة فورية لحالة التحويلات المرسلة للإدارة</p>
                        </div>
                        <Button
                            onClick={() => setPayModal({ open: true, moduleKey: 'pos', plan: 'monthly' })}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs py-1.5 px-3 rounded-xl font-bold"
                        >
                            + إرسال إشعار سداد جديد
                        </Button>
                    </div>

                    {(!paymentProofs || paymentProofs.length === 0) ? (
                        <div className="text-center py-8 text-slate-500">
                            لا توجد تحويلات سابقة مسجلة. اضغط "سداد / تجديد باقة" لرفع أول إشعار.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-right text-xs">
                                <thead className="bg-slate-950 text-slate-400 text-[11px] border-b border-slate-800">
                                    <tr>
                                        <th className="p-3">التطبيق</th>
                                        <th className="p-3">المبلغ</th>
                                        <th className="p-3">طريقة الدفع</th>
                                        <th className="p-3">الحساب المحول منه</th>
                                        <th className="p-3">تاريخ الإرسال</th>
                                        <th className="p-3 text-center">حالة الطلب</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/60 font-mono">
                                    {paymentProofs.map((proof: any) => (
                                        <tr key={proof._id} className="hover:bg-slate-800/30 transition">
                                            <td className="p-3 font-sans font-bold text-white uppercase">{proof.appModule}</td>
                                            <td className="p-3 font-bold text-emerald-400">{proof.amount} ج.م</td>
                                            <td className="p-3 uppercase text-slate-300 font-sans">{proof.paymentMethod}</td>
                                            <td className="p-3 text-slate-300">{proof.senderPhoneOrName}</td>
                                            <td className="p-3 text-slate-400">{new Date(proof.createdAt).toLocaleDateString('ar-EG')}</td>
                                            <td className="p-3 text-center font-sans">
                                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border inline-block ${proof.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                    proof.status === 'rejected' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                                                        'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                                    }`}>
                                                    {proof.status === 'approved' ? 'معتمد ومفعل ✅' :
                                                        proof.status === 'rejected' ? 'مرفوض ❌' :
                                                            'قيد المراجعة (مهلة 24 ساعة سارية) ⏳'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* ========================================================================= */}
                {/* مودال السداد المتقدم (Payment Subscription Modal)                          */}
                {/* ========================================================================= */}
                {payModal.open && (
                    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
                        <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 text-xs max-h-[92vh] overflow-y-auto">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                                <div>
                                    <h2 className="text-base font-black text-white flex items-center gap-2">
                                        <ShieldCheck className="text-blue-400" size={18} /> تجديد باقة المنشأة وسداد الاشتراك
                                    </h2>
                                    <p className="text-slate-400 text-xs mt-0.5">اختر النظام والخطة لرفع إشعار التحويل وتفعيل مهلة العمل</p>
                                </div>
                                <button
                                    onClick={() => setPayModal({ ...payModal, open: false })}
                                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {proofSuccessMsg && (
                                <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl flex items-center gap-2 text-xs">
                                    <CheckCircle2 size={18} className="shrink-0" />
                                    <span>{proofSuccessMsg}</span>
                                </div>
                            )}

                            {proofErrorMsg && (
                                <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl flex items-center gap-2 text-xs">
                                    <AlertCircle size={18} className="shrink-0" />
                                    <span>{proofErrorMsg}</span>
                                </div>
                            )}

                            {/* اختيار التطبيق */}
                            <div>
                                <label className="text-slate-300 font-bold block mb-2">1. حدد التطبيق المراد سداد اشتراكه:</label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                                    {(['pos', 'retail', 'fleet'] as const).map(appKey => {
                                        const app = APP_DETAILS[appKey];
                                        const isSelected = payModal.moduleKey === appKey;
                                        return (
                                            <button
                                                key={appKey}
                                                type="button"
                                                onClick={() => setPayModal({ ...payModal, moduleKey: appKey })}
                                                className={`p-3 rounded-2xl border text-right transition flex items-center gap-2.5 ${isSelected
                                                    ? `${app.bgAccent} ${app.borderColor} text-white font-black shadow-lg`
                                                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                                                    }`}
                                            >
                                                <div className={`w-8 h-8 rounded-xl ${app.bgAccent} ${app.color} flex items-center justify-center shrink-0`}>
                                                    <app.icon size={16} />
                                                </div>
                                                <div className="truncate">
                                                    <span className="block text-xs truncate">{app.name.split('—')[0]}</span>
                                                    <span className="text-[10px] text-slate-500 font-mono">{app.monthlyPrice} ج.م/شهر</span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* اختيار المدة */}
                            <div>
                                <label className="text-slate-300 font-bold block mb-2">2. اختر خطة السداد:</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setPayModal({ ...payModal, plan: 'monthly' })}
                                        className={`p-3.5 rounded-2xl border text-right transition ${payModal.plan === 'monthly'
                                            ? 'bg-blue-600/10 border-blue-500 text-white font-bold shadow-lg'
                                            : 'bg-slate-950 border-slate-800 text-slate-400'
                                            }`}
                                    >
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs">اشتراك شهري (1 شهر)</span>
                                            <span className="font-mono text-sm font-black text-white">{currentAppConfig.monthlyPrice} ج.م</span>
                                        </div>
                                        <span className="text-[10px] text-slate-500 mt-1 block">تجديد دوري كل 30 يوماً</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setPayModal({ ...payModal, plan: 'yearly' })}
                                        className={`p-3.5 rounded-2xl border text-right transition ${payModal.plan === 'yearly'
                                            ? 'bg-emerald-600/10 border-emerald-500 text-white font-bold shadow-lg'
                                            : 'bg-slate-950 border-slate-800 text-slate-400'
                                            }`}
                                    >
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-emerald-400 font-bold">سنوي (وفر شهرين)</span>
                                            <span className="font-mono text-sm font-black text-emerald-400">{currentAppConfig.yearlyPrice} ج.م</span>
                                        </div>
                                        <span className="text-[10px] text-slate-500 mt-1 block">وفر شهرين مجاناً (12 شهر)</span>
                                    </button>
                                </div>
                            </div>

                            {/* أسباب التجديد */}
                            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                                <span className="font-bold text-white flex items-center gap-1.5 text-xs">
                                    <Zap size={14} className="text-amber-400" /> ماذا يمنحك هذا الاشتراك لنظام ({currentAppConfig.name})؟
                                </span>
                                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-300 pt-1">
                                    {currentAppConfig.benefits.map((benefit, idx) => (
                                        <li key={idx} className="flex items-start gap-1.5">
                                            <CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                                            <span>{benefit}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* حسابات التحويل */}
                            <div className="p-4 bg-blue-950/20 border border-blue-500/20 rounded-2xl space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-blue-400">حسابات التحويل المعتمدة لمنصة صَرْح:</span>
                                    <span className="font-mono text-sm font-black text-emerald-400">{calculatedPrice}.00 ج.م</span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                                    <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center">
                                        <div>
                                            <span className="text-[10px] text-slate-500 block font-sans">إنستاباي (InstaPay):</span>
                                            <span className="text-white font-bold">sarh.pay@instapay</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleCopy('sarh.pay@instapay', 'insta')}
                                            className="p-1.5 text-slate-400 hover:text-white"
                                        >
                                            {copiedKey === 'insta' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                                        </button>
                                    </div>

                                    <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center">
                                        <div>
                                            <span className="text-[10px] text-slate-500 block font-sans">فودافون كاش (محفظة):</span>
                                            <span className="text-white font-bold">01000000000</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleCopy('01000000000', 'vodafone')}
                                            className="p-1.5 text-slate-400 hover:text-white"
                                        >
                                            {copiedKey === 'vodafone' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* نموذج الإشعار */}
                            <form onSubmit={handleSubmitPaymentProof} className="space-y-3.5 pt-1">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-slate-300 block mb-1 font-semibold">طريقة التحويل:</label>
                                        <select
                                            value={formData.paymentMethod}
                                            onChange={e => setFormData({ ...formData, paymentMethod: e.target.value as any })}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500 font-sans"
                                        >
                                            <option value="instapay">إنستاباي (InstaPay)</option>
                                            <option value="vodafone_cash">فودافون كاش (محفظة هاتف)</option>
                                            <option value="bank_transfer">تحويل بنكي</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="text-slate-300 block mb-1 font-semibold">رقم الهاتف أو اسم المحول منه:</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="مثال: 01012345678 أو حساب أحمد"
                                            value={formData.senderPhoneOrName}
                                            onChange={e => setFormData({ ...formData, senderPhoneOrName: e.target.value })}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-slate-300 block mb-1 font-semibold">رابط صورة إيصال التحويل (Screenshot URL):</label>
                                    <input
                                        type="url"
                                        placeholder="https://... (يمكن تركها فارغة أثناء الاختبار)"
                                        value={formData.screenshotUrl}
                                        onChange={e => setFormData({ ...formData, screenshotUrl: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-blue-500 text-[11px]"
                                    />
                                </div>

                                <div className="flex gap-2 pt-2">
                                    <Button
                                        type="submit"
                                        disabled={submittingProof}
                                        className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl text-xs shadow-lg transition"
                                    >
                                        {submittingProof
                                            ? 'جارٍ إرسال الإشعار...'
                                            : `تأكيد وإرسال إشعار الدفع (${calculatedPrice} ج.م)`}
                                    </Button>

                                    <button
                                        type="button"
                                        onClick={() => setPayModal({ ...payModal, open: false })}
                                        className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition"
                                    >
                                        إلغاء
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}