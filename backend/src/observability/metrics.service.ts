import { Injectable } from "@nestjs/common";
import { env } from "../config/env";

interface HttpRequestCounterEntry {
  method: string;
  route: string;
  statusClass: string;
  count: number;
}

interface HttpDurationHistogramEntry {
  method: string;
  route: string;
  bucketCounts: number[];
  sumMs: number;
  count: number;
}

export interface SloSnapshot {
  sample: {
    startedAt: string;
    uptimeSeconds: number;
    totalRequests: number;
    serverErrorCount: number;
  };
  targets: {
    availabilityPct: number;
    p95LatencyMs: number;
    windowDays: number;
  };
  actual: {
    availabilityPct: number;
    p95LatencyMs: number;
  };
  objectives: {
    availabilityMet: boolean;
    latencyMet: boolean;
    overallMet: boolean;
  };
  errorBudget: {
    remainingPct: number;
  };
}

@Injectable()
export class MetricsService {
  private readonly cfg = env();
  private readonly startedAt = Date.now();

  private readonly durationBucketsMs = [25, 50, 100, 250, 500, 1000, 2500, 5000];

  private readonly requestCounters = new Map<string, HttpRequestCounterEntry>();
  private readonly durationHistograms = new Map<string, HttpDurationHistogramEntry>();
  private readonly dependencyUp = new Map<string, number>();

  private readonly globalDurationBucketCounts = new Array(this.durationBucketsMs.length + 1).fill(0);
  private totalDurationCount = 0;
  private totalDurationSumMs = 0;

  private inFlightRequests = 0;
  private totalRequests = 0;
  private totalServerErrors = 0;

  incrementInFlightRequests(): void {
    if (!this.cfg.metricsEnabled) {
      return;
    }
    this.inFlightRequests += 1;
  }

  decrementInFlightRequests(): void {
    if (!this.cfg.metricsEnabled) {
      return;
    }
    this.inFlightRequests = Math.max(0, this.inFlightRequests - 1);
  }

  setDependencyStatus(name: string, isUp: boolean): void {
    if (!this.cfg.metricsEnabled) {
      return;
    }
    this.dependencyUp.set(name, isUp ? 1 : 0);
  }

  observeHttpRequest(params: {
    method: string;
    route: string;
    statusCode: number;
    durationMs: number;
  }): void {
    if (!this.cfg.metricsEnabled) {
      return;
    }

    const method = this.normalizeMethod(params.method);
    const route = this.normalizeRoute(params.route);
    const statusClass = this.statusClass(params.statusCode);
    const durationMs = Number.isFinite(params.durationMs) ? Math.max(0, params.durationMs) : 0;

    const counterKey = `${method}|${route}|${statusClass}`;
    const counter = this.requestCounters.get(counterKey) ?? {
      method,
      route,
      statusClass,
      count: 0
    };
    counter.count += 1;
    this.requestCounters.set(counterKey, counter);

    const histogramKey = `${method}|${route}`;
    const histogram = this.durationHistograms.get(histogramKey) ?? {
      method,
      route,
      bucketCounts: new Array(this.durationBucketsMs.length + 1).fill(0),
      sumMs: 0,
      count: 0
    };
    this.incrementHistogramBuckets(histogram.bucketCounts, durationMs);
    histogram.sumMs += durationMs;
    histogram.count += 1;
    this.durationHistograms.set(histogramKey, histogram);

    this.incrementHistogramBuckets(this.globalDurationBucketCounts, durationMs);
    this.totalDurationCount += 1;
    this.totalDurationSumMs += durationMs;

    this.totalRequests += 1;
    if (params.statusCode >= 500) {
      this.totalServerErrors += 1;
    }
  }

  getSloSnapshot(): SloSnapshot {
    const availabilityRatio =
      this.totalRequests === 0
        ? 1
        : (this.totalRequests - this.totalServerErrors) / this.totalRequests;
    const actualAvailabilityPct = this.round(availabilityRatio * 100, 4);
    const actualP95LatencyMs = this.round(
      this.estimatePercentileMs(this.globalDurationBucketCounts, this.totalDurationCount, 0.95),
      2
    );

    const targetAvailabilityRatio = this.cfg.sloAvailabilityTargetPct / 100;
    const allowedErrors = this.totalRequests * (1 - targetAvailabilityRatio);
    const remainingErrorBudget =
      allowedErrors <= 0
        ? this.totalServerErrors === 0
          ? 100
          : 0
        : Math.max(0, ((allowedErrors - this.totalServerErrors) / allowedErrors) * 100);

    const availabilityMet = availabilityRatio >= targetAvailabilityRatio;
    const latencyMet = actualP95LatencyMs <= this.cfg.sloP95LatencyMs;

    return {
      sample: {
        startedAt: new Date(this.startedAt).toISOString(),
        uptimeSeconds: this.round(process.uptime(), 2),
        totalRequests: this.totalRequests,
        serverErrorCount: this.totalServerErrors
      },
      targets: {
        availabilityPct: this.cfg.sloAvailabilityTargetPct,
        p95LatencyMs: this.cfg.sloP95LatencyMs,
        windowDays: this.cfg.sloWindowDays
      },
      actual: {
        availabilityPct: actualAvailabilityPct,
        p95LatencyMs: actualP95LatencyMs
      },
      objectives: {
        availabilityMet,
        latencyMet,
        overallMet: availabilityMet && latencyMet
      },
      errorBudget: {
        remainingPct: this.round(remainingErrorBudget, 2)
      }
    };
  }

  renderPrometheus(): string {
    if (!this.cfg.metricsEnabled) {
      return "# metrics disabled\n";
    }

    const lines: string[] = [];
    lines.push("# HELP http_requests_total Total HTTP requests handled by the API.");
    lines.push("# TYPE http_requests_total counter");
    const counters = Array.from(this.requestCounters.values()).sort((a, b) =>
      `${a.method}|${a.route}|${a.statusClass}`.localeCompare(
        `${b.method}|${b.route}|${b.statusClass}`
      )
    );
    for (const row of counters) {
      lines.push(
        `http_requests_total${this.labels({
          method: row.method,
          route: row.route,
          status_class: row.statusClass
        })} ${row.count}`
      );
    }

    lines.push("# HELP http_requests_in_flight Current number of in-flight HTTP requests.");
    lines.push("# TYPE http_requests_in_flight gauge");
    lines.push(`http_requests_in_flight ${this.inFlightRequests}`);

    lines.push("# HELP http_request_duration_ms HTTP request latency histogram in milliseconds.");
    lines.push("# TYPE http_request_duration_ms histogram");
    const histograms = Array.from(this.durationHistograms.values()).sort((a, b) =>
      `${a.method}|${a.route}`.localeCompare(`${b.method}|${b.route}`)
    );
    for (const row of histograms) {
      for (let i = 0; i < this.durationBucketsMs.length; i += 1) {
        lines.push(
          `http_request_duration_ms_bucket${this.labels({
            method: row.method,
            route: row.route,
            le: String(this.durationBucketsMs[i])
          })} ${row.bucketCounts[i]}`
        );
      }
      lines.push(
        `http_request_duration_ms_bucket${this.labels({
          method: row.method,
          route: row.route,
          le: "+Inf"
        })} ${row.bucketCounts[row.bucketCounts.length - 1]}`
      );
      lines.push(
        `http_request_duration_ms_sum${this.labels({
          method: row.method,
          route: row.route
        })} ${this.round(row.sumMs, 3)}`
      );
      lines.push(
        `http_request_duration_ms_count${this.labels({
          method: row.method,
          route: row.route
        })} ${row.count}`
      );
    }

    lines.push("# HELP dependency_up Dependency health status (1=up,0=down).");
    lines.push("# TYPE dependency_up gauge");
    const dependencies = Array.from(this.dependencyUp.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    for (const [name, isUp] of dependencies) {
      lines.push(`dependency_up${this.labels({ dependency: name })} ${isUp}`);
    }

    const slo = this.getSloSnapshot();
    lines.push("# HELP api_slo_target_availability_ratio Target availability ratio.");
    lines.push("# TYPE api_slo_target_availability_ratio gauge");
    lines.push(`api_slo_target_availability_ratio ${this.round(slo.targets.availabilityPct / 100, 6)}`);

    lines.push("# HELP api_slo_target_latency_p95_ms Target p95 latency in milliseconds.");
    lines.push("# TYPE api_slo_target_latency_p95_ms gauge");
    lines.push(`api_slo_target_latency_p95_ms ${slo.targets.p95LatencyMs}`);

    lines.push("# HELP api_slo_actual_availability_ratio Current availability ratio.");
    lines.push("# TYPE api_slo_actual_availability_ratio gauge");
    lines.push(`api_slo_actual_availability_ratio ${this.round(slo.actual.availabilityPct / 100, 6)}`);

    lines.push("# HELP api_slo_actual_latency_p95_ms Current estimated p95 latency in milliseconds.");
    lines.push("# TYPE api_slo_actual_latency_p95_ms gauge");
    lines.push(`api_slo_actual_latency_p95_ms ${slo.actual.p95LatencyMs}`);

    lines.push("# HELP api_slo_error_budget_remaining_ratio Remaining error budget ratio.");
    lines.push("# TYPE api_slo_error_budget_remaining_ratio gauge");
    lines.push(`api_slo_error_budget_remaining_ratio ${this.round(slo.errorBudget.remainingPct / 100, 6)}`);

    lines.push("# HELP process_uptime_seconds Process uptime in seconds.");
    lines.push("# TYPE process_uptime_seconds gauge");
    lines.push(`process_uptime_seconds ${this.round(process.uptime(), 3)}`);

    lines.push("");
    return lines.join("\n");
  }

  private incrementHistogramBuckets(buckets: number[], durationMs: number): void {
    for (let i = 0; i < this.durationBucketsMs.length; i += 1) {
      if (durationMs <= this.durationBucketsMs[i]) {
        buckets[i] += 1;
      }
    }
    buckets[buckets.length - 1] += 1;
  }

  private estimatePercentileMs(
    bucketCounts: number[],
    totalCount: number,
    percentile: number
  ): number {
    if (totalCount <= 0) {
      return 0;
    }
    const targetCount = Math.max(1, Math.ceil(totalCount * percentile));
    for (let i = 0; i < bucketCounts.length; i += 1) {
      if (bucketCounts[i] >= targetCount) {
        if (i < this.durationBucketsMs.length) {
          return this.durationBucketsMs[i];
        }
        return this.durationBucketsMs[this.durationBucketsMs.length - 1];
      }
    }
    return this.durationBucketsMs[this.durationBucketsMs.length - 1];
  }

  private normalizeMethod(method: string): string {
    return method.trim().toUpperCase() || "UNKNOWN";
  }

  private normalizeRoute(route: string): string {
    const trimmed = route.trim();
    if (!trimmed) {
      return "/unknown";
    }
    const noQuery = trimmed.split("?")[0] ?? trimmed;
    return noQuery.startsWith("/") ? noQuery : `/${noQuery}`;
  }

  private statusClass(statusCode: number): string {
    if (!Number.isFinite(statusCode) || statusCode < 100) {
      return "unknown";
    }
    return `${Math.floor(statusCode / 100)}xx`;
  }

  private labels(values: Record<string, string>): string {
    const entries = Object.entries(values);
    if (entries.length === 0) {
      return "";
    }
    const raw = entries
      .map(([key, value]) => `${key}="${this.escapeLabelValue(value)}"`)
      .join(",");
    return `{${raw}}`;
  }

  private escapeLabelValue(value: string): string {
    return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/"/g, '\\"');
  }

  private round(value: number, fractionDigits: number): number {
    const factor = 10 ** fractionDigits;
    return Math.round(value * factor) / factor;
  }
}
