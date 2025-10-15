# GLOW System Architecture

This diagram shows the high-level architecture of the GLOW visualizer system, including the main components and their relationships.

```mermaid
graph LR
    subgraph "External Systems & Browser"
        EXTERNAL[MIDI Devices<br/>Drawing Tablet<br/>File System]
        BROWSER[HTML Document<br/>Main Canvas<br/>Tablet Canvas<br/>UI Elements]
    end
        
    subgraph "Core Orchestrator"
        GLOW[GLOWVisualizer<br/>Main Controller]
    end
    
    subgraph "Management Components"
        MANAGEMENT[TrackManager<br/>MIDIManager<br/>TabletManager<br/>ProjectManager]
    end
    
    subgraph "UI Components"
        UI[UIManager<br/>SidePanel<br/>Save/Load Dialogs]
    end
    
    subgraph "Rendering Components"
        RENDERING[CanvasDrawer<br/>Luminode Factory<br/>TrajectorySystem]
    end
    
    subgraph "Configuration"
        CONFIG[Settings<br/>Luminode Configs]
    end
    
    %% Main flow
    EXTERNAL --> BROWSER
    BROWSER --> GLOW
    GLOW --> MANAGEMENT
    GLOW --> UI
    GLOW --> RENDERING
    GLOW --> CONFIG
    
    %% Management interactions
    MANAGEMENT --> RENDERING
    MANAGEMENT --> CONFIG
    MANAGEMENT --> GLOW
    
    %% UI interactions
    UI --> GLOW
    UI --> MANAGEMENT
    
    %% Rendering interactions
    RENDERING --> GLOW
    RENDERING --> MANAGEMENT
    
    %% Configuration interactions
    CONFIG --> GLOW
    CONFIG --> MANAGEMENT
    CONFIG --> RENDERING
    
    classDef core fill:#1a237e,stroke:#ffffff,stroke-width:2px,color:#ffffff
    classDef management fill:#2e7d32,stroke:#ffffff,stroke-width:2px,color:#ffffff
    classDef ui fill:#bf360c,stroke:#ffffff,stroke-width:2px,color:#ffffff
    classDef rendering fill:#4a148c,stroke:#ffffff,stroke-width:2px,color:#ffffff
    classDef config fill:#1b5e20,stroke:#ffffff,stroke-width:2px,color:#ffffff
    classDef external fill:#424242,stroke:#ffffff,stroke-width:2px,color:#ffffff
    
    class GLOW core
    class MANAGEMENT management
    class UI ui
    class RENDERING rendering
    class CONFIG config
    class EXTERNAL,BROWSER external
```

## Key Responsibilities

### GLOWVisualizer (Core Orchestrator)
- **Primary Role**: Central coordinator that manages all system components
- **Responsibilities**:
  - Initializes and coordinates all managers
  - Manages the animation loop
  - Handles event routing between components
  - Manages track-based luminode instances
  - Controls application lifecycle (start/stop)

### Management Layer
- **TrackManager**: Manages tracks, luminode assignments, and trajectory configurations
- **MIDIManager**: Handles MIDI input/output, device management, and note processing
- **TabletManager**: Controls drawing tablet input and geometric shape detection
- **ProjectManager**: Handles project saving/loading with complete state preservation

### UI Layer
- **UIManager**: Manages UI controls and triggers application events
- **SidePanel**: Provides settings interface for tracks, tablet, and canvas configuration
- **Dialogs**: Handle project save/load operations with user interaction

### Rendering Layer
- **CanvasDrawer**: Provides low-level canvas operations and layout transformations
- **Luminode Factory**: Creates luminode instances based on track assignments
- **Luminode Instances**: Track-specific drawing modules that render geometric patterns

### Configuration
- **Settings**: Global configuration constants and parameters
- **TrajectorySystem**: Manages motion paths and animations for track layouts
