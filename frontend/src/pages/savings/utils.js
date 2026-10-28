import { extractError } from "../../utils/errorHandler";

export function getErrorMessage(error, fallback) {
  return extractError(error, fallback);
}
