"use client";

import { useState } from "react";
import { format } from "date-fns";

export default function WalletTabs({ initialWallet }: { initialWallet: any }) {
    const [activeTab, setActiveTab] = useState<"deposit" | "withdraw" | "transfer" | "history">("history");
    const [isLoading, setIsLoading] = useState(false);
    const [amount, setAmount] = useState("");
    const [email, setEmail] = useState("");
    const [bankAccount, setBankAccount] = useState("");

    const tabs = [
        { id: "history", label: "History", icon: "history" },
        { id: "deposit", label: "Deposit", icon: "add_circle" },
        { id: "withdraw", label: "Withdraw", icon: "remove_circle" },
        { id: "transfer", label: "Transfer", icon: "swap_horiz" },
    ];

    const handleDeposit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await fetch("/api/payment/chapa/initialize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount: parseFloat(amount) }),
            });
            const data = await res.json();
            if (data.checkout_url) {
                window.location.href = data.checkout_url;
            } else {
                alert("Failed to initialize deposit");
            }
        } catch (error) {
            console.error(error);
            alert("Error initializing deposit");
        } finally {
            setIsLoading(false);
        }
    };

    const handleWithdraw = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await fetch("/api/wallet/withdraw", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount: parseFloat(amount), bankAccount }),
            });
            const data = await res.json();
            if (res.ok) {
                alert("Withdrawal requested successfully!");
                window.location.reload();
            } else {
                alert(data.error || "Failed to withdraw");
            }
        } catch (error) {
            console.error(error);
            alert("Error processing withdrawal");
        } finally {
            setIsLoading(false);
        }
    };

    const handleTransfer = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await fetch("/api/wallet/transfer", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount: parseFloat(amount), recipientEmail: email }),
            });
            const data = await res.json();
            if (res.ok) {
                alert("Transfer successful!");
                window.location.reload();
            } else {
                alert(data.error || "Failed to transfer");
            }
        } catch (error) {
            console.error(error);
            alert("Error processing transfer");
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
                        <h3 className="text-lg font-semibold text-slate-900">Recent Transactions</h3>
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

                {activeTab === "deposit" && (
                    <div className="max-w-md mx-auto py-4">
                        <div className="text-center mb-6">
                            <h3 className="text-lg font-semibold text-slate-900">Deposit Funds</h3>
                            <p className="text-sm text-slate-500">Add money to your wallet using Chapa securely.</p>
                        </div>
                        <form onSubmit={handleDeposit} className="space-y-4">
                            <div>
                                <label htmlFor="amount" className="block text-sm font-medium leading-6 text-slate-900">
                                    Amount (ETB)
                                </label>
                                <div className="mt-2">
                                    <input
                                        type="number"
                                        name="amount"
                                        id="amount"
                                        min="10"
                                        step="0.01"
                                        required
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm sm:leading-6"
                                        placeholder="e.g. 500"
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="flex w-full justify-center rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:opacity-50"
                            >
                                {isLoading ? "Processing..." : "Pay with Chapa"}
                            </button>
                        </form>
                    </div>
                )}

                {activeTab === "withdraw" && (
                    <div className="max-w-md mx-auto py-4">
                        <div className="text-center mb-6">
                            <h3 className="text-lg font-semibold text-slate-900">Withdraw Funds</h3>
                            <p className="text-sm text-slate-500">Transfer flat funds to your bank account.</p>
                        </div>
                        <form onSubmit={handleWithdraw} className="space-y-4">
                            <div>
                                <label htmlFor="withdrawAmount" className="block text-sm font-medium leading-6 text-slate-900">
                                    Amount (ETB)
                                </label>
                                <div className="mt-2">
                                    <input
                                        type="number"
                                        name="withdrawAmount"
                                        id="withdrawAmount"
                                        min="50"
                                        step="0.01"
                                        required
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm sm:leading-6"
                                        placeholder="e.g. 500"
                                    />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="bankAccount" className="block text-sm font-medium leading-6 text-slate-900">
                                    Bank Account Details
                                </label>
                                <div className="mt-2">
                                    <input
                                        type="text"
                                        name="bankAccount"
                                        id="bankAccount"
                                        required
                                        value={bankAccount}
                                        onChange={(e) => setBankAccount(e.target.value)}
                                        className="block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm sm:leading-6"
                                        placeholder="CBE 1000..."
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={isLoading || Number(amount) > Number(initialWallet.balance)}
                                className="flex w-full justify-center rounded-md bg-slate-900 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600 disabled:opacity-50"
                            >
                                {isLoading ? "Processing..." : "Submit Withdrawal"}
                            </button>
                            {Number(amount) > Number(initialWallet.balance) && (
                                <p className="text-red-500 text-sm text-center">Insufficient balance.</p>
                            )}
                        </form>
                    </div>
                )}

                {activeTab === "transfer" && (
                    <div className="max-w-md mx-auto py-4">
                        <div className="text-center mb-6">
                            <h3 className="text-lg font-semibold text-slate-900">Transfer Funds</h3>
                            <p className="text-sm text-slate-500">Send money instantly to another user by email.</p>
                        </div>
                        <form onSubmit={handleTransfer} className="space-y-4">
                            <div>
                                <label htmlFor="transferEmail" className="block text-sm font-medium leading-6 text-slate-900">
                                    Recipient Email
                                </label>
                                <div className="mt-2">
                                    <input
                                        type="email"
                                        name="transferEmail"
                                        id="transferEmail"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm sm:leading-6"
                                        placeholder="user@example.com"
                                    />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="transferAmount" className="block text-sm font-medium leading-6 text-slate-900">
                                    Amount (ETB)
                                </label>
                                <div className="mt-2">
                                    <input
                                        type="number"
                                        name="transferAmount"
                                        id="transferAmount"
                                        min="1"
                                        step="0.01"
                                        required
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm sm:leading-6"
                                        placeholder="e.g. 150"
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={isLoading || Number(amount) > Number(initialWallet.balance)}
                                className="flex w-full justify-center rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
                            >
                                {isLoading ? "Processing..." : "Transfer Now"}
                            </button>
                            {Number(amount) > Number(initialWallet.balance) && (
                                <p className="text-red-500 text-sm text-center">Insufficient balance.</p>
                            )}
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}
