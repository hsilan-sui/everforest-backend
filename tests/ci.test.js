describe("CI Pipeline Test", () => {
  it("should pass basic arithmetic", () => {
    expect(2 + 2).toBe(4);
  });

  it("should handle string concatenation", () => {
    expect("CI" + " Test").toBe("CI Test");
  });
});
