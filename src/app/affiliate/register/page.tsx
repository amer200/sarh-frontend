'use client';

import React, { useState } from 'react';
import api from '@/lib/api';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { DollarSign, CheckCircle2, Copy, Check } from 'lucide-react';

export default function AffiliateRegisterPage() {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        phone: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successData, setSuccessData] = useState<any>(null);
    const [errorMsg, setErrorMsg] = useState('');
    const [copied, setCopied] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrorMsg('');
        try {
            const res = await api.post('/affiliates/register', formData);
            setSuccessData(res.data.data);
        } catch (err: any) {
            setErrorMsg(err.response?.data?.error || 'حدث خطأ أثناء تسجيل المسوق');
        } finally {
            setIsSubmitting(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (successData) {
        return (
            <main className="min-h-screen flex items-center justify-center p-6 bg-slate-950">
                <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center shadow-2xl">
                    <div className="w-16 h-16 bg-blue-500/10 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 size={36} />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">أهلاً بك في شبكة مسوقي صَرْح!</h2>
                    <p className="text-slate-400 text-sm mb-6">تم تفعيل حسابك بنسبة عمولة شهرية متكررة 25% مدى الحياة.</p>

                    <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl text-right mb-4">
                        <span className="text-xs text-slate-500 block mb-1">كود الإحالة الخاص بك:</span>
                        <span className="text-blue-400 font-mono font-bold text-lg">{successData.referralCode}</span>
                    </div>

                    <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl text-right mb-6">
                        <span className="text-xs text-slate-500 block mb-1">رابط التسويق:</span>
                        <div className="flex items-center justify-between gap-2 mt-1">
                            <span className="text-slate-300 font-mono text-xs truncate dir-ltr">{successData.referralLink}</span>
                            <button
                                onClick={() => copyToClipboard(successData.referralLink)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition shrink-0"
                            >
                                {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                            </button>
                        </div>
                    </div>

                    <Link href="/login">
                        <Button className="w-full py-3">تسجيل الدخول إلى لوحة الأرباح</Button>
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen flex items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-950/40 via-slate-950 to-slate-950">
            <div className="max-w-md w-full bg-slate-900/70 border border-slate-800 backdrop-blur-xl rounded-2xl p-8 shadow-2xl">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold mb-3">
                        <DollarSign size={14} /> برنامج الشركاء والمسوقين
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-1">اربح 25% شهرياً مدى الحياة</h1>
                    <p className="text-slate-400 text-sm">عن كل عميل يسجل ويجدد اشتراكه في أي نظام عبر رابطك</p>
                </div>

                {errorMsg && (
                    <div className="mb-6 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm text-right">
                        {errorMsg}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="الاسم بالكامل"
                        required
                        placeholder="أحمد محمد"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    />
                    <Input
                        label="البريد الإلكتروني"
                        type="email"
                        required
                        dir="ltr"
                        placeholder="marketer@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
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

                    <Button type="submit" isLoading={isSubmitting} className="w-full py-3.5 mt-4 text-base font-semibold">
                        انضم للبرنامج واستلم رابطك فوراً
                    </Button>
                </form>
            </div>
        </main>
    );
}