'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import {
    Flame, Utensils, Bike, ShoppingBag, Clock,
    CheckCircle2, ArrowRight, RefreshCw,
    Volume2, VolumeX, Check, ChefHat
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface OrderItem {
    name: string;
    quantity: number;
    notes?: string;
    modifiers?: Array<{ name: string; price: number }>;
}

interface KitchenOrder {
    _id: string;
    invoiceNumber: string;
    orderType: 'dine_in' | 'takeaway' | 'delivery';
    orderStatus: 'open' | 'kitchen_preparing' | 'ready' | 'completed';
    tableNumber?: string;
    deliveryInfo?: {
        customerName?: string;
        customerPhone?: string;
        deliveryAddress?: string;
    };
    items: OrderItem[];
    createdAt: string;
    cashierName?: string;
}

export default function KitchenDisplayPage() {
    const [orders, setOrders] = useState<KitchenOrder[]>([]);
    const [filterType, setFilterType] = useState<'all' | 'dine_in' | 'takeaway' | 'delivery'>('all');
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(Date.now());
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const prevOrderCountRef = useRef(0);
    const audioCtxRef = useRef<AudioContext | null>(null);

    const initAudio = () => {
        if (!audioCtxRef.current) {
            audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if (audioCtxRef.current.state === 'suspended') {
            audioCtxRef.current.resume();
        }
    };

    const playDing = () => {
        if (!soundEnabled) return;
        try {
            initAudio();
            if (!audioCtxRef.current) return;
            const osc = audioCtxRef.current.createOscillator();
            const gain = audioCtxRef.current.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, audioCtxRef.current.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1760, audioCtxRef.current.currentTime + 0.3);
            gain.gain.setValueAtTime(0.3, audioCtxRef.current.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtxRef.current.currentTime + 0.5);
            osc.connect(gain);
            gain.connect(audioCtxRef.current.destination);
            osc.start();
            osc.stop(audioCtxRef.current.currentTime + 0.5);
        } catch (e) {
            console.error('Audio play error:', e);
        }
    };

    const fetchKitchenOrders = async (isManual = false) => {
        if (isManual) setLoading(true);
        try {
            const res = await api.get('/pos/kitchen/orders');
            const data: KitchenOrder[] = res.data?.data || [];

            if (data.length > prevOrderCountRef.current && prevOrderCountRef.current !== 0) {
                playDing();
            }
            prevOrderCountRef.current = data.length;
            setOrders(data);
        } catch (err) {
            console.error('Failed to fetch kitchen orders:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchKitchenOrders(true);
        const pollTimer = setInterval(() => {
            fetchKitchenOrders(false);
            setCurrentTime(Date.now());
        }, 5000);

        const clockTimer = setInterval(() => {
            setCurrentTime(Date.now());
        }, 1000);

        return () => {
            clearInterval(pollTimer);
            clearInterval(clockTimer);
        };
    }, [soundEnabled]);

    const handleUpdateStatus = async (orderId: string, newStatus: 'kitchen_preparing' | 'ready' | 'completed') => {
        setUpdatingId(orderId);
        try {
            await api.patch(`/pos/kitchen/orders/${orderId}/status`, { status: newStatus });
            await fetchKitchenOrders(false);
        } catch (err: any) {
            alert(err.response?.data?.error || 'فشل تحديث حالة الطلب');
        } finally {
            setUpdatingId(null);
        }
    };

    const filteredOrders = orders.filter(o => {
        if (filterType === 'all') return true;
        return o.orderType === filterType;
    });

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none" dir="rtl">
            <header className="h-16 border-b border-slate-800 bg-slate-900/80 px-6 flex items-center justify-between shrink-0 shadow-lg">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center font-black">
                        <ChefHat size={22} />
                    </div>
                    <div>
                        <h1 className="text-base font-black text-white leading-tight">شاشة المطبخ والبار (KDS)</h1>
                        <p className="text-[11px] text-slate-400 font-medium">متابعة وتجهيز الطلبات الحية لحظياً</p>
                    </div>
                </div>

                <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs">
                    {[
                        { id: 'all', label: `الكل (${orders.length})` },
                        { id: 'dine_in', label: `🍽️ صالة (${orders.filter(o => o.orderType === 'dine_in').length})` },
                        { id: 'takeaway', label: `🛍️ تيك أواي (${orders.filter(o => o.orderType === 'takeaway').length})` },
                        { id: 'delivery', label: `🛵 دليفري (${orders.filter(o => o.orderType === 'delivery').length})` }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setFilterType(tab.id as any)}
                            className={`px-3 py-1.5 rounded-xl font-bold transition ${filterType === tab.id
                                    ? 'bg-amber-600 text-slate-950 shadow-md font-black'
                                    : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-2.5">
                    <button
                        onClick={() => {
                            initAudio();
                            setSoundEnabled(!soundEnabled);
                        }}
                        className={`p-2 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 ${soundEnabled
                                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                                : 'bg-slate-900 border-slate-800 text-slate-500'
                            }`}
                        title={soundEnabled ? 'كتم التنبيه الصوتي' : 'تفعيل التنبيه الصوتي'}
                    >
                        {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                        <span className="hidden sm:inline">{soundEnabled ? 'الصوت مفعّل' : 'مكتوم'}</span>
                    </button>

                    <button
                        onClick={() => fetchKitchenOrders(true)}
                        className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
                        title="تحديث يدوي"
                    >
                        <RefreshCw size={16} className={loading ? 'animate-spin text-amber-400' : ''} />
                    </button>

                    <Link
                        href="/pos"
                        className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white text-xs font-bold flex items-center gap-1.5 transition"
                    >
                        <ArrowRight size={14} /> نقطة البيع
                    </Link>
                </div>
            </header>

            <main className="flex-1 p-6 overflow-y-auto">
                {filteredOrders.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-600 text-sm space-y-2 py-32">
                        <CheckCircle2 size={48} className="opacity-30 text-emerald-500" />
                        <p className="font-bold text-slate-400">لا توجد طلبات قيد التحضير حالياً</p>
                        <p className="text-xs text-slate-600">المطبخ جاهز والطلبات الجديدة ستظهر تلقائياً مع جرس تنبيه</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredOrders.map(order => {
                            const startMs = new Date(order.createdAt).getTime();
                            const elapsedMins = Math.floor((currentTime - startMs) / 60000);
                            const elapsedSecs = Math.floor(((currentTime - startMs) % 60000) / 1000);

                            const isLate = elapsedMins >= 15;
                            const isWarning = elapsedMins >= 8 && !isLate;
                            const isPreparing = order.orderStatus === 'kitchen_preparing';
                            const isReady = order.orderStatus === 'ready';

                            return (
                                <div
                                    key={order._id}
                                    className={`rounded-3xl border flex flex-col justify-between transition-all shadow-xl overflow-hidden ${isReady
                                            ? 'bg-emerald-950/40 border-emerald-500/60'
                                            : isLate
                                                ? 'bg-rose-950/50 border-rose-500 shadow-rose-950/30'
                                                : isWarning
                                                    ? 'bg-amber-950/40 border-amber-500/60'
                                                    : 'bg-slate-900 border-slate-800'
                                        }`}
                                >
                                    <div className="p-4 border-b border-slate-800/80 bg-slate-950/60">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <span className="font-mono text-xs font-black text-white block">
                                                    #{order.invoiceNumber}
                                                </span>
                                                <h3 className="font-bold text-sm text-amber-400 mt-0.5">
                                                    {order.orderType === 'dine_in'
                                                        ? `🍽️ ${order.tableNumber || 'طاولة صالة'}`
                                                        : order.orderType === 'delivery'
                                                            ? `🛵 دليفري (${order.deliveryInfo?.customerName || 'عميل'})`
                                                            : '🛍️ سفري (تيك أواي)'}
                                                </h3>
                                            </div>

                                            <div
                                                className={`px-2.5 py-1 rounded-xl text-xs font-mono font-black flex items-center gap-1 border ${isLate
                                                        ? 'bg-rose-500 text-slate-950 border-rose-400 animate-pulse'
                                                        : isWarning
                                                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                                            : 'bg-slate-800 text-slate-300 border-slate-700'
                                                    }`}
                                            >
                                                <Clock size={12} />
                                                <span>
                                                    {String(elapsedMins).padStart(2, '0')}:{String(elapsedSecs).padStart(2, '0')}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="mt-2 flex items-center justify-between text-[11px]">
                                            <span className="text-slate-500 font-mono">
                                                {new Date(order.createdAt).toLocaleTimeString('ar-EG')}
                                            </span>
                                            <span
                                                className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${isReady
                                                        ? 'bg-emerald-500/20 text-emerald-400'
                                                        : isPreparing
                                                            ? 'bg-blue-500/20 text-blue-400'
                                                            : 'bg-amber-500/20 text-amber-400'
                                                    }`}
                                            >
                                                {isReady ? '🔔 جاهز للتسليم' : isPreparing ? '👨‍🍳 قيد التجهيز' : '⏳ بانتظار الشيف'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="p-4 flex-1 space-y-2.5 text-xs">
                                        {order.items.map((item, idx) => (
                                            <div key={idx} className="pb-2 border-b border-slate-800/40 last:border-0 last:pb-0">
                                                <div className="flex justify-between items-start font-bold">
                                                    <span className="text-white text-sm">
                                                        <span className="text-amber-400 font-black font-mono ml-1">{item.quantity}x</span>
                                                        {item.name}
                                                    </span>
                                                </div>

                                                {item.modifiers && item.modifiers.length > 0 && (
                                                    <div className="mt-1 flex flex-wrap gap-1">
                                                        {item.modifiers.map((m, mIdx) => (
                                                            <span
                                                                key={mIdx}
                                                                className="px-1.5 py-0.2 bg-blue-500/10 text-blue-300 border border-blue-500/20 rounded text-[10px] font-medium"
                                                            >
                                                                + {m.name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}

                                                {item.notes && (
                                                    <div className="mt-1 p-1 rounded-md bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[11px] font-bold">
                                                        ⚠️ {item.notes}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    <div className="p-3 bg-slate-950/80 border-t border-slate-800/80 flex gap-2">
                                        {!isPreparing && !isReady && (
                                            <Button
                                                disabled={updatingId === order._id}
                                                onClick={() => handleUpdateStatus(order._id, 'kitchen_preparing')}
                                                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5"
                                            >
                                                👨‍🍳 بدء التحضير
                                            </Button>
                                        )}

                                        {isPreparing && (
                                            <Button
                                                disabled={updatingId === order._id}
                                                onClick={() => handleUpdateStatus(order._id, 'ready')}
                                                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5"
                                            >
                                                🔔 جاهز للتقديم
                                            </Button>
                                        )}

                                        {isReady && (
                                            <Button
                                                disabled={updatingId === order._id}
                                                onClick={() => handleUpdateStatus(order._id, 'completed')}
                                                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5"
                                            >
                                                <Check size={14} /> تم التسليم للزبون
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}