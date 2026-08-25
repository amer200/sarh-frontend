'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import api from '@/lib/api';
import { QRCodeSVG } from 'qrcode.react';
import {
    Store, ShoppingCart, Plus, Minus, CreditCard,
    Banknote, Search, AlertCircle, Clock, KeyRound,
    LogOut, Printer, X, Package, PowerOff,
    Calculator, Settings, ReceiptText, RotateCcw, BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import SubscriptionModal from '@/components/SubscriptionModal';
import { ShieldAlert } from 'lucide-react';

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
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('الكل');
    const [searchQuery, setSearchQuery] = useState('');
    const [cart, setCart] = useState<CartItem[]>([]);
    const [activeShift, setActiveShift] = useState<any>(null);
    const [checkoutLoading, setCheckoutLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    // نوافذ
    const [showShiftModal, setShowShiftModal] = useState(false);
    const [openingCashInput, setOpeningCashInput] = useState('100');
    const [cashierNameInput, setCashierNameInput] = useState('كاشير رئيسي');
    const [showCloseShiftModal, setShowCloseShiftModal] = useState(false);
    const [actualCashInput, setActualCashInput] = useState('');
    const [shiftNotes, setShiftNotes] = useState('');
    const [closingShiftLoading, setClosingShiftLoading] = useState(false);

    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [expenseAmount, setExpenseAmount] = useState('');
    const [expenseReason, setExpenseReason] = useState('');
    const [expenseLoading, setExpenseLoading] = useState(false);

    const [lastInvoice, setLastInvoice] = useState<any>(null);
    const [zReportData, setZReportData] = useState<any>(null);
    const [creditNoteData, setCreditNoteData] = useState<any>(null);

    const [showReturnModal, setShowReturnModal] = useState(false);
    const [searchInvoiceNo, setSearchInvoiceNo] = useState('');
    const [invoiceToReturn, setInvoiceToReturn] = useState<any>(null);
    const [returnQuantities, setReturnQuantities] = useState<{ [productId: string]: number }>({});
    const [returnReason, setReturnReason] = useState('طلب العميل');
    const [returnLoading, setReturnLoading] = useState(false);

    // مراجع للباركود والاختصارات
    const barcodeBufferRef = useRef('');
    const lastKeyTimeRef = useRef(Date.now());
    const stateRef = useRef({ cart, activeShift, products, checkoutLoading });
    // حالات الاشتراك
    const [subStatus, setSubStatus] = useState<'trial' | 'expired' | 'pending_approval' | 'active'>('trial');
    const [daysLeft, setDaysLeft] = useState<number>(7);
    const [showSubModal, setShowSubModal] = useState<boolean>(false);
    useEffect(() => {
        stateRef.current = { cart, activeShift, products, checkoutLoading };
    }, [cart, activeShift, products, checkoutLoading]);

    const fetchData = async () => {
        try {
            setErrorMessage('');
            const [shiftRes, prodRes, subRes] = await Promise.all([
                api.get('/pos/shifts/current'),
                api.get('/pos/products'),
                api.get('/subscriptions/status').catch(() => ({ data: { data: null } }))
            ]);

            setActiveShift(shiftRes.data.data);
            const prods: Product[] = prodRes.data.data;
            setProducts(prods);

            const cats = Array.from(new Set(prods.map(p => p.category || 'عام')));
            setCategories(['الكل', ...cats]);

            // معالجة حالة الاشتراك
            if (subRes.data?.data) {
                const sub = subRes.data.data.subscription;
                const isBlocked = subRes.data.data.isBlocked;
                const currentStatus = isBlocked ? 'expired' : (sub?.status || 'trial');

                setSubStatus(currentStatus);

                // حساب الأيام المتبقية في التجربة
                if (sub?.trialEndsAt) {
                    const diffMs = new Date(sub.trialEndsAt).getTime() - Date.now();
                    const days = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
                    setDaysLeft(days);
                }

                // إذا انتهت الفترة التجريبية أو معلق للمراجعة، افتح النافذة فوراً وأغلق الشاشة
                if (currentStatus === 'expired' || currentStatus === 'pending_approval') {
                    setShowSubModal(true);
                }
            }
        } catch (err: any) {
            if (err.response?.status === 401) {
                localStorage.removeItem('sarh_token');
                router.push('/login');
            } else {
                setErrorMessage(err.response?.data?.error || 'فشل في جلب البيانات');
            }
        }
    };

    useEffect(() => {
        const savedToken = localStorage.getItem('sarh_token');
        const savedSubdomain = localStorage.getItem('sarh_tenant_subdomain') || 'alsarh-express';

        if (!savedToken) {
            router.push('/login');
            return;
        }

        setTenantSubdomain(savedSubdomain);
        fetchData();
    }, []);

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

    const handleCheckout = useCallback(async (paymentMethod: 'cash' | 'card') => {
        const { cart: currentCart, activeShift: currentShift, checkoutLoading: isLoading } = stateRef.current;

        if (isLoading || currentCart.length === 0 || !currentShift) return;

        setCheckoutLoading(true);
        setErrorMessage('');

        const sub = currentCart.reduce((s, it) => s + it.product.sellingPrice * it.quantity, 0);
        const tax = Number((sub * 0.15).toFixed(2));
        const total = Number((sub + tax).toFixed(2));

        try {
            const res = await api.post('/pos/orders', {
                items: currentCart.map(item => ({ productId: item.product._id, quantity: item.quantity })),
                paymentMethod,
                paidAmount: total
            });

            setLastInvoice(res.data.data);
            setCart([]);
            fetchData();
        } catch (err: any) {
            setErrorMessage(err.response?.data?.error || 'فشلت عملية البيع');
        } finally {
            setCheckoutLoading(false);
        }
    }, []);

    // مستمع قارئ الباركود + الاختصارات السريعة
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'F1') {
                e.preventDefault();
                handleCheckout('cash');
            } else if (e.key === 'F2') {
                e.preventDefault();
                handleCheckout('card');
            } else if (e.key === 'F3') {
                e.preventDefault();
                if (stateRef.current.activeShift) setShowExpenseModal(true);
            } else if (e.key === 'F4') {
                e.preventDefault();
                if (stateRef.current.activeShift) setShowReturnModal(true);
            } else if (e.key === 'Escape') {
                setShowShiftModal(false);
                setShowCloseShiftModal(false);
                setShowExpenseModal(false);
                setShowReturnModal(false);
                setLastInvoice(null);
                setZReportData(null);
                setCreditNoteData(null);
            }

            // التقاط الباركود
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

            const currentTime = Date.now();
            if (currentTime - lastKeyTimeRef.current > 100) {
                barcodeBufferRef.current = '';
            }
            lastKeyTimeRef.current = currentTime;

            if (e.key === 'Enter') {
                if (barcodeBufferRef.current.length >= 3) {
                    const scannedCode = barcodeBufferRef.current.trim();
                    const foundProduct = stateRef.current.products.find(p => p.barcode === scannedCode);
                    if (foundProduct && stateRef.current.activeShift) {
                        addToCart(foundProduct);
                    }
                    barcodeBufferRef.current = '';
                }
            } else if (e.key.length === 1) {
                barcodeBufferRef.current += e.key;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleCheckout]);

    const handleLogout = () => {
        localStorage.removeItem('sarh_token');
        localStorage.removeItem('sarh_user');
        router.push('/login');
    };

    const handleOpenShift = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/pos/shifts/open', {
                cashierName: cashierNameInput,
                openingCash: Number(openingCashInput)
            });
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
            const res = await api.post('/pos/shifts/close', {
                shiftId: activeShift._id,
                actualCash: Number(actualCashInput),
                notes: shiftNotes
            });

            setShowCloseShiftModal(false);
            setActualCashInput('');
            setShiftNotes('');
            setActiveShift(null);
            setZReportData(res.data.data);
            fetchData();
        } catch (err: any) {
            setErrorMessage(err.response?.data?.error || 'فشل في إغلاق الشيفت');
        } finally {
            setClosingShiftLoading(false);
        }
    };

    const handleAddExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeShift) return;
        setExpenseLoading(true);

        try {
            const res = await api.post('/pos/shifts/expense', {
                amount: Number(expenseAmount),
                reason: expenseReason
            });

            setActiveShift(res.data.data);
            setShowExpenseModal(false);
            setExpenseAmount('');
            setExpenseReason('');
        } catch (err: any) {
            setErrorMessage(err.response?.data?.error || 'فشل في تسجيل المصروف');
        } finally {
            setExpenseLoading(false);
        }
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

    const handleSearchInvoiceForReturn = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchInvoiceNo) return;
        try {
            const res = await api.get(`/pos/orders/invoice/${searchInvoiceNo.trim()}`);
            setInvoiceToReturn(res.data.data);
            const initialQty: { [id: string]: number } = {};
            res.data.data.items.forEach((it: any) => { initialQty[it.productId] = 0; });
            setReturnQuantities(initialQty);
        } catch (err: any) {
            alert(err.response?.data?.error || 'لم يتم العثور على الفاتورة أو تم إرجاعها مسبقاً');
            setInvoiceToReturn(null);
        }
    };

    const handleProcessReturn = async (e: React.FormEvent) => {
        e.preventDefault();
        const returnItems = Object.entries(returnQuantities)
            .filter(([_, qty]) => qty > 0)
            .map(([productId, quantity]) => ({ productId, quantity }));

        if (returnItems.length === 0) {
            alert('يرجى تحديد كمية صنف واحد على الأقل للإرجاع');
            return;
        }

        setReturnLoading(true);
        try {
            const res = await api.post('/pos/orders/return', {
                originalInvoiceNumber: invoiceToReturn.invoiceNumber,
                returnItems,
                reason: returnReason
            });

            setShowReturnModal(false);
            setInvoiceToReturn(null);
            setSearchInvoiceNo('');
            setCreditNoteData(res.data.data);
            fetchData();
        } catch (err: any) {
            alert(err.response?.data?.error || 'فشل في إتمام المرتجع');
        } finally {
            setReturnLoading(false);
        }
    };

    const filteredProducts = products.filter(p => {
        const matchCat = selectedCategory === 'الكل' || p.category === selectedCategory;
        const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.barcode?.includes(searchQuery);
        return matchCat && matchSearch;
    });

    const actualCashNum = Number(actualCashInput) || 0;
    const expectedCashNum = activeShift ? activeShift.expectedCash : 0;
    const shiftDiff = actualCashNum - expectedCashNum;

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none" dir="rtl">
            {/* Header */}
            <header className="h-16 border-b border-slate-800 bg-slate-900/60 px-6 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-md flex items-center justify-center border border-slate-800">
                        <Image src="/logo.png" alt="صَرْح" fill className="object-cover scale-150" priority />
                    </div>
                    <div>
                        <h1 className="text-base font-bold text-white leading-tight">كاشير صَرْح السحابي</h1>
                        <p className="text-xs text-slate-400 font-mono">{tenantSubdomain}.sarh.cloud</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {activeShift ? (
                        <div className="flex items-center gap-2.5 text-xs">
                            <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 flex items-center gap-2">
                                <Clock size={14} className="text-emerald-400" />
                                <span className="text-slate-400">الشيفت:</span>
                                <span className="font-mono text-emerald-400 font-bold">{activeShift.shiftNumber}</span>
                                <span className="text-slate-500">({activeShift.cashierName})</span>
                            </div>

                            <button
                                onClick={() => setShowReturnModal(true)}
                                className="bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition"
                            >
                                <RotateCcw size={14} /> مرتجع <kbd className="text-[10px] font-mono opacity-60">F4</kbd>
                            </button>

                            <button
                                onClick={() => setShowExpenseModal(true)}
                                className="bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition"
                            >
                                <ReceiptText size={14} /> مصروف <kbd className="text-[10px] font-mono opacity-60">F3</kbd>
                            </button>

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

                    <Link
                        href="/pos/inventory"
                        className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-blue-400 transition flex items-center gap-1.5 text-xs font-semibold"
                    >
                        <Package size={16} /> المخزن
                    </Link>
                    <Link
                        href="/pos/reports"
                        className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-emerald-400 transition flex items-center gap-1.5 text-xs font-semibold"
                    >
                        <BarChart3 size={16} /> التقارير
                    </Link>
                    <Link
                        href="/pos/settings"
                        className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition flex items-center gap-1.5 text-xs font-semibold"
                    >
                        <Settings size={16} /> الإعدادات
                    </Link>
                    {/* شارة وحالة الاشتراك */}
                    {subStatus === 'trial' && (
                        <button
                            onClick={() => setShowSubModal(true)}
                            className="bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition"
                        >
                            <ShieldAlert size={14} /> متبقي {daysLeft} أيام تجريبية (ترقية)
                        </button>
                    )}

                    {subStatus === 'pending_approval' && (
                        <button
                            onClick={() => setShowSubModal(true)}
                            className="bg-blue-500/10 border border-blue-500/30 text-blue-400 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5"
                        >
                            قيد مراجعة الدفع ⏳
                        </button>
                    )}
                    <button
                        onClick={handleLogout}
                        className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-rose-400 transition"
                    >
                        <LogOut size={16} />
                    </button>
                </div>
            </header>

            {/* Workspace */}
            <div className="flex-1 flex overflow-hidden">
                <div className="flex-1 flex flex-col p-6 overflow-hidden">
                    <div className="flex gap-3 mb-4 shrink-0 items-center">
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

                {/* Cart */}
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
                                <Banknote size={16} /> {checkoutLoading ? 'جارٍ...' : 'كاش'} <kbd className="bg-emerald-800/80 px-1.5 py-0.5 rounded text-[10px] font-mono">F1</kbd>
                            </Button>
                            <Button
                                onClick={() => handleCheckout('card')}
                                disabled={cart.length === 0 || !activeShift || checkoutLoading}
                                className="bg-blue-600 hover:bg-blue-500 py-3 text-xs font-bold flex items-center justify-center gap-1.5"
                            >
                                <CreditCard size={16} /> {checkoutLoading ? 'جارٍ...' : 'شبكة'} <kbd className="bg-blue-800/80 px-1.5 py-0.5 rounded text-[10px] font-mono">F2</kbd>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Return Modal */}
            {showReturnModal && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl">
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                            <div className="flex items-center gap-2">
                                <RotateCcw size={18} className="text-indigo-400" />
                                <h3 className="text-base font-bold text-white">إرجاع فاتورة وإصدار إشعار دائن</h3>
                            </div>
                            <button onClick={() => setShowReturnModal(false)} className="text-slate-400 hover:text-white">
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSearchInvoiceForReturn} className="flex gap-2 mb-4">
                            <input
                                type="text"
                                required
                                placeholder="أدخل رقم الفاتورة (مثال: POS-123456)..."
                                value={searchInvoiceNo}
                                onChange={e => setSearchInvoiceNo(e.target.value)}
                                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                            />
                            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-xs py-2 px-4 font-bold">
                                بحث
                            </Button>
                        </form>

                        {invoiceToReturn && (
                            <form onSubmit={handleProcessReturn} className="space-y-4">
                                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-1">
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">تاريخ الفاتورة:</span>
                                        <span>{new Date(invoiceToReturn.createdAt).toLocaleString('en-US')}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">طريقة الدفع الأصلية:</span>
                                        <span className="uppercase font-mono text-indigo-400">{invoiceToReturn.financials?.paymentMethod}</span>
                                    </div>
                                </div>

                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                    <p className="text-xs text-slate-400 font-semibold">الأصناف المتبقية المتاحة للإرجاع:</p>
                                    {invoiceToReturn.items?.map((it: any) => (
                                        <div key={it.productId} className="flex items-center justify-between p-2.5 bg-slate-950 border border-slate-800/80 rounded-xl text-xs">
                                            <div>
                                                <p className="font-bold text-white">{it.name}</p>
                                                <p className="text-[10px] text-slate-400 font-mono">
                                                    المتاح للإرجاع: <b className="text-indigo-400">{it.remainingQuantity}</b> من أصل {it.quantity}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <span className="text-[11px] text-slate-400">المرجع:</span>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max={it.remainingQuantity}
                                                    disabled={it.remainingQuantity <= 0}
                                                    value={returnQuantities[it.productId] || 0}
                                                    onChange={e => setReturnQuantities({
                                                        ...returnQuantities,
                                                        [it.productId]: Math.min(it.remainingQuantity, Math.max(0, Number(e.target.value)))
                                                    })}
                                                    className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-center font-mono text-white text-xs focus:outline-none focus:border-indigo-500 disabled:opacity-30"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div>
                                    <label className="text-xs text-slate-400 block mb-1">سبب الإرجاع:</label>
                                    <input
                                        type="text"
                                        value={returnReason}
                                        onChange={e => setReturnReason(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                                    />
                                </div>

                                <div className="flex gap-2 pt-2">
                                    <Button
                                        type="submit"
                                        disabled={returnLoading}
                                        className="flex-1 py-3 text-xs font-bold bg-indigo-600 hover:bg-indigo-500"
                                    >
                                        {returnLoading ? 'جارٍ معالجة الإرجاع...' : 'تأكيد الإرجاع وإصدار الإشعار الدائن'}
                                    </Button>
                                    <button
                                        type="button"
                                        onClick={() => setShowReturnModal(false)}
                                        className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl"
                                    >
                                        إلغاء
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* Credit Note Receipt Modal */}
            {creditNoteData && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:p-0 print:bg-white font-sans text-slate-900">
                    <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl relative flex flex-col max-h-[90vh] print:shadow-none print:max-h-none print:w-full">
                        <button
                            onClick={() => setCreditNoteData(null)}
                            className="absolute left-4 top-4 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition print:hidden"
                        >
                            <X size={16} />
                        </button>

                        <div className="text-center pb-3 border-b-2 border-slate-900 font-mono">
                            <h2 className="font-bold text-base text-slate-900 font-sans">{creditNoteData.tenantInfo?.name}</h2>
                            <p className="text-[10px] text-slate-500 mt-0.5">الرقم الضريبي: {creditNoteData.tenantInfo?.vatNumber}</p>
                            <div className="mt-2 inline-block bg-rose-600 text-white text-[11px] font-bold px-3 py-1 rounded">
                                إشعار دائن ضريبي (CREDIT NOTE)
                            </div>
                        </div>

                        <div className="py-2.5 text-xs space-y-1 border-b border-dashed border-slate-300 font-mono">
                            <div className="flex justify-between">
                                <span className="text-slate-500 font-sans">رقم الإشعار الدائن:</span>
                                <span className="font-bold text-rose-600">{creditNoteData.creditNoteNumber}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500 font-sans">مرجع الفاتورة الأصلية:</span>
                                <span className="font-bold">{creditNoteData.originalInvoiceNumber}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500 font-sans">التاريخ:</span>
                                <span>{new Date(creditNoteData.createdAt).toLocaleString('en-US')}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500 font-sans">سبب الإرجاع:</span>
                                <span className="font-sans">{creditNoteData.reason}</span>
                            </div>
                        </div>

                        <div className="py-2.5 flex-1 overflow-y-auto space-y-1 border-b border-dashed border-slate-300 text-xs">
                            <div className="grid grid-cols-12 font-bold text-slate-500 pb-1">
                                <span className="col-span-6">الصنف المرجع</span>
                                <span className="col-span-2 text-center">الكمية</span>
                                <span className="col-span-4 text-left">المبلغ المسترد</span>
                            </div>
                            {creditNoteData.items?.map((it: any, idx: number) => (
                                <div key={idx} className="grid grid-cols-12 items-center py-0.5">
                                    <span className="col-span-6 truncate font-medium">{it.name}</span>
                                    <span className="col-span-2 text-center font-mono">-{it.quantity}</span>
                                    <span className="col-span-4 text-left font-mono">-{it.totalPrice.toFixed(2)}</span>
                                </div>
                            ))}
                        </div>

                        <div className="py-2.5 space-y-1 text-xs border-b border-dashed border-slate-300 font-mono">
                            <div className="flex justify-between text-slate-600">
                                <span className="font-sans">المجموع الفرعي المسترد:</span>
                                <span>-{creditNoteData.financials?.subtotal.toFixed(2)} SAR</span>
                            </div>
                            <div className="flex justify-between text-slate-600">
                                <span className="font-sans">ضريبة القيمة المضافة المستردة (15%):</span>
                                <span>-{creditNoteData.financials?.taxAmount.toFixed(2)} SAR</span>
                            </div>
                            <div className="flex justify-between font-bold text-sm text-rose-600 pt-1.5 border-t border-slate-200">
                                <span className="font-sans">إجمالي المبلغ المسترد:</span>
                                <span>-{creditNoteData.financials?.totalRefundAmount.toFixed(2)} SAR</span>
                            </div>
                        </div>

                        <div className="py-3 text-center flex flex-col items-center justify-center">
                            <div className="p-2 bg-white border border-slate-200 rounded-xl shadow-sm inline-block">
                                <QRCodeSVG value={creditNoteData.zatcaQr} size={100} level="M" />
                            </div>
                            <p className="text-[10px] text-slate-500 mt-2">إشعار دائن ضريبي معتمد (ZATCA Compliant)</p>
                        </div>

                        <div className="flex gap-2 print:hidden pt-1">
                            <Button
                                onClick={() => window.print()}
                                className="flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white"
                            >
                                <Printer size={16} /> طباعة الإشعار الدائن
                            </Button>
                            <button
                                onClick={() => setCreditNoteData(null)}
                                className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                            >
                                إغلاق
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Shift Open Modal */}
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

            {/* Expense Modal */}
            {showExpenseModal && activeShift && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl">
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                            <div className="flex items-center gap-2">
                                <ReceiptText size={18} className="text-amber-400" />
                                <h3 className="text-base font-bold text-white">تسجيل سحب / مصروف نثري</h3>
                            </div>
                            <span className="text-xs text-slate-400 font-mono">{activeShift.shiftNumber}</span>
                        </div>

                        <form onSubmit={handleAddExpense} className="space-y-4">
                            <div>
                                <label className="text-xs text-slate-400 block mb-1">المبلغ المسحوب من الدرج (SAR):</label>
                                <input
                                    type="number"
                                    required
                                    step="0.01"
                                    min="0.01"
                                    placeholder="0.00"
                                    value={expenseAmount}
                                    onChange={e => setExpenseAmount(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-amber-500"
                                />
                            </div>

                            <div>
                                <label className="text-xs text-slate-400 block mb-1">سبب / بيان المصروف:</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="مثال: شراء أدوات نظافة / بوفيه"
                                    value={expenseReason}
                                    onChange={e => setExpenseReason(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                                />
                            </div>

                            <div className="flex gap-2 pt-2">
                                <Button
                                    type="submit"
                                    disabled={expenseLoading}
                                    className="flex-1 py-2.5 text-xs font-bold bg-amber-600 hover:bg-amber-500 text-slate-950"
                                >
                                    {expenseLoading ? 'جارٍ الحفظ...' : 'تأكيد وخصم من الدرج'}
                                </Button>
                                <button
                                    type="button"
                                    onClick={() => setShowExpenseModal(false)}
                                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition"
                                >
                                    إلغاء
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Shift Close Modal */}
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
                            {activeShift.expenses?.length > 0 && (
                                <div className="flex justify-between text-amber-400">
                                    <span>المصروفات النثرية (-):</span>
                                    <span>-{activeShift.expenses.reduce((s: number, x: any) => s + x.amount, 0).toFixed(2)} SAR</span>
                                </div>
                            )}
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

            {/* Invoice Receipt Modal */}
            {lastInvoice && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:p-0 print:bg-white">
                    <div className="bg-white text-slate-900 w-full max-w-sm rounded-3xl p-6 shadow-2xl relative flex flex-col max-h-[90vh] print:shadow-none print:max-h-none print:w-full font-sans">
                        <button
                            onClick={() => setLastInvoice(null)}
                            className="absolute left-4 top-4 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition print:hidden"
                        >
                            <X size={16} />
                        </button>

                        <div className="text-center pb-3 border-b border-dashed border-slate-300">
                            <h3 className="font-bold text-base text-slate-900 leading-snug">
                                {lastInvoice.tenantInfo?.name || 'مؤسسة صَرْح التجارية'}
                            </h3>
                            {lastInvoice.tenantInfo?.address && (
                                <p className="text-[11px] text-slate-500 mt-0.5">{lastInvoice.tenantInfo.address}</p>
                            )}
                            {lastInvoice.tenantInfo?.vatNumber && (
                                <p className="text-[11px] text-slate-600 font-mono mt-1 font-semibold">
                                    الرقم الضريبي: {lastInvoice.tenantInfo.vatNumber}
                                </p>
                            )}
                            <div className="mt-1 inline-block px-2 py-0.5 rounded bg-slate-100 text-[10px] font-bold text-slate-600">
                                فاتورة ضريبية مبسطة
                            </div>
                        </div>

                        <div className="py-2.5 text-xs space-y-1 border-b border-dashed border-slate-300 font-mono">
                            <div className="flex justify-between">
                                <span className="text-slate-500 font-sans">رقم الفاتورة:</span>
                                <span className="font-bold">{lastInvoice.invoiceNumber}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500 font-sans">التاريخ:</span>
                                <span>{new Date(lastInvoice.createdAt).toLocaleString('en-US')}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500 font-sans">الكاشير:</span>
                                <span className="font-sans">{lastInvoice.cashierName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500 font-sans">طريقة الدفع:</span>
                                <span className="uppercase">{lastInvoice.financials?.paymentMethod}</span>
                            </div>
                        </div>

                        <div className="py-2.5 flex-1 overflow-y-auto space-y-1.5 border-b border-dashed border-slate-300 text-xs">
                            <div className="grid grid-cols-12 font-bold text-slate-500 pb-1 border-b border-slate-100">
                                <span className="col-span-6">الصنف</span>
                                <span className="col-span-2 text-center">الكمية</span>
                                <span className="col-span-4 text-left">المبلغ</span>
                            </div>
                            {lastInvoice.items?.map((item: any, idx: number) => (
                                <div key={idx} className="grid grid-cols-12 items-center py-0.5">
                                    <span className="col-span-6 truncate font-medium">{item.name}</span>
                                    <span className="col-span-2 text-center font-mono">{item.quantity}</span>
                                    <span className="col-span-4 text-left font-mono">{item.totalPrice.toFixed(2)}</span>
                                </div>
                            ))}
                        </div>

                        <div className="py-2.5 space-y-1 text-xs border-b border-dashed border-slate-300 font-mono">
                            <div className="flex justify-between text-slate-600 font-sans">
                                <span>المجموع الفرعي:</span>
                                <span>{lastInvoice.financials?.subtotal.toFixed(2)} SAR</span>
                            </div>
                            <div className="flex justify-between text-slate-600 font-sans">
                                <span>ضريبة القيمة المضافة (15%):</span>
                                <span>{lastInvoice.financials?.taxAmount.toFixed(2)} SAR</span>
                            </div>
                            <div className="flex justify-between text-sm font-bold text-slate-900 pt-1.5 border-t border-slate-200 font-sans">
                                <span>الإجمالي النهائي:</span>
                                <span className="font-mono text-base">{lastInvoice.financials?.totalAmount.toFixed(2)} SAR</span>
                            </div>
                        </div>

                        <div className="py-3 text-center flex flex-col items-center justify-center">
                            {lastInvoice.zatcaQr ? (
                                <div className="p-2 bg-white border border-slate-200 rounded-xl shadow-sm inline-block">
                                    <QRCodeSVG value={lastInvoice.zatcaQr} size={105} level="M" includeMargin={false} />
                                </div>
                            ) : null}
                            <p className="text-[10px] text-slate-500 mt-2 font-sans font-medium px-2 leading-relaxed">
                                {lastInvoice.tenantInfo?.receiptFooter || 'شكراً لزيارتكم - تم الإصدار إلكترونياً'}
                            </p>
                        </div>

                        <div className="flex gap-2 print:hidden pt-1">
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

            {/* Z-Report Modal */}
            {zReportData && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:p-0 print:bg-white font-sans text-slate-900">
                    <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl relative flex flex-col max-h-[90vh] print:shadow-none print:max-h-none print:w-full">
                        <button
                            onClick={() => setZReportData(null)}
                            className="absolute left-4 top-4 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition print:hidden"
                        >
                            <X size={16} />
                        </button>

                        <div className="text-center pb-3 border-b-2 border-slate-900 font-mono">
                            <h2 className="font-bold text-base text-slate-900 font-sans">{zReportData.tenantInfo?.name}</h2>
                            <p className="text-[10px] text-slate-500 mt-0.5">الرقم الضريبي: {zReportData.tenantInfo?.vatNumber}</p>
                            <div className="mt-2 inline-block bg-slate-900 text-white text-[11px] font-bold px-3 py-1 rounded">
                                تقرير إغلاق الوردية (Z - REPORT)
                            </div>
                        </div>

                        <div className="py-2.5 text-xs space-y-1 border-b border-dashed border-slate-300 font-mono">
                            <div className="flex justify-between">
                                <span className="text-slate-500 font-sans">رقم الشيفت:</span>
                                <span className="font-bold">{zReportData.shiftDetails?.shiftNumber}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500 font-sans">الكاشير:</span>
                                <span className="font-sans font-medium">{zReportData.shiftDetails?.cashierName}</span>
                            </div>
                            <div className="flex justify-between text-[11px]">
                                <span className="text-slate-500 font-sans">وقت الفتح:</span>
                                <span>{new Date(zReportData.shiftDetails?.openedAt).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })}</span>
                            </div>
                            <div className="flex justify-between text-[11px]">
                                <span className="text-slate-500 font-sans">وقت الإغلاق:</span>
                                <span>{new Date(zReportData.shiftDetails?.closedAt).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })}</span>
                            </div>
                        </div>

                        <div className="py-2.5 space-y-1.5 border-b border-dashed border-slate-300 text-xs font-mono">
                            <div className="font-bold text-slate-800 font-sans text-[11px] mb-1">ملخص المبيعات:</div>
                            <div className="flex justify-between">
                                <span className="text-slate-600 font-sans">مبيعات نقدية (كاش):</span>
                                <span>{zReportData.financialSummary?.cashSales.toFixed(2)} SAR</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-600 font-sans">مبيعات شبكة / مدى:</span>
                                <span>{zReportData.financialSummary?.cardSales.toFixed(2)} SAR</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-600 font-sans">ضريبة القيمة المضافة (15%):</span>
                                <span>{zReportData.financialSummary?.totalTax.toFixed(2)} SAR</span>
                            </div>
                            <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-100">
                                <span className="font-sans">إجمالي مبيعات الوردية:</span>
                                <span>{zReportData.financialSummary?.totalSales.toFixed(2)} SAR</span>
                            </div>
                        </div>

                        <div className="py-2.5 space-y-1.5 border-b-2 border-slate-900 text-xs font-mono">
                            <div className="font-bold text-slate-800 font-sans text-[11px] mb-1">جرد ومطابقة صندوق الدرج:</div>
                            <div className="flex justify-between text-slate-600">
                                <span className="font-sans">عهدة البداية:</span>
                                <span>+{zReportData.financialSummary?.openingCash.toFixed(2)} SAR</span>
                            </div>
                            <div className="flex justify-between text-slate-600">
                                <span className="font-sans">مبيعات الكاش المضافة:</span>
                                <span>+{zReportData.financialSummary?.cashSales.toFixed(2)} SAR</span>
                            </div>
                            {zReportData.financialSummary?.totalExpenses > 0 && (
                                <div className="flex justify-between text-rose-600">
                                    <span className="font-sans">المصروفات النثرية:</span>
                                    <span>-{zReportData.financialSummary?.totalExpenses.toFixed(2)} SAR</span>
                                </div>
                            )}
                            <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200">
                                <span className="font-sans">الكاش المتوقع:</span>
                                <span>{zReportData.financialSummary?.expectedCash.toFixed(2)} SAR</span>
                            </div>
                            <div className="flex justify-between font-bold text-slate-900">
                                <span className="font-sans">الكاش الفعلي المستلم:</span>
                                <span>{zReportData.financialSummary?.actualCash.toFixed(2)} SAR</span>
                            </div>
                            <div className={`flex justify-between font-bold text-xs pt-1 border-t border-slate-200 ${zReportData.financialSummary?.difference === 0 ? 'text-emerald-600' : 'text-rose-600'
                                }`}>
                                <span className="font-sans">الفارق:</span>
                                <span>{zReportData.financialSummary?.difference.toFixed(2)} SAR</span>
                            </div>
                        </div>

                        <div className="flex gap-2 print:hidden pt-3 border-t border-slate-100">
                            <Button
                                onClick={() => window.print()}
                                className="flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white"
                            >
                                <Printer size={16} /> طباعة تقرير Z-Report
                            </Button>
                            <button
                                onClick={() => setZReportData(null)}
                                className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                            >
                                إغلاق
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* نافذة الاشتراك والترقية */}
            <SubscriptionModal
                isOpen={showSubModal || subStatus === 'expired'}
                status={subStatus === 'active' ? 'trial' : subStatus}
                daysLeft={daysLeft}
                onClose={() => {
                    if (subStatus !== 'expired') setShowSubModal(false);
                }}
            />
        </div>
    );
}