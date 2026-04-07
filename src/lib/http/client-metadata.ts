export type ClientMetadata = {
  ipAddress?: string;
  userAgent?: string;
};

export function getClientMetadata(headers: Pick<Headers, "get">): ClientMetadata {
  return {
    ipAddress: getClientIp(headers),
    userAgent: headers.get("user-agent")?.slice(0, 512) || undefined,
  };
}

function getClientIp(headers: Pick<Headers, "get">) {
  const forwardedFor = headers.get("x-forwarded-for")?.split(",")[0]?.trim();

  if (forwardedFor) {
    return forwardedFor.slice(0, 128);
  }

  return headers.get("x-real-ip")?.slice(0, 128) || undefined;
}
