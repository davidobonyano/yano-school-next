import Link from 'next/link';
import Image from 'next/image';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-green-50 via-white to-blue-50 text-center px-6 py-16">
      <Image
        src="/images/yano-logo.png"
        alt="Yano School Logo"
        width={180}
        height={80}
        className="mb-6"
        style={{ height: 'auto' }}
        priority
      />

      <h1 className="text-5xl font-bold text-blue-900 mb-4">Oops! Page Not Found</h1>
      <p className="text-gray-600 text-lg mb-8 max-w-xl">
        The page you are looking for does not exist or may have been moved. let&#39;s guide you back home.
      </p>

      <Link
        href="/"
        className="bg-blue-900 text-white px-6 py-3 rounded-xl shadow hover:bg-blue-700 transition duration-300"
      >
        Go to Homepage
      </Link>

      <div className="mt-12">
        <Image
          src="/images/hero.jpg"
          alt="Students at Yano School"
          width={800}
          height={400}
          className="rounded-xl shadow-md object-cover max-w-full"
        />
      </div>
    </div>
  );
}
