'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import {
    Shirt, Layers, ArrowLeftRight, Store, Plus,
    Printer, Barcode, Search, CheckCircle2, AlertCircle,
    ArrowRight, Tag, RefreshCw, X, Box, Truck, Check, Eye
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import AppSwitcher from '@/components/AppSwitcher';
// مصفوفة المقاسات والألوان الافتراضية
const PRESET_SIZES = ['S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'];
const PRESET_COLORS = ['أسود', 'أبيض', 'كحلي', 'رمادي', 'بيج', 'زيتي', 'نبيتي'];

export default function RetailDashboardPage() {
    const [activeTab, setActiveTab] = useState<'products' | 'matrix' | 'transfers' | 'branches'>('products');

    // Data States
    const [products, setProducts] = useState<any[]>([]);
    const [branches, setBranches] = useState<any[]>([]);
    const [transfers, setTransfers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [message, setMessage] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    // Matrix Creation Form State
    const [matrixForm, setMatrixForm] = useState({
        name: '',
        category: 'ملابس رجالي',
        brand: '',
        description: '',
        price: '',
        costPrice: '',
        initialStockPerVariant: '10',
        selectedSizes: ['M', 'L', 'XL'],
        selectedColors: ['أسود', 'أبيض', 'كحلي'],
        initialBranchId: ''
    });

    // New Branch State
    const [branchForm, setBranchForm] = useState({ name: '', code: '', address: '', phone: '', isMain: false });
    const [showBranchModal, setShowBranchModal] = useState(false);

    // New Transfer State
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [transferForm, setTransferForm] = useState({
        fromBranchId: '',
        toBranchId: '',
        notes: '',
        items: [] as any[]
    });

    // Thermal Barcode Print Modal State
    const [printVariant, setPrintVariant] = useState<any>(null);
    const [printCopies, setPrintCopies] = useState<number>(1);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [prodRes, branchRes, transRes] = await Promise.all([
                api.get('/retail/products'),
                api.get('/retail/branches'),
                api.get('/retail/transfers')
            ]);

            setProducts(prodRes.data.data || []);
            const branchList = branchRes.data.data || [];
            setBranches(branchList);
            setTransfers(transRes.data.data || []);

            if (branchList.length > 0 && !matrixForm.initialBranchId) {
                setMatrixForm(prev => ({ ...prev, initialBranchId: branchList[0]._id }));
            }
        } catch (err: any) {
            setErrorMsg(err.response?.data?.error || 'فشل في تحميل بيانات التجزئة');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // 1. توليد صنف الملابس والمصفوفة
    const handleCreateMatrixProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        setErrorMsg('');

        if (matrixForm.selectedSizes.length === 0 || matrixForm.selectedColors.length === 0) {
            alert('يرجى اختيار مقاس واحد ولون واحد على الأقل للمصفوفة');
            return;
        }

        try {
            const payload = {
                name: matrixForm.name,
                category: matrixForm.category,
                brand: matrixForm.brand,
                description: matrixForm.description,
                price: Number(matrixForm.price),
                costPrice: Number(matrixForm.costPrice || 0),
                initialStockPerVariant: Number(matrixForm.initialStockPerVariant || 0),
                sizes: matrixForm.selectedSizes,
                colors: matrixForm.selectedColors,
                initialBranchId: matrixForm.initialBranchId || branches[0]?._id
            };

            const res = await api.post('/retail/products/matrix', payload);
            setMessage(res.data.message);
            setActiveTab('products');
            fetchData();

            // Reset Form
            setMatrixForm(prev => ({
                ...prev,
                name: '',
                brand: '',
                price: '',
                costPrice: '',
                description: ''
            }));
        } catch (err: any) {
            setErrorMsg(err.response?.data?.error || 'فشل إنشاء مصفوفة الملابس');
        }
    };

    // 2. إنشاء فرع جديد
    const handleCreateBranch = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/retail/branches', branchForm);
            setShowBranchModal(false);
            setBranchForm({ name: '', code: '', address: '', phone: '', isMain: false });
            fetchData();
        } catch (err: any) {
            alert(err.response?.data?.error || 'فشل إنشاء الفرع');
        }
    };

    // 3. إرسال مناقلة بضاعة
    const handleDispatchTransfer = async () => {
        if (!transferForm.fromBranchId || !transferForm.toBranchId || transferForm.items.length === 0) {
            alert('يرجى تحديد الفروع والأصناف المراد نقلها');
            return;
        }
        try {
            await api.post('/retail/transfers/dispatch', transferForm);
            setShowTransferModal(false);
            setTransferForm({ fromBranchId: '', toBranchId: '', notes: '', items: [] });
            fetchData();
            alert('تم إصدار إذن التحويل وخصم البضاعة من الفرع بنجاح');
        } catch (err: any) {
            alert(err.response?.data?.error || 'فشل إرسال التحويل');
        }
    };

    // 4. استلام مناقلة بضاعة
    const handleReceiveTransfer = async (transferId: string) => {
        if (!confirm('تأكيد استلام الشحنة وإضافتها لمخزون الفرع؟')) return;
        try {
            await api.post('/retail/transfers/receive', { transferId });
            alert('تم استلام البضاعة وإضافتها للفرع بنجاح');
            fetchData();
        } catch (err: any) {
            alert(err.response?.data?.error || 'فشل استلام الشحنة');
        }
    };

    // مساعد لتبديل المقاسات في المصفوفة
    const toggleSize = (size: string) => {
        setMatrixForm(prev => {
            const exists = prev.selectedSizes.includes(size);
            return {
                ...prev,
                selectedSizes: exists ? prev.selectedSizes.filter(s => s !== size) : [...prev.selectedSizes, size]
            };
        });
    };

    // مساعد لتبديل الألوان في المصفوفة
    const toggleColor = (color: string) => {
        setMatrixForm(prev => {
            const exists = prev.selectedColors.includes(color);
            return {
                ...prev,
                selectedColors: exists ? prev.selectedColors.filter(c => c !== color) : [...prev.selectedColors, color]
            };
        });
    };

    // تصفية المنتجات
    const filteredProducts = products.filter(p =>
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.variants?.some((v: any) => v.barcode?.includes(searchTerm) || v.sku?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-6 font-sans selection:bg-blue-600 selection:text-white" dir="rtl">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shadow-lg">
                            <Shirt size={26} />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-white flex items-center gap-2">
                                صَرْح Retail — إدارة التجزئة والملابس
                            </h1>
                            <p className="text-xs text-slate-400">مصفوفة المقاسات والألوان، طباعة الباركود الحراري، ومناقلات الفروع</p>
                        </div>
                    </div>
                    {/* أزرار الهيدر العلوية في retail/page.tsx */}
                    <div className="flex items-center gap-2">

                        {/* ⬅️ أضف هذا المكون هنا */}
                        <AppSwitcher />

                        <button
                            onClick={fetchData}
                            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
                            title="تحديث البيانات"
                        >
                            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        </button>

                        <Link
                            href="/retail/pos"
                            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition"
                        >
                            <span>كاشير الملابس</span>
                        </Link>
                    </div>
                </div>

                {/* Notifications */}
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

                {/* Navigation Tabs */}
                <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800 max-w-2xl">
                    {[
                        { id: 'products', label: `الموديلات والأصناف (${products.length})`, icon: Shirt },
                        { id: 'matrix', label: 'مُولّد مصفوفة ملابس +', icon: Layers },
                        { id: 'transfers', label: `مناقلات الفروع (${transfers.length})`, icon: ArrowLeftRight },
                        { id: 'branches', label: `الفروع والمستودعات (${branches.length})`, icon: Store },
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

                {/* ==================================================== */}
                {/* TAB 1: PRODUCTS & VARIANTS LIST                     */}
                {/* ==================================================== */}
                {activeTab === 'products' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between gap-4">
                            <div className="relative max-w-md w-full">
                                <Search className="absolute right-3.5 top-3 text-slate-500" size={16} />
                                <input
                                    type="text"
                                    placeholder="ابحث باسم الموديل، الماركة، الباركود أو الـ SKU..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pr-10 pl-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            <Button
                                onClick={() => setActiveTab('matrix')}
                                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-1.5"
                            >
                                <Plus size={16} /> إضافة موديل ملابس جديد
                            </Button>
                        </div>

                        {loading ? (
                            <div className="text-center py-20 text-xs text-slate-500">جارٍ جلب الأصناف...</div>
                        ) : filteredProducts.length === 0 ? (
                            <div className="text-center py-20 bg-slate-900 rounded-3xl border border-slate-800 text-slate-500 text-xs">
                                لا توجد أصناف مسجلة حالياً. اضغط على "مُولّد مصفوفة ملابس" لإنشاء أول موديل.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {filteredProducts.map(product => (
                                    <div key={product._id} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h2 className="text-base font-black text-white">{product.name}</h2>
                                                    {product.brand && (
                                                        <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-lg text-[10px] font-bold">
                                                            {product.brand}
                                                        </span>
                                                    )}
                                                    <span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded-lg text-[10px]">
                                                        {product.category}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-400 mt-1">
                                                    السعر الأساسي: <span className="text-emerald-400 font-bold font-mono">{product.basePrice} ج.م</span> •
                                                    عدد المتغيرات: <span className="text-white font-bold">{product.variants?.length || 0} قطعة</span>
                                                </p>
                                            </div>
                                        </div>

                                        {/* جدول مصفوفة المقاسات والألوان الخاصة بالموديل */}
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-right text-xs">
                                                <thead className="bg-slate-950 text-slate-400 text-[11px] border-b border-slate-800">
                                                    <tr>
                                                        <th className="p-3">المقاس</th>
                                                        <th className="p-3">اللون</th>
                                                        <th className="p-3">الباركود (Barcode)</th>
                                                        <th className="p-3">رمز الصنف (SKU)</th>
                                                        <th className="p-3">السعر</th>
                                                        <th className="p-3">المخزون الإجمالي</th>
                                                        <th className="p-3 text-center">طباعة ملصق حراري</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-800/50">
                                                    {product.variants?.map((v: any) => {
                                                        const totalStock = v.stockByBranch?.reduce((sum: number, b: any) => sum + (b.quantity || 0), 0) || 0;
                                                        return (
                                                            <tr key={v._id} className="hover:bg-slate-800/30 transition">
                                                                <td className="p-3 font-bold text-amber-400 font-mono text-sm">{v.attributes?.size}</td>
                                                                <td className="p-3 text-slate-300 font-semibold">{v.attributes?.color}</td>
                                                                <td className="p-3 font-mono text-slate-400 font-bold">{v.barcode}</td>
                                                                <td className="p-3 font-mono text-slate-400 text-[11px]">{v.sku}</td>
                                                                <td className="p-3 font-mono font-bold text-emerald-400">{v.price} ج.م</td>
                                                                <td className="p-3">
                                                                    <span className={`px-2 py-0.5 rounded-lg font-mono font-bold text-[11px] ${totalStock > 3 ? 'bg-slate-800 text-white' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                                                        }`}>
                                                                        {totalStock} قطعة
                                                                    </span>
                                                                </td>
                                                                <td className="p-3 text-center">
                                                                    <button
                                                                        onClick={() => setPrintVariant({ ...v, productName: product.name, brand: product.brand })}
                                                                        className="p-1.5 bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white rounded-lg transition text-xs flex items-center gap-1 mx-auto"
                                                                        title="معاينة وطباعة الباركود"
                                                                    >
                                                                        <Printer size={14} /> طباعة
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ==================================================== */}
                {/* TAB 2: MATRIX GENERATOR (مُولّد المقاسات والألوان) */}
                {/* ==================================================== */}
                {activeTab === 'matrix' && (
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-xs space-y-6">
                        <div>
                            <h2 className="text-base font-black text-white flex items-center gap-2">
                                <Layers className="text-blue-400" size={18} /> مُولّد مصفوفة موديلات الملابس (Variant Matrix Engine)
                            </h2>
                            <p className="text-slate-400 text-xs mt-1">
                                حدد الموديل والمقاسات والألوان، وسيقوم النظام بتوليد كافة الأصناف والباركود والـ SKUs تلقائياً بضغطة واحدة.
                            </p>
                        </div>

                        <form onSubmit={handleCreateMatrixProduct} className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="text-slate-300 block mb-1 font-bold">اسم الموديل / القطعة:</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="مثال: قميص أكسفورد كلاسيك"
                                        value={matrixForm.name}
                                        onChange={e => setMatrixForm({ ...matrixForm, name: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="text-slate-300 block mb-1 font-bold">الماركة / البراند (Brand):</label>
                                    <input
                                        type="text"
                                        placeholder="مثال: Zara أو صَرْح"
                                        value={matrixForm.brand}
                                        onChange={e => setMatrixForm({ ...matrixForm, brand: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="text-slate-300 block mb-1 font-bold">القسم / التصنيف:</label>
                                    <select
                                        value={matrixForm.category}
                                        onChange={e => setMatrixForm({ ...matrixForm, category: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-blue-500"
                                    >
                                        <option value="ملابس رجالي">ملابس رجالي</option>
                                        <option value="ملابس حريمي">ملابس حريمي</option>
                                        <option value="ملابس أطفال">ملابس أطفال</option>
                                        <option value="أحذية">أحذية</option>
                                        <option value="إكسسوارات">إكسسوارات</option>
                                    </select>
                                </div>
                            </div>

                            {/* الأسعار والمخزون الأولي */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-slate-950 rounded-2xl border border-slate-800">
                                <div>
                                    <label className="text-slate-300 block mb-1 font-bold">سعر البيع للقطعة (ج.م):</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        step="0.5"
                                        placeholder="350"
                                        value={matrixForm.price}
                                        onChange={e => setMatrixForm({ ...matrixForm, price: e.target.value })}
                                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white font-mono font-bold focus:outline-none focus:border-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="text-slate-300 block mb-1 font-bold">سعر التكلفة (اختياري):</label>
                                    <input
                                        type="number"
                                        min="0"
                                        placeholder="180"
                                        value={matrixForm.costPrice}
                                        onChange={e => setMatrixForm({ ...matrixForm, costPrice: e.target.value })}
                                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="text-slate-300 block mb-1 font-bold">الرصيد الأولي لكل متغير:</label>
                                    <input
                                        type="number"
                                        min="0"
                                        placeholder="10"
                                        value={matrixForm.initialStockPerVariant}
                                        onChange={e => setMatrixForm({ ...matrixForm, initialStockPerVariant: e.target.value })}
                                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            {/* اختيار المقاسات (Sizes Matrix) */}
                            <div>
                                <label className="text-slate-300 block mb-2 font-bold flex items-center justify-between">
                                    <span>1. اختر المقاسات المتاحة للموديل:</span>
                                    <span className="text-blue-400 font-mono">{matrixForm.selectedSizes.length} مقاس محدد</span>
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {PRESET_SIZES.map(size => {
                                        const isSelected = matrixForm.selectedSizes.includes(size);
                                        return (
                                            <button
                                                key={size}
                                                type="button"
                                                onClick={() => toggleSize(size)}
                                                className={`px-4 py-2 rounded-xl text-xs font-bold font-mono transition border ${isSelected
                                                    ? 'bg-blue-600 border-blue-500 text-white shadow-lg'
                                                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                                                    }`}
                                            >
                                                {size}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* اختيار الألوان (Colors Matrix) */}
                            <div>
                                <label className="text-slate-300 block mb-2 font-bold flex items-center justify-between">
                                    <span>2. اختر الألوان المتاحة للموديل:</span>
                                    <span className="text-blue-400 font-mono">{matrixForm.selectedColors.length} لون محدد</span>
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {PRESET_COLORS.map(color => {
                                        const isSelected = matrixForm.selectedColors.includes(color);
                                        return (
                                            <button
                                                key={color}
                                                type="button"
                                                onClick={() => toggleColor(color)}
                                                className={`px-4 py-2 rounded-xl text-xs font-bold transition border ${isSelected
                                                    ? 'bg-blue-600 border-blue-500 text-white shadow-lg'
                                                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                                                    }`}
                                            >
                                                {color}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* ملخص التوليد الحي */}
                            <div className="p-4 bg-blue-600/10 border border-blue-500/20 rounded-2xl flex items-center justify-between">
                                <div>
                                    <span className="text-white font-bold block text-sm">
                                        سيتم توليد: {matrixForm.selectedSizes.length * matrixForm.selectedColors.length} صنف فرعي
                                    </span>
                                    <p className="text-[11px] text-slate-400 mt-0.5">
                                        ({matrixForm.selectedSizes.length} مقاس × {matrixForm.selectedColors.length} لون) وكل صنف له باركود و SKU مستقل ورصيد {matrixForm.initialStockPerVariant} قطعة.
                                    </p>
                                </div>
                                <Button
                                    type="submit"
                                    className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-3 px-6 rounded-xl shadow-lg"
                                >
                                    توليد وحفظ الموديل الآن
                                </Button>
                            </div>
                        </form>
                    </div>
                )}

                {/* ==================================================== */}
                {/* TAB 3: STOCK TRANSFERS (مناقلات الفروع)              */}
                {/* ==================================================== */}
                {activeTab === 'transfers' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-base font-black text-white">إذن مناقلات وتحويلات الفروع</h2>
                                <p className="text-slate-400 text-xs">نقل البضائع والمقاسات بين المستودع المركزي والفروع</p>
                            </div>
                            <Button
                                onClick={() => setShowTransferModal(true)}
                                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-1.5"
                            >
                                <Plus size={16} /> إنشاء إذن نقل بضاعة جديد
                            </Button>
                        </div>

                        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl text-xs">
                            <table className="w-full text-right">
                                <thead className="bg-slate-950 text-slate-400 text-[11px] border-b border-slate-800">
                                    <tr>
                                        <th className="p-4">رقم الإذن</th>
                                        <th className="p-4">من فرع</th>
                                        <th className="p-4">إلى فرع</th>
                                        <th className="p-4">عدد الأصناف</th>
                                        <th className="p-4">الحالة</th>
                                        <th className="p-4">تاريخ الإرسال</th>
                                        <th className="p-4 text-center">الإجراء</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/60">
                                    {transfers.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="text-center py-12 text-slate-500">لا توجد مناقلات مسجلة حالياً</td>
                                        </tr>
                                    ) : (
                                        transfers.map(trf => (
                                            <tr key={trf._id} className="hover:bg-slate-800/30 transition">
                                                <td className="p-4 font-mono font-bold text-white">{trf.transferNumber}</td>
                                                <td className="p-4 font-bold text-slate-300">{trf.fromBranch?.name}</td>
                                                <td className="p-4 font-bold text-blue-400">{trf.toBranch?.name}</td>
                                                <td className="p-4 font-mono">{trf.items?.length || 0} صنف</td>
                                                <td className="p-4">
                                                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${trf.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                                        trf.status === 'in_transit' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                                            'bg-slate-800 text-slate-400'
                                                        }`}>
                                                        {trf.status === 'completed' ? 'تم الاستلام' : trf.status === 'in_transit' ? 'في الطريق (شاحنة)' : trf.status}
                                                    </span>
                                                </td>
                                                <td className="p-4 font-mono text-slate-400 text-[11px]">
                                                    {new Date(trf.createdAt).toLocaleDateString('ar-EG')}
                                                </td>
                                                <td className="p-4 text-center">
                                                    {trf.status === 'in_transit' && (
                                                        <button
                                                            onClick={() => handleReceiveTransfer(trf._id)}
                                                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 mx-auto transition"
                                                        >
                                                            <Check size={14} /> تأكيد الاستلام بالفرع
                                                        </button>
                                                    )}
                                                    {trf.status === 'completed' && (
                                                        <span className="text-slate-500 text-[11px]">مكتمل ومضاف للمخزن</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* ==================================================== */}
                {/* TAB 4: BRANCHES (الفروع والمستودعات)                  */}
                {/* ==================================================== */}
                {activeTab === 'branches' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-base font-black text-white">فروع المنشأة ومستودعات التوزيع</h2>
                                <p className="text-slate-400 text-xs">إدارة شبكة الفروع ونقاط البيع الخاصة بالمتجر</p>
                            </div>
                            <Button
                                onClick={() => setShowBranchModal(true)}
                                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-1.5"
                            >
                                <Plus size={16} /> إضافة فرع جديد
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {branches.map(b => (
                                <div key={b._id} className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-3 shadow-xl">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-bold text-white text-base">{b.name}</h3>
                                            <p className="text-xs text-slate-400 font-mono">كود: {b.code}</p>
                                        </div>
                                        {b.isMain && (
                                            <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-1 rounded-lg text-[10px] font-bold">
                                                الفرع الرئيسي
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-slate-400 text-xs space-y-1 pt-2 border-t border-slate-800">
                                        <p>العنوان: {b.address || 'غير محدد'}</p>
                                        <p>الهاتف: {b.phone || '-'}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ==================================================== */}
                {/* MODAL 1: ADD BRANCH                                  */}
                {/* ==================================================== */}
                {showBranchModal && (
                    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full text-xs space-y-4 shadow-2xl">
                            <div className="flex justify-between items-center">
                                <h3 className="font-bold text-white text-sm">إضافة فرع أو مستودع جديد</h3>
                                <button onClick={() => setShowBranchModal(false)}><X size={16} className="text-slate-400" /></button>
                            </div>
                            <form onSubmit={handleCreateBranch} className="space-y-3">
                                <div>
                                    <label className="text-slate-300 block mb-1">اسم الفرع:</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="فرع المهندسين / مستودع التجمع"
                                        value={branchForm.name}
                                        onChange={e => setBranchForm({ ...branchForm, name: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white"
                                    />
                                </div>
                                <div>
                                    <label className="text-slate-300 block mb-1">كود الفرع (Code):</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="BR-02"
                                        value={branchForm.code}
                                        onChange={e => setBranchForm({ ...branchForm, code: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white font-mono uppercase"
                                    />
                                </div>
                                <div>
                                    <label className="text-slate-300 block mb-1">العنوان:</label>
                                    <input
                                        type="text"
                                        placeholder="شارع لبنان - المهندسين"
                                        value={branchForm.address}
                                        onChange={e => setBranchForm({ ...branchForm, address: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white"
                                    />
                                </div>
                                <div>
                                    <label className="text-slate-300 block mb-1">رقم الهاتف:</label>
                                    <input
                                        type="text"
                                        placeholder="01012345678"
                                        value={branchForm.phone}
                                        onChange={e => setBranchForm({ ...branchForm, phone: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white font-mono"
                                    />
                                </div>
                                <Button type="submit" className="w-full py-2.5 bg-blue-600 text-white font-bold text-xs">
                                    حفظ الفرع
                                </Button>
                            </form>
                        </div>
                    </div>
                )}

                {/* ==================================================== */}
                {/* MODAL 2: THERMAL BARCODE LABEL PRINT (ملصق الباركود) */}
                {/* ==================================================== */}
                {printVariant && (
                    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full text-xs space-y-4 shadow-2xl">
                            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                                <span className="font-bold text-white flex items-center gap-1.5">
                                    <Printer size={16} className="text-blue-400" /> معاينة ملصق الملابس (Thermal Tag)
                                </span>
                                <button onClick={() => setPrintVariant(null)}><X size={16} className="text-slate-400" /></button>
                            </div>

                            {/* تصميم الملصق الفعلي للطباعة (38x25mm / 50x30mm) */}
                            <div id="thermal-label-preview" className="bg-white text-slate-950 p-4 rounded-2xl shadow-xl text-center space-y-1 border border-slate-200 font-sans">
                                <div className="text-[11px] font-black uppercase tracking-wider">{printVariant.brand || 'صَرْح RETAIL'}</div>
                                <div className="text-xs font-bold truncate">{printVariant.productName}</div>

                                <div className="flex justify-center items-center gap-2 text-[11px] font-bold py-0.5">
                                    <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-300">مقاس: {printVariant.attributes?.size}</span>
                                    <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-300">لون: {printVariant.attributes?.color}</span>
                                </div>

                                {/* رسم خطوط الباركود القياسية */}
                                <div className="py-1 flex flex-col items-center justify-center">
                                    <div className="font-mono text-base font-black tracking-widest leading-none">
                                        ||||| | |||| ||| || ||||
                                    </div>
                                    <span className="font-mono text-xs font-bold tracking-wider mt-0.5">{printVariant.barcode}</span>
                                </div>

                                <div className="text-sm font-black pt-1 border-t border-dashed border-slate-400 font-mono">
                                    {printVariant.price}.00 EGP
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <label className="text-slate-400">عدد الملصقات:</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="100"
                                    value={printCopies}
                                    onChange={e => setPrintCopies(Number(e.target.value))}
                                    className="w-16 bg-slate-950 border border-slate-800 rounded-xl px-2 py-1 text-white font-mono text-center"
                                />
                            </div>

                            <Button
                                onClick={() => {
                                    window.print();
                                }}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 rounded-xl shadow-lg"
                            >
                                <Printer size={16} /> طباعة الملصق الآن (Print)
                            </Button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}