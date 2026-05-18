import { emptyApi } from '../../../store/emptyApi';
import type { PaginatedResponse, PaginationParams } from '../../../types/pagination';

export interface LoanApplication {
  id: number;
  refId: string;
  receiptId: number;
  receiptNumber: string;
  centreId: number;
  centreName: string;
  commodity: string;
  quantityKg: number;
  farmerName: string;
  farmerPhone: string | null;
  farmerNin: string | null;
  loanAmountRequested: number;
  loanAmountApproved: number | null;
  interestRate: number | null;
  repaymentPeriodMonths: number | null;
  status: 'pending' | 'approved' | 'disbursed' | 'repaid' | 'defaulted' | 'rejected';
  reviewedBy: number | null;
  reviewNotes: string | null;
  disbursedAt: string | null;
  repaidAt: string | null;
  createdAt: string;
}

export const loanApi = emptyApi.injectEndpoints({
  endpoints: (builder) => ({
    getLoans: builder.query<PaginatedResponse<LoanApplication>, { status?: string } & PaginationParams>({
      query: (params) => ({ url: '/loan-applications', params }),
      providesTags: ['Loans'],
    }),
    getLoan: builder.query<{ success: boolean; data: LoanApplication }, number>({
      query: (id) => `/loan-applications/${id}`,
      providesTags: ['Loans'],
    }),
    createLoan: builder.mutation<{ success: boolean; data: LoanApplication }, Partial<LoanApplication> & { receiptNumber: string; loanAmountRequested: number }>({
      query: (body) => ({ url: '/loan-applications', method: 'POST', body }),
      invalidatesTags: ['Loans', 'Receipts'],
    }),
    updateLoanStatus: builder.mutation<{ success: boolean; data: LoanApplication }, {
      id: number;
      status: string;
      loanAmountApproved?: number;
      interestRate?: number;
      repaymentPeriodMonths?: number;
      reviewNotes?: string;
    }>({
      query: ({ id, ...body }) => ({ url: `/loan-applications/${id}/status`, method: 'PATCH', body }),
      invalidatesTags: ['Loans', 'Receipts'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetLoansQuery,
  useGetLoanQuery,
  useCreateLoanMutation,
  useUpdateLoanStatusMutation,
} = loanApi;
