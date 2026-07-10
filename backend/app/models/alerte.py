from sqlalchemy import Column, String, Float, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
from .database import Base

class Alerte(Base):
    __tablename__ = "alertes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    equipement_id = Column(String(50))
    type_alerte = Column(String(50))
    severite = Column(String(20))
    valeur_mesuree = Column(Float)
    seuil_alerte = Column(Float)
    unite_mesure = Column(String(20))
    message_alerte = Column(Text)
    statut = Column(String(20), default="OUVERTE")
    score_criticite = Column(Float)
    cree_le = Column(DateTime, default=datetime.utcnow)