from sqlalchemy import Column, Integer, String, Text
from app.db.base import Base

class Resource(Base):
    __tablename__ = "resources"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    url = Column(String(500), nullable=False)
    category = Column(String(50), default="General", nullable=False)
    order_index = Column(Integer, default=0, nullable=False)
