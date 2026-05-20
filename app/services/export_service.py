import pandas as pd
from io import BytesIO
from sqlalchemy.orm import Session
from app.models.task import Task
from app.models.journal import Journal
from app.models.weekly_plan import WeeklyPlan


def generate_weekly_export(user_id: int, db: Session) -> BytesIO:
    output = BytesIO()

    # Tasks Sheet
    tasks = db.query(Task).filter(Task.user_id == user_id).all()
    tasks_data = [{
        "Title": t.title,
        "Description": t.description or "",
        "Status": t.status.value,
        "Priority": t.priority.value,
        "Due Date": t.due_date,
        "AI Generated": "Yes" if t.is_ai_generated else "No"
    } for t in tasks] if tasks else [{"Title": "No tasks yet", "Description": "", "Status": "", "Priority": "", "Due Date": "", "AI Generated": ""}]

    # Journal Sheet
    journals = db.query(Journal).filter(Journal.user_id ==
                                        user_id).order_by(Journal.entry_date.desc()).all()
    journal_data = [{
        "Date": str(j.entry_date),
        "Journal Entry": j.journal_text or "",
        "Productivity Score": j.productivity_score or 0,
        "Wins": j.wins or "",
        "Challenges": j.challenges or ""
    } for j in journals] if journals else [{"Date": "No entries", "Journal Entry": "", "Productivity Score": 0, "Wins": "", "Challenges": ""}]

    # Weekly Plans Sheet
    plans = db.query(WeeklyPlan).filter(WeeklyPlan.user_id ==
                                        user_id).order_by(WeeklyPlan.week_start.desc()).all()
    plans_data = [{
        "Week Start": str(p.week_start),
        "Week End": str(p.week_end),
        "Goal Summary": p.goal_summary or "",
        "Status": p.status.value
    } for p in plans] if plans else [{"Week Start": "No plans yet", "Week End": "", "Goal Summary": "", "Status": ""}]

    # Productivity Summary Sheet
    scores = [j.productivity_score for j in journals if j.productivity_score]
    avg_score = round(sum(scores) / len(scores), 1) if scores else 0
    completed_tasks = [t for t in tasks if t.status.value == "completed"]
    summary_data = [{
        "Total Tasks": len(tasks),
        "Completed Tasks": len(completed_tasks),
        "Pending Tasks": len(tasks) - len(completed_tasks),
        "Completion Rate": f"{round(len(completed_tasks) / len(tasks) * 100)}%" if tasks else "0%",
        "Total Journal Entries": len(journals),
        "Average Productivity Score": f"{avg_score}/10",
        "Total Weekly Plans": len(plans)
    }]

    # Write to Excel with styling
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        pd.DataFrame(summary_data).to_excel(
            writer, sheet_name="Summary", index=False)
        pd.DataFrame(tasks_data).to_excel(
            writer, sheet_name="Tasks", index=False)
        pd.DataFrame(journal_data).to_excel(
            writer, sheet_name="Journal", index=False)
        pd.DataFrame(plans_data).to_excel(
            writer, sheet_name="Weekly Plans", index=False)

        # Auto-size columns for all sheets
        for sheet_name in writer.sheets:
            worksheet = writer.sheets[sheet_name]
            for col in worksheet.columns:
                max_length = max(len(str(cell.value or "")) for cell in col)
                worksheet.column_dimensions[col[0].column_letter].width = min(
                    max_length + 4, 50)

    output.seek(0)
    return output
