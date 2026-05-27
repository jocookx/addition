import { ToastProvider } from "@/components/toast/ToastContext";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}
