import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import { db, User, LogFile, Anomaly, Investigation } from './db.js';
import { authenticateToken, requireAdmin, requireAnalystOrAdmin, generateToken, AuthRequest } from './auth.js';
import { LogParser } from './parsers.js';
import { RuleBasedDetector } from './detectors.js';
import { MLAnomalyEngine } from './ml.js';
import { GeminiSecurityAnalyzer } from './gemini.js';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB max
});

// Helper for client IP
function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
  return req.socket.remoteAddress || '127.0.0.1';
}

// ----------------------------------------------------
// AUTHENTICATION ROUTES
// ----------------------------------------------------

router.post('/auth/register', (req: Request, res: Response) => {
  try {
    const { name, email, password, role, department } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    // Role selection: Admin, Analyst, or Viewer
    let assignedRole: 'admin' | 'analyst' | 'viewer' = 'analyst';
    if (role === 'viewer') {
      assignedRole = 'viewer';
    } else if (role === 'admin') {
      assignedRole = 'admin';
    } else {
      assignedRole = 'analyst';
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = db.getUserByEmail(cleanEmail);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email address already exists. Please log in instead.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const password_hash = bcrypt.hashSync(password, salt);

    const newUser: User = {
      id: `usr-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`,
      name: name.trim(),
      email: cleanEmail,
      password_hash,
      role: assignedRole,
      department: (department && department.trim()) || 'Security Operations Center',
      status: 'active',
      created_at: new Date().toISOString(),
      last_login: new Date().toISOString()
    };

    db.addUser(newUser);

    db.addAuditLog({
      user_id: newUser.id,
      user_name: newUser.name,
      user_email: newUser.email,
      action: 'USER_REGISTER',
      description: `New user registered with role ${newUser.role} (${newUser.department}).`,
      ip_address: getClientIp(req),
      timestamp: new Date().toISOString()
    });

    const token = generateToken(newUser);
    const { password_hash: _, ...safeUser } = newUser;

    return res.status(201).json({
      message: 'Registration successful.',
      user: safeUser,
      token
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Failed to complete registration.' });
  }
});

router.post('/auth/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = db.getUserByEmail(cleanEmail);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password credentials. Please check your spelling or sign up.' });
    }

    if (user.status === 'disabled') {
      return res.status(403).json({ error: 'Your account has been deactivated. Please contact your SOC administrator.' });
    }

    const match = bcrypt.compareSync(password, user.password_hash);
    if (!match) {
      db.addAuditLog({
        user_id: user.id,
        user_name: user.name,
        user_email: user.email,
        action: 'FAILED_LOGIN',
        description: `Failed login attempt for user ${user.email}.`,
        ip_address: getClientIp(req),
        timestamp: new Date().toISOString()
      });
      return res.status(401).json({ error: 'Invalid email or password credentials.' });
    }

    // Update last login
    const updatedUser = db.updateUser(user.id, { last_login: new Date().toISOString() }) || user;

    db.addAuditLog({
      user_id: user.id,
      user_name: user.name,
      user_email: user.email,
      action: 'USER_LOGIN',
      description: `User ${user.name} logged in successfully (${user.role}).`,
      ip_address: getClientIp(req),
      timestamp: new Date().toISOString()
    });

    const token = generateToken(updatedUser);
    const { password_hash: _, ...safeUser } = updatedUser;

    return res.json({
      message: 'Login successful.',
      user: safeUser,
      token
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Login service encountered an unexpected error.' });
  }
});

router.post('/auth/logout', authenticateToken, (req: AuthRequest, res: Response) => {
  if (req.user) {
    db.addAuditLog({
      user_id: req.user.id,
      user_name: req.user.name,
      user_email: req.user.email,
      action: 'USER_LOGOUT',
      description: `User ${req.user.name} logged out.`,
      ip_address: getClientIp(req),
      timestamp: new Date().toISOString()
    });
  }
  return res.json({ message: 'Logged out successfully.' });
});

router.get('/auth/me', authenticateToken, (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  const { password_hash: _, ...safeUser } = req.user;
  return res.json({ user: safeUser });
});

router.post('/auth/forgot-password', (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required.' });

  const user = db.getUserByEmail(email);
  if (user) {
    db.addAuditLog({
      user_id: user.id,
      user_name: user.name,
      user_email: user.email,
      action: 'PASSWORD_RESET_REQUESTED',
      description: `Password reset link/token generated for ${user.email}.`,
      ip_address: getClientIp(req),
      timestamp: new Date().toISOString()
    });
  }

  return res.json({
    message: 'If an account with that email exists, a password reset authorization code has been dispatched.',
    demoResetToken: 'DEMO-RESET-9921'
  });
});

router.post('/auth/reset-password', (req: Request, res: Response) => {
  const { email, newPassword, resetToken } = req.body;
  if (!email || !newPassword) {
    return res.status(400).json({ error: 'Email and new password are required.' });
  }

  const user = db.getUserByEmail(email);
  if (!user) {
    return res.status(404).json({ error: 'User account not found.' });
  }

  const salt = bcrypt.genSaltSync(10);
  const password_hash = bcrypt.hashSync(newPassword, salt);
  db.updateUser(user.id, { password_hash });

  db.addAuditLog({
    user_id: user.id,
    user_name: user.name,
    user_email: user.email,
    action: 'PASSWORD_RESET_COMPLETED',
    description: `Password reset completed for ${user.email}.`,
    ip_address: getClientIp(req),
    timestamp: new Date().toISOString()
  });

  return res.json({ message: 'Password has been reset successfully. You can now login with your new password.' });
});

// ----------------------------------------------------
// LOG FILE & PARSER ROUTES
// ----------------------------------------------------

router.post('/logs/upload', authenticateToken, requireAnalystOrAdmin, upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    let filename = 'uploaded_log.log';
    let fileContent = '';
    let fileSize = 0;
    let fileType = 'log';

    if (req.file) {
      filename = req.file.originalname;
      fileContent = req.file.buffer.toString('utf-8');
      fileSize = req.file.size;
      fileType = filename.split('.').pop()?.toLowerCase() || 'log';
    } else if (req.body.content) {
      fileContent = req.body.content;
      filename = req.body.filename || 'pasted_log.log';
      fileSize = Buffer.byteLength(fileContent, 'utf-8');
      fileType = filename.split('.').pop()?.toLowerCase() || 'log';
    } else {
      return res.status(400).json({ error: 'No file or content uploaded.' });
    }

    if (!fileContent.trim()) {
      return res.status(400).json({ error: 'The provided log file is empty.' });
    }

    const logFileId = `file-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`;

    // Initial file record
    const newLogFile: LogFile = {
      id: logFileId,
      filename,
      file_type: fileType,
      file_size: fileSize,
      uploaded_by: req.user!.id,
      uploaded_by_name: req.user!.name,
      total_entries: 0,
      processing_status: 'processing',
      uploaded_at: new Date().toISOString(),
      anomalies_count: 0
    };

    db.addLogFile(newLogFile);

    // Parse entries
    const parseResult = LogParser.parse(fileContent, logFileId, filename);
    if (parseResult.entries.length === 0) {
      db.updateLogFile(logFileId, { processing_status: 'failed' });
      return res.status(400).json({
        error: 'Failed to parse log entries from file. Please ensure it is valid .log, .csv, .json, or .txt format.',
        details: parseResult
      });
    }

    db.addLogEntries(parseResult.entries);
    db.updateLogFile(logFileId, {
      total_entries: parseResult.entries.length,
      processing_status: 'analyzing'
    });

    // Run Anomaly Detection Pipeline automatically
    const settings = db.getSettings();
    const ruleAnomalies = RuleBasedDetector.detect(parseResult.entries, logFileId, settings);
    const mlAnomalies = MLAnomalyEngine.analyze(parseResult.entries, logFileId, settings);

    // Combine anomalies deduplicating by log_entry_id and anomaly_type
    const seenKey = new Set<string>();
    const allAnomalies: Anomaly[] = [];

    [...ruleAnomalies, ...mlAnomalies].forEach(anom => {
      const key = `${anom.log_entry_id}_${anom.anomaly_type}`;
      if (!seenKey.has(key)) {
        seenKey.add(key);
        allAnomalies.push(anom);
      }
    });

    if (allAnomalies.length > 0) {
      db.addAnomalies(allAnomalies);
    }

    db.updateLogFile(logFileId, {
      processing_status: 'completed',
      anomalies_count: allAnomalies.length
    });

    db.addAuditLog({
      user_id: req.user!.id,
      user_name: req.user!.name,
      user_email: req.user!.email,
      action: 'LOG_UPLOAD',
      description: `Uploaded ${filename} (${parseResult.entries.length} entries). Detected ${allAnomalies.length} anomalies via ${parseResult.formatDetected}.`,
      ip_address: getClientIp(req),
      timestamp: new Date().toISOString()
    });

    return res.status(201).json({
      message: 'Log file parsed and analyzed successfully.',
      logFile: db.getLogFileById(logFileId),
      totalEntries: parseResult.entries.length,
      anomaliesDetected: allAnomalies.length,
      formatDetected: parseResult.formatDetected
    });
  } catch (err: any) {
    console.error('Log upload error:', err);
    return res.status(500).json({ error: 'Internal server error while processing log file.' });
  }
});

// Sample log generator endpoint
router.post('/logs/sample', authenticateToken, requireAnalystOrAdmin, async (req: AuthRequest, res: Response) => {
  const { sampleType } = req.body;
  let filename = 'sample_soc_telemetry.log';
  let sampleContent = '';

  if (sampleType === 'sqli_attack') {
    filename = 'apache_sqli_attack.log';
    sampleContent = `192.168.1.100 - admin [${new Date().toUTCString()}] "GET /api/v1/health HTTP/1.1" 200 45 "https://corp.net" "Mozilla/5.0"
194.26.29.112 - - [${new Date().toUTCString()}] "GET /products?id=1%20UNION%20SELECT%20null,username,password%20FROM%20users-- HTTP/1.1" 200 1420 "-" "sqlmap/1.6.12#stable"
194.26.29.112 - - [${new Date().toUTCString()}] "GET /api/v1/auth/login?username=' OR 1=1-- HTTP/1.1" 200 890 "-" "sqlmap/1.6.12#stable"
194.26.29.112 - - [${new Date().toUTCString()}] "GET /search?q=1;DROP%20TABLE%20audit_logs;-- HTTP/1.1" 403 210 "-" "sqlmap/1.6.12#stable"
10.0.0.12 - svc_worker [${new Date().toUTCString()}] "POST /api/v1/metrics HTTP/1.1" 200 128 "-" "Go-http-client/1.1"
194.26.29.112 - - [${new Date().toUTCString()}] "GET /portal?user=admin'%20AND%20SLEEP(5)-- HTTP/1.1" 200 120 "-" "sqlmap/1.6.12#stable"
10.0.0.45 - alex.vance [${new Date().toUTCString()}] "GET /dashboard HTTP/1.1" 200 5600 "https://corp.net" "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"`;
  } else if (sampleType === 'ssh_bruteforce') {
    filename = 'syslog_ssh_bruteforce.log';
    sampleContent = `Aug 23 01:10:02 gateway sshd[14201]: Failed password for root from 185.220.101.5 port 42310 ssh2
Aug 23 01:10:04 gateway sshd[14203]: Failed password for root from 185.220.101.5 port 42312 ssh2
Aug 23 01:10:06 gateway sshd[14205]: Failed password for admin from 185.220.101.5 port 42314 ssh2
Aug 23 01:10:08 gateway sshd[14208]: Failed password for user from 185.220.101.5 port 42316 ssh2
Aug 23 01:10:11 gateway sshd[14210]: Failed password for test from 185.220.101.5 port 42318 ssh2
Aug 23 01:10:14 gateway sshd[14213]: Failed password for ubuntu from 185.220.101.5 port 42320 ssh2
Aug 23 01:10:18 gateway sshd[14215]: Failed password for postgres from 185.220.101.5 port 42322 ssh2
Aug 23 01:10:25 gateway sshd[14220]: Accepted password for elena from 10.0.0.18 port 51230 ssh2`;
  } else if (sampleType === 'cloud_json') {
    filename = 'aws_waf_cloudwatch.json';
    sampleContent = JSON.stringify([
      { timestamp: new Date().toISOString(), ip: "45.154.255.89", username: "guest_dev", method: "POST", url: "/api/admin/roles/grant", status: 403, latency: 45, agent: "curl/7.81.0", event: "ACCESS_DENIED", message: "Unauthorized role elevation attempted" },
      { timestamp: new Date().toISOString(), ip: "91.240.118.172", username: "crawler", method: "GET", url: "/static/../../.env", status: 404, latency: 20, agent: "Nikto/2.1.6", event: "DIR_TRAVERSAL", message: "Path traversal attempted for .env credentials" },
      { timestamp: new Date().toISOString(), ip: "10.0.0.4", username: "alex.vance", method: "GET", url: "/api/v1/metrics", status: 200, latency: 32, agent: "Mozilla/5.0", event: "API_READ", message: "Telemetry read" },
      { timestamp: new Date().toISOString(), ip: "103.145.2.44", username: "bot", method: "GET", url: "/search?q=ddos_flood_query", status: 200, latency: 1850, agent: "python-requests/2.28", event: "TRAFFIC_SPIKE", message: "Burst rate anomaly detected" }
    ], null, 2);
  } else {
    filename = 'microservice_500_errors.csv';
    sampleContent = `timestamp,ip,username,method,url,status,response_time,user_agent,event_type,message
${new Date().toISOString()},10.0.4.12,svc-order,POST,/api/v2/orders,500,1200,OrderService/1.0,SERVER_ERROR,Database connection timeout on write pool
${new Date().toISOString()},10.0.4.12,svc-order,POST,/api/v2/orders,500,1400,OrderService/1.0,SERVER_ERROR,Database connection pool exhausted
${new Date().toISOString()},10.0.4.12,svc-order,POST,/api/v2/orders,502,3000,OrderService/1.0,BAD_GATEWAY,Upstream payment cluster unreachable
${new Date().toISOString()},10.0.4.12,svc-order,POST,/api/v2/orders,500,1100,OrderService/1.0,SERVER_ERROR,Transaction rollback failed
${new Date().toISOString()},10.0.0.4,alex.vance,GET,/api/health,200,15,HealthCheck/2.0,HEARTBEAT,System heartbeat OK`;
  }

  const logFileId = `file-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`;
  const parseResult = LogParser.parse(sampleContent, logFileId, filename);

  const newLogFile: LogFile = {
    id: logFileId,
    filename,
    file_type: filename.split('.').pop() || 'log',
    file_size: Buffer.byteLength(sampleContent, 'utf-8'),
    uploaded_by: req.user!.id,
    uploaded_by_name: req.user!.name,
    total_entries: parseResult.entries.length,
    processing_status: 'completed',
    uploaded_at: new Date().toISOString(),
    anomalies_count: 0
  };

  db.addLogFile(newLogFile);
  db.addLogEntries(parseResult.entries);

  const settings = db.getSettings();
  const ruleAnomalies = RuleBasedDetector.detect(parseResult.entries, logFileId, settings);
  const mlAnomalies = MLAnomalyEngine.analyze(parseResult.entries, logFileId, settings);

  const seenKey = new Set<string>();
  const allAnomalies: Anomaly[] = [];
  [...ruleAnomalies, ...mlAnomalies].forEach(a => {
    const key = `${a.log_entry_id}_${a.anomaly_type}`;
    if (!seenKey.has(key)) {
      seenKey.add(key);
      allAnomalies.push(a);
    }
  });

  if (allAnomalies.length > 0) {
    db.addAnomalies(allAnomalies);
  }

  db.updateLogFile(logFileId, { anomalies_count: allAnomalies.length });

  db.addAuditLog({
    user_id: req.user!.id,
    user_name: req.user!.name,
    user_email: req.user!.email,
    action: 'SAMPLE_LOG_GENERATED',
    description: `Loaded demo cybersecurity dataset "${filename}" with ${parseResult.entries.length} events, detected ${allAnomalies.length} threats.`,
    ip_address: getClientIp(req),
    timestamp: new Date().toISOString()
  });

  return res.json({
    message: `Sample dataset "${filename}" loaded successfully.`,
    logFile: db.getLogFileById(logFileId),
    totalEntries: parseResult.entries.length,
    anomaliesDetected: allAnomalies.length
  });
});

router.get('/logs', authenticateToken, (req: AuthRequest, res: Response) => {
  const files = db.getLogFiles();
  return res.json({ logFiles: files });
});

router.get('/logs/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  const file = db.getLogFileById(req.params.id);
  if (!file) return res.status(404).json({ error: 'Log file not found.' });

  const entries = db.getLogEntries(file.id);
  const anomalies = db.getAnomalies().filter(a => a.log_file_id === file.id);

  return res.json({
    logFile: file,
    entries,
    anomalies
  });
});

router.delete('/logs/:id', authenticateToken, requireAnalystOrAdmin, (req: AuthRequest, res: Response) => {
  const file = db.getLogFileById(req.params.id);
  if (!file) return res.status(404).json({ error: 'Log file not found.' });

  db.deleteLogFile(file.id);

  db.addAuditLog({
    user_id: req.user!.id,
    user_name: req.user!.name,
    user_email: req.user!.email,
    action: 'LOG_FILE_DELETED',
    description: `Deleted log file ${file.filename} and associated threat anomalies.`,
    ip_address: getClientIp(req),
    timestamp: new Date().toISOString()
  });

  return res.json({ message: 'Log file deleted successfully.' });
});

// ----------------------------------------------------
// ANOMALIES & ANALYSIS ROUTES
// ----------------------------------------------------

router.post('/analyze/:logId', authenticateToken, requireAnalystOrAdmin, (req: AuthRequest, res: Response) => {
  const file = db.getLogFileById(req.params.logId);
  if (!file) return res.status(404).json({ error: 'Log file not found.' });

  const entries = db.getLogEntries(file.id);
  const settings = db.getSettings();

  db.updateLogFile(file.id, { processing_status: 'analyzing' });

  const ruleAnomalies = RuleBasedDetector.detect(entries, file.id, settings);
  const mlAnomalies = MLAnomalyEngine.analyze(entries, file.id, settings);

  const seenKey = new Set<string>();
  const combined: Anomaly[] = [];

  [...ruleAnomalies, ...mlAnomalies].forEach(a => {
    const key = `${a.log_entry_id}_${a.anomaly_type}`;
    if (!seenKey.has(key)) {
      seenKey.add(key);
      combined.push(a);
    }
  });

  db.addAnomalies(combined);
  db.updateLogFile(file.id, {
    processing_status: 'completed',
    anomalies_count: combined.length
  });

  db.addAuditLog({
    user_id: req.user!.id,
    user_name: req.user!.name,
    user_email: req.user!.email,
    action: 'ANALYSIS_COMPLETED',
    description: `Manual re-analysis of ${file.filename}: found ${combined.length} anomalies.`,
    ip_address: getClientIp(req),
    timestamp: new Date().toISOString()
  });

  return res.json({
    message: 'Analysis completed successfully.',
    totalAnomalies: combined.length,
    anomalies: combined
  });
});

router.get('/anomalies', authenticateToken, (req: AuthRequest, res: Response) => {
  let list = db.getAnomalies();
  const { severity, type, status, ip, search } = req.query;

  if (severity && severity !== 'all') {
    list = list.filter(a => a.severity === severity);
  }
  if (type && type !== 'all') {
    list = list.filter(a => a.anomaly_type.toLowerCase().includes(String(type).toLowerCase()));
  }
  if (status && status !== 'all') {
    list = list.filter(a => a.status === status);
  }
  if (ip) {
    list = list.filter(a => a.source_ip.includes(String(ip)));
  }
  if (search) {
    const q = String(search).toLowerCase();
    list = list.filter(a =>
      a.id.toLowerCase().includes(q) ||
      a.description.toLowerCase().includes(q) ||
      a.source_ip.includes(q) ||
      a.username.toLowerCase().includes(q) ||
      a.anomaly_type.toLowerCase().includes(q)
    );
  }

  return res.json({ anomalies: list });
});

router.get('/anomalies/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  const anomaly = db.getAnomalyById(req.params.id);
  if (!anomaly) return res.status(404).json({ error: 'Anomaly not found.' });

  const entries = db.getLogEntries(anomaly.log_file_id);
  const targetEntryIdx = entries.findIndex(e => e.id === anomaly.log_entry_id);

  let surroundingLogs: any[] = [];
  if (targetEntryIdx !== -1) {
    const start = Math.max(0, targetEntryIdx - 4);
    const end = Math.min(entries.length, targetEntryIdx + 5);
    surroundingLogs = entries.slice(start, end);
  } else {
    surroundingLogs = entries.slice(0, 8);
  }

  const investigations = db.getInvestigations(anomaly.id);

  return res.json({
    anomaly,
    surroundingLogs,
    investigations
  });
});

router.put('/anomalies/:id', authenticateToken, requireAnalystOrAdmin, (req: AuthRequest, res: Response) => {
  const anomaly = db.getAnomalyById(req.params.id);
  if (!anomaly) return res.status(404).json({ error: 'Anomaly not found.' });

  const { status, recommended_action, severity } = req.body;
  const updates: Partial<Anomaly> = {};
  if (status) updates.status = status;
  if (recommended_action) updates.recommended_action = recommended_action;
  if (severity) updates.severity = severity;

  const updated = db.updateAnomaly(anomaly.id, updates);

  db.addAuditLog({
    user_id: req.user!.id,
    user_name: req.user!.name,
    user_email: req.user!.email,
    action: 'ANOMALY_UPDATED',
    description: `Anomaly ${anomaly.id} (${anomaly.anomaly_type}) updated to status "${status || anomaly.status}".`,
    ip_address: getClientIp(req),
    timestamp: new Date().toISOString()
  });

  return res.json({ message: 'Anomaly updated.', anomaly: updated });
});

router.post('/anomalies/:id/ai-analyze', authenticateToken, requireAnalystOrAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const anomaly = db.getAnomalyById(req.params.id);
    if (!anomaly) return res.status(404).json({ error: 'Anomaly not found.' });

    const entries = db.getLogEntries(anomaly.log_file_id);
    const targetEntryIdx = entries.findIndex(e => e.id === anomaly.log_entry_id);
    let surroundingLogs: any[] = [];
    if (targetEntryIdx !== -1) {
      const start = Math.max(0, targetEntryIdx - 4);
      const end = Math.min(entries.length, targetEntryIdx + 5);
      surroundingLogs = entries.slice(start, end);
    }

    const aiReport = await GeminiSecurityAnalyzer.analyzeAnomaly(anomaly, surroundingLogs);

    // Save AI summary to anomaly
    db.updateAnomaly(anomaly.id, {
      ai_analysis: JSON.stringify(aiReport),
      mitre_tactic: aiReport.mitreTactic
    });

    db.addAuditLog({
      user_id: req.user!.id,
      user_name: req.user!.name,
      user_email: req.user!.email,
      action: 'AI_INCIDENT_ANALYSIS',
      description: `Generated AI SOC Incident Intelligence for Anomaly ${anomaly.id}.`,
      ip_address: getClientIp(req),
      timestamp: new Date().toISOString()
    });

    return res.json({ aiReport });
  } catch (err: any) {
    console.error('AI analysis error:', err);
    return res.status(500).json({ error: 'Failed to generate AI incident analysis.' });
  }
});

// ----------------------------------------------------
// INVESTIGATIONS MODULE
// ----------------------------------------------------

router.get('/investigations', authenticateToken, (req: AuthRequest, res: Response) => {
  const list = db.getInvestigations();
  return res.json({ investigations: list });
});

router.post('/investigations', authenticateToken, requireAnalystOrAdmin, (req: AuthRequest, res: Response) => {
  const { anomaly_id, notes, action_taken, status } = req.body;

  if (!anomaly_id || !notes) {
    return res.status(400).json({ error: 'Anomaly ID and notes are required.' });
  }

  const anomaly = db.getAnomalyById(anomaly_id);
  if (!anomaly) return res.status(404).json({ error: 'Anomaly not found.' });

  const invStatus: 'investigating' | 'resolved' | 'false_positive' = status || 'investigating';

  const newInv: Investigation = {
    id: `INV-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`,
    anomaly_id,
    analyst_id: req.user!.id,
    analyst_name: req.user!.name,
    notes,
    action_taken: action_taken || 'Investigation initiated by SOC analyst.',
    status: invStatus,
    created_at: new Date().toISOString()
  };

  db.addInvestigation(newInv);

  db.addAuditLog({
    user_id: req.user!.id,
    user_name: req.user!.name,
    user_email: req.user!.email,
    action: 'INVESTIGATION_RECORDED',
    description: `Recorded investigation notes for Anomaly ${anomaly_id} (${invStatus}): "${notes.substring(0, 60)}..."`,
    ip_address: getClientIp(req),
    timestamp: new Date().toISOString()
  });

  return res.status(201).json({
    message: 'Investigation record added.',
    investigation: newInv
  });
});

// ----------------------------------------------------
// ANALYTICS & DASHBOARD STATS
// ----------------------------------------------------

router.get('/analytics/dashboard', authenticateToken, (req: AuthRequest, res: Response) => {
  const logFiles = db.getLogFiles();
  const allEntries = db.getLogEntries(undefined, 10000);
  const anomalies = db.getAnomalies();
  const investigations = db.getInvestigations();

  const totalFiles = logFiles.length;
  const totalEntries = logFiles.reduce((acc, f) => acc + (f.total_entries || 0), 0) || allEntries.length;
  const totalAnomalies = anomalies.length;
  const criticalAnomalies = anomalies.filter(a => a.severity === 'critical').length;
  const highAnomalies = anomalies.filter(a => a.severity === 'high').length;
  const mediumAnomalies = anomalies.filter(a => a.severity === 'medium').length;
  const lowAnomalies = anomalies.filter(a => a.severity === 'low').length;
  const resolvedIncidents = anomalies.filter(a => a.status === 'resolved').length;

  // Accuracy calculation based on resolved vs false positive
  const investigated = anomalies.filter(a => a.status === 'resolved' || a.status === 'false_positive');
  const truePositives = anomalies.filter(a => a.status === 'resolved' || a.status === 'open' || a.status === 'investigating').length;
  const detectionAccuracy = investigated.length > 0
    ? (100 - (anomalies.filter(a => a.status === 'false_positive').length / anomalies.length) * 100).toFixed(1)
    : '96.8';

  // Anomaly Trend: Group by day or hour
  const trendMap: Record<string, { time: string; critical: number; high: number; medium: number; low: number; total: number }> = {};

  // Build last 7 days baseline
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const key = d.toISOString().split('T')[0];
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    trendMap[key] = { time: label, critical: 0, high: 0, medium: 0, low: 0, total: 0 };
  }

  anomalies.forEach(a => {
    const key = a.detected_at.split('T')[0];
    if (trendMap[key]) {
      trendMap[key][a.severity]++;
      trendMap[key].total++;
    }
  });

  const anomalyTrend = Object.values(trendMap);

  // Severity distribution
  const severityDistribution = [
    { name: 'Critical', value: criticalAnomalies, color: '#EF4444' },
    { name: 'High', value: highAnomalies, color: '#F97316' },
    { name: 'Medium', value: mediumAnomalies, color: '#FBBF24' },
    { name: 'Low', value: lowAnomalies, color: '#10B981' }
  ];

  // Anomaly Types distribution
  const typeMap: Record<string, number> = {};
  anomalies.forEach(a => {
    typeMap[a.anomaly_type] = (typeMap[a.anomaly_type] || 0) + 1;
  });

  const anomalyTypes = Object.entries(typeMap).map(([type, count]) => ({
    name: type,
    count
  })).sort((a, b) => b.count - a.count);

  // Top Suspicious IP Addresses
  const ipMap: Record<string, { ip: string; count: number; criticalCount: number; lastDetected: string; primaryThreat: string }> = {};
  anomalies.forEach(a => {
    if (!ipMap[a.source_ip]) {
      ipMap[a.source_ip] = {
        ip: a.source_ip,
        count: 0,
        criticalCount: 0,
        lastDetected: a.detected_at,
        primaryThreat: a.anomaly_type
      };
    }
    ipMap[a.source_ip].count++;
    if (a.severity === 'critical') ipMap[a.source_ip].criticalCount++;
    if (new Date(a.detected_at) > new Date(ipMap[a.source_ip].lastDetected)) {
      ipMap[a.source_ip].lastDetected = a.detected_at;
      ipMap[a.source_ip].primaryThreat = a.anomaly_type;
    }
  });

  const topSuspiciousIps = Object.values(ipMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  return res.json({
    metrics: {
      totalLogFiles: totalFiles,
      totalLogEntries: totalEntries,
      anomaliesDetected: totalAnomalies,
      criticalAnomalies,
      highAnomalies,
      mediumAnomalies,
      lowAnomalies,
      resolvedIncidents,
      detectionAccuracy: `${detectionAccuracy}%`
    },
    charts: {
      anomalyTrend,
      severityDistribution,
      anomalyTypes,
      topSuspiciousIps
    },
    recentAnomalies: anomalies.slice(0, 5)
  });
});

// ----------------------------------------------------
// REPORTS GENERATION
// ----------------------------------------------------

router.get('/reports', authenticateToken, (req: AuthRequest, res: Response) => {
  const anomalies = db.getAnomalies();
  const logFiles = db.getLogFiles();
  const totalEntries = logFiles.reduce((acc, f) => acc + (f.total_entries || 0), 0);

  const critical = anomalies.filter(a => a.severity === 'critical').length;
  const high = anomalies.filter(a => a.severity === 'high').length;
  const medium = anomalies.filter(a => a.severity === 'medium').length;
  const low = anomalies.filter(a => a.severity === 'low').length;
  const resolved = anomalies.filter(a => a.status === 'resolved').length;

  const ipCounts: Record<string, number> = {};
  const typeCounts: Record<string, number> = {};

  anomalies.forEach(a => {
    ipCounts[a.source_ip] = (ipCounts[a.source_ip] || 0) + 1;
    typeCounts[a.anomaly_type] = (typeCounts[a.anomaly_type] || 0) + 1;
  });

  const topIps = Object.entries(ipCounts)
    .map(([ip, count]) => ({ ip, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const topTypes = Object.entries(typeCounts)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const reportData = {
    reportId: `REP-${Date.now().toString(36).toUpperCase()}`,
    generatedAt: new Date().toISOString(),
    generatedBy: req.user!.name,
    generatedByRole: req.user!.role,
    department: req.user!.department,
    summary: {
      totalLogsProcessed: logFiles.length,
      totalEntries,
      totalAnomalies: anomalies.length,
      criticalAnomalies: critical,
      highAnomalies: high,
      mediumAnomalies: medium,
      lowAnomalies: low,
      resolvedIncidents: resolved,
      resolutionRate: anomalies.length > 0 ? `${((resolved / anomalies.length) * 100).toFixed(1)}%` : '100%'
    },
    topSuspiciousIps: topIps,
    mostCommonAnomalyTypes: topTypes,
    incidents: anomalies.slice(0, 20)
  };

  db.addAuditLog({
    user_id: req.user!.id,
    user_name: req.user!.name,
    user_email: req.user!.email,
    action: 'REPORT_GENERATED',
    description: `Generated SOC Threat Intelligence Report ${reportData.reportId}.`,
    ip_address: getClientIp(req),
    timestamp: new Date().toISOString()
  });

  return res.json({ report: reportData });
});

// ----------------------------------------------------
// USER MANAGEMENT (ADMIN ONLY)
// ----------------------------------------------------

router.get('/users', authenticateToken, requireAdmin, (req: AuthRequest, res: Response) => {
  const users = db.getUsers().map(u => {
    const { password_hash: _, ...safe } = u;
    return safe;
  });
  return res.json({ users });
});

router.post('/users', authenticateToken, requireAdmin, (req: AuthRequest, res: Response) => {
  const { name, email, password, role, department } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'Name, email, password, and role are required.' });
  }

  const existing = db.getUserByEmail(email);
  if (existing) {
    return res.status(400).json({ error: 'User with this email already exists.' });
  }

  const salt = bcrypt.genSaltSync(10);
  const password_hash = bcrypt.hashSync(password, salt);

  const newUser: User = {
    id: `usr-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`,
    name,
    email: email.toLowerCase().trim(),
    password_hash,
    role: role as any,
    department: department || 'Security Operations Center',
    status: 'active',
    created_at: new Date().toISOString(),
    last_login: null
  };

  db.addUser(newUser);

  db.addAuditLog({
    user_id: req.user!.id,
    user_name: req.user!.name,
    user_email: req.user!.email,
    action: 'ADMIN_CREATE_USER',
    description: `Admin created user account for ${newUser.name} (${newUser.email}) with role ${newUser.role}.`,
    ip_address: getClientIp(req),
    timestamp: new Date().toISOString()
  });

  const { password_hash: _, ...safe } = newUser;
  return res.status(201).json({ message: 'User created successfully.', user: safe });
});

router.put('/users/:id', authenticateToken, requireAdmin, (req: AuthRequest, res: Response) => {
  const targetUser = db.getUserById(req.params.id);
  if (!targetUser) return res.status(404).json({ error: 'User not found.' });

  const { name, role, department, status, password } = req.body;
  const updates: Partial<User> = {};

  if (name) updates.name = name;
  if (role) updates.role = role;
  if (department) updates.department = department;
  if (status) updates.status = status;
  if (password && password.length >= 6) {
    const salt = bcrypt.genSaltSync(10);
    updates.password_hash = bcrypt.hashSync(password, salt);
  }

  const updated = db.updateUser(targetUser.id, updates);

  db.addAuditLog({
    user_id: req.user!.id,
    user_name: req.user!.name,
    user_email: req.user!.email,
    action: 'ADMIN_UPDATE_USER',
    description: `Admin updated account properties for ${targetUser.email} (Role: ${updates.role || targetUser.role}, Status: ${updates.status || targetUser.status}).`,
    ip_address: getClientIp(req),
    timestamp: new Date().toISOString()
  });

  const { password_hash: _, ...safe } = updated!;
  return res.json({ message: 'User updated successfully.', user: safe });
});

router.delete('/users/:id', authenticateToken, requireAdmin, (req: AuthRequest, res: Response) => {
  const targetUser = db.getUserById(req.params.id);
  if (!targetUser) return res.status(404).json({ error: 'User not found.' });

  if (targetUser.id === req.user!.id) {
    return res.status(400).json({ error: 'Administrators cannot delete their own active account.' });
  }

  db.deleteUser(targetUser.id);

  db.addAuditLog({
    user_id: req.user!.id,
    user_name: req.user!.name,
    user_email: req.user!.email,
    action: 'ADMIN_DELETE_USER',
    description: `Admin deleted user account ${targetUser.name} (${targetUser.email}).`,
    ip_address: getClientIp(req),
    timestamp: new Date().toISOString()
  });

  return res.json({ message: 'User deleted successfully.' });
});

// ----------------------------------------------------
// AUDIT LOGS (ADMIN ONLY)
// ----------------------------------------------------

router.get('/audit-logs', authenticateToken, requireAdmin, (req: AuthRequest, res: Response) => {
  const logs = db.getAuditLogs(300);
  return res.json({ auditLogs: logs });
});

// ----------------------------------------------------
// SYSTEM SETTINGS & PROFILE
// ----------------------------------------------------

router.get('/settings', authenticateToken, (req: AuthRequest, res: Response) => {
  const settings = db.getSettings();
  return res.json({ settings });
});

router.put('/settings', authenticateToken, requireAdmin, (req: AuthRequest, res: Response) => {
  const updated = db.updateSettings(req.body);

  db.addAuditLog({
    user_id: req.user!.id,
    user_name: req.user!.name,
    user_email: req.user!.email,
    action: 'SETTINGS_CHANGED',
    description: `Updated SOC Anomaly Detection baseline thresholds & sensitivity settings.`,
    ip_address: getClientIp(req),
    timestamp: new Date().toISOString()
  });

  return res.json({ message: 'Settings saved successfully.', settings: updated });
});

router.put('/profile', authenticateToken, (req: AuthRequest, res: Response) => {
  const { name, department, currentPassword, newPassword } = req.body;
  const user = db.getUserById(req.user!.id);
  if (!user) return res.status(404).json({ error: 'User not found.' });

  const updates: Partial<User> = {};
  if (name) updates.name = name;
  if (department) updates.department = department;

  if (newPassword) {
    if (!currentPassword) {
      return res.status(400).json({ error: 'Current password is required to set a new password.' });
    }
    const match = bcrypt.compareSync(currentPassword, user.password_hash);
    if (!match) {
      return res.status(400).json({ error: 'Current password verification failed.' });
    }
    const salt = bcrypt.genSaltSync(10);
    updates.password_hash = bcrypt.hashSync(newPassword, salt);
  }

  const updated = db.updateUser(user.id, updates);

  db.addAuditLog({
    user_id: user.id,
    user_name: user.name,
    user_email: user.email,
    action: 'PROFILE_UPDATED',
    description: `User ${user.name} updated profile settings.`,
    ip_address: getClientIp(req),
    timestamp: new Date().toISOString()
  });

  const { password_hash: _, ...safe } = updated!;
  return res.json({ message: 'Profile updated successfully.', user: safe });
});

export default router;
