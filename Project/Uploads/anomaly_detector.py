def detect_anomalies(logs):

    anomalies = []

    keywords = [
        "ERROR",
        "WARNING",
        "CRITICAL",
        "FAILED",
        "FAIL",
        "UNAUTHORIZED",
        "TIMEOUT",
        "EXCEPTION",
        "ACCESS DENIED",
        "LOGIN FAILED",
        "SECURITY",
        "OVERLOAD"
    ]

    for log in logs:

        upper_log = log.upper()

        for keyword in keywords:

            if keyword in upper_log:
                anomalies.append(log.strip())
                break

    return anomalies