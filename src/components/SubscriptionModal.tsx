'use client';

import React, { useState } from 'react';
import api from '@/lib/api';
import { Lock, Clock, CheckCircle2, AlertCircle, Copy, Check, UploadCloud, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface SubscriptionModalProps {
    isOpen: boolean;
    status: 'trial' | 'expired' | 'pending_approval';
    daysLeft?: number;
    onClose?: () => void;
}

export default function SubscriptionModal({ isOpen, status, daysLeft, onClose }: SubscriptionModalProps) {
    const [copiedNumber, setCopiedNumber] = useState(false);
    const [senderPhone, setSenderPhone] = useState('');
    const [amount, setAmount] = useState('250'); // سعر الباقة الشهرية مثلاً
    const [paymentMethod, setPaymentMethod] = useState<'instapay' | 'vodafone_cash'>('instapay');
    const [screenshotBase64, setScreenshotBase64] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submittedSuccess, setSubmittedSuccess] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    if (!isOpen) return null;

    // تحويل الصورة المرفوعة إلى Base64
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 3 * 1024 * 1024) {
                alert('أقصى حجم للصورة 3 ميجابايت');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setScreenshotBase64(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSendProof = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!screenshotBase64) {
            setErrorMsg('يرجى إرفاق صورة إشعار التحويل');
            return;
        }

        setSubmitting(true);
        setErrorMsg('');

        try {
            await api.post('/subscriptions/proof', {
                senderPhoneOrName: senderPhone,
                amount: Number(amount),
                paymentMethod,
                screenshotUrl: screenshotBase64
            });
            setSubmittedSuccess(true);
        } catch (err: any) {
            setErrorMsg(err.response?.data?.error || 'فشل إرسال الإشعار');
        } finally {
            setSubmitting(false);
        }
    };

    const copyPaymentNumber = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedNumber(true);
        setTimeout(() => setCopiedNumber(false), 2000);
    };

    return (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4 font-sans text-slate-100" dir="rtl">
            <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl relative overflow-hidden">
                {/* Header */}
                <div className="text-center mb-5">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-3">
                        {status === 'expired' ? <Lock size={24} /> : <Clock size={24} />}
                    </div>
                    <h2 className="text-lg font-black text-white">
                        {status === 'expired' ? 'انتهت الفترة التجريبية (7 أيام)' : 'ترقية وتفعيل اشتراك المنشأة'}
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                        {status === 'expired'
                            ? 'يرجى تجديد الاشتراك لمتابعة إصدار الفواتير واستخدام الكاشير'
                            : `متبقي في التجربة المجانية: ${daysLeft} أيام`}
                    </p>
                </div>

                {submittedSuccess || status === 'pending_approval' ? (
                    <div className="text-center py-6 space-y-3">
                        <div className="w-14 h-14 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle2 size={32} />
                        </div>
                        <h3 className="text-base font-bold text-white">تم استلام إشعار التحويل بنجاح!</h3>
                        <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                            عمليتك قيد المراجعة حالياً من فريق الإدارة. سيتم تفعيل حسابك فور التحقق خلال مدة أقصاها 24 ساعة.
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSendProof} className="space-y-4 text-xs">
                        {errorMsg && (
                            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center gap-2">
                                <AlertCircle size={15} /> {errorMsg}
                            </div>
                        )}

                        {/* بيانات المحفظة / الحساب للتحويل */}
                        <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-2.5">
                            <span className="text-[11px] text-slate-400 font-bold block">بيانات التحويل المعتمدة:</span>

                            <div className="flex items-center justify-between bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                                <div className="flex items-center gap-2">
                                    <Smartphone size={16} className="text-emerald-400" />
                                    <div>
                                        <p className="text-[10px] text-slate-500">فودافون كاش / إنستاباي:</p>
                                        <p className="font-mono font-bold text-white text-sm">01000000000</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => copyPaymentNumber('01000000000')}
                                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1 text-[10px] transition"
                                >
                                    {copiedNumber ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                                    {copiedNumber ? 'تم النسخ' : 'نسخ الرقم'}
                                </button>
                            </div>

                            <div className="text-[10px] text-slate-500 leading-relaxed">
                                قيمة الاشتراك الشهري: <b className="text-emerald-400">250 ج.م</b> (أو السنوي: <b className="text-emerald-400">2400 ج.م</b> شامل كل التحديثات والدعم).
                            </div>
                        </div>

                        {/* نموذج إدخال بيانات العملية */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-slate-400 block mb-1 font-semibold">رقم الهاتف / الاسم المحول منه:</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="010xxxxxxxx"
                                    value={senderPhone}
                                    onChange={e => setSenderPhone(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="text-slate-400 block mb-1 font-semibold">المبلغ المحول (ج.م):</label>
                                <input
                                    type="number"
                                    required
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                                />
                            </div>
                        </div>

                        {/* رفع سكرين التحويل */}
                        <div>
                            <label className="text-slate-400 block mb-1 font-semibold">صورة إشعار / سكرين التحويل:</label>
                            <div className="relative border-2 border-dashed border-slate-800 hover:border-slate-700 rounded-xl p-3 text-center bg-slate-950 cursor-pointer">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileUpload}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                                <div className="flex flex-col items-center justify-center gap-1">
                                    <UploadCloud size={20} className="text-slate-500" />
                                    <span className="text-[11px] text-slate-400">
                                        {screenshotBase64 ? '✅ تم اختيار صورة الإشعار بنجاح' : 'اضغط لاختيار صورة التحويل من جهازك'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={submitting}
                            className="w-full py-3 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg transition"
                        >
                            {submitting ? 'جارٍ إرسال الإشعار...' : 'تأكيد وإرسال إشعار التحويل'}
                        </Button>
                    </form>
                )}
            </div>
        </div>
    );
}