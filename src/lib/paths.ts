/**
 * The tool is served under the Varahion site at this path (Next.js basePath).
 * Next.js prefixes <Link> and asset URLs itself; fetch() calls need withBase().
 */
export const BASE_PATH = "/tools/hire-an-agent";

export function withBase(path: string): string {
  return `${BASE_PATH}${path}`;
}
