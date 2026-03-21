"""
MIDI CARRIER BRIDGE

Connects MIDI hardware input to the Lyria steering system.
MIDI notes become the "carrier signal" that Lyria modulates.

This allows hardware controllers (keyboards, pads, etc.) to drive
the Lyria generation in real-time.
"""

import mido
from typing import Optional, Callable, List
from dataclasses import dataclass


@dataclass
class MIDINote:
    """Represents a MIDI note event."""
    note: int  # 0-127
    velocity: int  # 0-127
    channel: int  # 0-15
    is_note_on: bool


class MIDICarrierBridge:
    """
    Bridge between MIDI hardware and Lyria steering parameters.

    Listens for MIDI input and converts notes into steering updates:
    - Note values -> harmonic field
    - Velocity -> density/energy
    - Note density -> user activity
    """

    def __init__(self):
        self.midi_in: Optional[mido.ports.BaseInput] = None
        self.on_note_event: Optional[Callable[[MIDINote], None]] = None
        self.active_notes: set[int] = set()
        self.harmonic_field: List[int] = []

    def list_ports(self) -> List[str]:
        """List available MIDI input ports."""
        return mido.get_input_names()

    def connect(self, port_name: Optional[str] = None) -> bool:
        """
        Connect to a MIDI input port.

        Args:
            port_name: Name of MIDI port, or None for default

        Returns:
            True if connection successful
        """
        try:
            if port_name:
                self.midi_in = mido.open_input(port_name)
            else:
                # Try to open first available port
                ports = self.list_ports()
                if not ports:
                    print("[MIDI] No MIDI ports available")
                    return False
                self.midi_in = mido.open_input(ports[0])

            print(f"[MIDI] Connected to {self.midi_in.name}")
            return True

        except Exception as e:
            print(f"[MIDI] Connection failed: {e}")
            return False

    def start_listening(self) -> None:
        """Start listening for MIDI messages in a loop."""
        if not self.midi_in:
            raise RuntimeError("Not connected to MIDI port")

        print("[MIDI] Listening for MIDI input...")

        for msg in self.midi_in:
            self._handle_message(msg)

    def _handle_message(self, msg: mido.Message) -> None:
        """Process incoming MIDI message."""
        if msg.type == "note_on":
            if msg.velocity > 0:
                # Note on
                self.active_notes.add(msg.note)
                self._update_harmonic_field()

                midi_note = MIDINote(
                    note=msg.note,
                    velocity=msg.velocity,
                    channel=msg.channel,
                    is_note_on=True,
                )

                if self.on_note_event:
                    self.on_note_event(midi_note)

            else:
                # Note off (velocity 0)
                self.active_notes.discard(msg.note)
                self._update_harmonic_field()

                midi_note = MIDINote(
                    note=msg.note,
                    velocity=0,
                    channel=msg.channel,
                    is_note_on=False,
                )

                if self.on_note_event:
                    self.on_note_event(midi_note)

        elif msg.type == "note_off":
            # Note off
            self.active_notes.discard(msg.note)
            self._update_harmonic_field()

            midi_note = MIDINote(
                note=msg.note,
                velocity=msg.velocity,
                channel=msg.channel,
                is_note_on=False,
            )

            if self.on_note_event:
                self.on_note_event(midi_note)

    def _update_harmonic_field(self) -> None:
        """Update the current harmonic field based on active notes."""
        self.harmonic_field = sorted(list(self.active_notes))

    def get_harmonic_field(self) -> List[int]:
        """Get the current harmonic field (active MIDI notes)."""
        return self.harmonic_field.copy()

    def get_user_activity(self) -> float:
        """
        Calculate user activity level based on note density.

        Returns:
            Activity level from 0.0 (no notes) to 1.0 (max polyphony)
        """
        max_polyphony = 10
        return min(1.0, len(self.active_notes) / max_polyphony)

    def disconnect(self) -> None:
        """Close MIDI connection."""
        if self.midi_in:
            self.midi_in.close()
            self.midi_in = None
            print("[MIDI] Disconnected")


# Integration example with WebSocket server
"""
from midi_carrier import MIDICarrierBridge

bridge = MIDICarrierBridge()
bridge.connect()  # Auto-select first available port

def handle_midi_note(note: MIDINote):
    # Send to WebSocket clients
    for ws in active_websockets:
        await ws.send_json({
            "type": "midi_carrier",
            "note": note.note,
            "velocity": note.velocity,
            "harmonic_field": bridge.get_harmonic_field(),
            "user_activity": bridge.get_user_activity(),
        })

bridge.on_note_event = handle_midi_note
bridge.start_listening()  # Blocks
"""
