from enum import Enum
from typing import Optional
from pydantic import BaseModel, EmailStr


class RoleUtilisateur(str, Enum):
    ADMIN = "ADMIN"
    SUPERVISEUR = "SUPERVISEUR"
    TECHNICIEN = "TECHNICIEN"
    LECTEUR = "LECTEUR"


class UtilisateurBase(BaseModel):
    nom_complet: str
    email: EmailStr
    role: RoleUtilisateur = RoleUtilisateur.LECTEUR
    actif: bool = True


class UtilisateurCreate(UtilisateurBase):
    pass


class UtilisateurUpdate(BaseModel):
    nom_complet: Optional[str] = None
    role: Optional[RoleUtilisateur] = None
    actif: Optional[bool] = None


class UtilisateurOut(UtilisateurBase):
    id: str

    class Config:
        from_attributes = True
