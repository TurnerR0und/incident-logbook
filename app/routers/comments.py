import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.incident import Incident
from app.models.incident_comment import IncidentComment
from app.models.user import User
from app.routers.auth import get_current_user
from app.schemas.comment import CommentCreate, CommentResponse

router = APIRouter(prefix="/incidents", tags=["Comments"])


async def get_accessible_incident(
    incident_id: uuid.UUID,
    current_user: User,
    db: AsyncSession,
) -> Incident:
    result = await db.execute(select(Incident).where(Incident.id == incident_id))
    incident = result.scalars().first()

    if incident is None:
        raise HTTPException(status_code=404, detail="Incident not found")

    if incident.owner_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Not authorized to access this incident",
        )

    return incident


@router.post("/{incident_id}/comments", response_model=CommentResponse)
async def create_comment(
    incident_id: uuid.UUID,
    comment_data: CommentCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    incident = await get_accessible_incident(incident_id, current_user, db)

    comment = IncidentComment(
        incident_id=incident.id,
        author_id=current_user.id,
        body=comment_data.body,
    )
    db.add(comment)
    await db.commit()
    await db.refresh(comment)
    return comment


@router.get("/{incident_id}/comments", response_model=list[CommentResponse])
async def list_comments(
    incident_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    incident = await get_accessible_incident(incident_id, current_user, db)

    result = await db.execute(
        select(IncidentComment)
        .where(IncidentComment.incident_id == incident.id)
        .order_by(IncidentComment.created_at.asc())
    )
    return result.scalars().all()
