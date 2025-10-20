from fastapi import APIRouter

router = APIRouter()

@router.post("/register")
async def register_user():
    pass

@router.post("/login")
async def login_user():
    pass

@router.get("/me")
async def get_current_user():
    pass

@router.post("/logout")
async def logout_user():
    pass
