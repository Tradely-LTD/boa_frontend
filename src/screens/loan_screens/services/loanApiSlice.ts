import { emptyApi } from '../../../store/emptyApi';
import type { PaginatedResponse, PaginationParams } from '../../../types/pagination';

export interface PledgedReceipt {
  id: number;
  loanId: number;
  receiptId: number;
  receiptNumber: string;
  commodity: string;
  quantityKg: number;
}

export interface LoanApplication {
  id: number;
  refId: string;
  receiptId: number | null;
  receiptNumber: string | null;
  receiptCount: number;
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
  pledgedReceipts: PledgedReceipt[];
}

export interface CommodityPrice {
  id: number;
  commodity: string;
  centreId: number | null;
  pricePerKg: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
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
    createLoan: builder.mutation<{ success: boolean; data: LoanApplication }, {
      receiptNumbers: string[];
      loanAmountRequested: number;
      farmerPhone?: string;
      farmerNin?: string;
      interestRate?: number;
      repaymentPeriodMonths?: number;
      reviewNotes?: string;
    }>({
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
    getCommodityPrices: builder.query<{ success: boolean; data: CommodityPrice[] }, void>({
      query: () => '/commodity-prices',
      providesTags: ['CommodityPrices' as any],
    }),
    lookupCommodityPrice: builder.query<{ success: boolean; data: CommodityPrice | null }, { commodity: string; centreId?: number }>({
      query: (params) => ({ url: '/commodity-prices/lookup', params }),
    }),
    upsertCommodityPrice: builder.mutation<{ success: boolean; data: CommodityPrice }, {
      commodity: string; pricePerKg: number; centreId?: number; notes?: string;
    }>({
      query: (body) => ({ url: '/commodity-prices', method: 'POST', body }),
      invalidatesTags: ['CommodityPrices' as any],
    }),
    deleteCommodityPrice: builder.mutation<{ success: boolean }, number>({
      query: (id) => ({ url: `/commodity-prices/${id}`, method: 'DELETE' }),
      invalidatesTags: ['CommodityPrices' as any],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetLoansQuery,
  useGetLoanQuery,
  useCreateLoanMutation,
  useUpdateLoanStatusMutation,
  useGetCommodityPricesQuery,
  useLookupCommodityPriceQuery,
  useUpsertCommodityPriceMutation,
  useDeleteCommodityPriceMutation,
} = loanApi;
