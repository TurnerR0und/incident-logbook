from datetime import datetime, timezone
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select, case
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload
from app.database import get_db
from app.models.incident_comment import IncidentComment
from app.models.incident import Incident, IncidentSeverity, IncidentStatus
from app.models.user import User
from app.routers.auth import get_current_user
from app.schemas.incident import IncidentCreate, IncidentResponse, IncidentUpdate

router = APIRouter(prefix="/incidents", tags=["Incidents"])


def serialize_incident(incident: Incident, owner_email: str) -> IncidentResponse:
    return IncidentResponse.model_validate(
        {
            "id": incident.id,
            "title": incident.title,
            "description": incident.description,
            "status": incident.status,
            "severity": incident.severity,
            "created_at": incident.created_at,
            "started_at": incident.started_at,
            "resolved_at": incident.resolved_at,
            "updated_at": incident.updated_at,
            "root_cause": incident.root_cause,
            "owner_id": incident.owner_id,
            "owner_email": owner_email,
        }
    )


async def fetch_incident_with_owner(
    db: AsyncSession,
    incident_id: uuid.UUID,
) -> tuple[Incident, str] | None:
    result = await db.execute(
        select(Incident, User.email)
        .join(User, Incident.owner_id == User.id)
        .where(Incident.id == incident_id)
    )
    row = result.first()
    if row is None:
        return None

    incident, owner_email = row
    return incident, owner_email


@router.post("", response_model=IncidentResponse)
async def create_incident(
    incident_data: IncidentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    new_incident_data = {
        "title": incident_data.title,
        "description": incident_data.description,
        "severity": incident_data.severity,
        "owner_id": current_user.id,
    }
    if incident_data.started_at is not None:
        new_incident_data["started_at"] = incident_data.started_at
    if incident_data.root_cause is not None:
        new_incident_data["root_cause"] = incident_data.root_cause

    new_incident = Incident(**new_incident_data)
    db.add(new_incident)
    await db.commit()
    incident_with_owner = await fetch_incident_with_owner(db, new_incident.id)
    if incident_with_owner is None:
        raise HTTPException(status_code=404, detail="Incident not found")

    incident, owner_email = incident_with_owner
    return serialize_incident(incident, owner_email)


@router.get("", response_model=list[IncidentResponse])
async def list_incidents(
    status: Optional[IncidentStatus] = Query(default=None),
    severity: Optional[IncidentSeverity] = Query(default=None),
    owner_email: Optional[str] = Query(
        default=None,
        description="Admin-only case-insensitive search across incident owner emails",
    ),
    created_after: Optional[datetime] = Query(
        default=None,
        description="Only include incidents created at or after this ISO-8601 timestamp",
    ),
    created_before: Optional[datetime] = Query(
        default=None,
        description="Only include incidents created at or before this ISO-8601 timestamp",
    ),
    skip: int = Query(default=0, ge=0, description="Number of records to skip"),
    limit: int = Query(default=100, ge=1, le=100, description="Maximum number of records to return"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if (
        created_after is not None
        and created_before is not None
        and created_after > created_before
    ):
        raise HTTPException(
            status_code=400,
            detail="created_after must be earlier than or equal to created_before",
        )

    if owner_email is not None and not current_user.is_admin:
        raise HTTPException(
            status_code=403,
            detail="Only admins can filter incidents by user",
        )

    query = select(Incident, User.email).join(User, Incident.owner_id == User.id)
    if not current_user.is_admin:
        query = query.where(Incident.owner_id == current_user.id)
    
    if status is not None:
        query = query.where(Incident.status == status)
    if severity is not None:
        query = query.where(Incident.severity == severity)
    if owner_email is not None:
        query = query.where(func.lower(User.email).like(f"%{owner_email.lower()}%"))
    if created_after is not None:
        query = query.where(Incident.created_at >= created_after)
    if created_before is not None:
        query = query.where(Incident.created_at <= created_before)
        
    if severity is not None:
        query = query.where(Incident.severity == severity)
        
    # NEW: Sort CLOSED to the bottom (1), active to the top (0), then by date
    query = query.order_by(
        case(
            (Incident.status == IncidentStatus.CLOSED, 1),
            else_=0
        ),
        Incident.created_at.desc()
    )
    
    query = query.offset(skip).limit(limit)
    
    result = await db.execute(query)
    return [
        serialize_incident(incident, owner_email)
        for incident, owner_email in result.all()
    ]

@router.get("/{incident_id}", response_model=IncidentResponse)
async def get_incident(
    incident_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    incident_with_owner = await fetch_incident_with_owner(db, incident_id)
    if incident_with_owner is None:
        raise HTTPException(status_code=404, detail="Incident not found")

    incident, owner_email = incident_with_owner

    if not current_user.is_admin and incident.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this incident")

    return serialize_incident(incident, owner_email)

@router.patch("/{incident_id}", response_model=IncidentResponse)
async def update_incident(
    incident_id: uuid.UUID,
    incident_update: IncidentUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    incident_with_owner = await fetch_incident_with_owner(db, incident_id)
    if incident_with_owner is None:
        raise HTTPException(status_code=404, detail="Incident not found")

    incident, _ = incident_with_owner

    if not current_user.is_admin and incident.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this incident")

    if incident.status == IncidentStatus.CLOSED:
        raise HTTPException(
            status_code=400, 
            detail="This incident is CLOSED and cannot be modified."
        )

    update_data = incident_update.model_dump(exclude_unset=True)
    system_comments: list[IncidentComment] = []

    new_status = update_data.get("status")
    if new_status is not None and new_status != incident.status:
        system_comments.append(
            IncidentComment(
                incident_id=incident.id,
                author_id=current_user.id,
                body=(
                    "System: Status changed from "
                    f"{incident.status.value} to {new_status.value} by {current_user.email}"
                ),
            )
        )

    new_severity = update_data.get("severity")
    if new_severity is not None and new_severity != incident.severity:
        system_comments.append(
            IncidentComment(
                incident_id=incident.id,
                author_id=current_user.id,
                body=(
                    "System: Severity changed from "
                    f"{incident.severity.value} to {new_severity.value} by {current_user.email}"
                ),
            )
        )

    if (
        update_data.get("status") == IncidentStatus.RESOLVED
        and incident.status != IncidentStatus.RESOLVED
    ):
        update_data["resolved_at"] = datetime.now(timezone.utc)

    for key, value in update_data.items():
        setattr(incident, key, value)

    if system_comments:
        db.add_all(system_comments)

    await db.commit()
    refreshed_incident_with_owner = await fetch_incident_with_owner(db, incident.id)
    if refreshed_incident_with_owner is None:
        raise HTTPException(status_code=404, detail="Incident not found")

    refreshed_incident, owner_email = refreshed_incident_with_owner
    return serialize_incident(refreshed_incident, owner_email)
