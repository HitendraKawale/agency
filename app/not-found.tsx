import type { Metadata } from "next";
import Kinetic404 from "@/components/site/kinetic-404";

export const metadata: Metadata = {
  title: { absolute: "404 , blank interfaces" },
};

export default function NotFound() {
  return <Kinetic404 />;
}
