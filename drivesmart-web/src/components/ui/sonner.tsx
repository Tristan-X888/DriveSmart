
import * as React from "react";
import { Toaster as SonnerToaster } from "sonner";

export type ToasterProps = React.ComponentProps<typeof SonnerToaster>;

export function Toaster(props: ToasterProps) {
  // nice defaults; customize later if you like
  return <SonnerToaster richColors closeButton {...props} />;
}
