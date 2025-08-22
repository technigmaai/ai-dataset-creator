import { redirect } from "react-router";
import type { Route } from "./+types/_index";

export function loader({}: Route.LoaderArgs) {
  return redirect("/home/simple");
}
