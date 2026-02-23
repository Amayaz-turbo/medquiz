export interface AppConfig {
  nodeEnv: string;
  port: number;
  databaseUrl: string;
  accessTokenSecret: string;
  accessTokenTtl: string;
  refreshTokenSecret: string;
  refreshTokenTtlDays: number;
  corsOrigins: string[];
  duelExpirationJobEnabled: boolean;
  duelExpirationIntervalSeconds: number;
  metricsEnabled: boolean;
  metricsAuthToken: string | null;
  sloAvailabilityTargetPct: number;
  sloP95LatencyMs: number;
  sloWindowDays: number;
  healthDbTimeoutMs: number;
  openTextEditorUserIds: string[];
  trainingContentEditorUserIds: string[];
}

export function getAppConfig(): AppConfig {
  const uuidV4Regex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const nodeEnv = process.env.NODE_ENV ?? "development";
  const port = Number(process.env.PORT ?? "8080");
  if (!Number.isFinite(port) || port <= 0 || port > 65535) {
    throw new Error("PORT must be a valid TCP port");
  }

  const refreshDays = Number(process.env.REFRESH_TOKEN_TTL_DAYS ?? "30");
  if (!Number.isFinite(refreshDays) || refreshDays <= 0 || refreshDays > 365) {
    throw new Error("REFRESH_TOKEN_TTL_DAYS must be in range 1..365");
  }
  const duelExpirationIntervalSeconds = Number(process.env.DUEL_EXPIRATION_INTERVAL_SECONDS ?? "300");
  if (
    !Number.isFinite(duelExpirationIntervalSeconds) ||
    duelExpirationIntervalSeconds < 30 ||
    duelExpirationIntervalSeconds > 3600
  ) {
    throw new Error("DUEL_EXPIRATION_INTERVAL_SECONDS must be in range 30..3600");
  }
  const sloAvailabilityTargetPct = Number(process.env.SLO_AVAILABILITY_TARGET_PCT ?? "99.9");
  if (
    !Number.isFinite(sloAvailabilityTargetPct) ||
    sloAvailabilityTargetPct < 90 ||
    sloAvailabilityTargetPct >= 100
  ) {
    throw new Error("SLO_AVAILABILITY_TARGET_PCT must be in range 90..99.999");
  }
  const sloP95LatencyMs = Number(process.env.SLO_P95_LATENCY_MS ?? "300");
  if (!Number.isFinite(sloP95LatencyMs) || sloP95LatencyMs < 10 || sloP95LatencyMs > 20_000) {
    throw new Error("SLO_P95_LATENCY_MS must be in range 10..20000");
  }
  const sloWindowDays = Number(process.env.SLO_WINDOW_DAYS ?? "30");
  if (!Number.isFinite(sloWindowDays) || sloWindowDays < 1 || sloWindowDays > 90) {
    throw new Error("SLO_WINDOW_DAYS must be in range 1..90");
  }
  const healthDbTimeoutMs = Number(process.env.HEALTH_DB_TIMEOUT_MS ?? "1500");
  if (!Number.isFinite(healthDbTimeoutMs) || healthDbTimeoutMs < 100 || healthDbTimeoutMs > 15_000) {
    throw new Error("HEALTH_DB_TIMEOUT_MS must be in range 100..15000");
  }

  const databaseUrl = process.env.DATABASE_URL;
  const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
  const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;
  if (!databaseUrl || !accessTokenSecret || !refreshTokenSecret) {
    throw new Error("DATABASE_URL, ACCESS_TOKEN_SECRET and REFRESH_TOKEN_SECRET are required");
  }

  const corsOrigins = (process.env.CORS_ORIGIN ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
  const metricsEnabled = (process.env.METRICS_ENABLED ?? "true").toLowerCase() !== "false";
  const rawMetricsAuthToken = process.env.METRICS_AUTH_TOKEN?.trim() ?? "";
  const metricsAuthToken = rawMetricsAuthToken.length > 0 ? rawMetricsAuthToken : null;
  if (metricsAuthToken && metricsAuthToken.length < 16) {
    throw new Error("METRICS_AUTH_TOKEN must be at least 16 characters when set");
  }
  if (metricsEnabled && nodeEnv === "production" && !metricsAuthToken) {
    throw new Error("METRICS_AUTH_TOKEN is required in production when metrics are enabled");
  }
  const openTextEditorUserIds = (process.env.OPEN_TEXT_EDITOR_USER_IDS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
  for (const userId of openTextEditorUserIds) {
    if (!uuidV4Regex.test(userId)) {
      throw new Error("OPEN_TEXT_EDITOR_USER_IDS must contain valid UUID v4 values");
    }
  }
  const trainingContentEditorUserIds = (process.env.TRAINING_CONTENT_EDITOR_USER_IDS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
  for (const userId of trainingContentEditorUserIds) {
    if (!uuidV4Regex.test(userId)) {
      throw new Error("TRAINING_CONTENT_EDITOR_USER_IDS must contain valid UUID v4 values");
    }
  }

  return {
    nodeEnv,
    port,
    databaseUrl,
    accessTokenSecret,
    accessTokenTtl: process.env.ACCESS_TOKEN_TTL ?? "15m",
    refreshTokenSecret,
    refreshTokenTtlDays: refreshDays,
    corsOrigins,
    duelExpirationJobEnabled: (process.env.DUEL_EXPIRATION_JOB_ENABLED ?? "true").toLowerCase() !== "false",
    duelExpirationIntervalSeconds,
    metricsEnabled,
    metricsAuthToken,
    sloAvailabilityTargetPct,
    sloP95LatencyMs,
    sloWindowDays,
    healthDbTimeoutMs,
    openTextEditorUserIds,
    trainingContentEditorUserIds
  };
}
