import { profileApi } from '../api/management';
import { useAxiosRequest } from './useAxiosRequest';

export function useInstructorIdentity() {
  return useAxiosRequest(signal => profileApi.get({ signal }), { auto: true });
}
