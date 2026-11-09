export function instagramEmbedUrl(value) {
  try {
    const url = new URL(value);
    if (
      url.protocol !== 'https:' ||
      url.hostname !== 'www.instagram.com' ||
      url.username ||
      url.password ||
      url.port
    )
      return null;
    const m = url.pathname.match(/^\/(p|reel)\/([A-Za-z0-9_-]+)\/?$/);
    return m ? `https://www.instagram.com/${m[1]}/${m[2]}/embed/` : null;
  } catch {
    return null;
  }
}
