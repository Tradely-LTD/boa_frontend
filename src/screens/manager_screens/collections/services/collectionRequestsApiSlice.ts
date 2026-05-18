import { emptyApi } from '../../../../store/emptyApi';
import type { PaginatedResponse, PaginationParams } from '../../../../types/pagination';

export interface CollectionRequest {
  id: number;
  refId: string;
  farmerName: string;
  farmerPhone: string;
  farmerNin: string | null;
  address: string;
  state: string;
  lga: string;
  commodity: string;
  estimatedQuantityKg: number;
  collectionType: string;
  preferredDate: string;
  preferredTime: string | null;
  gpsLat: string | null;
  gpsLng: string | null;
  notes: string | null;
  status: 'pending' | 'assigned' | 'in_transit' | 'collected' | 'cancelled';
  centreId: number | null;
  centreName: string | null;
  collectorId: number | null;
  collectorName: string | null;
  assignedAt: string | null;
  inTransitAt: string | null;
  collectedAt: string | null;
  actualQuantityKg: number | null;
  collectionNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Collector {
  id: number;
  name: string;
  email: string;
  centreId: number | null;
}

export const collectionRequestsApi = emptyApi.injectEndpoints({
  endpoints: (builder) => ({
    getCollectionRequests: builder.query<PaginatedResponse<CollectionRequest>, PaginationParams & { status?: string }>({
      query: (params) => ({ url: '/collection-requests', params }),
      providesTags: ['CollectionRequests' as any],
    }),
    getCollectors: builder.query<{ success: boolean; data: Collector[] }, void>({
      query: () => ({ url: '/collection-requests/collectors' }),
    }),
    assignCollector: builder.mutation<{ success: boolean; data: CollectionRequest }, { id: number; collectorId: number; centreId?: number; centreName?: string }>({
      query: ({ id, ...body }) => ({ url: `/collection-requests/${id}/assign`, method: 'PATCH', body }),
      invalidatesTags: ['CollectionRequests' as any],
    }),
    markInTransit: builder.mutation<{ success: boolean; data: CollectionRequest }, number>({
      query: (id) => ({ url: `/collection-requests/${id}/in-transit`, method: 'PATCH' }),
      invalidatesTags: ['CollectionRequests' as any],
    }),
    markCollected: builder.mutation<{ success: boolean; data: CollectionRequest }, { id: number; actualQuantityKg?: number; collectionNotes?: string }>({
      query: ({ id, ...body }) => ({ url: `/collection-requests/${id}/collected`, method: 'PATCH', body }),
      invalidatesTags: ['CollectionRequests' as any],
    }),
    cancelRequest: builder.mutation<{ success: boolean; data: CollectionRequest }, number>({
      query: (id) => ({ url: `/collection-requests/${id}/cancel`, method: 'PATCH' }),
      invalidatesTags: ['CollectionRequests' as any],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetCollectionRequestsQuery, useGetCollectorsQuery,
  useAssignCollectorMutation, useMarkInTransitMutation,
  useMarkCollectedMutation, useCancelRequestMutation,
} = collectionRequestsApi;
