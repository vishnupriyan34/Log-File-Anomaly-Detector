📄 Log File Anomaly Detector

🔍 Intelligent log analysis tool that automatically detects anomalies, errors, and suspicious patterns in system log files using Python.

🚀 Features

🧠 Smart Anomaly Detection — Identifies unusual patterns, spikes, and outliers in log data
⚡ Real-time Monitoring — Continuously watches log files for new entries
📊 Visual Reports — Generates clear summaries of detected anomalies
🔴 Severity Classification — Categorizes issues as Critical, Warning, or Info
📁 Multi-format Support — Works with .log, .txt, and custom log formats
🔔 Alert System — Notifies when anomaly thresholds are exceeded
🗂️ Batch Processing — Analyze historical log files in bulk


🛠️ Tech Stack
TechnologyPurpose🐍 PythonCore language📦 PandasLog data processing🤖 Scikit-learnAnomaly detection algorithms📈 MatplotlibVisualization🗃️ MySQLStoring anomaly records🔗 Git/GitHubVersion control

📂 Project Structure
log-anomaly-detector/
├── 📁 data/
│   ├── sample_logs/        # Sample log files for testing
│   └── output/             # Generated reports
├── 📁 src/
│   ├── detector.py         # Core anomaly detection logic
│   ├── parser.py           # Log file parser
│   ├── visualizer.py       # Report & chart generation
│   └── alerting.py         # Alert/notification system
├── 📁 models/
│   └── anomaly_model.pkl   # Trained ML model
├── 📁 tests/
│   └── test_detector.py    # Unit tests
├── 📄 requirements.txt
├── 📄 config.yaml
└── 📄 README.md

⚙️ Installation
bash# 1️⃣ Clone the repository
git clone https://github.com/vishnupriyan34/log-anomaly-detector.git
cd log-anomaly-detector

# 2️⃣ Create a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# 3️⃣ Install dependencies
pip install -r requirements.txt

▶️ Usage
bash# Analyze a single log file
python src/detector.py --file data/sample_logs/app.log

# Monitor a directory in real-time
python src/detector.py --watch /var/logs/ --interval 30

# Generate a detailed report
python src/detector.py --file app.log --report --output data/output/

🔍 How It Works
📥 Input Log File
      │
      ▼
🔎 Log Parser  →  Extracts timestamps, levels, messages
      │
      ▼
🧹 Preprocessor  →  Cleans & structures the data
      │
      ▼
🤖 ML Model  →  Isolation Forest / Statistical Analysis
      │
      ▼
🚨 Anomaly Classifier  →  Critical / Warning / Info
      │
      ▼
📊 Report Generator  →  Visual summary + alerts

📊 Sample Output
[2025-01-15 14:32:01] 🔴 CRITICAL — Unusual spike: 847 errors in 60s (threshold: 50)
[2025-01-15 14:35:22] 🟡 WARNING  — Repeated failed logins from IP 192.168.1.45
[2025-01-15 14:40:10] 🟢 INFO     — Service restart detected (downtime: 2.3s)

📈 Summary Report:
  Total Lines Processed : 128,450
  Anomalies Detected    : 23
  Critical              : 4
  Warnings              : 11
  Info                  : 8


👨‍💻 Author
Vishnu Priyan S
🎓 B.Tech Information Technology — V.S.B College of Engineering Technical Campus
Demo Video
https://vishnupriyan34.github.io/Demo-video---Infinite-/
