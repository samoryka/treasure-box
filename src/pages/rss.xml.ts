import rss from "@astrojs/rss";
import { getImage } from "astro:assets";
import type { APIContext } from "astro";

type Post = {
  frontmatter: {
    title: string;
    publicationDate: string | Date;
    description?: string;
    image: { src: string; alt: string };
    gallery?: { src: string; alt: string }[];
  };
  url: string;
  compiledContent: () => Promise<string>;
};

const postImages = {
  ...import.meta.glob<{ default: ImageMetadata }>(
    "/src/assets/objects/*/*.{jpeg,jpg,png,gif}",
    { eager: true },
  ),
  ...import.meta.glob<{ default: ImageMetadata }>(
    "/src/assets/images/*.{jpeg,jpg,png,gif}",
    { eager: true },
  ),
};

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

export async function GET(context: APIContext) {
  const site = context.site;
  if (!site) {
    throw new Error("The site URL is required to include RSS images");
  }

  const renderImage = async ({ src, alt }: Post["frontmatter"]["image"]) => {
    const image = postImages[src]?.default;
    if (!image) {
      throw new Error(`RSS image was not found: ${src}`);
    }

    const optimizedImage = await getImage({ src: image });
    const imageUrl = new URL(optimizedImage.src, site).href;
    const attributes = `src="${escapeHtml(imageUrl)}" alt="${escapeHtml(alt)}"`;
    return `<figure><img ${attributes}></figure>`;
  };

  const posts = [
    ...Object.values(import.meta.glob<Post>("./objects/*.md", { eager: true })),
    ...Object.values(import.meta.glob<Post>("./images/*.md", { eager: true })),
  ].sort(
    (a, b) =>
      Date.parse(String(b.frontmatter.publicationDate)) -
      Date.parse(String(a.frontmatter.publicationDate)),
  );

  return rss({
    title: "Samory's Treasure Box",
    description: "Recent projects by Samory Ka.",
    site,
    items: await Promise.all(
      posts.map(async (post) => ({
        title: post.frontmatter.title,
        description: post.frontmatter.description,
        link: post.url,
        pubDate: new Date(String(post.frontmatter.publicationDate)),
        content: [
          await renderImage(post.frontmatter.image),
          await post.compiledContent(),
          ...(await Promise.all(
            (post.frontmatter.gallery ?? []).map(renderImage),
          )),
        ].join("\n"),
      })),
    ),
  });
}
