import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { cn } from "../utils";

describe("cn utility function", () => {
  it("should merge class names correctly", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("should handle conditional classes", () => {
    expect(cn("foo", false && "bar", "baz")).toBe("foo baz");
  });

  it("should merge tailwind classes correctly", () => {
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
  });
});

describe("cn property tests", () => {
  it("should always return a string", () => {
    fc.assert(
      fc.property(fc.array(fc.string()), (inputs) => {
        const result = cn(...inputs);
        return typeof result === "string";
      }),
      { numRuns: 100 }
    );
  });
});
