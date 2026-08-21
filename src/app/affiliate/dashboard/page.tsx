'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import {
    DollarSign,
    Users,
    Clock,
    TrendingUp,
    Copy,
    Check,
    LogOut,
    Building2,
    ArrowUpRight
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function AffiliateDashboard() {
    const router = useRouter();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const fetchDashboard = async () => {
            const token = localStorage.getItem('sarh_token');
            if (!token) {
                router.push('/login');
                return;
            }

            try {
                const res = await axios.get('http://localhost:5000/api/v1/affiliates/dashboard', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setData(res.data.data);
            } catch {
                localStorage.removeItem('sarh_token');
                router.push('/login');
            } finally {
                setLoading(false);
            }
        };

        fetchDashboard();
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem('sarh_token');
        localStorage.removeItem('sarh_user');
        router.push('/login');
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
                جاري تحميل بيانات اللوحة السحابية...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Top Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h1 className="text-2xl font-bold text-white">مرحباً، {data?.profile?.fullName}</h1>
                            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400">
                                عمولة دائمة {data?.profile?.commissionRate}
                            </span>
                        </div>
                        <p className="text-sm text-slate-400">تابع أداء المنشآت المشتركة عبر رابطك وسجل أرباحك لحظياً</p>
                    </div>

                    <Button variant="secondary" onClick={handleLogout} className="text-sm py-2 px-4 gap-2 self-start md:self-auto">
                        <LogOut size={16} /> تسجيل الخروج
                    </Button>
                </div>

                {/* Affiliate Link Banner */}
                <div className="bg-gradient-to-r from-blue-900/30 via-slate-900 to-slate-900 border border-blue-500/30 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                        <div className="text-xs text-blue-400 font-semibold mb-1">رابط الإحالة الخاص بك للنشر:</div>
                        <div className="font-mono text-sm text-slate-200 dir-ltr text-right truncate">
                            {data?.profile?.referralLink}
                        </div>
                    </div>
                    <Button
                        onClick={() => copyToClipboard(data?.profile?.referralLink)}
                        className="py-2.5 px-6 shrink-0 gap-2 text-sm"
                    >
                        {copied ? <Check size={16} className="text-emerald-300" /> : <Copy size={16} />}
                        {copied ? 'تم النسخ!' : 'نسخ رابط التسويق'}
                    </Button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
                        <div className="flex items-center justify-between text-slate-400 mb-3">
                            <span className="text-xs font-medium">الرصيد المتاح للسحب</span>
                            <DollarSign size={18} className="text-emerald-400" />
                        </div>
                        <div className="text-2xl font-bold text-white">
                            {data?.wallet?.currentBalance || 0} <span className="text-sm font-normal text-slate-400">SAR</span>
                        </div>
                    </div>

                    <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
                        <div className="flex items-center justify-between text-slate-400 mb-3">
                            <span className="text-xs font-medium">إجمالي المسجلين</span>
                            <Users size={18} className="text-blue-400" />
                        </div>
                        <div className="text-2xl font-bold text-white">{data?.stats?.totalReferred}</div>
                    </div>

                    <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
                        <div className="flex items-center justify-between text-slate-400 mb-3">
                            <span className="text-xs font-medium">اشتراكات نشطة (مدفوعة)</span>
                            <TrendingUp size={18} className="text-emerald-400" />
                        </div>
                        <div className="text-2xl font-bold text-white">{data?.stats?.activeSubscriptions}</div>
                    </div>

                    <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
                        <div className="flex items-center justify-between text-slate-400 mb-3">
                            <span className="text-xs font-medium">في الفترة التجريبية (7 أيام)</span>
                            <Clock size={18} className="text-amber-400" />
                        </div>
                        <div className="text-2xl font-bold text-white">{data?.stats?.inTrial}</div>
                    </div>
                </div>

                {/* Referred Tenants Table */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
                    <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                        <h2 className="font-bold text-white flex items-center gap-2">
                            <Building2 size={18} className="text-blue-400" /> المنشآت المسجلة عبرك
                        </h2>
                        <span className="text-xs text-slate-400">{data?.tenantsList?.length || 0} منشأة</span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-right text-sm">
                            <thead className="bg-slate-950/50 text-slate-400 text-xs border-b border-slate-800">
                                <tr>
                                    <th className="p-4">اسم المنشأة</th>
                                    <th className="p-4">النطاق السحابي</th>
                                    <th className="p-4">الدولة</th>
                                    <th className="p-4">حالة الاشتراك</th>
                                    <th className="p-4">تاريخ الانضمام</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60">
                                {data?.tenantsList?.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-slate-500">
                                            لم يسجل أي عميل عبر رابطك بعد. شارك رابط الإحالة لتبدأ احتساب العمولات.
                                        </td>
                                    </tr>
                                ) : (
                                    data?.tenantsList?.map((tenant: any) => (
                                        <tr key={tenant._id} className="hover:bg-slate-800/30 transition">
                                            <td className="p-4 font-semibold text-white">{tenant.name}</td>
                                            <td className="p-4 font-mono text-blue-400 dir-ltr text-right">
                                                {tenant.subdomain}.sarh.cloud
                                            </td>
                                            <td className="p-4 text-slate-300">{tenant.country}</td>
                                            <td className="p-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tenant.subscription.status === 'active'
                                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                                    }`}>
                                                    {tenant.subscription.status === 'active' ? 'اشتراك مدفوع' : 'فترة تجريبية'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-slate-400 text-xs">
                                                {new Date(tenant.createdAt).toLocaleDateString('ar-EG')}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}