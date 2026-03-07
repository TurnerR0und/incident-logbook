from datetime import datetime, timezone
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.incident_comment import IncidentComment
from app.models.incident import Incident, IncidentSeverity, IncidentStatus
from app.models.user import User
from app.routers.auth import get_current_user
from app.schemas.incident import IncidentCreate, IncidentResponse, IncidentUpdate

router = APIRouter(prefix="/incidents", tags=["Incidents"])


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
    await db.refresh(new_incident)
    return new_incident


@router.get("", response_model=list[IncidentResponse])
async def list_incidents(
    status: Optional[IncidentStatus] = Query(default=None),
    severity: Optional[IncidentSeverity] = Query(default=None),
    skip: int = Query(default=0, ge=0, description="Number of records to skip"),
    limit: int = Query(default=100, ge=1, le=100, description="Maximum number of records to return"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(Incident)
    if not current_user.is_admin:
        query = query.where(Incident.owner_id == current_user.id)
    
    if status is not None:
        query = query.where(Incident.status == status)
    if severity is not None:
        query = query.where(Incident.severity == severity)
        
    query = query.order_by(Incident.created_at.desc())
    
    # Apply pagination here!
    query = query.offset(skip).limit(limit)
    
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/{incident_id}", response_model=IncidentResponse)
async def get_incident(
    incident_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # 1. Fetch the Incident
    query = select(Incident).where(Incident.id == incident_id)
    result = await db.execute(query)
    incident = result.scalars().first()

    # 2. Gate 1: Does it exist?
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    if not current_user.is_admin and incident.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this incident")

    return incident

@router.patch("/{incident_id}", response_model=IncidentResponse)
async def update_incident(
    incident_id: uuid.UUID,
    incident_update: IncidentUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(Incident).where(Incident.id == incident_id)
    result = await db.execute(query)
    incident = result.scalars().first()

    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

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
    await db.refresh(incident)

    return incident
