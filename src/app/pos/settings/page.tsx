'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { QRCodeSVG } from 'qrcode.react';
import {
    ArrowRight, Settings, CheckCircle2, AlertCircle,
    Building2, Receipt, Phone, MapPin, Hash, FileText,
    DollarSign, Percent, Globe, Eye, Smartphone
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function PosSettingsPage() {
    const [formData, setFormData] = useState({
        name: 'مؤسسة صَرْح التجارية',
        country: 'EG',
        currency: 'ج.م',
        taxRate: 14,
        vatNumber: '',
        commercialRegister: '',
        address: 'القاهرة - مصر',
        phone: '01000000000',
        instapayAddress: '',
        receiptFooter: 'شكراً لزيارتكم - البضاعة المباعة ترد وتستبدل خلال 14 يوماً وفقاً لقانون حماية المستهلك'
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    // تبديل الإعدادات المسبقة للدول
    const handleCountryPreset = (countryCode: 'EG' | 'SA' | 'OTHER') => {
        if (countryCode === 'EG') {
            setFormData(prev => ({
                ...prev,
                country: 'EG',
                currency: 'ج.م',
                taxRate: 14,
                address: prev.address || 'القاهرة - مصر',
                receiptFooter: 'شكراً لزيارتكم - البضاعة المباعة ترد وتستبدل خلال 14 يوماً'
            }));
        } else if (countryCode === 'SA') {
            setFormData(prev => ({
                ...prev,
                country: 'SA',
                currency: 'SAR',
                taxRate: 15,
                address: prev.address || 'المملكة العربية السعودية - الرياض',
                receiptFooter: 'شكراً لزيارتكم - خاضع لهيئة الزكاة والضريبة والجمارك (ZATCA)'
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                country: 'OTHER',
                currency: '$',
                taxRate: 0,
                receiptFooter: 'Thank you for your visit!'
            }));
        }
    };

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await api.get('/pos/settings');
                if (res.data && res.data.data) {
                    const d = res.data.data;
                    setFormData({
                        name: d.name || 'مؤسسة صَرْح التجارية',
                        country: d.country || 'EG',
                        currency: d.currency || 'ج.م',
                        taxRate: d.taxRate !== undefined ? d.taxRate : 14,
                        vatNumber: d.vatNumber || '',
                        commercialRegister: d.commercialRegister || '',
                        address: d.address || '',
                        phone: d.phone || '',
                        instapayAddress: d.instapayAddress || '',
                        receiptFooter: d.receiptFooter || 'شكراً لزيارتكم'
                    });
                }
            } catch (err: any) {
                setErrorMsg((err.response && err.response.data && err.response.data.error) || 'فشل في تحميل الإعدادات');
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
            setMessage('تم حفظ وتحديث إعدادات المنشأة والعملة بنجاح');
        } catch (err: any) {
            setErrorMsg((err.response && err.response.data && err.response.data.error) || 'فشل في حفظ التعديلات');
        } finally {
            setSaving(false);
        }
    };

    // حسابات المعاينة الحية للفاتورة
    const sampleSubtotal = 100.00;
    const sampleTax = Number(((sampleSubtotal * (formData.taxRate || 0)) / 100).toFixed(2));
    const sampleTotal = (sampleSubtotal + sampleTax).toFixed(2);

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
                            <h1 className="text-lg font-bold text-white">إعدادات المنشأة والضرائب والعملة</h1>
                            <p className="text-xs text-slate-400">تخصيص بيانات المتجر، السوق، طرق الدفع والمعاينة الفورية</p>
                        </div>
                    </div>

                    <Link
                        href="/pos"
                        className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                        <ArrowRight size={14} /> العودة للكاشير
                    </Link>
                </div>

                {message && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center gap-2">
                        <CheckCircle2 size={16} /> {message}
                    </div>
                )}

                {errorMsg && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl flex items-center gap-2">
                        <AlertCircle size={16} /> {errorMsg}
                    </div>
                )}

                {loading ? (
                    <div className="text-center py-20 text-xs text-slate-500">جارٍ تحميل الإعدادات...</div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                        {/* Form Column */}
                        <form onSubmit={handleSubmit} className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 text-xs shadow-2xl">

                            {/* Preset Selection */}
                            <div>
                                <label className="text-slate-300 block mb-1.5 font-bold flex items-center gap-1.5">
                                    <Globe size={15} className="text-blue-400" /> اختيار السوق والتهيئة السريعة:
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => handleCountryPreset('EG')}
                                        className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${formData.country === 'EG'
                                                ? 'bg-blue-600 border-blue-500 text-white shadow-lg'
                                                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                                            }`}
                                    >
                                        🇪🇬 مصر (14% / ج.م)
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => handleCountryPreset('SA')}
                                        className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${formData.country === 'SA'
                                                ? 'bg-blue-600 border-blue-500 text-white shadow-lg'
                                                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                                            }`}
                                    >
                                        🇸🇦 السعودية (15% / SAR)
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => handleCountryPreset('OTHER')}
                                        className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${formData.country === 'OTHER'
                                                ? 'bg-blue-600 border-blue-500 text-white shadow-lg'
                                                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                                            }`}
                                    >
                                        🌐 سوق مخصص
                                    </button>
                                </div>
                            </div>

                            {/* Currency & Tax */}
                            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
                                <div>
                                    <label className="text-slate-400 block mb-1 font-semibold flex items-center gap-1.5">
                                        <DollarSign size={14} className="text-emerald-400" /> رمز العملة:
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.currency}
                                        onChange={e => setFormData({ ...formData, currency: e.target.value })}
                                        placeholder="ج.م أو SAR"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-bold focus:outline-none focus:border-blue-500 transition"
                                    />
                                </div>

                                <div>
                                    <label className="text-slate-400 block mb-1 font-semibold flex items-center gap-1.5">
                                        <Percent size={14} className="text-amber-400" /> نسبة الضريبة (%):
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        max="100"
                                        step="0.1"
                                        value={formData.taxRate}
                                        onChange={e => setFormData({ ...formData, taxRate: Number(e.target.value) })}
                                        placeholder="14"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-blue-500 transition"
                                    />
                                    <span className="text-[10px] text-slate-500 mt-0.5 block">ضع 0 إذا كان المتجر غير مسجل ضريبياً</span>
                                </div>
                            </div>

                            {/* Store Name */}
                            <div>
                                <label className="text-slate-400 block mb-1 font-semibold flex items-center gap-1.5">
                                    <Building2 size={14} className="text-blue-400" /> الاسم التجاري للمنشأة:
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-blue-500 transition"
                                />
                            </div>

                            {/* Tax & CR */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-slate-400 block mb-1 font-semibold flex items-center gap-1.5">
                                        <Hash size={14} className="text-amber-400" /> الرقم الضريبي / التسجيل (إن وجد):
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.vatNumber}
                                        onChange={e => setFormData({ ...formData, vatNumber: e.target.value })}
                                        placeholder="الرقم الضريبي"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-blue-500 transition"
                                    />
                                </div>

                                <div>
                                    <label className="text-slate-400 block mb-1 font-semibold flex items-center gap-1.5">
                                        <FileText size={14} className="text-indigo-400" /> رقم السجل التجاري:
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.commercialRegister}
                                        onChange={e => setFormData({ ...formData, commercialRegister: e.target.value })}
                                        placeholder="رقم السجل"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-blue-500 transition"
                                    />
                                </div>
                            </div>

                            {/* Address & Phone */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-slate-400 block mb-1 font-semibold flex items-center gap-1.5">
                                        <MapPin size={14} className="text-rose-400" /> العنوان والفرع:
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.address}
                                        onChange={e => setFormData({ ...formData, address: e.target.value })}
                                        placeholder="المدينة - المنطقة"
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
                                        placeholder="010xxxxxxxx"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-blue-500 transition"
                                    />
                                </div>
                            </div>

                            {/* InstaPay */}
                            <div>
                                <label className="text-slate-400 block mb-1 font-semibold flex items-center gap-1.5">
                                    <Smartphone size={14} className="text-violet-400" /> عنوان الدفع عبر InstaPay (اختياري للطباعة):
                                </label>
                                <input
                                    type="text"
                                    value={formData.instapayAddress}
                                    onChange={e => setFormData({ ...formData, instapayAddress: e.target.value })}
                                    placeholder="username@instapay"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-violet-500 transition dir-ltr text-right"
                                />
                            </div>

                            {/* Receipt Footer */}
                            <div>
                                <label className="text-slate-400 block mb-1 font-semibold flex items-center gap-1.5">
                                    <Receipt size={14} className="text-sky-400" /> رسالة تذييل الفاتورة:
                                </label>
                                <textarea
                                    rows={2}
                                    value={formData.receiptFooter}
                                    onChange={e => setFormData({ ...formData, receiptFooter: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-blue-500 resize-none transition"
                                />
                            </div>

                            <Button
                                type="submit"
                                disabled={saving}
                                className="w-full py-3 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg transition active:scale-95"
                            >
                                {saving ? 'جارٍ حفظ الإعدادات...' : 'حفظ التعديلات وتطبيق العملة'}
                            </Button>
                        </form>

                        {/* Live Preview Column */}
                        <div className="lg:col-span-5 space-y-3">
                            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                                <span className="font-bold flex items-center gap-1.5 text-white">
                                    <Eye size={15} className="text-blue-400" /> معاينة الفاتورة الحية
                                </span>
                                <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full font-mono font-bold">
                                    {formData.currency} ({formData.taxRate}%)
                                </span>
                            </div>

                            <div className="bg-white text-slate-900 rounded-3xl p-6 shadow-2xl font-sans text-xs border border-slate-200">
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
                                    {formData.vatNumber && (
                                        <p className="text-[11px] text-slate-600 font-mono mt-1 font-semibold">
                                            الرقم الضريبي: {formData.vatNumber}
                                        </p>
                                    )}
                                    <div className="mt-1.5 inline-block px-2 py-0.5 rounded bg-slate-100 text-[10px] font-bold text-slate-600">
                                        {formData.taxRate > 0 ? `فاتورة ضريبية (${formData.taxRate}%)` : 'فاتورة مبيعات'}
                                    </div>
                                </div>

                                <div className="py-2.5 text-xs space-y-1 border-b border-dashed border-slate-300 font-mono">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500 font-sans">رقم الفاتورة:</span>
                                        <span className="font-bold">INV-10492</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500 font-sans">التاريخ:</span>
                                        <span>2026-08-25 14:00</span>
                                    </div>
                                </div>

                                <div className="py-2.5 space-y-1.5 border-b border-dashed border-slate-300 text-xs">
                                    <div className="grid grid-cols-12 font-bold text-slate-500 pb-1 border-b border-slate-100 text-[10px]">
                                        <span className="col-span-6">الصنف</span>
                                        <span className="col-span-2 text-center">الكمية</span>
                                        <span className="col-span-4 text-left">المبلغ</span>
                                    </div>
                                    <div className="grid grid-cols-12 items-center py-0.5">
                                        <span className="col-span-6 truncate font-medium">قهوة لاتيه</span>
                                        <span className="col-span-2 text-center font-mono">1</span>
                                        <span className="col-span-4 text-left font-mono">55.00</span>
                                    </div>
                                    <div className="grid grid-cols-12 items-center py-0.5">
                                        <span className="col-span-6 truncate font-medium">ساندوتش تركي</span>
                                        <span className="col-span-2 text-center font-mono">1</span>
                                        <span className="col-span-4 text-left font-mono">45.00</span>
                                    </div>
                                </div>

                                <div className="py-2.5 space-y-1 text-xs border-b border-dashed border-slate-300 font-mono">
                                    <div className="flex justify-between text-slate-600 font-sans">
                                        <span>المجموع الفرعي:</span>
                                        <span>{sampleSubtotal.toFixed(2)} {formData.currency}</span>
                                    </div>
                                    {formData.taxRate > 0 && (
                                        <div className="flex justify-between text-slate-600 font-sans">
                                            <span>الضريبة ({formData.taxRate}%):</span>
                                            <span>{sampleTax.toFixed(2)} {formData.currency}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-sm font-bold text-slate-900 pt-1.5 border-t border-slate-200 font-sans">
                                        <span>الإجمالي:</span>
                                        <span className="font-mono text-base text-blue-600">{sampleTotal} {formData.currency}</span>
                                    </div>
                                </div>

                                {formData.instapayAddress && (
                                    <div className="py-2 text-center bg-slate-50 rounded-xl my-2 border border-slate-200">
                                        <span className="text-[10px] text-slate-500 block">للدفع السريع عبر InstaPay:</span>
                                        <span className="font-mono font-bold text-xs text-violet-700">{formData.instapayAddress}</span>
                                    </div>
                                )}

                                <div className="py-2.5 text-center flex flex-col items-center justify-center">
                                    <div className="p-1.5 bg-white border border-slate-200 rounded-lg inline-block">
                                        <QRCodeSVG
                                            value={`SARH|${formData.name}|${formData.vatNumber || 'NA'}|2026-08-25T14:00:00Z|${sampleTotal}|${sampleTax}`}
                                            size={85}
                                            level="M"
                                        />
                                    </div>
                                    <p className="text-[10px] text-slate-500 mt-2 font-sans font-medium px-2 leading-relaxed">
                                        {formData.receiptFooter}
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