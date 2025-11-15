import React, { useMemo } from 'react';
import type { CrmLead } from '../types';
import { IndianRupee, TrendingUp, CheckCircle2 } from './icons';

interface SalesViewProps {
    leads: CrmLead[];
    onLeadSelect: (lead: CrmLead) => void;
}

const KpiCard: React.FC<{ title: string; value: string; icon: React.ReactNode; }> = ({ title, value, icon }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
            <div className="p-3 rounded-full bg-lyceum-blue/10 dark:bg-lyceum-blue/20 text-lyceum-blue mr-4">{icon}</div>
            <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
                <p className="text-3xl font-bold text-gray-800 dark:text-gray-100">{value}</p>
            </div>
        </div>
    </div>
);


const SalesView: React.FC<SalesViewProps> = ({ leads, onLeadSelect }) => {
    const { totalRevenue, conversionRate, wonLeadsCount, recentWonDeals, chartData } = useMemo(() => {
        const wonLeads = leads.filter(l => l.stage === 'Won');
        const totalLeads = leads.length;

        const totalRevenue = wonLeads.reduce((sum, l) => sum + l.value, 0);
        const conversionRate = totalLeads > 0 ? (wonLeads.length / totalLeads) * 100 : 0;
        
        const recentWonDeals = [...wonLeads]
            .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
            .slice(0, 10);
        
        // Chart data calculation for last 6 months
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
        sixMonthsAgo.setDate(1);
        sixMonthsAgo.setHours(0, 0, 0, 0);

        const monthlyRevenue = Array.from({ length: 6 }, (_, i) => {
            const d = new Date(sixMonthsAgo);
            d.setMonth(sixMonthsAgo.getMonth() + i);
            return {
                label: d.toLocaleString('default', { month: 'short' }),
                revenue: 0,
                year: d.getFullYear(),
                month: d.getMonth()
            };
        });

        wonLeads.forEach(lead => {
            if (lead.createdAt) {
                const leadDate = new Date(lead.createdAt);
                if (leadDate >= sixMonthsAgo) {
                    const monthIndex = monthlyRevenue.findIndex(m => m.year === leadDate.getFullYear() && m.month === leadDate.getMonth());
                    if (monthIndex > -1) {
                        monthlyRevenue[monthIndex].revenue += lead.value;
                    }
                }
            }
        });

        const chartData = {
            labels: monthlyRevenue.map(m => m.label),
            data: monthlyRevenue.map(m => m.revenue)
        };

        return {
            totalRevenue,
            conversionRate,
            wonLeadsCount: wonLeads.length,
            recentWonDeals,
            chartData
        };
    }, [leads]);

    const maxChartValue = useMemo(() => {
        const max = Math.max(...chartData.data);
        return max > 0 ? max : 1; // Avoid division by zero
    }, [chartData.data]);

    return (
        <div className="animate-fade-in space-y-6">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Sales Dashboard</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <KpiCard 
                    title="Total Revenue" 
                    value={`₹${totalRevenue.toLocaleString('en-IN')}`}
                    icon={<IndianRupee size={24} />}
                />
                 <KpiCard 
                    title="Lead Conversion Rate" 
                    value={`${conversionRate.toFixed(1)}%`}
                    icon={<TrendingUp size={24} />}
                />
                 <KpiCard 
                    title="Deals Won" 
                    value={wonLeadsCount.toString()}
                    icon={<CheckCircle2 size={24} />}
                />
            </div>

             <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
                    Revenue from Won Deals (Last 6 Months)
                </h2>
                <div className="flex justify-around items-end h-64 border-l border-b border-gray-200 dark:border-gray-700 pl-4 pb-4">
                    {chartData.data.map((value, index) => (
                        <div key={index} className="flex flex-col items-center w-full group px-1">
                            <div className="relative flex items-end h-full w-full">
                                <div 
                                    className="bg-lyceum-blue/60 w-1/2 mx-auto rounded-t-md hover:bg-lyceum-blue transition-colors min-h-[2px]" 
                                    style={{ height: `${(value / maxChartValue) * 100}%` }}
                                >
                                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gray-800 dark:bg-gray-900 text-white text-xs font-bold px-2 py-1 rounded-md pointer-events-none whitespace-nowrap">
                                        ₹{value.toLocaleString('en-IN')}
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-800 dark:border-t-gray-900"></div>
                                    </div>
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 truncate">{chartData.labels[index]}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 p-6 border-b dark:border-gray-700">
                    Recently Won Deals
                </h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                         <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Opportunity</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Company</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Value</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Assigned To</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {recentWonDeals.length > 0 ? recentWonDeals.map(lead => (
                                <tr key={lead.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <button onClick={() => onLeadSelect(lead)} className="text-sm font-medium text-lyceum-blue hover:underline">
                                            {lead.title}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{lead.company}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">₹{lead.value.toLocaleString('en-IN')}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{lead.assignedTo || 'Unassigned'}</td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                                        No deals have been won recently.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <style>{`
                @keyframes fade-in {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                animation: fade-in 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default SalesView;
