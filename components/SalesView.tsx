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
    const salesData = useMemo(() => {
        const wonLeads = leads.filter(l => l.stage === 'Won');
        const totalLeads = leads.length;

        const totalRevenue = wonLeads.reduce((sum, l) => sum + l.value, 0);
        const conversionRate = totalLeads > 0 ? (wonLeads.length / totalLeads) * 100 : 0;
        
        const recentWonDeals = [...wonLeads]
            .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
            .slice(0, 10);

        return {
            totalRevenue,
            conversionRate,
            wonLeadsCount: wonLeads.length,
            recentWonDeals
        };
    }, [leads]);

    return (
        <div className="animate-fade-in space-y-6">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Sales Dashboard</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <KpiCard 
                    title="Total Revenue" 
                    value={`₹${salesData.totalRevenue.toLocaleString('en-IN')}`}
                    icon={<IndianRupee size={24} />}
                />
                 <KpiCard 
                    title="Lead Conversion Rate" 
                    value={`${salesData.conversionRate.toFixed(1)}%`}
                    icon={<TrendingUp size={24} />}
                />
                 <KpiCard 
                    title="Deals Won" 
                    value={salesData.wonLeadsCount.toString()}
                    icon={<CheckCircle2 size={24} />}
                />
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
                            {salesData.recentWonDeals.length > 0 ? salesData.recentWonDeals.map(lead => (
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
