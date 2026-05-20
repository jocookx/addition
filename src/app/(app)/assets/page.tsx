import { redirect } from "next/navigation";

// Assets page — to be built. Redirects to existing toolkit for now.
export default function AssetsPage() {
  redirect("/toolkit");
}
