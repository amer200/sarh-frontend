'use client';

import React from 'react';
import Link from 'next/link';
import {
  UtensilsCrossed, Shirt, Truck, ShieldCheck,
  ArrowLeft, CheckCircle2, Sparkles, Zap,
  Printer, Smartphone, Store, Barcode, Layers,
  Globe, Clock, Award, Check, Play, RefreshCw, ArrowRightLeft
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-600 selection:text-white" dir="rtl">

      {/* 1. Navbar */}
      <nav className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 border border-blue-500 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-blue-600/30">
              ص
            </div>
            <div>
              <span className="text-lg font-black tracking-wide text-white">صَرْح</span>
              <span className="text-[10px] text-blue-400 font-bold block -mt-1 font-mono">SARH CLOUD</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-400">
            <a href="#apps" className="hover:text-white transition">الأنظمة والتطبيقات</a>
            <a href="#pricing" className="hover:text-white transition">الأسعار والاشتراكات</a>
            <a href="#features" className="hover:text-white transition">المميزات الفنية</a>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs font-bold text-slate-300 hover:text-white px-3.5 py-2 transition"
            >
              تسجيل الدخول
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black transition shadow-lg shadow-blue-600/20 flex items-center gap-1.5"
            >
              <span>ابدأ تجربة 7 أيام مجاناً</span>
              <ArrowLeft size={14} />
            </Link>
          </div>
        </div>
      </nav>

      {/* 2. Hero Section */}
      <section className="relative pt-20 pb-20 overflow-hidden">
        <div className="max-w-5xl mx-auto px-6 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold shadow-sm">
            <Sparkles size={14} className="text-amber-400 animate-pulse" />
            <span>منظومة سحابية بنظام الاشتراكات المستقلة لكل نشاط</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight tracking-tight">
            اختر النظام المناسب لنشاطك، <br />
            <span className="bg-gradient-to-l from-blue-400 via-indigo-300 to-white bg-clip-text text-transparent">
              وادفع فقط مقابل ما يحتاجه متجرك
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
            منصة سحابية توفر تطبيقات متخصصة ومستقلة: كاشير وسحب شيفتات للمطاعم والكافيهات، أو مصفوفة مقاسات وطباعة باركود للملابس والتجزئة. اشترك في نظام واحد أو ادمجهم معاً في حساب منشأة موحد.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Link
              href="/register"
              className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-sm font-black transition shadow-xl shadow-blue-600/25 flex items-center justify-center gap-2"
            >
              <span>اختر نشاطك وابدأ التجربة المجانية</span>
              <ArrowLeft size={16} />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto px-6 py-3.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 rounded-2xl text-xs font-bold transition flex items-center justify-center"
            >
              دخول المشتركين
            </Link>
          </div>

          <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 font-semibold">
            <span className="flex items-center gap-1.5"><CheckCircle2 size={15} className="text-emerald-400" /> 7 أيام تجربة مجانية مستقلة لكل تطبيق</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 size={15} className="text-emerald-400" /> دعم ضريبة 14% والقيمة المضافة</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 size={15} className="text-emerald-400" /> دعم طابعات الباركود والفواتير الحرارية</span>
          </div>
        </div>
      </section>

      {/* 3. Apps Showcase */}
      <section id="apps" className="py-16 bg-slate-900/40 border-y border-slate-800/60">
        <div className="max-w-7xl mx-auto px-6 space-y-10">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">عائلة تطبيقات صَرْح</span>
            <h2 className="text-2xl sm:text-3xl font-black text-white">تطبيقات معزولة ومتخصصة لكل قطاع</h2>
            <p className="text-xs text-slate-400">كل نظام يعمل كصندوق مستقل بقاعدة بيانات ومسارات مبيعات مخصصة</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* POS App */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-7 space-y-5 hover:border-amber-500/40 transition shadow-xl group flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center group-hover:scale-105 transition shadow-lg">
                    <UtensilsCrossed size={24} />
                  </div>
                  <span className="text-amber-400 font-mono font-bold text-xs bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                    250 ج.م / شهر
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white">صَرْح POS — المطاعم والكافيهات</h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    نظام نقاط البيع السريع للطاولات والوجبات، تقفيل ومطابقة الشيفتات بدون عجز، تقارير Z-Report اليومية، والمصروفات النثرية.
                  </p>
                </div>

                <ul className="text-[11px] text-slate-400 space-y-2 pt-2 border-t border-slate-800">
                  <li className="flex items-center gap-2"><Check size={14} className="text-emerald-400" /> اختصارات لوحة المفاتيح (F1 كاش / F2 فيزا)</li>
                  <li className="flex items-center gap-2"><Check size={14} className="text-emerald-400" /> إدارة الطاولات، المرتجعات، وإشعارات الدائن</li>
                  <li className="flex items-center gap-2"><Check size={14} className="text-emerald-400" /> جرد الدرج ومطابقة النقدية الفورية</li>
                </ul>
              </div>

              <Link
                href="/register"
                className="w-full py-3 bg-slate-800 hover:bg-amber-600 hover:text-slate-950 text-slate-200 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition"
              >
                <span>تجربة كاشير المطاعم 7 أيام</span> <ArrowLeft size={14} />
              </Link>
            </div>

            {/* Retail App */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-7 space-y-5 hover:border-blue-500/40 transition shadow-xl group flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center group-hover:scale-105 transition shadow-lg">
                    <Shirt size={24} />
                  </div>
                  <span className="text-blue-400 font-mono font-bold text-xs bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/20">
                    250 ج.م / شهر
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white">صَرْح Retail — الملابس والتجزئة</h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    مُولّد مصفوفة المقاسات والألوان، توليد وطباعة ملصقات الباركود الحرارية، إدارة فروع ومستودعات المتجر ومناقلات البضائع.
                  </p>
                </div>

                <ul className="text-[11px] text-slate-400 space-y-2 pt-2 border-t border-slate-800">
                  <li className="flex items-center gap-2"><Check size={14} className="text-emerald-400" /> توليد مصفوفة المقاسات والألوان بنقرة واحدة</li>
                  <li className="flex items-center gap-2"><Check size={14} className="text-emerald-400" /> طباعة ملصقات الملابس الحرارية (Sticker Tags)</li>
                  <li className="flex items-center gap-2"><Check size={14} className="text-emerald-400" /> مناقلات المخزون وتتبع الشحنات بين الفروع</li>
                </ul>
              </div>

              <Link
                href="/register"
                className="w-full py-3 bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-200 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition"
              >
                <span>تجربة كاشير الملابس 7 أيام</span> <ArrowLeft size={14} />
              </Link>
            </div>

            {/* Fleet App */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-7 space-y-5 shadow-xl flex flex-col justify-between opacity-80">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-lg">
                    <Truck size={24} />
                  </div>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-lg font-mono font-bold">
                    قريباً (Beta)
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white">صَرْح Fleet — الأسطول واللوجستيات</h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    منظومة إدارة مناديب وكباتن التوصيل، توزيع الطلبات الذكي، تتبع مسارات الشحنات على الخريطة وحساب عمولات التوصيل.
                  </p>
                </div>

                <ul className="text-[11px] text-slate-500 space-y-2 pt-2 border-t border-slate-800">
                  <li className="flex items-center gap-2">• تطبيق خاص للطيار وتتبع عبر GPS</li>
                  <li className="flex items-center gap-2">• حساب العمولات والتحصيل عند الاستلام (COD)</li>
                  <li className="flex items-center gap-2">• ربط مباشر مع فواتير الكاشير والمبيعات</li>
                </ul>
              </div>

              <button
                disabled
                className="w-full py-3 bg-slate-800 text-slate-500 font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-not-allowed border border-slate-800"
              >
                <span>قيد الإطلاق قريباً</span>
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* 4. Independent Pricing Section */}
      <section id="pricing" className="py-20">
        <div className="max-w-5xl mx-auto px-6 space-y-12">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">شفافية تامة في التسعير</span>
            <h2 className="text-2xl sm:text-3xl font-black text-white">خطط اشتراك مستقلة لكل تطبيق</h2>
            <p className="text-xs text-slate-400">لا تدفع مقابل ميزات لا تستخدمها. فعّل التطبيق المناسب لنشاطك وقتما تشاء.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Plan 1: POS */}
            <div className="bg-slate-900 border border-slate-800 hover:border-amber-500/30 rounded-3xl p-8 space-y-6 shadow-xl relative">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-bold text-amber-400 block font-mono">APP MODULE</span>
                  <h3 className="text-xl font-black text-white mt-1">اشتراك صَرْح POS</h3>
                  <p className="text-xs text-slate-400 mt-1">مخصص للمطاعم، الكافيهات، ومحلات الأغذية</p>
                </div>
                <div className="text-left">
                  <span className="text-2xl font-black text-white font-mono">250 ج.م</span>
                  <span className="text-[11px] text-slate-400 block font-sans">شهرياً</span>
                </div>
              </div>

              <div className="space-y-2.5 text-xs text-slate-300 py-4 border-y border-slate-800">
                <span className="flex items-center gap-2"><CheckCircle2 size={15} className="text-amber-400" /> كاشير مطاعم وكافيهات غير محدود</span>
                <span className="flex items-center gap-2"><CheckCircle2 size={15} className="text-amber-400" /> إدارة الطاولات وتقارير الشيفتات و Z-Report</span>
                <span className="flex items-center gap-2"><CheckCircle2 size={15} className="text-amber-400" /> دعم الضرائب وفواتير الـ QR Code</span>
                <span className="flex items-center gap-2"><CheckCircle2 size={15} className="text-amber-400" /> دعم الدفع عبر InstaPay والفيزا والكاش</span>
              </div>

              <Link
                href="/register"
                className="w-full py-3.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-amber-600/10"
              >
                <span>بدء تجربة POS مجاناً (7 أيام)</span>
                <ArrowLeft size={15} />
              </Link>
            </div>

            {/* Plan 2: Retail */}
            <div className="bg-slate-900 border border-slate-800 hover:border-blue-500/30 rounded-3xl p-8 space-y-6 shadow-xl relative">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-bold text-blue-400 block font-mono">APP MODULE</span>
                  <h3 className="text-xl font-black text-white mt-1">اشتراك صَرْح Retail</h3>
                  <p className="text-xs text-slate-400 mt-1">مخصص لمحلات الملابس، الأحذية، والتجزئة</p>
                </div>
                <div className="text-left">
                  <span className="text-2xl font-black text-white font-mono">250 ج.م</span>
                  <span className="text-[11px] text-slate-400 block font-sans">شهرياً</span>
                </div>
              </div>

              <div className="space-y-2.5 text-xs text-slate-300 py-4 border-y border-slate-800">
                <span className="flex items-center gap-2"><CheckCircle2 size={15} className="text-blue-400" /> مُولّد مصفوفة المقاسات والألوان التلقائي</span>
                <span className="flex items-center gap-2"><CheckCircle2 size={15} className="text-blue-400" /> طباعة ملصقات الباركود الحرارية (38x25 / 50x30)</span>
                <span className="flex items-center gap-2"><CheckCircle2 size={15} className="text-blue-400" /> إدارة الفروع ومناقلات المخزون بين المستودعات</span>
                <span className="flex items-center gap-2"><CheckCircle2 size={15} className="text-blue-400" /> كاشير بيع ملابس فوري بالباركود وقارئ الليزر</span>
              </div>

              <Link
                href="/register"
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-blue-600/20"
              >
                <span>بدء تجربة Retail مجاناً (7 أيام)</span>
                <ArrowLeft size={15} />
              </Link>
            </div>

          </div>

          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-emerald-400" />
              <span>هل تمتلك نشاطين معاً (مطعم + متجر ملابس)؟ يمكنك تفعيل التطبيقين في نفس الحساب وإدارتهما عبر <b>مُبدّل التطبيقات</b>.</span>
            </span>
            <Link href="/register" className="text-blue-400 font-bold hover:underline shrink-0">
              إنشاء حساب منشأة موحد ←
            </Link>
          </div>
        </div>
      </section>

      {/* 5. Footer */}
      <footer className="border-t border-slate-800/80 py-8 text-center text-xs text-slate-500">
        <p>© 2026 صَرْح السحابية (SARH Cloud) — جميع الحقوق محفوظة.</p>
      </footer>

    </div>
  );
}