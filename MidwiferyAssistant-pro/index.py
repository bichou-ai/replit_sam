from app import app

# Nécessaire pour Vercel
app.debug = False

# Cette ligne n'est pas nécessaire pour Vercel, mais utile pour tests locaux
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
