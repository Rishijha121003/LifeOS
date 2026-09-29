from pydantic import BaseModel, ConfigDict

class SettingBase(BaseModel):
    key: str
    value: str

class SettingResponse(SettingBase):
    id: int
    model_config = ConfigDict(from_attributes=True)
