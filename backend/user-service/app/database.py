import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

DATABASE_HOST = os.getenv("DATABASE_HOST", "postgres")
DATABASE_PORT = os.getenv("DATABASE_PORT", "5432")
DATABASE_NAME = os.getenv("DATABASE_NAME", "workoutpartner")
DATABASE_USER = os.getenv("DATABASE_USER", "workoutpartner")
DATABASE_PASSWORD = os.getenv("DATABASE_PASSWORD", "workoutpartner_password")

DATABASE_URL = f"postgresql://{DATABASE_USER}:{DATABASE_PASSWORD}@{DATABASE_HOST}:{DATABASE_PORT}/{DATABASE_NAME}"

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
