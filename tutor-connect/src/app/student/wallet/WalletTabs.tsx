"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";

export default function WalletTabs({ initialWallet }: { initialWallet: any }) {
    const [activeTab, setActiveTab] = useState<"history">("history");
    const [isLoading, setIsLoading] = useState(false);

    const tabs = [
        { id: "history", label: "History", icon: "history" },
    ];

    const handleRefreshPending = async () => {
        const pendingTxs = initialWallet.transactions.filter((tx: any) => tx.type === 'WITHDRAWAL' && (tx.paymentMetadata?.status === 'PENDING' || tx.paymentMetadata?.status === 'QUEUED'));
        if (pendingTxs.length === 0) return;

        setIsLoading(true);
        try {
            await Promise.all(pendingTxs.map(async (tx: any) => {
                const ref = tx.referenceId;
                if(ref) await fetch(`/api/payment/chapa/transfers/verify?tx_ref=${ref}`);
            }));
            window.location.reload();
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            {/* Tab Navigation */}
            <div className="flex border-b border-slate-200 overflow-x-auto no-scrollbar">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flexItems-center px-6 py-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                            activeTab === tab.id
                                ? "border-emerald-500 text-emerald-600"
                                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                        }`}
                    >
                        <span className="material-symbols-outlined mr-2 align-middle text-lg">
                            {tab.icon}
                        </span>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="pt-6">
                {activeTab === "history" && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-slate-900">Recent Transactions</h3>
                            {initialWallet.transactions.some((tx: any) => tx.type === 'WITHDRAWAL' && (tx.paymentMetadata?.status === 'PENDING' || tx.paymentMetadata?.status === 'QUEUED')) && (
                                <button 
                                    onClick={handleRefreshPending}
                                    disabled={isLoading}
                                    className="text-sm font-medium text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-3 py-1 rounded-md"
                                >
                                    {isLoading ? "Refreshing..." : "Refresh Pending"}
                                </button>
                            )}
                        </div>
                        {initialWallet.transactions.length === 0 ? (
                            <div className="text-center py-8 text-slate-500">
                                <span className="material-symbols-outlined text-4xl mb-2 opacity-50">receipt_long</span>
                                <p>No transactions found.</p>
                            </div>
                        ) : (
                            <div className="overflow-hidden shadow-sm ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                                <table className="min-w-full divide-y divide-slate-300">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-slate-900 sm:pl-6">Type</th>
                                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Amount</th>
                                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Date</th>
                                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-900">Status/Ref</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 bg-white">
                                        {initialWallet.transactions.map((tx: any) => (
                                            <tr key={tx.id}>
                                                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium sm:pl-6">
                                                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                                                        tx.type === 'DEPOSIT' ? 'bg-green-50 text-green-700 ring-green-600/20' :
                                                        tx.type === 'WITHDRAWAL' ? 'bg-red-50 text-red-700 ring-red-600/20' :
                                                        'bg-blue-50 text-blue-700 ring-blue-600/20'
                                                    }`}>
                                                        {tx.type}
                                                    </span>
                                                </td>
                                                <td className={`whitespace-nowrap px-3 py-4 text-sm font-bold ${
                                                    tx.type === 'DEPOSIT' ? 'text-green-600' : 'text-slate-900'
                                                }`}>
                                                    {tx.type === 'DEPOSIT' ? '+' : '-'}{Number(tx.amount).toFixed(2)} ETB
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">
                                                    {format(new Date(tx.createdAt), 'MMM d, yyyy h:mm a')}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500 truncate max-w-[150px]">
                                                    {tx.description || tx.referenceId || "N/A"}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
