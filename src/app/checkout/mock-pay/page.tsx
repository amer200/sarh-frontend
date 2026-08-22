'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import axios from 'axios';
import { CheckCircle2, CreditCard, ShieldCheck, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

function MockPayContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const invoiceId = searchParams.get('invoiceId');

    const [isProcessing, setIsProcessing] = useState(false);
    const [success, setSuccess] = useState<any>(null);
    const [errorMsg, setErrorMsg] = useState('');

    const handleSimulatePayment = async () => {
        if (!invoiceId) return;
        setIsProcessing(true);
        setErrorMsg('');

        try {
            const res = await axios.post('http://localhost:5000/api/v1/billing/webhook-success', {
                invoiceId,
                paymentMethod: 'visa_online'
            });
            setSuccess(res.data.data);
        } catch (err: any) {
            setErrorMsg(err.response?.data?.error || 'فشلت عملية الدفع');
        } finally {
            setIsProcessing(false);
        }
    };

    if (success) {
        return (
            <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center shadow-2xl">
                <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 size={36} />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">تم تفعيل الاشتراك بنجاح!</h2>
                <p className="text-slate-400 text-sm mb-6">
                    تم تمديد صلاحية المنشأة <span className="text-blue-400 font-mono">({success.tenantSubdomain})</span> حتى تاريخ {new Date(success.newExpiryDate).toLocaleDateString('ar-EG')}.
                </p>

                <div className="bg-slate-950 p-4 rounded-xl text-right mb-6 text-sm">
                    <span className="text-slate-500 block text-xs mb-1">رقم الفاتورة المعتمدة:</span>
                    <span className="font-mono text-slate-200">{success.invoiceNumber}</span>
                </div>

                <Button onClick={() => router.push('/affiliate/dashboard')} className="w-full py-3">
                    العودة للوحة التحكم
                </Button>
            </div>
        );
    }

    return (
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl text-center">
            <div className="w-14 h-14 bg-blue-600/10 border border-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CreditCard size={28} />
            </div>

            <h1 className="text-2xl font-bold text-white mb-1">بوابة الدفع السحابية الآمنة</h1>
            <p className="text-slate-400 text-sm mb-6">محاكاة عملية السداد الفوري وتفعيل المنشأة</p>

            {errorMsg && (
                <div className="mb-4 p-3 rounded-xl bg-rose-500/10 text-rose-400 text-sm">
                    {errorMsg}
                </div>
            )}

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-right mb-6 space-y-2 text-sm">
                <div className="flex justify-between text-slate-400">
                    <span>معرف الفاتورة:</span>
                    <span className="font-mono text-slate-200 text-xs">{invoiceId || 'N/A'}</span>
                </div>
                <div className="flex justify-between text-slate-400 border-t border-slate-800/60 pt-2">
                    <span>الحماية:</span>
                    <span className="text-emerald-400 flex items-center gap-1 text-xs"><ShieldCheck size={14} /> مشفر وآمن 256-bit</span>
                </div>
            </div>

            <Button
                onClick={handleSimulatePayment}
                isLoading={isProcessing}
                disabled={!invoiceId}
                className="w-full py-3.5 text-base font-semibold"
            >
                تأكيد الدفع ومحاكاة السداد الفوري
            </Button>
        </div>
    );
}

export default function MockPayPage() {
    return (
        <main className="min-h-screen flex items-center justify-center p-6 bg-slate-950">
            <Suspense fallback={<div className="text-slate-400">جاري التحميل...</div>}>
                <MockPayContent />
            </Suspense>
        </main>
    );
}