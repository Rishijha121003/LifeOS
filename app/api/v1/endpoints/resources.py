from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.resource import Resource
from app.schemas.resource import ResourceResponse

router = APIRouter()


@router.get("/", response_model=List[ResourceResponse])
def get_resources(db: Session = Depends(get_db)):
    resources = db.query(Resource).order_by(Resource.order_index.asc(), Resource.id.asc()).all()
    return resources
