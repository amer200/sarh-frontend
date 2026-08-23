'use client';

import React from 'react';
import { Printer, X, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ReceiptModalProps {
    invoice: any;
    onClose: () => void;
}

export default function ReceiptModal({ invoice, onClose }: ReceiptModalProps) {
    if (!invoice) return null;

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:p-0 print:bg-white">
            <div className="bg-white text-slate-900 w-full max-w-sm rounded-3xl p-6 shadow-2xl relative flex flex-col max-h-[90vh] print:shadow-none print:max-h-none print:w-full">

                {/* زر الإغلاق (يختفي عند الطباعة) */}
                <button
                    onClick={onClose}
                    className="absolute left-4 top-4 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition print:hidden"
                >
                    <X size={16} />
                </button>

                <div className="text-center pb-4 border-b border-dashed border-slate-300">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2 print:hidden">
                        <CheckCircle2 size={22} />
                    </div>
                    <h3 className="font-bold text-base">فاتورة ضريبية مبسطة</h3>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">منصة صَرْح السحابية</p>
                </div>

                {/* بيانات الفاتورة الأساسية */}
                <div className="py-3 text-xs space-y-1.5 border-b border-dashed border-slate-300 font-mono">
                    <div className="flex justify-between">
                        <span className="text-slate-500">رقم الفاتورة:</span>
                        <span className="font-bold">{invoice.invoiceNumber}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-500">التاريخ:</span>
                        <span>{new Date(invoice.createdAt).toLocaleString('en-US')}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-500">الكاشير:</span>
                        <span>{invoice.cashierName}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-500">طريقة الدفع:</span>
                        <span className="uppercase">{invoice.financials?.paymentMethod}</span>
                    </div>
                </div>

                {/* أصناف الفاتورة */}
                <div className="py-3 flex-1 overflow-y-auto space-y-2 border-b border-dashed border-slate-300 text-xs">
                    <div className="grid grid-cols-12 font-bold text-slate-500 pb-1 border-b border-slate-100">
                        <span className="col-span-6">الصنف</span>
                        <span className="col-span-2 text-center">الكمية</span>
                        <span className="col-span-4 text-left">المبلغ</span>
                    </div>
                    {invoice.items?.map((item: any, idx: number) => (
                        <div key={idx} className="grid grid-cols-12 items-center py-1">
                            <span className="col-span-6 truncate font-medium">{item.name}</span>
                            <span className="col-span-2 text-center font-mono">{item.quantity}</span>
                            <span className="col-span-4 text-left font-mono">{item.totalPrice.toFixed(2)}</span>
                        </div>
                    ))}
                </div>

                {/* المجاميع المالية والضريبة */}
                <div className="py-3 space-y-1.5 text-xs border-b border-dashed border-slate-300 font-mono">
                    <div className="flex justify-between text-slate-600">
                        <span>المجموع الفرعي:</span>
                        <span>{invoice.financials?.subtotal.toFixed(2)} SAR</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                        <span>ضريبة القيمة المضافة (15%):</span>
                        <span>{invoice.financials?.taxAmount.toFixed(2)} SAR</span>
                    </div>
                    {invoice.financials?.discount > 0 && (
                        <div className="flex justify-between text-rose-600">
                            <span>الخصم:</span>
                            <span>-{invoice.financials?.discount.toFixed(2)} SAR</span>
                        </div>
                    )}
                    <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                        <span>الإجمالي النهائي:</span>
                        <span>{invoice.financials?.totalAmount.toFixed(2)} SAR</span>
                    </div>
                </div>

                {/* محاكاة رمز الاستجابة السريع (ZATCA QR Code) */}
                <div className="py-4 text-center">
                    <div className="w-24 h-24 mx-auto bg-slate-900 text-white flex items-center justify-center rounded-xl font-mono text-[9px] p-2 leading-tight">
                        [ QR Code ]<br />ZATCA Compliant
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2">شكراً لزيارتكم - تم الإصدار إلكترونياً</p>
                </div>

                {/* أزرار التحكم (تخفي عند الطباعة) */}
                <div className="flex gap-2 print:hidden pt-2">
                    <Button
                        onClick={handlePrint}
                        className="flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white"
                    >
                        <Printer size={16} /> طباعة الفاتورة
                    </Button>
                    <button
                        onClick={onClose}
                        className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                    >
                        إغلاق
                    </button>
                </div>

            </div>
        </div>
    );
}