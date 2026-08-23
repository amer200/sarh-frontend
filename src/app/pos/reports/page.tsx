'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    BarChart3, TrendingUp, DollarSign, Receipt, CreditCard,
    Banknote, Calendar, ArrowRight, ArrowUpRight, CheckCircle2,
    FileText, Percent
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function ReportsPage() {
    const router = useRouter();
    const [token, setToken] = useState('');
    const [tenantSubdomain, setTenantSubdomain] = useState('');
    const [analytics, setAnalytics] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return d.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

    useEffect(() => {
        const savedToken = localStorage.getItem('sarh_token');
        const savedSubdomain = localStorage.getItem('sarh_tenant_subdomain') || 'alsarh-express';

        if (!savedToken) {
            router.push('/login');
            return;
        }

        setToken(savedToken);
        setTenantSubdomain(savedSubdomain);
        fetchReports(savedToken, savedSubdomain);
    }, []);

    const getHeaders = (authToken = token, sub = tenantSubdomain) => ({
        'Authorization': `Bearer ${authToken}`,
        'x-tenant-subdomain': sub
    });

    const fetchReports = async (authToken = token, sub = tenantSubdomain) => {
        try {
            setLoading(true);
            const res = await axios.get(`http://localhost:5000/api/v1/pos/analytics?startDate=${startDate}&endDate=${endDate}`, {
                headers: getHeaders(authToken, sub)
            });
            setAnalytics(res.data.data);
        } catch (err: any) {
            if (err.response?.status === 401) {
                localStorage.removeItem('sarh_token');
                router.push('/login');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleFilterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        fetchReports();
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans" dir="rtl">
            {/* Header */}
            <header className="h-16 border-b border-slate-800 bg-slate-900/60 px-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link
                        href="/pos"
                        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-slate-950 border border-slate-800 px-3 py-2 rounded-xl transition"
                    >
                        <ArrowRight size={14} /> العودة لنقاط البيع
                    </Link>
                    <div className="h-4 w-px bg-slate-800" />
                    <div className="flex items-center gap-2">
                        <BarChart3 size={18} className="text-blue-400" />
                        <h1 className="text-sm font-bold text-white">تقارير المبيعات والأرباح</h1>
                    </div>
                </div>

                {/* تصفية التاريخ */}
                <form onSubmit={handleFilterSubmit} className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs">
                        <Calendar size={14} className="text-slate-400" />
                        <input
                            type="date"
                            value={startDate}
                            onChange={e => setStartDate(e.target.value)}
                            className="bg-transparent text-slate-200 focus:outline-none font-mono text-[11px]"
                        />
                        <span className="text-slate-500">-</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={e => setEndDate(e.target.value)}
                            className="bg-transparent text-slate-200 focus:outline-none font-mono text-[11px]"
                        />
                    </div>
                    <Button type="submit" className="text-xs py-1.5 px-3 font-bold">
                        تحديث
                    </Button>
                </form>
            </header>

            {/* المحتوى الرئيسي */}
            <div className="max-w-7xl mx-auto p-6 space-y-6">
                {loading ? (
                    <div className="py-20 text-center text-slate-500 text-xs font-mono">جارٍ استخراج وتجميع التقارير المالية...</div>
                ) : analytics ? (
                    <>
                        {/* KPI Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                                <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                                    <span>إجمالي المبيعات (شامل الضريبة)</span>
                                    <DollarSign size={16} className="text-sky-400" />
                                </div>
                                <h3 className="text-2xl font-black text-white font-mono">{analytics.totalSales.toFixed(2)} SAR</h3>
                                <p className="text-[10px] text-slate-500 mt-2 font-mono">{analytics.totalOrders} فواتير تم إصدارها</p>
                            </div>

                            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                                <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                                    <span>صافي الربح التقديري</span>
                                    <TrendingUp size={16} className="text-emerald-400" />
                                </div>
                                <h3 className="text-2xl font-black text-emerald-400 font-mono">{analytics.netProfit.toFixed(2)} SAR</h3>
                                <p className="text-[10px] text-slate-500 mt-2">بعد خصم التكلفة والضريبة</p>
                            </div>

                            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                                <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                                    <span>إجمالي ضريبة القيمة المضافة (15%)</span>
                                    <Percent size={16} className="text-amber-400" />
                                </div>
                                <h3 className="text-2xl font-black text-amber-400 font-mono">{analytics.totalTax.toFixed(2)} SAR</h3>
                                <p className="text-[10px] text-slate-500 mt-2">مستحقة الإقرار الضريبي</p>
                            </div>

                            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                                <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                                    <span>متوسط قيمة الفاتورة</span>
                                    <Receipt size={16} className="text-blue-400" />
                                </div>
                                <h3 className="text-2xl font-black text-sky-400 font-mono">{analytics.averageOrderValue.toFixed(2)} SAR</h3>
                                <p className="text-[10px] text-slate-500 mt-2">معدل إنفاق العميل</p>
                            </div>
                        </div>

                        {/* صف تحليل طرق الدفع + الأكثر مبيعاً */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* تفصيل طرق الدفع */}
                            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
                                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                    <CreditCard size={16} className="text-blue-400" /> توزيع طرق الدفع
                                </h3>

                                <div className="space-y-3 pt-2">
                                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 flex items-center justify-between font-mono">
                                        <div className="flex items-center gap-2 text-xs text-slate-300 font-sans">
                                            <Banknote size={16} className="text-emerald-400" /> مبيعات كاش
                                        </div>
                                        <span className="font-bold text-white">{analytics.cashSales.toFixed(2)} SAR</span>
                                    </div>

                                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 flex items-center justify-between font-mono">
                                        <div className="flex items-center gap-2 text-xs text-slate-300 font-sans">
                                            <CreditCard size={16} className="text-blue-400" /> مبيعات شبكة / مدى
                                        </div>
                                        <span className="font-bold text-white">{analytics.cardSales.toFixed(2)} SAR</span>
                                    </div>
                                </div>
                            </div>

                            {/* الأكثر مبيعاً */}
                            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
                                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                    <ArrowUpRight size={16} className="text-emerald-400" /> الأصناف الأكثر طلباً ومبيعاً
                                </h3>

                                <div className="space-y-2 pt-2">
                                    {analytics.topProducts.length === 0 ? (
                                        <div className="text-xs text-slate-500 text-center py-6">لا توجد مبيعات مسجلة في هذه الفترة</div>
                                    ) : (
                                        analytics.topProducts.map((p: any, idx: number) => (
                                            <div key={idx} className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                                                <div className="flex items-center gap-3">
                                                    <span className="w-6 h-6 rounded-lg bg-slate-800 text-slate-400 text-xs font-mono font-bold flex items-center justify-center">
                                                        {idx + 1}
                                                    </span>
                                                    <span className="text-xs font-bold text-white">{p.name}</span>
                                                </div>
                                                <div className="flex items-center gap-4 text-xs font-mono">
                                                    <span className="text-slate-400">الكمية: <b className="text-white">{p.quantitySold}</b></span>
                                                    <span className="text-sky-400 font-bold">{p.revenue.toFixed(2)} SAR</span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* سجل الفواتير السابقة */}
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                            <div className="p-4 border-b border-slate-800 flex items-center gap-2">
                                <FileText size={16} className="text-blue-400" />
                                <h3 className="text-sm font-bold text-white">سجل الفواتير الصادرة</h3>
                            </div>

                            <table className="w-full text-right text-xs">
                                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold">
                                    <tr>
                                        <th className="py-3 px-4">رقم الفاتورة</th>
                                        <th className="py-3 px-4">التاريخ والوقت</th>
                                        <th className="py-3 px-4">الكاشير</th>
                                        <th className="py-3 px-4">طريقة الدفع</th>
                                        <th className="py-3 px-4">عدد الأصناف</th>
                                        <th className="py-3 px-4">الإجمالي</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/60 font-mono">
                                    {analytics.orders.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="py-10 text-center text-slate-500 font-sans">
                                                لم يتم العثور على أي فواتير في هذه الفترة
                                            </td>
                                        </tr>
                                    ) : (
                                        analytics.orders.map((order: any) => (
                                            <tr key={order._id} className="hover:bg-slate-800/30 transition">
                                                <td className="py-3.5 px-4 font-bold text-white">{order.invoiceNumber}</td>
                                                <td className="py-3.5 px-4 text-slate-400">
                                                    {new Date(order.createdAt).toLocaleString('en-US', { hour12: true, month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' })}
                                                </td>
                                                <td className="py-3.5 px-4 font-sans text-slate-300">{order.cashierName}</td>
                                                <td className="py-3.5 px-4">
                                                    <span className="uppercase text-[10px] px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300">
                                                        {order.financials?.paymentMethod}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-4 text-slate-400 font-sans">{order.items?.length} أصناف</td>
                                                <td className="py-3.5 px-4 font-bold text-sky-400">
                                                    {order.financials?.totalAmount.toFixed(2)} SAR
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </>
                ) : null}
            </div>
        </div>
    );
}