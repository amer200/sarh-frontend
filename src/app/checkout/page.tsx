// src/app/checkout/page.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import {
    ShieldCheck, CreditCard, CheckCircle2, Upload,
    AlertCircle, ArrowRight, Phone, Wallet, Copy, Check
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function CheckoutPage() {
    const router = useRouter();
    const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');
    const [paymentMethod, setPaymentMethod] = useState<'instapay' | 'vodafone_cash' | 'bank_transfer'>('instapay');
    const [senderInfo, setSenderInfo] = useState('');
    const [screenshotUrl, setScreenshotUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [copied, setCopied] = useState<string | null>(null);

    const planPrices = {
        monthly: 650,
        yearly: 6500 // وفر شهرين
    };

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

    const handleSubmitProof = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');

        try {
            await api.post('/subscriptions/proof', {
                amount: planPrices[selectedPlan],
                paymentMethod,
                senderPhoneOrName: senderInfo,
                screenshotUrl: screenshotUrl || 'https://placehold.co/600x800/png?text=Bank+Transfer+Receipt',
                plan: selectedPlan
            });

            setSuccessMsg(true);
        } catch (err: any) {
            setErrorMsg(err.response?.data?.error || 'فشل إرسال إشعار السداد، يرجى المحاولة لاحقاً');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 font-sans" dir="rtl">
            <div className="max-w-3xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                    <div>
                        <h1 className="text-xl font-black text-white flex items-center gap-2">
                            <ShieldCheck className="text-emerald-400" /> ترقية وتجديد اشتراك صَرْح
                        </h1>
                        <p className="text-xs text-slate-400">سدد اشتراك نقاط البيع والتجزئة مع إتاحة التحويل الفوري</p>
                    </div>
                    <Button
                        onClick={() => router.push('/dashboard')}
                        className="bg-slate-900 border border-slate-800 text-xs text-slate-300 py-2 px-3 rounded-xl"
                    >
                        العودة للرئيسية <ArrowRight size={14} />
                    </Button>
                </div>

                {successMsg ? (
                    <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl p-8 text-center space-y-4 shadow-2xl">
                        <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle2 size={36} />
                        </div>
                        <h2 className="text-lg font-black text-white">تم استلام إشعار التحويل بنجاح!</h2>
                        <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                            يقوم فريق الدعم الفني بمراجعة الإيصال ومطابقته فوراً، وسيتم تفعيل حسابك تلقائياً خلال دقائق.
                        </p>
                        <Button
                            onClick={() => router.push('/dashboard')}
                            className="bg-emerald-600 hover:bg-emerald-500 text-xs font-bold py-2.5 px-6 rounded-xl"
                        >
                            الذهاب للوحة التحكم
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* خطط الاشتراك وتفاصيل التحويل */}
                        <div className="space-y-4">
                            <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-3">
                                <h2 className="text-xs font-bold text-slate-400">1. اختر باقة الاشتراك</h2>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedPlan('monthly')}
                                        className={`p-3.5 rounded-2xl border text-right transition ${selectedPlan === 'monthly'
                                                ? 'bg-blue-600/10 border-blue-500 text-white shadow-lg'
                                                : 'bg-slate-950 border-slate-800 text-slate-400'
                                            }`}
                                    >
                                        <span className="block text-xs font-bold">باقة شهرية</span>
                                        <span className="text-base font-black font-mono text-white">650 ج.م</span>
                                        <span className="block text-[10px] text-slate-500">تدفع شهرياً</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setSelectedPlan('yearly')}
                                        className={`p-3.5 rounded-2xl border text-right transition ${selectedPlan === 'yearly'
                                                ? 'bg-emerald-600/10 border-emerald-500 text-white shadow-lg'
                                                : 'bg-slate-950 border-slate-800 text-slate-400'
                                            }`}
                                    >
                                        <span className="block text-xs font-bold text-emerald-400">سنوي (خصم شهرين)</span>
                                        <span className="text-base font-black font-mono text-white">6,500 ج.م</span>
                                        <span className="block text-[10px] text-slate-500">تدفع سنوياً</span>
                                    </button>
                                </div>
                            </div>

                            <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-3">
                                <h2 className="text-xs font-bold text-slate-400">2. بيانات التحويل المعتمدة</h2>

                                <div className="space-y-2 text-xs">
                                    {/* InstaPay */}
                                    <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
                                        <div>
                                            <span className="text-[11px] text-slate-400 block font-semibold">حساب إنستاباي (InstaPay):</span>
                                            <span className="font-mono text-white font-bold">sarh@instapay</span>
                                        </div>
                                        <button
                                            onClick={() => copyToClipboard('sarh@instapay', 'insta')}
                                            className="p-2 text-slate-400 hover:text-white"
                                        >
                                            {copied === 'insta' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                                        </button>
                                    </div>

                                    {/* Vodafone Cash */}
                                    <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
                                        <div>
                                            <span className="text-[11px] text-slate-400 block font-semibold">فودافون كاش (Vodafone Cash):</span>
                                            <span className="font-mono text-white font-bold">01000000000</span>
                                        </div>
                                        <button
                                            onClick={() => copyToClipboard('01000000000', 'vodafone')}
                                            className="p-2 text-slate-400 hover:text-white"
                                        >
                                            {copied === 'vodafone' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* نموذج رفع الإثبات */}
                        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
                            <h2 className="text-xs font-bold text-white">3. تأكيد وإرسال إشعار الدفع</h2>

                            {errorMsg && (
                                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs flex items-center gap-2">
                                    <AlertCircle size={14} className="shrink-0" />
                                    <span>{errorMsg}</span>
                                </div>
                            )}

                            <form onSubmit={handleSubmitProof} className="space-y-3.5 text-xs">
                                <div>
                                    <label className="text-slate-400 block mb-1 font-semibold">طريقة التحويل:</label>
                                    <select
                                        value={paymentMethod}
                                        onChange={e => setPaymentMethod(e.target.value as any)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                                    >
                                        <option value="instapay">إنستاباي (InstaPay)</option>
                                        <option value="vodafone_cash">فودافون كاش (Vodafone Cash)</option>
                                        <option value="bank_transfer">تحويل بنكي مباشر</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-slate-400 block mb-1 font-semibold">
                                        رقم الهاتف أو اسم المحول منه:
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="مثال: 01012345678 أو حساب فلان"
                                        value={senderInfo}
                                        onChange={e => setSenderInfo(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="text-slate-400 block mb-1 font-semibold">
                                        رابط صورة الإيصال أو السكرين شوت:
                                    </label>
                                    <input
                                        type="url"
                                        placeholder="https://... (رابط صورة الإيصال)"
                                        value={screenshotUrl}
                                        onChange={e => setScreenshotUrl(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500 font-mono text-[11px]"
                                    />
                                    <span className="text-[10px] text-slate-500 block mt-1">
                                        يمكنك ترك الحقل فارغاً للاختبار التجريبي، وسيقبل النظام صورة افتراضية.
                                    </span>
                                </div>

                                <div className="pt-2">
                                    <Button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs shadow-lg transition"
                                    >
                                        {loading ? 'جارٍ الإرسال للإدارة...' : `إرسال الإشعار (${planPrices[selectedPlan]} ج.م)`}
                                    </Button>
                                </div>
                            </form>
                        </div>

                    </div>
                )}

            </div>
        </div>
    );
}