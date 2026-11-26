import rss from "@astrojs/rss";
import type { APIContext } from "astro";

type Post = {
  frontmatter: {
    title: string;
    publicationDate: string | Date;
    description?: string;
  };
  url: string;
  compiledContent: () => Promise<string>;
};

export async function GET(context: APIContext) {
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
    items: await Promise.all(
      posts.map(async (post) => ({
        title: post.frontmatter.title,
        description: post.frontmatter.description,
        link: post.url,
        pubDate: new Date(String(post.frontmatter.publicationDate)),
        content: await post.compiledContent(),
      })),
    ),
  });
}
