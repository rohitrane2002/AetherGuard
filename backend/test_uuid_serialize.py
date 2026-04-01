from pydantic import BaseModel
from typing import Any
import uuid

class Test(BaseModel):
    account: dict[str, Any]

t = Test(account={"id": uuid.uuid4()})
print(t.model_dump_json())
