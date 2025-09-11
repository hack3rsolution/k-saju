'use client';

import Link from 'next/link';
import { Button, Card, SectionHeader } from '@k-saju/ui';

export const HomeHero = () => {
  const handleGetStarted = () => {
    alert('Getting started with K-Saju!');
  };

  const handleLearnMore = () => {
    alert('Learn more about our features!');
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <SectionHeader
        title="Welcome to K-Saju"
        subtitle="A modern monorepo built with Next.js, React Native, and shared components"
        align="center"
        className="mb-12"
      />

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <Card padding="lg" shadow="lg">
          <h3 className="text-xl font-semibold mb-4">Web Application</h3>
          <p className="text-gray-600 mb-6">
            Built with Next.js 14 and the App Router, featuring modern React patterns
            and optimized performance.
          </p>
          <Button onClick={handleGetStarted} className="w-full">
            Get Started
          </Button>
        </Card>

        <Card padding="lg" shadow="lg">
          <h3 className="text-xl font-semibold mb-4">Mobile Application</h3>
          <p className="text-gray-600 mb-6">
            Cross-platform mobile app built with Expo and React Native, sharing
            components with the web app.
          </p>
          <Button 
            onClick={handleLearnMore} 
            variant="secondary" 
            className="w-full"
          >
            Learn More
          </Button>
        </Card>
      </div>

      <div className="text-center mt-12">
        <Card padding="lg" className="inline-block">
          <p className="text-gray-700 mb-4">
            Shared UI components work seamlessly across web and mobile platforms
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/about">
              <Button variant="secondary">
                Learn About Us
              </Button>
            </Link>
            <Link href="/pricing">
              <Button variant="secondary">
                View Pricing
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};
