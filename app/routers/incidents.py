from fastapi import APIRouter, Depends, HTTPException, status
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import uuid
from app.database import get_db
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
    new_incident = Incident(
        title=incident_data.title,
        description=incident_data.description,
        severity=incident_data.severity,
        owner_id=current_user.id,
    )
    db.add(new_incident)
    await db.commit()
    await db.refresh(new_incident)
    return new_incident


@router.get("", response_model=list[IncidentResponse])
async def list_incidents(
    status: Optional[IncidentStatus] = Query(default=None),
    severity: Optional[IncidentSeverity] = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(Incident).where(Incident.owner_id == current_user.id)
    if status is not None:
        query = query.where(Incident.status == status)
    if severity is not None:
        query = query.where(Incident.severity == severity)
    query = query.order_by(Incident.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all()

@router.patch("/{incident_id}", response_model=IncidentResponse)
async def update_incident(
    incident_id: uuid.UUID,
    incident_update: IncidentUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # 1. Fetch the Incident
    # We query by ID to see if it exists at all
    query = select(Incident).where(Incident.id == incident_id)
    result = await db.execute(query)
    incident = result.scalars().first()

    # Gate 1: Does it exist?
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    # Gate 2: Do you own it?
    if incident.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this incident")
    
    # Gate 3: Is it already CLOSED? (The "System of Record" Lock)
    if incident.status == IncidentStatus.CLOSED:
        raise HTTPException(
            status_code=400, 
            detail="This incident is CLOSED and cannot be modified."
        )

    # 2. Apply Updates
    # exclude_unset=True means: "If the user didn't send 'title', don't set title to None"
    update_data = incident_update.model_dump(exclude_unset=True)
    
    for key, value in update_data.items():
        setattr(incident, key, value)

    # 3. Commit
    await db.commit()
    await db.refresh(incident)
    
    return incident