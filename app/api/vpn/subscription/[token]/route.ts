import { timingSafeEqual } from "node:crypto";

type Context = { params: Promise<{ token: string }> };

export const dynamic = "force-dynamic";

function tokenMatches(actual: string, expected: string) {
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);

  return (
    actualBuffer.length === expectedBuffer.length &&
    timingSafeEqual(actualBuffer, expectedBuffer)
  );
}

export async function GET(_request: Request, context: Context) {
  const expectedToken = process.env.VPN_SUBSCRIPTION_TOKEN?.trim();
  const serverLink = process.env.VPN_VLESS_LINK?.trim();
  const { token } = await context.params;

  if (!expectedToken || !serverLink || !tokenMatches(token, expectedToken)) {
    return new Response("Not found", { status: 404 });
  }

  const title = process.env.VPN_SUBSCRIPTION_TITLE?.trim() || "ВПН от Вадима";
  const encodedTitle = Buffer.from(title, "utf8").toString("base64");
  const body = [
    `#profile-title: ${encodedTitle}`,
    "#profile-update-interval: 12",
    serverLink,
    "",
  ].join("\n");

  return new Response(body, {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Disposition": 'attachment; filename="vadim-vpn.txt"',
      "Content-Type": "text/plain; charset=utf-8",
      "profile-title": encodedTitle,
      "profile-update-interval": "12",
    },
  });
}
