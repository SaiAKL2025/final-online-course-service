import { successResponse, optionsResponse, requireUser } from "../../../../lib/utils";

export async function OPTIONS() { return optionsResponse(); }
export async function GET(request) {
  const auth = requireUser(request);
  if (auth.error) return auth.error;
  return successResponse({ user: auth.user });
}
