'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Filter, DollarSign, BookOpen, FlaskConical } from 'lucide-react';

interface FeeStructure {
  id: string;
  class_level: string;
  stream?: string;
  fee_type: string;
  amount: number;
  description: string;
  session_name?: string;
  term_name?: string;
}

interface FeeStructureManagerProps {
  className?: string;
}

export function FeeStructureManager({ className = '' }: FeeStructureManagerProps) {
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSession, setSelectedSession] = useState<string>('2025/2026');
  const [selectedTerm, setSelectedTerm] = useState<string>('1st Term');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const classes = ['KG1', 'KG2', 'KG3', 'JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2', 'SS3'];

  // Fetch fee structures
  const fetchFeeStructures = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedSession !== 'all') params.append('session', selectedSession);
      if (selectedTerm !== 'all') params.append('term', selectedTerm);
      if (selectedClass !== 'all') params.append('class_level', selectedClass);
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`/api/fee-structures?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setFeeStructures(data.feeStructures || []);
      }
    } catch (error) {
      console.error('Error fetching fee structures:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFeeStructures();
  }, [selectedSession, selectedTerm, selectedClass, searchTerm]);

  // Get fee type icon
  const getFeeTypeIcon = (feeType: string) => {
    switch (feeType) {
      case 'tuition': return <DollarSign className="h-4 w-4" />;
      case 'library': return <BookOpen className="h-4 w-4" />;
      case 'laboratory': return <FlaskConical className="h-4 w-4" />;
      default: return <DollarSign className="h-4 w-4" />;
    }
  };

  // Get fee type color
  const getFeeTypeColor = (feeType: string) => {
    switch (feeType) {
      case 'tuition': return 'bg-blue-100 text-blue-800';
      case 'library': return 'bg-green-100 text-green-800';
      case 'laboratory': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Group fee structures by class
  const groupedFees = feeStructures.reduce((acc, fee) => {
    const key = `${fee.class_level}${fee.stream ? `-${fee.stream}` : ''}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(fee);
    return acc;
  }, {} as Record<string, FeeStructure[]>);

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Fee Structure Management</CardTitle>
              <CardDescription>
                View and manage fee structures for all classes and terms
              </CardDescription>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Fee Structure
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="space-y-2">
              <Label>Session</Label>
              <Select value={selectedSession} onValueChange={setSelectedSession}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sessions</SelectItem>
                  <SelectItem value="2025/2026">2025/2026</SelectItem>
                  <SelectItem value="2024/2025">2024/2025</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Term</Label>
              <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Terms</SelectItem>
                  <SelectItem value="1st Term">1st Term</SelectItem>
                  <SelectItem value="2nd Term">2nd Term</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classes.map(cls => (
                    <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search fees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSelectedSession('2025/2026');
                  setSelectedTerm('1st Term');
                  setSelectedClass('all');
                  setSearchTerm('');
                }}
                className="w-full"
              >
                <Filter className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </div>

          {/* Fee Structures Display */}
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading fee structures...</p>
            </div>
          ) : feeStructures.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No fee structures found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(groupedFees).map(([classKey, fees]) => (
                <Card key={classKey}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{classKey}</CardTitle>
                    <CardDescription>
                      {fees.length} fee type{fees.length !== 1 ? 's' : ''}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {fees.map((fee) => (
                      <div key={fee.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          {getFeeTypeIcon(fee.fee_type)}
                          <div>
                            <p className="font-medium capitalize">{fee.fee_type}</p>
                            <p className="text-sm text-gray-600">₦{fee.amount.toLocaleString()}</p>
                          </div>
                        </div>
                        <Badge className={getFeeTypeColor(fee.fee_type)}>
                          {fee.fee_type}
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
