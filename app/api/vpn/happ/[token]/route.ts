import { GET as getSubscription } from "../../subscription/[token]/route";

type Context = { params: Promise<{ token: string }> };

export const dynamic = "force-dynamic";

export function GET(request: Request, context: Context) {
  return getSubscription(request, context);
}
