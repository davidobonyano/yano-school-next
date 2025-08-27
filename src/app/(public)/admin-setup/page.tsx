'use client';

import { useEffect, useState } from 'react';

type Admin = {
	id: string;
	name: string;
	email: string;
	is_active: boolean | null;
	created_at?: string | null;
	updated_at?: string | null;
};

export default function AdminSetupPage() {
	const [admins, setAdmins] = useState<Admin[]>([]);
	const [loading, setLoading] = useState(true);
	const [message, setMessage] = useState<string | null>(null);

	const [registerName, setRegisterName] = useState('');
	const [registerEmail, setRegisterEmail] = useState('');
	const [registerPassword, setRegisterPassword] = useState('');

	const [loginEmail, setLoginEmail] = useState('');
	const [loginPassword, setLoginPassword] = useState('');

	useEffect(() => {
		fetchAdmins();
	}, []);

	async function fetchAdmins() {
		try {
			setLoading(true);
			const res = await fetch('/api/admins');
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || 'Failed to load admins');
			setAdmins(data.admins || []);
		} catch (err: any) {
			setMessage(err.message || 'Failed to load admins');
		} finally {
			setLoading(false);
		}
	}

	async function handleRegister(e: React.FormEvent) {
		e.preventDefault();
		setMessage(null);
		try {
			const res = await fetch('/api/admins/set-password', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name: registerName, email: registerEmail, password: registerPassword }),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || 'Failed to register');
			setMessage('Admin created/updated successfully');
			setRegisterName('');
			setRegisterEmail('');
			setRegisterPassword('');
			fetchAdmins();
		} catch (err: any) {
			setMessage(err.message || 'Failed to register');
		}
	}

	async function handleLogin(e: React.FormEvent) {
		e.preventDefault();
		setMessage(null);
		try {
			const res = await fetch('/api/admins/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: loginEmail, password: loginPassword }),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || 'Login failed');
			setMessage(`Welcome, ${data.admin.name}`);
			setLoginEmail('');
			setLoginPassword('');
		} catch (err: any) {
			setMessage(err.message || 'Login failed');
		}
	}

	return (
		<div className="max-w-4xl mx-auto p-6 space-y-8">
			<h1 className="text-2xl font-bold">Admin Setup</h1>
			<p className="text-gray-600">Temporary page to register an admin, log in, and view active admins. Remove when migrating to Supabase Auth.</p>

			{message && (
				<div className="p-3 rounded border text-sm" style={{ background: '#f0f9ff', borderColor: '#bae6fd', color: '#075985' }}>
					{message}
				</div>
			)}

			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<form onSubmit={handleRegister} className="border rounded p-4 space-y-3">
					<h2 className="font-semibold">Register / Set Admin Password</h2>
					<input value={registerName} onChange={e => setRegisterName(e.target.value)} placeholder="Name" className="w-full border rounded px-3 py-2" />
					<input value={registerEmail} onChange={e => setRegisterEmail(e.target.value)} placeholder="Email" type="email" className="w-full border rounded px-3 py-2" />
					<input value={registerPassword} onChange={e => setRegisterPassword(e.target.value)} placeholder="Password" type="password" className="w-full border rounded px-3 py-2" />
					<button className="bg-blue-600 text-white px-4 py-2 rounded">Save</button>
				</form>

				<form onSubmit={handleLogin} className="border rounded p-4 space-y-3">
					<h2 className="font-semibold">Login as Admin</h2>
					<input value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="Email" type="email" className="w-full border rounded px-3 py-2" />
					<input value={loginPassword} onChange={e => setLoginPassword(e.target.value)} placeholder="Password" type="password" className="w-full border rounded px-3 py-2" />
					<button className="bg-green-600 text-white px-4 py-2 rounded">Login</button>
				</form>
			</div>

			<div className="border rounded">
				<div className="p-4 border-b font-semibold">Active Admins</div>
				{loading ? (
					<div className="p-4">Loading...</div>
				) : (
					<table className="w-full text-sm">
						<thead>
							<tr className="text-left">
								<th className="p-3">Name</th>
								<th className="p-3">Email</th>
								<th className="p-3">Status</th>
								<th className="p-3">Created</th>
							</tr>
						</thead>
						<tbody>
							{admins.filter(a => a.is_active !== false).map(a => (
								<tr key={a.id} className="border-t">
									<td className="p-3">{a.name}</td>
									<td className="p-3">{a.email}</td>
									<td className="p-3">{a.is_active ? 'Active' : 'Inactive'}</td>
									<td className="p-3">{a.created_at ? new Date(a.created_at).toLocaleString() : '-'}</td>
								</tr>
							))}
						</tbody>
					</table>
				)}
			</div>
		</div>
	);
}
