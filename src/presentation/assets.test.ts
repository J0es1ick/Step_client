import { assetUrl } from "./assets";
test("media resolve inside a GitHub project path while external images stay intact", () => {
  const previous = process.env.PUBLIC_URL;
  try {
    process.env.PUBLIC_URL = "/shoes_store_client/";
    expect(assetUrl("/media/step-hero.png")).toBe(
      "/shoes_store_client/media/step-hero.png",
    );
    expect(assetUrl("https://images.example/test.png")).toBe(
      "https://images.example/test.png",
    );
    process.env.PUBLIC_URL = "";
    expect(assetUrl("/media/step-hero.png")).toBe("/media/step-hero.png");
  } finally {
    if (previous === undefined) delete process.env.PUBLIC_URL;
    else process.env.PUBLIC_URL = previous;
  }
});
