# GLOW Track System Architecture

This diagram shows how the track-based system works, including luminode assignment, MIDI routing, and rendering.

```mermaid
graph LR
    subgraph "MIDI Input"
        MIDI[MIDI Devices<br/>MIDIManager<br/>Active Notes]
    end
    
    subgraph "Track Management"
        TRACKS[TrackManager<br/>Track Array<br/>Individual Tracks]
    end
    
    subgraph "Luminode System"
        LUMINODES[Luminode Factory<br/>Available Types<br/>Track Instances]
    end
    
    subgraph "Trajectory System"
        TRAJECTORY[TrajectorySystem<br/>Track Configurations<br/>Motion Paths]
    end
    
    subgraph "Rendering Pipeline"
        RENDERING[Animation Loop<br/>Active Tracks<br/>Track Layouts<br/>Luminode Drawing]
    end
    
    %% Main flow
    MIDI --> TRACKS
    TRACKS --> LUMINODES
    TRACKS --> TRAJECTORY
    RENDERING --> TRACKS
    RENDERING --> LUMINODES
    RENDERING --> TRAJECTORY
    RENDERING --> MIDI
    
    classDef track fill:#2e7d32,stroke:#ffffff,stroke-width:2px,color:#ffffff
    classDef luminode fill:#4a148c,stroke:#ffffff,stroke-width:2px,color:#ffffff
    classDef midi fill:#1b5e20,stroke:#ffffff,stroke-width:2px,color:#ffffff
    classDef rendering fill:#bf360c,stroke:#ffffff,stroke-width:2px,color:#ffffff
    classDef trajectory fill:#1a237e,stroke:#ffffff,stroke-width:2px,color:#ffffff
    
    class TRACKS track
    class LUMINODES luminode
    class MIDI midi
    class RENDERING rendering
    class TRAJECTORY trajectory
```

## Track System Features

### 1. Track Structure
Each track contains:
- **Identity**: Unique ID (1-4) and customizable name
- **State**: Mute/solo flags for track control
- **MIDI Assignment**: Connected MIDI device for input
- **Luminode Assignment**: Visual pattern type to render
- **Layout**: Position (x, y) and rotation for spatial arrangement

### 2. Luminode Management
- **Factory Pattern**: Creates luminode instances based on track assignments
- **Track-Specific Instances**: Each track gets its own luminode instance
- **Multiple Instances**: Same luminode type can be used on multiple tracks
- **Dynamic Assignment**: Luminodes can be changed at runtime

### 3. MIDI Routing
- **Device-to-Track Mapping**: MIDI devices are assigned to specific tracks
- **Note Processing**: MIDI notes are routed to the correct luminode type
- **Active Note Tracking**: Real-time tracking of which notes are playing
- **Velocity and Timing**: Full MIDI data preservation for visual effects

### 4. Rendering Pipeline
- **Active Track Filtering**: Only non-muted tracks (or solo tracks) are rendered
- **Layout Calculation**: Each track's position is calculated with trajectory motion
- **Luminode Drawing**: Each active track's luminode draws with its assigned notes
- **Spatial Independence**: Tracks can have different positions and rotations

### 5. Trajectory System
- **Motion Paths**: Tracks can follow predefined or custom motion patterns
- **Real-time Animation**: Smooth movement based on time and configuration
- **Track-Specific**: Each track can have its own trajectory configuration
- **Layout Integration**: Trajectory motion is applied to track layouts