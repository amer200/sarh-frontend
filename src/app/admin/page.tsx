// src/app/admin/page.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import {
    ShieldCheck, Store, DollarSign, Users, Clock,
    AlertCircle, Eye, Search, RefreshCw, Power,
    Award, ArrowUpRight, CheckCircle2, XCircle,
    Filter, TrendingUp, MessageCircle, Sliders,
    Layers, AlertTriangle, ChevronRight, Phone, Unlock, Lock,
    UtensilsCrossed, Shirt, Truck, Check, Play, Pause, X
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
        status: 'trial' | 'active' | 'expired' | 'suspended';
        plan: string;
        trialEndsAt?: string;
        expiresAt?: string;
    };
    subscriptions?: {
        pos?: { status: string; plan?: string; expiresAt?: string; trialEndsAt?: string };
        retail?: { status: string; plan?: string; expiresAt?: string; trialEndsAt?: string };
        fleet?: { status: string; plan?: string; expiresAt?: string; trialEndsAt?: string };
    };
    createdAt: string;
}

interface PaymentProof {
    _id: string;
    tenantId: { _id: string; name: string; subdomain: string; phone?: string };
    appModule?: string;
    amount: number;
    senderPhoneOrName: string;
    paymentMethod: string;
    screenshotUrl: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: string;
}

const AVAILABLE_MODULES = [
    { key: 'pos', name: 'الكاشير السريع (POS)', desc: 'إصدار الفواتير وطباعة الإيصالات' },
    { key: 'retail', name: 'إدارة التجزئة والمستودعات', desc: 'تحويلات المخزون ومصفوفة المقاسات' },
    { key: 'zatca', name: 'الفوترة الإلكترونية (ZATCA/ETA)', desc: 'تشفير الفواتير وQR Code' },
    { key: 'kitchen', name: 'شاشة المطبخ (KDS)', desc: 'إرسال طلبات المطاعم للمطبخ لحظياً' },
    { key: 'reports', name: 'التقارير المحاسبية المتقدمة', desc: 'تحليل الأرباح والتدفقات النقدية' }
];

const MODULE_DEFINITIONS = [
    { key: 'pos', name: 'صَرْح POS للمطاعم والكافيهات', icon: UtensilsCrossed, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { key: 'retail', name: 'صَرْح Retail للملابس والتجزئة', icon: Shirt, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { key: 'fleet', name: 'صَرْح Fleet للتوصيل والأسطول', icon: Truck, color: 'text-emerald-400', bg: 'bg-emerald-500/10' }
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

    // نافذة التحكم في اشتراكات كل تطبيق للمنشأة
    const [moduleSubModal, setModuleSubModal] = useState<{
        open: boolean;
        tenant: Tenant | null;
    }>({
        open: false,
        tenant: null
    });

    // حماية جلسة السوبر أدمن من الضياع عند المعاينة
    const ensureAdminSession = () => {
        const adminToken = localStorage.getItem('sarh_admin_token');
        if (adminToken) {
            localStorage.setItem('sarh_token', adminToken);
            localStorage.setItem('sarh_role', 'SUPER_ADMIN');
        } else {
            const currentToken = localStorage.getItem('sarh_token');
            const role = localStorage.getItem('sarh_role');
            if (role === 'SUPER_ADMIN' && currentToken) {
                localStorage.setItem('sarh_admin_token', currentToken);
            }
        }
    };

    const fetchData = async () => {
        ensureAdminSession();
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

            // تحديث المنشأة المفتوحة في المودال إن وجدت
            if (moduleSubModal.tenant) {
                const refreshed = tenantsRes.data.data.find((t: Tenant) => t._id === moduleSubModal.tenant?._id);
                if (refreshed) {
                    setModuleSubModal({ open: true, tenant: refreshed });
                }
            }
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

    // 1. تنفيذ إجراء عام أو خاص على اشتراك المنشأة
    const handleTenantAction = async (tenantId: string, action: string, days = 7, plan = 'monthly') => {
        ensureAdminSession();
        setActionLoading(tenantId);
        try {
            const res = await api.patch(`/admin/tenants/${tenantId}/subscription`, { action, days, plan });
            alert(res.data?.message || 'تم تحديث حالة المنشأة بنجاح');
            await fetchData();
        } catch (err: any) {
            alert(err.response?.data?.error || 'فشلت معالجة الطلب');
        } finally {
            setActionLoading(null);
        }
    };

    // 2. تنفيذ إجراء على تطبيق محدد (POS أو Retail أو Fleet)
    const handleModuleSubscriptionAction = async (
        tenantId: string,
        appModule: 'pos' | 'retail' | 'fleet',
        action: 'activate_module' | 'extend_trial_module' | 'freeze_module' | 'deactivate_module',
        payload: { plan?: 'monthly' | 'yearly'; days?: number; months?: number } = {}
    ) => {
        ensureAdminSession();
        setActionLoading(`${tenantId}_${appModule}`);
        try {
            const res = await api.patch(`/admin/tenants/${tenantId}/subscription`, {
                appModule,
                action,
                ...payload
            });
            alert(res.data?.message || `تم تحديث اشتراك تطبيق ${appModule.toUpperCase()} بنجاح`);
            await fetchData();
        } catch (err: any) {
            alert(err.response?.data?.error || 'فشل تحديث اشتراك التطبيق');
        } finally {
            setActionLoading(null);
        }
    };

    // 3. الدخول كعميل (Impersonation) دون فقدان توكن الأدمن
    const handleImpersonate = async (tenantId: string) => {
        try {
            ensureAdminSession();
            const res = await api.post(`/admin/tenants/${tenantId}/impersonate`);
            if (res.data?.data) {
                const { token, user } = res.data.data;
                const adminToken = localStorage.getItem('sarh_admin_token') || localStorage.getItem('sarh_token');
                const adminUser = localStorage.getItem('sarh_user');

                localStorage.setItem('sarh_token', token);
                localStorage.setItem('sarh_user', JSON.stringify(user));
                if (user.tenantId?.subdomain) {
                    localStorage.setItem('sarh_tenant_subdomain', user.tenantId.subdomain);
                }

                window.open('/dashboard', '_blank');

                if (adminToken) {
                    localStorage.setItem('sarh_token', adminToken);
                    localStorage.setItem('sarh_role', 'SUPER_ADMIN');
                }
                if (adminUser) {
                    localStorage.setItem('sarh_user', adminUser);
                }
            }
        } catch (err: any) {
            alert(err.response?.data?.error || 'تعذر الدخول لحساب المتجر');
        }
    };

    // 4. حفظ الحصص والتراخيص
    const handleSaveQuotas = async () => {
        if (!quotaModal.tenant) return;
        ensureAdminSession();
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

        const text = `مرحباً أستاذ إدارة متجر (${tenant.name}) 👋\nمعكم إدارة منصة صَرْح السحابية.\nنود إحاطتكم علماً بأن فترة ${isTrial ? 'التجربة المجانية' : 'الاشتراك'} الخاصة بنقاط البيع تنتهي بتاريخ (${expiryDate}).\nلضمان استمرار عمل الكاشير والفواتير دون توقف، يمكنك تجديد الاشتراك بسهولة.\nرابط منصتكم: https://${tenant.subdomain}.sarh.cloud`;

        window.open(`https://wa.me/${targetPhone}?text=${encodeURIComponent(text)}`, '_blank');
    };

    // فلترة المتاجر
    const filteredTenants = useMemo(() => {
        return tenants.filter(t => {
            const matchesSearch =
                t.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                t.subdomain?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                t.phone?.includes(searchTerm);

            const isFrozen = !t.isActive || t.subscription?.status === 'suspended' || t.subscription?.status === 'expired';
            const isActive = t.isActive && t.subscription?.status === 'active';
            const isTrial = t.isActive && t.subscription?.status === 'trial';

            const matchesStatus =
                statusFilter === 'all' ||
                (statusFilter === 'active' && isActive) ||
                (statusFilter === 'trial' && isTrial) ||
                (statusFilter === 'expired' && isFrozen);

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
                            <p className="text-xs text-slate-400">إدارة الـ SaaS Unit Economics، التحكم في اشتراكات كل نظام، والمسوقين</p>
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

                {/* Navigation Tabs */}
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
                                                <th className="p-4">اسم المنشأة والنطاق</th>
                                                <th className="p-4">حالة الأنظمة المستقلة</th>
                                                <th className="p-4">الحالة العامة</th>
                                                <th className="p-4">الحصص (فروع / كاشير)</th>
                                                <th className="p-4 text-center">إجراءات التحكم والأنظمة</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800/60">
                                            {filteredTenants.map(t => {
                                                const isFrozen = !t.isActive || t.subscription?.status === 'suspended' || t.subscription?.status === 'expired';
                                                const isActive = t.isActive && t.subscription?.status === 'active';
                                                const posStatus = t.subscriptions?.pos?.status || 'inactive';
                                                const retailStatus = t.subscriptions?.retail?.status || 'inactive';
                                                const fleetStatus = t.subscriptions?.fleet?.status || 'inactive';

                                                return (
                                                    <tr key={t._id} className="hover:bg-slate-800/30 transition">
                                                        <td className="p-4">
                                                            <span className="font-bold text-white block">{t.name}</span>
                                                            <span className="font-mono text-slate-400 text-[11px]">{t.subdomain}.sarh.cloud</span>
                                                        </td>
                                                        <td className="p-4">
                                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${posStatus === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                                                        posStatus === 'trial' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                                                            posStatus === 'expired' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                                                                                'bg-slate-800 text-slate-400'
                                                                    }`}>
                                                                    POS: {posStatus === 'active' ? 'نشط' : posStatus === 'trial' ? 'تجربة' : posStatus === 'expired' ? 'موقف' : 'معطل'}
                                                                </span>

                                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${retailStatus === 'active' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                                                        retailStatus === 'trial' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                                                            retailStatus === 'expired' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                                                                                'bg-slate-800 text-slate-400'
                                                                    }`}>
                                                                    Retail: {retailStatus === 'active' ? 'نشط' : retailStatus === 'trial' ? 'تجربة' : retailStatus === 'expired' ? 'موقف' : 'معطل'}
                                                                </span>

                                                                {fleetStatus !== 'inactive' && (
                                                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                                        Fleet: {fleetStatus === 'active' ? 'نشط' : 'تجربة'}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="p-4">
                                                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border inline-block ${isFrozen
                                                                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                                                    : isActive
                                                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                                                }`}>
                                                                {isFrozen ? 'مجمد كلياً' : isActive ? 'مفعل' : 'تجريبي'}
                                                            </span>
                                                        </td>
                                                        <td className="p-4 font-mono text-slate-300">
                                                            {t.maxBranches || 1} فروع • {t.maxCashiers || 1} كاشير
                                                        </td>
                                                        <td className="p-4">
                                                            <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                                                {/* زر إدارة باقات كل نظام على حدة */}
                                                                <button
                                                                    onClick={() => setModuleSubModal({ open: true, tenant: t })}
                                                                    className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg text-[10px] font-bold border border-amber-500/30 flex items-center gap-1 transition"
                                                                    title="تفعيل أو إيقاف اشتراك كل نظام بمفرده"
                                                                >
                                                                    <Sliders size={12} /> باقات الأنظمة
                                                                </button>

                                                                {/* زر التراخيص والموديولات */}
                                                                <button
                                                                    onClick={() => setQuotaModal({
                                                                        open: true,
                                                                        tenant: t,
                                                                        modules: t.allowedModules || ['pos'],
                                                                        branches: t.maxBranches || 1,
                                                                        cashiers: t.maxCashiers || 1
                                                                    })}
                                                                    className="px-2 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-lg text-[10px] font-bold border border-indigo-500/20 flex items-center gap-1"
                                                                    title="تعديل الحصص المسموحة"
                                                                >
                                                                    <Layers size={12} /> الحصص
                                                                </button>

                                                                {/* زر الدخول كعميل */}
                                                                <button
                                                                    onClick={() => handleImpersonate(t._id)}
                                                                    className="px-2 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg text-[10px] font-bold border border-blue-500/20 flex items-center gap-1"
                                                                    title="معاينة لوحة المتجر"
                                                                >
                                                                    <Eye size={12} /> دخول
                                                                </button>

                                                                {/* تجميد أو فك تجميد شامل للمنشأة */}
                                                                {t.isActive ? (
                                                                    <button
                                                                        onClick={() => handleTenantAction(t._id, 'freeze')}
                                                                        disabled={actionLoading === t._id}
                                                                        className="px-2 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg text-[10px] font-bold border border-rose-500/20 disabled:opacity-50 flex items-center gap-1"
                                                                        title="تجميد شامل لكافة الأنظمة"
                                                                    >
                                                                        <Lock size={11} /> تجميد عام
                                                                    </button>
                                                                ) : (
                                                                    <button
                                                                        onClick={() => handleTenantAction(t._id, 'unfreeze')}
                                                                        disabled={actionLoading === t._id}
                                                                        className="px-2 py-1 bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 rounded-lg text-[10px] font-bold border border-teal-500/20 disabled:opacity-50 flex items-center gap-1"
                                                                        title="فك تجميد المنشأة"
                                                                    >
                                                                        <Unlock size={11} /> فك التجميد
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* TAB 3: RADAR */}
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
                                                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold font-mono ${daysLeft <= 0 ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
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
                                                        {p.appModule && (
                                                            <span className="inline-block mt-1 uppercase font-mono text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded">
                                                                تطبيق: {p.appModule}
                                                            </span>
                                                        )}
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
                                                            if (confirm('تفعيل شهر لهذا التطبيق؟')) {
                                                                api.post('/subscriptions/admin/approve', { proofId: p._id, durationMonths: 1 }).then(fetchData);
                                                            }
                                                        }}
                                                        className="bg-emerald-600 hover:bg-emerald-500 text-[11px] py-1.5 font-bold rounded-xl"
                                                    >
                                                        شهر
                                                    </Button>
                                                    <Button
                                                        onClick={() => {
                                                            if (confirm('تفعيل سنة لهذا التطبيق؟')) {
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
                                            <th className="p-4">الهاتف</th>
                                            <th className="p-4">كود الإحالة</th>
                                            <th className="p-4">نسبة العمولة</th>
                                            <th className="p-4">إجمالي الأرباح</th>
                                            <th className="p-4">الرصيد المتاح</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/60 font-mono">
                                        {affiliates.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="text-center py-8 text-slate-500 font-sans">
                                                    لا يوجد مسوقين مسجلين بعد.
                                                </td>
                                            </tr>
                                        ) : (
                                            affiliates.map(aff => (
                                                <tr key={aff._id} className="hover:bg-slate-800/30 transition">
                                                    <td className="p-4 font-bold text-white font-sans">{aff.name}</td>
                                                    <td className="p-4 text-slate-400">{aff.email}</td>
                                                    <td className="p-4 text-slate-400">{aff.phone || '-'}</td>
                                                    <td className="p-4 text-emerald-400 font-bold">{aff.referralCode || '-'}</td>
                                                    <td className="p-4 text-slate-300 font-sans">{aff.commissionRate || '25%'}</td>
                                                    <td className="p-4 text-slate-300 font-bold">{aff.totalEarned || 0} ج.م</td>
                                                    <td className="p-4 text-emerald-400 font-bold">{aff.balance || 0} ج.م</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}

                {/* ========================================================================= */}
                {/* MODAL 1: نافذة التحكم في اشتراك كل موديول مستقل للمنشأة                     */}
                {/* ========================================================================= */}
                {moduleSubModal.open && moduleSubModal.tenant && (
                    <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-2xl w-full space-y-5 shadow-2xl text-xs max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                                <div>
                                    <h3 className="text-sm font-black text-white flex items-center gap-2">
                                        <Sliders size={16} className="text-amber-400" /> إدارة باقات واشتراكات أنظمة المنشأة
                                    </h3>
                                    <p className="text-[11px] text-slate-400 font-mono">{moduleSubModal.tenant.name} ({moduleSubModal.tenant.subdomain}.sarh.cloud)</p>
                                </div>
                                <button
                                    onClick={() => setModuleSubModal({ open: false, tenant: null })}
                                    className="p-1.5 text-slate-500 hover:text-white rounded-lg hover:bg-slate-800"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            <p className="text-slate-400 text-[11px] leading-relaxed">
                                يمكنك هنا تفعيل أو تمديد أو إيقاف كل تطبيق بشكل مستقل تماماً؛ إيقاف كاشير المطاعم لن يؤثر على كاشير الملابس أو العكس.
                            </p>

                            <div className="space-y-4">
                                {MODULE_DEFINITIONS.map(modDef => {
                                    const tenantSub = moduleSubModal.tenant?.subscriptions
                                        ? (moduleSubModal.tenant.subscriptions as any)[modDef.key]
                                        : null;

                                    const status = tenantSub?.status || 'inactive';
                                    const plan = tenantSub?.plan || 'none';
                                    const expiry = tenantSub?.expiresAt
                                        ? new Date(tenantSub.expiresAt)
                                        : tenantSub?.trialEndsAt
                                            ? new Date(tenantSub.trialEndsAt)
                                            : null;

                                    const isLoading = actionLoading === `${moduleSubModal.tenant?._id}_${modDef.key}`;

                                    return (
                                        <div key={modDef.key} className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2.5">
                                                    <div className={`w-8 h-8 rounded-xl ${modDef.bg} ${modDef.color} flex items-center justify-center shrink-0`}>
                                                        <modDef.icon size={16} />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-white text-xs">{modDef.name}</h4>
                                                        <span className="text-[10px] text-slate-400 font-mono">
                                                            {expiry ? `ينتهي: ${expiry.toLocaleDateString('ar-EG')}` : 'لم يحدد تاريخ'}
                                                        </span>
                                                    </div>
                                                </div>

                                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                        status === 'trial' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                                            status === 'expired' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                                                                'bg-slate-800 text-slate-400'
                                                    }`}>
                                                    {status === 'active' ? `نشط (${plan})` :
                                                        status === 'trial' ? 'تجربة مجانية' :
                                                            status === 'expired' ? 'موقف / منتهي' :
                                                                'غير مشترك (معطل)'}
                                                </span>
                                            </div>

                                            {/* أزرار التحكم الفوري في اشتراك هذا النظام */}
                                            <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-850">
                                                <button
                                                    disabled={isLoading}
                                                    onClick={() => handleModuleSubscriptionAction(moduleSubModal.tenant!._id, modDef.key as any, 'activate_module', { plan: 'monthly', months: 1 })}
                                                    className="px-2.5 py-1.5 bg-emerald-600/15 hover:bg-emerald-600/30 text-emerald-400 rounded-lg text-[11px] font-bold border border-emerald-500/30 disabled:opacity-50 flex items-center gap-1 transition"
                                                >
                                                    <Check size={12} /> تفعيل شهر
                                                </button>

                                                <button
                                                    disabled={isLoading}
                                                    onClick={() => handleModuleSubscriptionAction(moduleSubModal.tenant!._id, modDef.key as any, 'activate_module', { plan: 'yearly', months: 12 })}
                                                    className="px-2.5 py-1.5 bg-blue-600/15 hover:bg-blue-600/30 text-blue-400 rounded-lg text-[11px] font-bold border border-blue-500/30 disabled:opacity-50 flex items-center gap-1 transition"
                                                >
                                                    <Award size={12} /> تفعيل سنة
                                                </button>

                                                <button
                                                    disabled={isLoading}
                                                    onClick={() => handleModuleSubscriptionAction(moduleSubModal.tenant!._id, modDef.key as any, 'extend_trial_module', { days: 7 })}
                                                    className="px-2.5 py-1.5 bg-amber-500/15 hover:bg-amber-500/30 text-amber-400 rounded-lg text-[11px] font-bold border border-amber-500/30 disabled:opacity-50 flex items-center gap-1 transition"
                                                >
                                                    <Play size={12} /> +7 أيام تجربة
                                                </button>

                                                <button
                                                    disabled={isLoading || status === 'expired'}
                                                    onClick={() => handleModuleSubscriptionAction(moduleSubModal.tenant!._id, modDef.key as any, 'freeze_module')}
                                                    className="px-2.5 py-1.5 bg-rose-500/15 hover:bg-rose-500/30 text-rose-400 rounded-lg text-[11px] font-bold border border-rose-500/30 disabled:opacity-50 flex items-center gap-1 transition"
                                                >
                                                    <Pause size={12} /> إيقاف النظام
                                                </button>

                                                <button
                                                    disabled={isLoading || status === 'inactive'}
                                                    onClick={() => {
                                                        if (confirm(`تعطيل نظام (${modDef.name}) كلياً للمنشأة؟`)) {
                                                            handleModuleSubscriptionAction(moduleSubModal.tenant!._id, modDef.key as any, 'deactivate_module');
                                                        }
                                                    }}
                                                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-lg text-[11px] font-bold disabled:opacity-50 transition"
                                                >
                                                    إلغاء التفعيل
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="flex justify-end pt-2">
                                <button
                                    onClick={() => setModuleSubModal({ open: false, tenant: null })}
                                    className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold"
                                >
                                    إغلاق
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* MODAL 2: الحصص والموديولات */}
                {quotaModal.open && quotaModal.tenant && (
                    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-5 shadow-2xl text-xs">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                                <div>
                                    <h3 className="text-sm font-black text-white flex items-center gap-2">
                                        <Sliders size={16} className="text-indigo-400" /> إدارة تراخيص وحصص المنشأة
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

                            <div className="space-y-2">
                                <label className="text-slate-400 block font-semibold">الموديولات المصرح بها للمتجر:</label>
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

                {/* MODAL 3: فحص صورة الإيصال */}
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

                {/* MODAL 4: رفض الإيصال */}
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