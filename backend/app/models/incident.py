from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel


class Severite(str, Enum):
    INFO = "INFO"
    MINEURE = "MINEURE"
    MAJEURE = "MAJEURE"
    CRITIQUE = "CRITIQUE"


class Priorite(str, Enum):
    P1_CRITIQUE = "P1_CRITIQUE"
    P2_HAUTE = "P2_HAUTE"
    P3_MOYENNE = "P3_MOYENNE"
    P4_BASSE = "P4_BASSE"


class CategorieIncident(str, Enum):
    SYSTEME = "SYSTEME"
    RESEAU = "RESEAU"
    SERVICE = "SERVICE"
    APPLICATIF = "APPLICATIF"
    INFRASTRUCTURE = "INFRASTRUCTURE"
    ENVIRONNEMENT_SITE = "ENVIRONNEMENT_SITE"
    SECURITE = "SECURITE"
    INCONNU = "INCONNU"


class StatutIncident(str, Enum):
    OUVERT = "OUVERT"
    EN_COURS = "EN_COURS"
    ESCALADE = "ESCALADE"
    RESOLU = "RESOLU"
    CLOTURE = "CLOTURE"


class IncidentBase(BaseModel):
    titre: str
    description: Optional[str] = None
    categorie: CategorieIncident = CategorieIncident.INCONNU
    severite: Severite
    priorite: Priorite = Priorite.P3_MOYENNE
    score_criticite: float = 0
    cause_probable: Optional[str] = None
    action_recommandee: Optional[str] = None
    niveau_escalade: Optional[str] = "N1"


class IncidentCreate(IncidentBase):
    alerte_source_id: Optional[str] = None
    site_id: Optional[str] = None
    equipement_id: Optional[str] = None
    service_id: Optional[str] = None


class IncidentUpdate(BaseModel):
    statut: Optional[StatutIncident] = None
    assigne_a: Optional[str] = None
    commentaire_cloture: Optional[str] = None
    niveau_escalade: Optional[str] = None


class IncidentOut(IncidentBase):
    id: str
    reference: str
    statut: StatutIncident
    date_creation: datetime
    date_resolution: Optional[datetime] = None
    assigne_a: Optional[str] = None

    class Config:
        from_attributes = True
