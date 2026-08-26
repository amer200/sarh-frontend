'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Grid, UtensilsCrossed, Shirt, Truck, Settings,
    ShieldCheck, ExternalLink, ChevronDown, Sparkles
} from 'lucide-react';

export default function AppSwitcher() {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const pathname = usePathname();

    // إغلاق القائمة عند النقر في الخارج
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const apps = [
        {
            name: 'صَرْح POS',
            desc: 'المطاعم، الكافيهات، والوجبات',
            href: '/pos',
            icon: UtensilsCrossed,
            color: 'text-amber-400',
            bgColor: 'bg-amber-500/10',
            borderColor: 'border-amber-500/20',
            active: pathname.startsWith('/pos')
        },
        {
            name: 'صَرْح Retail',
            desc: 'التجزئة، الملابس، ومصفوفة المقاسات',
            href: '/retail',
            icon: Shirt,
            color: 'text-blue-400',
            bgColor: 'bg-blue-500/10',
            borderColor: 'border-blue-500/20',
            active: pathname.startsWith('/retail')
        },
        {
            name: 'صَرْح Fleet',
            desc: 'الأسطول، التوصيل، والتتبع الحي',
            href: '#',
            icon: Truck,
            color: 'text-emerald-400',
            bgColor: 'bg-emerald-500/10',
            borderColor: 'border-emerald-500/20',
            isComingSoon: true
        },
        {
            name: 'بوابة المنشأة المركزية',
            desc: 'الاشتراكات، الإحصائيات، والإعدادات',
            href: '/dashboard',
            icon: Grid,
            color: 'text-purple-400',
            bgColor: 'bg-purple-500/10',
            borderColor: 'border-purple-500/20',
            active: pathname === '/dashboard'
        }
    ];

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition text-xs font-bold shadow-sm"
            >
                <Grid size={15} className="text-blue-400" />
                <span>تطبيقات صَرْح</span>
                <ChevronDown size={13} className={`text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Apps Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 text-right space-y-1 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-3 py-2 border-b border-slate-800/80">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">منظومة صَرْح السحابية</span>
                        <span className="text-xs font-black text-white">اختر النظام أو مسار العمل:</span>
                    </div>

                    <div className="space-y-1 pt-1">
                        {apps.map((app, idx) => (
                            app.isComingSoon ? (
                                <div
                                    key={idx}
                                    className="p-2.5 rounded-xl border border-slate-800/40 bg-slate-950/40 opacity-60 flex items-center justify-between cursor-not-allowed"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <div className={`w-8 h-8 rounded-lg ${app.bgColor} ${app.borderColor} border flex items-center justify-center ${app.color}`}>
                                            <app.icon size={16} />
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                                                {app.name}
                                                <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.2 rounded font-mono">قريباً</span>
                                            </div>
                                            <p className="text-[10px] text-slate-500">{app.desc}</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <Link
                                    key={idx}
                                    href={app.href}
                                    onClick={() => setIsOpen(false)}
                                    className={`p-2.5 rounded-xl border transition flex items-center justify-between block ${app.active
                                            ? 'bg-blue-600/10 border-blue-500/30 text-white'
                                            : 'border-transparent hover:bg-slate-800 text-slate-300 hover:text-white'
                                        }`}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <div className={`w-8 h-8 rounded-lg ${app.bgColor} ${app.borderColor} border flex items-center justify-center ${app.color}`}>
                                            <app.icon size={16} />
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-bold leading-tight">{app.name}</h4>
                                            <p className="text-[10px] text-slate-400">{app.desc}</p>
                                        </div>
                                    </div>
                                    {app.active && (
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                    )}
                                </Link>
                            )
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}