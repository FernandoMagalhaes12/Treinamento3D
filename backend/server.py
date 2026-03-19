from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def _get_required_env(var_name: str) -> str:
    value = os.environ.get(var_name)
    if not value:
        raise RuntimeError(f"Required environment variable '{var_name}' is not set")
    return value


def _normalize_origin(origin: str) -> str:
    return origin.strip().strip('"').strip("'")


def _parse_cors_origins() -> tuple[list[str], bool]:
    default_origins = [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:3002',
        'http://127.0.0.1:3002',
    ]

    raw_origins = os.environ.get('CORS_ORIGINS', ','.join(default_origins))
    parsed_origins = [_normalize_origin(origin) for origin in raw_origins.split(',') if _normalize_origin(origin)]
    allow_all_origins = '*' in parsed_origins

    app_env = os.environ.get('APP_ENV', 'development').strip().lower()
    is_dev_env = app_env in {'dev', 'development', 'local'}

    if allow_all_origins and not is_dev_env:
        logger.warning("CORS_ORIGINS contains '*' outside development; falling back to explicit localhost origins")
        return default_origins, False

    return (['*'] if allow_all_origins else parsed_origins), allow_all_origins


mongo_url = _get_required_env('MONGO_URL')
db_name = _get_required_env('DB_NAME')
client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

app = FastAPI()
api_router = APIRouter(prefix="/api")

# Models
class Scenario(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name_pt: str
    name_en: str
    description_pt: str
    description_en: str
    steps: List[str]
    difficulty: str

class SimulationStep(BaseModel):
    step_name: str
    timestamp: str
    correct: bool
    expected_order: int
    actual_order: int

class SimulationCreate(BaseModel):
    scenario_id: str
    language: str

class SimulationUpdate(BaseModel):
    steps_performed: List[SimulationStep]
    completed: bool = False

class Simulation(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    scenario_id: str
    language: str
    steps_performed: List[SimulationStep] = []
    completed: bool = False
    score: Optional[float] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    completed_at: Optional[str] = None

class SimulationResult(BaseModel):
    model_config = ConfigDict(extra="ignore")
    total_steps: int
    correct_steps: int
    incorrect_steps: int
    score: float
    safety_violations: List[str]
    time_taken: Optional[str] = None

# Routes
@api_router.get("/")
async def root():
    return {"message": "LOTO 3D Training API"}

@api_router.get("/scenarios", response_model=List[Scenario])
async def get_scenarios():
    # Always return default scenarios without MongoDB dependency
    default_scenarios = [
        {
            "id": "gen-diesel",
            "name_pt": "Gerador Diesel",
            "name_en": "Diesel Generator",
            "description_pt": "Procedimento de bloqueio para manutenção de gerador diesel industrial - Siga os 9 passos do NR10",
            "description_en": "Lockout procedure for industrial diesel generator maintenance - Follow the 9 NR10 steps",
            "steps": [
                "certify_stop",
                "consult_matrix",
                "execute_lockout",
                "eliminate_residual_energy",
                "deliver_tag_lock",
                "confirm_operational_state",
                "test_effectiveness",
                "request_release",
                "fill_tag_confirming"
            ],
            "difficulty": "medium"
        },
        {
            "id": "compressor",
            "name_pt": "Compressor de Ar",
            "name_en": "Air Compressor",
            "description_pt": "Bloqueio de compressor de ar com válvulas de pressão - Siga os 9 passos do NR10",
            "description_en": "Air compressor lockout with pressure valves - Follow the 9 NR10 steps",
            "steps": [
                "certify_stop",
                "consult_matrix",
                "execute_lockout",
                "eliminate_residual_energy",
                "deliver_tag_lock",
                "confirm_operational_state",
                "test_effectiveness",
                "request_release",
                "fill_tag_confirming"
            ],
            "difficulty": "hard"
        },
        {
            "id": "conveyor",
            "name_pt": "Esteira Transportadora",
            "name_en": "Conveyor Belt",
            "description_pt": "Procedimento de bloqueio para esteira transportadora - Siga os 9 passos do NR10",
            "description_en": "Lockout procedure for conveyor belt system - Follow the 9 NR10 steps",
            "steps": [
                "certify_stop",
                "consult_matrix",
                "execute_lockout",
                "eliminate_residual_energy",
                "deliver_tag_lock",
                "confirm_operational_state",
                "test_effectiveness",
                "request_release",
                "fill_tag_confirming"
            ],
            "difficulty": "easy"
        }
    ]
    return default_scenarios

@api_router.post("/simulations", response_model=Simulation)
async def create_simulation(sim_create: SimulationCreate):
    simulation = Simulation(
        scenario_id=sim_create.scenario_id,
        language=sim_create.language
    )
    doc = simulation.model_dump()
    await db.simulations.insert_one(doc)
    return simulation

@api_router.patch("/simulations/{sim_id}")
async def update_simulation(sim_id: str, update: SimulationUpdate):
    sim = await db.simulations.find_one({"id": sim_id}, {"_id": 0})
    if not sim:
        raise HTTPException(status_code=404, detail="Simulation not found")
    
    update_data = {"steps_performed": [s.model_dump() for s in update.steps_performed]}
    
    if update.completed:
        correct = sum(1 for s in update.steps_performed if s.correct)
        total = len(update.steps_performed)
        score = (correct / total * 100) if total > 0 else 0
        update_data["completed"] = True
        update_data["score"] = score
        update_data["completed_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.simulations.update_one({"id": sim_id}, {"$set": update_data})
    return {"message": "Simulation updated", "score": update_data.get("score")}

@api_router.get("/simulations/{sim_id}/results", response_model=SimulationResult)
async def get_simulation_results(sim_id: str):
    sim = await db.simulations.find_one({"id": sim_id}, {"_id": 0})
    if not sim:
        raise HTTPException(status_code=404, detail="Simulation not found")
    
    steps = sim.get("steps_performed", [])
    correct = sum(1 for s in steps if s.get("correct", False))
    incorrect = len(steps) - correct
    score = sim.get("score", 0)
    
    violations = []
    for i, step in enumerate(steps):
        if not step.get("correct", False):
            violations.append(f"Step {i+1}: {step.get('step_name')} executed out of order")
    
    return SimulationResult(
        total_steps=len(steps),
        correct_steps=correct,
        incorrect_steps=incorrect,
        score=score,
        safety_violations=violations
    )

app.include_router(api_router)

cors_origins, allow_all_origins = _parse_cors_origins()

app.add_middleware(
    CORSMiddleware,
    allow_credentials=not allow_all_origins,
    allow_origins=cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

logger.info("CORS configured with %d origin(s). Wildcard enabled: %s", len(cors_origins), allow_all_origins)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()