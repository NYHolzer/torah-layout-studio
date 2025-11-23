from fastapi import FastAPI

app = FastAPI(title="Torah Layout Studio API")


@app.get("/health")
def read_health():
    """
    Simple health check endpoint so that:
    - We can verify the server is running
    - We can write our first test against a real FastAPI app
    """
    return {"status": "ok"}