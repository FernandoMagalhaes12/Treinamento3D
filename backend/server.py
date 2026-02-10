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

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

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
    scenarios = await db.scenarios.find({}, {"_id": 0}).to_list(100)
    if not scenarios:
        default_scenarios = [
            {
                "id": "gen-diesel",
                "name_pt": "Gerador Diesel",
                "name_en": "Diesel Generator",
                "description_pt": "Procedimento de bloqueio para manutenção de gerador diesel industrial",
                "description_en": "Lockout procedure for industrial diesel generator maintenance",
                "steps": ["power_off", "test_energy", "apply_lock", "apply_tag", "open_panel"],
                "difficulty": "medium"
            },
            {
                "id": "compressor",
                "name_pt": "Compressor de Ar",
                "name_en": "Air Compressor",
                "description_pt": "Bloqueio de compressor de ar com válvulas de pressão",
                "description_en": "Air compressor lockout with pressure valves",
                "steps": ["power_off", "release_pressure", "test_energy", "apply_lock", "apply_tag", "open_panel"],
                "difficulty": "hard"
            },
            {
                "id": "conveyor",
                "name_pt": "Esteira Transportadora",
                "name_en": "Conveyor Belt",
                "description_pt": "Procedimento de bloqueio para esteira transportadora",
                "description_en": "Lockout procedure for conveyor belt system",
                "steps": ["stop_belt", "power_off", "test_energy", "apply_lock", "apply_tag", "open_panel"],
                "difficulty": "easy"
            }
        ]
        await db.scenarios.insert_many(default_scenarios)
        scenarios = default_scenarios
    return scenarios

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

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()