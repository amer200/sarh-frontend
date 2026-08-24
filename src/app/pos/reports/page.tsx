'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import {
    BarChart3, ArrowRight, DollarSign, TrendingUp, Percent,
    Receipt, CreditCard, Banknote, PackageCheck, Calendar
} from 'lucide-react';

export default function PosReportsPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const res = await api.get('/pos/analytics');
                setData(res.data.data);
            } catch (err: any) {
                alert(err.response?.data?.error || 'فشل جلب التقارير المالية');
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, []);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-6 font-sans" dir="rtl">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                    <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                            <BarChart3 size={20} />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-white">التقارير والمؤشرات المالية</h1>
                            <p className="text-xs text-slate-400">تحليل المبيعات، الضرائب المحصلة، والأرباح التقديرية</p>
                        </div>
                    </div>

                    <Link
                        href="/pos"
                        className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                        <ArrowRight size={14} /> العودة للكاشير
                    </Link>
                </div>

                {loading ? (
                    <div className="text-center py-20 text-xs text-slate-500">جارٍ تحليل البيانات المالية...</div>
                ) : (
                    <div className="space-y-6">
                        {/* KPI Cards Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-2">
                                <div className="flex justify-between items-center text-slate-400 text-xs">
                                    <span>إجمالي المبيعات</span>
                                    <DollarSign size={16} className="text-sky-400" />
                                </div>
                                <div className="text-2xl font-black text-white font-mono">{data?.totalRevenue?.toFixed(2) || '0.00'} SAR</div>
                                <div className="text-[10px] text-slate-500">شامل ضريبة القيمة المضافة</div>
                            </div>

                            <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-2">
                                <div className="flex justify-between items-center text-slate-400 text-xs">
                                    <span>صافي الأرباح التقديرية</span>
                                    <TrendingUp size={16} className="text-emerald-400" />
                                </div>
                                <div className="text-2xl font-black text-emerald-400 font-mono">{data?.netProfit?.toFixed(2) || '0.00'} SAR</div>
                                <div className="text-[10px] text-slate-500">بعد خصم التكلفة والضريبة</div>
                            </div>

                            <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-2">
                                <div className="flex justify-between items-center text-slate-400 text-xs">
                                    <span>ضريبة القيمة المضافة (15%)</span>
                                    <Percent size={16} className="text-amber-400" />
                                </div>
                                <div className="text-2xl font-black text-amber-400 font-mono">{data?.totalTax?.toFixed(2) || '0.00'} SAR</div>
                                <div className="text-[10px] text-slate-500">إقرار هيئة الزكاة والضريبة</div>
                            </div>

                            <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-2">
                                <div className="flex justify-between items-center text-slate-400 text-xs">
                                    <span>عدد الفواتير المكتملة</span>
                                    <Receipt size={16} className="text-indigo-400" />
                                </div>
                                <div className="text-2xl font-black text-white font-mono">{data?.totalOrders || 0} عملية</div>
                                <div className="text-[10px] text-slate-500">متوسط الفاتورة: {data?.totalOrders > 0 ? (data?.totalRevenue / data?.totalOrders).toFixed(2) : '0.00'} SAR</div>
                            </div>
                        </div>

                        {/* Payment Methods Split */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4">
                                <h3 className="text-xs font-bold text-white flex items-center gap-2">
                                    <Banknote size={16} className="text-emerald-400" /> توزيع طرق الدفع
                                </h3>
                                <div className="space-y-3 font-mono text-xs">
                                    <div>
                                        <div className="flex justify-between mb-1 text-slate-300">
                                            <span className="font-sans">نقدياً (كاش):</span>
                                            <span>{data?.paymentSplit?.cash?.toFixed(2) || '0.00'} SAR</span>
                                        </div>
                                        <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                                            <div
                                                className="bg-emerald-500 h-full rounded-full"
                                                style={{ width: `${data?.totalRevenue > 0 ? ((data?.paymentSplit?.cash || 0) / data.totalRevenue) * 100 : 0}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex justify-between mb-1 text-slate-300">
                                            <span className="font-sans">شبكة / بطاقات مدى:</span>
                                            <span>{data?.paymentSplit?.card?.toFixed(2) || '0.00'} SAR</span>
                                        </div>
                                        <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                                            <div
                                                className="bg-blue-500 h-full rounded-full"
                                                style={{ width: `${data?.totalRevenue > 0 ? ((data?.paymentSplit?.card || 0) / data.totalRevenue) * 100 : 0}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Top Products */}
                            <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-3">
                                <h3 className="text-xs font-bold text-white flex items-center gap-2">
                                    <PackageCheck size={16} className="text-sky-400" /> الأصناف الأكثر طلباً
                                </h3>
                                <div className="space-y-2">
                                    {data?.topProducts?.length > 0 ? (
                                        data.topProducts.map((prod: any, idx: number) => (
                                            <div key={idx} className="flex justify-between items-center p-2.5 bg-slate-950 rounded-xl text-xs">
                                                <span className="text-slate-300 font-bold">{prod.name}</span>
                                                <div className="font-mono text-slate-400">
                                                    <span className="text-sky-400 font-bold">{prod.quantity} مباع</span> | {prod.totalSales?.toFixed(2)} SAR
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-slate-500 text-xs py-4 text-center">لا توجد بيانات مبيعات كافية</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}