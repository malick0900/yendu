from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional
from datetime import datetime, timezone
import uuid


def _id() -> str:
    return uuid.uuid4().hex[:16]


def _now() -> datetime:
    return datetime.now(timezone.utc)


# ---------- Users ----------
class UserBase(BaseModel):
    email: EmailStr
    name: str
    phone: Optional[str] = None
    avatar: Optional[str] = None


class UserCreate(UserBase):
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class User(UserBase):
    model_config = ConfigDict(extra="ignore")
    user_id: str = Field(default_factory=lambda: f"user_{_id()}")
    role: str = "TRAVELER"  # TRAVELER | ADMIN
    provider: str = "email"  # email | google
    created_at: datetime = Field(default_factory=_now)


class UserPublic(BaseModel):
    user_id: str
    email: EmailStr
    name: str
    avatar: Optional[str] = None
    phone: Optional[str] = None
    role: str
    provider: str
    created_at: datetime


class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    avatar: Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserPublic


# ---------- Destinations ----------
class DestinationBase(BaseModel):
    name: str
    slug: str
    country: str = "Sénégal"
    short_description: str
    description: str
    hero_image: str
    tagline: Optional[str] = None


class DestinationCreate(DestinationBase):
    pass


class DestinationUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    country: Optional[str] = None
    short_description: Optional[str] = None
    description: Optional[str] = None
    hero_image: Optional[str] = None
    tagline: Optional[str] = None


class Destination(DestinationBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=_id)
    created_at: datetime = Field(default_factory=_now)


# ---------- Properties (hébergements) ----------
class PropertyBase(BaseModel):
    title: str
    description: str
    destination_slug: str
    city: str
    address: str
    lat: float
    lng: float
    type: str  # apartment | villa | riad | guesthouse | suite
    price_per_night: int  # XOF (FCFA)
    max_guests: int = 2
    bedrooms: int = 1
    beds: int = 1
    bathrooms: int = 1
    amenities: List[str] = []
    images: List[str] = []
    is_premium: bool = False
    is_published: bool = True


class PropertyCreate(PropertyBase):
    pass


class PropertyUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    destination_slug: Optional[str] = None
    city: Optional[str] = None
    address: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    type: Optional[str] = None
    price_per_night: Optional[int] = None
    max_guests: Optional[int] = None
    bedrooms: Optional[int] = None
    beds: Optional[int] = None
    bathrooms: Optional[int] = None
    amenities: Optional[List[str]] = None
    images: Optional[List[str]] = None
    is_premium: Optional[bool] = None
    is_published: Optional[bool] = None


class Property(PropertyBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=_id)
    rating_avg: float = 0.0
    rating_count: int = 0
    created_at: datetime = Field(default_factory=_now)


# ---------- Experiences ----------
class ExperienceBase(BaseModel):
    title: str
    description: str
    destination_slug: str
    city: str
    lat: float
    lng: float
    category: str  # culture | gastronomie | aventure | nightlife | lifestyle
    duration_hours: float
    price: int  # XOF per person
    max_participants: int = 10
    included: List[str] = []
    meeting_point: str = ""
    host_name: str = ""
    host_bio: str = ""
    host_avatar: str = ""
    images: List[str] = []
    is_trending: bool = False
    is_published: bool = True


class ExperienceCreate(ExperienceBase):
    pass


class ExperienceUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    destination_slug: Optional[str] = None
    city: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    category: Optional[str] = None
    duration_hours: Optional[float] = None
    price: Optional[int] = None
    max_participants: Optional[int] = None
    included: Optional[List[str]] = None
    meeting_point: Optional[str] = None
    host_name: Optional[str] = None
    host_bio: Optional[str] = None
    host_avatar: Optional[str] = None
    images: Optional[List[str]] = None
    is_trending: Optional[bool] = None
    is_published: Optional[bool] = None


class Experience(ExperienceBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=_id)
    rating_avg: float = 0.0
    rating_count: int = 0
    created_at: datetime = Field(default_factory=_now)


# ---------- Bookings ----------
class BookingBase(BaseModel):
    type: str  # property | experience
    target_id: str
    check_in: Optional[str] = None  # ISO date for stays
    check_out: Optional[str] = None
    experience_date: Optional[str] = None  # ISO date for experiences
    guests: int = 1
    participants: int = 1
    notes: Optional[str] = None


class BookingCreate(BookingBase):
    pass


class BookingStatusUpdate(BaseModel):
    status: Optional[str] = None
    payment_status: Optional[str] = None


class Booking(BookingBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=_id)
    user_id: str
    user_email: str
    user_name: str
    target_title: str
    target_image: Optional[str] = None
    nights: int = 0
    unit_price: int = 0
    total_price: int = 0
    status: str = "pending"  # pending | confirmed | cancelled | completed
    payment_status: str = "pending"  # pending | paid | refunded
    created_at: datetime = Field(default_factory=_now)


# ---------- Reviews ----------
class ReviewCreate(BaseModel):
    type: str  # property | experience
    target_id: str
    rating: int  # 1-5
    comment: str


class Review(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=_id)
    type: str
    target_id: str
    user_id: str
    user_name: str
    user_avatar: Optional[str] = None
    rating: int
    comment: str
    is_visible: bool = True
    created_at: datetime = Field(default_factory=_now)


# ---------- Favorites ----------
class FavoriteCreate(BaseModel):
    type: str  # property | experience
    target_id: str


class Favorite(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=_id)
    user_id: str
    type: str
    target_id: str
    created_at: datetime = Field(default_factory=_now)


# ---------- Google OAuth ----------
class GoogleCredentialRequest(BaseModel):
    credential: str  # Google Identity Services ID token (JWT)
