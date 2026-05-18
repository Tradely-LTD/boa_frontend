import { emptyApi } from '../../../store/emptyApi';

export interface Tractor {
  id:                number;
  serialNumber:      string;
  brand:             string | null;
  model:             string;
  yearManufactured:  number | null;
  horsepowerHp:      number;
  driveType:         '2WD' | '4WD';
  fuelType:          string | null;
  engineCc:          number | null;
  color:             string | null;
  status:            'available' | 'deployed' | 'maintenance';
  facId:             number | null;
  facName:           string | null;
  currentImplements: string[];
  notes:             string | null;
  createdAt:         string;
  updatedAt:         string;
}

export interface HireRequest {
  id:                  number;
  refId:               string;
  farmerName:          string;
  farmerPhone:         string;
  facId:               number;
  facName:             string;
  locationDescription: string;
  state:               string;
  lga:                 string | null;
  hectares:            number;
  implements:          string[];
  preferredDate:       string | null;
  notes:               string | null;
  quotedAmount:        number | null;
  quoteNotes:          string | null;
  status:              'pending' | 'quoted' | 'payment_confirmed' | 'deployed' | 'completed' | 'cancelled';
  tractorId:           number | null;
  tractorModel:        string | null;
  createdAt:           string;
}

export interface MechDeployment {
  id:                 number;
  refId:              string;
  tractorId:          number;
  tractorModel:       string;
  tractorSerial:      string;
  farmerName:         string;
  farmerPhone:        string;
  facId:              number;
  facName:            string;
  requestId:          number;
  implementsAttached: string[];
  deployedAt:         string;
  expectedReturnAt:   string;
  actualReturnAt:     string | null;
  status:             'active' | 'returned' | 'overdue';
  lastKnownLat:       number | null;
  lastKnownLng:       number | null;
  lastLocationAt:     string | null;
  notes:              string | null;
}

export interface MechAdminStats {
  totalTractors:      number;
  available:          number;
  deployed:           number;
  maintenance:        number;
  activeDeployments:  number;
  overdueDeployments: number;
}

export interface MechManagerStats {
  assignedTractors:  number;
  activeDeployments: number;
  pendingRequests:   number;
  overdueReturns:    number;
}

export interface AddTractorPayload {
  serialNumber:     string;
  model:            string;
  horsepowerHp:     number;
  driveType:        '2WD' | '4WD';
  brand?:           string;
  yearManufactured?: number;
  fuelType?:        string;
  engineCc?:        number;
  color?:           string;
  notes?:           string;
}

export type UpdateTractorPayload = Omit<AddTractorPayload, 'serialNumber'> & {
  status?: 'available' | 'maintenance';
};

export interface QuotePayload {
  quotedAmount: number;
  quoteNotes?:  string;
}

export interface ConfirmPaymentPayload {
  tractorId:        number;
  expectedReturnAt: string;
  notes?:           string;
}

const mechanizationApi = emptyApi.injectEndpoints({
  endpoints: (build) => ({
    // ── Admin ──────────────────────────────────────────────────
    getAllTractors: build.query<Tractor[], void>({
      query: () => '/mechanization/tractors',
      transformResponse: (r: any) => r.data,
      providesTags: ['Mechanization'],
    }),
    addTractor: build.mutation<Tractor, AddTractorPayload>({
      query: (body) => ({ url: '/mechanization/tractors', method: 'POST', body }),
      transformResponse: (r: any) => r.data,
      invalidatesTags: ['Mechanization'],
    }),
    updateTractor: build.mutation<Tractor, { id: number } & UpdateTractorPayload>({
      query: ({ id, ...body }) => ({ url: `/mechanization/tractors/${id}`, method: 'PATCH', body }),
      transformResponse: (r: any) => r.data,
      invalidatesTags: ['Mechanization'],
    }),
    assignTractorToFac: build.mutation<Tractor, { id: number; facId: number }>({
      query: ({ id, facId }) => ({ url: `/mechanization/tractors/${id}/assign-fac`, method: 'PATCH', body: { facId } }),
      transformResponse: (r: any) => r.data,
      invalidatesTags: ['Mechanization'],
    }),
    getAllDeployments: build.query<MechDeployment[], void>({
      query: () => '/mechanization/deployments',
      transformResponse: (r: any) => r.data,
      providesTags: ['MechDeployments'],
    }),
    getMechAdminStats: build.query<MechAdminStats, void>({
      query: () => '/mechanization/stats/admin',
      transformResponse: (r: any) => r.data,
      providesTags: ['Mechanization'],
    }),

    // ── Manager ────────────────────────────────────────────────
    getMyTractors: build.query<Tractor[], void>({
      query: () => '/mechanization/tractors/my',
      transformResponse: (r: any) => r.data,
      providesTags: ['Mechanization'],
    }),
    updateTractorStatus: build.mutation<Tractor, { id: number; status: 'available' | 'maintenance' }>({
      query: ({ id, status }) => ({ url: `/mechanization/tractors/${id}/status`, method: 'PATCH', body: { status } }),
      transformResponse: (r: any) => r.data,
      invalidatesTags: ['Mechanization'],
    }),
    attachImplements: build.mutation<Tractor, { id: number; implements: string[] }>({
      query: ({ id, implements: impls }) => ({ url: `/mechanization/tractors/${id}/implements`, method: 'PATCH', body: { implements: impls } }),
      transformResponse: (r: any) => r.data,
      invalidatesTags: ['Mechanization'],
    }),
    getHireRequests: build.query<HireRequest[], void>({
      query: () => '/mechanization/requests',
      transformResponse: (r: any) => r.data,
      providesTags: ['MechRequests'],
    }),
    sendQuote: build.mutation<HireRequest, { id: number } & QuotePayload>({
      query: ({ id, ...body }) => ({ url: `/mechanization/requests/${id}/quote`, method: 'PATCH', body }),
      transformResponse: (r: any) => r.data,
      invalidatesTags: ['MechRequests'],
    }),
    confirmPaymentAndAssign: build.mutation<HireRequest, { id: number } & ConfirmPaymentPayload>({
      query: ({ id, ...body }) => ({ url: `/mechanization/requests/${id}/confirm-payment`, method: 'PATCH', body }),
      transformResponse: (r: any) => r.data,
      invalidatesTags: ['MechRequests', 'Mechanization', 'MechDeployments'],
    }),
    getMyDeployments: build.query<MechDeployment[], void>({
      query: () => '/mechanization/deployments/my',
      transformResponse: (r: any) => r.data,
      providesTags: ['MechDeployments'],
    }),
    markTractorReturned: build.mutation<MechDeployment, number>({
      query: (id) => ({ url: `/mechanization/deployments/${id}/return`, method: 'PATCH' }),
      transformResponse: (r: any) => r.data,
      invalidatesTags: ['MechDeployments', 'Mechanization'],
    }),
    updateDeploymentLocation: build.mutation<MechDeployment, { id: number; lat: number; lng: number }>({
      query: ({ id, lat, lng }) => ({ url: `/mechanization/deployments/${id}/location`, method: 'PATCH', body: { lat, lng } }),
      transformResponse: (r: any) => r.data,
      invalidatesTags: ['MechDeployments'],
    }),
    getMechManagerStats: build.query<MechManagerStats, void>({
      query: () => '/mechanization/stats/manager',
      transformResponse: (r: any) => r.data,
      providesTags: ['MechRequests', 'MechDeployments', 'Mechanization'],
    }),
  }),
});

export const {
  useGetAllTractorsQuery,
  useAddTractorMutation,
  useUpdateTractorMutation,
  useAssignTractorToFacMutation,
  useGetAllDeploymentsQuery,
  useGetMechAdminStatsQuery,
  useGetMyTractorsQuery,
  useUpdateTractorStatusMutation,
  useAttachImplementsMutation,
  useGetHireRequestsQuery,
  useSendQuoteMutation,
  useConfirmPaymentAndAssignMutation,
  useGetMyDeploymentsQuery,
  useMarkTractorReturnedMutation,
  useUpdateDeploymentLocationMutation,
  useGetMechManagerStatsQuery,
} = mechanizationApi;
