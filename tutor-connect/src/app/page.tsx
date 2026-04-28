import React from 'react';
import { prisma } from '@/lib/db';

export default async function LandingPage() {
    const featuredTutors = await prisma.tutorProfile.findMany({
        take: 4,
        include: {
            subjects: {
                include: {
                    subject: true,
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    });
  return (
    <>
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
          <div className="hidden lg:flex lg:gap-x-10">
            <a href="#how-it-works" className="text-sm font-bold leading-6 text-slate-600 hover:text-primary transition-colors">How it works</a>
            <a href="#find-tutor" className="text-sm font-bold leading-6 text-slate-600 hover:text-primary transition-colors">Find a Tutor</a>
            <a href="#pricing" className="text-sm font-bold leading-6 text-slate-600 hover:text-primary transition-colors">Pricing</a>
          </div>
          <div className="flex flex-1 justify-end items-center gap-6">
            <a href="/login" className="text-sm font-bold leading-6 text-slate-700 hover:text-primary transition-colors">
              Log in
            </a>
            <a href="/register" className="hidden sm:inline-flex justify-center items-center rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition-all hover:-translate-y-0.5">
              Get Started <span aria-hidden="true" className="ml-2">&rarr;</span>
            </a>
          </div>
        </nav>
      </header>

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
                <a href="#find-tutor" className="inline-flex justify-center items-center rounded-xl bg-primary px-8 py-3.5 text-base font-bold text-white shadow-lg shadow-blue-500/25 hover:bg-primary-dark transition-all hover:-translate-y-0.5 w-full sm:w-auto">
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

      <section id="find-tutor" className="py-24 bg-white border-t border-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Meet our top tutors</h2>
            <p className="mt-4 text-lg text-slate-500 leading-relaxed">
              Connect with verified and experienced tutors ready to help you succeed.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
             {featuredTutors.length > 0 ? featuredTutors.map((tutor) => (
                <div key={tutor.id} className="group p-6 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 flex flex-col items-center text-center">
                  <div className="h-24 w-24 rounded-full bg-white border-4 border-slate-100 overflow-hidden mb-4 relative shadow-sm group-hover:border-primary/20 transition-colors">
                    {tutor.avatar ? (
                        <img src={tutor.avatar} alt={tutor.fullName} className="object-cover w-full h-full" />
                    ) : (
                        <div className="w-full h-full bg-blue-50 flex items-center justify-center text-primary text-3xl font-bold">
                            {tutor.fullName.charAt(0)}
                        </div>
                    )}
                  </div>
                  <h3 className="font-bold text-slate-900 group-hover:text-primary transition-colors text-lg">{tutor.fullName}</h3>
                  <p className="text-sm text-slate-500 mt-2 line-clamp-2">
                    {tutor.subjects.length > 0 ? tutor.subjects.map(s => s.subject.name).join(', ') : 'General Tutor'}
                  </p>
                  <div className="mt-6 pt-4 border-t border-slate-200 w-full flex items-center justify-between">
                      <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-md">
                          <span className="material-symbols-outlined text-amber-500 text-sm">star</span>
                          <span className="text-sm font-bold text-amber-700">{tutor.rating ? Number(tutor.rating).toFixed(1) : 'New'}</span>
                      </div>
                      <span className="text-sm font-bold text-primary bg-blue-50 px-2 py-1 rounded-md">{Number(tutor.hourlyRate)} ETB/hr</span>
                  </div>
                </div>
             )) : (
                 <div className="col-span-full py-12 text-center text-slate-500 bg-slate-50 rounded-2xl border border-slate-100">
                     <span className="material-symbols-outlined text-4xl mb-2 text-slate-400">group_off</span>
                     <p>New tutors are joining soon. Please check back later!</p>
                 </div>
             )}
          </div>
          <div className="mt-12 text-center">
            <a href="/register" className="inline-flex justify-center items-center rounded-xl bg-primary px-8 py-3.5 text-sm font-bold text-white shadow-sm hover:bg-primary-dark transition-colors">
              View all tutors
            </a>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-24 bg-white">
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
      
      <section id="pricing" className="py-24 bg-background-light">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Simple, transparent pricing</h2>
            <p className="mt-4 text-lg text-slate-500 leading-relaxed">
              No hidden fees or complex subscriptions. Pay only for the lessons you take.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <h3 className="text-2xl font-bold text-slate-900 mb-2">For Students</h3>
              <p className="text-slate-500 mb-6">Pay per lesson based on the tutor's rate</p>
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-4xl font-extrabold text-slate-900">Free</span>
                <span className="text-slate-500">to join</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-green-500">check_circle</span>
                  <span className="text-slate-600">Browse all verified tutors</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-green-500">check_circle</span>
                  <span className="text-slate-600">Secure escrow payments</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-green-500">check_circle</span>
                  <span className="text-slate-600">Pay only your tutor's hourly rate</span>
                </li>
              </ul>
              <a href="/register" className="block w-full text-center rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-primary-dark transition-colors">Sign up as Student</a>
            </div>
            <div className="rounded-2xl border-2 border-primary bg-white p-8 shadow-md relative">
              <div className="absolute top-0 right-8 -translate-y-1/2 rounded-full bg-primary px-3 py-1 text-xs font-bold text-white uppercase tracking-wider">
                Most Popular
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">For Tutors</h3>
              <p className="text-slate-500 mb-6">Set your own rates and schedule</p>
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-4xl font-extrabold text-slate-900">10%</span>
                <span className="text-slate-500">platform fee</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-green-500">check_circle</span>
                  <span className="text-slate-600">Keep 90% of your earnings</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-green-500">check_circle</span>
                  <span className="text-slate-600">Guaranteed payments via escrow</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-green-500">check_circle</span>
                  <span className="text-slate-600">Free profile visibility</span>
                </li>
              </ul>
              <a href="/register" className="block w-full text-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white shadow-sm hover:bg-slate-800 transition-colors">Apply as Tutor</a>
            </div>
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
            <p className="text-xs text-slate-500">&copy; 2024 Tutor Connect. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </>
  );
}
