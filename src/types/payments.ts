// Payment System Types with Academic Context Integration

export interface PaymentRecord {
  id: string;
  student_id: string;
  session_id: string;
  term_id: string;
  fee_type: 'tuition' | 'library' | 'laboratory' | 'sports' | 'other';
  expected_amount: number;
  paid_amount: number;
  balance: number;
  status: 'paid' | 'partial' | 'unpaid' | 'overdue';
  due_date: string;
  created_at: string;
  updated_at: string;
  
  // Joined fields
  session_name?: string;
  term_name?: string;
  student_name?: string;
  class_level?: string;
  stream?: string;
}

export interface PaymentTransaction {
  id: string;
  payment_record_id: string;
  student_id: string;
  session_id: string;
  term_id: string;
  amount: number;
  payment_method: 'cash' | 'bank_transfer' | 'card' | 'check';
  reference_number?: string;
  description: string;
  transaction_date: string;
  recorded_by: string; // teacher/admin ID
  created_at: string;
  
  // Joined fields
  session_name?: string;
  term_name?: string;
  student_name?: string;
  recorded_by_name?: string;
}

export interface FeeStructure {
  id: string;
  session_id: string;
  term_id: string;
  class_level: string;
  stream?: string;
  fee_type: 'tuition' | 'library' | 'laboratory' | 'sports' | 'other';
  amount: number;
  is_required: boolean;
  description: string;
  created_at: string;
  updated_at: string;
  
  // Joined fields
  session_name?: string;
  term_name?: string;
}

export interface CarryOverBalance {
  id: string;
  student_id: string;
  from_session_id: string;
  from_term_id: string;
  to_session_id: string;
  to_term_id: string;
  amount: number;
  fee_type: 'tuition' | 'library' | 'laboratory' | 'sports' | 'other';
  created_at: string;
  
  // Joined fields
  from_session_name?: string;
  from_term_name?: string;
  to_session_name?: string;
  to_term_name?: string;
  student_name?: string;
}

export interface PaymentSummary {
  student_id: string;
  session_id: string;
  term_id: string;
  total_expected: number;
  total_paid: number;
  total_balance: number;
  carry_over_from_previous: number;
  net_amount_due: number;
  
  // Details by fee type
  fee_breakdown: {
    [fee_type: string]: {
      expected: number;
      paid: number;
      balance: number;
    };
  };
  
  // Joined fields
  session_name?: string;
  term_name?: string;
  student_name?: string;
  class_level?: string;
  stream?: string;
}

export interface PaymentFilters {
  session_id?: string;
  term_id?: string;
  student_id?: string;
  class_level?: string;
  stream?: string;
  fee_type?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
}

export interface PaymentCreate {
  student_id: string;
  session_id: string;
  term_id: string;
  fee_type: string;
  expected_amount: number;
  due_date: string;
}

export interface PaymentTransactionCreate {
  payment_record_id: string;
  student_id: string;
  session_id: string;
  term_id: string;
  amount: number;
  payment_method: string;
  reference_number?: string;
  description: string;
  recorded_by: string;
}

export interface FeeStructureCreate {
  session_id: string;
  term_id: string;
  class_level: string;
  stream?: string;
  fee_type: string;
  amount: number;
  is_required: boolean;
  description: string;
}

// Payment Statistics
export interface PaymentStatistics {
  total_students: number;
  total_expected: number;
  total_paid: number;
  total_outstanding: number;
  total_carry_over: number;
  
  by_status: {
    paid: number;
    partial: number;
    unpaid: number;
    overdue: number;
  };
  
  by_fee_type: {
    [fee_type: string]: {
      expected: number;
      paid: number;
      outstanding: number;
    };
  };
  
  by_class_level: {
    [class_level: string]: {
      expected: number;
      paid: number;
      outstanding: number;
    };
  };
}

// Payment Response Types
export interface PaymentResponse {
  payments: PaymentRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaymentTransactionResponse {
  transactions: PaymentTransaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaymentSummaryResponse {
  summaries: PaymentSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Bulk Operations
export interface BulkPaymentOperation {
  payments: PaymentCreate[];
  operation: 'create' | 'update';
}

export interface BulkPaymentResponse {
  message: string;
  payments?: PaymentRecord[];
  updated?: PaymentRecord[];
  errors?: Array<{
    payment: PaymentCreate;
    error: string;
  }>;
}

// Constants
export const PAYMENT_METHODS = [
  'cash',
  'bank_transfer', 
  'card',
  'check'
] as const;

export const FEE_TYPES = [
  'tuition',
  'library',
  'laboratory',
  'sports',
  'other'
] as const;

export const PAYMENT_STATUSES = [
  'paid',
  'partial',
  'unpaid',
  'overdue'
] as const;

// Type guards
export function isValidPaymentMethod(method: string): method is typeof PAYMENT_METHODS[number] {
  return PAYMENT_METHODS.includes(method as any);
}

export function isValidFeeType(type: string): type is typeof FEE_TYPES[number] {
  return FEE_TYPES.includes(type as any);
}

export function isValidPaymentStatus(status: string): status is typeof PAYMENT_STATUSES[number] {
  return PAYMENT_STATUSES.includes(status as any);
}











