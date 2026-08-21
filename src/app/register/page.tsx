'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ShieldCheck, CheckCircle2, XCircle, Rocket } from 'lucide-react';

export default function RegisterTenantPage() {
    const [formData, setFormData] = useState({
        companyName: '',
        subdomain: '',
        ownerName: '',
        email: '',
        password: '',
        phone: '',
        country: 'SA',
        selectedModule: 'shipping',
        referralCode: ''
    });

    const [isCheckingSubdomain, setIsCheckingSubdomain] = useState(false);
    const [subdomainStatus, setSubdomainStatus] = useState<{ available?: boolean; message?: string } | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successData, setSuccessData] = useState<any>(null);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        if (!formData.subdomain || formData.subdomain.length < 3) {
            setSubdomainStatus(null);
            return;
        }

        const timer = setTimeout(async () => {
            setIsCheckingSubdomain(true);
            try {
                const res = await axios.get(`http://localhost:5000/api/v1/tenants/check-subdomain?subdomain=${formData.subdomain}`);
                setSubdomainStatus(res.data);
            } catch {
                setSubdomainStatus({ available: false, message: 'تعذر التحقق من النطاق' });
            } finally {
                setIsCheckingSubdomain(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [formData.subdomain]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (subdomainStatus && !subdomainStatus.available) return;

        setIsSubmitting(true);
        setErrorMsg('');
        try {
            const res = await axios.post('http://localhost:5000/api/v1/tenants/register', formData);
            setSuccessData(res.data.data);
        } catch (err: any) {
            setErrorMsg(err.response?.data?.error || 'حدث خطأ أثناء التسجيل');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (successData) {
        return (
            <main className="min-h-screen flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center shadow-2xl">
                    <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 size={36} />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">تم تجهيز صَرْحُك السحابي!</h2>
                    <p className="text-slate-400 text-sm mb-6">مساحة عملك جاهزة الآن للتشغيل الفوري مع فترة تجريبية 7 أيام مجاناً.</p>

                    <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl text-right mb-6 text-sm">
                        <div className="text-slate-400 mb-1">رابط النظام الخاص بك:</div>
                        <div className="text-blue-400 font-mono text-base font-semibold dir-ltr text-left">
                            {successData.workspaceUrl}
                        </div>
                    </div>

                    <a href={successData.workspaceUrl} target="_blank" rel="noreferrer">
                        <Button className="w-full py-3 text-base">
                            الدخول للوحة التحكم <Rocket size={18} className="mr-2" />
                        </Button>
                    </a>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen flex items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950">
            <div className="max-w-xl w-full bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl rounded-2xl p-8 shadow-2xl">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-semibold mb-3">
                        <ShieldCheck size={14} /> منصة صَرْح السحابية
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-1">ابدأ تشغيل منشأتك خلال ثوانٍ</h1>
                    <p className="text-slate-400 text-sm">أنظمة سحابية متكاملة تدعم الفوترة والربط الفوري</p>
                </div>

                {errorMsg && (
                    <div className="mb-6 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm text-right">
                        {errorMsg}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="اسم المنشأة / الشركة"
                            required
                            placeholder="مثال: مؤسسة القمة للشحن"
                            value={formData.companyName}
                            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        />
                        <div className="flex flex-col gap-1.5 text-right">
                            <label className="text-sm font-medium text-slate-300">النطاق السحابي المخصص</label>
                            <div className="relative">
                                <input
                                    required
                                    dir="ltr"
                                    placeholder="mycompany"
                                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 text-left font-mono"
                                    value={formData.subdomain}
                                    onChange={(e) => setFormData({ ...formData, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                                />
                                <span className="absolute left-3 top-2.5 text-xs text-slate-500 font-mono">.sarh.cloud</span>
                            </div>
                            <div className="h-4 flex items-center gap-1.5 text-xs">
                                {isCheckingSubdomain && <span className="text-slate-400">جاري فحص النطاق...</span>}
                                {subdomainStatus && !isCheckingSubdomain && (
                                    subdomainStatus.available ? (
                                        <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 size={12} /> {subdomainStatus.message}</span>
                                    ) : (
                                        <span className="text-rose-400 flex items-center gap-1"><XCircle size={12} /> {subdomainStatus.message}</span>
                                    )
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="اسم المسؤول"
                            required
                            placeholder="محمد علي"
                            value={formData.ownerName}
                            onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                        />
                        <Input
                            label="البريد الإلكتروني"
                            type="email"
                            required
                            dir="ltr"
                            placeholder="owner@company.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="رقم الجوال / الواتساب"
                            required
                            dir="ltr"
                            placeholder="+966500000000"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                        <Input
                            label="كلمة المرور"
                            type="password"
                            required
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5 text-right">
                            <label className="text-sm font-medium text-slate-300">النظام المطلوب</label>
                            <select
                                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:border-blue-500"
                                value={formData.selectedModule}
                                onChange={(e) => setFormData({ ...formData, selectedModule: e.target.value })}
                            >
                                <option value="shipping">📦 إدارة الشحن والعمليات اللوجستية</option>
                                <option value="pos">🛒 نقاط البيع السحابية (POS)</option>
                                <option value="playstation">🎮 إدارة صالات الألعاب والكافيهات</option>
                            </select>
                        </div>
                        <Input
                            label="كود الإحالة / المسوق (اختياري)"
                            dir="ltr"
                            placeholder="SRH-XXXXXX"
                            value={formData.referralCode}
                            onChange={(e) => setFormData({ ...formData, referralCode: e.target.value.toUpperCase() })}
                        />
                    </div>

                    <Button type="submit" isLoading={isSubmitting} className="w-full py-3.5 mt-4 text-base font-semibold">
                        تأسيس المنشأة وبدء التجربة المجانية
                    </Button>
                </form>
            </div>
        </main>
    );
}