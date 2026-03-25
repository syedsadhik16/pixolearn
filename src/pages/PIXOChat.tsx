import { useLocation } from 'react-router-dom';
import { PIXOChatPanel } from '@/components/ai/PIXOChatPanel';
import { Layout } from '@/components/layout/Layout';

export default function PIXOChatPage() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const mode = params.get('mode') === 'parent' ? 'parent' : 'student';

  return (
    <Layout>
      <div className="h-[calc(100vh-8rem)] md:h-[calc(100vh-4rem)]">
        <PIXOChatPanel mode={mode as 'student' | 'parent'} isFullPage />
      </div>
    </Layout>
  );
}
