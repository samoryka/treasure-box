import rss from "@astrojs/rss";
import type { APIContext } from "astro";

type Post = {
  frontmatter: {
    title: string;
    publicationDate: string | Date;
    description?: string;
    image: {
      src: string;
      alt: string;
    };
  };
  url: string;
};

const imageAssets = import.meta.glob<string>(
  "/src/assets/**/*.{jpeg,jpg,png,gif}",
  { eager: true, query: "?url", import: "default" },
);

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[character];
  });

export function GET(context: APIContext) {
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
    site: context.site,
    items: posts.map(({ frontmatter, url }) => {
      const imageUrl = imageAssets[frontmatter.image.src];

      if (!imageUrl) {
        throw new Error(
          `RSS cover image not found for "${frontmatter.title}": ${frontmatter.image.src}`,
        );
      }

      return {
        title: frontmatter.title,
        description: frontmatter.description ?? frontmatter.image.alt,
        link: url,
        pubDate: new Date(String(frontmatter.publicationDate)),
        content: `<img src="${escapeHtml(new URL(imageUrl, context.site).href)}" alt="${escapeHtml(frontmatter.image.alt)}" />`,
      };
    }),
  });
}
