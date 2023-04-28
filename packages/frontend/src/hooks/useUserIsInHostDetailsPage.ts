import { useRouter } from 'next/router';

const useUserIsInHostDetailsPage = () => {
  const router = useRouter();
  return router.pathname === '/[projectName]/host/[hostname]';
};

export default useUserIsInHostDetailsPage;
