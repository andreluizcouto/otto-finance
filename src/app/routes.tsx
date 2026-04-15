import { createBrowserRouter } from "react-router";
import { AuthLayout, MainLayout, ProtectedAuthLayout } from "@/shared/components/layout";
import { Welcome } from "@/features/auth/pages/Welcome";
import { Login } from "@/features/auth/pages/Login";
import { Signup } from "@/features/auth/pages/Signup";
import { Onboarding1 } from "@/features/onboarding/pages/Onboarding1";
import { Onboarding2 } from "@/features/onboarding/pages/Onboarding2";
import { Onboarding3 } from "@/features/onboarding/pages/Onboarding3";
import { Dashboard } from "@/features/dashboard/pages/Dashboard";
import { Transactions } from "@/features/transactions/pages/Transactions";
import { TransactionDetail } from "@/features/transactions/pages/TransactionDetail";
import { Categories } from "@/features/transactions/pages/Categories";
import { Goals } from "@/features/goals/pages/Goals";
import { Settings } from "@/features/settings/pages/Settings";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: AuthLayout,
    children: [
      { index: true, Component: Welcome },
      { path: "login", Component: Login },
      { path: "signup", Component: Signup },
    ],
  },
  {
    path: "/",
    Component: ProtectedAuthLayout,
    children: [
      { path: "onboarding/1", Component: Onboarding1 },
      { path: "onboarding/2", Component: Onboarding2 },
      { path: "onboarding/3", Component: Onboarding3 },
    ],
  },
  {
    path: "/",
    Component: MainLayout,
    children: [
      { path: "dashboard", Component: Dashboard },
      { path: "transactions", Component: Transactions },
      { path: "transactions/:id", Component: TransactionDetail },
      { path: "categories", Component: Categories },
      { path: "goals", Component: Goals },
      { path: "settings", Component: Settings },
    ],
  },
]);
