def explain_anomaly(log):

    if "CRITICAL" in log:
        return {
            "severity": "HIGH",
            "message": "High severity security or system problem detected."
        }

    elif "ERROR" in log:
        return {
            "severity": "MEDIUM",
            "message": "System encountered an error. Check application or database status."
        }

    elif "WARNING" in log:
        return {
            "severity": "LOW",
            "message": "Potential issue detected. Requires monitoring."
        }

    else:
        return {
            "severity": "UNKNOWN",
            "message": "Unknown anomaly."
        }