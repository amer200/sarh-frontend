'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Boxes, Store, Truck, Users, Calculator, ShieldCheck,
  Sparkles, ArrowLeft, ArrowUpRight, CheckCircle2,
  Layers, QrCode, TrendingUp, Zap, Building2, Lock,
  ChevronRight, Laptop, Award
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-600 selection:text-white" dir="rtl">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[550px] bg-gradient-to-b from-blue-600/15 via-indigo-600/5 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* 1. Header / Navbar */}
      <header className="h-20 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl sticky top-0 z-40 px-6">
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between">
          {/* Logo & Brand Name */}
          <div className="flex items-center gap-3">
            <div className="relative h-12 w-12 rounded-xl overflow-hidden shadow-md flex items-center justify-center">
              <Image
                src="/logo.png"
                alt="صَرْح Logo"
                fill
                className="object-cover scale-150"
                priority
              />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                صَرْح <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">Cloud Suite</span>
              </span>
              <p className="text-[10px] text-slate-400 font-medium">المنظومة السحابية المتكاملة لإدارة الأعمال</p>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-300">
            <a href="#suite" className="hover:text-blue-400 transition">باقة أنظمة صَرْح</a>
            <a href="#pos-spotlight" className="hover:text-blue-400 transition">نظام نقاط البيع (POS)</a>
            <a href="#architecture" className="hover:text-blue-400 transition">المعمارية السحابية</a>
            <a href="#affiliate" className="hover:text-blue-400 transition">برنامج الشركاء</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs font-bold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 px-4 py-2.5 rounded-xl transition hover:border-slate-700"
            >
              تسجيل الدخول
            </Link>
            <Link
              href="/pos"
              className="text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl transition shadow-lg shadow-blue-600/25 flex items-center gap-1.5"
            >
              تشغيل صَرْح POS <ArrowLeft size={14} />
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="pt-20 pb-16 px-6 relative">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-4 py-1.5 rounded-full text-xs font-medium text-blue-400">
            <Sparkles size={14} />
            <span>منظومة برمجية سحابية موحدة للشركات والمتاجر والمؤسسات</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-black text-white leading-tight tracking-tight">
            منظومة سحابية واحدة <br />
            <span className="bg-gradient-to-l from-blue-400 via-indigo-300 to-white bg-clip-text text-transparent">
              تدير كافة قطاعات وعمليات أعمالك
            </span>
          </h1>

          <p className="text-sm md:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
            منصة «صَرْح» تقدم بيئة عمل مركزية متعددة الأنظمة (Multi-System Suite)؛ تبدأ بنقاط البيع السريعة وتمتد لتشمل إدارة المخازن، التوصيل، الحسابات، وإدارة علاقات العملاء في منظومة موحدة.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/pos"
              className="bg-blue-600 hover:bg-blue-500 text-white px-7 py-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-xl shadow-blue-600/25 transition active:scale-95"
            >
              <Store size={16} /> تجربة صَرْح POS (Level 1)
            </Link>
            <a
              href="#suite"
              className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 px-7 py-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition"
            >
              <Boxes size={16} /> استعراض كافة الأنظمة
            </a>
          </div>

          {/* Quick Stats */}
          <div className="pt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-right">
            <div className="bg-slate-900/50 border border-slate-800/80 p-4 rounded-2xl">
              <div className="text-2xl font-black text-white font-mono">1-Core</div>
              <div className="text-xs text-slate-400 mt-1">قاعدة بيانات ومستأجر موحد</div>
            </div>
            <div className="bg-slate-900/50 border border-slate-800/80 p-4 rounded-2xl">
              <div className="text-2xl font-black text-emerald-400 font-mono">100%</div>
              <div className="text-xs text-slate-400 mt-1">امتثال ضريبي وحكومي</div>
            </div>
            <div className="bg-slate-900/50 border border-slate-800/80 p-4 rounded-2xl">
              <div className="text-2xl font-black text-sky-400 font-mono">Modular</div>
              <div className="text-xs text-slate-400 mt-1">تفعيل الأنظمة حسب الحاجة</div>
            </div>
            <div className="bg-slate-900/50 border border-slate-800/80 p-4 rounded-2xl">
              <div className="text-2xl font-black text-indigo-400 font-mono">Realtime</div>
              <div className="text-xs text-slate-400 mt-1">مزامنة فورية سحابية</div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Systems Suite Grid */}
      <section id="suite" className="py-20 px-6 border-t border-slate-900 bg-slate-950/40">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider font-mono">Sarh Product Ecosystem</span>
            <h2 className="text-3xl font-black text-white">باقة أنظمة صَرْح السحابية</h2>
            <p className="text-xs text-slate-400">أنظمة متخصصة متكاملة تعمل معاً تحت هوية وحساب مستأجر واحد.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* System 1: POS (Live) */}
            <div className="bg-slate-900 border-2 border-blue-500/60 p-6 rounded-3xl space-y-4 relative shadow-xl shadow-blue-500/10 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                    <Store size={24} />
                  </div>
                  <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold px-2.5 py-1 rounded-full font-mono">
                    متاح للتشغيل (Level 1)
                  </span>
                </div>
                <h3 className="text-lg font-black text-white">صَرْح POS - نقاط البيع</h3>
                <p className="text-xs text-slate-400 leading-relaxed mt-2">
                  نظام كاشير فائق السرعة يدعم قارئ الباركود، تشفير الفاتورة الضريبية ZATCA، جرد الشيفتات وتقارير Z-Report، والمرتجعات اللحظية.
                </p>
              </div>
              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-blue-400 font-semibold">جاهز للربط الفوري</span>
                <Link href="/pos" className="text-xs font-bold text-white hover:text-blue-400 flex items-center gap-1">
                  فتح النظام <ArrowLeft size={14} />
                </Link>
              </div>
            </div>

            {/* System 2: Delivery & Logistics (Upcoming) */}
            <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl space-y-4 flex flex-col justify-between opacity-85 hover:opacity-100 transition">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                    <Truck size={24} />
                  </div>
                  <span className="bg-slate-800 text-slate-400 text-[10px] font-bold px-2.5 py-1 rounded-full font-mono">
                    قيد التطوير
                  </span>
                </div>
                <h3 className="text-lg font-black text-white">صَرْح Fleet - التوصيل واللوجستيات</h3>
                <p className="text-xs text-slate-400 leading-relaxed mt-2">
                  إدارة أساطيل التوصيل، تتبع المناديب بالخرائط الحية، توجيه الطلبات الذكي، وحساب عمولات وتكاليف الشحن التلقائية.
                </p>
              </div>
              <div className="pt-4 border-t border-slate-800/60 text-[11px] text-slate-500 font-mono">
                Fleet & Delivery Management
              </div>
            </div>

            {/* System 3: ERP & Accounting (Upcoming) */}
            <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl space-y-4 flex flex-col justify-between opacity-85 hover:opacity-100 transition">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                    <Calculator size={24} />
                  </div>
                  <span className="bg-slate-800 text-slate-400 text-[10px] font-bold px-2.5 py-1 rounded-full font-mono">
                    قيد التطوير
                  </span>
                </div>
                <h3 className="text-lg font-black text-white">صَرْح ERP - المحاسبة والمخازن</h3>
                <p className="text-xs text-slate-400 leading-relaxed mt-2">
                  دفاتر الأستاذ العام، سندات القبض والصرف، قيود اليومية، إدارة الموردين، أوامر الشراء ومطابقة الجرد المتعدد.
                </p>
              </div>
              <div className="pt-4 border-t border-slate-800/60 text-[11px] text-slate-500 font-mono">
                Accounting & Supply Chain
              </div>
            </div>

            {/* System 4: CRM & Customer Loyalty (Upcoming) */}
            <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl space-y-4 flex flex-col justify-between opacity-85 hover:opacity-100 transition">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
                    <Users size={24} />
                  </div>
                  <span className="bg-slate-800 text-slate-400 text-[10px] font-bold px-2.5 py-1 rounded-full font-mono">
                    قيد التطوير
                  </span>
                </div>
                <h3 className="text-lg font-black text-white">صَرْح CRM - العملاء والولاء</h3>
                <p className="text-xs text-slate-400 leading-relaxed mt-2">
                  ملفات العملاء الموحدة، برامج نقاط المكافآت، الحملات الترويجية الموجهة عبر واتساب والرسائل، وتتبع مسار المبيعات.
                </p>
              </div>
              <div className="pt-4 border-t border-slate-800/60 text-[11px] text-slate-500 font-mono">
                Customer Engagement & Loyalty
              </div>
            </div>

            {/* System 5: Restaurant Vertical (Upcoming) */}
            <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl space-y-4 flex flex-col justify-between opacity-85 hover:opacity-100 transition">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
                    <Laptop size={24} />
                  </div>
                  <span className="bg-slate-800 text-slate-400 text-[10px] font-bold px-2.5 py-1 rounded-full font-mono">
                    مخصص للقطاع
                  </span>
                </div>
                <h3 className="text-lg font-black text-white">صَرْح F&B - المطاعم والمقاهي</h3>
                <p className="text-xs text-slate-400 leading-relaxed mt-2">
                  إدارة مخطط الطاولات الحية، شاشات عرض المطبخ (KDS)، تطبيق النادل المحمول، وإدارة وصفات ومكونات الوجبات.
                </p>
              </div>
              <div className="pt-4 border-t border-slate-800/60 text-[11px] text-slate-500 font-mono">
                Kitchen Display & Tables
              </div>
            </div>

            {/* System 6: Retail & Fashion Vertical (Upcoming) */}
            <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl space-y-4 flex flex-col justify-between opacity-85 hover:opacity-100 transition">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
                    <Boxes size={24} />
                  </div>
                  <span className="bg-slate-800 text-slate-400 text-[10px] font-bold px-2.5 py-1 rounded-full font-mono">
                    مخصص للقطاع
                  </span>
                </div>
                <h3 className="text-lg font-black text-white">صَرْح Retail - التجزئة والملابس</h3>
                <p className="text-xs text-slate-400 leading-relaxed mt-2">
                  إدارة المنتجات متعددة المتغيرات (المقاسات، الألوان)، توليد وطباعة باركود الملابس، والتحويل بين الفروع.
                </p>
              </div>
              <div className="pt-4 border-t border-slate-800/60 text-[11px] text-slate-500 font-mono">
                Variants & Barcode Matrix
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Active System Spotlight: POS Level 1 */}
      <section id="pos-spotlight" className="py-20 px-6 border-t border-slate-900">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-lg text-xs font-semibold text-blue-400">
              <Award size={14} /> الإصدار التشغيلي الأول المتاح الآن
            </div>
            <h2 className="text-3xl font-black text-white leading-tight">
              صَرْح POS (Level 1) <br />
              الكاشير السحابي والامتثال الضريبي السعودي
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              تم بناء نظام نقاط البيع كأول نظام تشغيلي في صَرْح ليقدم أداءً فائقاً يلبي المتطلبات الإلزامية لهيئة الزكاة والضريبة والجمارك، مع مرونة تامة في التخصيص.
            </p>

            <div className="grid grid-cols-2 gap-3 text-xs text-slate-300">
              <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-800 p-3 rounded-xl">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <span>تشفير ZATCA TLV Base64</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-800 p-3 rounded-xl">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <span>اختصارات لوحة المفاتيح والباركود</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-800 p-3 rounded-xl">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <span>إدارة الوردية وتقارير Z-Report</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-800 p-3 rounded-xl">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <span>المرتجعات والإشعارات الدائنة</span>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="/pos"
                className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl text-xs font-bold inline-flex items-center gap-2 transition"
              >
                الدخول لنظام نقاط البيع <ArrowLeft size={14} />
              </Link>
            </div>
          </div>

          {/* POS Terminal Visual */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                <span className="font-bold text-white">جلسة بيع نشطة (Live Terminal)</span>
              </div>
              <span className="font-mono text-slate-500">POS-Core-L1</span>
            </div>

            <div className="space-y-2 font-mono text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 flex justify-between items-center">
                <span className="text-slate-300 font-sans">1x قهوة كورتادو</span>
                <span className="font-bold text-white">16.00 SAR</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 flex justify-between items-center">
                <span className="text-slate-300 font-sans">1x تشيز كيك توت</span>
                <span className="font-bold text-white">24.00 SAR</span>
              </div>
            </div>

            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800/80 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>المجموع شامل الضريبة (15%):</span>
                <span className="font-mono text-sky-400 font-bold text-sm">46.00 SAR</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>رمز الاستجابة الضريبي:</span>
                <span className="text-emerald-400 font-sans font-bold">ZATCA Verified ✓</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Cloud Architecture */}
      <section id="architecture" className="py-20 px-6 border-t border-slate-900 bg-slate-950/40">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider font-mono">Multi-Tenant Architecture</span>
            <h2 className="text-3xl font-black text-white">البنية التحتية لمنظومة صَرْح</h2>
            <p className="text-xs text-slate-400">عزل سحابي وأمان عالي يضمن سرعة التوسع واستقلالية بيانات كل منشأة.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-3xl space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <Building2 size={20} />
              </div>
              <h3 className="text-sm font-bold text-white">نطاق مخصص لكل منشأة (Subdomain)</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                كل مستأجر يمتلك بيئة عمل سحابية خاصة معزولة تماماً تضمن حماية وسرية البيانات المالية.
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-3xl space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <Layers size={20} />
              </div>
              <h3 className="text-sm font-bold text-white">هيكلية التوسيع المرنة (Modular SaaS)</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                إمكانية تفعيل وإلغاء الأنظمة (POS, Fleet, ERP) كـ Add-ons لكل مشترك بضغطة زر.
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-3xl space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Lock size={20} />
              </div>
              <h3 className="text-sm font-bold text-white">أمان عالي وامتثال للمعايير</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                تشفير كامل لرموز الوصول (JWT)، تتبع العمليات، ومطابقة الأنظمة المحاسبية والضريبية.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Affiliate & Partner Engine */}
      <section id="affiliate" className="py-20 px-6 border-t border-slate-900">
        <div className="max-w-5xl mx-auto bg-gradient-to-r from-blue-950/40 via-slate-900 to-indigo-950/40 border border-blue-500/20 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 text-center md:text-right">
            <span className="text-xs font-bold text-blue-400 font-mono uppercase">Sarh Partner Program</span>
            <h3 className="text-2xl md:text-3xl font-black text-white">سوّق لكافة أنظمة صَرْح واربح عمولات مستمرة</h3>
            <p className="text-xs text-slate-400 max-w-lg leading-relaxed">
              انضم لبرنامج الشركاء واكسب عمولات شهرية متكررة عن كل منشأة تشترك في أي من أنظمة المنظومة مع لوحة تحكم فورية للأرباح.
            </p>
          </div>

          <Link
            href="/login"
            className="shrink-0 bg-white hover:bg-slate-100 text-slate-950 px-6 py-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-xl transition"
          >
            بوابة الشركاء والمسوقين <ArrowLeft size={14} />
          </Link>
        </div>
      </section>

      {/* 7. Footer */}
      <footer className="py-12 px-6 border-t border-slate-900 bg-slate-950 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            {/* <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
              <Boxes size={16} />
            </div> */}
            {/* Logo in Footer */}
            <div className="flex items-center gap-3">
              <div className="relative w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center">
                <Image
                  src="/logo.png"
                  alt="صَرْح Logo"
                  fill
                  className="object-cover scale-150"
                />
              </div>
              <span className="font-bold text-slate-300">منصة صَرْح السحابية © 2026</span>
            </div>
            <span className="font-bold text-slate-300">منظومة صَرْح السحابية © 2026</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/pos" className="hover:text-white transition">صَرْح POS</Link>
            <Link href="/pos/inventory" className="hover:text-white transition">المخازن</Link>
            <Link href="/pos/reports" className="hover:text-white transition">التقارير</Link>
            <Link href="/login" className="hover:text-white transition">تسجيل الدخول</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}