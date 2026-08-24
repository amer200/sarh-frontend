'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { QRCodeSVG } from 'qrcode.react';
import {
    ArrowRight, Settings, CheckCircle2, AlertCircle,
    Building2, Receipt, Phone, MapPin, Hash, FileText,
    Printer, Sparkles, Eye
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function PosSettingsPage() {
    const [formData, setFormData] = useState({
        name: 'مؤسسة صَرْح التجارية',
        vatNumber: '300000000000003',
        commercialRegister: '1010000000',
        address: 'المملكة العربية السعودية - الرياض',
        phone: '0500000000',
        receiptFooter: 'شكراً لزيارتكم - البضاعة المباعة ترد وتستبدل خلال 3 أيام بموجب أصل الفاتورة'
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await api.get('/pos/settings');
                if (res.data.data) {
                    setFormData({
                        name: res.data.data.name || 'مؤسسة صَرْح التجارية',
                        vatNumber: res.data.data.vatNumber || '300000000000003',
                        commercialRegister: res.data.data.commercialRegister || '',
                        address: res.data.data.address || '',
                        phone: res.data.data.phone || '',
                        receiptFooter: res.data.data.receiptFooter || ''
                    });
                }
            } catch (err: any) {
                setErrorMsg(err.response?.data?.error || 'فشل في تحميل الإعدادات الحالية');
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage('');
        setErrorMsg('');

        try {
            await api.patch('/pos/settings', formData);
            setMessage('تم حفظ وتحديث إعدادات المنشأة والفاتورة الضريبية بنجاح');
        } catch (err: any) {
            setErrorMsg(err.response?.data?.error || 'فشل في حفظ التعديلات');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-6 font-sans selection:bg-blue-600 selection:text-white" dir="rtl">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                    <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 flex items-center justify-center shadow-md">
                            <Settings size={20} />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-white">إعدادات المنشأة وتخصيص الفاتورة</h1>
                            <p className="text-xs text-slate-400">تخصيص بيانات المتجر والامتثال لـ ZATCA مع المعاينة الفورية</p>
                        </div>
                    </div>

                    <Link
                        href="/pos"
                        className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition hover:border-slate-700"
                    >
                        <ArrowRight size={14} /> العودة للكاشير
                    </Link>
                </div>

                {/* Notifications */}
                {message && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center gap-2">
                        <CheckCircle2 size={16} className="shrink-0" /> {message}
                    </div>
                )}

                {errorMsg && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl flex items-center gap-2">
                        <AlertCircle size={16} className="shrink-0" /> {errorMsg}
                    </div>
                )}

                {loading ? (
                    <div className="text-center py-20 text-xs text-slate-500">جارٍ تحميل الإعدادات...</div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        {/* Form Column (7 cols) */}
                        <form onSubmit={handleSubmit} className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 text-xs shadow-2xl">
                            <div>
                                <label className="text-slate-400 block mb-1 font-semibold flex items-center gap-1.5">
                                    <Building2 size={14} className="text-blue-400" /> الاسم التجاري للمنشأة:
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="مثال: شركة صَرْح التجارية"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-blue-500 transition"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-slate-400 block mb-1 font-semibold flex items-center gap-1.5">
                                        <Hash size={14} className="text-amber-400" /> الرقم الضريبي (15 رقماً):
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.vatNumber}
                                        onChange={e => setFormData({ ...formData, vatNumber: e.target.value })}
                                        placeholder="300000000000003"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-blue-500 transition"
                                    />
                                </div>

                                <div>
                                    <label className="text-slate-400 block mb-1 font-semibold flex items-center gap-1.5">
                                        <FileText size={14} className="text-indigo-400" /> رقم السجل التجاري (CR):
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.commercialRegister}
                                        onChange={e => setFormData({ ...formData, commercialRegister: e.target.value })}
                                        placeholder="1010000000"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-blue-500 transition"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-slate-400 block mb-1 font-semibold flex items-center gap-1.5">
                                        <MapPin size={14} className="text-rose-400" /> العنوان / الفرع:
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.address}
                                        onChange={e => setFormData({ ...formData, address: e.target.value })}
                                        placeholder="الرياض - طريق الملك فهد"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-blue-500 transition"
                                    />
                                </div>

                                <div>
                                    <label className="text-slate-400 block mb-1 font-semibold flex items-center gap-1.5">
                                        <Phone size={14} className="text-emerald-400" /> رقم الهاتف للتواصل:
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="0500000000"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-blue-500 transition"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-slate-400 block mb-1 font-semibold flex items-center gap-1.5">
                                    <Receipt size={14} className="text-sky-400" /> رسالة تذييل الفاتورة الحرارية:
                                </label>
                                <textarea
                                    rows={2}
                                    value={formData.receiptFooter}
                                    onChange={e => setFormData({ ...formData, receiptFooter: e.target.value })}
                                    placeholder="شكراً لزيارتكم - البضاعة المباعة ترد وتستبدل خلال 3 أيام"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-blue-500 resize-none transition"
                                />
                            </div>

                            <Button
                                type="submit"
                                disabled={saving}
                                className="w-full py-3 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-600/20 transition active:scale-95"
                            >
                                {saving ? 'جارٍ حفظ الإعدادات...' : 'حفظ التعديلات'}
                            </Button>
                        </form>

                        {/* Live Thermal Receipt Preview Column (5 cols) */}
                        <div className="lg:col-span-5 space-y-3">
                            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                                <span className="font-bold flex items-center gap-1.5 text-white">
                                    <Eye size={15} className="text-blue-400" /> معاينة الفاتورة الحرارية الحية (80mm)
                                </span>
                                <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full font-mono">
                                    Live Preview
                                </span>
                            </div>

                            <div className="bg-white text-slate-900 rounded-3xl p-6 shadow-2xl font-sans text-xs border border-slate-200">
                                {/* Header */}
                                <div className="text-center pb-3 border-b border-dashed border-slate-300">
                                    <h3 className="font-bold text-base text-slate-900 leading-snug">
                                        {formData.name || 'اسم المنشأة'}
                                    </h3>
                                    {formData.address && (
                                        <p className="text-[11px] text-slate-500 mt-0.5">{formData.address}</p>
                                    )}
                                    {formData.phone && (
                                        <p className="text-[10px] text-slate-500 font-mono">هاتف: {formData.phone}</p>
                                    )}
                                    {formData.commercialRegister && (
                                        <p className="text-[10px] text-slate-500 font-mono">س.ت: {formData.commercialRegister}</p>
                                    )}
                                    <p className="text-[11px] text-slate-600 font-mono mt-1 font-semibold">
                                        الرقم الضريبي: {formData.vatNumber || '300000000000003'}
                                    </p>
                                    <div className="mt-1.5 inline-block px-2 py-0.5 rounded bg-slate-100 text-[10px] font-bold text-slate-600">
                                        فاتورة ضريبية مبسطة
                                    </div>
                                </div>

                                {/* Metadata */}
                                <div className="py-2.5 text-xs space-y-1 border-b border-dashed border-slate-300 font-mono">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500 font-sans">رقم الفاتورة:</span>
                                        <span className="font-bold">POS-892104</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500 font-sans">التاريخ:</span>
                                        <span>2026-08-24 15:30</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500 font-sans">الكاشير:</span>
                                        <span className="font-sans">كاشير رئيسي</span>
                                    </div>
                                </div>

                                {/* Sample Items */}
                                <div className="py-2.5 space-y-1.5 border-b border-dashed border-slate-300 text-xs">
                                    <div className="grid grid-cols-12 font-bold text-slate-500 pb-1 border-b border-slate-100 text-[10px]">
                                        <span className="col-span-6">الصنف</span>
                                        <span className="col-span-2 text-center">الكمية</span>
                                        <span className="col-span-4 text-left">المبلغ</span>
                                    </div>
                                    <div className="grid grid-cols-12 items-center py-0.5">
                                        <span className="col-span-6 truncate font-medium">اسبريسو دبل</span>
                                        <span className="col-span-2 text-center font-mono">1</span>
                                        <span className="col-span-4 text-left font-mono">14.00</span>
                                    </div>
                                    <div className="grid grid-cols-12 items-center py-0.5">
                                        <span className="col-span-6 truncate font-medium">كرواسون جبنة</span>
                                        <span className="col-span-2 text-center font-mono">1</span>
                                        <span className="col-span-4 text-left font-mono">12.00</span>
                                    </div>
                                </div>

                                {/* Totals */}
                                <div className="py-2.5 space-y-1 text-xs border-b border-dashed border-slate-300 font-mono">
                                    <div className="flex justify-between text-slate-600 font-sans">
                                        <span>المجموع الفرعي:</span>
                                        <span>22.61 SAR</span>
                                    </div>
                                    <div className="flex justify-between text-slate-600 font-sans">
                                        <span>ضريبة القيمة المضافة (15%):</span>
                                        <span>3.39 SAR</span>
                                    </div>
                                    <div className="flex justify-between text-sm font-bold text-slate-900 pt-1.5 border-t border-slate-200 font-sans">
                                        <span>الإجمالي النهائي:</span>
                                        <span className="font-mono text-base">26.00 SAR</span>
                                    </div>
                                </div>

                                {/* Live ZATCA QR & Footer */}
                                <div className="py-3 text-center flex flex-col items-center justify-center">
                                    <div className="p-2 bg-white border border-slate-200 rounded-xl shadow-sm inline-block">
                                        <QRCodeSVG
                                            value={`SARH|${formData.name}|${formData.vatNumber}|2026-08-24T15:30:00Z|26.00|3.39`}
                                            size={95}
                                            level="M"
                                        />
                                    </div>
                                    <p className="text-[10px] text-slate-500 mt-2 font-sans font-medium px-2 leading-relaxed">
                                        {formData.receiptFooter || 'شكراً لزيارتكم - تم الإصدار إلكترونياً'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}