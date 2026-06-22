import { draftMode } from "next/headers";
import { redirect } from "next/navigation";

// Turns off draft mode and returns to the public home.
export async function GET() {
  const dm = await draftMode();
  dm.disable();
  redirect("/");
}
