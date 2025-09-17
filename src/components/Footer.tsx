'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFacebookF,
  faTwitter,
  faInstagram,
  faYoutube,
} from '@fortawesome/free-brands-svg-icons';
import Image from 'next/image';
import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="bg-gray-100 text-gray-700">
      <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Logo & About */}
        <div>
  <Link href="/">
    <Image
      src="/images/yano-logo.png"
      alt="Yano School Logo"
      className="h-16 w-auto object-contain"
      width={160}
      height={64}
      priority
    />
  </Link>
  <p className="text-sm mt-2">
    Nurturing future leaders through education, values, and opportunity.
  </p>
</div>


        {/* Secondary Navigation */}
        <div>
          <h4 className="text-red-400 font-semibold mb-4">Explore</h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/programs#clubs" className="hover:text-red-500 transition">
                Clubs & Activities
              </Link>
            </li>
            <li>
              <Link href="/programs#school-calendar" className="hover:text-red-500 transition">
                School Calendar
              </Link>
            </li>
            <li>
              <Link href="/about#uniform" className="hover:text-red-500 transition">
                Uniform Guidelines
              </Link>
            </li>
            <li>
              <Link href="/programs#school-calendar" className="hover:text-red-500 transition">
                Holiday Schedule
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* CTA Section: Newsletter + Socials */}
      <div className=" py-6">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Newsletter Form */}
          <form className="flex flex-col sm:flex-row items-center w-full md:w-auto gap-3">
            <input
              type="email"
              placeholder="Your email address"
              className="px-4 py-2 rounded border border-gray-300 text-gray-700 focus:outline-red-400 w-full sm:w-auto"
            />
            <button
              type="submit"
              className="bg-red-400 hover:bg-red-500 text-white px-5 py-2 rounded transition"
            >
              Subscribe
            </button>
          </form>

          {/* Social Icons */}
          <div className="flex space-x-4 text-xl mt-4 md:mt-0">
            <a
              href="#"
              aria-label="Facebook"
              className="flex justify-center items-center border border-black w-10 h-10 rounded-full hover:text-blue-600 transition"
            >
              <FontAwesomeIcon icon={faFacebookF} />
            </a>
            <a
              href="#"
              aria-label="Twitter"
              className="flex justify-center items-center border border-black w-10 h-10 rounded-full hover:text-sky-500 transition"
            >
              <FontAwesomeIcon icon={faTwitter} />
            </a>
            <a
              href="#"
              aria-label="Instagram"
              className="flex justify-center items-center border border-black w-10 h-10 rounded-full hover:text-pink-500 transition"
            >
              <FontAwesomeIcon icon={faInstagram} />
            </a>
            <a
              href="#"
              aria-label="YouTube"
              className="flex justify-center items-center border border-black w-10 h-10 rounded-full hover:text-red-600 transition"
            >
              <FontAwesomeIcon icon={faYoutube} />
            </a>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="text-center text-xs text-gray-500 py-4 border-t border-gray-200">
        &copy; {new Date().getFullYear()} Yano School. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
