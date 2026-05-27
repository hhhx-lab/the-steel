from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router
from app.core.config import get_settings
from app.db.seed import seed_database
from app.db.session import SessionLocal, init_db
from app.services.errors import NotFoundError, ValidationError


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    init_db()
    with SessionLocal() as db:
        seed_database(db)
    yield


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title=settings.app_name, debug=settings.debug, lifespan=lifespan)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(router)

    @app.exception_handler(NotFoundError)
    async def handle_not_found(_request, exc: NotFoundError):
        return JSONResponse(status_code=404, content={"detail": str(exc), "code": "not_found"})

    @app.exception_handler(ValidationError)
    async def handle_validation(_request, exc: ValidationError):
        return JSONResponse(status_code=422, content={"detail": str(exc), "code": "validation_error"})

    return app


app = create_app()
