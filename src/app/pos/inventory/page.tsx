'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Package, Plus, Search, AlertTriangle, ArrowRight,
    Barcode, Layers, TrendingUp, Edit3, CheckCircle2, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';

interface Product {
    _id: string;
    name: string;
    barcode: string;
    category: string;
    costPrice: number;
    sellingPrice: number;
    stockQuantity: number;
    minStockAlert: number;
    unit: string;
}

export default function InventoryPage() {
    const router = useRouter();
    const [token, setToken] = useState('');
    const [tenantSubdomain, setTenantSubdomain] = useState('');
    const [products, setProducts] = useState<Product[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterLowStock, setFilterLowStock] = useState(false);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');

    // حالة مودال إضافة منتج
    const [showAddModal, setShowAddModal] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        barcode: '',
        category: 'عام',
        costPrice: '',
        sellingPrice: '',
        stockQuantity: '',
        minStockAlert: '5',
        unit: 'piece'
    });
    const [submitting, setSubmitting] = useState(false);

    // حالة مودال تعديل الكمية السريع
    const [adjustModalProduct, setAdjustModalProduct] = useState<Product | null>(null);
    const [adjustQty, setAdjustQty] = useState('');

    useEffect(() => {
        const savedToken = localStorage.getItem('sarh_token');
        const savedSubdomain = localStorage.getItem('sarh_tenant_subdomain') || 'alsarh-express';

        if (!savedToken) {
            router.push('/login');
            return;
        }

        setToken(savedToken);
        setTenantSubdomain(savedSubdomain);
        fetchInventory(savedToken, savedSubdomain);
    }, []);

    const getHeaders = (authToken = token, sub = tenantSubdomain) => ({
        'Authorization': `Bearer ${authToken}`,
        'x-tenant-subdomain': sub
    });

    const fetchInventory = async (authToken = token, sub = tenantSubdomain) => {
        try {
            setLoading(true);
            setErrorMessage('');
            const res = await api.get('/pos/products');
            setProducts(res.data.data);
        } catch (err: any) {
            if (err.response?.status === 401) {
                localStorage.removeItem('sarh_token');
                router.push('/login');
            } else {
                setErrorMessage(err.response?.data?.error || 'فشل في جلب بيانات المخزون');
            }
        } finally {
            setLoading(false);
        }
    };

    // إضافة منتج جديد
    const handleCreateProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await axios.post(
                'http://localhost:5000/api/v1/pos/products',
                {
                    ...formData,
                    costPrice: Number(formData.costPrice) || 0,
                    sellingPrice: Number(formData.sellingPrice),
                    stockQuantity: Number(formData.stockQuantity) || 0,
                    minStockAlert: Number(formData.minStockAlert) || 5
                },
                { headers: getHeaders() }
            );

            setShowAddModal(false);
            setFormData({
                name: '',
                barcode: '',
                category: 'عام',
                costPrice: '',
                sellingPrice: '',
                stockQuantity: '',
                minStockAlert: '5',
                unit: 'piece'
            });
            fetchInventory();
        } catch (err: any) {
            alert(err.response?.data?.error || 'فشل في إضافة المنتج');
        } finally {
            setSubmitting(false);
        }
    };

    // تسوية وتعديل المخزون
    const handleStockAdjustment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!adjustModalProduct) return;
        try {
            await axios.patch(
                'http://localhost:5000/api/v1/pos/products/stock',
                {
                    productId: adjustModalProduct._id,
                    adjustmentQuantity: Number(adjustQty)
                },
                { headers: getHeaders() }
            );
            setAdjustModalProduct(null);
            setAdjustQty('');
            fetchInventory();
        } catch (err: any) {
            alert(err.response?.data?.error || 'فشل في تعديل الكمية');
        }
    };

    const filteredProducts = products.filter(p => {
        const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.barcode?.includes(searchQuery);
        const matchStock = filterLowStock ? p.stockQuantity <= p.minStockAlert : true;
        return matchSearch && matchStock;
    });

    const lowStockCount = products.filter(p => p.stockQuantity <= p.minStockAlert).length;
    const totalInventoryValue = products.reduce((sum, p) => sum + (p.sellingPrice * p.stockQuantity), 0);

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
                        <Package size={18} className="text-blue-400" />
                        <h1 className="text-sm font-bold text-white">إدارة المنتجات والمستودع</h1>
                    </div>
                </div>

                <Button
                    onClick={() => setShowAddModal(true)}
                    className="bg-blue-600 hover:bg-blue-500 text-xs py-2 px-3 font-bold flex items-center gap-1.5"
                >
                    <Plus size={14} /> إضافة منتج جديد
                </Button>
            </header>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto p-6 space-y-6">
                {/* KPI Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
                        <div>
                            <p className="text-xs text-slate-400">إجمالي الأصناف المسجلة</p>
                            <h3 className="text-2xl font-black text-white font-mono mt-1">{products.length}</h3>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                            <Layers size={20} />
                        </div>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
                        <div>
                            <p className="text-xs text-slate-400">أصناف قاربت على النفاد</p>
                            <h3 className="text-2xl font-black text-amber-400 font-mono mt-1">{lowStockCount}</h3>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                            <AlertTriangle size={20} />
                        </div>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
                        <div>
                            <p className="text-xs text-slate-400">إجمالي القيمة البيعية للمخزن</p>
                            <h3 className="text-2xl font-black text-sky-400 font-mono mt-1">{totalInventoryValue.toFixed(2)} SAR</h3>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
                            <TrendingUp size={20} />
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                    <div className="relative w-full sm:w-80">
                        <Search className="absolute right-3.5 top-3 text-slate-500" size={16} />
                        <input
                            type="text"
                            placeholder="ابحث بالاسم أو الباركود..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl pr-10 pl-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    <button
                        onClick={() => setFilterLowStock(!filterLowStock)}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${filterLowStock
                            ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
                            : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                            }`}
                    >
                        <AlertTriangle size={14} /> عرض النواقص فقط ({lowStockCount})
                    </button>
                </div>

                {/* Inventory Table */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                    <table className="w-full text-right text-xs">
                        <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold">
                            <tr>
                                <th className="py-3 px-4">الصنف</th>
                                <th className="py-3 px-4">الباركود</th>
                                <th className="py-3 px-4">التصنيف</th>
                                <th className="py-3 px-4">سعر التكلفة</th>
                                <th className="py-3 px-4">سعر البيع</th>
                                <th className="py-3 px-4">المخزون الحالي</th>
                                <th className="py-3 px-4 text-center">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 font-mono">
                            {filteredProducts.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center text-slate-500">
                                        لا توجد منتجات مطابقة لخيارات البحث
                                    </td>
                                </tr>
                            ) : (
                                filteredProducts.map(product => {
                                    const isLow = product.stockQuantity <= product.minStockAlert;
                                    return (
                                        <tr key={product._id} className="hover:bg-slate-800/30 transition">
                                            <td className="py-3.5 px-4 font-sans font-bold text-white">{product.name}</td>
                                            <td className="py-3.5 px-4 text-slate-400">
                                                <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                                                    {product.barcode}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 font-sans text-slate-300">{product.category}</td>
                                            <td className="py-3.5 px-4 text-slate-400">{product.costPrice} SAR</td>
                                            <td className="py-3.5 px-4 font-bold text-sky-400">{product.sellingPrice} SAR</td>
                                            <td className="py-3.5 px-4">
                                                <span className={`px-2 py-1 rounded-lg font-bold flex items-center gap-1.5 w-fit ${isLow
                                                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                    }`}>
                                                    {isLow && <AlertTriangle size={12} />}
                                                    {product.stockQuantity} {product.unit}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 text-center font-sans">
                                                <button
                                                    onClick={() => setAdjustModalProduct(product)}
                                                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                                                >
                                                    تعديل الكمية
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* نافذة إضافة منتج جديد */}
            {showAddModal && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl">
                        <h3 className="text-base font-bold text-white mb-1">إضافة منتج جديد للمخزن</h3>
                        <p className="text-xs text-slate-400 mb-4">ادخل تفاصيل الصنف والباركود والأسعار</p>

                        <form onSubmit={handleCreateProduct} className="space-y-3">
                            <div>
                                <label className="text-xs text-slate-400 block mb-1">اسم المنتج:</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="مثال: آيس سبانش لاتيه"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-xs text-slate-400 block mb-1">الباركود:</label>
                                    <input
                                        type="text"
                                        value={formData.barcode}
                                        onChange={e => setFormData({ ...formData, barcode: e.target.value })}
                                        placeholder="اتركه فارغاً للتوليد"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400 block mb-1">التصنيف:</label>
                                    <input
                                        type="text"
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-xs text-slate-400 block mb-1">سعر التكلفة (SAR):</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={formData.costPrice}
                                        onChange={e => setFormData({ ...formData, costPrice: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400 block mb-1">سعر البيع (SAR):</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        step="0.01"
                                        value={formData.sellingPrice}
                                        onChange={e => setFormData({ ...formData, sellingPrice: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-xs text-slate-400 block mb-1">الكمية الافتتاحية:</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        value={formData.stockQuantity}
                                        onChange={e => setFormData({ ...formData, stockQuantity: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400 block mb-1">حد التنبيه بالنواقص:</label>
                                    <input
                                        type="number"
                                        value={formData.minStockAlert}
                                        onChange={e => setFormData({ ...formData, minStockAlert: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-2 pt-3">
                                <Button type="submit" disabled={submitting} className="flex-1 py-2.5 text-xs font-bold">
                                    {submitting ? 'جارٍ الحفظ...' : 'حفظ المنتج في المخزن'}
                                </Button>
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl transition"
                                >
                                    إلغاء
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* نافذة تعديل الكمية السريع */}
            {adjustModalProduct && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl">
                        <h3 className="text-base font-bold text-white mb-1">تعديل مخزون [{adjustModalProduct.name}]</h3>
                        <p className="text-xs text-slate-400 mb-4">المخزون الحالي: <span className="font-mono text-white font-bold">{adjustModalProduct.stockQuantity}</span></p>

                        <form onSubmit={handleStockAdjustment} className="space-y-4">
                            <div>
                                <label className="text-xs text-slate-400 block mb-1">الكمية المضافة (استخدم سالب للخصم):</label>
                                <input
                                    type="number"
                                    required
                                    placeholder="مثال: 10 أو -5"
                                    value={adjustQty}
                                    onChange={e => setAdjustQty(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            <div className="flex gap-2">
                                <Button type="submit" className="flex-1 py-2 text-xs font-bold">
                                    تحديث الرصيد
                                </Button>
                                <button
                                    type="button"
                                    onClick={() => setAdjustModalProduct(null)}
                                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl transition"
                                >
                                    إلغاء
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}