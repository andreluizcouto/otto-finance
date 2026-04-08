import { RouterProvider } from 'react-router';
import { Toaster } from "@/shared/components/ui/sonner";
import { router } from "@/app/routes";

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster position="top-right" richColors />
    </>
  );
}
