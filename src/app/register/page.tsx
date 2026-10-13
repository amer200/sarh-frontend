// src/app/register/page.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import {
    Gamepad2, UtensilsCrossed, Shirt, Truck,
    CheckCircle2, AlertCircle, ArrowLeft, Building2,
    Lock, Mail, Phone, User, Globe, Check, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

const ACTIVITIES = [
    {
        id: 'lounge',
        title: 'صالة ألعاب وبلايستيشن',
        desc: 'حساب الوقت الفردي والزوجي، المحاكيات، صافرة التنبيه، وطلبات الكافيه',
        icon: Gamepad2,
        color: 'text-violet-400',
        borderColor: 'border-violet-500/40',
        bgAccent: 'bg-violet-600/10',
        badge: 'الأكثر طلباً'
    },
    {
        id: 'pos',
        title: 'مطاعم، كافيهات وبوفيهات',
        desc: 'كاشير لمس سريع، فواتير إلكترونية ZATCA، جرد مخزون، وتقفيل شيفتات',
        icon: UtensilsCrossed,
        color: 'text-amber-400',
        borderColor: 'border-amber-500/40',
        bgAccent: 'bg-amber-500/10'
    },
    {
        id: 'retail',
        title: 'محلات ملابس وتجزئة',
        desc: 'مصفوفة المقاسات والألوان، طباعة الباركود الحراري، ومناقلات الفروع',
        icon: Shirt,
        color: 'text-blue-400',
        borderColor: 'border-blue-500/40',
        bgAccent: 'bg-blue-600/10'
    },
    {
        id: 'fleet',
        title: 'أسطول شحن وتوصيل',
        desc: 'إدارة وتتبع المناديب، الشحنات، وتحصيل العهد النقدية عند الاستلام',
        icon: Truck,
        color: 'text-emerald-400',
        borderColor: 'border-emerald-500/40',
        bgAccent: 'bg-emerald-500/10'
    }
];

export default function RegisterPage() {
    const router = useRouter();

    const [activityType, setActivityType] = useState<'lounge' | 'pos' | 'retail' | 'fleet'>('lounge');
    const [formData, setFormData] = useState({
        tenantName: '',
        subdomain: '',
        name: '',
        email: '',
        password: '',
        phone: '',
        country: 'EG'
    });

    const [subdomainStatus, setSubdomainStatus] = useState<{ checking: boolean; available?: boolean; message?: string }>({
        checking: false
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    // فحص توفر النطاق الفرعي لحظياً
    const handleSubdomainBlur = async () => {
        const sub = formData.subdomain.trim().toLowerCase();
        if (sub.length < 3) return;

        setSubdomainStatus({ checking: true });
        try {
            const res = await api.get(`/tenants/check-subdomain?subdomain=${sub}`);
            setSubdomainStatus({
                checking: false,
                available: res.data.available,
                message: res.data.message
            });
        } catch {
            setSubdomainStatus({ checking: false, available: false, message: 'تعذر التحقق من النطاق' });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage('');

        if (subdomainStatus.available === false) {
            setErrorMessage('يرجى اختيار اسم نطاق متاح للمتابعة');
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                ...formData,
                subdomain: formData.subdomain.trim().toLowerCase(),
                activityType
            };

            const res = await api.post('/tenants/register', payload);

            if (res.data?.data) {
                // حفظ التوكن وبيانات المنشأة
                localStorage.setItem('sarh_token', res.data.data.token || '');
                localStorage.setItem('sarh_tenant_subdomain', res.data.data.subdomain);

                // التوجيه الذكي المباشر حسب النشاط
                if (activityType === 'lounge') {
                    router.push('/lounge');
                } else if (activityType === 'retail') {
                    router.push('/retail/pos');
                } else if (activityType === 'pos') {
                    router.push('/pos');
                } else {
                    router.push('/dashboard');
                }
            }
        } catch (err: any) {
            setErrorMessage(err.response?.data?.error || 'فشل في إتمام التسجيل، يرجى مراجعة البيانات');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 font-sans selection:bg-blue-600 selection:text-white" dir="rtl">
            <div className="max-w-2xl w-full mx-auto space-y-8">

                {/* Header */}
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold">
                        <Sparkles size={14} /> تجربة مجانية كاملة لمدة 7 أيام بدون بطاقة بنكية
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-white">ابدأ تشغيل منشأتك على منصة صَرْح</h1>
                    <p className="text-xs sm:text-sm text-slate-400">اختر نوع نظامك الأساسي واستلم مساحة عملك السحابية المستقلة فوراً</p>
                </div>

                {errorMessage && (
                    <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-2xl flex items-center gap-2">
                        <AlertCircle size={16} /> <span>{errorMessage}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">

                    {/* Step 1: اختيار النشاط */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-slate-300 block">
                            1. حدد مجال عمل المنشأة (يمكنك إضافة بقية الأنظمة لاحقاً بشكل مستقل):
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {ACTIVITIES.map(act => {
                                const isSelected = activityType === act.id;
                                return (
                                    <div
                                        key={act.id}
                                        onClick={() => setActivityType(act.id as any)}
                                        className={`p-4 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between ${isSelected
                                                ? `${act.bgAccent}${act.borderColor} border-2 shadow-lg`
                                                : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                                            }`}
                                    >
                                        {act.badge && (
                                            <span className="absolute top-2 left-2 bg-violet-500/20 text-violet-400 border border-violet-500/30 text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                                                {act.badge}
                                            </span>
                                        )}
                                        <div>
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <act.icon size={18} className={act.color} />
                                                <h3 className="text-xs font-bold text-white">{act.title}</h3>
                                            </div>
                                            <p className="text-[11px] text-slate-400 leading-relaxed">{act.desc}</p>
                                        </div>
                                        <div className="mt-3 flex justify-end">
                                            <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? 'bg-blue-600 border-blue-500 text-white' : 'border-slate-700'
                                                }`}>
                                                {isSelected && <Check size={10} />}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Step 2: بيانات المنشأة والنطاق */}
                    <div className="space-y-4 pt-4 border-t border-slate-800">
                        <label className="text-xs font-bold text-slate-300 block">
                            2. بيانات المنشأة ومساحة العمل السحابية:
                        </label>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div>
                                <label className="text-slate-400 block mb-1">الاسم التجاري للمحل أو الصالة:</label>
                                <div className="relative">
                                    <Building2 className="absolute right-3 top-2.5 text-slate-500" size={16} />
                                    <input
                                        type="text"
                                        required
                                        placeholder="مثال: بلايستيشن أرينا أو برجر فاكتوري"
                                        value={formData.tenantName}
                                        onChange={e => setFormData({ ...formData, tenantName: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-3 py-2 text-white focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-slate-400 block mb-1">اسم النطاق السحابي (Subdomain):</label>
                                <div className="relative">
                                    <Globe className="absolute right-3 top-2.5 text-slate-500" size={16} />
                                    <input
                                        type="text"
                                        required
                                        dir="ltr"
                                        placeholder="arena-lounge"
                                        value={formData.subdomain}
                                        onBlur={handleSubdomainBlur}
                                        onChange={e => setFormData({ ...formData, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-28 py-2 text-white font-mono text-left focus:outline-none focus:border-blue-500"
                                    />
                                    <span className="absolute left-3 top-2.5 text-slate-500 text-[11px] font-mono select-none">
                                        .sarh.cloud
                                    </span>
                                </div>
                                {subdomainStatus.message && (
                                    <span className={`text-[10px] mt-1 block font-mono ${subdomainStatus.available ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {subdomainStatus.message}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Step 3: بيانات المسؤول وكلمة المرور */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2">
                            <div>
                                <label className="text-slate-400 block mb-1">اسمك الشخصي (المسؤول):</label>
                                <div className="relative">
                                    <User className="absolute right-3 top-2.5 text-slate-500" size={16} />
                                    <input
                                        type="text"
                                        required
                                        placeholder="أحمد محمد"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-3 py-2 text-white focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-slate-400 block mb-1">رقم الهاتف أو الواتساب:</label>
                                <div className="relative">
                                    <Phone className="absolute right-3 top-2.5 text-slate-500" size={16} />
                                    <input
                                        type="tel"
                                        required
                                        dir="ltr"
                                        placeholder="01012345678"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500 text-right"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-slate-400 block mb-1">البريد الإلكتروني للتحكم:</label>
                                <div className="relative">
                                    <Mail className="absolute right-3 top-2.5 text-slate-500" size={16} />
                                    <input
                                        type="email"
                                        required
                                        dir="ltr"
                                        placeholder="manager@domain.com"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500 text-left"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-slate-400 block mb-1">كلمة المرور:</label>
                                <div className="relative">
                                    <Lock className="absolute right-3 top-2.5 text-slate-500" size={16} />
                                    <input
                                        type="password"
                                        required
                                        placeholder="••••••••"
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-3 py-2 text-white focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-sm rounded-xl shadow-xl transition-all active:scale-98"
                    >
                        {isSubmitting ? 'جارٍ تهيئة المنظومة وقاعدة البيانات...' : 'إنشاء الحساب وبدء التجربة المجانية 🚀'}
                    </Button>

                    <p className="text-center text-xs text-slate-400">
                        لديك حساب بالفعل؟{' '}
                        <Link href="/login" className="text-blue-400 hover:underline font-bold">
                            تسجيل الدخول
                        </Link>
                    </p>
                </form>

            </div>
        </div>
    );
}