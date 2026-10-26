from datetime import datetime

from pydantic import BaseModel


class CheckInCreate(BaseModel):
    member_id: int
    # Front desk can knowingly let in an expired/frozen member (e.g. paying at the desk).
    override: bool = False


class CheckOutRequest(BaseModel):
    check_out_time: datetime | None = None


class CheckInResponse(BaseModel):
    id: int
    member_id: int
    check_in_time: datetime
    check_out_time: datetime | None
