import React, { useEffect, useRef, useState } from 'react';

interface StatCardProps {
    title: React.ReactNode;
    value: React.ReactNode;
    change?: string;
    changeType?: 'positive' | 'negative' | 'neutral';
    icon?: React.ReactNode;
    color?: 'blue' | 'green' | 'red' | 'gray' | 'yellow' | 'purple' | 'orange';
    trend?: 'up' | 'down';
    insight?: React.ReactNode;
    trendGraph?: React.ReactNode;
    animated?: boolean;
    gradient?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({ 
    title, 
    value, 
    change, 
    changeType = 'neutral', 
    icon, 
    color = 'gray',
    trend,
    insight,
    trendGraph,
    animated = false,
    gradient = false
}) => {
    const insightRef = useRef<HTMLDivElement>(null);
    const [shouldMarquee, setShouldMarquee] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [animatedValue, setAnimatedValue] = useState(0);
    const cardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (insightRef.current) {
            const element = insightRef.current;
            const isOverflowing = element.scrollWidth > element.clientWidth;
            setShouldMarquee(isOverflowing);
        }
    }, [insight]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !isVisible) {
                    setIsVisible(true);
                }
            },
            { threshold: 0.1 }
        );

        if (cardRef.current) {
            observer.observe(cardRef.current);
        }

        return () => {
            if (cardRef.current) {
                observer.unobserve(cardRef.current);
            }
        };
    }, [isVisible]);

    useEffect(() => {
        if (animated && isVisible && typeof value === 'string') {
            const numericValue = parseFloat(value.replace(/[^0-9.-]/g, ''));
            if (!isNaN(numericValue)) {
                const duration = 1000;
                const steps = 60;
                const increment = numericValue / steps;
                let current = 0;
                
                const timer = setInterval(() => {
                    current += increment;
                    if (current >= numericValue) {
                        setAnimatedValue(numericValue);
                        clearInterval(timer);
                    } else {
                        setAnimatedValue(current);
                    }
                }, duration / steps);

                return () => clearInterval(timer);
            }
        }
    }, [animated, isVisible, value]);
    const changeColors = {
        positive: 'text-green-600 bg-green-50 dark:bg-green-900/20',
        negative: 'text-red-600 bg-red-50 dark:bg-red-900/20',
        neutral: 'text-gray-600 bg-gray-50 dark:bg-gray-700/50',
    };

    const bgColors = {
        blue: 'bg-blue-100 dark:bg-blue-900/20',
        green: 'bg-green-100 dark:bg-green-900/20',
        red: 'bg-red-100 dark:bg-red-900/20',
        gray: 'bg-gray-100 dark:bg-gray-700/50',
        yellow: 'bg-yellow-100 dark:bg-yellow-900/20',
        purple: 'bg-purple-100 dark:bg-purple-900/20',
        orange: 'bg-orange-100 dark:bg-orange-900/20'
    };

    const gradientBgColors = {
        blue: 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20',
        green: 'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20',
        red: 'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20',
        gray: 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-600/50',
        yellow: 'bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20',
        purple: 'bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20',
        orange: 'bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20'
    };

    const valueColors = {
        blue: 'text-blue-600 dark:text-blue-400',
        green: 'bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent',
        red: 'bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent',
        gray: 'text-gray-900 dark:text-white',
        yellow: 'text-yellow-600 dark:text-yellow-400',
        purple: 'text-purple-600 dark:text-purple-400',
        orange: 'text-orange-600 dark:text-orange-400',
    };

    const formatAnimatedValue = (val: number, originalValue: string) => {
        if (typeof originalValue === 'string') {
            const currencySymbol = originalValue.match(/^[^\d\s,.-]+/)?.[0] || '';
            
            if (currencySymbol) {
                if (currencySymbol === '৳') {
                    return `${currencySymbol}${val.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                }
                return `${currencySymbol}${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            }
        }
        return val.toLocaleString();
    };

    const displayValue = animated && isVisible && typeof value === 'string' 
        ? formatAnimatedValue(animatedValue, value)
        : value;

    return (
        <div 
            ref={cardRef}
            className={`
                relative overflow-hidden rounded-xl border p-4 shadow-sm transition-all duration-500 group cursor-pointer
                ${gradient 
                    ? `${gradientBgColors[color]} border-gray-200/50 dark:border-gray-600/50 hover:shadow-xl hover:scale-[1.02] hover:border-gray-300 dark:hover:border-gray-500` 
                    : `bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:shadow-md hover:border-gray-200 dark:hover:border-gray-600`
                }
                ${isVisible ? 'animate-fadein' : 'opacity-0 translate-y-4'}
            `}
        >
            {gradient && (
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent dark:from-white/5 dark:to-transparent pointer-events-none" />
            )}
            
            <div className="relative flex items-center justify-between">
                <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-0 tracking-wide uppercase transition-colors duration-300 group-hover:text-gray-600 dark:group-hover:text-gray-300">{title}</p>
                    <p className={`text-base sm:text-lg font-bold mb-1 transition-all duration-500 group-hover:scale-105 ${valueColors[color] || valueColors.gray}`}>
                        {displayValue}
                    </p>
                    {change && (
                        <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${changeColors[changeType]}`}>
                            {change}
                        </div>
                    )}
                    {trend && false && (
                        <div className="flex items-center mt-1">
                            <span className={`text-xs ${trend === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                {trend === 'up' ? '↑' : '↓'}
                            </span>
                        </div>
                    )}
                </div>
                {icon && (
                    <div className={`
                        w-10 h-10 rounded-lg flex items-center justify-center shadow-inner transition-all duration-300 group-hover:scale-110 group-hover:rotate-3
                        ${gradient 
                            ? `bg-white/50 dark:bg-white/10 backdrop-blur-sm border border-white/20 dark:border-white/10` 
                            : bgColors[color]
                        }
                    `}>
                        {React.cloneElement(icon as React.ReactElement, { 
                            className: `w-5 h-5 transition-colors duration-300 ${valueColors[color]}` 
                        })}
                    </div>
                )}
            </div>
            
            {(insight || trendGraph) && (
                <div className="flex items-center justify-between mt-2 pt-0 border-t border-gray-100 dark:border-gray-700">
                    {insight && (
                        <div className="flex-1 min-w-0 mr-2">
                            <div 
                                ref={insightRef}
                                className={`overflow-hidden hide-scrollbar ${shouldMarquee ? 'marquee-container' : ''}`}
                            >
                                <div className={`whitespace-nowrap ${shouldMarquee ? 'marquee-text' : ''}`}>
                                    {insight}
                                </div>
                            </div>
                        </div>
                    )}
                    {trendGraph && (
                        <div className="flex-shrink-0 w-16 h-6 flex items-end">
                            {trendGraph}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

