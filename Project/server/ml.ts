import { LogEntry, Anomaly, SystemSettings } from './db.js';

interface FeatureVector {
  entry: LogEntry;
  features: number[]; // [responseTime, isError, isAuthFail, urlLength, urlEntropy, methodCode, ipFreq]
}

interface IsolationTreeNode {
  splitAttribute?: number;
  splitValue?: number;
  left?: IsolationTreeNode;
  right?: IsolationTreeNode;
  size: number;
  isLeaf: boolean;
}

export class IsolationForest {
  private trees: IsolationTreeNode[] = [];
  private numTrees: number;
  private maxSamples: number;
  private maxDepth: number;

  constructor(numTrees = 50, maxSamples = 256) {
    this.numTrees = numTrees;
    this.maxSamples = maxSamples;
    this.maxDepth = Math.ceil(Math.log2(Math.max(maxSamples, 2)));
  }

  fit(data: number[][]) {
    this.trees = [];
    if (data.length === 0) return;

    const sampleSize = Math.min(this.maxSamples, data.length);
    for (let i = 0; i < this.numTrees; i++) {
      // Subsample data
      const sample = this.subsample(data, sampleSize);
      const tree = this.buildTree(sample, 0, this.maxDepth);
      this.trees.push(tree);
    }
  }

  private subsample(data: number[][], size: number): number[][] {
    const shuffled = [...data];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, size);
  }

  private buildTree(data: number[][], currentDepth: number, maxDepth: number): IsolationTreeNode {
    if (currentDepth >= maxDepth || data.length <= 1) {
      return { size: data.length, isLeaf: true };
    }

    const numFeatures = data[0].length;
    // Pick random feature
    const featureIdx = Math.floor(Math.random() * numFeatures);

    let min = Infinity;
    let max = -Infinity;
    for (const row of data) {
      const val = row[featureIdx];
      if (val < min) min = val;
      if (val > max) max = val;
    }

    if (min === max) {
      return { size: data.length, isLeaf: true };
    }

    // Pick random split point between min and max
    const splitValue = min + Math.random() * (max - min);

    const leftData = data.filter(row => row[featureIdx] < splitValue);
    const rightData = data.filter(row => row[featureIdx] >= splitValue);

    if (leftData.length === 0 || rightData.length === 0) {
      return { size: data.length, isLeaf: true };
    }

    return {
      splitAttribute: featureIdx,
      splitValue,
      left: this.buildTree(leftData, currentDepth + 1, maxDepth),
      right: this.buildTree(rightData, currentDepth + 1, maxDepth),
      size: data.length,
      isLeaf: false
    };
  }

  private pathLength(x: number[], node: IsolationTreeNode, currentDepth: number): number {
    if (node.isLeaf || !node.left || !node.right || node.splitAttribute === undefined || node.splitValue === undefined) {
      return currentDepth + this.c(node.size);
    }

    if (x[node.splitAttribute] < node.splitValue) {
      return this.pathLength(x, node.left, currentDepth + 1);
    } else {
      return this.pathLength(x, node.right, currentDepth + 1);
    }
  }

  // Average path length of unsuccessful search in BST: c(n) = 2(ln(n-1) + 0.5772156649) - (2(n-1)/n)
  private c(n: number): number {
    if (n <= 1) return 0;
    if (n === 2) return 1;
    const eulerGamma = 0.5772156649;
    return 2 * (Math.log(n - 1) + eulerGamma) - (2 * (n - 1) / n);
  }

  predictScore(x: number[], n: number): number {
    if (this.trees.length === 0) return 0.5;
    let totalPath = 0;
    for (const tree of this.trees) {
      totalPath += this.pathLength(x, tree, 0);
    }
    const avgPath = totalPath / this.trees.length;
    const cn = this.c(n);
    if (cn === 0) return 0.5;
    // Anomaly score: s(x, n) = 2^(- E(h(x)) / c(n))
    return Math.pow(2, -(avgPath / cn));
  }
}

export class MLAnomalyEngine {
  static analyze(entries: LogEntry[], logFileId: string, settings: SystemSettings): Anomaly[] {
    if (entries.length < 3) {
      return []; // Not enough data for statistical ML, fallback gracefully
    }

    // 1. Extract feature vectors
    const vectors = this.extractFeatures(entries);
    const rawMatrix = vectors.map(v => v.features);

    // 2. Train Isolation Forest
    const iForest = new IsolationForest(40, Math.min(128, entries.length));
    iForest.fit(rawMatrix);

    const mlAnomalies: Anomaly[] = [];
    const threshold = settings.anomaly_threshold || 0.65;

    // 3. Score each entry
    vectors.forEach((item) => {
      const score = iForest.predictScore(item.features, entries.length);

      // Feature anomaly triggers
      if (score >= threshold) {
        item.entry.is_anomalous = true;
        const confidence = Math.min(99, Math.round(score * 100));

        // Determine severity based on score & threshold
        let severity: 'critical' | 'high' | 'medium' | 'low' = 'low';
        if (score >= (settings.critical_threshold || 0.90)) {
          severity = 'critical';
        } else if (score >= (settings.high_threshold || 0.75)) {
          severity = 'high';
        } else if (score >= (settings.medium_threshold || 0.60)) {
          severity = 'medium';
        }

        // Determine likely root cause from high feature components
        const f = item.features;
        let inferredType = 'Multivariate Statistical Anomaly';
        let detail = 'Unsupervised Isolation Forest flagged this event with high isolation index.';

        if (f[0] > 1000) {
          inferredType = 'Latency / Slowloris Probe Anomaly';
          detail = `Abnormally high response latency (${f[0]}ms) detected by ML model.`;
        } else if (f[4] > 4.2) {
          inferredType = 'High Entropy Payload Anomaly';
          detail = `High Shannon entropy in request URI (${f[4].toFixed(2)} bits), indicative of obfuscated shellcode or binary injection.`;
        } else if (f[6] > 15) {
          inferredType = 'Volumetric Request Spike Anomaly';
          detail = `High localized burst frequency (${f[6]} requests/window) from single client IP.`;
        } else if (f[1] === 1) {
          inferredType = 'Abnormal Error State Anomaly';
          detail = `Unexpected 5xx/4xx error state isolated in ML feature distribution.`;
        }

        mlAnomalies.push({
          id: `ANM-ML-${Math.floor(1000 + Math.random() * 9000)}-${Date.now().toString(36)}`,
          log_file_id: logFileId,
          log_entry_id: item.entry.id,
          anomaly_type: inferredType,
          severity,
          confidence_score: confidence,
          anomaly_score: parseFloat(score.toFixed(3)),
          description: detail,
          recommended_action: 'Perform deep packet/trace analysis on endpoint, verify client authorization tokens, and cross-reference with perimeter IDS.',
          status: 'open',
          source_ip: item.entry.ip_address,
          username: item.entry.username,
          request_url: item.entry.request_url,
          detected_at: new Date().toISOString(),
          detection_method: 'ml',
          ml_features: {
            isolationScore: parseFloat(score.toFixed(3)),
            responseTimeMs: f[0],
            urlEntropy: parseFloat(f[4].toFixed(2)),
            ipBurstCount: f[6]
          }
        });
      }
    });

    return mlAnomalies;
  }

  private static extractFeatures(entries: LogEntry[]): FeatureVector[] {
    const ipCounts: Record<string, number> = {};
    entries.forEach(e => {
      ipCounts[e.ip_address] = (ipCounts[e.ip_address] || 0) + 1;
    });

    return entries.map(entry => {
      const responseTime = entry.response_time || 20;
      const isError = entry.status_code >= 400 ? 1 : 0;
      const isAuthFail = entry.status_code === 401 || entry.status_code === 403 ? 1 : 0;
      const urlLength = entry.request_url.length;
      const urlEntropy = this.calculateEntropy(entry.request_url);
      const methodCode = this.encodeMethod(entry.http_method);
      const ipFreq = ipCounts[entry.ip_address] || 1;

      return {
        entry,
        features: [responseTime, isError, isAuthFail, urlLength, urlEntropy, methodCode, ipFreq]
      };
    });
  }

  private static calculateEntropy(str: string): number {
    if (!str) return 0;
    const len = str.length;
    const frequencies: Record<string, number> = {};
    for (let i = 0; i < len; i++) {
      const char = str[i];
      frequencies[char] = (frequencies[char] || 0) + 1;
    }
    let entropy = 0;
    for (const char in frequencies) {
      const p = frequencies[char] / len;
      entropy -= p * Math.log2(p);
    }
    return entropy;
  }

  private static encodeMethod(method: string): number {
    switch (method.toUpperCase()) {
      case 'GET': return 1;
      case 'POST': return 2;
      case 'PUT': return 3;
      case 'DELETE': return 4;
      case 'PATCH': return 5;
      case 'HEAD': return 6;
      case 'OPTIONS': return 7;
      default: return 9;
    }
  }
}
