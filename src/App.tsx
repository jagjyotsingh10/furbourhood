import { BrowserRouter, Route, Routes } from "react-router-dom";

import { AuthProvider } from "@/auth/AuthProvider";
import { RequireAuth } from "@/auth/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LogIn, SignUp } from "@/screens/Auth";
import { Bookings } from "@/screens/Bookings";
import { FindCare } from "@/screens/FindCare";
import { MyPets } from "@/screens/MyPets";
import { NotFound } from "@/screens/NotFound";
import { AddPet, EditPet } from "@/screens/PetEditor";
import { Profile } from "@/screens/Profile";
import { ProviderProfile } from "@/screens/ProviderProfile";
import { RequestBooking } from "@/screens/RequestBooking";
import { Results } from "@/screens/Results";
import { Styleguide } from "@/screens/Styleguide";
import { Welcome } from "@/screens/Welcome";

export default function App() {
  return (
    <AuthProvider>
      <TooltipProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Welcome />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/login" element={<LogIn />} />
            <Route
              element={
                <RequireAuth>
                  <AppShell />
                </RequireAuth>
              }
            >
              <Route path="/find" element={<FindCare />} />
              <Route path="/results" element={<Results />} />
              <Route path="/providers/:id" element={<ProviderProfile />} />
              <Route path="/providers/:id/request" element={<RequestBooking />} />
              <Route path="/bookings" element={<Bookings />} />
              <Route path="/pets" element={<MyPets />} />
              <Route path="/pets/new" element={<AddPet />} />
              <Route path="/pets/:id/edit" element={<EditPet />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/styleguide" element={<Styleguide />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  );
}
