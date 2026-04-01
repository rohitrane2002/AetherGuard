import re
from uuid import uuid4

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from models import AnalysisLog, SharedReport, Team, TeamMembership, User
from services.security_service import snippet_from_code


def _slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug or "team"


def _unique_team_slug(db: Session, base: str) -> str:
    candidate = _slugify(base)
    while db.execute(select(Team).where(Team.slug == candidate)).scalar_one_or_none() is not None:
        candidate = f"{_slugify(base)}-{uuid4().hex[:6]}"
    return candidate


def ensure_personal_workspace(db: Session, user: User) -> tuple[Team, TeamMembership]:
    membership = db.execute(
        select(TeamMembership).where(TeamMembership.user_id == user.id).order_by(TeamMembership.id.asc())
    ).scalar_one_or_none()
    if membership is not None:
        team = db.execute(select(Team).where(Team.id == membership.team_id)).scalar_one()
        return team, membership

    team_name = f"{user.email.split('@')[0].replace('.', ' ').title()} Security"
    team = Team(
        name=team_name,
        slug=_unique_team_slug(db, team_name),
        owner_user_id=user.id,
    )
    db.add(team)
    db.commit()
    db.refresh(team)

    membership = TeamMembership(
        team_id=team.id,
        user_id=user.id,
        invited_email=user.email,
        role="owner",
        status="active",
    )
    db.add(membership)
    db.commit()
    db.refresh(membership)
    return team, membership


def sync_pending_memberships_for_user(db: Session, user: User) -> None:
    pending_memberships = db.execute(
        select(TeamMembership).where(
            TeamMembership.invited_email == user.email,
            TeamMembership.status == "invited",
        )
    ).scalars().all()
    changed = False
    for membership in pending_memberships:
        membership.user_id = user.id
        membership.status = "active"
        db.add(membership)
        changed = True
    if changed:
        db.commit()


def get_workspace_membership(db: Session, user: User) -> tuple[Team, TeamMembership]:
    sync_pending_memberships_for_user(db, user)
    return ensure_personal_workspace(db, user)


def can_manage_workspace(membership: TeamMembership) -> bool:
    return membership.role in {"owner", "admin"}


def build_workspace_payload(db: Session, user: User) -> dict:
    team, membership = get_workspace_membership(db, user)
    memberships = db.execute(
        select(TeamMembership).where(TeamMembership.team_id == team.id).order_by(TeamMembership.id.asc())
    ).scalars().all()
    members = []
    for item in memberships:
        member_user = None
        if item.user_id is not None:
            member_user = db.execute(select(User).where(User.id == item.user_id)).scalar_one_or_none()
        members.append(
            {
                "id": item.id,
                "email": member_user.email if member_user else item.invited_email,
                "role": item.role,
                "status": item.status,
                "joined_at": item.created_at.isoformat(),
            }
        )

    shared_links = db.execute(
        select(SharedReport, AnalysisLog)
        .join(AnalysisLog, AnalysisLog.id == SharedReport.analysis_log_id)
        .where(SharedReport.team_id == team.id)
        .order_by(SharedReport.id.desc())
        .limit(12)
    ).all()
    shared_reports = [
        {
            "id": shared.id,
            "analysis_log_id": log.id,
            "prediction": log.prediction,
            "confidence": log.confidence,
            "risk_score": max(0, min(100, int(round(log.prob_vulnerable * 100)))),
            "contract_snippet": snippet_from_code(log.source_code),
            "shared_at": shared.created_at.isoformat(),
        }
        for shared, log in shared_links
    ]

    return {
        "team_id": team.id,
        "team_name": team.name,
        "team_slug": team.slug,
        "role": membership.role,
        "members": members,
        "shared_reports": shared_reports,
        "can_manage_members": can_manage_workspace(membership),
    }


def workspace_counts(db: Session, user: User) -> dict:
    team, membership = get_workspace_membership(db, user)
    member_count = (
        db.execute(
            select(func.count()).select_from(TeamMembership).where(
                TeamMembership.team_id == team.id,
                TeamMembership.status.in_(["active", "invited"]),
            )
        ).scalar_one()
        or 0
    )
    shared_count = (
        db.execute(select(func.count()).select_from(SharedReport).where(SharedReport.team_id == team.id)).scalar_one()
        or 0
    )
    return {
        "team_name": team.name,
        "members": int(member_count),
        "role": membership.role.title(),
        "shared_reports": int(shared_count),
    }
