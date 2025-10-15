# GLOW Rendering Pipeline

This diagram shows the complete rendering pipeline from MIDI input to visual output.

```mermaid
graph LR
    subgraph "Input Sources"
        INPUT[MIDI Input<br/>Tablet Input<br/>Time Input]
    end
    
    subgraph "Data Processing"
        PROCESSING[MIDI Processing<br/>Note Cleanup<br/>Track Filtering<br/>Layout Calculation]
    end
    
    subgraph "Rendering Preparation"
        PREPARATION[Canvas Clear<br/>Luminode Preparation<br/>Trajectory Application]
    end
    
    subgraph "Visual Rendering"
        RENDERING[Luminode Drawing<br/>Tablet Drawing<br/>Canvas Effects]
    end
    
    subgraph "Output Layers"
        OUTPUT[Main Canvas<br/>Tablet Canvas<br/>CRT Overlay]
    end
    
    subgraph "Animation Loop"
        ANIMATION[requestAnimationFrame<br/>Frame Start<br/>Frame End]
    end
    
    %% Main flow
    INPUT --> PROCESSING
    PROCESSING --> PREPARATION
    PREPARATION --> RENDERING
    RENDERING --> OUTPUT
    ANIMATION --> PREPARATION
    RENDERING --> ANIMATION
    
    classDef input fill:#1b5e20,stroke:#ffffff,stroke-width:2px,color:#ffffff
    classDef processing fill:#2e7d32,stroke:#ffffff,stroke-width:2px,color:#ffffff
    classDef preparation fill:#4a148c,stroke:#ffffff,stroke-width:2px,color:#ffffff
    classDef rendering fill:#bf360c,stroke:#ffffff,stroke-width:2px,color:#ffffff
    classDef output fill:#1a237e,stroke:#ffffff,stroke-width:2px,color:#ffffff
    classDef animation fill:#424242,stroke:#ffffff,stroke-width:2px,color:#ffffff
    
    class INPUT input
    class PROCESSING processing
    class PREPARATION preparation
    class RENDERING rendering
    class OUTPUT output
    class ANIMATION animation
```

## Rendering Pipeline Details

### 1. Input Processing
- **MIDI Input**: Real-time note events with velocity and timing
- **Tablet Input**: Drawing tablet strokes and geometric shapes
- **Time Input**: Animation clock for smooth motion and effects

### 2. Data Processing
- **MIDI Processing**: Convert raw MIDI to note objects with timing
- **Note Cleanup**: Remove expired notes based on age and velocity
- **Track Filtering**: Determine which tracks are active (not muted, or solo)
- **Layout Calculation**: Calculate track positions with trajectory motion

### 3. Rendering Preparation
- **Canvas Clear**: Clear canvas with fade effect for smooth transitions
- **Luminode Preparation**: Get luminode instances and their assigned notes
- **Trajectory Application**: Apply motion paths to track layouts

### 4. Visual Rendering
- **Luminode Drawing**: Each active track's luminode draws its pattern
- **Tablet Drawing**: Render user-drawn strokes and geometric shapes
- **Canvas Effects**: Apply CRT overlay, lumia effects, and other visual filters

### 5. Output Layers
- **Main Canvas**: Primary output for luminode patterns
- **Tablet Canvas**: Overlay for drawing tablet input
- **CRT Overlay**: Visual effects layer for retro aesthetics

## Animation Loop Flow

```mermaid
sequenceDiagram
    participant RAF as requestAnimationFrame
    participant GLOW as GLOWVisualizer
    participant MIDI as MIDIManager
    participant CANVAS as CanvasDrawer
    participant LUMINODE as Luminode
    participant TABLET as TabletManager
    
    RAF->>GLOW: animate()
    GLOW->>MIDI: cleanupOldNotes()
    GLOW->>CANVAS: clear()
    GLOW->>MIDI: getActiveNotesForTracks()
    MIDI-->>GLOW: activeNotes
    GLOW->>GLOW: drawLuminodes(time, activeNotes)
    
    loop For Each Active Track
        GLOW->>LUMINODE: draw(time, notes, layout)
        LUMINODE->>CANVAS: render geometry
    end
    
    GLOW->>TABLET: checkAndClearStrokes()
    GLOW->>TABLET: updateGeometricShapes()
    GLOW->>RAF: requestAnimationFrame(animate)
```

## Performance Considerations

### Frame Rate Optimization
- **60 FPS Target**: Uses `requestAnimationFrame` for smooth animation
- **Selective Rendering**: Only active tracks are processed
- **Efficient Cleanup**: Old notes are removed to prevent memory leaks

### Memory Management
- **Note Cleanup**: Automatic removal of expired MIDI notes
- **Instance Reuse**: Luminode instances are reused for track assignments
- **Canvas Optimization**: Efficient canvas operations with minimal redraws

### Visual Quality
- **Smooth Transitions**: Fade effects for seamless visual flow
- **High Resolution**: Canvas operations support high-DPI displays
- **Effect Layering**: Multiple visual effects can be combined
