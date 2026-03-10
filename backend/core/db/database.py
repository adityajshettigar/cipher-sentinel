from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# The database file will be created in your backend folder
SQLALCHEMY_DATABASE_URL = "sqlite:///./cipher_sentinel.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# This is the generator for FastAPI to handle connections
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()