import React from 'react';

export default function LandingPage() {
  return (
    <>
      <section className="relative overflow-hidden bg-background-light py-12 md:py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-y-12 lg:grid-cols-2 lg:gap-x-16 lg:items-center">
            <div className="max-w-2xl lg:max-w-none flex flex-col items-start text-left">
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-primary ring-1 ring-inset ring-blue-700/10 mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                Start learning today
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl mb-6 leading-[1.15]">
                Find the perfect <br className="hidden lg:block" />
                <span className="text-primary relative inline-block">
                  tutor for you.
                  <svg className="absolute w-full h-2 -bottom-0 left-0 text-blue-200 -z-10 opacity-60" viewBox="0 0 100 10" preserveAspectRatio="none"><path d="M0 5 Q 50 10 100 5" fill="none" stroke="currentColor" strokeWidth="8"></path></svg>
                </span>
              </h1>
              <p className="text-lg leading-relaxed text-slate-600 mb-8 max-w-lg">
                Connect with expert tutors for 1-on-1 lessons tailored to your specific needs. Whether you need help with math, science, or learning a new language.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mb-10 w-full sm:w-auto">
                <a href="/search" className="inline-flex justify-center items-center rounded-xl bg-primary px-8 py-3.5 text-base font-bold text-white shadow-lg shadow-blue-500/25 hover:bg-primary-dark transition-all hover:-translate-y-0.5 w-full sm:w-auto">
                  Find a Tutor
                </a>
                <a href="/register" className="inline-flex justify-center items-center rounded-xl bg-white px-8 py-3.5 text-base font-bold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-200 hover:bg-slate-50 hover:text-primary transition-all hover:-translate-y-0.5 w-full sm:w-auto">
                  Become a Tutor
                </a>
              </div>
              <div className="flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-slate-200 pt-8 w-full">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-green-500 fill-1">check_circle</span>
                  <span className="text-sm font-semibold text-slate-600">Verified Tutors</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-green-500 fill-1">check_circle</span>
                  <span className="text-sm font-semibold text-slate-600">Secure Payment</span>
                </div>
              </div>
            </div>
            <div className="relative lg:h-full flex justify-center lg:justify-end">
              <div className="relative w-full max-w-[550px] aspect-[4/3] lg:aspect-auto lg:h-[600px] rounded-2xl bg-slate-100 shadow-2xl overflow-hidden group">
                <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1544717305-2782549b5136?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1000&q=80")' }}></div>
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent"></div>
                <div className="absolute bottom-6 left-6 md:left-8 bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-xl border border-slate-100 flex items-center gap-4 animate-bounce" style={{ animationDuration: '3s' }}>
                  <div className="flex -space-x-3">
                    <img className="h-10 w-10 rounded-full border-2 border-white object-cover" src="https://i.pravatar.cc/150?u=1" alt="tutor1" />
                    <img className="h-10 w-10 rounded-full border-2 border-white object-cover" src="https://i.pravatar.cc/150?u=2" alt="tutor2" />
                    <img className="h-10 w-10 rounded-full border-2 border-white object-cover" src="https://i.pravatar.cc/150?u=3" alt="tutor3" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">5k+ Tutors</p>
                    <p className="text-xs text-slate-500">Available now</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Why choose Tutor Connect?</h2>
            <p className="mt-4 text-lg text-slate-500 leading-relaxed">
              We prioritize your safety and education quality above all else with our robust platform features designed for modern learning.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: 'verified_user', title: 'Verified Tutors', desc: 'Every tutor passes a comprehensive background check and rigorous skill assessment before joining our network.' },
              { icon: 'lock', title: 'Secure Payments', desc: 'Pay per lesson with confidence using our encrypted and protected payment gateway. Funds are held safely.' },
              { icon: 'videocam', title: 'Online & In-person', desc: 'Flexibility is key. Choose to learn from the comfort of your home virtually or meet at a safe public location.' },
            ].map((feature, idx) => (
              <div key={idx} className="group relative rounded-2xl border border-slate-100 bg-background-light p-8 hover:bg-white hover:shadow-xl hover:shadow-blue-500/5 hover:border-blue-100 transition-all duration-300">
                <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-blue-100 text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                  <span className="material-symbols-outlined text-3xl">{feature.icon}</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      <footer className="bg-white border-t border-slate-200">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
                <span className="material-symbols-outlined text-xl">school</span>
              </div>
              <span className="text-lg font-bold text-slate-900">Tutor Connect</span>
            </div>
            <div className="flex flex-wrap justify-center gap-x-8 gap-y-4">
              {['Find a Tutor', 'Become a Tutor', 'About Us', 'Support', 'Privacy', 'Terms'].map(link => (
                <a key={link} href="#" className="text-sm font-medium text-slate-500 hover:text-primary transition-colors">{link}</a>
              ))}
            </div>
          </div>
          <div className="mt-8 border-t border-slate-100 pt-8 text-center">
            <p className="text-xs text-slate-500">© 2024 Tutor Connect. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </>
  );
}
