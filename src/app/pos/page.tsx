'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Store, ShoppingCart, Plus, Minus, CreditCard,
    Banknote, Search, AlertCircle, Clock, KeyRound,
    LogOut, Printer, X, CheckCircle2, Package, PowerOff, Calculator
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { BarChart3 } from 'lucide-react';

interface Product {
    _id: string;
    name: string;
    barcode: string;
    category: string;
    sellingPrice: number;
    stockQuantity: number;
}

interface CartItem {
    product: Product;
    quantity: number;
}

export default function PosPage() {
    const router = useRouter();
    const [tenantSubdomain, setTenantSubdomain] = useState('');
    const [token, setToken] = useState('');
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('الكل');
    const [searchQuery, setSearchQuery] = useState('');
    const [cart, setCart] = useState<CartItem[]>([]);
    const [activeShift, setActiveShift] = useState<any>(null);
    const [checkoutLoading, setCheckoutLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    // حالة فتح الشيفت
    const [showShiftModal, setShowShiftModal] = useState(false);
    const [openingCashInput, setOpeningCashInput] = useState('100');
    const [cashierNameInput, setCashierNameInput] = useState('كاشير رئيسي');

    // حالة إغلاق الشيفت
    const [showCloseShiftModal, setShowCloseShiftModal] = useState(false);
    const [actualCashInput, setActualCashInput] = useState('');
    const [shiftNotes, setShiftNotes] = useState('');
    const [closingShiftLoading, setClosingShiftLoading] = useState(false);

    // حالة الفاتورة والطباعة
    const [lastInvoice, setLastInvoice] = useState<any>(null);

    // التحقق من المصادقة والجلسة
    useEffect(() => {
        const savedToken = localStorage.getItem('sarh_token');
        const savedSubdomain = localStorage.getItem('sarh_tenant_subdomain') || 'alsarh-express';

        if (!savedToken) {
            router.push('/login');
            return;
        }

        setToken(savedToken);
        setTenantSubdomain(savedSubdomain);
        fetchData(savedToken, savedSubdomain);
    }, []);

    const getHeaders = (authToken = token, sub = tenantSubdomain) => ({
        'Authorization': `Bearer ${authToken}`,
        'x-tenant-subdomain': sub
    });

    const fetchData = async (authToken = token, sub = tenantSubdomain) => {
        try {
            setErrorMessage('');
            const headers = getHeaders(authToken, sub);

            const shiftRes = await axios.get('http://localhost:5000/api/v1/pos/shifts/current', { headers });
            setActiveShift(shiftRes.data.data);

            const prodRes = await axios.get('http://localhost:5000/api/v1/pos/products', { headers });
            const prods: Product[] = prodRes.data.data;
            setProducts(prods);

            const cats = Array.from(new Set(prods.map(p => p.category || 'عام')));
            setCategories(['الكل', ...cats]);
        } catch (err: any) {
            if (err.response?.status === 401) {
                localStorage.removeItem('sarh_token');
                router.push('/login');
            } else {
                setErrorMessage(err.response?.data?.error || 'فشل في جلب البيانات');
            }
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('sarh_token');
        localStorage.removeItem('sarh_user');
        router.push('/login');
    };

    const handleOpenShift = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await axios.post(
                'http://localhost:5000/api/v1/pos/shifts/open',
                {
                    cashierName: cashierNameInput,
                    openingCash: Number(openingCashInput)
                },
                { headers: getHeaders() }
            );
            setShowShiftModal(false);
            fetchData();
        } catch (err: any) {
            setErrorMessage(err.response?.data?.error || 'فشل في فتح الشيفت');
        }
    };

    const handleCloseShift = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeShift) return;
        setClosingShiftLoading(true);

        try {
            await axios.post(
                'http://localhost:5000/api/v1/pos/shifts/close',
                {
                    shiftId: activeShift._id,
                    actualCash: Number(actualCashInput),
                    notes: shiftNotes
                },
                { headers: getHeaders() }
            );

            setShowCloseShiftModal(false);
            setActualCashInput('');
            setShiftNotes('');
            setActiveShift(null);
            fetchData();
        } catch (err: any) {
            setErrorMessage(err.response?.data?.error || 'فشل في إغلاق الشيفت');
        } finally {
            setClosingShiftLoading(false);
        }
    };

    const addToCart = (product: Product) => {
        if (product.stockQuantity <= 0 || !activeShift) return;

        setCart(prev => {
            const existing = prev.find(item => item.product._id === product._id);
            if (existing) {
                if (existing.quantity >= product.stockQuantity) return prev;
                return prev.map(item =>
                    item.product._id === product._id ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            return [...prev, { product, quantity: 1 }];
        });
    };

    const updateQuantity = (productId: string, delta: number) => {
        setCart(prev =>
            prev
                .map(item => {
                    if (item.product._id === productId) {
                        const newQty = item.quantity + delta;
                        if (newQty > item.product.stockQuantity) return item;
                        return newQty > 0 ? { ...item, quantity: newQty } : null;
                    }
                    return item;
                })
                .filter(Boolean) as CartItem[]
        );
    };

    const subtotal = cart.reduce((sum, item) => sum + item.product.sellingPrice * item.quantity, 0);
    const taxAmount = Number((subtotal * 0.15).toFixed(2));
    const totalAmount = Number((subtotal + taxAmount).toFixed(2));

    const handleCheckout = async (paymentMethod: 'cash' | 'card') => {
        if (cart.length === 0 || !activeShift) return;
        setCheckoutLoading(true);
        setErrorMessage('');

        try {
            const res = await axios.post(
                'http://localhost:5000/api/v1/pos/orders',
                {
                    items: cart.map(item => ({
                        productId: item.product._id,
                        quantity: item.quantity
                    })),
                    paymentMethod,
                    paidAmount: totalAmount
                },
                { headers: getHeaders() }
            );

            setLastInvoice(res.data.data);
            setCart([]);
            fetchData();
        } catch (err: any) {
            setErrorMessage(err.response?.data?.error || 'فشلت عملية البيع');
        } finally {
            setCheckoutLoading(false);
        }
    };

    const filteredProducts = products.filter(p => {
        const matchCat = selectedCategory === 'الكل' || p.category === selectedCategory;
        const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.barcode?.includes(searchQuery);
        return matchCat && matchSearch;
    });

    // حساب الفرق المالي اللحظي أثناء إغلاق الشيفت
    const actualCashNum = Number(actualCashInput) || 0;
    const expectedCashNum = activeShift ? activeShift.expectedCash : 0;
    const shiftDiff = actualCashNum - expectedCashNum;

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none" dir="rtl">
            {/* Header */}
            <header className="h-16 border-b border-slate-800 bg-slate-900/60 px-6 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                        <Store size={20} />
                    </div>
                    <div>
                        <h1 className="text-base font-bold text-white leading-tight">كاشير نقاط البيع السحابي</h1>
                        <p className="text-xs text-slate-400 font-mono">{tenantSubdomain}.sarh.cloud</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {activeShift ? (
                        <div className="flex items-center gap-3 text-xs">
                            <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 flex items-center gap-2">
                                <Clock size={14} className="text-emerald-400" />
                                <span className="text-slate-400">الشيفت:</span>
                                <span className="font-mono text-emerald-400 font-bold">{activeShift.shiftNumber}</span>
                                <span className="text-slate-500">({activeShift.cashierName})</span>
                            </div>
                            <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
                                <span className="text-slate-400">المبيعات: </span>
                                <span className="font-mono text-white font-bold">{(activeShift.cashSales + activeShift.cardSales).toFixed(2)} SAR</span>
                            </div>

                            {/* زر تقفيل الشيفت */}
                            <button
                                onClick={() => {
                                    setActualCashInput(activeShift.expectedCash.toString());
                                    setShowCloseShiftModal(true);
                                }}
                                className="bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition"
                            >
                                <PowerOff size={14} /> إغلاق الشيفت
                            </button>
                        </div>
                    ) : (
                        <Button
                            onClick={() => setShowShiftModal(true)}
                            className="bg-amber-600 hover:bg-amber-500 text-xs py-2 px-3 font-semibold flex items-center gap-1.5"
                        >
                            <KeyRound size={14} /> فتح شيفت جديد
                        </Button>
                    )}

                    {/* زر المخزن */}
                    <Link
                        href="/pos/inventory"
                        title="إدارة المخزن"
                        className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-blue-400 hover:border-blue-500/40 transition flex items-center gap-1.5 text-xs font-semibold"
                    >
                        <Package size={16} /> المخزن
                    </Link>
                    <Link
                        href="/pos/reports"
                        title="تقارير المبيعات"
                        className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/40 transition flex items-center gap-1.5 text-xs font-semibold"
                    >
                        <BarChart3 size={16} /> التقارير
                    </Link>
                    {/* زر الخروج */}
                    <button
                        onClick={handleLogout}
                        title="تسجيل الخروج"
                        className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-500/40 transition"
                    >
                        <LogOut size={16} />
                    </button>
                </div>
            </header>

            {/* Main Workspace */}
            <div className="flex-1 flex overflow-hidden">
                {/* المنتجات */}
                <div className="flex-1 flex flex-col p-6 overflow-hidden">
                    <div className="flex gap-3 mb-4 shrink-0">
                        <div className="relative flex-1">
                            <Search className="absolute right-3.5 top-3 text-slate-500" size={18} />
                            <input
                                type="text"
                                placeholder="ابحث بالاسم أو امسح الباركود..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-800 rounded-xl pr-10 pl-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                            />
                        </div>
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition ${selectedCategory === cat
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {errorMessage && (
                        <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                            <AlertCircle size={16} /> {errorMessage}
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pr-1">
                        {filteredProducts.map(product => {
                            const inStock = product.stockQuantity > 0;
                            const canClick = inStock && activeShift;
                            return (
                                <div
                                    key={product._id}
                                    onClick={() => canClick && addToCart(product)}
                                    className={`p-4 rounded-2xl border text-right transition flex flex-col justify-between ${canClick
                                        ? 'bg-slate-900/60 border-slate-800 hover:border-blue-500 hover:bg-slate-900 cursor-pointer active:scale-95'
                                        : 'bg-slate-950 border-slate-900 opacity-40 cursor-not-allowed'
                                        }`}
                                >
                                    <div>
                                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                                            {product.barcode}
                                        </span>
                                        <h3 className="text-sm font-bold text-white mt-2">{product.name}</h3>
                                    </div>
                                    <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between">
                                        <span className="text-xs text-slate-400">
                                            المتوفر: <span className="font-mono text-slate-200">{product.stockQuantity}</span>
                                        </span>
                                        <span className="text-sm font-black text-sky-400 font-mono">
                                            {product.sellingPrice} SAR
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* سلة الفاتورة الجانبية */}
                <div className="w-96 border-r border-slate-800 bg-slate-900/40 flex flex-col shrink-0">
                    <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <ShoppingCart size={18} className="text-blue-400" />
                            <h2 className="text-sm font-bold text-white">سلة الفاتورة الحالية</h2>
                        </div>
                        <span className="text-xs text-slate-500 font-mono">({cart.length} أصناف)</span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {cart.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs">
                                <ShoppingCart size={32} className="mb-2 opacity-30" />
                                لم يتم إضافة منتجات بعد
                            </div>
                        ) : (
                            cart.map(item => (
                                <div key={item.product._id} className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl flex items-center justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-xs font-bold text-white truncate">{item.product.name}</h4>
                                        <span className="text-[11px] text-sky-400 font-mono font-bold">
                                            {(item.product.sellingPrice * item.quantity).toFixed(2)} SAR
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1">
                                        <button
                                            onClick={() => updateQuantity(item.product._id, -1)}
                                            className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800"
                                        >
                                            <Minus size={12} />
                                        </button>
                                        <span className="w-6 text-center font-mono text-xs font-bold text-white">
                                            {item.quantity}
                                        </span>
                                        <button
                                            onClick={() => updateQuantity(item.product._id, 1)}
                                            className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800"
                                        >
                                            <Plus size={12} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="p-4 bg-slate-950 border-t border-slate-800 space-y-3">
                        <div className="space-y-1.5 text-xs text-slate-400">
                            <div className="flex justify-between">
                                <span>المجموع الفرعي:</span>
                                <span className="font-mono text-slate-200">{subtotal.toFixed(2)} SAR</span>
                            </div>
                            <div className="flex justify-between">
                                <span>ضريبة القيمة المضافة (15%):</span>
                                <span className="font-mono text-slate-200">{taxAmount.toFixed(2)} SAR</span>
                            </div>
                            <div className="flex justify-between text-sm font-bold text-white border-t border-slate-800/60 pt-2">
                                <span>الإجمالي النهائي:</span>
                                <span className="font-mono text-sky-400 text-base">{totalAmount.toFixed(2)} SAR</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-2">
                            <Button
                                onClick={() => handleCheckout('cash')}
                                disabled={cart.length === 0 || !activeShift || checkoutLoading}
                                className="bg-emerald-600 hover:bg-emerald-500 py-3 text-xs font-bold flex items-center justify-center gap-1.5"
                            >
                                <Banknote size={16} /> دفع كاش
                            </Button>
                            <Button
                                onClick={() => handleCheckout('card')}
                                disabled={cart.length === 0 || !activeShift || checkoutLoading}
                                className="bg-blue-600 hover:bg-blue-500 py-3 text-xs font-bold flex items-center justify-center gap-1.5"
                            >
                                <CreditCard size={16} /> دفع شبكة / مدى
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* نافذة فتح الشيفت */}
            {showShiftModal && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-2xl p-6 shadow-2xl">
                        <h3 className="text-base font-bold text-white mb-1">بدء يومية وشيفت جديد</h3>
                        <p className="text-xs text-slate-400 mb-4">أدخل بيانات الكاشير ورصيد بداية الدرج</p>

                        <form onSubmit={handleOpenShift} className="space-y-4">
                            <div>
                                <label className="text-xs text-slate-400 block mb-1">اسم الكاشير:</label>
                                <input
                                    type="text"
                                    required
                                    value={cashierNameInput}
                                    onChange={e => setCashierNameInput(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-slate-400 block mb-1">عهدة بداية الدرج (SAR):</label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    value={openingCashInput}
                                    onChange={e => setOpeningCashInput(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            <div className="flex gap-2 pt-2">
                                <Button type="submit" className="flex-1 py-2.5 text-xs font-bold">
                                    تأكيد وفتح الشيفت
                                </Button>
                                <button
                                    type="button"
                                    onClick={() => setShowShiftModal(false)}
                                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl transition"
                                >
                                    إلغاء
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* نافذة إغلاق الشيفت ومطابقة النقدية (Shift Close Modal) */}
            {showCloseShiftModal && activeShift && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl">
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                            <div className="flex items-center gap-2">
                                <Calculator size={18} className="text-rose-400" />
                                <h3 className="text-base font-bold text-white">إغلاق الشيفت وجرد النقدية</h3>
                            </div>
                            <span className="text-xs text-slate-400 font-mono">{activeShift.shiftNumber}</span>
                        </div>

                        {/* ملخص أرقام الشيفت */}
                        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 space-y-2 text-xs font-mono mb-4">
                            <div className="flex justify-between text-slate-400">
                                <span>عهدة بداية الدرج:</span>
                                <span className="text-white">{activeShift.openingCash.toFixed(2)} SAR</span>
                            </div>
                            <div className="flex justify-between text-slate-400">
                                <span>مبيعات الكاش (+):</span>
                                <span className="text-emerald-400">{activeShift.cashSales.toFixed(2)} SAR</span>
                            </div>
                            <div className="flex justify-between text-slate-400">
                                <span>مبيعات الشبكة / مدى:</span>
                                <span className="text-blue-400">{activeShift.cardSales.toFixed(2)} SAR</span>
                            </div>
                            <div className="flex justify-between text-slate-300 font-bold pt-2 border-t border-slate-800 text-sm">
                                <span>الكاش المتوقع في الدرج:</span>
                                <span className="text-sky-400">{activeShift.expectedCash.toFixed(2)} SAR</span>
                            </div>
                        </div>

                        <form onSubmit={handleCloseShift} className="space-y-3">
                            <div>
                                <label className="text-xs text-slate-400 block mb-1">المبلغ الفعلي المستلم في الدرج (SAR):</label>
                                <input
                                    type="number"
                                    required
                                    step="0.01"
                                    value={actualCashInput}
                                    onChange={e => setActualCashInput(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-rose-500"
                                />
                            </div>

                            {/* مؤشر الفائض / العجز اللحظي */}
                            {actualCashInput !== '' && (
                                <div className={`p-3 rounded-xl text-xs font-bold flex items-center justify-between border ${shiftDiff === 0
                                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                    : shiftDiff > 0
                                        ? 'bg-sky-500/10 border-sky-500/20 text-sky-400'
                                        : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                                    }`}>
                                    <span>حالة النقدية:</span>
                                    <span className="font-mono">
                                        {shiftDiff === 0 && 'مطابق تماماً (0.00)'}
                                        {shiftDiff > 0 && `زيادة في الدرج: +${shiftDiff.toFixed(2)} SAR`}
                                        {shiftDiff < 0 && `عجز في الدرج: ${shiftDiff.toFixed(2)} SAR`}
                                    </span>
                                </div>
                            )}

                            <div>
                                <label className="text-xs text-slate-400 block mb-1">ملاحظات التقفيل والتسليم:</label>
                                <textarea
                                    rows={2}
                                    value={shiftNotes}
                                    onChange={e => setShiftNotes(e.target.value)}
                                    placeholder="أي ملاحظات حول عهدة الدرج أو المصروفات..."
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500 resize-none"
                                />
                            </div>

                            <div className="flex gap-2 pt-2">
                                <Button
                                    type="submit"
                                    disabled={closingShiftLoading}
                                    className="flex-1 py-3 text-xs font-bold bg-rose-600 hover:bg-rose-500"
                                >
                                    {closingShiftLoading ? 'جارٍ الإغلاق...' : 'تأكيد وإغلاق الشيفت'}
                                </Button>
                                <button
                                    type="button"
                                    onClick={() => setShowCloseShiftModal(false)}
                                    className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition"
                                >
                                    إلغاء
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* نافذة الفاتورة والطباعة الحرارية */}
            {lastInvoice && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:p-0 print:bg-white">
                    <div className="bg-white text-slate-900 w-full max-w-sm rounded-3xl p-6 shadow-2xl relative flex flex-col max-h-[90vh] print:shadow-none print:max-h-none print:w-full">
                        <button
                            onClick={() => setLastInvoice(null)}
                            className="absolute left-4 top-4 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition print:hidden"
                        >
                            <X size={16} />
                        </button>

                        <div className="text-center pb-4 border-b border-dashed border-slate-300">
                            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2 print:hidden">
                                <CheckCircle2 size={22} />
                            </div>
                            <h3 className="font-bold text-base">فاتورة ضريبية مبسطة</h3>
                            <p className="text-[11px] text-slate-500 font-mono mt-0.5">{tenantSubdomain}.sarh.cloud</p>
                        </div>

                        <div className="py-3 text-xs space-y-1.5 border-b border-dashed border-slate-300 font-mono">
                            <div className="flex justify-between">
                                <span className="text-slate-500">رقم الفاتورة:</span>
                                <span className="font-bold">{lastInvoice.invoiceNumber}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">التاريخ:</span>
                                <span>{new Date(lastInvoice.createdAt).toLocaleString('en-US')}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">الكاشير:</span>
                                <span>{lastInvoice.cashierName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">طريقة الدفع:</span>
                                <span className="uppercase">{lastInvoice.financials?.paymentMethod}</span>
                            </div>
                        </div>

                        <div className="py-3 flex-1 overflow-y-auto space-y-2 border-b border-dashed border-slate-300 text-xs">
                            <div className="grid grid-cols-12 font-bold text-slate-500 pb-1 border-b border-slate-100">
                                <span className="col-span-6">الصنف</span>
                                <span className="col-span-2 text-center">الكمية</span>
                                <span className="col-span-4 text-left">المبلغ</span>
                            </div>
                            {lastInvoice.items?.map((item: any, idx: number) => (
                                <div key={idx} className="grid grid-cols-12 items-center py-1">
                                    <span className="col-span-6 truncate font-medium">{item.name}</span>
                                    <span className="col-span-2 text-center font-mono">{item.quantity}</span>
                                    <span className="col-span-4 text-left font-mono">{item.totalPrice.toFixed(2)}</span>
                                </div>
                            ))}
                        </div>

                        <div className="py-3 space-y-1.5 text-xs border-b border-dashed border-slate-300 font-mono">
                            <div className="flex justify-between text-slate-600">
                                <span>المجموع الفرعي:</span>
                                <span>{lastInvoice.financials?.subtotal.toFixed(2)} SAR</span>
                            </div>
                            <div className="flex justify-between text-slate-600">
                                <span>ضريبة القيمة المضافة (15%):</span>
                                <span>{lastInvoice.financials?.taxAmount.toFixed(2)} SAR</span>
                            </div>
                            <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                                <span>الإجمالي النهائي:</span>
                                <span>{lastInvoice.financials?.totalAmount.toFixed(2)} SAR</span>
                            </div>
                        </div>

                        <div className="py-4 text-center">
                            <div className="w-24 h-24 mx-auto bg-slate-900 text-white flex items-center justify-center rounded-xl font-mono text-[9px] p-2 leading-tight">
                                [ QR Code ]<br />ZATCA Compliant
                            </div>
                            <p className="text-[10px] text-slate-400 mt-2">شكراً لزيارتكم - تم الإصدار إلكترونياً</p>
                        </div>

                        <div className="flex gap-2 print:hidden pt-2">
                            <Button
                                onClick={() => window.print()}
                                className="flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white"
                            >
                                <Printer size={16} /> طباعة الفاتورة
                            </Button>
                            <button
                                onClick={() => setLastInvoice(null)}
                                className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                            >
                                إغلاق
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}