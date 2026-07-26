import { AssessmentProvider } from '@/context/AssessmentContext';

export default function AssessmentLayout({ children }: { children: React.ReactNode }) {
  return <AssessmentProvider>{children}</AssessmentProvider>;
}
