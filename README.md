# 📄 Log File Anomaly Detector

> 🔍 An intelligent log analysis tool that automatically detects **anomalies, errors, unusual patterns, and suspicious activities** in system log files using Python and Machine Learning.

🎥 **Demo Video:** [View Project Demo](https://vishnupriyan34.github.io/Demo-video---Infinite-/)

---

## 📌 About

**Log File Anomaly Detector** is a Python-based log analysis system designed to identify unusual behavior and potential issues from system and application log files.

The system processes log data, extracts meaningful information, applies anomaly detection techniques, classifies detected issues based on severity, and generates visual reports for easier analysis.

It can be used for analyzing both **historical log files** and continuously monitoring logs for newly generated entries.

---

## ✨ Features

* 🧠 **Smart Anomaly Detection** — Identifies unusual patterns, spikes, and outliers in log data
* ⚡ **Real-Time Monitoring** — Continuously monitors log files for new entries
* 📊 **Visual Reports** — Generates charts and summaries of detected anomalies
* 🔴 **Severity Classification** — Categorizes issues as Critical, Warning, or Info
* 📁 **Multi-Format Support** — Supports `.log`, `.txt`, and custom log formats
* 🔔 **Alert System** — Generates alerts when anomaly thresholds are exceeded
* 🗂️ **Batch Processing** — Processes multiple historical log files
* 🤖 **Machine Learning Detection** — Uses anomaly detection algorithms for identifying unusual behavior
* 🧪 **Testing Support** — Includes unit tests for core detection functionality

---

# 🛠️ Tech Stack

| Technology      | Purpose                                  |
| --------------- | ---------------------------------------- |
| 🐍 Python       | Core programming language                |
| 📦 Pandas       | Log data processing and analysis         |
| 🤖 Scikit-learn | Machine Learning and anomaly detection   |
| 📈 Matplotlib   | Data visualization and report generation |
| 🗃️ MySQL       | Storing anomaly records                  |
| 🔗 Git & GitHub | Version control and project management   |

---

# 📂 Project Structure

```text
log-anomaly-detector/
│
├── 📁 data/
│   ├── 📁 sample_logs/
│   │   └── Sample log files for testing
│   │
│   └── 📁 output/
│       └── Generated reports and analysis results
│
├── 📁 src/
│   ├── 🧠 detector.py
│   │   └── Core anomaly detection logic
│   │
│   ├── 🔎 parser.py
│   │   └── Log file parsing and data extraction
│   │
│   ├── 📊 visualizer.py
│   │   └── Report and chart generation
│   │
│   └── 🔔 alerting.py
│       └── Alert and notification system
│
├── 📁 models/
│   └── 🤖 anomaly_model.pkl
│       └── Trained Machine Learning model
│
├── 📁 tests/
│   └── 🧪 test_detector.py
│       └── Unit tests for anomaly detection
│
├── 📄 requirements.txt
├── 📄 config.yaml
└── 📄 README.md
```

---

# 🚀 Installation & Setup

## 1️⃣ Clone the Repository

```bash
git clone https://github.com/vishnupriyan34/log-anomaly-detector.git
```

## 2️⃣ Navigate to the Project

```bash
cd log-anomaly-detector
```

## 3️⃣ Create a Virtual Environment

### Windows

```bash
python -m venv venv
venv\Scripts\activate
```

### Linux / macOS

```bash
python -m venv venv
source venv/bin/activate
```

## 4️⃣ Install Dependencies

```bash
pip install -r requirements.txt
```

---

# ▶️ Usage

## 🔎 Analyze a Single Log File

```bash
python src/detector.py --file data/sample_logs/app.log
```

This processes the selected log file and detects unusual patterns.

---

## ⚡ Monitor Logs in Real Time

```bash
python src/detector.py --watch /var/logs/ --interval 30
```

The system continuously monitors the specified directory and checks for newly generated log entries.

---

## 📊 Generate a Detailed Report

```bash
python src/detector.py --file app.log --report --output data/output/
```

The generated report contains anomaly summaries and visual analysis.

---

# 🔍 How It Works

```text
📥 Input Log File
       │
       ▼
🔎 Log Parser
   Extract timestamps,
   levels & messages
       │
       ▼
🧹 Preprocessor
   Clean & structure
   the log data
       │
       ▼
🤖 ML Model
   Isolation Forest /
   Statistical Analysis
       │
       ▼
🚨 Anomaly Classifier
   Critical / Warning / Info
       │
       ▼
📊 Report Generator
   Visual summaries
   + Alerts
```

---

# 🧠 Detection Pipeline

### 1️⃣ Log Collection

The system accepts log files containing system or application events.

### 2️⃣ Log Parsing

The parser extracts useful information such as:

* Timestamp
* Log level
* Event message
* Error information
* Other available log attributes

### 3️⃣ Data Preprocessing

Raw log entries are cleaned and converted into a structured format suitable for analysis.

### 4️⃣ Anomaly Detection

Machine Learning and statistical techniques are applied to identify unusual behavior.

The project can use approaches such as:

* **Isolation Forest**
* Statistical threshold analysis
* Frequency-based anomaly detection
* Pattern-based analysis

### 5️⃣ Severity Classification

Detected events are classified into:

| Severity        | Meaning                                            |
| --------------- | -------------------------------------------------- |
| 🔴 **Critical** | High-priority or potentially serious anomaly       |
| 🟡 **Warning**  | Suspicious or unusual behavior requiring attention |
| 🟢 **Info**     | Informational or low-risk event                    |

### 6️⃣ Reporting & Alerting

The system generates summaries, visualizations, and alerts for detected anomalies.

---

# 📊 Sample Output

```text
[2025-01-15 14:32:01]
🔴 CRITICAL — Unusual spike: 847 errors in 60s
Threshold: 50

[2025-01-15 14:35:22]
🟡 WARNING — Repeated failed logins detected
Source IP: 192.168.1.45

[2025-01-15 14:40:10]
🟢 INFO — Service restart detected
Downtime: 2.3s
```

---

# 📈 Sample Analysis Summary

```text
┌─────────────────────────────────────┐
│         LOG ANALYSIS REPORT         │
├─────────────────────────────────────┤
│ Total Lines Processed : 128,450    │
│ Anomalies Detected    : 23         │
│ Critical              : 4          │
│ Warnings              : 11         │
│ Info                  : 8          │
└─────────────────────────────────────┘
```

---

# 📊 Project Workflow

```text
Log Files
    ↓
Log Parsing
    ↓
Data Cleaning
    ↓
Feature Extraction
    ↓
Anomaly Detection
    ↓
Severity Classification
    ↓
Visualization
    ↓
Alerts & Reports
```

---

# 🎯 Use Cases

This project can be useful for:

* 🖥️ **System Monitoring**
* 🌐 **Web Application Monitoring**
* 🗄️ **Server Log Analysis**
* 🔐 **Security Monitoring**
* 🚨 **Error Detection**
* 📊 **Operational Analytics**
* 🔧 **Troubleshooting**
* 📈 **Application Performance Monitoring**

---

# 🧪 Testing

Unit tests are included for validating the core anomaly detection functionality.

Run the tests using:

```bash
pytest
```

---

# 🚀 Future Enhancements

Potential improvements for the project include:

* 🌐 Web-based monitoring dashboard
* 🔔 Email and SMS notifications
* 🤖 Advanced ML models
* 🔐 Security threat detection
* 📡 Distributed log monitoring
* ☁️ Cloud-based log processing
* 📊 Interactive dashboards using Power BI or Plotly
* 🧠 Automated anomaly explanation using Generative AI

---

# 👨‍💻 Author

## Vishnu Priyan S

🎓 **B.Tech Information Technology**
🏫 **V.S.B College of Engineering Technical Campus**

Interested in:

`Software Development` · `Data Analytics` · `AI/ML` · `Cloud Computing` · `Cybersecurity`

---

# 🎥 Demo

🎬 **Project Demo:**
https://vishnupriyan34.github.io/Demo-video---Infinite-/

---

# 📄 License

This project is licensed under the **MIT License**.

Feel free to use this project for learning and inspiration, but please give appropriate credit when building upon the work.

---

⭐ **If you found this project interesting, consider giving the repository a star!**

🚀 **Thanks for visiting the Log File Anomaly Detector repository!**
