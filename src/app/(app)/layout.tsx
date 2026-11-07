import { AppShell } from "@/components/app-shell";

/** Every in-app screen gets the top bar, bottom nav and reward toasts. */
export default function AppLayout({ children }: LayoutProps<"/">) {
  return <AppShell>{children}</AppShell>;
}
