import time
import logging
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware

from .schemas import (
    HealthResponse,
    OptimizeEnergyRequest,
    OptimizeEnergyResponse
)
from .llm_interpreter import interpret_operator_notes
from .optimizer import solve_energy_schedule
from .verifier import verify_and_recalculate_schedule

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("bup_gridwise_api")

app = FastAPI(
    title="GridWise Smart Campus Energy Optimizer API",
    description="LLM-Assisted Operator Directive Interpretation & 24-Hour Energy Scheduling for BUP CSE Fest 2026.",
    version="1.0.0"
)

# Enable CORS for external testing and frontend dashboards
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


from fastapi.encoders import jsonable_encoder

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """
    Handles malformed or structurally invalid JSON with HTTP 400 as per Section 06.1.
    """
    logger.warning(f"Request validation error on {request.url.path}")
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"detail": "Malformed JSON or structurally invalid request.", "errors": jsonable_encoder(exc.errors())}
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    """
    Handles unexpected internal errors with HTTP 500 without leaking secrets or stack traces.
    """
    logger.error(f"Internal error processing {request.url.path}: {str(exc)}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Controlled internal error. Please verify input parameters."}
    )


@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """
    Readiness and liveness endpoint for the judging harness.
    Must return HTTP 200 with {"status": "ok"}.
    """
    return HealthResponse(status="ok")


@app.post("/optimize-energy", response_model=OptimizeEnergyResponse, tags=["Optimization"])
async def optimize_energy(payload: OptimizeEnergyRequest):
    """
    Primary endpoint:
    1. Interprets 1-3 operator notes into structured directives via LLM.
    2. Validates directives deterministically through guardrails.
    3. Solves the 24-hour cost-minimization Linear Program.
    4. Independently audits energy balance, battery neutrality, and recalculates totals.
    5. Returns machine-checkable JSON response.
    """
    start_time = time.time()
    logger.info(f"Received optimization request for scenario: {payload.scenario_id}")

    try:
        # Step 1 & 2: Interpret notes via LLM with deterministic guardrails
        directives = await interpret_operator_notes(
            notes=payload.operator_notes,
            battery=payload.battery
        )

        # Step 3: Solve the 24-hour Linear Programming optimization
        hourly_plan, raw_grid, raw_cost, raw_peak = solve_energy_schedule(
            request=payload,
            directives=directives
        )

        # Step 4: Independent verification and total recalculation
        total_grid, total_cost, peak_grid, plan_summary = verify_and_recalculate_schedule(
            request=payload,
            directives=directives,
            hourly_plan=hourly_plan
        )

        elapsed_ms = (time.time() - start_time) * 1000
        logger.info(f"Scenario {payload.scenario_id} solved in {elapsed_ms:.1f}ms. Total Cost: {total_cost} BDT.")

        # Step 5: Construct exact response
        return OptimizeEnergyResponse(
            scenario_id=payload.scenario_id,
            directive_interpretation=directives,
            hourly_plan=hourly_plan,
            total_grid_kwh=total_grid,
            total_cost_bdt=total_cost,
            peak_grid_kwh=peak_grid,
            plan_summary=plan_summary
        )

    except Exception as e:
        logger.error(f"Error during energy optimization: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to solve energy schedule."
        )
