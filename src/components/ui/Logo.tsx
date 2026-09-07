import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface LogoProps {
    size?: number;
    showText?: boolean;
    href?: string;
    className?: string;
}

export const Logo: React.FC<LogoProps> = ({
    size = 40,
    showText = true,
    href = '/',
    className = '',
}) => {
    const content = (
        <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
            <div
                className="relative flex items-center justify-center shrink-0 overflow-hidden rounded-xl"
                style={{ width: size, height: size }}
            >
                <Image
                    src="/logo.png"
                    alt="شعار صرح"
                    width={size}
                    height={size}
                    priority
                    className="object-contain w-full h-full"
                />
            </div>
            {showText && (
                <span className="text-xl font-black tracking-wide text-white font-sans">
                    صَرْح
                </span>
            )}
        </div>
    );

    if (href) {
        return <Link href={href} className="inline-flex items-center">{content}</Link>;
    }

    return content;
};