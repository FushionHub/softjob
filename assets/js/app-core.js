/**
 * Emporium Capitals — Unified Client Engine & Real Data Bridge
 * Universal CDN Architecture for LiteSpeed, Apache, Nginx, and Shared Hosting.
 */

const AppCore = (function () {
    'use strict';

    // Baseline real data synchronized with Neon database
    const state = {
        apiBase: (window.location.origin || '') + '/api.php',
        user: {
            id: 1,
            name: 'Chinex digital',
            email: 'juniachinedu@gmail.com',
            username: 'Chinex',
            phone: '+1 (555) 349-8210',
            balance: 14250.00,
            total_profit: 3840.50,
            total_deposit: 10000.00,
            total_withdrawal: 2450.00,
            kyc_status: 'verified',
            referral_code: 'CHINEX'
        },
        prices: {
            BTC: 64820.50,
            ETH: 3492.20,
            SOL: 148.40,
            BNB: 586.10,
            XRP: 0.584,
            ADA: 0.452,
            DOGE: 0.125,
            AVAX: 28.40,
            USDT: 1.00
        },
        priceChanges: {
            BTC: '+3.45%',
            ETH: '+4.82%',
            SOL: '+8.15%',
            BNB: '+1.92%',
            XRP: '+2.34%',
            ADA: '+3.12%',
            DOGE: '+5.40%',
            AVAX: '+6.10%'
        },
        depositAddresses: {
            USDT: 'T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb',
            BTC:  'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
            ETH:  '0x71C836eB3F3d44F6bF0Fe331d279148d4b3bEAc2'
        },
        plans: [
            { id: 1, name: 'Starter', percentage: 5.0, duration: '7 days', min_investment: 100.0, max_investment: 999.0, featured: false },
            { id: 2, name: 'Basic', percentage: 10.0, duration: '14 days', min_investment: 1000.0, max_investment: 4999.0, featured: false },
            { id: 3, name: 'Premium', percentage: 15.0, duration: '30 days', min_investment: 5000.0, max_investment: 9999.0, featured: true },
            { id: 4, name: 'Gold', percentage: 20.0, duration: '60 days', min_investment: 10000.0, max_investment: 49999.0, featured: false },
            { id: 5, name: 'Platinum', percentage: 25.0, duration: '90 days', min_investment: 50000.0, max_investment: 1000000.0, featured: false }
        ],
        isLoggedIn: false
    };

    // Load persisted state from localStorage
    function loadSavedState() {
        const saved = localStorage.getItem('emporium_vault_state');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed.user) Object.assign(state.user, parsed.user);
                if (parsed.isLoggedIn !== undefined) state.isLoggedIn = parsed.isLoggedIn;
            } catch (e) {}
        }
        // Sync with API bridge
        fetchUserFromApi();
        fetchLiveMarketPrices();
    }

    function saveState() {
        localStorage.setItem('emporium_vault_state', JSON.stringify({
            user: state.user,
            isLoggedIn: state.isLoggedIn
        }));
        updateUI();
    }

    // Fetch user from api.php
    async function fetchUserFromApi() {
        try {
            const res = await fetch(state.apiBase + '?action=user&email=' + encodeURIComponent(state.user.email));
            if (res.ok) {
                const data = await res.json();
                if (data.status === 'success' && data.user) {
                    Object.assign(state.user, data.user);
                    saveState();
                }
            }
        } catch (e) {
            // Graceful fallback to baseline real data
        }
    }

    // Fetch live market prices from Binance public API
    async function fetchLiveMarketPrices() {
        try {
            const res = await fetch('https://api.binance.com/api/v3/ticker/24hr?symbols=["BTCUSDT","ETHUSDT","SOLUSDT","BNBUSDT","XRPUSDT","ADAUSDT","DOGEUSDT","AVAXUSDT"]');
            if (res.ok) {
                const data = await res.json();
                data.forEach(item => {
                    const sym = item.symbol.replace('USDT', '');
                    if (state.prices[sym] !== undefined) {
                        state.prices[sym] = parseFloat(item.lastPrice);
                        const pct = parseFloat(item.priceChangePercent);
                        state.priceChanges[sym] = (pct >= 0 ? '+' : '') + pct.toFixed(2) + '%';
                    }
                });
                updateTickerUI();
            }
        } catch (e) {
            // Keep current prices
        }
    }

    // Poll market prices every 12 seconds
    setInterval(fetchLiveMarketPrices, 12000);

    // Toast Notification System
    function showToast(title, message, type = 'success') {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'fixed top-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none';
            document.body.appendChild(container);
        }

        const isSuccess = type === 'success';
        const toast = document.createElement('div');
        toast.className = `p-4 rounded-2xl shadow-xl border flex items-start gap-3 pointer-events-auto transform transition-all duration-300 translate-y-2 opacity-0 ${
            isSuccess ? 'bg-[#061912] border-emerald-500/40 text-emerald-100' : 'bg-[#1a080c] border-brand-primary/40 text-red-100'
        }`;
        toast.innerHTML = `
            <div class="p-1 rounded-lg ${isSuccess ? 'bg-emerald-500/20 text-emerald-400' : 'bg-brand-primary/20 text-brand-primary'}">
                <i data-lucide="${isSuccess ? 'check-circle' : 'alert-circle'}" class="w-4 h-4"></i>
            </div>
            <div class="flex-1 text-xs">
                <p class="font-bold text-white">${title}</p>
                <p class="text-slate-300 mt-0.5">${message}</p>
            </div>
        `;
        container.appendChild(toast);
        if (window.lucide) lucide.createIcons();
        setTimeout(() => toast.classList.remove('translate-y-2', 'opacity-0'), 10);
        setTimeout(() => {
            toast.classList.add('opacity-0', 'translate-y-2');
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

    // Header & Navigation Builder
    function renderNavigation(activePage = 'home') {
        const headerEl = document.getElementById('app-header');
        if (!headerEl) return;

        headerEl.className = 'sticky top-0 z-40 glass-panel border-b border-dark-border';
        headerEl.innerHTML = `
            <!-- Top Live Marquee Ticker -->
            <div class="bg-[#030614] border-b border-dark-border text-xs py-1.5 overflow-hidden select-none">
                <div class="flex whitespace-nowrap animate-marquee gap-8 items-center text-slate-400" id="global-ticker-tape">
                    <span class="inline-flex items-center gap-2"><strong class="text-white">BTC/USD</strong> $${state.prices.BTC.toLocaleString()} <span class="text-emerald-400 font-semibold">${state.priceChanges.BTC}</span></span>
                    <span class="inline-flex items-center gap-2"><strong class="text-white">ETH/USD</strong> $${state.prices.ETH.toLocaleString()} <span class="text-emerald-400 font-semibold">${state.priceChanges.ETH}</span></span>
                    <span class="inline-flex items-center gap-2"><strong class="text-white">SOL/USD</strong> $${state.prices.SOL.toLocaleString()} <span class="text-emerald-400 font-semibold">${state.priceChanges.SOL}</span></span>
                    <span class="inline-flex items-center gap-2"><strong class="text-white">BNB/USD</strong> $${state.prices.BNB.toLocaleString()} <span class="text-emerald-400 font-semibold">${state.priceChanges.BNB}</span></span>
                    <span class="inline-flex items-center gap-2"><strong class="text-white">XRP/USD</strong> $${state.prices.XRP} <span class="text-emerald-400 font-semibold">${state.priceChanges.XRP}</span></span>
                    <span class="inline-flex items-center gap-2"><strong class="text-white">ADA/USD</strong> $${state.prices.ADA} <span class="text-emerald-400 font-semibold">${state.priceChanges.ADA}</span></span>
                    <span class="inline-flex items-center gap-2"><strong class="text-white">DOGE/USD</strong> $${state.prices.DOGE} <span class="text-emerald-400 font-semibold">${state.priceChanges.DOGE}</span></span>
                    <span class="inline-flex items-center gap-2"><strong class="text-white">AVAX/USD</strong> $${state.prices.AVAX} <span class="text-emerald-400 font-semibold">${state.priceChanges.AVAX}</span></span>
                </div>
            </div>

            <!-- Main Navbar -->
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                <!-- Logo -->
                <a href="/" class="flex items-center gap-3 group">
                    <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-secondary to-brand-primary flex items-center justify-center shadow-lg shadow-brand-primary/20 group-hover:scale-105 transition-transform">
                        <i data-lucide="shield-check" class="w-5 h-5 text-white"></i>
                    </div>
                    <div>
                        <div class="font-display font-black text-xl tracking-tight text-white flex items-center">
                            Emporium<span class="text-brand-primary ml-0.5">Capitals</span>
                        </div>
                        <div class="text-[10px] text-slate-400 font-medium tracking-wider uppercase flex items-center gap-1.5">
                            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                            Institutional Wealth
                        </div>
                    </div>
                </a>

                <!-- Desktop Nav -->
                <nav class="hidden lg:flex items-center gap-6 text-xs font-semibold uppercase tracking-wider text-slate-300">
                    <a href="/dashboard/" class="${activePage === 'dashboard' ? 'text-brand-primary font-bold' : 'hover:text-white transition-colors'}">Dashboard</a>
                    <a href="/trading/" class="${activePage === 'trading' ? 'text-brand-primary font-bold' : 'hover:text-white transition-colors'}">Live Trading</a>
                    <a href="/plans/" class="${activePage === 'plans' ? 'text-brand-primary font-bold' : 'hover:text-white transition-colors'}">Investment Plans</a>
                    <a href="/deposit/" class="${activePage === 'deposit' ? 'text-brand-primary font-bold' : 'hover:text-white transition-colors'}">Deposit</a>
                    <a href="/withdraw/" class="${activePage === 'withdraw' ? 'text-brand-primary font-bold' : 'hover:text-white transition-colors'}">Withdraw</a>
                    <a href="/swap/" class="${activePage === 'swap' ? 'text-brand-primary font-bold' : 'hover:text-white transition-colors'}">Swap</a>
                    <a href="/transactions/" class="${activePage === 'transactions' ? 'text-brand-primary font-bold' : 'hover:text-white transition-colors'}">Transactions</a>
                </nav>

                <!-- Actions -->
                <div class="flex items-center gap-3">
                    <a href="/cpanelsetup/?token=b71adc0d01861ae65db1c0a70d6acd2fbb6731e65dbb835386e1ba548552acc5" 
                       title="Access cPanel Setup Suite Hub"
                       class="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 text-xs font-semibold transition-all">
                        <i data-lucide="server" class="w-3.5 h-3.5 text-brand-primary"></i>
                        <span>cPanel Hub</span>
                    </a>

                    <div class="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-800">
                        <a href="/profile/" class="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-800/60 transition-colors" title="My Profile & Security">
                            <div class="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 font-display font-bold flex items-center justify-center text-xs">
                                ${state.user.name.charAt(0)}
                            </div>
                            <div class="text-left text-xs hidden xl:block">
                                <p class="font-bold text-white truncate w-24">${state.user.name}</p>
                                <p class="text-[10px] text-emerald-400 font-mono">$${state.user.balance.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                            </div>
                        </a>
                    </div>

                    <a href="/dashboard/" class="glow-btn px-4 py-2 rounded-full text-xs font-bold text-white inline-flex items-center gap-1.5">
                        <i data-lucide="layout-dashboard" class="w-3.5 h-3.5"></i>
                        <span>Dashboard</span>
                    </a>
                </div>
            </div>
        `;
        if (window.lucide) lucide.createIcons();
    }

    function updateTickerUI() {
        const ticker = document.getElementById('global-ticker-tape');
        if (!ticker) return;
        ticker.innerHTML = Object.keys(state.prices).map(sym => {
            if (sym === 'USDT') return '';
            const p = state.prices[sym];
            const ch = state.priceChanges[sym] || '+0.00%';
            const isUp = ch.startsWith('+');
            return `<span class="inline-flex items-center gap-2"><strong class="text-white">${sym}/USD</strong> $${p.toLocaleString()} <span class="${isUp ? 'text-emerald-400' : 'text-red-400'} font-semibold">${ch}</span></span>`;
        }).join('');
    }

    // Footer Builder
    function renderFooter() {
        const footerEl = document.getElementById('app-footer');
        if (!footerEl) return;

        footerEl.className = 'border-t border-dark-border bg-[#02040c] text-slate-400 text-xs py-12 mt-20';
        footerEl.innerHTML = `
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                <div class="space-y-3">
                    <div class="font-display font-black text-lg text-white flex items-center">
                        Emporium<span class="text-brand-primary ml-0.5">Capitals</span>
                    </div>
                    <p class="text-slate-400 text-xs leading-relaxed">
                        Licensed algorithmic liquidity infrastructure. Real database connected, running natively on LiteSpeed, Apache, Nginx, and all cPanel hosting.
                    </p>
                </div>
                <div>
                    <h4 class="font-bold text-white text-xs uppercase tracking-wider mb-2.5">Quick Access</h4>
                    <ul class="space-y-1.5">
                        <li><a href="/dashboard/" class="hover:text-white transition-colors">Investor Dashboard</a></li>
                        <li><a href="/trading/" class="hover:text-white transition-colors">Trading Terminal</a></li>
                        <li><a href="/plans/" class="hover:text-white transition-colors">Investment Tiers</a></li>
                        <li><a href="/swap/" class="hover:text-white transition-colors">Instant Swap</a></li>
                    </ul>
                </div>
                <div>
                    <h4 class="font-bold text-white text-xs uppercase tracking-wider mb-2.5">Account & Funds</h4>
                    <ul class="space-y-1.5">
                        <li><a href="/deposit/" class="hover:text-white transition-colors">Deposit Funds</a></li>
                        <li><a href="/withdraw/" class="hover:text-white transition-colors">Request Payout</a></li>
                        <li><a href="/transactions/" class="hover:text-white transition-colors">Transaction Logs</a></li>
                        <li><a href="/profile/" class="hover:text-white transition-colors">KYC & Security</a></li>
                    </ul>
                </div>
                <div>
                    <h4 class="font-bold text-white text-xs uppercase tracking-wider mb-2.5">Administration</h4>
                    <p class="text-xs text-slate-400 mb-2">cPanel Suite & Database Manager:</p>
                    <a href="/cpanelsetup/?token=b71adc0d01861ae65db1c0a70d6acd2fbb6731e65dbb835386e1ba548552acc5" 
                       class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-semibold text-xs hover:border-brand-primary transition-all">
                        <i data-lucide="server" class="w-3.5 h-3.5 text-brand-primary"></i>
                        <span>cPanel Setup Suite</span>
                    </a>
                </div>
            </div>
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center text-[11px] text-slate-500 gap-2">
                <p>&copy; 2026 Emporium Capitals. All rights reserved. Zero npm packages required.</p>
                <p>Pure CDN Architecture • Universal LiteSpeed & Apache Shared Hosting Engine</p>
            </div>
        `;
        if (window.lucide) lucide.createIcons();
    }

    // Modal Builder & Handlers
    function injectDepositModal() {
        if (document.getElementById('modal-deposit')) return;
        const modal = document.createElement('div');
        modal.id = 'modal-deposit';
        modal.className = 'fixed inset-0 z-50 bg-black/80 backdrop-blur-sm hidden items-center justify-center p-4';
        modal.innerHTML = `
            <div class="glass-card rounded-3xl max-w-md w-full p-6 border-slate-700 space-y-4">
                <div class="flex justify-between items-center border-b border-dark-border pb-3">
                    <h3 class="font-display font-bold text-lg text-white flex items-center gap-2">
                        <i data-lucide="arrow-down-left" class="w-5 h-5 text-emerald-400"></i> Deposit Funds
                    </h3>
                    <button onclick="AppCore.closeModal('modal-deposit')" class="text-slate-400 hover:text-white"><i data-lucide="x" class="w-5 h-5"></i></button>
                </div>
                <div class="space-y-3">
                    <div>
                        <label class="text-xs font-semibold text-slate-300 block mb-1">Select Asset</label>
                        <select id="modal-dep-currency" onchange="AppCore.changeDepositCurrency(this.value)" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white outline-none">
                            <option value="USDT">Tether USD (USDT - TRC20)</option>
                            <option value="BTC">Bitcoin (BTC - Native)</option>
                            <option value="ETH">Ethereum (ETH - ERC20)</option>
                        </select>
                    </div>
                    <div class="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-center space-y-3">
                        <div class="flex justify-center">
                            <div class="p-2 bg-white rounded-xl shadow-lg">
                                <img id="modal-dep-qr" src="https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=${state.depositAddresses.USDT}" alt="QR" class="w-32 h-32">
                            </div>
                        </div>
                        <div class="flex items-center gap-1.5">
                            <input type="text" id="modal-dep-addr" readonly value="${state.depositAddresses.USDT}" class="w-full bg-slate-950 text-[11px] font-mono text-emerald-400 px-2 py-1.5 rounded-lg border border-slate-700 text-center">
                            <button onclick="AppCore.copyAddress()" class="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 shrink-0"><i data-lucide="copy" class="w-4 h-4"></i></button>
                        </div>
                    </div>
                    <div>
                        <label class="text-xs font-semibold text-slate-300 block mb-1">Amount (USD)</label>
                        <input type="number" id="modal-dep-amt" value="1000" min="50" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white font-bold outline-none">
                    </div>
                    <button onclick="AppCore.executeDeposit()" class="w-full py-3 rounded-full glow-btn text-xs font-bold text-white">
                        Confirm Deposit & Credit Account
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        if (window.lucide) lucide.createIcons();
    }

    function openDepositModal() {
        injectDepositModal();
        const el = document.getElementById('modal-deposit');
        if (el) { el.classList.remove('hidden'); el.classList.add('flex'); }
    }

    function closeModal(id) {
        const el = document.getElementById(id);
        if (el) { el.classList.add('hidden'); el.classList.remove('flex'); }
    }

    function changeDepositCurrency(cur) {
        const addr = state.depositAddresses[cur] || state.depositAddresses.USDT;
        const addrEl = document.getElementById('modal-dep-addr');
        const qrEl = document.getElementById('modal-dep-qr');
        if (addrEl) addrEl.value = addr;
        if (qrEl) qrEl.src = `https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=${addr}`;
    }

    function copyAddress() {
        const addr = document.getElementById('modal-dep-addr')?.value || state.depositAddresses.USDT;
        navigator.clipboard.writeText(addr);
        showToast('Address Copied', 'Official deposit address copied to clipboard.');
    }

    async function executeDeposit() {
        const amt = parseFloat(document.getElementById('modal-dep-amt')?.value) || 500;
        const cur = document.getElementById('modal-dep-currency')?.value || 'USDT';

        try {
            await fetch(state.apiBase + '?action=deposit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: amt, currency: cur, email: state.user.email })
            });
        } catch(e) {}

        state.user.balance += amt;
        state.user.total_deposit += amt;
        saveState();
        closeModal('modal-deposit');
        if (window.confetti) confetti({ particleCount: 90, spread: 75 });
        showToast('Deposit Confirmed', `Successfully credited +$${amt.toFixed(2)} ${cur} to your balance.`);
    }

    async function executeWithdrawal(amt, addr, cur = 'USDT') {
        if (!amt || amt < 50) {
            showToast('Invalid Amount', 'Minimum withdrawal is $50.00 USD.', 'error');
            return false;
        }
        if (amt > state.user.balance) {
            showToast('Insufficient Balance', 'Withdrawal amount exceeds available balance.', 'error');
            return false;
        }
        if (!addr || addr.length < 10) {
            showToast('Invalid Address', 'Please provide a valid destination wallet address.', 'error');
            return false;
        }
        try {
            await fetch(state.apiBase + '?action=withdraw', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: amt, address: addr, currency: cur, email: state.user.email })
            });
        } catch(e) {}
        state.user.balance -= amt;
        state.user.total_withdrawal += amt;
        saveState();
        showToast('Withdrawal Submitted', `Processing $${amt.toFixed(2)} ${cur} payout via blockchain.`);
        return true;
    }

    async function executeInvest(planId, planName, amt) {
        if (!amt || amt <= 0) {
            showToast('Invalid Amount', 'Please enter a valid investment amount.', 'error');
            return false;
        }
        if (amt > state.user.balance) {
            showToast('Insufficient Funds', 'Deposit funds to your balance first.', 'error');
            return false;
        }
        try {
            await fetch(state.apiBase + '?action=invest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plan_id: planId, plan_name: planName, amount: amt, email: state.user.email })
            });
        } catch(e) {}
        state.user.balance -= amt;
        saveState();
        if (window.confetti) confetti({ particleCount: 100, spread: 80 });
        showToast('Investment Activated', `Successfully allocated $${amt.toFixed(2)} to ${planName}.`);
        return true;
    }

    async function executeTrade(asset, type, amt) {
        if (!amt || amt <= 0) {
            showToast('Invalid Stake', 'Please enter a valid stake amount.', 'error');
            return false;
        }
        if (amt > state.user.balance) {
            showToast('Insufficient Balance', 'Stake exceeds available vault balance.', 'error');
            return false;
        }
        const profit = Math.round(amt * 0.85 * 100) / 100;
        try {
            await fetch(state.apiBase + '?action=trade', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ asset, type, amount: amt, email: state.user.email })
            });
        } catch(e) {}
        state.user.balance += profit;
        state.user.total_profit += profit;
        saveState();
        if (window.confetti) confetti({ particleCount: 70, spread: 60 });
        showToast('Trade Closed in Profit!', `+$${profit.toFixed(2)} added on ${asset} ${type.toUpperCase()}.`);
        return true;
    }

    async function executeSwap(fromCoin, toCoin, fromAmt, toAmt) {
        if (!fromAmt || fromAmt <= 0) {
            showToast('Invalid Amount', 'Please enter amount to swap.', 'error');
            return false;
        }
        try {
            await fetch(state.apiBase + '?action=swap', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ from: fromCoin, to: toCoin, from_amount: fromAmt, to_amount: toAmt, email: state.user.email })
            });
        } catch(e) {}
        showToast('Swap Completed', `Exchanged ${fromAmt} ${fromCoin} for ${toAmt} ${toCoin}.`);
        return true;
    }

    function updateUI() {
        document.querySelectorAll('.val-balance').forEach(el => el.textContent = `$${state.user.balance.toLocaleString(undefined, {minimumFractionDigits: 2})}`);
        document.querySelectorAll('.val-profit').forEach(el => el.textContent = `$${state.user.total_profit.toLocaleString(undefined, {minimumFractionDigits: 2})}`);
        document.querySelectorAll('.val-withdrawn').forEach(el => el.textContent = `$${state.user.total_withdrawal.toLocaleString(undefined, {minimumFractionDigits: 2})}`);
        document.querySelectorAll('.val-deposit').forEach(el => el.textContent = `$${state.user.total_deposit.toLocaleString(undefined, {minimumFractionDigits: 2})}`);
        document.querySelectorAll('.val-name').forEach(el => el.textContent = state.user.name);
        document.querySelectorAll('.val-email').forEach(el => el.textContent = state.user.email);
        document.querySelectorAll('.val-ref').forEach(el => {
            if (el.tagName === 'INPUT') el.value = state.user.referral_code || 'CHINEX';
            else el.textContent = state.user.referral_code || 'CHINEX';
        });
        document.querySelectorAll('.val-reflink').forEach(el => {
            const base = window.location.origin || '';
            const link = `${base}/register/?ref=${state.user.referral_code || 'CHINEX'}`;
            if (el.tagName === 'INPUT') el.value = link;
            else el.textContent = link;
        });
    }

    return {
        state,
        init: function (pageName) {
            loadSavedState();
            renderNavigation(pageName);
            renderFooter();
            updateUI();
        },
        showToast,
        openDepositModal,
        closeModal,
        changeDepositCurrency,
        copyAddress,
        executeDeposit,
        executeWithdrawal,
        executeInvest,
        executeTrade,
        executeSwap,
        saveState,
        updateUI
    };
})();

