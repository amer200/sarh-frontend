'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import {
    ShieldAlert, Store, DollarSign, Users, Clock,
    CheckCircle2, AlertCircle, Eye, Search,
    ShieldCheck, RefreshCw, Power, Award, ArrowUpRight
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function AdminDashboardPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'overview' | 'tenants' | 'proofs' | 'affiliates'>('overview');

    // Data States
    const [stats, setStats] = useState<any>(null);
    const [tenants, setTenants] = useState<any[]>([]);
    const [proofs, setProofs] = useState<any[]>([]);
    const [affiliates, setAffiliates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProofImg, setSelectedProofImg] = useState<string | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [statsRes, tenantsRes, proofsRes, affRes] = await Promise.all([
                api.get('/admin/stats'),
                api.get('/admin/tenants'),
                api.get('/subscriptions/admin/pending'),
                api.get('/admin/affiliates')
            ]);

            setStats(statsRes.data.data);
            setTenants(tenantsRes.data.data);
            setProofs(proofsRes.data.data);
            setAffiliates(affRes.data.data);
        } catch (err: any) {
            if (err.response?.status === 403 || err.response?.status === 401) {
                alert('غير مصرح لك بالدخول إلى هذه اللوحة');
                router.push('/login');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // تنفيذ إجراء على منشأة
    const handleTenantAction = async (tenantId: string, action: string, days?: number, plan?: string) => {
        try {
            await api.patch(`/admin/tenants/${tenantId}/subscription`, { action, days, plan });
            alert('تم تحديث حالة المنشأة بنجاح');
            fetchData();
        } catch (err: any) {
            alert(err.response?.data?.error || 'فشل التحديث');
        }
    };

    // اعتماد تحويل بنكي
    const handleApproveProof = async (proofId: string, months: number) => {
        if (!confirm(`تأكيد تفعيل المنشأة لمدة ${months} شهر؟`)) return;
        try {
            await api.post('/subscriptions/admin/approve', { proofId, durationMonths: months });
            alert('تم اعتماد الاشتراك بنجاح');
            fetchData();
        } catch (err: any) {
            alert(err.response?.data?.error || 'فشل الاعتماد');
        }
    };

    const filteredTenants = tenants.filter(t =>
        t.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.subdomain?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.phone?.includes(searchTerm)
    );

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-6 font-sans selection:bg-blue-600 selection:text-white" dir="rtl">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shadow-lg">
                            <ShieldCheck size={26} />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-white flex items-center gap-2">
                                لوحة الإدارة المركزية (Super Admin)
                            </h1>
                            <p className="text-xs text-slate-400">التحكم الشامل في المتاجر، الاشتراكات، والمسوقين</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={fetchData}
                            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
                            title="تحديث البيانات"
                        >
                            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        </button>
                        <Button
                            onClick={() => router.push('/pos')}
                            className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs py-2.5 px-4 rounded-xl font-bold"
                        >
                            الذهاب للكاشير <ArrowUpRight size={14} />
                        </Button>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800 max-w-xl">
                    {[
                        { id: 'overview', label: 'الإحصائيات الكلية', icon: Award },
                        { id: 'tenants', label: `المتاجر (${tenants.length})`, icon: Store },
                        { id: 'proofs', label: `إشعارات الدفع (${proofs.length})`, icon: DollarSign },
                        { id: 'affiliates', label: `المسوقين (${affiliates.length})`, icon: Users },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${activeTab === tab.id
                                    ? 'bg-blue-600 text-white shadow-lg'
                                    : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            <tab.icon size={15} /> {tab.label}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="text-center py-28 text-slate-500 text-xs">جارٍ جلب وتحديث بيانات المنصة...</div>
                ) : (
                    <>
                        {/* TAB 1: OVERVIEW */}
                        {activeTab === 'overview' && stats && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-2">
                                        <span className="text-xs text-slate-400 font-semibold flex items-center gap-1.5">
                                            <Store size={15} className="text-blue-400" /> إجمالي المتاجر
                                        </span>
                                        <p className="text-2xl font-black text-white font-mono">{stats.totalTenants}</p>
                                        <div className="text-[11px] text-slate-500 flex gap-2">
                                            <span className="text-emerald-400">{stats.activeTenants} نشط</span> •
                                            <span className="text-amber-400">{stats.trialTenants} تجريبي</span>
                                        </div>
                                    </div>

                                    <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-2">
                                        <span className="text-xs text-slate-400 font-semibold flex items-center gap-1.5">
                                            <DollarSign size={15} className="text-emerald-400" /> إجمالي الإيرادات المحصلة
                                        </span>
                                        <p className="text-2xl font-black text-emerald-400 font-mono">{stats.totalRevenue} ج.م</p>
                                        <p className="text-[11px] text-slate-500">من التحويلات المعتمدة</p>
                                    </div>

                                    <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-2">
                                        <span className="text-xs text-slate-400 font-semibold flex items-center gap-1.5">
                                            <Clock size={15} className="text-amber-400" /> طلبات تحويل معلقة
                                        </span>
                                        <p className="text-2xl font-black text-amber-400 font-mono">{stats.pendingProofs}</p>
                                        <p className="text-[11px] text-slate-500">تنتظر المراجعة والتفعيل</p>
                                    </div>

                                    <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-2">
                                        <span className="text-xs text-slate-400 font-semibold flex items-center gap-1.5">
                                            <Users size={15} className="text-indigo-400" /> المسوقين والشركاء
                                        </span>
                                        <p className="text-2xl font-black text-white font-mono">{stats.totalAffiliates}</p>
                                        <p className="text-[11px] text-slate-500">مسوق مسجل في النظام</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 2: TENANTS LIST */}
                        {activeTab === 'tenants' && (
                            <div className="space-y-4">
                                <div className="relative max-w-md">
                                    <Search className="absolute right-3.5 top-3 text-slate-500" size={16} />
                                    <input
                                        type="text"
                                        placeholder="ابحث باسم المتجر أو النطاق أو الهاتف..."
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-800 rounded-xl pr-10 pl-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                                    />
                                </div>

                                <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl text-xs">
                                    <table className="w-full text-right">
                                        <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 text-[11px]">
                                            <tr>
                                                <th className="p-4">اسم المنشأة</th>
                                                <th className="p-4">النطاق (Subdomain)</th>
                                                <th className="p-4">الهاتف</th>
                                                <th className="p-4">حالة الاشتراك</th>
                                                <th className="p-4">التحكم والإجراءات</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800/60">
                                            {filteredTenants.map(t => (
                                                <tr key={t._id} className="hover:bg-slate-800/30 transition">
                                                    <td className="p-4 font-bold text-white">{t.name}</td>
                                                    <td className="p-4 font-mono text-slate-400">{t.subdomain}</td>
                                                    <td className="p-4 font-mono text-slate-300">{t.phone || '-'}</td>
                                                    <td className="p-4">
                                                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${t.subscription?.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                                                t.subscription?.status === 'trial' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                                                    'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                                            }`}>
                                                            {t.subscription?.status === 'active' ? 'مفعل (نشط)' :
                                                                t.subscription?.status === 'trial' ? 'تجربة مجانية' : 'منتهي / مجمد'}
                                                        </span>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-1.5">
                                                            <button
                                                                onClick={() => handleTenantAction(t._id, 'extend_trial', 7)}
                                                                className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg text-[10px] font-bold border border-amber-500/20"
                                                            >
                                                                +7 أيام تجربة
                                                            </button>
                                                            <button
                                                                onClick={() => handleTenantAction(t._id, 'activate_manual', 0, 'monthly')}
                                                                className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg text-[10px] font-bold border border-emerald-500/20"
                                                            >
                                                                تفعيل شهر
                                                            </button>
                                                            <button
                                                                onClick={() => handleTenantAction(t._id, 'freeze')}
                                                                className="px-2 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg text-[10px] font-bold border border-rose-500/20"
                                                            >
                                                                تجميد
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* TAB 3: PAYMENT PROOFS */}
                        {activeTab === 'proofs' && (
                            <div className="space-y-4">
                                {proofs.length === 0 ? (
                                    <div className="text-center py-20 bg-slate-900 rounded-3xl border border-slate-800 text-slate-500 text-xs">
                                        لا توجد إشعارات تحويل معلقة حالياً
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {proofs.map(p => (
                                            <div key={p._id} className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-3 text-xs">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h3 className="font-bold text-white text-sm">{p.tenantId?.name}</h3>
                                                        <p className="text-[11px] text-slate-400 font-mono">{p.tenantId?.subdomain}.sarh.cloud</p>
                                                    </div>
                                                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-lg font-mono font-bold">
                                                        {p.amount} ج.م
                                                    </span>
                                                </div>

                                                <div className="p-3 bg-slate-950 rounded-xl space-y-1 text-slate-400 text-[11px]">
                                                    <div className="flex justify-between">
                                                        <span>المحول منه:</span>
                                                        <span className="text-white font-mono">{p.senderPhoneOrName}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>طريقة الدفع:</span>
                                                        <span className="text-white font-mono uppercase">{p.paymentMethod}</span>
                                                    </div>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedProofImg(p.screenshotUrl)}
                                                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl flex items-center justify-center gap-1.5 font-bold transition"
                                                >
                                                    <Eye size={14} /> معاينة صورة الإيصال
                                                </button>

                                                <div className="grid grid-cols-2 gap-2 pt-1">
                                                    <Button
                                                        onClick={() => handleApproveProof(p._id, 1)}
                                                        className="bg-emerald-600 hover:bg-emerald-500 text-xs py-2 font-bold"
                                                    >
                                                        تفعيل شهر
                                                    </Button>
                                                    <Button
                                                        onClick={() => handleApproveProof(p._id, 12)}
                                                        className="bg-blue-600 hover:bg-blue-500 text-xs py-2 font-bold"
                                                    >
                                                        تفعيل سنة
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* TAB 4: AFFILIATES */}
                        {activeTab === 'affiliates' && (
                            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl text-xs">
                                <table className="w-full text-right">
                                    <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px]">
                                        <tr>
                                            <th className="p-4">اسم المسوق</th>
                                            <th className="p-4">البريد الإلكتروني</th>
                                            <th className="p-4">كود الإحالة</th>
                                            <th className="p-4">رصيد الأرباح</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/60">
                                        {affiliates.map(aff => (
                                            <tr key={aff._id} className="hover:bg-slate-800/30 transition">
                                                <td className="p-4 font-bold text-white">{aff.name}</td>
                                                <td className="p-4 font-mono text-slate-400">{aff.email}</td>
                                                <td className="p-4 font-mono text-emerald-400 font-bold">{aff.referralCode || '-'}</td>
                                                <td className="p-4 font-mono text-white font-bold">{aff.balance || 0} ج.م</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}

                {/* Modal صورة الإشعار المكبرة */}
                {selectedProofImg && (
                    <div
                        onClick={() => setSelectedProofImg(null)}
                        className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 cursor-pointer"
                    >
                        <img
                            src={selectedProofImg}
                            alt="Receipt"
                            className="max-h-[85vh] max-w-full rounded-2xl shadow-2xl object-contain border border-slate-700"
                        />
                    </div>
                )}

            </div>
        </div>
    );
}