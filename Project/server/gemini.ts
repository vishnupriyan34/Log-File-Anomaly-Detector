import { GoogleGenAI } from '@google/genai';
import { Anomaly, LogEntry } from './db.js';

let aiClient: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

export interface AIAnalysisResult {
  threatSummary: string;
  mitreTactic: string;
  impactAssessment: string;
  recommendedActions: string[];
  remediationSteps: string[];
}

export class GeminiSecurityAnalyzer {
  static async analyzeAnomaly(anomaly: Anomaly, surroundingLogs: LogEntry[]): Promise<AIAnalysisResult> {
    const ai = getAIClient();

    // Fallback if no API key or error
    if (!ai) {
      return this.getLocalCybersecurityAnalysis(anomaly);
    }

    try {
      const logsContext = surroundingLogs.slice(0, 8).map(l =>
        `[${l.timestamp}] ${l.ip_address} (${l.username}) ${l.http_method} ${l.request_url} -> ${l.status_code} (${l.response_time}ms) | ${l.message}`
      ).join('\n');

      const prompt = `You are a Senior Security Operations Center (SOC) Tier-3 Incident Commander.
Analyze the following detected cybersecurity log anomaly and surrounding telemetry context:

ANOMALY DETAILS:
- ID: ${anomaly.id}
- Type: ${anomaly.anomaly_type}
- Severity: ${anomaly.severity.toUpperCase()}
- Confidence Score: ${anomaly.confidence_score}%
- Source IP: ${anomaly.source_ip}
- Target/User: ${anomaly.username}
- URL/Request: ${anomaly.request_url}
- Description: ${anomaly.description}

SURROUNDING LOG CONTEXT:
${logsContext || 'No surrounding logs available.'}

Provide an actionable, authoritative SOC Incident Report in JSON format matching this schema:
{
  "threatSummary": "2-3 sentence executive threat summary",
  "mitreTactic": "MITRE ATT&CK Matrix Tactic & ID (e.g. Credential Access T1110)",
  "impactAssessment": "Concise risk & blast radius assessment",
  "recommendedActions": ["Immediate containment step 1", "Step 2", "Step 3"],
  "remediationSteps": ["Long-term hardening step 1", "Step 2"]
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const text = response.text;
      if (text) {
        const parsed = JSON.parse(text);
        return {
          threatSummary: parsed.threatSummary || anomaly.description,
          mitreTactic: parsed.mitreTactic || anomaly.mitre_tactic || 'Defensive Analysis (TA0007)',
          impactAssessment: parsed.impactAssessment || `Potential threat level: ${anomaly.severity.toUpperCase()}`,
          recommendedActions: Array.isArray(parsed.recommendedActions) ? parsed.recommendedActions : [anomaly.recommended_action],
          remediationSteps: Array.isArray(parsed.remediationSteps) ? parsed.remediationSteps : ['Review ingress firewall rules', 'Audit user permissions']
        };
      }
    } catch (err) {
      console.warn('Gemini AI analysis warning, falling back to local threat intelligence:', err);
    }

    return this.getLocalCybersecurityAnalysis(anomaly);
  }

  private static getLocalCybersecurityAnalysis(anomaly: Anomaly): AIAnalysisResult {
    const type = anomaly.anomaly_type.toLowerCase();

    if (type.includes('sql') || type.includes('injection')) {
      return {
        threatSummary: `Adversary targeting public web application with structured SQL Injection payload from ${anomaly.source_ip}. Threat intent appears to be database enumeration or authentication bypass.`,
        mitreTactic: 'Initial Access / Exploit Public-Facing Application (T1190)',
        impactAssessment: 'High potential for data exfiltration, user table unauthorized disclosure, or SQL database tampering.',
        recommendedActions: [
          `Temporarily blacklist IP ${anomaly.source_ip} on perimeter edge firewall / WAF.`,
          'Inspect application database query logs for successful SQL syntax executions.',
          'Verify that Data Access Layer uses strict parameterized queries / ORM prepared statements.'
        ],
        remediationSteps: [
          'Enable strict WAF SQLi Core Rule Set (CRS 942100+).',
          'Run automated dynamic application security testing (DAST) on all input endpoints.'
        ]
      };
    }

    if (type.includes('brute') || type.includes('password') || type.includes('auth')) {
      return {
        threatSummary: `Sustained dictionary / password guessing attack detected against authentication service from ${anomaly.source_ip} targeting account "${anomaly.username}".`,
        mitreTactic: 'Credential Access (T1110.001 - Password Guessing)',
        impactAssessment: 'High probability of account compromise if user accounts have default or weak credentials.',
        recommendedActions: [
          `Add IP ${anomaly.source_ip} to fail2ban / ingress drop list.`,
          `Trigger forced password reset and session invalidation for targeted account "${anomaly.username}".`,
          'Audit recent successful logins from this IP range.'
        ],
        remediationSteps: [
          'Enforce Multi-Factor Authentication (MFA / FIDO2) across all portal endpoints.',
          'Implement exponential backoff and CAPTCHA challenge after 3 failed login attempts.'
        ]
      };
    }

    if (type.includes('traversal') || type.includes('unauthorized') || type.includes('privilege')) {
      return {
        threatSummary: `Unauthorized access and privilege escalation probing detected on sensitive internal resources from ${anomaly.source_ip}.`,
        mitreTactic: 'Privilege Escalation & Discovery (T1068 / T1083)',
        impactAssessment: 'Exposure of critical configuration files (.env, credentials) or unauthorized role elevation.',
        recommendedActions: [
          'Audit web server static root configuration to prevent path traversal.',
          'Revoke compromised session tokens and API keys.',
          'Block foreign subnet if activity persists.'
        ],
        remediationSteps: [
          'Enforce strict Principle of Least Privilege on file system permissions.',
          'Add route-level RBAC middleware validation for administrative paths.'
        ]
      };
    }

    return {
      threatSummary: `Anomaly detected by multi-dimensional security analytics engine: ${anomaly.description}`,
      mitreTactic: anomaly.mitre_tactic || 'Discovery / Defense Evasion (TA0005)',
      impactAssessment: `Risk level classified as ${anomaly.severity.toUpperCase()} with confidence score ${anomaly.confidence_score}%.`,
      recommendedActions: [
        `Review logs from IP ${anomaly.source_ip} for previous 24 hours.`,
        'Verify host endpoint telemetry for suspicious child processes.',
        'Cross-reference IP against AbuseIPDB and VirusTotal threat feeds.'
      ],
      remediationSteps: [
        'Fine-tune anomaly detection baseline thresholds in SOC settings.',
        'Deploy centralized SIEM alerting for real-time triage.'
      ]
    };
  }
}
