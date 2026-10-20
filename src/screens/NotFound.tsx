import { Link } from "react-router-dom";

import { AppBar } from "@/components/AppBar";
import { ScreenBody } from "@/components/AppShell";
import { Button } from "@/components/ui/button";

export function NotFound() {
  return (
    <>
      <AppBar title="Not found" back="/find" />
      <ScreenBody className="items-center pt-16 text-center">
        <p className="font-heading text-2xl font-extrabold">We couldn't find that page</p>
        <Button asChild>
          <Link to="/find">Back to Find care</Link>
        </Button>
      </ScreenBody>
    </>
  );
}
