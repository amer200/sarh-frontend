'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import {
    ShieldCheck, Store, DollarSign, Users, Clock,
    AlertCircle, Eye, Search, RefreshCw, Power,
    Award, ArrowUpRight, CheckCircle2, XCircle,
    Filter, TrendingUp, MessageCircle, Sliders,
    Layers, AlertTriangle, ChevronRight, Phone
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Tenant {
    _id: string;
    name: string;
    subdomain: string;
    phone?: string;
    isActive: boolean;
    allowedModules?: string[];
    maxBranches?: number;
    maxCashiers?: number;
    subscription?: {
        status: 'trial' | 'active' | 'expired';
        plan: string;
        trialEndsAt?: string;
        expiresAt?: string;
    };
    createdAt: string;
}

interface PaymentProof {
    _id: string;
    tenantId: { _id: string; name: string; subdomain: string; phone?: string };
    amount: number;
    senderPhoneOrName: string;
    paymentMethod: string;
    screenshotUrl: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: string;
}

const AVAILABLE_MODULES = [
    { key: 'pos', name: 'الكاشير السريع (POS)', desc: 'إصدار الفواتير وطباعة الإيصالات' },
    { key: 'retail', name: 'إدارة التجزئة والمستودعات', desc: 'تحويلات المخزون بين الفروع' },
    { key: 'zatca', name: 'الفوترة الإلكترونية (ZATCA/ETA)', desc: 'تشفير الفواتير وQR Code' },
    { key: 'kitchen', name: 'شاشة المطبخ (KDS)', desc: 'إرسال طلبات المطاعم للمطبخ لحظياً' },
    { key: 'reports', name: 'التقارير المحاسبية المتقدمة', desc: 'تحليل الأرباح والتدفقات النقدية' }
];

export default function SuperAdminDashboard() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'overview' | 'tenants' | 'radar' | 'proofs' | 'affiliates'>('overview');

    // Data States
    const [stats, setStats] = useState<any>(null);
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [expiringTenants, setExpiringTenants] = useState<Tenant[]>([]);
    const [proofs, setProofs] = useState<PaymentProof[]>([]);
    const [affiliates, setAffiliates] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Filters
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    // Modals
    const [selectedProofImg, setSelectedProofImg] = useState<string | null>(null);
    const [rejectionModal, setRejectionModal] = useState<{ open: boolean; proofId: string | null; reason: string }>({
        open: false,
        proofId: null,
        reason: ''
    });
    const [quotaModal, setQuotaModal] = useState<{
        open: boolean;
        tenant: Tenant | null;
        modules: string[];
        branches: number;
        cashiers: number;
    }>({
        open: false,
        tenant: null,
        modules: [],
        branches: 1,
        cashiers: 1
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [statsRes, tenantsRes, expiringRes, proofsRes, affRes] = await Promise.all([
                api.get('/admin/stats'),
                api.get('/admin/tenants'),
                api.get('/admin/tenants/expiring'),
                api.get('/subscriptions/admin/pending'),
                api.get('/admin/affiliates')
            ]);

            setStats(statsRes.data.data);
            setTenants(tenantsRes.data.data);
            setExpiringTenants(expiringRes.data.data);
            setProofs(proofsRes.data.data);
            setAffiliates(affRes.data.data);
        } catch (err: any) {
            if (err.response?.status === 401 || err.response?.status === 403) {
                localStorage.removeItem('sarh_token');
                router.replace('/login');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // 1. إجراءات تمديد وتفعيل وتجميد
    const handleTenantAction = async (tenantId: string, action: string, days = 7, plan = 'monthly') => {
        setActionLoading(tenantId);
        try {
            await api.patch(`/admin/tenants/${tenantId}/subscription`, { action, days, plan });
            await fetchData();
        } catch (err: any) {
            alert(err.response?.data?.error || 'فشلت معالجة الطلب');
        } finally {
            setActionLoading(null);
        }
    };

    // 2. الدخول كعميل (Impersonation)
    const handleImpersonate = async (tenantId: string) => {
        try {
            const res = await api.post(`/admin/tenants/${tenantId}/impersonate`);
            if (res.data?.data) {
                const { token, user } = res.data.data;
                localStorage.setItem('sarh_token', token);
                localStorage.setItem('sarh_user', JSON.stringify(user));
                if (user.tenantId?.subdomain) {
                    localStorage.setItem('sarh_tenant_subdomain', user.tenantId.subdomain);
                }
                window.open('/dashboard', '_blank');
            }
        } catch (err: any) {
            alert(err.response?.data?.error || 'تعذر الدخول لحساب المتجر');
        }
    };

    // 3. حفظ الحصص والتراخيص
    const handleSaveQuotas = async () => {
        if (!quotaModal.tenant) return;
        setActionLoading(quotaModal.tenant._id);
        try {
            await api.patch(`/admin/tenants/${quotaModal.tenant._id}/quotas`, {
                allowedModules: quotaModal.modules,
                maxBranches: quotaModal.branches,
                maxCashiers: quotaModal.cashiers
            });
            setQuotaModal({ open: false, tenant: null, modules: [], branches: 1, cashiers: 1 });
            await fetchData();
        } catch (err: any) {
            alert(err.response?.data?.error || 'فشل حفظ الحصص');
        } finally {
            setActionLoading(null);
        }
    };

    // 4. توليد رابط WhatsApp للإنقاذ من الـ Churn
    const openWhatsAppRenewal = (tenant: Tenant) => {
        const rawPhone = tenant.phone || '';
        const cleanPhone = rawPhone.replace(/\D/g, '');
        const targetPhone = cleanPhone.startsWith('0') ? `2${cleanPhone}` : cleanPhone;

        const isTrial = tenant.subscription?.status === 'trial';
        const expiryDate = tenant.subscription?.expiresAt
            ? new Date(tenant.subscription.expiresAt).toLocaleDateString('ar-EG')
            : tenant.subscription?.trialEndsAt
                ? new Date(tenant.subscription.trialEndsAt).toLocaleDateString('ar-EG')
                : 'اليوم';

        const text = `مرحباً أستاذ إدارة متجر (${tenant.name}) 👋\nمعكم إدارة منصة صَرْح السحابية.\nنود إحاطتكم علماً بأن فترة ${isTrial ? 'التجربة المجانية' : 'الاشتراك'} الخاصة بنقاط البيع تنتهي بتاريخ (${expiryDate}).\nلضمان استمرار عمل الكاشير والفواتير دون توقف، يمكنك تجديد الاشتراك بسهولة مع خصم خاص للمشتركين المستمرين.\nرابط منصتكم: https://${tenant.subdomain}.sarh.cloud`;

        window.open(`https://wa.me/${targetPhone}?text=${encodeURIComponent(text)}`, '_blank');
    };

    // فلترة المتاجر
    const filteredTenants = useMemo(() => {
        return tenants.filter(t => {
            const matchesSearch =
                t.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                t.subdomain?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                t.phone?.includes(searchTerm);

            const matchesStatus =
                statusFilter === 'all' ||
                (statusFilter === 'active' && t.subscription?.status === 'active') ||
                (statusFilter === 'trial' && t.subscription?.status === 'trial') ||
                (statusFilter === 'expired' && (t.subscription?.status === 'expired' || !t.isActive));

            return matchesSearch && matchesStatus;
        });
    }, [tenants, searchTerm, statusFilter]);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 font-sans selection:bg-blue-600 selection:text-white" dir="rtl">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
                    <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/30 text-blue-400 flex items-center justify-center shadow-inner">
                            <ShieldCheck size={28} />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-white tracking-wide">
                                منصة صَرْح السحابية • الإدارة المركزية
                            </h1>
                            <p className="text-xs text-slate-400">إدارة الـ SaaS Unit Economics، تقليل الـ Churn، والتحكم في تراخيص المتاجر</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <button
                            onClick={fetchData}
                            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
                            title="تحديث البيانات"
                        >
                            <RefreshCw size={16} className={loading ? 'animate-spin text-blue-400' : ''} />
                        </button>
                        <Button
                            onClick={() => window.open('/pos', '_blank')}
                            className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs py-2.5 px-4 rounded-xl font-bold flex items-center gap-1.5"
                        >
                            واجهة الكاشير <ArrowUpRight size={14} />
                        </Button>
                        <button
                            onClick={() => { localStorage.clear(); router.replace('/login'); }}
                            className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition"
                            title="تسجيل الخروج"
                        >
                            <Power size={16} />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex flex-wrap bg-slate-900 p-1.5 rounded-2xl border border-slate-800 max-w-3xl gap-1">
                    {[
                        { id: 'overview', label: 'المؤشرات الكلية', icon: Award },
                        { id: 'tenants', label: `المتاجر (${tenants.length})`, icon: Store },
                        { id: 'radar', label: `رادار التجديد (${expiringTenants.length})`, icon: AlertTriangle, highlight: expiringTenants.length > 0 },
                        { id: 'proofs', label: `إشعارات التحويل (${proofs.length})`, icon: DollarSign },
                        { id: 'affiliates', label: `المسوقين (${affiliates.length})`, icon: Users },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${activeTab === tab.id
                                    ? 'bg-blue-600 text-white shadow-lg'
                                    : tab.highlight
                                        ? 'text-amber-400 hover:text-amber-300 bg-amber-500/10'
                                        : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            <tab.icon size={15} /> {tab.label}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="text-center py-28 text-slate-500 text-xs flex flex-col items-center gap-3">
                        <RefreshCw size={24} className="animate-spin text-blue-500" />
                        <span>جارٍ تحميل قاعدة بيانات صرح المركزية...</span>
                    </div>
                ) : (
                    <>
                        {/* TAB 1: OVERVIEW */}
                        {activeTab === 'overview' && stats && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-2">
                                        <span className="text-xs text-slate-400 font-semibold flex items-center gap-1.5">
                                            <DollarSign size={16} className="text-emerald-400" /> الدخل المتكرر (MRR)
                                        </span>
                                        <p className="text-2xl font-black text-emerald-400 font-mono">
                                            {(stats.mrr || 0).toLocaleString()} ج.م
                                        </p>
                                        <p className="text-[11px] text-slate-500">إيرادات آخر 30 يوماً</p>
                                    </div>

                                    <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-2">
                                        <span className="text-xs text-slate-400 font-semibold flex items-center gap-1.5">
                                            <TrendingUp size={16} className="text-blue-400" /> معدل التحويل (Conversion)
                                        </span>
                                        <p className="text-2xl font-black text-white font-mono">%{stats.conversionRate}</p>
                                        <p className="text-[11px] text-slate-500">من التجربة المجانية إلى الاشتراك</p>
                                    </div>

                                    <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-2">
                                        <span className="text-xs text-slate-400 font-semibold flex items-center gap-1.5">
                                            <Store size={16} className="text-indigo-400" /> إجمالي المنشآت
                                        </span>
                                        <p className="text-2xl font-black text-white font-mono">{stats.totalTenants}</p>
                                        <div className="text-[11px] text-slate-500 flex gap-2">
                                            <span className="text-emerald-400">{stats.activeTenants} نشط</span> •
                                            <span className="text-amber-400">{stats.trialTenants} تجريبي</span>
                                        </div>
                                    </div>

                                    <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-2">
                                        <span className="text-xs text-slate-400 font-semibold flex items-center gap-1.5">
                                            <AlertTriangle size={16} className="text-amber-400" /> مهددة بالإيقاف (4 أيام)
                                        </span>
                                        <p className="text-2xl font-black text-amber-400 font-mono">{expiringTenants.length}</p>
                                        <p className="text-[11px] text-slate-500">تتطلب تواصل عاجل عبر واتساب</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 2: TENANTS LIST */}
                        {activeTab === 'tenants' && (
                            <div className="space-y-4">
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                                    <div className="relative w-full sm:max-w-md">
                                        <Search className="absolute right-3.5 top-3 text-slate-500" size={16} />
                                        <input
                                            type="text"
                                            placeholder="ابحث باسم المتجر، النطاق الفرعي، أو الهاتف..."
                                            value={searchTerm}
                                            onChange={e => setSearchTerm(e.target.value)}
                                            className="w-full bg-slate-900 border border-slate-800 rounded-xl pr-10 pl-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 transition"
                                        />
                                    </div>

                                    <div className="flex items-center gap-2 w-full sm:w-auto">
                                        <Filter size={14} className="text-slate-500" />
                                        <select
                                            value={statusFilter}
                                            onChange={e => setStatusFilter(e.target.value)}
                                            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
                                        >
                                            <option value="all">كل الحالات</option>
                                            <option value="active">مفعل فقط</option>
                                            <option value="trial">تجريبي فقط</option>
                                            <option value="expired">مجمد / منتهي</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl text-xs">
                                    <table className="w-full text-right border-collapse">
                                        <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px]">
                                            <tr>
                                                <th className="p-4">اسم المنشأة</th>
                                                <th className="p-4">النطاق</th>
                                                <th className="p-4">الحالة</th>
                                                <th className="p-4">الحصص (فروع/كاشير)</th>
                                                <th className="p-4 text-center">التحكم والتراخيص</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800/60">
                                            {filteredTenants.map(t => (
                                                <tr key={t._id} className="hover:bg-slate-800/30 transition">
                                                    <td className="p-4 font-bold text-white">{t.name}</td>
                                                    <td className="p-4 font-mono text-slate-400">{t.subdomain}.sarh.cloud</td>
                                                    <td className="p-4">
                                                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${t.subscription?.status === 'active' && t.isActive
                                                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                                : t.subscription?.status === 'trial'
                                                                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                                                    : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                                            }`}>
                                                            {t.subscription?.status === 'active' && t.isActive ? 'مفعل' : t.subscription?.status === 'trial' ? 'تجريبي' : 'مجمد'}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 font-mono text-slate-300">
                                                        {t.maxBranches || 1} فروع • {t.maxCashiers || 1} كاشير
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex items-center justify-center gap-1.5">
                                                            {/* زر التراخيص والموديولات */}
                                                            <button
                                                                onClick={() => setQuotaModal({
                                                                    open: true,
                                                                    tenant: t,
                                                                    modules: t.allowedModules || ['pos'],
                                                                    branches: t.maxBranches || 1,
                                                                    cashiers: t.maxCashiers || 1
                                                                })}
                                                                className="px-2.5 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-lg text-[10px] font-bold border border-indigo-500/20 flex items-center gap-1"
                                                                title="تعديل الموديولات المسموحة والحد الأقصى للفروع"
                                                            >
                                                                <Sliders size={12} /> التراخيص
                                                            </button>

                                                            {/* زر الدخول كعميل */}
                                                            <button
                                                                onClick={() => handleImpersonate(t._id)}
                                                                className="px-2.5 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg text-[10px] font-bold border border-blue-500/20 flex items-center gap-1"
                                                            >
                                                                <Eye size={12} /> دخول
                                                            </button>

                                                            <button
                                                                onClick={() => handleTenantAction(t._id, 'extend_trial', 7)}
                                                                className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg text-[10px] font-bold border border-amber-500/20"
                                                            >
                                                                +7 أيام
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

                        {/* TAB 3: RADAR (EXPIRING & CHURN PREVENTION) */}
                        {activeTab === 'radar' && (
                            <div className="space-y-4">
                                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-between text-xs text-amber-300">
                                    <div className="flex items-center gap-2">
                                        <AlertTriangle size={18} className="shrink-0" />
                                        <span>قائمة الإنقاذ من التسرب: متاجر تنتهي خلال 96 ساعة أو منتهية حديثاً وتحتاج تواصلاً هاتفياً فورياً.</span>
                                    </div>
                                    <span className="font-bold font-mono">{expiringTenants.length} منشأة</span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {expiringTenants.map(t => {
                                        const expiry = t.subscription?.expiresAt
                                            ? new Date(t.subscription.expiresAt)
                                            : t.subscription?.trialEndsAt
                                                ? new Date(t.subscription.trialEndsAt)
                                                : null;

                                        const daysLeft = expiry ? Math.ceil((expiry.getTime() - Date.now()) / (1000 * 3600 * 24)) : 0;

                                        return (
                                            <div key={t._id} className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-3 shadow-lg">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h3 className="font-bold text-white text-sm">{t.name}</h3>
                                                        <p className="text-[11px] text-slate-400 font-mono">{t.subdomain}.sarh.cloud</p>
                                                    </div>
                                                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold font-mono ${daysLeft <= 0 ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                                        }`}>
                                                        {daysLeft <= 0 ? 'منتهي الآن' : `متبقي ${daysLeft} يوم`}
                                                    </span>
                                                </div>

                                                <div className="p-3 bg-slate-950 rounded-2xl space-y-1 text-slate-400 text-[11px] border border-slate-800">
                                                    <div className="flex justify-between">
                                                        <span>الهاتف:</span>
                                                        <span className="text-white font-mono">{t.phone || 'غير مسجل'}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>تاريخ الانتهاء:</span>
                                                        <span className="text-slate-300 font-mono">{expiry ? expiry.toLocaleDateString('ar-EG') : '-'}</span>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-2 pt-1">
                                                    <Button
                                                        disabled={!t.phone}
                                                        onClick={() => openWhatsAppRenewal(t)}
                                                        className="bg-emerald-600 hover:bg-emerald-500 text-[11px] py-2 font-bold rounded-xl flex items-center justify-center gap-1.5"
                                                    >
                                                        <MessageCircle size={14} /> تواصل واتساب
                                                    </Button>
                                                    <Button
                                                        onClick={() => handleTenantAction(t._id, 'extend_trial', 3)}
                                                        className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] py-2 font-bold rounded-xl"
                                                    >
                                                        +3 أيام مهلة
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* TAB 4: PAYMENT PROOFS */}
                        {activeTab === 'proofs' && (
                            <div className="space-y-4">
                                {proofs.length === 0 ? (
                                    <div className="text-center py-20 bg-slate-900 rounded-3xl border border-slate-800 text-slate-500 text-xs">
                                        لا توجد إشعارات تحويل معلقة حالياً
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {proofs.map(p => (
                                            <div key={p._id} className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-3.5 text-xs shadow-lg">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h3 className="font-bold text-white text-sm">{p.tenantId?.name}</h3>
                                                        <p className="text-[11px] text-slate-400 font-mono">{p.tenantId?.subdomain}.sarh.cloud</p>
                                                    </div>
                                                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-xl font-mono font-bold">
                                                        {p.amount} ج.م
                                                    </span>
                                                </div>

                                                <div className="p-3 bg-slate-950 rounded-2xl space-y-1 text-slate-400 text-[11px] border border-slate-800">
                                                    <div className="flex justify-between">
                                                        <span>المحول:</span>
                                                        <span className="text-white font-mono">{p.senderPhoneOrName}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>طريقة الدفع:</span>
                                                        <span className="text-white font-mono uppercase">{p.paymentMethod}</span>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => setSelectedProofImg(p.screenshotUrl)}
                                                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl flex items-center justify-center gap-1.5 font-bold transition"
                                                >
                                                    <Eye size={14} /> فحص صورة الإيصال
                                                </button>

                                                <div className="grid grid-cols-3 gap-1.5 pt-1">
                                                    <Button
                                                        onClick={() => {
                                                            if (confirm('تفعيل شهر؟')) {
                                                                api.post('/subscriptions/admin/approve', { proofId: p._id, durationMonths: 1 }).then(fetchData);
                                                            }
                                                        }}
                                                        className="bg-emerald-600 hover:bg-emerald-500 text-[11px] py-1.5 font-bold rounded-xl"
                                                    >
                                                        شهر
                                                    </Button>
                                                    <Button
                                                        onClick={() => {
                                                            if (confirm('تفعيل سنة؟')) {
                                                                api.post('/subscriptions/admin/approve', { proofId: p._id, durationMonths: 12 }).then(fetchData);
                                                            }
                                                        }}
                                                        className="bg-blue-600 hover:bg-blue-500 text-[11px] py-1.5 font-bold rounded-xl"
                                                    >
                                                        سنة
                                                    </Button>
                                                    <Button
                                                        onClick={() => setRejectionModal({ open: true, proofId: p._id, reason: '' })}
                                                        className="bg-rose-600/80 hover:bg-rose-600 text-[11px] py-1.5 font-bold rounded-xl"
                                                    >
                                                        رفض
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* TAB 5: AFFILIATES */}
                        {activeTab === 'affiliates' && (
                            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl text-xs">
                                <table className="w-full text-right border-collapse">
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

                {/* MODAL: التحكم في الحصص والموديولات (QUOTA & MODULE MANAGER) */}
                {quotaModal.open && quotaModal.tenant && (
                    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-5 shadow-2xl text-xs">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                                <div>
                                    <h3 className="text-sm font-black text-white flex items-center gap-2">
                                        <Sliders size={16} className="text-indigo-400" /> إدارة تراخيص المنشأة
                                    </h3>
                                    <p className="text-[11px] text-slate-400 font-mono">{quotaModal.tenant.name} ({quotaModal.tenant.subdomain})</p>
                                </div>
                                <button
                                    onClick={() => setQuotaModal({ open: false, tenant: null, modules: [], branches: 1, cashiers: 1 })}
                                    className="text-slate-500 hover:text-white"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* الحصص التشغيلية */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-slate-400 block mb-1 font-semibold">أقصى عدد فروع (Branches):</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={quotaModal.branches}
                                        onChange={e => setQuotaModal({ ...quotaModal, branches: Number(e.target.value) })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-slate-400 block mb-1 font-semibold">أقصى عدد كاشيرات (Cashiers):</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={quotaModal.cashiers}
                                        onChange={e => setQuotaModal({ ...quotaModal, cashiers: Number(e.target.value) })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                            </div>

                            {/* الموديولات المصرح بها */}
                            <div className="space-y-2">
                                <label className="text-slate-400 block font-semibold">الموديولات المفعلة للمتجر:</label>
                                <div className="space-y-2 bg-slate-950 p-3 rounded-2xl border border-slate-800">
                                    {AVAILABLE_MODULES.map(mod => {
                                        const isChecked = quotaModal.modules.includes(mod.key);
                                        return (
                                            <label
                                                key={mod.key}
                                                className="flex items-start gap-3 p-2 rounded-xl hover:bg-slate-900 cursor-pointer transition"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    onChange={e => {
                                                        const updated = e.target.checked
                                                            ? [...quotaModal.modules, mod.key]
                                                            : quotaModal.modules.filter(m => m !== mod.key);
                                                        setQuotaModal({ ...quotaModal, modules: updated });
                                                    }}
                                                    className="mt-1 accent-indigo-600 rounded"
                                                />
                                                <div>
                                                    <span className="font-bold text-white block">{mod.name}</span>
                                                    <span className="text-[10px] text-slate-500 block">{mod.desc}</span>
                                                </div>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    onClick={() => setQuotaModal({ open: false, tenant: null, modules: [], branches: 1, cashiers: 1 })}
                                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold"
                                >
                                    إلغاء
                                </button>
                                <Button
                                    onClick={handleSaveQuotas}
                                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2 rounded-xl"
                                >
                                    حفظ التراخيص
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* MODAL: صورة الإيصال المكبرة */}
                {selectedProofImg && (
                    <div
                        onClick={() => setSelectedProofImg(null)}
                        className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 cursor-pointer backdrop-blur-sm"
                    >
                        <img
                            src={selectedProofImg}
                            alt="Receipt"
                            className="max-h-[85vh] max-w-full rounded-2xl shadow-2xl object-contain border border-slate-700"
                        />
                    </div>
                )}

                {/* MODAL: رفض الإيصال */}
                {rejectionModal.open && (
                    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl text-xs">
                            <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                                <XCircle size={18} />
                                <span>رفض إشعار التحويل</span>
                            </div>
                            <textarea
                                value={rejectionModal.reason}
                                onChange={e => setRejectionModal({ ...rejectionModal, reason: e.target.value })}
                                placeholder="سبب الرفض ليظهر للتاجر..."
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-rose-500 h-24 text-xs"
                            />
                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    onClick={() => setRejectionModal({ open: false, proofId: null, reason: '' })}
                                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold"
                                >
                                    إلغاء
                                </button>
                                <Button
                                    onClick={async () => {
                                        if (!rejectionModal.proofId) return;
                                        await api.post('/admin/proofs/reject', {
                                            proofId: rejectionModal.proofId,
                                            rejectionReason: rejectionModal.reason
                                        });
                                        setRejectionModal({ open: false, proofId: null, reason: '' });
                                        fetchData();
                                    }}
                                    className="bg-rose-600 hover:bg-rose-500 font-bold px-4 py-2 rounded-xl text-white"
                                >
                                    تأكيد الرفض
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}