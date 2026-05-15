from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.controller.matching_controller import router as matching_router
from app.controller.chat_controller import router as chat_router

app = FastAPI(
    title="Workout Partner - Matching & Chat Service",
    description="AI partner matching and 1-to-1 real-time chat",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(matching_router, prefix="/api/v1")
app.include_router(chat_router, prefix="/api/v1")


@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "matching-service"}


@app.get("/")
def root():
    return {"service": "matching-service", "version": "1.0.0"}
