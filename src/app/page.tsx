'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Truck, 
  Store, 
  Gamepad2, 
  ShieldCheck, 
  Zap, 
  ArrowLeft, 
  CheckCircle2, 
  Sparkles,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

const systems = [
  {
    id: 'shipping',
    title: 'إدارة الشحن والعمليات اللوجستية',
    description: 'نظام سحابي شامل لإدارة بوالص الشحن، تتبع المناديب، وحساب العمولات وإرسال الإشعارات للعملاء فورياً.',
    icon: Truck,
    badge: 'الأكثر طلباً',
    features: ['إدارة المناديب وتطبيق مخصص', 'بوالص شحن وباركود ذكي', 'حساب عمولات وضرائب دقيقة']
  },
  {
    id: 'pos',
    title: 'نقاط البيع السحابية (Cloud POS)',
    description: 'حل متكامل لإدارة المبيعات، الفواتير الإلكترونية، وحركة المخزون متعدد الفروع من أي جهاز أو متصفح.',
    icon: Store,
    badge: 'متوافق مع الفوترة',
    features: ['طباعة فواتير حرارية وسريعة', 'جرد المخزون وتنبيهات النواقص', 'تقارير الأرباح والمبيعات اليومية']
  },
  {
    id: 'playstation',
    title: 'إدارة صالات الألعاب والكافيهات',
    description: 'التحكم في حجوزات الغرف، حساب الوقت بالدقيقة (فردي وزوجي)، وإدارة طلبات المشروبات والمأكولات.',
    icon: Gamepad2,
    badge: 'سهل وسريع',
    features: ['توقيت ذكي للطاولات والغرف', 'منيو كافيه ومطبخ مدمج', 'تقارير الشيفتات والإيرادات']
  }
];

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800/80 backdrop-blur-md sticky top-0 z-50 bg-slate-950/80">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-xl text-white shadow-lg shadow-blue-500/30">
              ص
            </div>
            <div>
              <span className="font-bold text-xl tracking-tight text-white block">صَرْح</span>
              <span className="text-[10px] text-blue-400 font-mono tracking-widest block -mt-1">SARH CLOUD</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/affiliate/register" className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-slate-300 hover:text-white transition">
              <Users size={16} className="text-blue-400" /> انضم كمسوق (25% عمولة)
            </Link>
            <Link href="/register">
              <Button className="py-2 px-5 text-sm">
                ابدأ تجربتك المجانية <ArrowLeft size={16} className="mr-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-24 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent pointer-events-none" />
        
        <div className="max-w-3xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-6">
            <Sparkles size={14} /> أنظمة سحابية جاهزة للتشغيل خلال دقيقة واحدة
          </div>
          
          <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight mb-6">
            بنيان أعمالك السحابي <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
              بدون تعقيد ولا برامج مكتبية
            </span>
          </h1>
          
          <p className="text-lg text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            منظومة متكاملة تمنح شركتك مساحة عمل ونظاماً معزولاً بالكامل، مخصصاً لنشاطك، وتعمل من أي جهاز دون الحاجة لأي تثبيت.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register" className="w-full sm:w-auto">
              <Button className="w-full py-4 px-8 text-base">
                أنشئ منشأتك الآن (7 أيام مجاناً)
              </Button>
            </Link>
            <a href="#systems" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full py-4 px-8 text-base">
                استعرض الأنظمة المتاحة
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Systems Catalog */}
      <section id="systems" className="py-20 px-6 max-w-7xl mx-auto w-full">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-white mb-3">اختر النظام المناسب لنشاطك</h2>
          <p className="text-slate-400 text-sm">أنظمة مصممة لتلبية متطلبات السوق السعودي والمصري بدقة</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {systems.map((sys) => {
            const Icon = sys.icon;
            return (
              <div 
                key={sys.id} 
                className="bg-slate-900/60 border border-slate-800 hover:border-blue-500/50 transition duration-300 rounded-2xl p-6 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center group-hover:scale-110 transition duration-300">
                      <Icon size={24} />
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      {sys.badge}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-2">{sys.title}</h3>
                  <p className="text-slate-400 text-sm mb-6 leading-relaxed">{sys.description}</p>

                  <div className="space-y-2.5 mb-8 border-t border-slate-800/80 pt-4">
                    {sys.features.map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                        <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Link href={`/register?module=${sys.id}`}>
                  <Button variant="secondary" className="w-full text-sm group-hover:bg-blue-600 group-hover:text-white transition">
                    تشغيل النظام السحابي
                  </Button>
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 py-8 px-6 text-center text-xs text-slate-500">
        <p>جميع الحقوق محفوظة لمنصة صَرْح السحابية © 2026</p>
      </footer>
    </div>
  );
}