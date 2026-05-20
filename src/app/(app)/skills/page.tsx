import { redirect } from "next/navigation";

// Skills sidebar item → opens the directory view (Courses / Combos / Commands / Practice)
// with the software filter on the left, matching the vanilla app.
export default function SkillsPage() {
  redirect("/learn");
}
