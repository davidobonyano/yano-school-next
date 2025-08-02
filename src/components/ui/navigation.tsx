'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { GraduationCap, User, LogIn } from 'lucide-react';

import { Button } from '@/components/ui/button';

export default function Navigation() {
  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2">
              <GraduationCap className="w-8 h-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">Yano School</span>
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                Home
              </Button>
            </Link>
            <Link href="/about">
              <Button variant="ghost" size="sm">
                About
              </Button>
            </Link>
            <Link href="/programs">
              <Button variant="ghost" size="sm">
                Programs
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="ghost" size="sm">
                Contact
              </Button>
            </Link>
            
            <div className="flex items-center space-x-2 ml-4">
              <Link href="/auth/login">
                <Button variant="outline" size="sm" className="flex items-center space-x-2">
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>Sign Up</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}