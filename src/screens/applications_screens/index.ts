/**
 * @module applications_screens
 * @depends store/emptyApi, components/Layout
 * @routes /applications
 */
export { default as ApplicationsScreen } from './ApplicationsScreen';
export { useGetApplicationsQuery, useGetApplicationQuery, useUpdateStatusMutation } from './services/applicationsApiSlice';
