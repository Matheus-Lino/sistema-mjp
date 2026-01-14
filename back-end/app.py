from flask import Flask
from flask_cors import CORS
from database import dashboard_bp
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

# Configurar CORS para aceitar requisições do frontend
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }
})

app.register_blueprint(dashboard_bp)

if __name__ == "__main__":
    debug_mode = os.getenv("FLASK_DEBUG", "False").lower() == "true"
    app.run(debug=debug_mode, host="localhost", port=5000)