import type { PublisherConnector } from "@/lib/publishers/types";
import { genericApiPublisher } from "@/lib/publishers/generic-api";
import { ghostPublisher } from "@/lib/publishers/ghost";
import { instagramPublisher } from "@/lib/publishers/instagram";
import { linkedinPublisher } from "@/lib/publishers/linkedin";
import { mediumPublisher } from "@/lib/publishers/medium";
import { notionPublisher } from "@/lib/publishers/notion";
import { shopifyBlogPublisher } from "@/lib/publishers/shopify-blog";
import { webflowPublisher } from "@/lib/publishers/webflow";
import { wordpressPublisher } from "@/lib/publishers/wordpress";
import { wordpressMcpPublisher } from "@/lib/publishers/wordpress-mcp";
import { xPublisher } from "@/lib/publishers/x";

const registry = new Map<string, PublisherConnector>(
  [
    wordpressPublisher,
    wordpressMcpPublisher,
    ghostPublisher,
    mediumPublisher,
    instagramPublisher,
    xPublisher,
    linkedinPublisher,
    webflowPublisher,
    notionPublisher,
    shopifyBlogPublisher,
    genericApiPublisher,
  ].map((publisher) => [publisher.name, publisher]),
);

export function getPublisher(name: string) {
  return registry.get(name);
}

export function listPublishers() {
  return [...registry.values()];
}
