import React from 'react';
import Navbar from './Navbar';
import Hero from './Hero';
import Features from './Features';
import Pricing from './Pricing';
import Footer from './Footer';

const Landing = () => {
  return (
    <div className="min-h-screen bg-[#F5F5F7] dark:bg-[#000000] font-sans selection:bg-blue-500/30">
      <Navbar />
      <Hero />
      <Features />
      <Pricing />
      <Footer />
    </div>
  );
};

export default Landing;