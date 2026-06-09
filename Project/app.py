from flask import Flask, render_template, request
from anomaly_detector import detect_anomalies
from ai_explainer import explain_anomaly
import os

app = Flask(__name__)

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload():

    file = request.files['logfile']

    if file.filename == '':
        return "No file selected"

    filepath = os.path.join(UPLOAD_FOLDER, file.filename)

    file.save(filepath)

    with open(filepath, 'r', encoding='utf-8') as f:
        logs = f.readlines()

    anomalies = detect_anomalies(logs)

    explained_anomalies = []

    for item in anomalies:

        info = explain_anomaly(item)

        explained_anomalies.append({
            "log": item,
            "severity": info["severity"],
            "explanation": info["message"]
        })

    return render_template(
        "result.html",
        total_logs=len(logs),
        anomaly_count=len(anomalies),
        anomalies=explained_anomalies
    )

if __name__ == '__main__':
    app.run(debug=True)