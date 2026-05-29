from datetime import datetime
from typing import Any, Optional
import uuid

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserRegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class UserResponse(BaseModel):
    id: uuid.UUID
    email: EmailStr
    is_active: bool
    provider: Optional[str] = "email"
    avatar_url: Optional[str] = None
    github_username: Optional[str] = None
    is_email_verified: bool = False
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class OtpVerifyRequest(BaseModel):
    email: EmailStr
    code: str = Field(min_length=6, max_length=6)


class TokenPairResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse


class AccountResponse(BaseModel):
    id: uuid.UUID
    email: EmailStr
    is_active: bool
    is_admin: bool
    subscription_plan: str
    subscription_status: str
    stripe_customer_id: Optional[str] = None
    created_at: datetime


class UsageResponse(BaseModel):
    subscription_plan: str
    daily_limit: int
    analyses_today: int
    remaining_today: int
    total_credits: int


class CheckoutSessionRequest(BaseModel):
    price_id: str


class CheckoutSessionResponse(BaseModel):
    sessionId: str
    customerId: Optional[str]
    priceId: str
    plan: str
    customerEmail: EmailStr
    createdAt: str
    checkoutUrl: Optional[str] = None
    mode: str


class BillingPortalResponse(BaseModel):
    portalUrl: str
    customerId: Optional[str]
    mode: str


class AnalysisHistoryResponse(BaseModel):
    id: int
    contract_snippet: str
    prediction: str
    confidence: float
    timestamp: datetime


class AnalysisFindingResponse(BaseModel):
    slug: str
    label: str
    severity: str
    confidence: float
    summary: str
    recommendation: str
    line_numbers: list[int] = []



class AnalysisResponse(BaseModel):
    score: int
    severity: str
    issues: list[str]
    steps: list[str]
    explanation: str
    fix: str
    poc_test: Optional[str] = None
    log_id: int

    confidence: float
    # Backward compat fields (make them optional)
    prediction: Optional[str] = None
    prob_secure: Optional[float] = None
    prob_vulnerable: Optional[float] = None
    email: Optional[str] = None
    model_source: Optional[str] = None
    remaining_today: Optional[int] = None
    risk_score: Optional[int] = None
    findings: Optional[list[AnalysisFindingResponse]] = None
    safe_patterns: Optional[list[str]] = None
    summary: Optional[str] = None
    fix_suggestions: Optional[list[str]] = None
    autofix_preview: Optional[str] = None



class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)


class ChatMessageResponse(BaseModel):
    role: str
    content: str
    created_at: str


class ChatResponse(BaseModel):
    reply: str
    messages: list[ChatMessageResponse]


class NotificationResponse(BaseModel):
    id: int
    title: str
    body: str
    severity: str
    category: str
    is_read: bool
    action_url: Optional[str] = None
    timestamp: str


class DashboardSummaryResponse(BaseModel):
    account: dict[str, Any]
    usage: dict[str, Any]
    recent_scans: list[dict[str, Any]]
    chat_history: list[ChatMessageResponse]
    notifications: list[dict[str, Any]]
    workspace: dict[str, Any]


class WorkspaceInviteRequest(BaseModel):
    email: EmailStr
    role: str = Field(default="member", pattern=r"^(owner|admin|member|viewer)$")


class WorkspaceMemberUpdateRequest(BaseModel):
    role: str = Field(pattern=r"^(admin|member|viewer)$")


class WorkspaceMemberResponse(BaseModel):
    id: int
    email: Optional[EmailStr] = None
    role: str
    status: str
    joined_at: str


class SharedReportResponse(BaseModel):
    id: int
    analysis_log_id: int
    prediction: str
    confidence: float
    risk_score: int
    contract_snippet: str
    shared_at: str


class WorkspaceResponse(BaseModel):
    team_id: int
    team_name: str
    team_slug: str
    role: str
    members: list[WorkspaceMemberResponse]
    shared_reports: list[SharedReportResponse]
    can_manage_members: bool


class WorkspaceInviteResponse(BaseModel):
    invitation_id: int
    email: EmailStr
    role: str
    status: str


class ShareReportRequest(BaseModel):
    analysis_log_id: int


class FixContractRequest(BaseModel):
    content: str = Field(min_length=1, max_length=50000)


class FixContractResponse(BaseModel):
    fixed_code: str
    summary: str
    highlighted_changes: list[str]


class ApiKeyCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)


class ApiKeyCreateResponse(BaseModel):
    id: int
    name: str
    key: str
    key_prefix: str
    created_at: datetime


class ApiKeyResponse(BaseModel):
    id: int
    name: str
    key_prefix: str
    is_active: bool
    last_used_at: Optional[datetime] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class GuestStatsResponse(BaseModel):
    total_scanned: int
    remaining_guest_scans: int


class HealthResponse(BaseModel):
    backend: str
    ai_model: str
    inference: str
