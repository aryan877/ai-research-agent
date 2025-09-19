describe("Health Check", () => {
  it("should create valid health response", () => {
    const healthResponse = {
      status: "OK",
      timestamp: new Date().toISOString(),
    };

    expect(healthResponse.status).toBe("OK");
    expect(healthResponse.timestamp).toBeDefined();
    expect(new Date(healthResponse.timestamp)).toBeInstanceOf(Date);
  });

  it("should validate timestamp format", () => {
    const timestamp = new Date().toISOString();
    expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });
});
