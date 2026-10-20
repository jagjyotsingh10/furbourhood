import { BrowserRouter, Route, Routes } from "react-router-dom";

import { AppShell } from "@/components/AppShell";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Bookings } from "@/screens/Bookings";
import { FindCare } from "@/screens/FindCare";
import { MyPets } from "@/screens/MyPets";
import { NotFound } from "@/screens/NotFound";
import { Profile } from "@/screens/Profile";
import { ProviderProfile } from "@/screens/ProviderProfile";
import { Results } from "@/screens/Results";
import { Styleguide } from "@/screens/Styleguide";
import { Welcome } from "@/screens/Welcome";

export default function App() {
  return (
    <TooltipProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route element={<AppShell />}>
            <Route path="/find" element={<FindCare />} />
            <Route path="/results" element={<Results />} />
            <Route path="/providers/:id" element={<ProviderProfile />} />
            <Route path="/bookings" element={<Bookings />} />
            <Route path="/pets" element={<MyPets />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/styleguide" element={<Styleguide />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  );
}
