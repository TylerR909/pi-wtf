import { useEffect } from "react";
import { watchDevtools } from "../utils/devtools";

export function useDevtoolsQuip() {
  useEffect(() => watchDevtools(), []);
}
