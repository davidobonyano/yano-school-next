'use client';

import { useAcademicContext } from '@/lib/academic-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CreditCard, 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useState } from 'react';

interface PaymentContextDisplayProps {
  userRole: 'admin' | 'teacher' | 'student';
  className?: string;
}

export function PaymentContextDisplay({ userRole, className = '' }: PaymentContextDisplayProps) {
  const { currentContext, sessions, terms } = useAcademicContext();
  const [selectedSession, setSelectedSession] = useState<string>('');
  const [selectedTerm, setSelectedTerm] = useState<string>('');

  // Mock payment data - in real app, this would come from API
  const mockPaymentData = {
    '2025/2026': {
      '1st Term': {
        total_expected: 58000,
        total_paid: 45000,
        total_outstanding: 13000,
        carry_over_from_previous: 0,
        net_amount_due: 13000,
        fee_breakdown: {
          tuition: { expected: 50000, paid: 40000, balance: 10000 },
          library: { expected: 5000, paid: 3000, balance: 2000 },
          laboratory: { expected: 3000, paid: 2000, balance: 1000 }
        }
      },
      '2nd Term': {
        total_expected: 58000,
        total_paid: 0,
        total_outstanding: 58000,
        carry_over_from_previous: 13000,
        net_amount_due: 71000,
        fee_breakdown: {
          tuition: { expected: 50000, paid: 0, balance: 50000 },
          library: { expected: 5000, paid: 0, balance: 5000 },
          laboratory: { expected: 3000, paid: 0, balance: 3000 }
        }
      }
    },
    '2024/2025': {
      '3rd Term': {
        total_expected: 58000,
        total_paid: 43000,
        total_outstanding: 15000,
        carry_over_from_previous: 0,
        net_amount_due: 15000,
        fee_breakdown: {
          tuition: { expected: 50000, paid: 40000, balance: 10000 },
          library: { expected: 5000, paid: 2000, balance: 3000 },
          laboratory: { expected: 3000, paid: 1000, balance: 2000 }
        }
      }
    }
  };

  const getCurrentPaymentData = () => {
    if (!currentContext) return null;
    return mockPaymentData[currentContext.session_name]?.[currentContext.term_name];
  };

  const getHistoricalPaymentData = () => {
    if (!selectedSession || !selectedTerm) return null;
    return mockPaymentData[selectedSession]?.[selectedTerm];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'partial':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'unpaid':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="default" className="bg-green-600">Paid</Badge>;
      case 'partial':
        return <Badge variant="secondary" className="bg-yellow-600">Partial</Badge>;
      case 'unpaid':
        return <Badge variant="destructive">Unpaid</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (!currentContext) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">No academic context available</div>
        </CardContent>
      </Card>
    );
  }

  const currentData = getCurrentPaymentData();

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment System with Academic Context
        </CardTitle>
        <CardDescription>
          See how payments work with session/term management
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="current" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="current">Current Context</TabsTrigger>
            <TabsTrigger value="historical">Historical View</TabsTrigger>
          </TabsList>

          {/* Current Context Tab */}
          <TabsContent value="current" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500">Current Session</label>
                <div className="flex items-center gap-2">
                  <Badge variant="default">{currentContext.session_name}</Badge>
                  <Calendar className="h-4 w-4 text-gray-400" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500">Current Term</label>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{currentContext.term_name}</Badge>
                  <Clock className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>

            {currentData && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <DollarSign className="h-8 w-8 text-blue-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-600">Expected</p>
                          <p className="text-2xl font-bold text-gray-900">₦{currentData.total_expected.toLocaleString()}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-8 w-8 text-green-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-600">Paid</p>
                          <p className="text-2xl font-bold text-gray-900">₦{currentData.total_paid.toLocaleString()}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <AlertCircle className="h-8 w-8 text-red-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-600">Outstanding</p>
                          <p className="text-2xl font-bold text-gray-900">₦{currentData.total_outstanding.toLocaleString()}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Carry Over Information */}
                {currentData.carry_over_from_previous > 0 && (
                  <Card className="border-orange-200 bg-orange-50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <TrendingUp className="h-6 w-6 text-orange-600" />
                        <div>
                          <p className="text-sm font-medium text-orange-800">Carry Over from Previous Term</p>
                          <p className="text-lg font-bold text-orange-900">₦{currentData.carry_over_from_previous.toLocaleString()}</p>
                          <p className="text-xs text-orange-700">This amount was carried forward from unpaid balances</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Fee Breakdown */}
                <div className="space-y-3">
                  <h4 className="font-medium">Fee Breakdown</h4>
                  {Object.entries(currentData.fee_breakdown).map(([feeType, data]) => (
                    <div key={feeType} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(data.balance === 0 ? 'paid' : data.paid > 0 ? 'partial' : 'unpaid')}
                        <div>
                          <p className="font-medium capitalize">{feeType}</p>
                          <p className="text-sm text-gray-500">Expected: ₦{data.expected.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">₦{data.paid.toLocaleString()}</p>
                        <p className="text-sm text-gray-500">Balance: ₦{data.balance.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total Due */}
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-800">Total Amount Due</p>
                        <p className="text-xs text-blue-700">Including carry over from previous terms</p>
                      </div>
                      <p className="text-2xl font-bold text-blue-900">₦{currentData.net_amount_due.toLocaleString()}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Historical View Tab */}
          <TabsContent value="historical" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Session</label>
                <Select value={selectedSession} onValueChange={setSelectedSession}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose session" />
                  </SelectTrigger>
                  <SelectContent>
                    {sessions.map((session) => (
                      <SelectItem key={session.id} value={session.name}>
                        {session.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Select Term</label>
                <Select 
                  value={selectedTerm} 
                  onValueChange={setSelectedTerm}
                  disabled={!selectedSession}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose term" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedSession && terms.map((term) => (
                      <SelectItem key={term.id} value={term.name}>
                        {term.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedSession && selectedTerm && (
              <div className="space-y-4">
                <div className="p-4 border rounded-lg bg-gray-50">
                  <h4 className="font-medium mb-2">Historical View: {selectedSession} - {selectedTerm}</h4>
                  <p className="text-sm text-gray-600">
                    This view shows the payment status as it was at the end of that term.
                    No carry-over information is displayed here since this is a historical snapshot.
                  </p>
                </div>

                {getHistoricalPaymentData() && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <DollarSign className="h-8 w-8 text-blue-600" />
                            <div>
                              <p className="text-sm font-medium text-gray-600">Expected</p>
                              <p className="text-2xl font-bold text-gray-900">
                                ₦{getHistoricalPaymentData()?.total_expected.toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <CheckCircle className="h-8 w-8 text-green-600" />
                            <div>
                              <p className="text-sm font-medium text-gray-600">Paid</p>
                              <p className="text-2xl font-bold text-gray-900">
                                ₦{getHistoricalPaymentData()?.total_paid.toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <AlertCircle className="h-8 w-8 text-red-600" />
                            <div>
                              <p className="text-sm font-medium text-gray-600">Outstanding</p>
                              <p className="text-2xl font-bold text-gray-900">
                                ₦{getHistoricalPaymentData()?.total_outstanding.toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="p-4 border rounded-lg bg-yellow-50">
                      <div className="flex items-center gap-3">
                        <AlertCircle className="h-6 w-6 text-yellow-600" />
                        <div>
                          <p className="text-sm font-medium text-yellow-800">Historical Record</p>
                          <p className="text-xs text-yellow-700">
                            This shows the final status at the end of {selectedTerm}. 
                            Outstanding amounts may have been carried forward to the next term.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

