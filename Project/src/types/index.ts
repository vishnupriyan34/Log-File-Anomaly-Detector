export type UserRole = 'admin' | 'analyst' | 'viewer';
export type UserStatus = 'active' | 'disabled';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  status: UserStatus;
  created_at: string;
  last_login: string | null;
}

export type ProcessingStatus = 'uploading' | 'processing' | 'analyzing' | 'completed' | 'failed';

export interface LogFile {
  id: string;
  filename: string;
  file_type: string;
  file_size: number;
  uploaded_by: string;
  uploaded_by_name: string;
  total_entries: number;
  processing_status: ProcessingStatus;
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
  response_time: number;
  user_agent: string;
  event_type: string;
  message: string;
  is_anomalous: boolean;
  raw_line?: string;
}

export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low';
export type AnomalyStatus = 'open' | 'investigating' | 'resolved' | 'false_positive';

export interface Anomaly {
  id: string;
  log_file_id: string;
  log_entry_id: string;
  anomaly_type: string;
  severity: SeverityLevel;
  confidence_score: number;
  anomaly_score: number;
  description: string;
  recommended_action: string;
  status: AnomalyStatus;
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
  detection_sensitivity: number;
  anomaly_threshold: number;
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

export interface DashboardMetrics {
  totalLogFiles: number;
  totalLogEntries: number;
  anomaliesDetected: number;
  criticalAnomalies: number;
  highAnomalies: number;
  mediumAnomalies: number;
  lowAnomalies: number;
  resolvedIncidents: number;
  detectionAccuracy: string;
}

export interface SuspiciousIp {
  ip: string;
  count: number;
  criticalCount: number;
  lastDetected: string;
  primaryThreat: string;
}

export interface AIReportData {
  threatSummary: string;
  mitreTactic: string;
  impactAssessment: string;
  recommendedActions: string[];
  remediationSteps: string[];
}
