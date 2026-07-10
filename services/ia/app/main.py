from contextlib import asynccontextmanager

from fastapi import FastAPI

from .embed import carregar_modelo_no_boot
from .embed import router as embed_router
from .human_design import router as human_design_router


@asynccontextmanager
async def lifespan(_app: FastAPI):
    carregar_modelo_no_boot()
    yield


app = FastAPI(title="Presença — microsserviço de IA", lifespan=lifespan)
app.include_router(embed_router)
app.include_router(human_design_router)


@app.get("/health")
def health() -> dict[str, bool]:
    return {"ok": True}
