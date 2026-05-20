import { redirect } from "next/navigation";

export const metadata = { title: "Admin Portal | ADDITION" };

export default function StudioPage() {
  redirect("/admin");
}
