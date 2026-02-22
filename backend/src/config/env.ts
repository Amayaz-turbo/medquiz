import { AppConfig, getAppConfig } from "./app-config";

let cachedConfig: AppConfig | null = null;

export function env(): AppConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  cachedConfig = getAppConfig();
  return cachedConfig;
}
