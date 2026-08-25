'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { CheckCircle2, XCircle, ShieldCheck, Eye } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function AdminSubscriptionsPage() {
    const [proofs, setProofs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const fetchProofs = async () => {
        try {
            const res = await api.get('/subscriptions/admin/pending');
            setProofs(res.data.data);
        } catch (err: any) {
            alert(err.response?.data?.error || 'فشل جلب الطلبات');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProofs();
    }, []);

    const handleApprove = async (proofId: string, months: number) => {
        if (!confirm(`تأكيد تفعيل المنشأة لمدة ${months} شهر؟`)) return;

        try {
            await api.post('/subscriptions/admin/approve', { proofId, durationMonths: months });
            alert('تم تفعيل الاشتراك بنجاح!');
            fetchProofs();
        } catch (err: any) {
            alert(err.response?.data?.error || 'فشل الاعتماد');
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-6 font-sans" dir="rtl">
            <div className="max-w-5xl mx-auto space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                    <div>
                        <h1 className="text-xl font-bold text-white flex items-center gap-2">
                            <ShieldCheck className="text-emerald-400" /> مراجعة واعتماد تحويلات المشتركين
                        </h1>
                        <p className="text-xs text-slate-400">إشعارات التحويل المعلقة وتفعيل حسابات المتاجر</p>
                    </div>
                    <span className="text-xs px-3 py-1 bg-slate-900 border border-slate-800 rounded-full font-mono text-emerald-400 font-bold">
                        {proofs.length} طلبات معلقة
                    </span>
                </div>

                {loading ? (
                    <div className="text-center py-20 text-xs text-slate-500">جارٍ تحميل الطلبات...</div>
                ) : proofs.length === 0 ? (
                    <div className="text-center py-20 text-xs text-slate-500 bg-slate-900/40 rounded-3xl border border-slate-800">
                        لا توجد طلبات تحويل معلقة حالياً
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {proofs.map(proof => (
                            <div key={proof._id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 text-xs">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-white text-sm">{proof.tenantId?.name}</h3>
                                        <p className="text-[11px] text-slate-400 font-mono">{proof.tenantId?.subdomain}.sarh.cloud</p>
                                        <p className="text-[11px] text-slate-400">هاتف: {proof.tenantId?.phone}</p>
                                    </div>
                                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-lg font-mono font-bold">
                                        {proof.amount} ج.م
                                    </span>
                                </div>

                                <div className="p-3 bg-slate-950 rounded-xl space-y-1 text-slate-400">
                                    <div className="flex justify-between">
                                        <span>المحول منه:</span>
                                        <span className="text-white font-mono">{proof.senderPhoneOrName}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>الطريقة:</span>
                                        <span className="text-white uppercase font-mono">{proof.paymentMethod}</span>
                                    </div>
                                </div>

                                {/* زر معاينة السكرين */}
                                <button
                                    type="button"
                                    onClick={() => setSelectedImage(proof.screenshotUrl)}
                                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl flex items-center justify-center gap-1.5 font-bold transition"
                                >
                                    <Eye size={14} /> معاينة إشعار التحويل
                                </button>

                                {/* أزرار التفعيل */}
                                <div className="grid grid-cols-2 gap-2 pt-1">
                                    <Button
                                        onClick={() => handleApprove(proof._id, 1)}
                                        className="bg-emerald-600 hover:bg-emerald-500 text-xs py-2 font-bold"
                                    >
                                        تفعيل شهر (1 Month)
                                    </Button>
                                    <Button
                                        onClick={() => handleApprove(proof._id, 12)}
                                        className="bg-blue-600 hover:bg-blue-500 text-xs py-2 font-bold"
                                    >
                                        تفعيل سنة (1 Year)
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* نافذة تكبير صورة الإيصال */}
                {selectedImage && (
                    <div
                        onClick={() => setSelectedImage(null)}
                        className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 cursor-pointer"
                    >
                        <img
                            src={selectedImage}
                            alt="Receipt"
                            className="max-h-[85vh] max-w-full rounded-2xl shadow-2xl object-contain border border-slate-700"
                        />
                    </div>
                )}
            </div>
        </div>
    );
}