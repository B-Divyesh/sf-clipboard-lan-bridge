import { describe, expect, it } from "vitest";
import { byteLength, remainingLabel, summarize, validateTransfer } from "./domain";

describe("transfer safety", () => {
  it("rejects empty and oversized text", () => {
    expect(validateTransfer("  ")).toContain("Enter");
    expect(validateTransfer("a".repeat(32_769))).toContain("32 KB");
    expect(validateTransfer("https://example.com")).toBeNull();
  });

  it("counts UTF-8 bytes rather than code points", () => {
    expect(byteLength("🚂")).toBe(4);
  });

  it("formats expiry and summaries", () => {
    expect(remainingLabel(61_000, 0)).toBe("2m left");
    expect(summarize("a\n b", 10)).toBe("a b");
  });
});
