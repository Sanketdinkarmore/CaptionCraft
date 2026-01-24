from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, EmailStr, Field
from bson import ObjectId

# Pydantic model for ObjectId
class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v, *args, **kwargs):
        """
        Pydantic v2 validator signature includes an extra 'info' argument.
        Accept *args/**kwargs for compatibility.
        """
        if v is None:
            return None
        if isinstance(v, ObjectId):
            return v
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(cls, field_schema):
        field_schema.update(type="string")

# ==================== User Models ====================

class UserBase(BaseModel):
    email: EmailStr
    name: str

class UserCreate(UserBase):
    password: str

class UserInDB(UserBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    password_hash: str
    google_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class UserResponse(UserBase):
    id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# ==================== Project Models ====================

class StyledSpan(BaseModel):
    text: str
    color: Optional[str] = None
    fontWeight: Optional[str] = None
    fontFamily: Optional[str] = None
    fontSize: Optional[float] = None
    underline: Optional[bool] = None
    background: Optional[str] = None

class Position(BaseModel):
    x: float
    y: float

class Segment(BaseModel):
    start: float
    end: float
    content: List[StyledSpan]
    position: Optional[Position] = None

class GlobalStyle(BaseModel):
    fontSize: float
    color: str
    background: str
    fontFamily: str
    preset: str

class ProjectBase(BaseModel):
    title: str

class ProjectCreate(ProjectBase):
    user_id: Optional[str] = None  # Optional for now, will be required with auth
    video_filename: Optional[str] = None
    video_url: Optional[str] = None  # Will store video file reference
    segments: List[Segment] = Field(default_factory=list)
    global_style: Optional[GlobalStyle] = None
    thumbnail_url: Optional[str] = None

class ProjectInDB(ProjectBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    user_id: Optional[PyObjectId] = None  # Optional for now, will be required with auth
    video_filename: Optional[str] = None
    video_url: Optional[str] = None
    segments: List[Segment] = Field(default_factory=list)
    global_style: Optional[GlobalStyle] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    thumbnail_url: Optional[str] = None
    share_token: Optional[str] = None  # Unique token for sharing
    shared_with: List[PyObjectId] = Field(default_factory=list)  # List of user IDs with access
    is_public: bool = False  # Public sharing flag
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    segments: Optional[List[Segment]] = None
    global_style: Optional[GlobalStyle] = None
    video_filename: Optional[str] = None
    video_url: Optional[str] = None
    thumbnail_url: Optional[str] = None

class ProjectResponse(ProjectBase):
    id: str
    user_id: Optional[str] = None
    video_filename: Optional[str] = None
    video_url: Optional[str] = None
    segments: List[Segment]
    global_style: Optional[GlobalStyle] = None
    created_at: datetime
    updated_at: datetime
    thumbnail_url: Optional[str] = None
    share_token: Optional[str] = None
    is_public: bool = False
    
    class Config:
        from_attributes = True

