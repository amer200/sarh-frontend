'use client';

import React, { useState } from 'react';
import api from '@/lib/api';
import { ShieldAlert, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface SubscriptionModalProps {
    appModule?: 'pos' | 'retail' | 'fleet';
    appName?: string;
    price?: number;
    onSuccess?: () => void;
}

export default function SubscriptionModal({
    appModule = 'pos',
    appName = 'صَرْح POS للمطاعم',
    price = 250,
    onSuccess = () => { }
}: SubscriptionModalProps) {
    const currentPrice = price || 250;

    const [formData, setFormData] = useState({
        senderPhoneOrName: '',
        amount: currentPrice.toString(),
        paymentMethod: 'instapay',
        screenshotUrl: '',
        notes: ''
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');
        setMessage('');

        try {
            const payload = {
                appModule,
                senderPhoneOrName: formData.senderPhoneOrName,
                amount: Number(formData.amount) || currentPrice,
                paymentMethod: formData.paymentMethod,
                screenshotUrl: formData.screenshotUrl || 'https://placehold.co/600x400?text=Payment+Receipt',
                notes: formData.notes
            };

            const res = await api.post('/subscriptions/proof', payload);
            setMessage(res.data?.message || 'تم استلام الإشعار وتفعيل مهلة الـ 24 ساعة بنجاح');
            setTimeout(() => {
                onSuccess();
            }, 1500);
        } catch (err: any) {
            setErrorMsg((err.response && err.response.data && err.response.data.error) || 'فشل إرسال إشعار الدفع');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-md" dir="rtl">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl text-xs">

                {/* Header */}
                <div className="text-center space-y-2">
                    <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto shadow-lg">
                        <ShieldAlert size={28} />
                    </div>
                    <h2 className="text-lg font-black text-white">انتهت فترة التجربة أو الاشتراك لتطبيق ({appName})</h2>
                    <p className="text-slate-400 text-xs">
                        لتستمر في استخدام نظام {appName} دون انقطاع، يرجى تحويل مبلغ <span className="text-emerald-400 font-bold font-mono">{currentPrice} ج.م</span> ورفع إيصال الدفع أدناه (سيتم تفعيل مهلة 24 ساعة للعمل فوراً).
                    </p>
                </div>

                {/* Payment Methods Info Box */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 font-mono">
                    <div className="flex justify-between text-slate-400 font-sans">
                        <span>طرق الدفع المتاحة:</span>
                        <span className="text-white font-bold">InstaPay / فودافون كاش</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-300">
                        <span>رقم التحويل / العنوان:</span>
                        <span className="text-blue-400 font-black select-all">sarh.pay@instapay</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-300 pt-1 border-t border-slate-800/80">
                        <span>المطلوب تحويله:</span>
                        <span className="text-emerald-400 font-black text-sm">{currentPrice}.00 ج.م</span>
                    </div>
                </div>

                {message && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl flex items-center gap-2">
                        <CheckCircle2 size={16} /> <span>{message}</span>
                    </div>
                )}

                {errorMsg && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl flex items-center gap-2">
                        <AlertCircle size={16} /> <span>{errorMsg}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-slate-300 block mb-1 font-semibold">رقم الهاتف المحول منه أو اسم صاحب الحساب:</label>
                        <input
                            type="text"
                            required
                            placeholder="مثال: 01012345678 (أو أحمد محمد)"
                            value={formData.senderPhoneOrName}
                            onChange={e => setFormData({ ...formData, senderPhoneOrName: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="text-slate-300 block mb-1 font-semibold">رابط صورة إيصال التحويل (Screenshot URL):</label>
                        <input
                            type="url"
                            required
                            placeholder="https://imgur.com/image.jpg أو رابط الصورة"
                            value={formData.screenshotUrl}
                            onChange={e => setFormData({ ...formData, screenshotUrl: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-mono dir-ltr text-right focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-xl shadow-xl transition active:scale-98"
                    >
                        {loading ? 'جارٍ إرسال الإشعار وتفعيل المهلة...' : 'إرسال إشعار الدفع وتفعيل 24 ساعة سماح فوراً'}
                    </Button>
                </form>

            </div>
        </div>
    );
}