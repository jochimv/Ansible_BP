/**
 * Author: Václav Jochim
 * Date: 2023-04-28
 */

import { useRouter } from 'next/router';

const useUserIsInHostDetailsPage = () => {
  const router = useRouter();
  return router.pathname === '/[projectName]/host-details/[hostname]';
};

export default useUserIsInHostDetailsPage;
