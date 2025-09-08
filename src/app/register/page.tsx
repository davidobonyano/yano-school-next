"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';

export default function StudentRegister() {
  const router = useRouter();
  const [studentId, setStudentId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [hadEmailFromLookup, setHadEmailFromLookup] = useState(false);
  const [classLevel, setClassLevel] = useState('');
  const [stream, setStream] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isExistingStudent, setIsExistingStudent] = useState(false);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);

  useEffect(() => {
    const lookup = async () => {
      if (!studentId.trim()) {
        setName('');
        setEmail('');
        setHadEmailFromLookup(false);
        setIsExistingStudent(false);
        return;
      }
      try {
        setIsLookingUp(true);
        const res = await fetch('/api/students/lookup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studentId: studentId.trim().toUpperCase() }),
        });
        const data = await res.json();
        if (data.found) {
          setName(data.student.full_name || '');
          setEmail(data.student.email || '');
          setHadEmailFromLookup(Boolean(data.student.email));
          setClassLevel(data.student.class_level || '');
          setIsExistingStudent(true);
          setAlreadyRegistered(Boolean(data.registered));
        } else {
          setName('');
          setEmail('');
          setHadEmailFromLookup(false);
          setClassLevel('');
          setIsExistingStudent(false);
          setAlreadyRegistered(false);
        }
      } catch (e) {
        setIsExistingStudent(false);
        setAlreadyRegistered(false);
      } finally {
        setIsLookingUp(false);
      }
    };
    lookup();
  }, [studentId]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    try {
      if (password !== confirmPassword) {
        setMessage('Passwords do not match');
        return;
      }
      const res = await fetch('/api/students/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: studentId.trim().toUpperCase(), password, stream: stream || null, classLevel: classLevel || null, email: email || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || 'Registration failed');
        return;
      }
      setMessage('Password set successfully. Redirecting to login...');
      setTimeout(() => router.push('/login'), 1000);
    } catch (err: any) {
      setMessage(err?.message || 'Registration error');
    }
  };

  return (
    <div className="max-w-md mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Student Registration</h1>
      <form onSubmit={handleRegister} className="space-y-4">
        <input
          type="text"
          placeholder="Student ID (assigned)"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value.toUpperCase())}
          className="w-full p-2 border rounded uppercase"
          required
        />
        <div className="flex items-center gap-2 min-h-[1.25rem]">
          {isLookingUp && (
            <>
              <span className="inline-block w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-gray-600">Checking student record…</span>
            </>
          )}
          {!isLookingUp && alreadyRegistered && (
            <p className="text-sm text-red-600">This student has already registered.</p>
          )}
        </div>
        <input
          type="text"
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-2 border rounded"
          readOnly
        />
        <input
          type="text"
          placeholder="Class Level (e.g., KG, JSS1, SS1)"
          value={classLevel}
          onChange={(e) => setClassLevel(e.target.value)}
          className="w-full p-2 border rounded"
          readOnly
        />
        {/* Stream only applies for SS levels */}
        <select
          value={stream}
          onChange={(e) => setStream(e.target.value)}
          className="w-full p-2 border rounded"
          disabled={!/^SS/i.test(classLevel || '')}
        >
          <option value="">Select Stream (SS only)</option>
          <option value="Science">Science</option>
          <option value="Arts">Arts</option>
          <option value="Commercial">Commercial</option>
        </select>
        <input
          type="email"
          placeholder="Email (for recovery only)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 border rounded"
          readOnly={hadEmailFromLookup}
          required={Boolean(isExistingStudent && !hadEmailFromLookup)}
        />
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Create Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 pr-10 border rounded"
            required
          />
          <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500" onClick={() => setShowPassword(!showPassword)}>
            <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
          </button>
        </div>
        <div className="relative">
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full p-2 pr-10 border rounded"
            required
          />
          <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
            <FontAwesomeIcon icon={showConfirmPassword ? faEyeSlash : faEye} />
          </button>
        </div>
        <button type="submit" disabled={isLookingUp} className="w-full bg-blue-900 text-white py-2 rounded disabled:opacity-60">
          Set Password
        </button>
      </form>
      {message && <p className="mt-4 text-center">{message}</p>}
    </div>
  );
}
