from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.routers.deps import get_current_user
from app.models.user import User
from app.services.export_service import generate_weekly_export
from datetime import datetime

router = APIRouter(prefix="/export", tags=["Export"])


@router.get("/excel")
def export_to_excel(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Download all your tasks, journals and plans as an Excel file"""
    excel_file = generate_weekly_export(user_id=current_user.id, db=db)
    filename = f"BeProductive_{current_user.username}_{datetime.utcnow().strftime('%Y-%m-%d')}.xlsx"

    return StreamingResponse(
        excel_file,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
