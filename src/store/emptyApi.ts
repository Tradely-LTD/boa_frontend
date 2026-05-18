import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from './store';

export const emptyApi = createApi({
  tagTypes: ['Applications', 'Centres', 'Users', 'Intakes', 'Receipts', 'Loans', 'InventorySales', 'Suppliers', 'FarmInputs', 'FarmInputSales', 'CollectionRequests', 'Marketplace', 'MarketplaceOrders', 'Mechanization', 'MechRequests', 'MechDeployments'],
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  endpoints: () => ({}),
});
