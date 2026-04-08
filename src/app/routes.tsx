import { createBrowserRouter } from "react-router";
import { AuthLayout, MainLayout } from "./components/layout";
import { Welcome } from "./pages/Welcome";
import { Login } from "./pages/Login";
import { Onboarding1 } from "./pages/Onboarding1";
import { Onboarding2 } from "./pages/Onboarding2";
import { Onboarding3 } from "./pages/Onboarding3";
import { Dashboard } from "./pages/Dashboard";
import { Transactions } from "./pages/Transactions";
import { TransactionDetail } from "./pages/TransactionDetail";
import { Categories } from "./pages/Categories";
import { Goals } from "./pages/Goals";
import { Settings } from "./pages/Settings";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: AuthLayout,
    children: [
      { index: true, Component: Welcome },
      { path: "login", Component: Login },
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
