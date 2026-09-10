// src/app/lounge/page.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import {
    Gamepad2, Car, Clock, Coffee, Play,
    PowerOff, Printer, AlertTriangle,
    X, Check, Plus, Minus, VolumeX, ShieldAlert,
    RefreshCw, Trash2, ShieldCheck, KeyRound,
    RotateCcw, DollarSign, History, Layers, Edit3,
    HelpCircle, Lock, Unlock
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import AppSwitcher from '@/components/AppSwitcher';
import SubscriptionModal from '@/components/SubscriptionModal';

interface Room {
    _id: string;
    name: string;
    deviceType: 'PS' | 'SIM';
    supportsPS4?: boolean;
    supportsPS5?: boolean;
    rates: {
        ps4Single: number;
        ps4Multi: number;
        ps5Single: number;
        ps5Multi: number;
        simPrice: number;
    };
    session?: {
        sessionId: string;
        startTime: string;
        consoleType: 'PS4' | 'PS5' | 'SIM';
        targetMinutes: number;
        playMode: 'single' | 'multi';
        status: string;
        chargesCount: number;
    } | null;
}

interface ProductItem {
    _id?: string;
    id?: number | string;
    name: string;
    price: number;
    type: 'order' | 'penalty';
    isCountable: boolean;
    stock: number;
}

export default function LoungePosPage() {
    const router = useRouter();
    const [rooms, setRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeShift, setActiveShift] = useState<any>(null);
    const [cashierNameInput, setCashierNameInput] = useState('');
    const [currentTime, setCurrentTime] = useState(Date.now());

    // حالة الاشتراك المستقل
    const [isBlocked, setIsBlocked] = useState(false);
    const [subStatus, setSubStatus] = useState('trial');
    const [daysLeft, setDaysLeft] = useState(7);
    const [showSubModal, setShowSubModal] = useState(false);

    // تشغيل جهاز
    const [startModalRoom, setStartModalRoom] = useState<Room | null>(null);
    const [simTargetMins, setSimTargetMins] = useState(30);

    // إدارة الجلسة النشطة
    const [activeManageRoom, setActiveManageRoom] = useState<Room | null>(null);
    const [roomCharges, setRoomCharges] = useState<any[]>([]);
    const [customChargeDesc, setCustomChargeDesc] = useState('');
    const [customChargePrice, setCustomChargePrice] = useState('');

    // أصناف الكافيتريا والمنيو
    const [cafeProducts, setCafeProducts] = useState<ProductItem[]>([
        { id: 'p1', name: 'شاي فتلة', price: 10, type: 'order', isCountable: false, stock: 999 },
        { id: 'p2', name: 'قهوة تركي', price: 15, type: 'order', isCountable: false, stock: 999 },
        { id: 'p3', name: 'بيبسي كانز', price: 15, type: 'order', isCountable: true, stock: 24 },
        { id: 'p4', name: 'كانز كولا', price: 15, type: 'order', isCountable: true, stock: 20 },
        { id: 'p5', name: 'ريدبول مبرد', price: 45, type: 'order', isCountable: true, stock: 12 },
        { id: 'p6', name: 'شيبسي عائلي', price: 12, type: 'order', isCountable: true, stock: 35 },
        { id: 'p7', name: 'مياه معدنية', price: 7, type: 'order', isCountable: true, stock: 48 },
        { id: 'p8', name: 'إتلاف ذراع تحكم', price: 150, type: 'penalty', isCountable: false, stock: 999 }
    ]);

    // الكافيتريا
    const [showCafeModal, setShowCafeModal] = useState(false);
    const [cafeCart, setCafeCart] = useState<any[]>([]);
    const [customCafeDesc, setCustomCafeDesc] = useState('');
    const [customCafePrice, setCustomCafePrice] = useState('');

    // الفاتورة والتقارير
    const [currentBill, setCurrentBill] = useState<any>(null);
    const [shiftReport, setShiftReport] = useState<any>(null);

    // لوحة المدير
    const [showAdminPinModal, setShowAdminPinModal] = useState(false);
    const [adminPinInput, setAdminPinInput] = useState('');
    const [adminPin, setAdminPin] = useState('1234');
    const [showAdminModal, setShowAdminModal] = useState(false);
    const [adminActiveTab, setAdminActiveTab] = useState<'rooms' | 'products' | 'refunds' | 'shifts' | 'pin'>('rooms');
    const [newAdminPin, setNewAdminPin] = useState('');

    // استعادة الرقم السري
    const [showForgotPinModal, setShowForgotPinModal] = useState(false);
    const [newRecoveredPin, setNewRecoveredPin] = useState('');

    // إضافة وتعديل الغرف
    const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
    const [roomForm, setRoomForm] = useState({
        name: '',
        deviceType: 'PS' as 'PS' | 'SIM',
        supportsPS4: true,
        supportsPS5: true,
        ps4Single: 25,
        ps4Multi: 35,
        ps5Single: 45,
        ps5Multi: 60,
        simPrice: 60
    });

    // إضافة وتعديل الأصناف
    const [editingProdId, setEditingProdId] = useState<string | null>(null);
    const [prodForm, setProdForm] = useState({
        name: '',
        price: '',
        type: 'order' as 'order' | 'penalty',
        isCountable: false,
        stock: '20'
    });

    const [pendingRefunds, setPendingRefunds] = useState<any[]>([]);

    // محرك الصوت
    const audioCtxRef = useRef<AudioContext | null>(null);
    const alarmsIntervalRef = useRef<{ [roomId: string]: NodeJS.Timeout }>({});
    const [mutedRooms, setMutedRooms] = useState<{ [roomId: string]: boolean }>({});

    const initAudio = () => {
        if (!audioCtxRef.current) {
            audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if (audioCtxRef.current.state === 'suspended') {
            audioCtxRef.current.resume();
        }
    };

    const startBuzzer = (roomId: string) => {
        if (alarmsIntervalRef.current[roomId] || mutedRooms[roomId]) return;
        initAudio();

        alarmsIntervalRef.current[roomId] = setInterval(() => {
            if (!audioCtxRef.current) return;
            const osc = audioCtxRef.current.createOscillator();
            const gain = audioCtxRef.current.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(800, audioCtxRef.current.currentTime);
            gain.gain.setValueAtTime(0.4, audioCtxRef.current.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtxRef.current.currentTime + 0.4);
            osc.connect(gain);
            gain.connect(audioCtxRef.current.destination);
            osc.start();
            osc.stop(audioCtxRef.current.currentTime + 0.4);
        }, 1000);
    };

    const stopBuzzer = (roomId: string) => {
        if (alarmsIntervalRef.current[roomId]) {
            clearInterval(alarmsIntervalRef.current[roomId]);
            delete alarmsIntervalRef.current[roomId];
        }
        setMutedRooms(prev => ({ ...prev, [roomId]: true }));
    };

    // جلب بيانات الصالة المستقلة بالكامل عبر مسارات /lounge
    const fetchLoungeData = async () => {
        try {
            const [roomsRes, shiftRes, menuRes, subRes] = await Promise.all([
                api.get('/lounge/rooms').catch(() => ({ data: { data: [] } })),
                api.get('/lounge/shifts/current').catch(() => ({ data: { data: null } })),
                api.get('/lounge/products').catch(() => ({ data: { data: [] } })),
                api.get('/subscriptions/status').catch(() => ({ data: { data: null } }))
            ]);

            setRooms(roomsRes.data?.data || []);
            setActiveShift(shiftRes.data?.data || null);

            if (menuRes.data?.data?.length > 0) {
                const normalized = menuRes.data.data.map((p: any) => ({
                    ...p,
                    id: p._id || p.id
                }));
                setCafeProducts(normalized);
            }

            if (subRes.data?.data?.lounge) {
                const loungeSub = subRes.data.data.lounge;
                setIsBlocked(Boolean(loungeSub.isBlocked));
                setSubStatus(loungeSub.status || 'trial');
                if (loungeSub.trialEndsAt) {
                    const diff = new Date(loungeSub.trialEndsAt).getTime() - Date.now();
                    setDaysLeft(Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24))));
                }
            }
        } catch (err) {
            console.error('Lounge fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('sarh_token');
        if (!token) {
            router.push('/login');
            return;
        }

        const savedPin = localStorage.getItem('sarh_lounge_pin');
        if (savedPin) setAdminPin(savedPin);

        fetchLoungeData();

        const timer = setInterval(() => {
            setCurrentTime(Date.now());
        }, 1000);

        return () => {
            clearInterval(timer);
            Object.values(alarmsIntervalRef.current).forEach(clearInterval);
        };
    }, []);

    // فتح وردية الصالة المستقلة
    const handleStartShift = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!cashierNameInput.trim()) return;
        try {
            const res = await api.post('/lounge/shifts/open', {
                cashierName: cashierNameInput.trim(),
                openingCash: 0
            });
            if (res.data?.data) {
                setActiveShift(res.data.data);
                setCashierNameInput('');
                fetchLoungeData();
            }
        } catch (err: any) {
            const existing = err.response?.data?.data || err.response?.data?.shift;
            if (existing) {
                setActiveShift(existing);
                setCashierNameInput('');
                fetchLoungeData();
                return;
            }
            alert(err.response?.data?.error || 'فشل فتح وردية الصالة');
        }
    };

    // تقفيل وردية الصالة المستقلة
    const handleEndShift = async () => {
        if (!activeShift) return;
        if (!confirm('تأكيد تقفيل وردية الصالة الحالية؟')) return;
        try {
            const res = await api.post('/lounge/shifts/close', {
                shiftId: activeShift._id,
                actualCash: activeShift.expectedCash || 0,
                notes: 'تقفيل وردية الصالة'
            });
            setShiftReport(res.data.data);
            setActiveShift(null);
            fetchLoungeData();
        } catch (err: any) {
            alert(err.response?.data?.error || 'فشل تقفيل وردية الصالة');
        }
    };

    // فك أي شيفت صالة معلق
    const handleForceCloseStuckShift = async () => {
        if (!confirm('هل تريد إغلاق أي وردية صالة معلقة حالياً في السيرفر؟')) return;
        try {
            await api.post('/lounge/shifts/close', { actualCash: 0, notes: 'إغلاق طوارئ' });
            alert('تم إنهاء الوردية المعلقة بنجاح، يمكنك الآن فتح وردية جديدة.');
            setActiveShift(null);
            fetchLoungeData();
        } catch (err: any) {
            alert(err.response?.data?.error || 'فشل إغلاق الوردية');
        }
    };

    // تشغيل جهاز
    const executeStartRoom = async (consoleType: 'PS4' | 'PS5' | 'SIM', playMode: 'single' | 'multi', targetMinutes = 0) => {
        if (!startModalRoom) return;
        try {
            await api.post('/lounge/toggle-room', {
                roomId: startModalRoom._id,
                consoleType,
                playMode,
                targetMinutes
            });
            setStartModalRoom(null);
            fetchLoungeData();
        } catch (err: any) {
            alert(err.response?.data?.error || 'فشل تشغيل الغرفة');
        }
    };

    // محاسبة الغرفة
    const handleStopRoom = async (roomId: string) => {
        if (!confirm('تأكيد إيقاف اللعب وإصدار الفاتورة؟')) return;
        stopBuzzer(roomId);

        try {
            const res = await api.post('/lounge/toggle-room', { roomId });
            setActiveManageRoom(null);
            setCurrentBill(res.data.bill);
            fetchLoungeData();
        } catch (err: any) {
            alert(err.response?.data?.error || 'فشل محاسبة الغرفة');
        }
    };

    const handleSwitchMode = async (roomId: string, newMode: 'single' | 'multi') => {
        if (!confirm(`تأكيد التحويل إلى وضع ${newMode === 'multi' ? 'Multi 👥' : 'فردي 👤'} واحتساب الوقت السابق؟`)) return;
        try {
            await api.post('/lounge/switch-mode', { roomId, newMode });
            setActiveManageRoom(null);
            fetchLoungeData();
        } catch (err: any) {
            alert(err.response?.data?.error || 'فشل تحويل نمط اللعب');
        }
    };

    // إضافة صنف للغرفة وتثبيته في الباك إند
    const handleAddProductToRoom = async (product: ProductItem) => {
        if (!activeManageRoom) return;

        if (product.isCountable && product.stock <= 0) {
            alert(`نفذت كمية [${product.name}] من المخزن!`);
            return;
        }

        const targetProductId = product._id || product.id;

        try {
            const res = await api.post('/lounge/charges', {
                roomId: activeManageRoom._id,
                productId: targetProductId,
                description: product.name,
                price: Number(product.price),
                qty: 1,
                type: product.type
            });

            if (res.data?.data) {
                setRoomCharges(res.data.data);
            }

            if (product.isCountable) {
                setCafeProducts(prev => prev.map(p => (p._id === targetProductId || p.id === targetProductId) ? { ...p, stock: p.stock - 1 } : p));
            }
            fetchLoungeData();
        } catch (err: any) {
            console.error('Failed to sync charge to DB:', err);
            alert(err.response?.data?.error || 'فشل تسجيل الطلب بالسيرفر');
        }
    };

    const handleAddCustomCharge = async (type: 'order' | 'penalty') => {
        if (!activeManageRoom || !customChargeDesc.trim() || Number(customChargePrice) <= 0) return;
        try {
            const res = await api.post('/lounge/charges', {
                roomId: activeManageRoom._id,
                description: customChargeDesc.trim(),
                price: Number(customChargePrice),
                qty: 1,
                type
            });
            if (res.data?.data) {
                setRoomCharges(res.data.data);
            }
            setCustomChargeDesc('');
            setCustomChargePrice('');
            fetchLoungeData();
        } catch (err: any) {
            alert(err.response?.data?.error || 'فشل إضافة الطلب الحر');
        }
    };

    const handleVoidRoom = async (voidType: 'time' | 'all') => {
        if (!activeManageRoom) return;
        const confirmMsg = voidType === 'time'
            ? 'تأكيد تصفير وقت الجلسة فقط؟ (الطلبات ستظل محسوبة وسيرفع إذن للإدارة)'
            : 'تأكيد إلغاء الغرفة بالكامل ومسح الوقت والطلبات؟';

        if (!confirm(confirmMsg)) return;

        stopBuzzer(activeManageRoom._id);
        try {
            await api.post('/lounge/refunds/request', {
                roomId: activeManageRoom._id,
                voidType
            });
            alert('تمت العملية وإرسال طلب المرتجع إلى لوحة المدير للاعتماد.');
            setActiveManageRoom(null);
            fetchLoungeData();
        } catch (err: any) {
            alert(err.response?.data?.error || 'فشل رفع طلب الإلغاء');
        }
    };

    // التحقق من الرقم السري
    const handleVerifyAdminPin = () => {
        if (adminPinInput.trim() === adminPin) {
            setShowAdminPinModal(false);
            setAdminPinInput('');
            setShowAdminModal(true);
        } else {
            alert('الرقم السري غير صحيح! (الافتراضي: 1234)');
        }
    };

    const handleRecoverPin = () => {
        const pinToSet = newRecoveredPin.trim() || '1234';
        setAdminPin(pinToSet);
        localStorage.setItem('sarh_lounge_pin', pinToSet);
        setShowForgotPinModal(false);
        setNewRecoveredPin('');
        alert(`تم استعادة وتعيين الرقم السري بنجاح إلى: (${pinToSet})`);
        setShowAdminPinModal(true);
    };

    const handleChangePin = () => {
        if (!newAdminPin.trim()) return;
        setAdminPin(newAdminPin.trim());
        localStorage.setItem('sarh_lounge_pin', newAdminPin.trim());
        setNewAdminPin('');
        alert('تم حفظ وتحديث الرقم السري بنجاح!');
    };

    // حفظ صنف المنيو في قاعدة بيانات الصالة المستقلة
    const handleSaveProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prodForm.name.trim() || Number(prodForm.price) <= 0) return;

        try {
            await api.post('/lounge/products', {
                id: editingProdId,
                name: prodForm.name.trim(),
                price: Number(prodForm.price),
                type: prodForm.type,
                isCountable: prodForm.isCountable,
                stock: prodForm.isCountable ? Number(prodForm.stock) : 999
            });

            setEditingProdId(null);
            setProdForm({ name: '', price: '', type: 'order', isCountable: false, stock: '20' });
            fetchLoungeData();
            alert('تم حفظ الصنف بنجاح في قاعدة البيانات!');
        } catch (err: any) {
            alert(err.response?.data?.error || 'فشل حفظ الصنف');
        }
    };

    const handleDeleteProduct = async (prodId: string) => {
        if (!confirm('تأكيد حذف هذا الصنف من المنيو؟')) return;
        try {
            await api.delete(`/lounge/products/${prodId}`);
            fetchLoungeData();
        } catch (err: any) {
            alert(err.response?.data?.error || 'فشل حذف الصنف');
        }
    };

    // الكافيتريا والترحيل لقاعدة البيانات
    const addToCafeCart = (prod: ProductItem) => {
        if (prod.isCountable && prod.stock <= 0) {
            alert(`نفذت كمية [${prod.name}] من المخزن!`);
            return;
        }

        setCafeCart(prev => {
            const prodKey = prod._id || prod.id;
            const exists = prev.some(i => (i._id === prodKey || i.id === prodKey));
            if (exists) {
                return prev.map(i => (i._id === prodKey || i.id === prodKey) ? { ...i, qty: (i.qty || 1) + 1 } : i);
            }
            return [...prev, { ...prod, qty: 1 }];
        });
    };

    const addCustomToCafe = (type: 'order' | 'penalty') => {
        if (!customCafeDesc.trim() || Number(customCafePrice) <= 0) return;
        addToCafeCart({
            id: 'custom_' + Date.now(),
            name: customCafeDesc.trim(),
            price: Number(customCafePrice),
            type,
            isCountable: false,
            stock: 999
        });
        setCustomCafeDesc('');
        setCustomCafePrice('');
    };

    const handleConfirmCafeSale = async () => {
        if (cafeCart.length === 0) return;
        const total = cafeCart.reduce((sum, item) => sum + (item.price * item.qty), 0);

        try {
            await api.post('/lounge/direct-order', {
                items: cafeCart.map(c => ({
                    productId: c._id || c.id,
                    name: c.name,
                    price: c.price,
                    qty: c.qty
                }))
            });
        } catch (err: any) {
            console.error('Failed to sync cafe sale to DB:', err);
        }

        setCurrentBill({
            roomName: 'كافيتريا (بيع مباشر)',
            actualMinutes: 0,
            billedMinutes: 0,
            timeCost: 0,
            ordersCost: total,
            total,
            intervalsDetails: [],
            chargesDetails: cafeCart.map(i => ({ description: `${i.qty}x ${i.name}`, price: i.price * i.qty }))
        });
        setCafeCart([]);
        setShowCafeModal(false);
        fetchLoungeData();
    };

    const openManageModal = async (room: Room) => {
        setActiveManageRoom(room);
        try {
            const res = await api.get(`/lounge/rooms/${room._id}/charges`);
            setRoomCharges(res.data.data || []);
        } catch {
            setRoomCharges([]);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none" dir="rtl">

            {/* شاشة بدء الوردية الإلزامية */}
            {!activeShift && !loading && (
                <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-sm w-full text-center space-y-5 shadow-2xl">
                        <div className="w-14 h-14 rounded-2xl bg-violet-600/10 border border-violet-500/30 text-violet-400 flex items-center justify-center mx-auto shadow-inner">
                            <Gamepad2 size={32} />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-white">صَرْح Lounge • بدء الوردية</h2>
                            <p className="text-xs text-slate-400 mt-1">سجل اسم الكاشير لبدء تشغيل طاولات وأجهزة اللعب</p>
                        </div>
                        <form onSubmit={handleStartShift} className="space-y-3">
                            <input
                                type="text"
                                required
                                placeholder="اسم الكاشير المسؤول..."
                                value={cashierNameInput}
                                onChange={e => setCashierNameInput(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-center text-sm text-white focus:outline-none focus:border-violet-500"
                            />
                            <Button type="submit" className="w-full py-3 bg-violet-600 hover:bg-violet-500 text-white font-black text-xs rounded-xl shadow-lg">
                                فتح الوردية وبدء العمل
                            </Button>
                        </form>

                        <div className="pt-2 border-t border-slate-800 flex flex-col gap-2 text-xs">
                            <button
                                type="button"
                                onClick={async () => {
                                    const res = await api.get('/lounge/shifts/current').catch(() => null);
                                    if (res?.data?.data) {
                                        setActiveShift(res.data.data);
                                    } else {
                                        alert('لا توجد بيانات وردية مسجلة حالياً');
                                    }
                                }}
                                className="text-violet-400 hover:text-violet-300 font-bold py-1"
                            >
                                🔄 استئناف الوردية المفتوحة حالياً
                            </button>
                            <button
                                type="button"
                                onClick={handleForceCloseStuckShift}
                                className="text-rose-400 hover:text-rose-300 font-bold py-1 bg-rose-500/10 hover:bg-rose-500/20 rounded-xl transition"
                            >
                                ⚠️ إغلاق الوردية العالقة فوراً
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <header className="h-16 border-b border-slate-800 bg-slate-900/60 px-6 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <AppSwitcher />
                    <div className="w-9 h-9 rounded-xl bg-violet-600/10 border border-violet-500/20 text-violet-400 flex items-center justify-center font-black">
                        <Gamepad2 size={20} />
                    </div>
                    <div>
                        <h1 className="text-sm font-bold text-white leading-tight">صَرْح Lounge — إدارة الألعاب والكافيه</h1>
                        <p className="text-[11px] text-slate-400">البلايستيشن، المحاكيات، وجلسات الوقت المفتوح والمحدد</p>
                    </div>
                </div>

                <div className="flex items-center gap-2.5 text-xs">
                    <button
                        onClick={() => setShowCafeModal(true)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 transition"
                    >
                        <Coffee size={15} /> الكافيتريا والطلبات
                    </button>

                    <button
                        onClick={() => setShowAdminPinModal(true)}
                        className="bg-slate-900 hover:bg-slate-850 border border-slate-800 text-rose-400 px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 transition"
                    >
                        🛠️ لوحة المدير
                    </button>

                    {activeShift && (
                        <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-2">
                            <Clock size={14} className="text-violet-400" />
                            <span className="text-slate-400">الكاشير:</span>
                            <span className="font-bold text-white">{activeShift.cashierName}</span>
                            <span className="text-emerald-400 font-mono font-bold mr-1">({Number(activeShift.expectedCash || 0).toFixed(0)} ج بالدرج)</span>
                        </div>
                    )}

                    {subStatus === 'trial' && (
                        <button
                            onClick={() => setShowSubModal(true)}
                            className="bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5"
                        >
                            <ShieldAlert size={14} /> تجريبي (باقي {daysLeft} يوم)
                        </button>
                    )}

                    <button
                        onClick={handleEndShift}
                        className="bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition"
                    >
                        <PowerOff size={14} /> تقفيل الوردية
                    </button>
                </div>
            </header>

            {/* Main Rooms Grid */}
            <main className="flex-1 p-6 overflow-y-auto">
                <div className="max-w-7xl mx-auto space-y-4">
                    <div className="flex justify-between items-center text-xs text-slate-400">
                        <span>إجمالي الأجهزة والغرف: <b className="text-white">{rooms.length}</b></span>
                        <div className="flex gap-4">
                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> متاح</span>
                            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> مشغول</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {rooms.map((room, idx) => {
                            const isBusy = Boolean(room.session);
                            const session = room.session;

                            let diffSecs = 0;
                            let isOverdue = false;
                            let remainingText = '';

                            if (session) {
                                const startMs = new Date(session.startTime).getTime();
                                diffSecs = Math.max(0, Math.floor((currentTime - startMs) / 1000));

                                if (session.targetMinutes > 0) {
                                    const totalTargetSecs = session.targetMinutes * 60;
                                    const leftSecs = totalTargetSecs - diffSecs;
                                    if (leftSecs <= 0) {
                                        isOverdue = true;
                                        startBuzzer(room._id);
                                    } else {
                                        const h = Math.floor(leftSecs / 3600).toString().padStart(2, '0');
                                        const m = Math.floor((leftSecs % 3600) / 60).toString().padStart(2, '0');
                                        const s = (leftSecs % 60).toString().padStart(2, '0');
                                        remainingText = `متبقي: ${h}:${m}:${s}`;
                                    }
                                }
                            }

                            const elapsedH = Math.floor(diffSecs / 3600).toString().padStart(2, '0');
                            const elapsedM = Math.floor((diffSecs % 3600) / 60).toString().padStart(2, '0');
                            const elapsedS = (diffSecs % 60).toString().padStart(2, '0');

                            return (
                                <div
                                    key={room._id || `room-${idx}`}
                                    onClick={() => {
                                        initAudio();
                                        if (isBusy) {
                                            openManageModal(room);
                                        } else {
                                            setStartModalRoom(room);
                                        }
                                    }}
                                    className={`p-5 rounded-3xl border transition flex flex-col justify-between cursor-pointer active:scale-98 shadow-xl relative ${isOverdue
                                        ? 'bg-rose-950/80 border-rose-500 animate-pulse'
                                        : isBusy
                                            ? 'bg-slate-900 border-rose-500/40 hover:border-rose-500'
                                            : 'bg-slate-900 border-slate-800 hover:border-emerald-500/50'
                                        }`}
                                >
                                    <div>
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${room.deviceType === 'SIM' ? 'bg-amber-500/10 text-amber-400' : 'bg-violet-500/10 text-violet-400'}`}>
                                                    {room.deviceType === 'SIM' ? <Car size={18} /> : <Gamepad2 size={18} />}
                                                </div>
                                                <div>
                                                    <h3 className="font-black text-white text-sm">{room.name}</h3>
                                                    <span className="text-[10px] text-slate-400 block font-mono">
                                                        {room.deviceType === 'SIM' ? 'محاكي قيادة' : 'PlayStation'}
                                                    </span>
                                                </div>
                                            </div>

                                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${isBusy ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                                                {isBusy ? (session?.playMode === 'multi' ? 'Multi 👥' : 'فردي 👤') : 'متاح'}
                                            </span>
                                        </div>

                                        <div className="py-4 text-center">
                                            {isOverdue ? (
                                                <div className="space-y-1">
                                                    <span className="text-rose-400 font-black text-lg block">انتهى الوقت المحدد!</span>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            stopBuzzer(room._id);
                                                        }}
                                                        className="px-3 py-1 bg-slate-950 text-slate-200 border border-slate-700 rounded-lg text-[10px] font-bold inline-flex items-center gap-1"
                                                    >
                                                        <VolumeX size={12} /> إسكات الصافرة
                                                    </button>
                                                </div>
                                            ) : (
                                                <div>
                                                    <div className="text-2xl font-black font-mono tracking-widest text-white">
                                                        {isBusy ? `${elapsedH}:${elapsedM}:${elapsedS}` : '00:00:00'}
                                                    </div>
                                                    {remainingText && (
                                                        <span className="text-[11px] font-mono text-amber-400 block mt-1 font-bold">
                                                            {remainingText}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex justify-between items-center font-mono">
                                        {room.deviceType === 'SIM' ? (
                                            <span>سعر الساعة: <b className="text-white">{room.rates?.simPrice || 60} ج</b></span>
                                        ) : (
                                            <div className="flex gap-1.5 truncate">
                                                {room.supportsPS4 !== false && <span>PS4: <b className="text-white">{room.rates?.ps4Single}ف/{room.rates?.ps4Multi}م</b></span>}
                                                {room.supportsPS5 !== false && <span>PS5: <b className="text-white">{room.rates?.ps5Single}ف/{room.rates?.ps5Multi}م</b></span>}
                                            </div>
                                        )}
                                        {session?.chargesCount ? (
                                            <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md shrink-0">
                                                {session.chargesCount} طلبات
                                            </span>
                                        ) : null}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </main>

            {/* MODAL 1: تشغيل الجهاز */}
            {startModalRoom && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full text-center space-y-4 shadow-2xl text-xs">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                            <h3 className="font-black text-white text-sm">تشغيل {startModalRoom.name}</h3>
                            <button onClick={() => setStartModalRoom(null)}><X size={16} className="text-slate-400" /></button>
                        </div>

                        {startModalRoom.deviceType === 'SIM' ? (
                            <div className="space-y-3 pt-2">
                                <p className="text-slate-400">سعر الساعة للمحاكي: <b className="text-white font-mono">{startModalRoom.rates?.simPrice || 60} ج.م</b></p>
                                <Button
                                    onClick={() => executeStartRoom('SIM', 'single', 0)}
                                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl"
                                >
                                    ♾️ تشغيل وقت مفتوح
                                </Button>
                                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                                    <label className="text-slate-400 block text-right font-bold">أو تحديد وقت محدد بالدقائق:</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[30, 60, 90, 120].map(m => (
                                            <button
                                                key={m}
                                                type="button"
                                                onClick={() => setSimTargetMins(m)}
                                                className={`py-2 rounded-xl font-mono font-bold border ${simTargetMins === m ? 'bg-violet-600 border-violet-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-300'}`}
                                            >
                                                {m} دقيقة
                                            </button>
                                        ))}
                                    </div>
                                    <Button
                                        onClick={() => executeStartRoom('SIM', 'single', simTargetMins)}
                                        className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-xs rounded-xl mt-2"
                                    >
                                        ⏱️ بدء الجلسة ({simTargetMins} د)
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3 pt-2">
                                <p className="text-slate-400 text-right font-bold">حدد نوع الكونسول ونمط اللعب المتوفر لهذه الغرفة:</p>
                                <div className="grid grid-cols-2 gap-2.5">
                                    {startModalRoom.supportsPS4 !== false && (
                                        <>
                                            <button
                                                onClick={() => executeStartRoom('PS4', 'single', 0)}
                                                className="p-3.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-violet-500 rounded-2xl text-center space-y-1 transition"
                                            >
                                                <span className="font-mono font-bold text-violet-400 block">PS4</span>
                                                <span className="font-bold text-white block">👤 فردي</span>
                                                <span className="text-[11px] text-slate-400 font-mono font-bold">{startModalRoom.rates?.ps4Single} ج/س</span>
                                            </button>

                                            <button
                                                onClick={() => executeStartRoom('PS4', 'multi', 0)}
                                                className="p-3.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-violet-500 rounded-2xl text-center space-y-1 transition"
                                            >
                                                <span className="font-mono font-bold text-violet-400 block">PS4</span>
                                                <span className="font-bold text-white block">👥 Multi (زوجي)</span>
                                                <span className="text-[11px] text-slate-400 font-mono font-bold">{startModalRoom.rates?.ps4Multi} ج/س</span>
                                            </button>
                                        </>
                                    )}

                                    {startModalRoom.supportsPS5 !== false && (
                                        <>
                                            <button
                                                onClick={() => executeStartRoom('PS5', 'single', 0)}
                                                className="p-3.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-rose-500 rounded-2xl text-center space-y-1 transition"
                                            >
                                                <span className="font-mono font-bold text-rose-400 block">PS5</span>
                                                <span className="font-bold text-white block">👤 فردي</span>
                                                <span className="text-[11px] text-slate-400 font-mono font-bold">{startModalRoom.rates?.ps5Single} ج/س</span>
                                            </button>

                                            <button
                                                onClick={() => executeStartRoom('PS5', 'multi', 0)}
                                                className="p-3.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-rose-500 rounded-2xl text-center space-y-1 transition"
                                            >
                                                <span className="font-mono font-bold text-rose-400 block">PS5</span>
                                                <span className="font-bold text-white block">👥 Multi (زوجي)</span>
                                                <span className="text-[11px] text-slate-400 font-mono font-bold">{startModalRoom.rates?.ps5Multi} ج/س</span>
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* MODAL 2: إدارة الجلسة النشطة */}
            {activeManageRoom && activeManageRoom.session && (
                <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-2xl w-full text-xs space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                            <div>
                                <h3 className="font-black text-white text-sm">{activeManageRoom.name}</h3>
                                <span className="text-slate-400 text-[10px] font-mono">
                                    الوضع الحالي: {activeManageRoom.session.playMode === 'multi' ? 'Multi 👥' : 'فردي 👤'}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                {activeManageRoom.deviceType === 'PS' && (
                                    <button
                                        onClick={() => handleSwitchMode(
                                            activeManageRoom._id,
                                            activeManageRoom.session?.playMode === 'single' ? 'multi' : 'single'
                                        )}
                                        className="px-3 py-1.5 bg-violet-600/20 text-violet-400 border border-violet-500/30 rounded-xl text-[11px] font-bold"
                                    >
                                        تحويل إلى {activeManageRoom.session.playMode === 'single' ? 'Multi 👥' : 'فردي 👤'}
                                    </button>
                                )}
                                <button onClick={() => setActiveManageRoom(null)}><X size={16} className="text-slate-400" /></button>
                            </div>
                        </div>

                        {/* المنيو السريع */}
                        <div className="space-y-2">
                            <label className="text-slate-300 font-bold block">1. اختر من منيو ومشروبات الصالة (إضافة سريعة):</label>
                            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-slate-950 rounded-2xl border border-slate-800">
                                {cafeProducts.map((prod, idx) => (
                                    <button
                                        key={prod._id || prod.id || `lounge-room-prod-${idx}`}
                                        onClick={() => handleAddProductToRoom(prod)}
                                        className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/50 text-slate-200 text-[11px] font-bold flex items-center gap-1.5 transition active:scale-95"
                                    >
                                        <span>{prod.name}</span>
                                        <span className="text-emerald-400 font-mono font-bold">({prod.price} ج)</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* صنف حر أو غرامة */}
                        <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                            <label className="text-slate-300 font-bold block">2. أو إضافة طلب حر / غرامة إتلاف غير مسجلة:</label>
                            <div className="grid grid-cols-2 gap-2">
                                <input
                                    type="text"
                                    placeholder="بيان الصنف الحر..."
                                    value={customChargeDesc}
                                    onChange={e => setCustomChargeDesc(e.target.value)}
                                    className="bg-slate-900 border border-slate-800 rounded-xl p-2 text-white text-xs focus:outline-none"
                                />
                                <input
                                    type="number"
                                    placeholder="السعر (ج.م)..."
                                    value={customChargePrice}
                                    onChange={e => setCustomChargePrice(e.target.value)}
                                    className="bg-slate-900 border border-slate-800 rounded-xl p-2 text-white font-mono text-xs focus:outline-none"
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleAddCustomCharge('order')}
                                    className="flex-1 py-1.5 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-xl font-bold"
                                >
                                    + إضافة طلب حر
                                </button>
                                <button
                                    onClick={() => handleAddCustomCharge('penalty')}
                                    className="flex-1 py-1.5 bg-rose-600/20 text-rose-400 border border-rose-500/30 rounded-xl font-bold"
                                >
                                    + غرامة / إتلاف
                                </button>
                            </div>
                        </div>

                        {/* قائمة الطلبات المسجلة */}
                        <div className="space-y-1.5 max-h-40 overflow-y-auto">
                            <span className="text-slate-400 font-bold block">الطلبات المسجلة على حساب الغرفة ({roomCharges.length}):</span>
                            {roomCharges.length === 0 ? (
                                <p className="text-slate-600 text-center py-2">لا توجد طلبات مسجلة بعد</p>
                            ) : roomCharges.map((c, idx) => (
                                <div key={c._id || `charge-${idx}`} className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center text-[11px]">
                                    <div className="flex items-center gap-2">
                                        <span className="text-white font-bold">{c.qty > 1 ? `${c.qty}x ` : ''}{c.description}</span>
                                        <span className={`px-1.5 py-0.2 text-[9px] rounded font-bold ${c.type === 'penalty' ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                            {c.type === 'penalty' ? 'غرامة' : 'طلب'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-emerald-400 font-bold">{c.price * (c.qty || 1)} ج.م</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="pt-2 border-t border-slate-800 space-y-2">
                            <Button
                                onClick={() => handleStopRoom(activeManageRoom._id)}
                                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-lg flex items-center justify-center gap-1.5"
                            >
                                <Printer size={15} /> إيقاف اللعب وإصدار الفاتورة 🖨️
                            </Button>

                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => handleVoidRoom('time')}
                                    className="py-2 bg-slate-950 hover:bg-slate-850 text-amber-400 border border-amber-500/30 rounded-xl font-bold text-[11px]"
                                >
                                    ⏳ تصفير وقت الجلسة
                                </button>
                                <button
                                    onClick={() => handleVoidRoom('all')}
                                    className="py-2 bg-slate-950 hover:bg-rose-950/40 text-rose-400 border border-rose-500/30 rounded-xl font-bold text-[11px]"
                                >
                                    🗑️ إلغاء الغرفة بالكامل
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 3: نافذة إدخال باسورد المدير */}
            {showAdminPinModal && (
                <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-xs w-full text-center space-y-4 shadow-2xl">
                        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto">
                            <KeyRound size={24} />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-white">تأكيد صلاحية المدير</h3>
                            <p className="text-[11px] text-slate-400 mt-0.5">أدخل الرقم السري للوصول للأسعار والتقارير</p>
                        </div>
                        <input
                            type="password"
                            autoFocus
                            placeholder="الرقم السري (الافتراضي 1234)..."
                            value={adminPinInput}
                            onChange={e => setAdminPinInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleVerifyAdminPin()}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-center text-white text-sm font-mono tracking-widest focus:outline-none focus:border-rose-500"
                        />
                        <div className="flex gap-2">
                            <Button
                                onClick={handleVerifyAdminPin}
                                className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl"
                            >
                                دخول
                            </Button>
                            <button
                                onClick={() => { setShowAdminPinModal(false); setAdminPinInput(''); }}
                                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl"
                            >
                                إلغاء
                            </button>
                        </div>

                        <div className="pt-2 border-t border-slate-800">
                            <button
                                onClick={() => {
                                    setShowAdminPinModal(false);
                                    setShowForgotPinModal(true);
                                }}
                                className="text-xs text-rose-400 hover:underline font-bold inline-flex items-center gap-1"
                            >
                                <HelpCircle size={13} /> نسيت كلمة السر؟
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 3.1: استعادة كلمة السر */}
            {showForgotPinModal && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl text-xs">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto">
                            <Unlock size={24} />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-white">استعادة الرقم السري لمدير الصالة</h3>
                            <p className="text-[11px] text-slate-400 mt-1">
                                أدخل الـ PIN الجديد الذي ترغب في تعيينه للصالة فورياً:
                            </p>
                        </div>

                        <div className="space-y-2 text-right">
                            <label className="text-slate-300 font-bold block text-[11px] pt-1">الرقم السري الجديد:</label>
                            <input
                                type="text"
                                placeholder="مثال: 1234 أو 5555"
                                value={newRecoveredPin}
                                onChange={e => setNewRecoveredPin(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono text-center focus:outline-none focus:border-amber-500"
                            />
                        </div>

                        <div className="flex gap-2 pt-2">
                            <Button
                                onClick={handleRecoverPin}
                                className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-xl"
                            >
                                تأكيد وتعيين الـ PIN
                            </Button>
                            <button
                                onClick={() => setShowForgotPinModal(false)}
                                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl"
                            >
                                إلغاء
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 4: لوحة المدير الكاملة */}
            {showAdminModal && (
                <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full p-6 space-y-5 text-xs shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                            <div className="flex items-center gap-2">
                                <ShieldCheck size={20} className="text-rose-400" />
                                <h2 className="text-base font-black text-white">لوحة مدير الصالة والأجهزة (Lounge Control)</h2>
                            </div>
                            <button onClick={() => setShowAdminModal(false)}><X size={18} className="text-slate-400" /></button>
                        </div>

                        <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800 gap-1">
                            {[
                                { id: 'rooms', label: 'الغرف والمحاكيات', icon: Gamepad2 },
                                { id: 'products', label: 'المنيو والمخزن', icon: Coffee },
                                { id: 'refunds', label: `المرتجعات (${pendingRefunds.length})`, icon: RotateCcw },
                                { id: 'shifts', label: 'سجل الورديات', icon: History },
                                { id: 'pin', label: 'الرقم السري', icon: KeyRound }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setAdminActiveTab(tab.id as any)}
                                    className={`flex-1 py-2 rounded-xl font-bold transition flex items-center justify-center gap-1.5 ${adminActiveTab === tab.id
                                        ? 'bg-rose-600 text-white shadow-lg'
                                        : 'text-slate-400 hover:text-white'
                                        }`}
                                >
                                    <tab.icon size={14} /> {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* الغرف */}
                        {adminActiveTab === 'rooms' && (
                            <div className="space-y-4">
                                <div className="border border-slate-800 rounded-2xl overflow-hidden">
                                    <table className="w-full text-right">
                                        <thead className="bg-slate-950 text-slate-400 p-2">
                                            <tr>
                                                <th className="p-3">اسم الجهاز</th>
                                                <th className="p-3">النوع والأنظمة المتاحة</th>
                                                <th className="p-3">الأسعار المسجلة</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800/60 font-mono">
                                            {rooms.map((r, idx) => (
                                                <tr key={r._id || `admin-room-${idx}`} className="hover:bg-slate-800/30">
                                                    <td className="p-3 font-bold text-white font-sans">{r.name}</td>
                                                    <td className="p-3 font-sans">
                                                        {r.deviceType === 'SIM' ? '🏎️ محاكي قيادة' : (
                                                            <div className="flex gap-1 flex-wrap">
                                                                {r.supportsPS4 !== false && <span className="bg-violet-500/20 text-violet-400 px-1.5 py-0.5 rounded text-[10px]">PS4</span>}
                                                                {r.supportsPS5 !== false && <span className="bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded text-[10px]">PS5</span>}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="p-3 text-slate-300 text-[11px]">
                                                        {r.deviceType === 'SIM'
                                                            ? `${r.rates?.simPrice || 60} ج/ساعة`
                                                            : `${r.supportsPS4 !== false ? `PS4: ${r.rates?.ps4Single}ف/${r.rates?.ps4Multi}م ` : ''}${r.supportsPS5 !== false ? `| PS5: ${r.rates?.ps5Single}ف/${r.rates?.ps5Multi}م` : ''}`}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* المنيو والمخزن */}
                        {adminActiveTab === 'products' && (
                            <div className="space-y-4">
                                <form onSubmit={handleSaveProduct} className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                                    <div className="flex justify-between items-center">
                                        <h4 className="font-bold text-white text-xs">
                                            {editingProdId ? 'تعديل بيانات الصنف:' : 'إضافة صنف إلى منيو ومخزن الصالة:'}
                                        </h4>
                                        {editingProdId && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setEditingProdId(null);
                                                    setProdForm({ name: '', price: '', type: 'order', isCountable: false, stock: '20' });
                                                }}
                                                className="text-rose-400 hover:underline text-[11px]"
                                            >
                                                إلغاء التعديل والعودة للإضافة
                                            </button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                        <input
                                            type="text"
                                            required
                                            placeholder="اسم الصنف (شاي، كانز، مياه)..."
                                            value={prodForm.name}
                                            onChange={e => setProdForm({ ...prodForm, name: e.target.value })}
                                            className="bg-slate-900 border border-slate-800 rounded-xl p-2 text-white"
                                        />
                                        <input
                                            type="number"
                                            required
                                            placeholder="السعر (ج.م)..."
                                            value={prodForm.price}
                                            onChange={e => setProdForm({ ...prodForm, price: e.target.value })}
                                            className="bg-slate-900 border border-slate-800 rounded-xl p-2 text-white font-mono"
                                        />
                                        <select
                                            value={prodForm.type}
                                            onChange={e => setProdForm({ ...prodForm, type: e.target.value as any })}
                                            className="bg-slate-900 border border-slate-800 rounded-xl p-2 text-white"
                                        >
                                            <option value="order">مشروب / سناك</option>
                                            <option value="penalty">غرامة / إتلاف</option>
                                        </select>
                                        <div className="flex items-center gap-2">
                                            <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                                                <input
                                                    type="checkbox"
                                                    checked={prodForm.isCountable}
                                                    onChange={e => setProdForm({ ...prodForm, isCountable: e.target.checked })}
                                                    className="accent-rose-600 rounded"
                                                />
                                                <span className="text-[11px] font-bold">صنف بمخزون معدود</span>
                                            </label>
                                        </div>
                                    </div>

                                    {prodForm.isCountable && (
                                        <div>
                                            <label className="text-slate-400 block mb-1">الكمية المتوفرة بالمخزن:</label>
                                            <input
                                                type="number"
                                                placeholder="الكمية بالقطع..."
                                                value={prodForm.stock}
                                                onChange={e => setProdForm({ ...prodForm, stock: e.target.value })}
                                                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-white font-mono"
                                            />
                                        </div>
                                    )}

                                    <Button type="submit" className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl">
                                        {editingProdId ? 'تحديث بيانات الصنف' : '+ حفظ الصنف في المنيو'}
                                    </Button>
                                </form>

                                <div className="border border-slate-800 rounded-2xl overflow-hidden max-h-56 overflow-y-auto">
                                    <table className="w-full text-right">
                                        <thead className="bg-slate-950 text-slate-400">
                                            <tr>
                                                <th className="p-3">الصنف</th>
                                                <th className="p-3">السعر</th>
                                                <th className="p-3">النوع</th>
                                                <th className="p-3">حالة المخزن</th>
                                                <th className="p-3 text-center">إجراءات</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800/60 font-mono">
                                            {cafeProducts.map((p, idx) => {
                                                const prodId = p._id || p.id || `prod-${idx}`;
                                                return (
                                                    <tr key={prodId} className="hover:bg-slate-800/30">
                                                        <td className="p-3 font-bold text-white font-sans">{p.name}</td>
                                                        <td className="p-3 text-emerald-400 font-bold">{p.price} ج.م</td>
                                                        <td className="p-3 font-sans">{p.type === 'order' ? 'مشروب' : 'غرامة'}</td>
                                                        <td className="p-3">
                                                            {p.isCountable ? (
                                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${p.stock <= 5 ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 text-slate-200'}`}>
                                                                    {p.stock} قطعة
                                                                </span>
                                                            ) : (
                                                                <span className="text-emerald-400 font-sans text-[11px] font-bold">♾️ غير محدود (بدون عدد)</span>
                                                            )}
                                                        </td>
                                                        <td className="p-3 text-center">
                                                            <div className="flex items-center justify-center gap-1.5">
                                                                <button
                                                                    onClick={() => {
                                                                        setEditingProdId(String(p._id || p.id));
                                                                        setProdForm({
                                                                            name: p.name,
                                                                            price: p.price.toString(),
                                                                            type: p.type,
                                                                            isCountable: p.isCountable,
                                                                            stock: p.stock ? p.stock.toString() : '0'
                                                                        });
                                                                    }}
                                                                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                                                                >
                                                                    <Edit3 size={13} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteProduct(String(p._id || p.id))}
                                                                    className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition"
                                                                >
                                                                    <Trash2 size={13} />
                                                                </button>
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

                        {/* سجل الشيفت */}
                        {adminActiveTab === 'shifts' && (
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
                                        <span className="text-slate-400 block mb-1 font-bold">إجمالي مبيعات الشيفت المفتوح:</span>
                                        <span className="text-2xl font-black text-emerald-400 font-mono">
                                            {activeShift ? Number(activeShift.totalSales || activeShift.cashSales || 0).toFixed(2) : '0.00'} ج.م
                                        </span>
                                    </div>
                                    <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
                                        <span className="text-slate-400 block mb-1 font-bold">الكاش المتوقع بالدرج:</span>
                                        <span className="text-2xl font-black text-sky-400 font-mono">
                                            {activeShift ? Number(activeShift.expectedCash || 0).toFixed(2) : '0.00'} ج.م
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* PIN */}
                        {adminActiveTab === 'pin' && (
                            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 max-w-sm mx-auto space-y-3">
                                <h4 className="font-bold text-white text-xs">تغيير الرقم السري لمدير الصالة:</h4>
                                <input
                                    type="password"
                                    placeholder="أدخل رقماً سرياً جديداً..."
                                    value={newAdminPin}
                                    onChange={e => setNewAdminPin(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white font-mono text-center text-sm"
                                />
                                <Button onClick={handleChangePin} className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl">
                                    حفظ الرقم السري
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* MODAL 5: الكافيتريا */}
            {showCafeModal && (
                <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 space-y-4 text-xs shadow-2xl">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                            <h3 className="font-black text-white text-sm flex items-center gap-2">
                                <Coffee className="text-emerald-400" size={18} /> كافيتريا الصالة (بيع مباشر)
                            </h3>
                            <button onClick={() => setShowCafeModal(false)}><X size={16} className="text-slate-400" /></button>
                        </div>

                        <div className="grid grid-cols-12 gap-4">
                            <div className="col-span-7 space-y-3">
                                <div className="grid grid-cols-2 gap-2">
                                    <input
                                        type="text"
                                        placeholder="طلب خارجي حر..."
                                        value={customCafeDesc}
                                        onChange={e => setCustomCafeDesc(e.target.value)}
                                        className="bg-slate-950 border border-slate-800 rounded-xl p-2 text-white text-xs"
                                    />
                                    <div className="flex gap-1">
                                        <input
                                            type="number"
                                            placeholder="السعر"
                                            value={customCafePrice}
                                            onChange={e => setCustomCafePrice(e.target.value)}
                                            className="w-20 bg-slate-950 border border-slate-800 rounded-xl p-2 text-white font-mono text-xs"
                                        />
                                        <button
                                            onClick={() => addCustomToCafe('order')}
                                            className="px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto">
                                    {cafeProducts.filter(p => p.type === 'order').map((p, idx) => (
                                        <button
                                            key={p._id || p.id || `cafe-prod-${idx}`}
                                            onClick={() => addToCafeCart(p)}
                                            className="p-3 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-xl text-right transition flex justify-between items-center"
                                        >
                                            <span className="font-bold text-white">{p.name}</span>
                                            <span className="font-mono text-emerald-400 font-bold">{p.price} ج</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="col-span-5 bg-slate-950 rounded-2xl border border-slate-800 p-3.5 flex flex-col justify-between space-y-2">
                                <div>
                                    <h4 className="font-bold text-white text-xs mb-2">سلة الطلبات:</h4>
                                    <div className="space-y-1 max-h-40 overflow-y-auto">
                                        {cafeCart.length === 0 ? (
                                            <p className="text-slate-600 text-center py-4">السلة فارغة</p>
                                        ) : cafeCart.map((item, idx) => (
                                            <div key={item._id || item.id || `cart-${idx}`} className="flex justify-between items-center p-1.5 bg-slate-900 rounded-lg text-[11px]">
                                                <span>{item.qty}x {item.name}</span>
                                                <span className="font-mono font-bold text-white">{item.price * item.qty} ج</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-2 border-t border-slate-800 space-y-2">
                                    <div className="flex justify-between font-black text-sm">
                                        <span>الإجمالي:</span>
                                        <span className="font-mono text-emerald-400">
                                            {cafeCart.reduce((s, i) => s + (i.price * i.qty), 0)} ج.م
                                        </span>
                                    </div>
                                    <Button
                                        onClick={handleConfirmCafeSale}
                                        disabled={cafeCart.length === 0}
                                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl"
                                    >
                                        دفع وترحيل للدرج 🖨️
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 6: الفاتورة الحرارية */}
            {currentBill && (
                <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
                    <div className="bg-white text-slate-950 rounded-3xl p-6 max-w-xs w-full text-xs space-y-3 font-sans shadow-2xl">
                        <div className="text-center pb-2 border-b border-dashed border-slate-300">
                            <h3 className="font-black text-base">صَرْح LOUNGE</h3>
                            <h4 className="font-bold text-slate-700">{currentBill.roomName}</h4>
                            <p className="text-[10px] text-slate-500 font-mono mt-0.5">{new Date().toLocaleString('ar-EG')}</p>
                        </div>

                        {currentBill.intervalsDetails?.length > 0 && (
                            <div className="space-y-1 py-1 border-b border-dashed border-slate-300 text-[11px]">
                                <span className="font-bold block">حساب الوقت:</span>
                                {currentBill.intervalsDetails.map((inv: any, idx: number) => (
                                    <div key={idx} className="flex justify-between text-slate-600">
                                        <span>{inv.mode} ({inv.billedMins} دقيقة)</span>
                                        <span className="font-mono font-bold text-slate-950">{inv.cost} ج</span>
                                    </div>
                                ))}
                                <div className="flex justify-between font-bold pt-1 text-slate-900">
                                    <span>إجمالي الوقت:</span>
                                    <span className="font-mono">{currentBill.timeCost} ج.م</span>
                                </div>
                            </div>
                        )}

                        {currentBill.chargesDetails?.length > 0 && (
                            <div className="space-y-1 py-1 border-b border-dashed border-slate-300 text-[11px]">
                                <span className="font-bold block">المشاريب والطلبات:</span>
                                {currentBill.chargesDetails.map((c: any, idx: number) => (
                                    <div key={idx} className="flex justify-between text-slate-600">
                                        <span>{c.description}</span>
                                        <span className="font-mono font-bold text-slate-950">{c.price * (c.qty || 1)} ج</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="pt-2 flex justify-between items-center text-sm font-black border-t-2 border-slate-950">
                            <span>الإجمالي المطلوب:</span>
                            <span className="text-base font-mono">{currentBill.total}.00 ج.م</span>
                        </div>

                        <div className="pt-3 flex gap-2">
                            <Button
                                onClick={() => { window.print(); setCurrentBill(null); }}
                                className="flex-1 py-2.5 bg-slate-950 text-white font-bold text-xs rounded-xl"
                            >
                                <Printer size={14} className="ml-1" /> طباعة
                            </Button>
                            <button
                                onClick={() => setCurrentBill(null)}
                                className="px-4 py-2.5 bg-slate-200 text-slate-800 rounded-xl font-bold"
                            >
                                إغلاق
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* تقرير إغلاق الوردية Z-Report */}
            {shiftReport && (
                <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
                    <div className="bg-white text-slate-950 rounded-3xl p-6 max-w-sm w-full text-xs space-y-3 font-sans shadow-2xl text-center">
                        <h3 className="font-black text-base text-rose-600">تقرير تقفيل وردية الصالة (Z-Report)</h3>
                        <p className="text-slate-500 font-bold">
                            الكاشير: {shiftReport.cashierName || shiftReport.shiftDetails?.cashierName || 'كاشير الصالة'}
                        </p>

                        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-right space-y-1.5 font-mono">
                            <div className="flex justify-between">
                                <span>رقم الشيفت:</span>
                                <b>{shiftReport.shiftNumber || 'LSH-0001'}</b>
                            </div>
                            <div className="flex justify-between">
                                <span>ساعات اللعب المفوترة:</span>
                                <b>{shiftReport.totalHoursBilled || 0} ساعة</b>
                            </div>
                            <div className="flex justify-between">
                                <span>إجمالي مبيعات الألعاب:</span>
                                <b>{Number(shiftReport.timeSales || 0).toFixed(2)} ج.م</b>
                            </div>
                            <div className="flex justify-between">
                                <span>مبيعات طلبات وكافيتريا:</span>
                                <b>{Number((shiftReport.ordersSales || 0) + (shiftReport.directCafeSales || 0)).toFixed(2)} ج.م</b>
                            </div>
                            <div className="flex justify-between text-rose-600 font-black text-sm pt-1 border-t border-slate-200">
                                <span>إجمالي كاش الدرج:</span>
                                <b>{Number(shiftReport.totalSales || shiftReport.expectedCash || 0).toFixed(2)} ج.م</b>
                            </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                            <Button
                                onClick={() => { window.print(); setShiftReport(null); }}
                                className="flex-1 py-2.5 bg-slate-950 text-white font-bold text-xs rounded-xl"
                            >
                                <Printer size={14} className="ml-1" /> طباعة الجرد
                            </Button>
                            <button
                                onClick={() => setShiftReport(null)}
                                className="px-4 py-2.5 bg-slate-200 text-slate-800 rounded-xl font-bold"
                            >
                                إغلاق
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* نافذة الاشتراك */}
            {(isBlocked || showSubModal) && (
                <SubscriptionModal
                    appModule="lounge"
                    appName="صَرْح Lounge للألعاب والبلايستيشن"
                    price={250}
                    onSuccess={() => {
                        setShowSubModal(false);
                        fetchLoungeData();
                    }}
                />
            )}
        </div>
    );
}