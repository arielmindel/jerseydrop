import { redirect } from "next/navigation";

// תקנון אתר = תנאי שימוש (alias). מפנה ל-/terms.
export default function PolicyAlias() {
  redirect("/terms");
}
