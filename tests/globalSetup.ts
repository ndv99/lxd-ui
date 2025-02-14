import { chromium, FullConfig } from "@playwright/test";
import { INSTANCE_NAME } from "./constants";
import { createInstance, hasInstance } from "./instance-helpers";

async function globalSetup(config: FullConfig) {
  const browser = await chromium.launch();
  const page = await browser.newPage(config.projects[0].use);
  if (!(await hasInstance(page, INSTANCE_NAME))) {
    await createInstance(page, INSTANCE_NAME);
  }
  await browser.close();
}

export default globalSetup;
