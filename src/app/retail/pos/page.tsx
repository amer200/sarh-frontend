'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import {
    Barcode, Search, ShoppingBag, Trash2, Plus, Minus,
    CreditCard, Banknote, Smartphone, CheckCircle2,
    AlertCircle, ArrowRight, Store, Printer, Tag, X, User,
    ShieldAlert
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import AppSwitcher from '@/components/AppSwitcher';
import SubscriptionModal from '@/components/SubscriptionModal';

export default function RetailPosPage() {
    const [products, setProducts] = useState<any[]>([]);
    const [branches, setBranches] = useState<any[]>([]);
    const [selectedBranch, setSelectedBranch] = useState<string>('');
    const [cart, setCart] = useState<any[]>([]);

    // فحص حالة الاشتراك والقفل
    const [isBlocked, setIsBlocked] = useState(false);
    const [subStatus, setSubStatus] = useState<string>('trial');
    const [daysLeft, setDaysLeft] = useState<number>(7);
    const [showSubModal, setShowSubModal] = useState(false);

    // Search & Barcode Scan
    const [searchQuery, setSearchQuery] = useState('');
    const [barcodeInput, setBarcodeInput] = useState('');
    const barcodeInputRef = useRef<HTMLInputElement>(null);

    // نافذة اختيار المقاس واللون
    const [activeProductModal, setActiveProductModal] = useState<any>(null);

    // عمليات الدفع
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'instapay'>('cash');
    const [discountAmount, setDiscountAmount] = useState<number>(0);
    const [customerPhone, setCustomerPhone] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [completedSale, setCompletedSale] = useState<any>(null);

    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [prodRes, branchRes, subRes] = await Promise.all([
                api.get('/retail/products').catch(() => ({ data: { data: [] } })),
                api.get('/retail/branches').catch(() => ({ data: { data: [] } })),
                api.get('/subscriptions/status').catch(() => ({ data: { data: null } }))
            ]);

            setProducts(prodRes.data?.data || []);
            const branchList = branchRes.data?.data || [];
            setBranches(branchList);
            if (branchList.length > 0 && !selectedBranch) {
                setSelectedBranch(branchList[0]._id);
            }

            // فحص اشتراك نظام الملابس والتجزئة (retail)
            if (subRes.data && subRes.data.data) {
                const retailSub = subRes.data.data.retail || subRes.data.data.subscription || subRes.data.data;
                if (retailSub) {
                    setIsBlocked(Boolean(retailSub.isBlocked));
                    const currentStatus = retailSub.status || 'trial';
                    setSubStatus(currentStatus);

                    if (retailSub.trialEndsAt) {
                        const diffMs = new Date(retailSub.trialEndsAt).getTime() - Date.now();
                        const days = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
                        setDaysLeft(days);
                    }
                }
            }
        } catch (err: any) {
            console.error('فشل في جلب بيانات كاشير التجزئة');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // إضافة صنف عبر مسح الباركود المباشر
    const handleBarcodeSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!barcodeInput.trim()) return;

        const scannedCode = barcodeInput.trim();
        let found = false;

        for (const prod of products) {
            const variant = prod.variants?.find((v: any) => v.barcode === scannedCode || v.sku === scannedCode);
            if (variant) {
                addToCart(prod, variant);
                found = true;
                setBarcodeInput('');
                break;
            }
        }

        if (!found) {
            alert(`الباركود غير مسجل: ${scannedCode}`);
            setBarcodeInput('');
        }
    };

    // إضافة متغير محدد للسلة
    const addToCart = (product: any, variant: any) => {
        const branchStock = variant.stockByBranch?.find((s: any) => String(s.branchId) === String(selectedBranch))?.quantity || 0;

        const existingIndex = cart.findIndex(item => item.variantId === variant._id);
        if (existingIndex > -1) {
            if (cart[existingIndex].quantity >= branchStock) {
                alert(`المخزون غير كافٍ. المتوفر في الفرع: ${branchStock} قطعة فقط.`);
                return;
            }
            const updated = [...cart];
            updated[existingIndex].quantity += 1;
            updated[existingIndex].totalPrice = updated[existingIndex].quantity * variant.price;
            setCart(updated);
        } else {
            if (branchStock < 1) {
                alert('هذا المقاس/اللون غير متوفر في الفرع المختار!');
                return;
            }
            setCart(prev => [
                ...prev,
                {
                    productId: product._id,
                    variantId: variant._id,
                    name: product.name,
                    brand: product.brand,
                    size: variant.attributes?.size,
                    color: variant.attributes?.color,
                    sku: variant.sku,
                    barcode: variant.barcode,
                    unitPrice: variant.price,
                    quantity: 1,
                    totalPrice: variant.price,
                    maxStock: branchStock
                }
            ]);
        }
        setActiveProductModal(null);
    };

    // تعديل الكمية بالسلة
    const updateQuantity = (variantId: string, delta: number) => {
        setCart(prev => {
            return prev.map(item => {
                if (item.variantId === variantId) {
                    const newQty = item.quantity + delta;
                    if (newQty <= 0) return null;
                    if (newQty > item.maxStock) {
                        alert(`الكمية المتاحة في الفرع ${item.maxStock} قطعة فقط.`);
                        return item;
                    }
                    return { ...item, quantity: newQty, totalPrice: newQty * item.unitPrice };
                }
                return item;
            }).filter(Boolean) as any[];
        });
    };

    const subtotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);
    const grandTotal = Math.max(0, subtotal - Number(discountAmount || 0));

    // تأكيد ودفع فاتورة التجزئة
    const handleCheckout = async () => {
        if (cart.length === 0 || isBlocked) return;
        setIsProcessing(true);

        try {
            const payload = {
                branchId: selectedBranch,
                items: cart,
                paymentMethod,
                discountAmount: Number(discountAmount || 0),
                customerPhone
            };

            const res = await api.post('/retail/sales/checkout', payload);
            setCompletedSale(res.data.data);
            setCart([]);
            setDiscountAmount(0);
            setCustomerPhone('');
            fetchData();
        } catch (err: any) {
            alert((err.response && err.response.data && err.response.data.error) || 'فشل إتمام عملية البيع');
        } finally {
            setIsProcessing(false);
        }
    };

    const filteredProducts = products.filter(p =>
        p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.brand?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="h-screen bg-slate-950 text-slate-100 flex flex-col font-sans overflow-hidden select-none" dir="rtl">

            {/* Top Bar */}
            <header className="h-14 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <AppSwitcher />

                    <div className="w-9 h-9 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                        <ShoppingBag size={18} />
                    </div>
                    <div>
                        <h1 className="text-sm font-black text-white">كاشير صَرْح للملابس والتجزئة (Retail POS)</h1>
                        <p className="text-[10px] text-slate-400">نظام البيع السريع بالباركود ومصفوفة المقاسات</p>
                    </div>
                </div>

                {/* Branch Selector & Subscription Badge */}
                <div className="flex items-center gap-2">
                    {subStatus === 'trial' && (
                        <button
                            onClick={() => setShowSubModal(true)}
                            className="bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                        >
                            <ShieldAlert size={14} /> متبقي {daysLeft} أيام تجريبية
                        </button>
                    )}

                    {subStatus === 'pending_approval' && (
                        <button
                            onClick={() => setShowSubModal(true)}
                            className="bg-blue-500/10 border border-blue-500/30 text-blue-400 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5"
                        >
                            قيد مراجعة الدفع ⏳
                        </button>
                    )}

                    <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs">
                        <Store size={14} className="text-amber-400" />
                        <span className="text-slate-400">الفرع:</span>
                        <select
                            value={selectedBranch}
                            onChange={e => setSelectedBranch(e.target.value)}
                            className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
                        >
                            {branches.map(b => (
                                <option key={b._id} value={b._id} className="bg-slate-900">{b.name} ({b.code})</option>
                            ))}
                        </select>
                    </div>

                    <Link
                        href="/retail"
                        className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white text-xs font-bold flex items-center gap-1 transition"
                    >
                        <ArrowRight size={14} /> لوحة إدارة التجزئة
                    </Link>
                </div>
            </header>

            {/* Main Split Screen */}
            <div className="flex-1 grid grid-cols-12 overflow-hidden">

                {/* Left: Product Grid & Barcode Scanner (7 cols) */}
                <div className="col-span-7 p-4 flex flex-col gap-3 border-l border-slate-800 overflow-hidden">

                    <div className="grid grid-cols-12 gap-2">
                        <form onSubmit={handleBarcodeSubmit} className="col-span-7 relative">
                            <Barcode className="absolute right-3 top-2.5 text-blue-400" size={18} />
                            <input
                                ref={barcodeInputRef}
                                type="text"
                                placeholder="امسح باركود القطعة هنا واضغط Enter..."
                                value={barcodeInput}
                                onChange={e => setBarcodeInput(e.target.value)}
                                className="w-full bg-slate-900 border border-blue-500/40 focus:border-blue-500 rounded-xl pr-10 pl-3 py-2 text-xs text-white font-mono placeholder:text-slate-500 focus:outline-none shadow-sm"
                            />
                        </form>

                        <div className="col-span-5 relative">
                            <Search className="absolute right-3 top-2.5 text-slate-500" size={16} />
                            <input
                                type="text"
                                placeholder="بحث بالموديل أو الماركة..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-800 rounded-xl pr-9 pl-3 py-2 text-xs text-white focus:outline-none focus:border-slate-700"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-2 md:grid-cols-3 gap-3">
                        {loading ? (
                            <div className="col-span-3 text-center py-20 text-xs text-slate-500">جارٍ جلب الموديلات...</div>
                        ) : filteredProducts.map(p => (
                            <div
                                key={p._id}
                                onClick={() => setActiveProductModal(p)}
                                className="bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-blue-500/50 rounded-2xl p-3.5 flex flex-col justify-between cursor-pointer transition shadow-lg active:scale-98"
                            >
                                <div>
                                    <div className="flex justify-between items-start gap-1">
                                        <h3 className="font-bold text-white text-xs line-clamp-1">{p.name}</h3>
                                        {p.brand && (
                                            <span className="text-[9px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded font-bold">{p.brand}</span>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-1">{p.variants?.length || 0} مقاسات وألوان متاحة</p>
                                </div>

                                <div className="mt-3 flex justify-between items-center pt-2 border-t border-slate-800/80">
                                    <span className="font-mono font-black text-emerald-400 text-sm">{p.basePrice} ج.م</span>
                                    <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-lg font-bold">اختيار المقاس</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: Cart & Checkout (5 cols) */}
                <div className="col-span-5 bg-slate-900/60 p-4 flex flex-col justify-between overflow-hidden">

                    <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                            <ShoppingBag size={15} className="text-blue-400" /> سلة المشتريات ({cart.reduce((s, i) => s + i.quantity, 0)} قطعة)
                        </span>
                        {cart.length > 0 && (
                            <button onClick={() => setCart([])} className="text-rose-400 hover:text-rose-300 text-[11px] font-bold">
                                تفريغ السلة
                            </button>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto py-2 space-y-2 pr-1">
                        {cart.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs">
                                <Barcode size={32} className="mb-2 text-slate-600 stroke-[1.5]" />
                                <p>السلة فارغة</p>
                                <p className="text-[10px] mt-1 text-slate-600">امسح باركود القطعة أو اختر الموديل لإضافته</p>
                            </div>
                        ) : (
                            cart.map(item => (
                                <div key={item.variantId} className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex justify-between items-center text-xs">
                                    <div>
                                        <h4 className="font-bold text-white text-xs">{item.name}</h4>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-amber-400 font-mono font-bold">مقاس: {item.size}</span>
                                            <span className="text-slate-400">لون: {item.color}</span>
                                        </div>
                                        <span className="font-mono text-emerald-400 font-bold text-[11px]">{item.unitPrice} ج.م</span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg">
                                            <button onClick={() => updateQuantity(item.variantId, -1)} className="p-1 hover:text-rose-400 text-slate-400"><Minus size={12} /></button>
                                            <span className="w-6 text-center font-mono font-bold text-white">{item.quantity}</span>
                                            <button onClick={() => updateQuantity(item.variantId, 1)} className="p-1 hover:text-emerald-400 text-slate-400"><Plus size={12} /></button>
                                        </div>
                                        <span className="w-16 text-left font-mono font-black text-white">{item.totalPrice} ج.م</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="pt-3 border-t border-slate-800 space-y-3 shrink-0">
                        <div className="grid grid-cols-3 gap-1.5">
                            {[
                                { id: 'cash', label: 'كاش نقدي', icon: Banknote },
                                { id: 'card', label: 'فيزا / بطاقة', icon: CreditCard },
                                { id: 'instapay', label: 'InstaPay', icon: Smartphone }
                            ].map(m => (
                                <button
                                    key={m.id}
                                    onClick={() => setPaymentMethod(m.id as any)}
                                    className={`py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 border ${paymentMethod === m.id
                                            ? 'bg-blue-600 border-blue-500 text-white shadow-lg'
                                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                                        }`}
                                >
                                    <m.icon size={13} /> {m.label}
                                </button>
                            ))}
                        </div>

                        <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1 text-xs font-mono">
                            <div className="flex justify-between text-slate-400 font-sans">
                                <span>المجموع الفرعي:</span>
                                <span className="font-mono">{subtotal.toFixed(2)} ج.م</span>
                            </div>
                            <div className="flex justify-between items-center text-slate-400 font-sans">
                                <span>خصم (ج.م):</span>
                                <input
                                    type="number"
                                    min="0"
                                    value={discountAmount || ''}
                                    onChange={e => setDiscountAmount(Number(e.target.value))}
                                    placeholder="0"
                                    className="w-20 bg-slate-900 border border-slate-800 rounded-lg px-2 py-0.5 text-left text-white font-mono focus:outline-none"
                                />
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-slate-800 text-sm font-bold text-white font-sans">
                                <span>الإجمالي المطلوب:</span>
                                <span className="text-emerald-400 font-black font-mono text-lg">{grandTotal.toFixed(2)} ج.م</span>
                            </div>
                        </div>

                        <Button
                            disabled={cart.length === 0 || isProcessing || isBlocked}
                            onClick={handleCheckout}
                            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm rounded-xl shadow-xl transition active:scale-98"
                        >
                            {isProcessing ? 'جارٍ إتمام العملية...' : `تأكيد ودفع ${grandTotal.toFixed(2)} ج.م (Print)`}
                        </Button>
                    </div>
                </div>

            </div>

            {/* Modal: Size & Color Picker */}
            {activeProductModal && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 max-w-lg w-full text-xs space-y-4 shadow-2xl">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                            <div>
                                <h3 className="font-black text-white text-sm">{activeProductModal.name}</h3>
                                <span className="text-emerald-400 font-mono font-bold">{activeProductModal.basePrice} ج.م</span>
                            </div>
                            <button onClick={() => setActiveProductModal(null)}><X size={16} className="text-slate-400" /></button>
                        </div>

                        <p className="text-slate-400 text-[11px]">اختر المقاس واللون المتاح في الفرع لإضافته للسلة مباشرة:</p>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
                            {activeProductModal.variants?.map((v: any) => {
                                const stock = v.stockByBranch?.find((s: any) => String(s.branchId) === String(selectedBranch))?.quantity || 0;
                                return (
                                    <button
                                        key={v._id}
                                        disabled={stock < 1}
                                        onClick={() => addToCart(activeProductModal, v)}
                                        className={`p-3 rounded-xl border text-right transition flex flex-col justify-between ${stock > 0
                                                ? 'bg-slate-950 border-slate-800 hover:border-blue-500 text-white cursor-pointer'
                                                : 'bg-slate-950/40 border-slate-900 text-slate-600 cursor-not-allowed opacity-50'
                                            }`}
                                    >
                                        <div className="flex justify-between items-center">
                                            <span className="font-black font-mono text-amber-400 text-sm">{v.attributes?.size}</span>
                                            <span className="text-[10px] text-slate-300 font-bold">{v.attributes?.color}</span>
                                        </div>
                                        <div className="mt-2 text-[10px] text-slate-400 flex justify-between">
                                            <span>المخزون:</span>
                                            <span className="font-mono font-bold text-white">{stock} قطعة</span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Receipt */}
            {completedSale && (
                <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
                    <div className="bg-white text-slate-900 rounded-3xl p-6 max-w-sm w-full text-xs space-y-3 shadow-2xl font-sans">
                        <div className="text-center pb-3 border-b border-dashed border-slate-300">
                            <h3 className="font-black text-base">صَرْح — فاتورة مبيعات ملابس</h3>
                            <p className="text-[10px] text-slate-500 font-mono mt-0.5">رقم الإيصال: {completedSale.invoiceNumber}</p>
                            <p className="text-[10px] text-slate-500">{new Date(completedSale.createdAt).toLocaleString('ar-EG')}</p>
                        </div>

                        <div className="space-y-1.5 py-2 border-b border-dashed border-slate-300 text-[11px]">
                            {completedSale.items?.map((item: any, idx: number) => (
                                <div key={idx} className="flex justify-between items-center">
                                    <div>
                                        <span className="font-bold">{item.name}</span>
                                        <span className="text-slate-500 block text-[10px] font-mono">({item.size} / {item.color}) × {item.quantity}</span>
                                    </div>
                                    <span className="font-mono font-bold">{item.totalPrice}.00 ج.م</span>
                                </div>
                            ))}
                        </div>

                        <div className="pt-1 space-y-1 font-bold">
                            <div className="flex justify-between text-sm">
                                <span>الإجمالي المدفوع ({completedSale.paymentMethod}):</span>
                                <span className="font-mono text-base text-blue-600">{completedSale.grandTotal}.00 ج.م</span>
                            </div>
                        </div>

                        <div className="pt-3 flex gap-2">
                            <Button
                                onClick={() => { window.print(); setCompletedSale(null); }}
                                className="flex-1 py-2.5 bg-blue-600 text-white font-bold text-xs flex items-center justify-center gap-1"
                            >
                                <Printer size={14} /> طباعة الفاتورة
                            </Button>
                            <Button
                                onClick={() => setCompletedSale(null)}
                                className="px-4 py-2.5 bg-slate-200 text-slate-800 font-bold text-xs"
                            >
                                إغلاق
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* نافذة حظر كاشير الملابس والمطالبة بالاشتراك */}
            {(isBlocked || showSubModal) && (
                <SubscriptionModal
                    appModule="retail"
                    appName="صَرْح Retail للملابس والتجزئة"
                    price={250}
                    onSuccess={() => {
                        setShowSubModal(false);
                        fetchData();
                    }}
                />
            )}

        </div>
    );
}