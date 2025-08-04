"use client";

import React, { useState } from "react";
import {
  mockUsers,
  getStudentPayments,
  type Payment,
} from "@/lib/enhanced-mock-data";

export default function PaymentsPage() {
  const student = mockUsers.students[0]; // Replace with real auth data
  const allPayments = getStudentPayments(student.id);

  const [selectedTerm, setSelectedTerm] = useState("All Terms");
  const [selectedSession, setSelectedSession] = useState("All Sessions");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Filter payments based on selected filters and search
  const filteredPayments = allPayments.filter((payment) => {
    const matchesTerm =
      selectedTerm === "All Terms" || payment.term === selectedTerm;
    const matchesSession =
      selectedSession === "All Sessions" || payment.session === selectedSession;
    const matchesSearch =
      payment.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTerm && matchesSession && matchesSearch;
  });

  // Get unique terms and sessions for filters
  const uniqueTerms = [...new Set(allPayments.map((p) => p.term))];
  const uniqueSessions = [...new Set(allPayments.map((p) => p.session))];

  // Calculate payment statistics
  const totalPaid = allPayments
    .filter((p) => p.status === "Paid")
    .reduce((sum, p) => sum + p.amount, 0);

  const totalPending = allPayments
    .filter((p) => p.status === "Pending")
    .reduce((sum, p) => sum + p.amount, 0);

  const totalOverdue = allPayments
    .filter((p) => p.status === "Overdue")
    .reduce((sum, p) => sum + p.amount, 0);

  const totalAmount = totalPaid + totalPending + totalOverdue;

  // Status color helper
  const getStatusColor = (status: Payment["status"]) => {
    switch (status) {
      case "Paid":
        return "bg-green-100 text-green-800";
      case "Pending":
        return "bg-orange-100 text-orange-800";
      case "Overdue":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Toggle expanded row
  const toggleExpandedRow = (paymentId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(paymentId)) {
      newExpanded.delete(paymentId);
    } else {
      newExpanded.add(paymentId);
    }
    setExpandedRows(newExpanded);
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Payment History</h1>
        <span className="text-sm text-gray-500">Student: {student.name}</span>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="text-sm font-medium text-gray-700">Total Paid</h3>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(totalPaid)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="text-sm font-medium text-gray-700">Pending Amount</h3>
          <p className="text-2xl font-bold text-orange-600">
            {formatCurrency(totalPending)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="text-sm font-medium text-gray-700">Overdue Amount</h3>
          <p className="text-2xl font-bold text-red-600">
            {formatCurrency(totalOverdue)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="text-sm font-medium text-gray-700">Total Amount</h3>
          <p className="text-2xl font-bold text-blue-600">
            {formatCurrency(totalAmount)}
          </p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg shadow border mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Term
            </label>
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="w-full p-2 border rounded-md"
            >
              <option value="All Terms">All Terms</option>
              {uniqueTerms.map((term) => (
                <option key={term} value={term}>
                  {term}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Session
            </label>
            <select
              value={selectedSession}
              onChange={(e) => setSelectedSession(e.target.value)}
              className="w-full p-2 border rounded-md"
            >
              <option value="All Sessions">All Sessions</option>
              {uniqueSessions.map((session) => (
                <option key={session} value={session}>
                  {session}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <input
              type="text"
              placeholder="Search by description or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-2 border rounded-md"
            />
          </div>
          <div className="flex flex-col justify-end">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
              Download Receipt
            </button>
          </div>
        </div>
      </div>

      {/* Payment History Table */}
      <div className="bg-white p-6 rounded-lg shadow border">
        <h2 className="text-lg font-semibold mb-4">Payment Records</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-3 px-4 font-semibold">Date</th>
                <th className="text-left py-3 px-4 font-semibold">
                  Description
                </th>
                <th className="text-center py-3 px-4 font-semibold">Amount</th>
                <th className="text-center py-3 px-4 font-semibold">Status</th>
                <th className="text-center py-3 px-4 font-semibold">
                  Term/Session
                </th>
                <th className="text-center py-3 px-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((payment) => (
                <React.Fragment key={payment.id}>
                  <tr className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">{formatDate(payment.date)}</td>
                    <td className="py-3 px-4 font-medium">
                      {payment.description}
                    </td>
                    <td className="py-3 px-4 text-center font-semibold">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-1 rounded-full text-sm font-medium ${getStatusColor(
                          payment.status
                        )}`}
                      >
                        {payment.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-sm">
                      <div>{payment.term}</div>
                      <div className="text-gray-500">{payment.session}</div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => toggleExpandedRow(payment.id)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium mr-2"
                      >
                        {expandedRows.has(payment.id) ? "Hide" : "Details"}
                      </button>
                      {payment.status === "Paid" && (
                        <button className="text-green-600 hover:text-green-800 text-sm font-medium">
                          Receipt
                        </button>
                      )}
                      {payment.status === "Pending" && (
                        <button className="text-orange-600 hover:text-orange-800 text-sm font-medium">
                          Pay Now
                        </button>
                      )}
                    </td>
                  </tr>
                  {expandedRows.has(payment.id) && (
                    <tr className="bg-gray-50 border-b">
                      <td colSpan={6} className="py-4 px-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <strong>Payment ID:</strong> {payment.id}
                          </div>
                          <div>
                            <strong>Student ID:</strong> {payment.studentId}
                          </div>
                          <div>
                            <strong>Payment Date:</strong>{" "}
                            {formatDate(payment.date)}
                          </div>
                          <div className="md:col-span-3">
                            <strong>Description:</strong> {payment.description}
                          </div>
                          {payment.status === "Pending" && (
                            <div className="md:col-span-3 mt-2">
                              <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">
                                Make Payment ({formatCurrency(payment.amount)})
                              </button>
                            </div>
                          )}
                          {payment.status === "Overdue" && (
                            <div className="md:col-span-3 mt-2">
                              <div className="text-red-600 font-medium mb-2">
                                This payment is overdue. Please pay immediately
                                to avoid late fees.
                              </div>
                              <button className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors">
                                Pay Now ({formatCurrency(payment.amount)})
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {filteredPayments.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">
              No payments found matching your filters.
            </p>
          </div>
        )}
      </div>

      {/* Outstanding Balance Summary */}
      {totalPending + totalOverdue > 0 && (
        <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <h3 className="font-semibold text-orange-800 mb-2">
            Outstanding Balance: {formatCurrency(totalPending + totalOverdue)}
          </h3>
          <div className="flex flex-wrap gap-2">
            {totalPending > 0 && (
              <div className="text-sm text-orange-700">
                Pending: {formatCurrency(totalPending)}
              </div>
            )}
            {totalOverdue > 0 && (
              <div className="text-sm text-red-700">
                Overdue: {formatCurrency(totalOverdue)}
              </div>
            )}
          </div>
          <button className="mt-3 bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 transition-colors">
            Pay Outstanding Balance
          </button>
        </div>
      )}
    </div>
  );
}