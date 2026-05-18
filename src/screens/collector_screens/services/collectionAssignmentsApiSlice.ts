import { emptyApi } from '../../../store/emptyApi';
import type { PaginatedResponse, PaginationParams } from '../../../types/pagination';
import type { CollectionRequest } from '../../manager_screens/collections/services/collectionRequestsApiSlice';

const collectionAssignmentsApi = emptyApi.injectEndpoints({
  endpoints: (builder) => ({
    getMyAssignments: builder.query<PaginatedResponse<CollectionRequest>, PaginationParams & { status?: string }>({
      query: (params) => ({ url: '/collection-requests', params }),
      providesTags: ['CollectionRequests' as any],
    }),
    markAssignmentInTransit: builder.mutation<{ success: boolean; data: CollectionRequest }, number>({
      query: (id) => ({ url: `/collection-requests/${id}/in-transit`, method: 'PATCH' }),
      invalidatesTags: ['CollectionRequests' as any],
    }),
    markAssignmentCollected: builder.mutation<{ success: boolean; data: CollectionRequest }, { id: number; actualQuantityKg?: number; collectionNotes?: string }>({
      query: ({ id, ...body }) => ({ url: `/collection-requests/${id}/collected`, method: 'PATCH', body }),
      invalidatesTags: ['CollectionRequests' as any],
    }),
  }),
  overrideExisting: false,
});

export const { useGetMyAssignmentsQuery, useMarkAssignmentInTransitMutation, useMarkAssignmentCollectedMutation } = collectionAssignmentsApi;
