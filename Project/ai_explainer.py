def explain_anomaly(log):

    upper_log = log.upper()

    if "CRITICAL" in upper_log or "SECURITY" in upper_log or "UNAUTHORIZED" in upper_log:
        return {
            "severity": "HIGH",
            "message": "Potential security threat or critical system issue detected."
        }

    elif "ERROR" in upper_log or "FAILED" in upper_log or "FAIL" in upper_log:
        return {
            "severity": "MEDIUM",
            "message": "Operation failed. Investigation may be required."
        }

    elif "WARNING" in upper_log or "TIMEOUT" in upper_log or "ACCESS DENIED" in upper_log:
        return {
            "severity": "LOW",
            "message": "Suspicious activity detected. Monitoring is recommended."
        }

    else:
        return {
            "severity": "UNKNOWN",
            "message": "Unknown anomaly."
        }