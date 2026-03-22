'use client';

import Link from 'next/link';
import { Heart, Hospital, ShoppingCart, Home, Car, PawPrint, ArrowRight, CheckCircle, Users, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

const services = [
  { name: 'Hospital Visit', icon: Hospital, description: 'Accompany your loved ones to hospitals', color: 'text-red-500', bg: 'bg-red-500/10' },
  { name: 'Elderly Care', icon: Heart, description: 'Compassionate care for elderly family', color: 'text-pink-500', bg: 'bg-pink-500/10' },
  { name: 'Errands', icon: ShoppingCart, description: 'Grocery shopping, bill payments & more', color: 'text-accent', bg: 'bg-accent/10' },
  { name: 'Home Assistance', icon: Home, description: 'Help with household tasks', color: 'text-primary', bg: 'bg-primary/10' },
  { name: 'Transportation', icon: Car, description: 'Pickup, drop & transport services', color: 'text-purple', bg: 'bg-purple/10' },
  { name: 'Pet Care', icon: PawPrint, description: 'Walking, feeding & grooming', color: 'text-warning', bg: 'bg-warning/10' },
];

const steps = [
  { step: '1', title: 'Post a Task', desc: 'Describe what you need help with, set the date and location.' },
  { step: '2', title: 'Get Matched', desc: 'Browse verified workers or let us match you with the best fit.' },
  { step: '3', title: 'Get It Done', desc: 'Your helper arrives on time. Pay after the job is completed.' },
];

const stats = [
  { label: 'Verified Workers', value: '500+', icon: Users },
  { label: 'Tasks Completed', value: '10,000+', icon: CheckCircle },
  { label: 'Trusted & Safe', value: '100%', icon: Shield },
];

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-50px' },
  transition: { duration: 0.5 },
};

const stagger = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
};

export default function LandingPage() {
  return (
    <div className="bg-surface">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-dark to-purple opacity-95" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCBmaWxsPSJ1cmwoI2dyaWQpIiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIi8+PC9zdmc+')] opacity-40" />
        <div className="relative max-w-7xl mx-auto px-4 py-24 sm:py-32 lg:py-40">
          <motion.div
            className="text-center max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white/90 text-sm
              font-medium px-4 py-1.5 rounded-full mb-6 border border-white/20">
              <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
              Trusted by thousands of families
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Find Trusted Helpers{' '}
              <br className="hidden sm:block" />
              for Any Task
            </h1>
            <p className="text-lg sm:text-xl text-white/80 mb-10 max-w-2xl mx-auto leading-relaxed">
              RentAMan connects you with verified workers for hospital visits,
              elderly care, errands, and more. Book a helper in minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/register">
                <Button size="lg" className="bg-white text-primary hover:bg-white/90 shadow-elevated">
                  Get Started Free
                  <ArrowRight size={18} />
                </Button>
              </Link>
              <Link href="/workers">
                <Button size="lg" variant="ghost" className="text-white border border-white/30 hover:bg-white/10">
                  Browse Workers
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Stats bar */}
          <motion.div
            className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            {stats.map((stat) => (
              <div key={stat.label} className="flex items-center gap-3 text-white/90">
                <stat.icon size={20} className="text-accent" />
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-white/60">{stat.label}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-7xl mx-auto px-4 py-20 lg:py-28">
        <motion.div className="text-center mb-16" {...fadeUp}>
          <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Simple Process</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-text-primary">How It Works</h2>
        </motion.div>
        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((item, i) => (
            <motion.div
              key={item.step}
              className="text-center"
              {...stagger}
              transition={{ delay: i * 0.15, duration: 0.5 }}
            >
              <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center
                text-xl font-bold mx-auto mb-5">
                {item.step}
              </div>
              <h3 className="text-xl font-semibold text-text-primary mb-2">{item.title}</h3>
              <p className="text-text-secondary leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Services */}
      <section className="bg-surface-secondary py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div className="text-center mb-16" {...fadeUp}>
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">What We Offer</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-text-primary">Our Services</h2>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {services.map((service, i) => (
              <motion.div
                key={service.name}
                {...stagger}
                transition={{ delay: i * 0.1, duration: 0.5 }}
              >
                <Card hoverable padding="md" className="h-full">
                  <div className={`w-12 h-12 ${service.bg} rounded-xl flex items-center justify-center mb-4`}>
                    <service.icon className={service.color} size={24} />
                  </div>
                  <h3 className="text-lg font-semibold text-text-primary mb-1.5">{service.name}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">{service.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 py-20 lg:py-28">
        <motion.div {...fadeUp}>
          <Card variant="default" padding="lg" className="text-center bg-gradient-to-br from-primary/5 to-accent/5">
            <h2 className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">Ready to Get Started?</h2>
            <p className="text-text-secondary mb-8 max-w-xl mx-auto leading-relaxed">
              Whether you need help for your parents, yourself, or want to earn as a helper — join RentAMan today.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/register">
                <Button size="lg">
                  Book a Helper
                  <ArrowRight size={18} />
                </Button>
              </Link>
              <Link href="/register">
                <Button size="lg" variant="outline">
                  Become a Helper
                </Button>
              </Link>
            </div>
          </Card>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-surface py-10">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-xs">R</span>
            </div>
            <span className="font-bold text-text-primary">RentA<span className="text-primary">Man</span></span>
          </div>
          <p className="text-sm text-text-muted">Connecting people with trusted helpers since 2026.</p>
        </div>
      </footer>
    </div>
  );
}
