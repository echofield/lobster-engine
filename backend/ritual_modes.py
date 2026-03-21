"""
RITUAL MODES - State Machine for Lyria Steering

Four sonic characters mapped to precise parameter sets.
Each mode defines a distinct audio processing personality.
"""

from typing import Literal, TypedDict
from enum import Enum

RitualMode = Literal["IONIC", "RADIANT", "VORTEX", "ETHER"]

class HarmonicBias(str, Enum):
    ODD = "odd"
    EVEN = "even"
    ALL = "all"
    SPECTRAL = "spectral"

class ModulationParams(TypedDict):
    mode: RitualMode
    density: float  # 0.0 - 1.0
    jitter_ms: float  # Temporal jitter in milliseconds
    harmonic_bias: HarmonicBias
    wet_pct: float  # 0.0 - 1.0 (wet/dry mix)

# RITUAL MODE PRESETS
# Each mode is a crystallized aesthetic with specific parameter ranges

RITUAL_PRESETS: dict[RitualMode, ModulationParams] = {
    "IONIC": {
        "mode": "IONIC",
        "density": 0.15,  # Sparse, analytical
        "jitter_ms": 0.5,  # Minimal temporal variance
        "harmonic_bias": HarmonicBias.ODD,  # High-pass character
        "wet_pct": 0.001,  # 0.1% wet - barely perceptible
    },
    
    "RADIANT": {
        "mode": "RADIANT",
        "density": 0.45,  # Medium-rich harmonic field
        "jitter_ms": 1.2,  # Gentle temporal sway
        "harmonic_bias": HarmonicBias.EVEN,  # Tube-like warmth
        "wet_pct": 0.25,  # 25% wet - present but not dominant
    },
    
    "VORTEX": {
        "mode": "VORTEX",
        "density": 0.85,  # Dense, chaotic
        "jitter_ms": 8.5,  # Significant temporal instability
        "harmonic_bias": HarmonicBias.ALL,  # Full spectral content
        "wet_pct": 0.60,  # 60% wet - effect-forward
    },
    
    "ETHER": {
        "mode": "ETHER",
        "density": 0.30,  # Sparse but evolving
        "jitter_ms": 120.0,  # Extremely slow drift (2 minutes)
        "harmonic_bias": HarmonicBias.SPECTRAL,  # 0-20kHz blur
        "wet_pct": 0.80,  # 80% wet - ambient wash
    },
}

class RitualModeEngine:
    """
    Manages ritual mode state and parameter interpolation.
    
    Can transition between modes with smooth crossfades,
    or apply dynamic modulation based on user activity.
    """
    
    def __init__(self, initial_mode: RitualMode = "IONIC"):
        self.current_mode = initial_mode
        self.params = RITUAL_PRESETS[initial_mode].copy()
        self.evolution_factor = 0.0  # 0-1, affects drift within mode
    
    def set_mode(self, mode: RitualMode) -> ModulationParams:
        """
        Hard switch to a new ritual mode.
        Returns the new parameter set.
        """
        self.current_mode = mode
        self.params = RITUAL_PRESETS[mode].copy()
        return self.params
    
    def get_params(self) -> ModulationParams:
        """Get current modulation parameters."""
        return self.params.copy()
    
    def modulate_density(self, user_activity: float) -> None:
        """
        Dynamically adjust density based on user activity.
        
        Args:
            user_activity: 0.0 (idle) to 1.0 (high interaction)
        """
        base_density = RITUAL_PRESETS[self.current_mode]["density"]
        
        if self.current_mode == "IONIC":
            # IONIC stays sparse, slight increase with activity
            self.params["density"] = base_density + (user_activity * 0.15)
        
        elif self.current_mode == "RADIANT":
            # RADIANT blooms with interaction
            self.params["density"] = base_density + (user_activity * 0.25)
        
        elif self.current_mode == "VORTEX":
            # VORTEX gets MORE chaotic with activity
            self.params["density"] = min(1.0, base_density + (user_activity * 0.15))
        
        elif self.current_mode == "ETHER":
            # ETHER stays consistent, barely affected
            self.params["density"] = base_density + (user_activity * 0.05)
    
    def modulate_jitter(self, gesture_energy: float) -> None:
        """
        Adjust temporal jitter based on gestural energy.
        
        Args:
            gesture_energy: 0.0 (still) to 1.0 (rapid movement)
        """
        base_jitter = RITUAL_PRESETS[self.current_mode]["jitter_ms"]
        
        if self.current_mode == "IONIC":
            # IONIC tightens with energy (more precise)
            self.params["jitter_ms"] = max(0.1, base_jitter - (gesture_energy * 0.3))
        
        elif self.current_mode == "RADIANT":
            # RADIANT sways more with energy
            self.params["jitter_ms"] = base_jitter + (gesture_energy * 2.0)
        
        elif self.current_mode == "VORTEX":
            # VORTEX becomes MORE unstable
            self.params["jitter_ms"] = base_jitter + (gesture_energy * 10.0)
        
        elif self.current_mode == "ETHER":
            # ETHER's long drift is unaffected by short-term energy
            self.params["jitter_ms"] = base_jitter
    
    def evolve(self, session_duration: float) -> None:
        """
        Long-term evolution within a mode based on session time.
        
        Args:
            session_duration: Time in seconds since session start
        """
        # Evolution is most pronounced in ETHER mode
        if self.current_mode == "ETHER":
            # Drift harmonic bias over 60 minutes
            cycle_duration = 3600  # 60 minutes
            self.evolution_factor = (session_duration % cycle_duration) / cycle_duration
            
            # Could modulate density or other params based on evolution_factor
            # For now, ETHER's evolution is implicit in its long jitter time
    
    def apply_musical_context(self, harmonic_field: list[int]) -> None:
        """
        Adjust parameters based on the current harmonic context.
        
        Args:
            harmonic_field: List of MIDI note numbers defining the current harmony
        """
        # Calculate harmonic complexity (more notes = more complex)
        complexity = len(set(harmonic_field)) / 12.0  # Normalize to 0-1
        
        # Different modes respond differently to harmonic complexity
        if self.current_mode == "IONIC":
            # IONIC prefers simplicity, reduces density with complexity
            self.params["density"] *= (1.0 - complexity * 0.2)
        
        elif self.current_mode == "RADIANT":
            # RADIANT embraces complexity
            self.params["density"] *= (1.0 + complexity * 0.3)
        
        elif self.current_mode == "VORTEX":
            # VORTEX thrives on complexity
            self.params["jitter_ms"] *= (1.0 + complexity * 0.5)
        
        elif self.current_mode == "ETHER":
            # ETHER is unaffected by harmonic changes (it IS the harmony)
            pass

# Factory function for easy instantiation
def create_ritual_engine(mode: RitualMode = "IONIC") -> RitualModeEngine:
    """Create and return a new RitualModeEngine instance."""
    return RitualModeEngine(mode)

# Validation helpers
def validate_mode(mode: str) -> bool:
    """Check if a string is a valid ritual mode."""
    return mode in ["IONIC", "RADIANT", "VORTEX", "ETHER"]

def get_mode_description(mode: RitualMode) -> str:
    """Return a human-readable description of a ritual mode."""
    descriptions = {
        "IONIC": "Cold, analytical. Sparse harmonics, 1176 all-buttons character. 0.1% wet.",
        "RADIANT": "Warm, golden. Tube-like even-order harmonics. Low frequency presence. 25% wet.",
        "VORTEX": "Chaotic, distorted. Feedback loops, digital grit, analog clipping. 60% wet.",
        "ETHER": "Infinite, ambient. Long decay, spectral blur, 0-20kHz drift over 60 minutes. 80% wet.",
    }
    return descriptions.get(mode, "Unknown mode")
