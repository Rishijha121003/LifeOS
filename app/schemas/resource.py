from typing import Optional
from pydantic import BaseModel, ConfigDict

class ResourceBase(BaseModel):
    title: str
    description: Optional[str] = None
    url: str
    category: str = "General"
    order_index: int = 0

class ResourceCreate(ResourceBase):
    pass

class ResourceResponse(ResourceBase):
    id: int

    model_config = ConfigDict(from_attributes=True)
