import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

export interface User {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: 'admin' | 'analyst' | 'viewer';
  department: string;
  status: 'active' | 'disabled';
  created_at: string;
  last_login: string | null;
}

export interface LogFile {
  id: string;
  filename: string;
  file_type: string;
  file_size: number;
  uploaded_by: string;
  uploaded_by_name: string;
  total_entries: number;
  processing_status: 'uploading' | 'processing' | 'analyzing' | 'completed' | 'failed';
  uploaded_at: string;
  anomalies_count: number;
}

export interface LogEntry {
  id: string;
  log_file_id: string;
  timestamp: string;
  ip_address: string;
  username: string;
  http_method: string;
  request_url: string;
  status_code: number;
  response_time: number; // in ms
  user_agent: string;
  event_type: string;
  message: string;
  is_anomalous: boolean;
  raw_line?: string;
}

export interface Anomaly {
  id: string;
  log_file_id: string;
  log_entry_id: string;
  anomaly_type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  confidence_score: number; // 0 - 100
  anomaly_score: number; // 0.00 - 1.00
  description: string;
  recommended_action: string;
  status: 'open' | 'investigating' | 'resolved' | 'false_positive';
  source_ip: string;
  username: string;
  request_url: string;
  detected_at: string;
  detection_method: 'rule' | 'ml' | 'hybrid' | 'ai';
  ml_features?: Record<string, number>;
  ai_analysis?: string;
  mitre_tactic?: string;
}

export interface Investigation {
  id: string;
  anomaly_id: string;
  analyst_id: string;
  analyst_name: string;
  notes: string;
  action_taken: string;
  status: 'investigating' | 'resolved' | 'false_positive';
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  action: string;
  description: string;
  ip_address?: string;
  timestamp: string;
}

export interface SystemSettings {
  detection_sensitivity: number; // 1 - 100
  anomaly_threshold: number; // 0.0 - 1.0
  critical_threshold: number;
  high_threshold: number;
  medium_threshold: number;
  auto_ai_analysis: boolean;
  enabled_rules: {
    brute_force: boolean;
    sql_injection: boolean;
    unauthorized_access: boolean;
    traffic_spike: boolean;
    error_spike: boolean;
    suspicious_ip: boolean;
    privilege_escalation: boolean;
    unusual_login: boolean;
  };
}

interface DatabaseSchema {
  users: User[];
  log_files: LogFile[];
  log_entries: LogEntry[];
  anomalies: Anomaly[];
  investigations: Investigation[];
  audit_logs: AuditLog[];
  settings: SystemSettings;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.ensureDirectory();
    this.data = this.loadDatabase();
  }

  private ensureDirectory() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private loadDatabase(): DatabaseSchema {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      } catch (err) {
        console.error('Error reading database file, initializing defaults:', err);
      }
    }
    const initialData = this.getInitialSeed();
    this.saveDatabase(initialData);
    return initialData;
  }

  private saveDatabase(dataToSave?: DatabaseSchema) {
    try {
      this.ensureDirectory();
      fs.writeFileSync(DB_FILE, JSON.stringify(dataToSave || this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist database:', err);
    }
  }

  private getInitialSeed(): DatabaseSchema {
    const salt = bcrypt.genSaltSync(10);
    const adminPassHash = bcrypt.hashSync('Admin@123456', salt);
    const analystPassHash = bcrypt.hashSync('Analyst@123456', salt);
    const viewerPassHash = bcrypt.hashSync('Viewer@123456', salt);

    const now = new Date();
    const isoNow = now.toISOString();

    const users: User[] = [
      {
        id: 'usr-admin-01',
        name: 'Chief Alex Vance',
        email: 'admin@cyberguard.io',
        password_hash: adminPassHash,
        role: 'admin',
        department: 'Security Operations Center (SOC)',
        status: 'active',
        created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
        last_login: isoNow
      },
      {
        id: 'usr-analyst-01',
        name: 'Elena Rostova',
        email: 'analyst@cyberguard.io',
        password_hash: analystPassHash,
        role: 'analyst',
        department: 'Threat Intelligence Unit',
        status: 'active',
        created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
        last_login: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: 'usr-viewer-01',
        name: 'Marcus Brody',
        email: 'viewer@cyberguard.io',
        password_hash: viewerPassHash,
        role: 'viewer',
        department: 'Compliance & Audit',
        status: 'active',
        created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
        last_login: new Date(Date.now() - 86400000).toISOString()
      }
    ];

    const sampleFile1: LogFile = {
      id: 'file-demo-01',
      filename: 'auth_server_access.log',
      file_type: 'log',
      file_size: 48920,
      uploaded_by: 'usr-analyst-01',
      uploaded_by_name: 'Elena Rostova',
      total_entries: 48,
      processing_status: 'completed',
      uploaded_at: new Date(Date.now() - 4 * 3600000).toISOString(),
      anomalies_count: 5
    };

    const sampleFile2: LogFile = {
      id: 'file-demo-02',
      filename: 'nginx_waf_gateway.csv',
      file_type: 'csv',
      file_size: 89430,
      uploaded_by: 'usr-admin-01',
      uploaded_by_name: 'Chief Alex Vance',
      total_entries: 92,
      processing_status: 'completed',
      uploaded_at: new Date(Date.now() - 24 * 3600000).toISOString(),
      anomalies_count: 7
    };

    // Pre-seed realistic anomalies
    const anomalies: Anomaly[] = [
      {
        id: 'ANM-9021',
        log_file_id: 'file-demo-01',
        log_entry_id: 'ent-demo-101',
        anomaly_type: 'Brute Force Attack',
        severity: 'critical',
        confidence_score: 98,
        anomaly_score: 0.96,
        description: 'Detected 14 consecutive failed authentication attempts in 42 seconds from foreign IP 185.220.101.5.',
        recommended_action: 'Immediately blacklist IP 185.220.101.5 on edge firewall, trigger password reset for targeted account "root", and inspect SSH daemon authentication thresholds.',
        status: 'open',
        source_ip: '185.220.101.5',
        username: 'root',
        request_url: '/api/v1/auth/login',
        detected_at: new Date(Date.now() - 3500000).toISOString(),
        detection_method: 'hybrid',
        mitre_tactic: 'Credential Access (T1110.001)',
        ml_features: { requestFrequency: 33.3, failedLoginRate: 1.0, errorRate: 1.0, zScore: 4.8 }
      },
      {
        id: 'ANM-9022',
        log_file_id: 'file-demo-02',
        log_entry_id: 'ent-demo-102',
        anomaly_type: 'SQL Injection',
        severity: 'critical',
        confidence_score: 95,
        anomaly_score: 0.94,
        description: 'Malicious SQL injection payload detected in query parameter: \'/products?id=1%20UNION%20SELECT%20null,username,password%20FROM%20users--\'.',
        recommended_action: 'Verify parameterized query bindings in ProductController, verify Web Application Firewall (WAF) rule 942100 is in BLOCK mode, and check database audit logs for unauthorized schema reads.',
        status: 'investigating',
        source_ip: '194.26.29.112',
        username: 'anonymous',
        request_url: '/products?id=1%20UNION%20SELECT%20null,username,password%20FROM%20users--',
        detected_at: new Date(Date.now() - 5200000).toISOString(),
        detection_method: 'rule',
        mitre_tactic: 'Initial Access (T1190 - Exploit Public-Facing Application)'
      },
      {
        id: 'ANM-9023',
        log_file_id: 'file-demo-01',
        log_entry_id: 'ent-demo-103',
        anomaly_type: 'Privilege Escalation',
        severity: 'high',
        confidence_score: 91,
        anomaly_score: 0.89,
        description: 'Non-admin user "guest_dev" executed unauthorized elevation endpoint "/api/admin/roles/grant" returning HTTP 403 Forbidden followed by suspicious cookie manipulation.',
        recommended_action: 'Audit session tokens for user "guest_dev", revoke API keys, and review RBAC route authorization interceptors.',
        status: 'open',
        source_ip: '45.154.255.89',
        username: 'guest_dev',
        request_url: '/api/admin/roles/grant',
        detected_at: new Date(Date.now() - 8400000).toISOString(),
        detection_method: 'hybrid',
        mitre_tactic: 'Privilege Escalation (T1068)'
      },
      {
        id: 'ANM-9024',
        log_file_id: 'file-demo-02',
        log_entry_id: 'ent-demo-104',
        anomaly_type: 'Traffic Spike / DDoS Probe',
        severity: 'high',
        confidence_score: 88,
        anomaly_score: 0.84,
        description: 'Sudden request burst of 1,240 requests/min targeting /search endpoint from dynamic IP subnet 103.145.2.0/24.',
        recommended_action: 'Engage Cloudflare/Nginx rate limiting on /search endpoint to maximum 60 req/min per IP, enable CAPTCHA challenge on anomalous spikes.',
        status: 'resolved',
        source_ip: '103.145.2.44',
        username: 'unknown',
        request_url: '/search?q=catalog',
        detected_at: new Date(Date.now() - 14200000).toISOString(),
        detection_method: 'ml',
        mitre_tactic: 'Impact (T1498 - Network Denial of Service)'
      },
      {
        id: 'ANM-9025',
        log_file_id: 'file-demo-01',
        log_entry_id: 'ent-demo-105',
        anomaly_type: 'Unauthorized Access & Directory Traversal',
        severity: 'medium',
        confidence_score: 82,
        anomaly_score: 0.76,
        description: 'Attempted directory traversal access to sensitive path "/../../etc/passwd" and "/.env".',
        recommended_action: 'Ensure static file server path normalization rejects null bytes and dot-dot sequences. Filter dotfiles in Nginx configuration.',
        status: 'resolved',
        source_ip: '91.240.118.172',
        username: 'crawler_bot',
        request_url: '/static/../../.env',
        detected_at: new Date(Date.now() - 22000000).toISOString(),
        detection_method: 'rule',
        mitre_tactic: 'Discovery (T1083 - File and Directory Discovery)'
      },
      {
        id: 'ANM-9026',
        log_file_id: 'file-demo-02',
        log_entry_id: 'ent-demo-106',
        anomaly_type: 'Error Spike (500 Internal Error)',
        severity: 'medium',
        confidence_score: 78,
        anomaly_score: 0.72,
        description: 'Server error burst: 45 consecutive HTTP 500 Internal Server Errors in payment microservice pipeline.',
        recommended_action: 'Inspect database connection pool exhaustion and backend microservice health logs.',
        status: 'false_positive',
        source_ip: '10.0.4.12',
        username: 'svc-payment-worker',
        request_url: '/api/v2/checkout/process',
        detected_at: new Date(Date.now() - 36000000).toISOString(),
        detection_method: 'ml'
      },
      {
        id: 'ANM-9027',
        log_file_id: 'file-demo-02',
        log_entry_id: 'ent-demo-107',
        anomaly_type: 'Unusual Login Location',
        severity: 'low',
        confidence_score: 72,
        anomaly_score: 0.65,
        description: 'User "mbrody" successfully logged in from new ASN/IP 185.191.171.3 outside regular business hours.',
        recommended_action: 'Prompt 2FA challenge on next authentication attempt and verify with employee.',
        status: 'open',
        source_ip: '185.191.171.3',
        username: 'mbrody',
        request_url: '/portal/dashboard',
        detected_at: new Date(Date.now() - 42000000).toISOString(),
        detection_method: 'rule'
      }
    ];

    const investigations: Investigation[] = [
      {
        id: 'INV-101',
        anomaly_id: 'ANM-9022',
        analyst_id: 'usr-analyst-01',
        analyst_name: 'Elena Rostova',
        notes: 'Identified SQL injection payload targeting user credentials. Checked database audit trail; query was blocked by ORM escaping, but origin IP belongs to a known bulletproof hosting provider.',
        action_taken: 'Added IP 194.26.29.112 to perimeter WAF drop-list. Reported IOC to threat intel feed.',
        status: 'investigating',
        created_at: new Date(Date.now() - 4800000).toISOString()
      },
      {
        id: 'INV-102',
        anomaly_id: 'ANM-9024',
        analyst_id: 'usr-admin-01',
        analyst_name: 'Chief Alex Vance',
        notes: 'High volume scraper bot attempting search query flooding.',
        action_taken: 'Deployed cloud rate limiter and activated challenge threshold.',
        status: 'resolved',
        created_at: new Date(Date.now() - 13000000).toISOString()
      },
      {
        id: 'INV-103',
        anomaly_id: 'ANM-9026',
        analyst_id: 'usr-analyst-01',
        analyst_name: 'Elena Rostova',
        notes: 'Confirmed internal payment service maintenance window caused intermittent 500 responses. No adversary action detected.',
        action_taken: 'Marked as false positive and adjusted service alert suppressions.',
        status: 'false_positive',
        created_at: new Date(Date.now() - 32000000).toISOString()
      }
    ];

    const audit_logs: AuditLog[] = [
      {
        id: 'AUD-001',
        user_id: 'usr-admin-01',
        user_name: 'Chief Alex Vance',
        user_email: 'admin@cyberguard.io',
        action: 'USER_LOGIN',
        description: 'Administrator logged in from internal network.',
        ip_address: '10.0.0.4',
        timestamp: new Date(Date.now() - 1800000).toISOString()
      },
      {
        id: 'AUD-002',
        user_id: 'usr-analyst-01',
        user_name: 'Elena Rostova',
        user_email: 'analyst@cyberguard.io',
        action: 'LOG_UPLOAD',
        description: 'Uploaded auth_server_access.log (48 entries).',
        ip_address: '10.0.0.18',
        timestamp: new Date(Date.now() - 4 * 3600000).toISOString()
      },
      {
        id: 'AUD-003',
        user_id: 'usr-analyst-01',
        user_name: 'Elena Rostova',
        user_email: 'analyst@cyberguard.io',
        action: 'ANALYSIS_COMPLETED',
        description: 'Anomaly detection pipeline processed 48 entries, flagged 5 anomalies.',
        ip_address: '10.0.0.18',
        timestamp: new Date(Date.now() - 3900000).toISOString()
      },
      {
        id: 'AUD-004',
        user_id: 'usr-analyst-01',
        user_name: 'Elena Rostova',
        user_email: 'analyst@cyberguard.io',
        action: 'ANOMALY_INVESTIGATED',
        description: 'Opened investigation INV-101 for anomaly ANM-9022 (SQL Injection).',
        ip_address: '10.0.0.18',
        timestamp: new Date(Date.now() - 4800000).toISOString()
      },
      {
        id: 'AUD-005',
        user_id: 'usr-admin-01',
        user_name: 'Chief Alex Vance',
        user_email: 'admin@cyberguard.io',
        action: 'SETTINGS_CHANGED',
        description: 'Updated detection sensitivity to 85% and enabled AI threat analysis.',
        ip_address: '10.0.0.4',
        timestamp: new Date(Date.now() - 48 * 3600000).toISOString()
      }
    ];

    const settings: SystemSettings = {
      detection_sensitivity: 85,
      anomaly_threshold: 0.65,
      critical_threshold: 0.90,
      high_threshold: 0.75,
      medium_threshold: 0.60,
      auto_ai_analysis: true,
      enabled_rules: {
        brute_force: true,
        sql_injection: true,
        unauthorized_access: true,
        traffic_spike: true,
        error_spike: true,
        suspicious_ip: true,
        privilege_escalation: true,
        unusual_login: true
      }
    };

    // Pre-seed 35 realistic log entries for demo file 1
    const log_entries: LogEntry[] = [
      {
        id: 'ent-demo-101',
        log_file_id: 'file-demo-01',
        timestamp: new Date(Date.now() - 3500000).toISOString(),
        ip_address: '185.220.101.5',
        username: 'root',
        http_method: 'POST',
        request_url: '/api/v1/auth/login',
        status_code: 401,
        response_time: 120,
        user_agent: 'python-requests/2.28.1',
        event_type: 'AUTH_FAILED',
        message: 'Failed login attempt for user root from 185.220.101.5 (Attempt 14/14)',
        is_anomalous: true
      },
      {
        id: 'ent-demo-102',
        log_file_id: 'file-demo-02',
        timestamp: new Date(Date.now() - 5200000).toISOString(),
        ip_address: '194.26.29.112',
        username: 'anonymous',
        http_method: 'GET',
        request_url: '/products?id=1%20UNION%20SELECT%20null,username,password%20FROM%20users--',
        status_code: 200,
        response_time: 420,
        user_agent: 'sqlmap/1.6.12#stable (https://sqlmap.org)',
        event_type: 'WEB_REQUEST',
        message: 'SQL Injection pattern detected in URL params',
        is_anomalous: true
      },
      {
        id: 'ent-demo-103',
        log_file_id: 'file-demo-01',
        timestamp: new Date(Date.now() - 8400000).toISOString(),
        ip_address: '45.154.255.89',
        username: 'guest_dev',
        http_method: 'POST',
        request_url: '/api/admin/roles/grant',
        status_code: 403,
        response_time: 45,
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        event_type: 'ACCESS_DENIED',
        message: 'Unauthorized privilege escalation endpoint called by standard account',
        is_anomalous: true
      },
      {
        id: 'ent-demo-104',
        log_file_id: 'file-demo-02',
        timestamp: new Date(Date.now() - 14200000).toISOString(),
        ip_address: '103.145.2.44',
        username: 'unknown',
        http_method: 'GET',
        request_url: '/search?q=catalog',
        status_code: 200,
        response_time: 1450,
        user_agent: 'Go-http-client/1.1',
        event_type: 'TRAFFIC_BURST',
        message: 'Burst rate exceeded: 1240 requests in 60 seconds from IP subnet',
        is_anomalous: true
      },
      {
        id: 'ent-demo-105',
        log_file_id: 'file-demo-01',
        timestamp: new Date(Date.now() - 22000000).toISOString(),
        ip_address: '91.240.118.172',
        username: 'crawler_bot',
        http_method: 'GET',
        request_url: '/static/../../.env',
        status_code: 404,
        response_time: 25,
        user_agent: 'Nikto/2.1.6',
        event_type: 'DIRECTORY_TRAVERSAL',
        message: 'Suspicious path traversal string in URL query',
        is_anomalous: true
      },
      {
        id: 'ent-demo-108',
        log_file_id: 'file-demo-01',
        timestamp: new Date(Date.now() - 1000000).toISOString(),
        ip_address: '10.0.0.4',
        username: 'alex.vance',
        http_method: 'GET',
        request_url: '/api/v1/dashboard/metrics',
        status_code: 200,
        response_time: 32,
        user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        event_type: 'API_REQUEST',
        message: 'Normal API request for telemetry metrics',
        is_anomalous: false
      },
      {
        id: 'ent-demo-109',
        log_file_id: 'file-demo-01',
        timestamp: new Date(Date.now() - 2000000).toISOString(),
        ip_address: '10.0.0.18',
        username: 'elena.rostova',
        http_method: 'GET',
        request_url: '/api/v1/anomalies/feed',
        status_code: 200,
        response_time: 48,
        user_agent: 'Mozilla/5.0 (X11; Linux x86_64)',
        event_type: 'API_REQUEST',
        message: 'Threat intelligence stream sync',
        is_anomalous: false
      }
    ];

    return {
      users,
      log_files: [sampleFile1, sampleFile2],
      log_entries,
      anomalies,
      investigations,
      audit_logs,
      settings
    };
  }

  // Getters and Mutators
  getUsers(): User[] {
    return this.data.users;
  }

  getUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id);
  }

  getUserByEmail(email: string): User | undefined {
    if (!email) return undefined;
    const clean = email.trim().toLowerCase();
    return this.data.users.find(u => u.email.trim().toLowerCase() === clean);
  }

  addUser(user: User) {
    this.data.users.push(user);
    this.saveDatabase();
  }

  updateUser(id: string, updates: Partial<User>) {
    const idx = this.data.users.findIndex(u => u.id === id);
    if (idx !== -1) {
      this.data.users[idx] = { ...this.data.users[idx], ...updates };
      this.saveDatabase();
      return this.data.users[idx];
    }
    return null;
  }

  deleteUser(id: string): boolean {
    const initialLen = this.data.users.length;
    this.data.users = this.data.users.filter(u => u.id !== id);
    if (this.data.users.length !== initialLen) {
      this.saveDatabase();
      return true;
    }
    return false;
  }

  getLogFiles(): LogFile[] {
    return [...this.data.log_files].sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime());
  }

  getLogFileById(id: string): LogFile | undefined {
    return this.data.log_files.find(f => f.id === id);
  }

  addLogFile(file: LogFile) {
    this.data.log_files.unshift(file);
    this.saveDatabase();
  }

  updateLogFile(id: string, updates: Partial<LogFile>) {
    const idx = this.data.log_files.findIndex(f => f.id === id);
    if (idx !== -1) {
      this.data.log_files[idx] = { ...this.data.log_files[idx], ...updates };
      this.saveDatabase();
      return this.data.log_files[idx];
    }
    return null;
  }

  deleteLogFile(id: string): boolean {
    this.data.log_files = this.data.log_files.filter(f => f.id !== id);
    this.data.log_entries = this.data.log_entries.filter(e => e.log_file_id !== id);
    this.data.anomalies = this.data.anomalies.filter(a => a.log_file_id !== id);
    this.saveDatabase();
    return true;
  }

  getLogEntries(logFileId?: string, limit = 1000): LogEntry[] {
    let entries = this.data.log_entries;
    if (logFileId) {
      entries = entries.filter(e => e.log_file_id === logFileId);
    }
    return entries.slice(0, limit);
  }

  addLogEntries(entries: LogEntry[]) {
    this.data.log_entries.push(...entries);
    this.saveDatabase();
  }

  getAnomalies(): Anomaly[] {
    return [...this.data.anomalies].sort((a, b) => new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime());
  }

  getAnomalyById(id: string): Anomaly | undefined {
    return this.data.anomalies.find(a => a.id === id);
  }

  addAnomalies(anomalies: Anomaly[]) {
    this.data.anomalies.push(...anomalies);
    this.saveDatabase();
  }

  updateAnomaly(id: string, updates: Partial<Anomaly>) {
    const idx = this.data.anomalies.findIndex(a => a.id === id);
    if (idx !== -1) {
      this.data.anomalies[idx] = { ...this.data.anomalies[idx], ...updates };
      this.saveDatabase();
      return this.data.anomalies[idx];
    }
    return null;
  }

  getInvestigations(anomalyId?: string): Investigation[] {
    let list = [...this.data.investigations].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    if (anomalyId) {
      list = list.filter(i => i.anomaly_id === anomalyId);
    }
    return list;
  }

  addInvestigation(inv: Investigation) {
    this.data.investigations.unshift(inv);
    // Also sync anomaly status
    this.updateAnomaly(inv.anomaly_id, { status: inv.status });
    this.saveDatabase();
  }

  getAuditLogs(limit = 200): AuditLog[] {
    return [...this.data.audit_logs]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  addAuditLog(log: Omit<AuditLog, 'id'>) {
    const newLog: AuditLog = {
      id: `AUD-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`,
      ...log
    };
    this.data.audit_logs.unshift(newLog);
    if (this.data.audit_logs.length > 1000) {
      this.data.audit_logs = this.data.audit_logs.slice(0, 1000);
    }
    this.saveDatabase();
  }

  getSettings(): SystemSettings {
    return this.data.settings;
  }

  updateSettings(updates: Partial<SystemSettings>) {
    this.data.settings = { ...this.data.settings, ...updates };
    this.saveDatabase();
    return this.data.settings;
  }
}

export const db = new Database();
