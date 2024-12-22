from libraries import *
#client details are not mentioned 
app = Flask(__name__)
app.config["UPLOAD_FOLDER"] = "files"
os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def save_file(file):
    filename = secure_filename(file.filename)
    file_path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
    file.save(file_path)
    logger.info(f"Saved uploaded file at: {file_path}")
    return file_path
  
def process_file(file):
    file_path = save_file(file)
    file_type = file.filename.rsplit('.', 1)[-1].lower()
   
    if file_type == 'pdf':
        with open(file_path, "rb") as pdf:
            reader = PdfReader(pdf)
            return "".join(page.extract_text() or "" for page in reader.pages)
    elif file_type == 'csv':
        return pd.read_csv(file_path).to_json()
    elif file_type == 'json':
        with open(file_path) as f:
            return json.dumps(json.load(f))
    elif file_type == 'xlsx':
        return pd.read_excel(file_path).to_json()
    elif file_type == 'txt':
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
    return "Unsupported file type."


def ai_assistant(question, context):
    try:
        stream = client.chat.completions.create(
            messages=[
                {"role": "system", "content": context},
                {"role": "user", "content": question}
            ],
            model="gpt-4o-gs",
            stream=True,
        )
        for chunk in stream:
            if chunk.choices and chunk.choices[0].delta and chunk.choices[0].delta.content:
                content = chunk.choices[0].delta.content
                if content:
                    yield content
    except Exception as e:
        logger.error(f"Failed to stream chatbot response: {e}")
        yield "Failed to generate answer."


       
@app.route('/')
def index():
    return render_template("UI.html")

@app.route('/ask', methods=['POST'])
def query():
    file = request.files.get('file')
    question = request.form.get('question', "").strip()
    context = ""
    if file:
        context = process_file(file)
    if not question:
        return jsonify({"error": "Please provide a question."}), 400
        
    def generate():
        for chunk in ai_assistant(question, context or "No additional context provided."):
            yield chunk
    return Response(generate(), mimetype='text/plain')

if __name__ == "__main__":
    app.run(debug=True)



