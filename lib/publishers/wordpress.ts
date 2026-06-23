export const wordpressPublisher = {
  name: "wordpress",
  async validateConfig() {
    return { ok: false, reason: "Not implemented in V1" };
  },
  async publish() {
    throw new Error("WordPress publishing is reserved for phase 2.");
  },
};
