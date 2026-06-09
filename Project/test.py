from anomaly_detector import detect_anomalies

logs = [
    "INFO Login Success",
    "ERROR Database Failed",
    "CRITICAL Unauthorized Access"
]

result = detect_anomalies(logs)

print(result)