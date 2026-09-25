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

function withHappFragmentation(link: string) {
  const hashIndex = link.indexOf("#");
  const separator =
    hashIndex === -1 ? "#?" : link.slice(hashIndex).includes("?") ? "&" : "?";

  return `${link}${separator}fragment=50-100,5,tlshello,100-200`;
}

export async function GET(_request: Request, context: Context) {
  const expectedToken = process.env.VPN_SUBSCRIPTION_TOKEN?.trim();
  const serverLink = process.env.VPN_VLESS_LINK?.trim();
  const { token } = await context.params;

  if (!expectedToken || !serverLink || !tokenMatches(token, expectedToken)) {
    return new Response("Not found", { status: 404 });
  }

  const title = process.env.VPN_SUBSCRIPTION_TITLE?.trim() || "ВПН от Вадима";
  const happServerLink = withHappFragmentation(serverLink);
  const body = [
    `#profile-title: ${title}`,
    "#profile-update-interval: 12",
    "#subscription-ping-onopen-enabled: 1",
    "#ping-type: proxy",
    "#check-url-via-proxy: https://cp.cloudflare.com/generate_204",
    "#fragmentation-enable: 1",
    "#fragmentation-packets: tlshello",
    "#fragmentation-length: 50-100",
    "#fragmentation-interval: 5",
    "#fragmentation-maxsplit: 100-200",
    happServerLink,
    "",
  ].join("\n");

  return new Response(body, {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Disposition": 'attachment; filename="vadim-vpn.txt"',
      "Content-Type": "text/plain; charset=utf-8",
      "check-url-via-proxy": "https://cp.cloudflare.com/generate_204",
      "fragmentation-enable": "1",
      "fragmentation-interval": "5",
      "fragmentation-length": "50-100",
      "fragmentation-maxsplit": "100-200",
      "fragmentation-packets": "tlshello",
      "ping-type": "proxy",
      "profile-update-interval": "12",
      "subscription-ping-onopen-enabled": "1",
    },
  });
}
