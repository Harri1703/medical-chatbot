import os
import fitz
import openai
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS

load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def extract_text_from_pdf(pdf_path):
    doc = fitz.open(pdf_path)
    text = "\n".join([page.get_text("text") for page in doc])
    return text.strip()

def get_openai_response(prompt):
    client = openai.OpenAI(api_key=OPENAI_API_KEY)
    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "system", "content": prompt}]
    )
    return response.choices[0].message.content.strip()

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    file_path = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(file_path)

    report_text = extract_text_from_pdf(file_path)
    summary = simplify_findings(report_text)
    severity = assess_severity(report_text)

    return jsonify({
        "message": "File uploaded successfully!",
        "summary": summary,
        "severity": severity,
        "report_text": report_text
    })

@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    report_text = data.get("report_text")
    user_query = data.get("query")

    if not report_text or not user_query:
        return jsonify({"error": "Missing report text or query"}), 400

    answer = answer_query(report_text, user_query)
    return jsonify({"response": answer})

def simplify_findings(report_text):
    prompt = f"""
    Given the following medical report, provide a very short summary (1-2 sentences) in simple terms for a layperson.

    Report:
    {report_text}

    Short Summary:
    """
    return get_openai_response(prompt)

def assess_severity(report_text):
    prompt = f"""
    Analyze the following medical report and provide a severity assessment in simple terms (mild, moderate, severe, critical).

    Report:
    {report_text}

    Severity Level:
    """
    return get_openai_response(prompt)

def answer_query(report_text, query):
    prompt = f"""
    You are a medical assistant. Based on the following medical report, answer the given question in a simple way.

    Report:
    {report_text}

    Question: {query}

    Answer:
    """
    return get_openai_response(prompt)

if __name__ == '__main__':
    app.run(debug=True)