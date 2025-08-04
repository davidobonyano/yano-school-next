'use client';

import { useState, useEffect } from 'react';
import { mockUsers, User } from '@/lib/mock-data';

export default function StudentRegister() {
  const [studentId, setStudentId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isExistingStudent, setIsExistingStudent] = useState(false);

  useEffect(() => {
    if (studentId.trim()) {
      const existing = mockUsers.students.find((s) => s.id === studentId.trim());
      if (existing) {
        setName(existing.name);
        setEmail(existing.email);
        setIsExistingStudent(true);
      } else {
        setName('');
        setEmail('');
        setIsExistingStudent(false);
      }
    } else {
      setName('');
      setEmail('');
      setIsExistingStudent(false);
    }
  }, [studentId]);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();

    const existing = mockUsers.students.find(
      (u) => u.email === email.trim() || u.id === studentId.trim()
    );

    if (isExistingStudent && existing?.password) {
      setMessage('This student already has an account.');
      return;
    }

    const newStudent: User = {
      id: studentId.trim() || `stu${Date.now()}`,
      name: name.trim(),
      email: email.trim(),
      password,
      status: isExistingStudent ? 'active' : 'processing',
    };

    if (isExistingStudent) {
      // Update password only
      existing!.password = password;
      existing!.status = 'active';
      setMessage(`Welcome back, ${existing!.name}! Your account has been activated.`);
    } else {
      mockUsers.students.push(newStudent);
      setMessage(`Registration successful! Await admin approval, ${newStudent.name}.`);
    }

    setStudentId('');
    setName('');
    setEmail('');
    setPassword('');
  };

  return (
    <div className="max-w-md mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Student Registration</h1>
      <form onSubmit={handleRegister} className="space-y-4">
        <input
          type="text"
          placeholder="Student ID (if given)"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          className="w-full p-2 border rounded"
        />
        <input
          type="text"
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-2 border rounded"
          required
          readOnly={isExistingStudent}
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 border rounded"
          required
          readOnly={isExistingStudent}
        />
        <input
          type="password"
          placeholder="Create Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
        <button type="submit" className="w-full bg-blue-900 text-white py-2 rounded">
          Register
        </button>
      </form>
      {message && <p className="mt-4 text-center">{message}</p>}
    </div>
  );
}
