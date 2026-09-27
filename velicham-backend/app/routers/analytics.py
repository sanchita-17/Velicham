from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
from datetime import datetime
import random

router = APIRouter(prefix="/api/analytics", tags=["Criminal Analytics"])

# In-memory storage for criminal activity timestamps (mock database for hackathon)
# Stores raw interaction timestamps to build the heatmap matrix
activity_logs: List[Dict[str, Any]] = [
    # Seed some initial realistic dark web traffic data (UTC hours)
    {"timestamp": "2026-03-27T02:15:00Z", "day": "Friday", "hour": 2, "action": "forum_login"},
    {"timestamp": "2026-03-27T03:40:00Z", "day": "Friday", "hour": 3, "action": "message_sent"},
    {"timestamp": "2026-03-26T22:10:00Z", "day": "Thursday", "hour": 22, "action": "file_upload"},
    {"timestamp": "2026-03-25T01:05:00Z", "day": "Wednesday", "hour": 1, "action": "forum_login"},
    {"timestamp": "2026-03-24T04:20:00Z", "day": "Tuesday", "hour": 4, "action": "message_sent"},
]

class ActivityLogPayload(BaseModel):
    action: str
    target_handle: str

@router.post("/log-activity")
async def log_criminal_activity(payload: ActivityLogPayload):
    """Logs a new timestamp when the criminal is active on the platform."""
    now = datetime.utcnow()
    day_name = now.strftime("%A")
    hour_val = now.hour
    
    log_entry = {
        "timestamp": now.isoformat() + "Z",
        "day": day_name,
        "hour": hour_val,
        "action": payload.action,
        "handle": payload.target_handle
    }
    
    activity_logs.append(log_entry)
    return {"status": "success", "logged": log_entry}

@router.get("/heatmap-data")
async def get_heatmap_data():
    """
    Aggregates activity logs into a 7-day x 24-hour grid 
    optimized for frontend heatmap rendering.
    """
    days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    
    # Initialize a 2D matrix: 7 days, 24 hours initialized to 0 activity count
    heatmap_matrix = {day: {hour: 0 for hour in range(24)} for day in days}
    
    # Populate matrix with counts from logs
    for log in activity_logs:
        day = log.get("day")
        hour = log.get("hour")
        if day in heatmap_matrix and hour in heatmap_matrix[day]:
            heatmap_matrix[day][hour] += 1
            
    # Format into a structure easily read by React charting libraries
    formatted_data = []
    for day in days:
        for hour in range(24):
            formatted_data.append({
                "day": day,
                "hour": hour,
                "count": heatmap_matrix[day][hour]
            })
            
    return {
        "total_events": len(activity_logs),
        "heatmap_grid": formatted_data,
        "peak_activity_window": "01:00 UTC - 04:00 UTC (Late Night Operations)"
    }