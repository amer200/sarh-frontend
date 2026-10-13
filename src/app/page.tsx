// src/app/page.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Gamepad2, UtensilsCrossed, Shirt, Truck,
  CheckCircle2, ArrowLeft, ShieldCheck, Zap,
  Clock, DollarSign, Store, Sparkles, Layers,
  CreditCard, ChevronRight, BarChart3, Smartphone
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

const PLATFORM_MODULES = [
  {
    id: 'lounge',
    title: 'صَرْح Lounge',
    subtitle: 'صالات البلايستيشن والمحاكيات',
    desc: 'نظام تشغيل وإدارة ألعاب الوقت المتغير، التبديل اللحظي بين الفردي والزوجي، صافرة التنبيه عند انتهاء الجلسة، ومبيعات الكافيتريا في فاتورة واحدة.',
    icon: Gamepad2,
    color: 'text-violet-400',
    borderColor: 'border-violet-500/30',
    bgAccent: 'bg-violet-600/10',
    price: '250 ج.م',
    features: [
      'عدادات زمنية رقمية دقيقة للجلسات المفتوحة والمحددة',
      'التحويل الحي بين Single و Multi واحتساب الفارق تلقائياً',
      'صافرة إنذار صوتية (Web Audio) فور انتهاء الوقت',
      'إضافة الطلبات والمشروبات أو الغرامات لحساب الغرفة',
      'كاشير بيع مباشر للكافيتريا دون ربط بطاولة',
      'جرد الوردية ومطابقة كاش الدرج بتقرير Z-Report'
    ]
  },
  {
    id: 'pos',
    title: 'صَرْح POS',
    subtitle: 'المطاعم والكافيهات والأغذية',
    desc: 'نظام كاشير سريع لشاشات اللمس وقوارئ الباركود، يدعم فواتير الضريبة المبسطة، تقفيل الشيفتات اليومية، وتتبع نواقص المخزن لحظياً.',
    icon: UtensilsCrossed,
    color: 'text-amber-400',
    borderColor: 'border-amber-500/30',
    bgAccent: 'bg-amber-500/10',
    price: '250 ج.م',
    features: [
      'كاشير بيع فائق السرعة باختصارات لوحة المفاتيح (F1-F4)',
      'تشفير الفواتير بـ QR Code متوافق مع هيئة الزكاة والضريبة',
      'إدارة المصروفات النثرية وعهد بداية الدرج بدقة',
      'مرتجعات جزئية وإصدار إشعارات دائن ضريبية',
      'تنبيهات نواقص المخزون وحد إعادة الطلب التلقائي'
    ]
  },
  {
    id: 'retail',
    title: 'صَرْح Retail',
    subtitle: 'محلات الملابس والتجزئة',
    desc: 'محرك مصفوفة المقاسات والألوان، طباعة الباركود الحراري الليزري، كاشير بيع بالباركود، وإدارة مناقلات البضائع بين الفروع والمستودعات.',
    icon: Shirt,
    color: 'text-blue-400',
    borderColor: 'border-blue-500/30',
    bgAccent: 'bg-blue-600/10',
    price: '250 ج.م',
    features: [
      'مُولّد مصفوفة المقاسات والألوان بضغطة زر واحدة',
      'طباعة ملصقات الباركود والـ SKU للطابعات الحرارية',
      'كاشير بيع ملابس سريع بسكانر الباركود المباشر',
      'أذونات مناقلات بضاعة بين الفروع والمخزن الرئيسي',
      'تراجع ذري عن المخزون لمنع العجز والبيع بالخطأ'
    ]
  },
  {
    id: 'fleet',
    title: 'صَرْح Fleet',
    subtitle: 'الأسطول والتوصيل السريع',
    desc: 'توزيع الطلبات على المناديب، متابعة مسارات الشحنات على الخريطة، تسوية التحصيل النقدي والعهد المالية عند الاستلام.',
    icon: Truck,
    color: 'text-emerald-400',
    borderColor: 'border-emerald-500/30',
    bgAccent: 'bg-emerald-500/10',
    price: '350 ج.م',
    features: [
      'توزيع ذكي لطلبات الدليفري على المناديب الأقرب',
      'تتبع موقع المندوب والشحنة لحظياً على الخريطة',
      'تسوية النقدية وتحصيل مبالغ الدفع عند الاستلام (COD)',
      'حساب عمولات التوصيل وأداء المناديب اليومي'
    ]
  }
];

export default function HomePage() {
  const [selectedTab, setSelectedTab] = useState<'lounge' | 'pos' | 'retail' | 'fleet'>('lounge');
  const activeModule = PLATFORM_MODULES.find(m => m.id === selectedTab) || PLATFORM_MODULES[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-600 selection:text-white" dir="rtl">

      {/* Navbar */}
      <header className="h-16 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-600 border border-blue-500 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-blue-600/30">
            ص
          </div>
          <div>
            <span className="text-base font-black text-white tracking-wide">صَرْح السحابية</span>
            <span className="text-[10px] text-blue-400 font-mono block">SARH Multi-Industry SaaS</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/login" className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white transition">
            تسجيل الدخول
          </Link>
          <Link href="/register">
            <Button className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2 px-4 rounded-xl shadow-lg shadow-blue-600/20">
              بدء تجربة مجانية 7 أيام
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 sm:py-24 px-4 text-center max-w-4xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold">
          <Sparkles size={14} /> كل نظام مستقل تماماً بذاته • ادفع مقابل ما تحتاجه فقط
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight">
          منظومة تشغيل وإدارة سحابية متخصصة <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-violet-400">
            لصالات الألعاب، المطاعم، ومحلات التجزئة
          </span>
        </h1>

        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
          ودّع الأنظمة المعقدة. تمنحك صَرْح كاشيراً وإدارة متخصصة لكل قطاع مع قواعد بيانات وورديات وجرد منعزل لكل نشاط، مع جاهزية كاملة للفواتير والتقارير.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
          <Link href="/register">
            <Button className="py-3 px-8 text-sm font-black bg-blue-600 hover:bg-blue-500 text-white rounded-2xl shadow-xl shadow-blue-600/30">
              ابدأ الآن مجاناً (7 أيام) 🚀
            </Button>
          </Link>
          <Link href="/login">
            <button className="py-3 px-6 text-sm font-bold bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-800 rounded-2xl transition">
              دخول المشتركين
            </button>
          </Link>
        </div>
      </section>

      {/* Interactive Systems Showcase */}
      <section className="max-w-6xl mx-auto px-4 py-12 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-black text-white">استكشف أنظمة المنظومة الأربعة</h2>
          <p className="text-xs text-slate-400">اختر النظام لتشاهد الميزات المخصصة التي صُممت لطبيعة عملك</p>
        </div>

        {/* Tabs */}
        <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800 max-w-2xl mx-auto gap-1">
          {PLATFORM_MODULES.map(m => {
            const isSelected = selectedTab === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setSelectedTab(m.id as any)}
                className={`flex-1 py-3 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${isSelected
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white'
                  }`}
              >
                <m.icon size={16} />
                <span className="hidden sm:inline">{m.title}</span>
              </button>
            );
          })}
        </div>

        {/* Active Module Card Preview */}
        <div className={`bg-slate-900 border ${activeModule.borderColor} rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div className="flex items-center gap-3.5">
              <div className={`w-14 h-14 rounded-2xl ${activeModule.bgAccent} ${activeModule.color} flex items-center justify-center`}>
                <activeModule.icon size={28} />
              </div>
              <div>
                <h3 className="text-xl font-black text-white">{activeModule.title}</h3>
                <p className="text-xs text-slate-400">{activeModule.subtitle}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-left font-mono">
                <span className="text-xs text-slate-500 block">قيمة الاشتراك:</span>
                <span className="text-lg font-black text-emerald-400">{activeModule.price} / شهر</span>
              </div>
              <Link href={`/register?activity=${activeModule.id}`}>
                <Button className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2.5 px-4 rounded-xl">
                  تجربة هذا النظام
                </Button>
              </Link>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {activeModule.desc}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
            {activeModule.features.map((feat, idx) => (
              <div key={idx} className="p-3 bg-slate-950 rounded-2xl border border-slate-800/80 flex items-center gap-2.5 text-xs text-slate-200">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <span>{feat}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture Highlights */}
      <section className="bg-slate-900/50 border-y border-slate-800/80 py-16 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          <div className="p-6 bg-slate-950 rounded-3xl border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold">
              <Layers size={20} />
            </div>
            <h4 className="text-sm font-bold text-white">عزل تام واستقلالية كاملة</h4>
            <p className="text-slate-400 leading-relaxed">
              لكل نظام شيفتاته الخاصة، كاشيره، وحساباته المستقلة؛ تشغيل صالة الألعاب لا يتدخل في حسابات التجزئة أو كاشير المطاعم.
            </p>
          </div>

          <div className="p-6 bg-slate-950 rounded-3xl border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
              <ShieldCheck size={20} />
            </div>
            <h4 className="text-sm font-bold text-white">فواتير إلكترونية وتقارير Z-Report</h4>
            <p className="text-slate-400 leading-relaxed">
              طباعة حرارية فورية مع مطابقة عهدة الدرج والعجز والزيادة عند تقفيل كل وردية، مع دعم كامل للـ QR Code الضريبي.
            </p>
          </div>

          <div className="p-6 bg-slate-950 rounded-3xl border border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center font-bold">
              <Zap size={20} />
            </div>
            <h4 className="text-sm font-bold text-white">تشغيل فوري عبر السحابة</h4>
            <p className="text-slate-400 leading-relaxed">
              لا تحتاج لسيرفرات أو برامج معقدة؛ سجل الآن وابدأ العمل من أي متصفح، كمبيوتر كاشير، أو شاشة لمس خلال دقيقة واحدة.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 text-center text-xs text-slate-500 border-t border-slate-800">
        <p>© 2026 منصة صَرْح السحابية (SARH Cloud) — جميع الحقوق محفوظة</p>
      </footer>

    </div>
  );
}