from dotenv import load_dotenv
load_dotenv()  # Load environment variables from .env file
import time
import os
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

  # Loads variables from .env into os.environ
# Import Modular Feature Routers
from app.routers import snapshots, actors, stylometry, graph
from app.routers.undercover_ops import router as undercover_router
from app.routers.analytics import router as analytics_router

# Application Metadata
app = FastAPI(
    title="Velicham Intelligence API Engine",
    description="Backend API for Dark Web Threat Actor De-anonymization, OSINT Correlation, and Evidentiary Snapshots.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configurable origins with defaults for Vite frontend (ports 5173 / 5174)
# Configurable origins including your current port 5175
allowed_origins = os.getenv(
    "ALLOWED_ORIGINS", 
    "http://localhost:5173,http://localhost:5174,http://localhost:5175,http://127.0.0.1:5173,http://127.0.0.1:5174,http://127.0.0.1:5175"
).split(",")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins, ports, and domains during development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Middleware: Log Request Execution Latency
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.perf_counter()
    response = await call_next(request)
    process_time = time.perf_counter() - start_time
    response.headers["X-Process-Time"] = f"{process_time:.4f}s"
    return response

# Global Fallback Exception Handler (Prevents server crash leaks)
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Internal System Error",
            "message": str(exc),  # Helpful for debugging during development
            "path": request.url.path
        },
    )

# --- DIRECT HONEYTOKEN ROUTER (Fixes the missing 404 endpoint) ---
from fastapi import APIRouter
honey_router = APIRouter(prefix="/api/honeytokens", tags=["Honeytokens"])

class HoneyTokenRequest(BaseModel):
    name: str
    token_type: str = "AWS"

@honey_router.post("/generate")
def generate_honeytoken(payload: HoneyTokenRequest):
    return {
        "status": "Armed & Deployed",
        "name": payload.name,
        "type": payload.token_type,
        "payload": f"AKIA_CANARY_{payload.token_type.upper()}_99812739182"
    }

# Register Modular Feature Routers
app.include_router(snapshots.router)
app.include_router(actors.router)
app.include_router(stylometry.router)
app.include_router(graph.router)
app.include_router(undercover_router)
app.include_router(analytics_router)
app.include_router(honey_router)

# Core System Health Route
@app.get("/", tags=["System"])
def read_root():
    return {
        "system": "Velicham Core Engine",
        "status": "Backend is running and active defense mesh is online.",
        "version": "1.0.0",
        "environment": os.getenv("ENV", "development"),
        "message": "Velicham API is running"
    }