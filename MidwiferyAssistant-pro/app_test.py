from flask import Flask

app = Flask(__name__)

@app.route('/')
def hello_world():
    return "<h1>Bonjour depuis Vercel! (Test App)</h1>"

if __name__ == '__main__':
    app.run(debug=True) # Remove this line for Vercel deployment
