'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Building2, ArrowRight, Save, Receipt, CheckCircle2,
    AlertCircle, Phone, MapPin, Hash, FileText, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function SettingsPage() {
    const router = useRouter();
    const [token, setToken] = useState('');
    const [tenantSubdomain, setTenantSubdomain] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        vatNumber: '',
        commercialRegister: '',
        phone: '',
        address: '',
        receiptFooter: ''
    });

    useEffect(() => {
        const savedToken = localStorage.getItem('sarh_token');
        const savedSubdomain = localStorage.getItem('sarh_tenant_subdomain') || 'alsarh-express';

        if (!savedToken) {
            router.push('/login');
            return;
        }

        setToken(savedToken);
        setTenantSubdomain(savedSubdomain);
        fetchSettings(savedToken, savedSubdomain);
    }, []);

    const getHeaders = (authToken = token, sub = tenantSubdomain) => ({
        'Authorization': `Bearer ${authToken}`,
        'x-tenant-subdomain': sub
    });

    const fetchSettings = async (authToken = token, sub = tenantSubdomain) => {
        try {
            setLoading(true);
            const res = await axios.get('http://localhost:5000/api/v1/pos/settings', {
                headers: getHeaders(authToken, sub)
            });
            const d = res.data.data;
            setFormData({
                name: d.name || '',
                vatNumber: d.vatNumber || '',
                commercialRegister: d.commercialRegister || '',
                phone: d.phone || '',
                address: d.address || '',
                receiptFooter: d.receiptFooter || 'شكراً لزيارتكم - تم الإصدار إلكترونياً'
            });
        } catch (err: any) {
            if (err.response?.status === 401) {
                localStorage.removeItem('sarh_token');
                router.push('/login');
            } else {
                setErrorMessage(err.response?.data?.error || 'فشل في جلب الإعدادات');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setSuccessMessage('');
        setErrorMessage('');

        try {
            await axios.patch('http://localhost:5000/api/v1/pos/settings', formData, {
                headers: getHeaders()
            });
            setSuccessMessage('تم حفظ وتحديث إعدادات المنشأة وتخصيص الفاتورة بنجاح!');
            setTimeout(() => setSuccessMessage(''), 4000);
        } catch (err: any) {
            setErrorMessage(err.response?.data?.error || 'فشل في حفظ التعديلات');
        } finally {
            setSaving(false);
        }
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
                        <Building2 size={18} className="text-blue-400" />
                        <h1 className="text-sm font-bold text-white">إعدادات المنشأة وتخصيص الفاتورة</h1>
                    </div>
                </div>

                <span className="text-xs text-slate-500 font-mono bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
                    {tenantSubdomain}.sarh.cloud
                </span>
            </header>

            {/* المحتوى الرئيسي */}
            <div className="max-w-6xl mx-auto p-6">
                {loading ? (
                    <div className="py-20 text-center text-slate-500 text-xs font-mono">جارٍ تحميل بيانات المنشأة...</div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* نموذج الإعدادات (7 أعمدة) */}
                        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
                            <h2 className="text-base font-bold text-white mb-1">بيانات الهوية والامتثال الضريبي</h2>
                            <p className="text-xs text-slate-400 mb-6">هذه البيانات تظهر في الفواتير المطبوعة ورمز الاستجابة السريع ZATCA QR</p>

                            {successMessage && (
                                <div className="mb-4 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                                    <CheckCircle2 size={16} className="shrink-0" />
                                    <span>{successMessage}</span>
                                </div>
                            )}

                            {errorMessage && (
                                <div className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                                    <AlertCircle size={16} className="shrink-0" />
                                    <span>{errorMessage}</span>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="text-xs text-slate-300 block mb-1.5 font-medium">اسم المنشأة / المتجر الرسمي:</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="مثال: شركة مقهى الرياض التجارية"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs text-slate-300 block mb-1.5 font-medium">
                                            الرقم الضريبي (15 رقماً):
                                        </label>
                                        <input
                                            type="text"
                                            maxLength={15}
                                            required
                                            value={formData.vatNumber}
                                            onChange={e => setFormData({ ...formData, vatNumber: e.target.value })}
                                            placeholder="300000000000003"
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs text-slate-300 block mb-1.5 font-medium">رقم السجل التجاري (CR):</label>
                                        <input
                                            type="text"
                                            value={formData.commercialRegister}
                                            onChange={e => setFormData({ ...formData, commercialRegister: e.target.value })}
                                            placeholder="1010XXXXXX"
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs text-slate-300 block mb-1.5 font-medium">رقم هاتف المنشأة:</label>
                                        <input
                                            type="text"
                                            value={formData.phone}
                                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                            placeholder="05XXXXXXXX"
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs text-slate-300 block mb-1.5 font-medium">العنوان / الفرع والمدينة:</label>
                                        <input
                                            type="text"
                                            value={formData.address}
                                            onChange={e => setFormData({ ...formData, address: e.target.value })}
                                            placeholder="الرياض - حي الملز"
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs text-slate-300 block mb-1.5 font-medium">رسالة تذييل الفاتورة (Footer Note):</label>
                                    <textarea
                                        rows={2}
                                        value={formData.receiptFooter}
                                        onChange={e => setFormData({ ...formData, receiptFooter: e.target.value })}
                                        placeholder="شكراً لزيارتكم - نتطلع لرؤيتكم مجدداً"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500 resize-none"
                                    />
                                </div>

                                <div className="pt-3">
                                    <Button
                                        type="submit"
                                        disabled={saving}
                                        className="w-full py-3 text-xs font-bold flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500"
                                    >
                                        <Save size={16} /> {saving ? 'جارٍ حفظ البيانات...' : 'حفظ وتطبيق الإعدادات'}
                                    </Button>
                                </div>
                            </form>
                        </div>

                        {/* المعاينة الحية للفاتورة الحرارية (5 أعمدة) */}
                        <div className="lg:col-span-5 flex flex-col items-center">
                            <div className="flex items-center gap-2 text-xs text-slate-400 mb-3 font-semibold">
                                <Receipt size={14} className="text-sky-400" /> معاينة شكل الفاتورة الحرارية (80mm)
                            </div>

                            {/* ورقة الفاتورة الحرارية */}
                            <div className="w-full max-w-xs bg-white text-slate-900 rounded-3xl p-5 shadow-2xl font-mono text-[11px] border border-slate-200">
                                <div className="text-center pb-3 border-b border-dashed border-slate-300">
                                    <h3 className="font-bold text-sm font-sans">{formData.name || 'اسم منشأتك هنا'}</h3>
                                    {formData.address && <p className="text-[10px] text-slate-500 mt-0.5 font-sans">{formData.address}</p>}
                                    {formData.phone && <p className="text-[10px] text-slate-500 font-mono">هاتف: {formData.phone}</p>}
                                    <p className="text-[10px] text-slate-500 mt-1">الرقم الضريبي: {formData.vatNumber || '300000000000003'}</p>
                                </div>

                                <div className="py-2.5 space-y-1 border-b border-dashed border-slate-300 text-[10px]">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">رقم الفاتورة:</span>
                                        <span className="font-bold">POS-981240</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">التاريخ:</span>
                                        <span>2026-08-24 12:30</span>
                                    </div>
                                </div>

                                <div className="py-2.5 space-y-1.5 border-b border-dashed border-slate-300">
                                    <div className="flex justify-between font-sans">
                                        <span>1x قهوة لاتيه</span>
                                        <span>18.00</span>
                                    </div>
                                    <div className="flex justify-between font-sans">
                                        <span>1x كرواسون جبنة</span>
                                        <span>12.00</span>
                                    </div>
                                </div>

                                <div className="py-2.5 space-y-1 border-b border-dashed border-slate-300">
                                    <div className="flex justify-between text-slate-600">
                                        <span>المجموع الفرعي:</span>
                                        <span>26.09 SAR</span>
                                    </div>
                                    <div className="flex justify-between text-slate-600">
                                        <span>الضريبة (15%):</span>
                                        <span>3.91 SAR</span>
                                    </div>
                                    <div className="flex justify-between font-bold text-xs pt-1 border-t border-slate-200">
                                        <span>الإجمالي:</span>
                                        <span>30.00 SAR</span>
                                    </div>
                                </div>

                                <div className="py-3 text-center">
                                    <div className="w-20 h-20 mx-auto bg-slate-900 text-white rounded-lg flex items-center justify-center text-[8px] font-sans">
                                        [ ZATCA QR ]
                                    </div>
                                    <p className="text-[9px] text-slate-500 mt-2 font-sans">{formData.receiptFooter}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}