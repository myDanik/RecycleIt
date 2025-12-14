from app.db.models import Base
from app.db.session import engine

Base.metadata.create_all(bind=engine)
print("All tables created")