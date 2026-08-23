import { LogEntry } from './db.js';

export interface ParseResult {
  entries: LogEntry[];
  totalParsed: number;
  totalErrors: number;
  formatDetected: string;
}

export class LogParser {
  static parse(fileContent: string, logFileId: string, filename: string): ParseResult {
    const trimmed = fileContent.trim();
    if (!trimmed) {
      return { entries: [], totalParsed: 0, totalErrors: 0, formatDetected: 'empty' };
    }

    const lowerName = filename.toLowerCase();

    // 1. Try JSON (either JSON array or NDJSON)
    if (lowerName.endsWith('.json') || trimmed.startsWith('[') || trimmed.startsWith('{')) {
      const jsonResult = this.tryParseJson(trimmed, logFileId);
      if (jsonResult && jsonResult.entries.length > 0) {
        return jsonResult;
      }
    }

    // 2. Try CSV
    if (lowerName.endsWith('.csv') || (trimmed.includes(',') && trimmed.split('\n')[0].includes(','))) {
      const csvResult = this.tryParseCsv(trimmed, logFileId);
      if (csvResult && csvResult.entries.length > 0) {
        return csvResult;
      }
    }

    // 3. Line-by-line parsing for .log / .txt / syslog / web server
    return this.parseLineByLine(trimmed, logFileId);
  }

  private static tryParseJson(content: string, logFileId: string): ParseResult | null {
    try {
      // Check if it is a single JSON array
      if (content.startsWith('[')) {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          const entries: LogEntry[] = parsed.map((item, idx) => this.normalizeJsonItem(item, logFileId, idx));
          return {
            entries,
            totalParsed: entries.length,
            totalErrors: 0,
            formatDetected: 'JSON Array'
          };
        }
      }

      // Check NDJSON (Newline Delimited JSON)
      const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);
      const entries: LogEntry[] = [];
      let errors = 0;

      for (let i = 0; i < lines.length; i++) {
        try {
          const item = JSON.parse(lines[i]);
          entries.push(this.normalizeJsonItem(item, logFileId, i));
        } catch {
          errors++;
        }
      }

      if (entries.length > 0) {
        return {
          entries,
          totalParsed: entries.length,
          totalErrors: errors,
          formatDetected: 'NDJSON (Newline-Delimited JSON)'
        };
      }
    } catch {
      // Fallback
    }
    return null;
  }

  private static normalizeJsonItem(item: any, logFileId: string, idx: number): LogEntry {
    const timestamp = item.timestamp || item.time || item['@timestamp'] || item.date || new Date(Date.now() - (idx * 5000)).toISOString();
    const ip = item.ip || item.ip_address || item.client_ip || item.src_ip || item.remote_addr || '127.0.0.1';
    const username = item.username || item.user || item.auth_user || item.user_id || 'anonymous';
    const method = (item.method || item.http_method || item.verb || 'GET').toUpperCase();
    const url = item.url || item.path || item.request || item.uri || item.request_url || '/';
    const status = parseInt(item.status || item.status_code || item.code || item.http_status || '200', 10) || 200;
    const responseTime = parseFloat(item.response_time || item.duration || item.latency || item.time_taken || '25');
    const userAgent = item.user_agent || item.agent || item.client || 'Mozilla/5.0';
    const eventType = item.event_type || item.event || item.action || (status >= 400 ? 'ERROR' : 'ACCESS');
    const message = item.message || item.msg || item.description || `${method} ${url} ${status}`;

    return {
      id: `ent-${logFileId}-${idx + 1}-${Date.now().toString(36)}`,
      log_file_id: logFileId,
      timestamp: this.normalizeDate(timestamp),
      ip_address: ip,
      username,
      http_method: method,
      request_url: url,
      status_code: status,
      response_time: isNaN(responseTime) ? 25 : responseTime,
      user_agent: userAgent,
      event_type: eventType,
      message,
      is_anomalous: false,
      raw_line: JSON.stringify(item)
    };
  }

  private static tryParseCsv(content: string, logFileId: string): ParseResult | null {
    const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length < 2) return null;

    const headerLine = lines[0];
    const headers = this.parseCsvRow(headerLine).map(h => h.trim().toLowerCase().replace(/['"]/g, ''));

    // Check if headers look like log headers
    const hasLogHeaders = headers.some(h => ['ip', 'ip_address', 'timestamp', 'time', 'method', 'url', 'status', 'event'].includes(h));
    if (!hasLogHeaders && lines.length > 5) {
      // might be raw logs with commas
      return null;
    }

    const entries: LogEntry[] = [];
    let errors = 0;

    for (let i = 1; i < lines.length; i++) {
      const row = this.parseCsvRow(lines[i]);
      if (row.length === 0) continue;

      const obj: Record<string, string> = {};
      headers.forEach((h, colIdx) => {
        obj[h] = row[colIdx] || '';
      });

      try {
        const timestamp = obj.timestamp || obj.time || obj.datetime || obj.date || new Date(Date.now() - (i * 5000)).toISOString();
        const ip = obj.ip || obj.ip_address || obj.src_ip || obj.client_ip || '127.0.0.1';
        const username = obj.username || obj.user || obj.user_id || 'anonymous';
        const method = (obj.method || obj.http_method || 'GET').toUpperCase();
        const url = obj.url || obj.path || obj.uri || obj.request || '/';
        const status = parseInt(obj.status || obj.status_code || obj.code || '200', 10) || 200;
        const responseTime = parseFloat(obj.response_time || obj.latency || obj.duration || '30');
        const userAgent = obj.user_agent || obj.agent || 'Mozilla/5.0';
        const eventType = obj.event_type || obj.event || (status >= 400 ? 'ERROR' : 'ACCESS');
        const message = obj.message || obj.msg || `${method} ${url} status=${status}`;

        entries.push({
          id: `ent-${logFileId}-${i}-${Date.now().toString(36)}`,
          log_file_id: logFileId,
          timestamp: this.normalizeDate(timestamp),
          ip_address: ip,
          username,
          http_method: method,
          request_url: url,
          status_code: status,
          response_time: isNaN(responseTime) ? 30 : responseTime,
          user_agent: userAgent,
          event_type: eventType,
          message,
          is_anomalous: false,
          raw_line: lines[i]
        });
      } catch {
        errors++;
      }
    }

    return {
      entries,
      totalParsed: entries.length,
      totalErrors: errors,
      formatDetected: 'CSV'
    };
  }

  private static parseCsvRow(row: string): string[] {
    const result: string[] = [];
    let insideQuote = false;
    let current = '';

    for (let i = 0; i < row.length; i++) {
      const char = row[i];
      if (char === '"' || char === "'") {
        insideQuote = !insideQuote;
      } else if (char === ',' && !insideQuote) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  }

  private static parseLineByLine(content: string, logFileId: string): ParseResult {
    const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);
    const entries: LogEntry[] = [];
    let errors = 0;
    let formatDetected = 'Generic Web / Syslog';

    // Regex for Apache / Nginx Combined format:
    // 127.0.0.1 - user [10/Oct/2000:13:55:36 -0700] "GET /index.html HTTP/1.0" 200 2326 "referer" "user-agent"
    const combinedRegex = /^(\S+)\s+\S+\s+(\S+)\s+\[([^\]]+)\]\s+"([A-Z]+)\s+([^"]+?)\s*(?:HTTP\/[0-9.]+)?(?:")\s+(\d{3})\s+(\S+)(?:\s+"([^"]*)")?(?:\s+"([^"]*)")?/;

    // Syslog / Auth.log format:
    // Aug 23 01:23:45 hostname sshd[1234]: Failed password for invalid user root from 192.168.1.100 port 22 ssh2
    const syslogRegex = /^([A-Za-z]{3}\s+\d+\s+\d+:\d+:\d+)\s+(\S+)\s+([^:]+):\s+(.*)$/;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      try {
        const combinedMatch = line.match(combinedRegex);
        if (combinedMatch) {
          formatDetected = 'Apache / Nginx Combined Log';
          const ip = combinedMatch[1];
          const username = combinedMatch[2] === '-' ? 'anonymous' : combinedMatch[2];
          const rawDate = combinedMatch[3];
          const method = combinedMatch[4];
          const url = combinedMatch[5];
          const status = parseInt(combinedMatch[6], 10);
          const bytes = parseInt(combinedMatch[7], 10) || 0;
          const userAgent = combinedMatch[9] || 'Mozilla/5.0';

          entries.push({
            id: `ent-${logFileId}-${i + 1}-${Date.now().toString(36)}`,
            log_file_id: logFileId,
            timestamp: this.normalizeDate(rawDate),
            ip_address: ip,
            username,
            http_method: method,
            request_url: url,
            status_code: status,
            response_time: Math.floor(Math.random() * 80) + 15,
            user_agent: userAgent,
            event_type: status >= 500 ? 'SERVER_ERROR' : status >= 400 ? 'CLIENT_ERROR' : 'ACCESS',
            message: `${method} ${url} returned HTTP ${status} (${bytes} bytes)`,
            is_anomalous: false,
            raw_line: line
          });
          continue;
        }

        const syslogMatch = line.match(syslogRegex);
        if (syslogMatch) {
          formatDetected = 'Syslog / Linux Auth Log';
          const rawDate = syslogMatch[1];
          const service = syslogMatch[3];
          const message = syslogMatch[4];

          // Extract IP if present
          const ipMatch = message.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/);
          const ip = ipMatch ? ipMatch[0] : '127.0.0.1';

          // Extract user
          const userMatch = message.match(/(?:for|user|by)\s+([a-zA-Z0-9_\-]+)/i);
          const user = userMatch ? userMatch[1] : 'system';

          const isAuthFail = message.toLowerCase().includes('failed password') || message.toLowerCase().includes('authentication failure');
          const isAccepted = message.toLowerCase().includes('accepted password') || message.toLowerCase().includes('session opened');

          entries.push({
            id: `ent-${logFileId}-${i + 1}-${Date.now().toString(36)}`,
            log_file_id: logFileId,
            timestamp: this.normalizeDate(rawDate),
            ip_address: ip,
            username: user,
            http_method: isAuthFail ? 'POST' : 'GET',
            request_url: `/system/${service.replace(/\[\d+\]/, '')}`,
            status_code: isAuthFail ? 401 : isAccepted ? 200 : 200,
            response_time: 15,
            user_agent: service,
            event_type: isAuthFail ? 'AUTH_FAILED' : isAccepted ? 'AUTH_SUCCESS' : 'SYSTEM_EVENT',
            message: message,
            is_anomalous: false,
            raw_line: line
          });
          continue;
        }

        // Generic fallback parser: extract IP, timestamp, and status if available
        const ipMatch = line.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/);
        const ip = ipMatch ? ipMatch[0] : '127.0.0.1';

        const statusMatch = line.match(/\b(200|201|204|301|302|400|401|403|404|500|502|503)\b/);
        const status = statusMatch ? parseInt(statusMatch[0], 10) : 200;

        const methodMatch = line.match(/\b(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)\b/i);
        const method = methodMatch ? methodMatch[0].toUpperCase() : 'GET';

        const urlMatch = line.match(/(https?:\/\/[^\s]+|\/[a-zA-Z0-9_.\-\/?=&%#+]*)/);
        const url = urlMatch ? urlMatch[0] : '/';

        entries.push({
          id: `ent-${logFileId}-${i + 1}-${Date.now().toString(36)}`,
          log_file_id: logFileId,
          timestamp: new Date(Date.now() - (lines.length - i) * 10000).toISOString(),
          ip_address: ip,
          username: 'anonymous',
          http_method: method,
          request_url: url,
          status_code: status,
          response_time: 30,
          user_agent: 'GenericLogParser',
          event_type: status >= 500 ? 'SERVER_ERROR' : status >= 400 ? 'CLIENT_ERROR' : 'EVENT',
          message: line.length > 200 ? line.substring(0, 200) + '...' : line,
          is_anomalous: false,
          raw_line: line
        });
      } catch {
        errors++;
      }
    }

    return {
      entries,
      totalParsed: entries.length,
      totalErrors: errors,
      formatDetected
    };
  }

  private static normalizeDate(dateStr: string): string {
    if (!dateStr) return new Date().toISOString();
    try {
      // Handle Apache format: 10/Oct/2000:13:55:36 -0700
      if (dateStr.includes('/') && dateStr.includes(':')) {
        const parts = dateStr.match(/^(\d{1,2})\/([A-Za-z]{3})\/(\d{4}):(\d{2}:\d{2}:\d{2})\s*([+\-0-9]*)/);
        if (parts) {
          const monthMap: Record<string, string> = {
            Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
            Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12'
          };
          const day = parts[1].padStart(2, '0');
          const month = monthMap[parts[2]] || '01';
          const year = parts[3];
          const time = parts[4];
          return new Date(`${year}-${month}-${day}T${time}Z`).toISOString();
        }
      }

      // Handle syslog: Aug 23 01:23:45
      if (/^[A-Za-z]{3}\s+\d+/.test(dateStr)) {
        const year = new Date().getFullYear();
        const d = new Date(`${dateStr} ${year}`);
        if (!isNaN(d.getTime())) return d.toISOString();
      }

      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) return d.toISOString();
    } catch {
      // ignore
    }
    return new Date().toISOString();
  }
}
