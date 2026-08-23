import { LogEntry, Anomaly, SystemSettings } from './db.js';

export class RuleBasedDetector {
  static detect(entries: LogEntry[], logFileId: string, settings: SystemSettings): Anomaly[] {
    const anomalies: Anomaly[] = [];
    const enabled = settings.enabled_rules;

    // 1. Group entries by IP and calculate aggregate metrics
    const ipToEntries: Record<string, LogEntry[]> = {};
    entries.forEach(entry => {
      if (!ipToEntries[entry.ip_address]) {
        ipToEntries[entry.ip_address] = [];
      }
      ipToEntries[entry.ip_address].push(entry);
    });

    // 2. Scan each entry with rule signatures
    for (const entry of entries) {
      const urlDecoded = decodeURIComponentSafe(entry.request_url);
      const msgLower = (entry.message + ' ' + entry.user_agent + ' ' + urlDecoded).toLowerCase();

      // Rule 1: SQL Injection
      if (enabled.sql_injection) {
        const sqliPatterns = [
          /union\s+(all\s+)?select/i,
          /'\s*or\s*['"0-9a-z_]+\s*=\s*['"0-9a-z_]+/i,
          /or\s+1\s*=\s*1/i,
          /drop\s+table/i,
          /insert\s+into.*values/i,
          /information_schema/i,
          /sleep\s*\(\s*\d+\s*\)/i,
          /benchmark\s*\(\s*\d+/i,
          /--\s*$/m,
          /\/\*.*?\*\//,
          /exec\s*\(\s*xp_/i,
          /waitfor\s+delay/i,
          /pg_sleep/i
        ];

        const matchedPattern = sqliPatterns.find(p => p.test(urlDecoded) || p.test(entry.message));
        if (matchedPattern) {
          entry.is_anomalous = true;
          anomalies.push({
            id: `ANM-${Math.floor(1000 + Math.random() * 9000)}-${Date.now().toString(36)}`,
            log_file_id: logFileId,
            log_entry_id: entry.id,
            anomaly_type: 'SQL Injection',
            severity: 'critical',
            confidence_score: 96,
            anomaly_score: 0.95,
            description: `SQL Injection pattern identified in request URL: "${urlDecoded}". The payload attempts database metadata extraction or bypass.`,
            recommended_action: 'Enforce parameterized queries in backend DAL. Check WAF rule 942100 and block source IP.',
            status: 'open',
            source_ip: entry.ip_address,
            username: entry.username,
            request_url: entry.request_url,
            detected_at: new Date().toISOString(),
            detection_method: 'rule',
            mitre_tactic: 'Initial Access (T1190 - Exploit Public-Facing Application)'
          });
          continue; // Move to next entry once flagged with critical
        }
      }

      // Rule 2: Directory Traversal / Sensitive File Exposure
      if (enabled.unauthorized_access) {
        const traversalPatterns = [
          /\.\.\//,
          /\.\.\\/,
          /%2e%2e%2f/i,
          /\/etc\/passwd/i,
          /\/etc\/shadow/i,
          /\/proc\/self/i,
          /\/\.env(\.|$)/i,
          /\/\.git(\/|$)/i,
          /\/wp-config\.php/i,
          /\/config\.json/i,
          /\/web\.config/i,
          /\/boot\.ini/i
        ];

        const matchedTraversal = traversalPatterns.find(p => p.test(urlDecoded) || p.test(entry.request_url));
        if (matchedTraversal) {
          entry.is_anomalous = true;
          anomalies.push({
            id: `ANM-${Math.floor(1000 + Math.random() * 9000)}-${Date.now().toString(36)}`,
            log_file_id: logFileId,
            log_entry_id: entry.id,
            anomaly_type: 'Unauthorized Access & Directory Traversal',
            severity: 'high',
            confidence_score: 92,
            anomaly_score: 0.88,
            description: `Path traversal or sensitive configuration probe detected: "${entry.request_url}".`,
            recommended_action: 'Normalize static file routes. Block external access to dotfiles and configuration directories.',
            status: 'open',
            source_ip: entry.ip_address,
            username: entry.username,
            request_url: entry.request_url,
            detected_at: new Date().toISOString(),
            detection_method: 'rule',
            mitre_tactic: 'Discovery (T1083 - File & Directory Discovery)'
          });
          continue;
        }
      }

      // Rule 3: Automated Vulnerability Scanners / Suspicious User Agents
      if (enabled.suspicious_ip) {
        const scannerSignatures = [
          'sqlmap', 'nikto', 'nmap', 'masscan', 'dirbuster', 'gobuster',
          'acunetix', 'burpsuite', 'hydra', 'wpscan', 'zgrab', 'censys', 'shodan'
        ];
        const matchedScanner = scannerSignatures.find(s => msgLower.includes(s));
        if (matchedScanner) {
          entry.is_anomalous = true;
          anomalies.push({
            id: `ANM-${Math.floor(1000 + Math.random() * 9000)}-${Date.now().toString(36)}`,
            log_file_id: logFileId,
            log_entry_id: entry.id,
            anomaly_type: 'Malicious Scanner / Reconnaissance',
            severity: 'high',
            confidence_score: 94,
            anomaly_score: 0.90,
            description: `Automated reconnaissance scanner detected with signature "${matchedScanner}" from IP ${entry.ip_address}.`,
            recommended_action: 'Add IP to threat intelligence feed and implement automated IP ban on perimeter ingress router.',
            status: 'open',
            source_ip: entry.ip_address,
            username: entry.username,
            request_url: entry.request_url,
            detected_at: new Date().toISOString(),
            detection_method: 'rule',
            mitre_tactic: 'Reconnaissance (T1595 - Active Scanning)'
          });
          continue;
        }
      }

      // Rule 4: Privilege Escalation
      if (enabled.privilege_escalation) {
        const privEscUrls = [
          '/admin/roles', '/admin/elevate', '/api/users/grant-admin',
          '/sudo', '/su/root', '/system/exec', '/api/v1/permissions/override'
        ];
        const isPrivEscUrl = privEscUrls.some(u => urlDecoded.toLowerCase().includes(u));
        if (isPrivEscUrl && (entry.status_code === 403 || entry.status_code === 401 || entry.username === 'anonymous' || !entry.username.includes('admin'))) {
          entry.is_anomalous = true;
          anomalies.push({
            id: `ANM-${Math.floor(1000 + Math.random() * 9000)}-${Date.now().toString(36)}`,
            log_file_id: logFileId,
            log_entry_id: entry.id,
            anomaly_type: 'Privilege Escalation',
            severity: 'high',
            confidence_score: 90,
            anomaly_score: 0.87,
            description: `Suspicious privilege elevation attempt on protected endpoint "${entry.request_url}" by user "${entry.username}".`,
            recommended_action: 'Audit session token authorizations and revoke anomalous user API keys.',
            status: 'open',
            source_ip: entry.ip_address,
            username: entry.username,
            request_url: entry.request_url,
            detected_at: new Date().toISOString(),
            detection_method: 'rule',
            mitre_tactic: 'Privilege Escalation (T1068)'
          });
          continue;
        }
      }

      // Rule 5: Unusual Login / Root Authentication Target
      if (enabled.unusual_login) {
        const sensitiveUsers = ['root', 'admin', 'administrator', 'system', 'superuser'];
        if (sensitiveUsers.includes(entry.username.toLowerCase()) && entry.status_code >= 400) {
          entry.is_anomalous = true;
          anomalies.push({
            id: `ANM-${Math.floor(1000 + Math.random() * 9000)}-${Date.now().toString(36)}`,
            log_file_id: logFileId,
            log_entry_id: entry.id,
            anomaly_type: 'Unusual Login Attempt',
            severity: 'medium',
            confidence_score: 80,
            anomaly_score: 0.75,
            description: `Direct credential attack targeting privileged account "${entry.username}" from foreign IP ${entry.ip_address}.`,
            recommended_action: 'Disable direct root SSH/web login and enforce Multi-Factor Authentication (MFA).',
            status: 'open',
            source_ip: entry.ip_address,
            username: entry.username,
            request_url: entry.request_url,
            detected_at: new Date().toISOString(),
            detection_method: 'rule',
            mitre_tactic: 'Credential Access (T1110)'
          });
          continue;
        }
      }
    }

    // 3. Multi-entry Aggregate Rules: Brute Force Attacks
    if (enabled.brute_force) {
      Object.entries(ipToEntries).forEach(([ip, ipLogs]) => {
        const failedAuths = ipLogs.filter(e =>
          e.status_code === 401 ||
          e.status_code === 403 ||
          e.event_type === 'AUTH_FAILED' ||
          e.message.toLowerCase().includes('failed password')
        );

        if (failedAuths.length >= 3) {
          failedAuths.forEach(e => { e.is_anomalous = true; });
          const firstTarget = failedAuths[0];
          anomalies.push({
            id: `ANM-${Math.floor(1000 + Math.random() * 9000)}-${Date.now().toString(36)}`,
            log_file_id: logFileId,
            log_entry_id: firstTarget.id,
            anomaly_type: 'Brute Force Attack',
            severity: failedAuths.length >= 6 ? 'critical' : 'high',
            confidence_score: Math.min(99, 75 + failedAuths.length * 4),
            anomaly_score: Math.min(0.99, 0.70 + failedAuths.length * 0.05),
            description: `Brute force password guessing detected: ${failedAuths.length} consecutive authentication failures from IP ${ip} targeting accounts (${[...new Set(failedAuths.map(f => f.username))].join(', ')}).`,
            recommended_action: `Temporarily lock source IP ${ip} via fail2ban/iptables and notify targeted users.`,
            status: 'open',
            source_ip: ip,
            username: firstTarget.username,
            request_url: firstTarget.request_url,
            detected_at: new Date().toISOString(),
            detection_method: 'hybrid',
            mitre_tactic: 'Credential Access (T1110.001 - Password Guessing)',
            ml_features: {
              failedLoginCount: failedAuths.length,
              requestDensity: failedAuths.length / Math.max(1, ipLogs.length)
            }
          });
        }
      });
    }

    // 4. Traffic Spikes / High Request Rates
    if (enabled.traffic_spike) {
      Object.entries(ipToEntries).forEach(([ip, ipLogs]) => {
        if (ipLogs.length >= 25) {
          const sample = ipLogs[0];
          sample.is_anomalous = true;
          anomalies.push({
            id: `ANM-${Math.floor(1000 + Math.random() * 9000)}-${Date.now().toString(36)}`,
            log_file_id: logFileId,
            log_entry_id: sample.id,
            anomaly_type: 'Traffic Spike / Potential DoS',
            severity: ipLogs.length > 50 ? 'high' : 'medium',
            confidence_score: 86,
            anomaly_score: 0.82,
            description: `High volumetric traffic anomaly: ${ipLogs.length} requests generated from single IP ${ip} in log window.`,
            recommended_action: 'Configure Nginx / Envoy rate limit rules and inspect if IP is a web crawler or DDoS botnet agent.',
            status: 'open',
            source_ip: ip,
            username: sample.username,
            request_url: sample.request_url,
            detected_at: new Date().toISOString(),
            detection_method: 'hybrid',
            mitre_tactic: 'Impact (T1498 - Network Denial of Service)'
          });
        }
      });
    }

    // 5. Server Error Spikes
    if (enabled.error_spike) {
      const serverErrors = entries.filter(e => e.status_code >= 500);
      if (serverErrors.length >= 4) {
        serverErrors.forEach(e => { e.is_anomalous = true; });
        const sample = serverErrors[0];
        anomalies.push({
          id: `ANM-${Math.floor(1000 + Math.random() * 9000)}-${Date.now().toString(36)}`,
          log_file_id: logFileId,
          log_entry_id: sample.id,
          anomaly_type: 'Error Spike (5xx Server Errors)',
          severity: serverErrors.length > 10 ? 'high' : 'medium',
          confidence_score: 84,
          anomaly_score: 0.79,
          description: `Server Error Cluster: ${serverErrors.length} HTTP 500/502/503 errors detected in recent log timeline.`,
          recommended_action: 'Inspect application microservice health checks, database connection pool, and upstream service availability.',
          status: 'open',
          source_ip: sample.ip_address,
          username: sample.username,
          request_url: sample.request_url,
          detected_at: new Date().toISOString(),
          detection_method: 'hybrid'
        });
      }
    }

    return anomalies;
  }
}

function decodeURIComponentSafe(uri: string): string {
  try {
    return decodeURIComponent(uri);
  } catch {
    return uri;
  }
}
