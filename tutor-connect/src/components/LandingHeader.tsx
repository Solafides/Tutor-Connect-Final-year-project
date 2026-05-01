'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function LandingHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <nav className="mx-auto flex max-w-7xl items-center justify-between p-4 sm:p-6 lg:px-8" aria-label="Global">
        <div className="flex lg:flex-1">
          <a href="/" className="-m-1.5 p-1.5 flex items-center gap-2">
            <span className="sr-only">Tutor Connect</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-sm">
              <span className="material-symbols-outlined text-2xl">school</span>
            </div>
            <span className="text-xl font-black text-slate-900 tracking-tight">Tutor Connect</span>
          </a>
        </div>
        
        {/* Mobile menu button */}
        <div className="flex lg:hidden">
          <button 
            type="button" 
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-slate-700"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <span className="sr-only">Open main menu</span>
            <span className="material-symbols-outlined text-3xl">{isMenuOpen ? 'close' : 'menu'}</span>
          </button>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex lg:gap-x-10">
          <a href="#how-it-works" className="text-sm font-bold leading-6 text-slate-600 hover:text-primary transition-colors">How it works</a>
          <a href="#find-tutor" className="text-sm font-bold leading-6 text-slate-600 hover:text-primary transition-colors">Find a Tutor</a>
          <a href="#pricing" className="text-sm font-bold leading-6 text-slate-600 hover:text-primary transition-colors">Pricing</a>
        </div>
        
        {/* Desktop actions */}
        <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:items-center lg:gap-6">
          <Link href="/login" className="text-sm font-bold leading-6 text-slate-700 hover:text-primary transition-colors">
            Log in
          </Link>
          <Link href="/register" className="justify-center items-center rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition-all hover:-translate-y-0.5">
            Get Started <span aria-hidden="true" className="ml-2">&rarr;</span>
          </Link>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="lg:hidden" role="dialog" aria-modal="true">
          <div className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)}></div>
          <div className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-slate-900/10 shadow-2xl">
            <div className="flex items-center justify-between">
              <a href="/" className="-m-1.5 p-1.5 flex items-center gap-2">
                <span className="sr-only">Tutor Connect</span>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-sm">
                  <span className="material-symbols-outlined text-2xl">school</span>
                </div>
                <span className="text-xl font-black text-slate-900 tracking-tight">Tutor Connect</span>
              </a>
              <button 
                type="button" 
                className="-m-2.5 rounded-md p-2.5 text-slate-700"
                onClick={() => setIsMenuOpen(false)}
              >
                <span className="sr-only">Close menu</span>
                <span className="material-symbols-outlined text-3xl">close</span>
              </button>
            </div>
            <div className="mt-6 flow-root">
              <div className="-my-6 divide-y divide-slate-500/10">
                <div className="space-y-2 py-6">
                  <a href="#how-it-works" onClick={() => setIsMenuOpen(false)} className="-mx-3 block rounded-lg px-3 py-2 text-base font-bold leading-7 text-slate-900 hover:bg-slate-50">How it works</a>
                  <a href="#find-tutor" onClick={() => setIsMenuOpen(false)} className="-mx-3 block rounded-lg px-3 py-2 text-base font-bold leading-7 text-slate-900 hover:bg-slate-50">Find a Tutor</a>
                  <a href="#pricing" onClick={() => setIsMenuOpen(false)} className="-mx-3 block rounded-lg px-3 py-2 text-base font-bold leading-7 text-slate-900 hover:bg-slate-50">Pricing</a>
                </div>
                <div className="py-6 flex flex-col gap-4">
                  <Link href="/login" onClick={() => setIsMenuOpen(false)} className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-bold leading-7 text-slate-900 hover:bg-slate-50">
                    Log in
                  </Link>
                  <Link href="/register" onClick={() => setIsMenuOpen(false)} className="-mx-3 flex w-full justify-center rounded-xl bg-primary px-3 py-3 text-base font-bold text-white hover:bg-blue-700 shadow-md">
                    Get Started
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
