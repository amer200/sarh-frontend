// src/app/checkout/page.tsx
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { ShieldCheck, ArrowRight, Copy, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

function CheckoutContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // التقاط التطبيق من الرابط (?app=pos أو ?app=retail)
    const appParam = searchParams.get('app') as 'pos' | 'retail' | 'fleet' || 'pos';
    const [appModule, setAppModule] = useState<'pos' | 'retail' | 'fleet'>(appParam);
    const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');
    const [paymentMethod, setPaymentMethod] = useState<'instapay' | 'vodafone_cash' | 'bank_transfer'>('instapay');
    const [senderInfo, setSenderInfo] = useState('');
    const [screenshotUrl, setScreenshotUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const appNames = {
        pos: 'صَرْح POS للمطاعم والكافيهات',
        retail: 'صَرْح Retail للملابس والتجزئة',
        fleet: 'صَرْح Fleet للتوصيل والأسطول'
    };

    const monthlyPrice = appModule === 'fleet' ? 350 : 250;
    const planPrices = {
        monthly: monthlyPrice,
        yearly: monthlyPrice * 10 // شهرين مجاناً
    };

    const handleSubmitProof = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');

        try {
            await api.post('/subscriptions/proof', {
                appModule,
                amount: planPrices[selectedPlan],
                paymentMethod,
                senderPhoneOrName: senderInfo,
                screenshotUrl: screenshotUrl || 'https://placehold.co/600x800/png?text=Payment+Receipt',
                notes: `اشتراك ${selectedPlan === 'yearly' ? 'سنوي' : 'شهري'} لتطبيق ${appModule}`
            });

            setSuccessMsg(true);
        } catch (err: any) {
            setErrorMsg(err.response?.data?.error || 'فشل إرسال إشعار السداد');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                    <h1 className="text-xl font-black text-white flex items-center gap-2">
                        <ShieldCheck className="text-emerald-400" /> ترقية اشتراك ({appNames[appModule]})
                    </h1>
                    <p className="text-xs text-slate-400">اشتراك مستقل مخصص لهذا التطبيق فقط</p>
                </div>
                <Button onClick={() => router.push('/dashboard')} className="bg-slate-900 border border-slate-800 text-xs text-slate-300 py-2 px-3 rounded-xl">
                    العودة للرئيسية <ArrowRight size={14} />
                </Button>
            </div>

            {/* باقي نموذج التحويل كما هو مع اعتماد planPrices[selectedPlan] المتغيرة بحسب التطبيق */}
        </div>
    );
}

export default function CheckoutPage() {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 font-sans" dir="rtl">
            <Suspense fallback={<div className="text-xs text-slate-500 text-center py-20">جارٍ التحميل...</div>}>
                <CheckoutContent />
            </Suspense>
        </div>
    );
}