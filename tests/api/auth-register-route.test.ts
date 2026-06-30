import { describe, expect, it } from "vitest";

describe("POST /api/auth/register", () => {
  it("returns 400 instead of throwing when the payload is invalid", async () => {
    const { POST } = await import("@/app/api/auth/register/route");

    const request = new Request("http://localhost/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "",
        email: "usuario@teste.com",
        password: "123456",
      }),
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.ok).toBe(false);
    expect(payload.error).toBeTruthy();
  });
});
