import { SETTINGS, UTILS } from "./settings.js";
import { getLuminodeSettingsKey, LUMINODE_REGISTRY } from "./luminodes/index.js";
import { DEFAULT_EFFECT_LAYER_ORDER } from "./effect-layer-manager.js";
import {
  FILE_TYPE,
  GLOW_FILE_ACCEPT,
  GLOW_MIME,
  GLOW_SET_FILE_ACCEPT,
  detectGlowFileType,
  stripGlowExtension,
} from "./glow-file-types.js";
import { SetManager } from "./set-manager.js";

export class ProjectManager {
  constructor(glowVisualizer) {
    this.glowVisualizer = glowVisualizer;
    this.currentFileHandle = null;
    this.currentProjectName = "Untitled Project";
    this.savedState = null;
    this.hasUnsavedChanges = false;
    this.currentFileType = null;
    this.setManager = new SetManager(this);
  }

  collectProjectState() {
    const state = {
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      canvas: {
        clearAlpha: SETTINGS.CANVAS.CLEAR_ALPHA,
        backgroundColor: SETTINGS.CANVAS.BACKGROUND_COLOR,
        crtMode: SETTINGS.CANVAS.CRT_MODE,
        crtIntensity: SETTINGS.CANVAS.CRT_INTENSITY,
        lumiaEffect: SETTINGS.CANVAS.LUMIA_EFFECT,
        gridEnabled: SETTINGS.CANVAS.GRID_ENABLED,
        gridXLines: SETTINGS.CANVAS.GRID_X_LINES,
        gridYLines: SETTINGS.CANVAS.GRID_Y_LINES,
        gridColor: SETTINGS.CANVAS.GRID_COLOR,
        noiseOverlay: SETTINGS.CANVAS.NOISE_OVERLAY,
        noiseAnimate: SETTINGS.CANVAS.NOISE_ANIMATE,
        noisePatternWidth: SETTINGS.CANVAS.NOISE_PATTERN_WIDTH,
        noisePatternHeight: SETTINGS.CANVAS.NOISE_PATTERN_HEIGHT,
        noiseOpacity: SETTINGS.CANVAS.NOISE_OPACITY,
        noiseDensity: SETTINGS.CANVAS.NOISE_DENSITY,
        noiseWidth: SETTINGS.CANVAS.NOISE_WIDTH,
        noiseHeight: SETTINGS.CANVAS.NOISE_HEIGHT,
        ditherOverlay: SETTINGS.CANVAS.DITHER_OVERLAY,
        ditherSaturate: SETTINGS.CANVAS.DITHER_SATURATE,
        ditherTableValuesR: SETTINGS.CANVAS.DITHER_TABLE_VALUES_R,
        ditherTableValuesG: SETTINGS.CANVAS.DITHER_TABLE_VALUES_G,
        ditherTableValuesB: SETTINGS.CANVAS.DITHER_TABLE_VALUES_B,
        chromaticAberrationEnabled:
          SETTINGS.CANVAS.CHROMATIC_ABERRATION_ENABLED,
        chromaticAberrationContrast:
          SETTINGS.CANVAS.CHROMATIC_ABERRATION_CONTRAST,
        invertFilter: SETTINGS.CANVAS.INVERT_FILTER,
        grayscaleFilter: SETTINGS.CANVAS.GRAYSCALE_FILTER,
        hueRotateFilter: SETTINGS.CANVAS.HUE_ROTATE_FILTER,
        brightnessFilter: SETTINGS.CANVAS.BRIGHTNESS_FILTER,
        contrastFilter: SETTINGS.CANVAS.CONTRAST_FILTER,
        saturationFilter: SETTINGS.CANVAS.SATURATION_FILTER,
        shaderBackgroundEnabled: SETTINGS.CANVAS.SHADER_BACKGROUND_ENABLED,
        shaderBackgroundMode: SETTINGS.CANVAS.SHADER_BACKGROUND_MODE,
        shaderBackgroundTrailLength:
          SETTINGS.CANVAS.SHADER_BACKGROUND_TRAIL_LENGTH,
        shaderBackgroundColorFluidBackground:
          SETTINGS.CANVAS.SHADER_BACKGROUND_COLOR_FLUID_BACKGROUND,
        shaderBackgroundColorFluidTrail:
          SETTINGS.CANVAS.SHADER_BACKGROUND_COLOR_FLUID_TRAIL,
        shaderBackgroundColorPressure:
          SETTINGS.CANVAS.SHADER_BACKGROUND_COLOR_PRESSURE,
        shaderBackgroundColorVelocity:
          SETTINGS.CANVAS.SHADER_BACKGROUND_COLOR_VELOCITY,
        shaderBackgroundCursorMode:
          SETTINGS.CANVAS.SHADER_BACKGROUND_CURSOR_MODE,
        shaderBackgroundPortalTimeOffset:
          SETTINGS.CANVAS.SHADER_BACKGROUND_PORTAL_TIME_OFFSET,
        shaderBackgroundPortalTimeDivisor:
          SETTINGS.CANVAS.SHADER_BACKGROUND_PORTAL_TIME_DIVISOR,
        shaderBackgroundPortalBrightness:
          SETTINGS.CANVAS.SHADER_BACKGROUND_PORTAL_BRIGHTNESS,
        shaderBackgroundDiscoPaletteVariant:
          SETTINGS.CANVAS.SHADER_BACKGROUND_DISCO_PALETTE_VARIANT,
        shaderBackgroundDiscoPaletteBase:
          SETTINGS.CANVAS.SHADER_BACKGROUND_DISCO_PALETTE_BASE,
        shaderBackgroundDiscoPaletteWave:
          SETTINGS.CANVAS.SHADER_BACKGROUND_DISCO_PALETTE_WAVE,
        shaderBackgroundDiscoShimmer:
          SETTINGS.CANVAS.SHADER_BACKGROUND_DISCO_SHIMMER,
        shaderBackgroundBalatroSpinRotation:
          SETTINGS.CANVAS.SHADER_BACKGROUND_BALATRO_SPIN_ROTATION,
        shaderBackgroundBalatroSpinSpeed:
          SETTINGS.CANVAS.SHADER_BACKGROUND_BALATRO_SPIN_SPEED,
        shaderBackgroundBalatroOffsetX:
          SETTINGS.CANVAS.SHADER_BACKGROUND_BALATRO_OFFSET_X,
        shaderBackgroundBalatroOffsetY:
          SETTINGS.CANVAS.SHADER_BACKGROUND_BALATRO_OFFSET_Y,
        shaderBackgroundBalatroColor1:
          SETTINGS.CANVAS.SHADER_BACKGROUND_BALATRO_COLOR_1,
        shaderBackgroundBalatroColor2:
          SETTINGS.CANVAS.SHADER_BACKGROUND_BALATRO_COLOR_2,
        shaderBackgroundBalatroColor3:
          SETTINGS.CANVAS.SHADER_BACKGROUND_BALATRO_COLOR_3,
        shaderBackgroundBalatroContrast:
          SETTINGS.CANVAS.SHADER_BACKGROUND_BALATRO_CONTRAST,
        shaderBackgroundBalatroLighting:
          SETTINGS.CANVAS.SHADER_BACKGROUND_BALATRO_LIGHTING,
        shaderBackgroundBalatroSpinAmount:
          SETTINGS.CANVAS.SHADER_BACKGROUND_BALATRO_SPIN_AMOUNT,
        shaderBackgroundBalatroPixelFilter:
          SETTINGS.CANVAS.SHADER_BACKGROUND_BALATRO_PIXEL_FILTER,
        shaderBackgroundBalatroSpinEase:
          SETTINGS.CANVAS.SHADER_BACKGROUND_BALATRO_SPIN_EASE,
        shaderBackgroundBalatroIsRotate:
          SETTINGS.CANVAS.SHADER_BACKGROUND_BALATRO_IS_ROTATE,
        shaderBackgroundChromaNoiseTimeScale:
          SETTINGS.CANVAS.SHADER_BACKGROUND_CHROMA_NOISE_TIME_SCALE,
        shaderBackgroundChromaNoiseUvScale:
          SETTINGS.CANVAS.SHADER_BACKGROUND_CHROMA_NOISE_UV_SCALE,
        shaderBackgroundChromaFineNoiseScale:
          SETTINGS.CANVAS.SHADER_BACKGROUND_CHROMA_FINE_NOISE_SCALE,
        shaderBackgroundChromaGrainMix:
          SETTINGS.CANVAS.SHADER_BACKGROUND_CHROMA_GRAIN_MIX,
        shaderBackgroundChromaColorA:
          SETTINGS.CANVAS.SHADER_BACKGROUND_CHROMA_COLOR_A,
        shaderBackgroundChromaColorB:
          SETTINGS.CANVAS.SHADER_BACKGROUND_CHROMA_COLOR_B,
        shaderBackgroundChromaColorAMul:
          SETTINGS.CANVAS.SHADER_BACKGROUND_CHROMA_COLOR_A_MUL,
        shaderBackgroundChromaColorBMul:
          SETTINGS.CANVAS.SHADER_BACKGROUND_CHROMA_COLOR_B_MUL,
        shaderBackgroundChromaMixClampMin:
          SETTINGS.CANVAS.SHADER_BACKGROUND_CHROMA_MIX_CLAMP_MIN,
        shaderBackgroundChromaMixClampMax:
          SETTINGS.CANVAS.SHADER_BACKGROUND_CHROMA_MIX_CLAMP_MAX,
        shaderBackgroundChromaLayer1S:
          SETTINGS.CANVAS.SHADER_BACKGROUND_CHROMA_LAYER1_S,
        shaderBackgroundChromaLayer2S:
          SETTINGS.CANVAS.SHADER_BACKGROUND_CHROMA_LAYER2_S,
        shaderBackgroundChromaLayer1Z:
          SETTINGS.CANVAS.SHADER_BACKGROUND_CHROMA_LAYER1_Z,
        shaderBackgroundChromaLayer2Z:
          SETTINGS.CANVAS.SHADER_BACKGROUND_CHROMA_LAYER2_Z,
        glassOverlayEnabled: SETTINGS.CANVAS.GLASS_OVERLAY_ENABLED,
        glassOverlayMode: SETTINGS.CANVAS.GLASS_OVERLAY_MODE,
        glassOverlayWidth: SETTINGS.CANVAS.GLASS_OVERLAY_WIDTH,
        glassOverlayHeight: SETTINGS.CANVAS.GLASS_OVERLAY_HEIGHT,
        glassOverlayRadius: SETTINGS.CANVAS.GLASS_OVERLAY_RADIUS,
        glassOverlayThickness: SETTINGS.CANVAS.GLASS_OVERLAY_THICKNESS,
        glassOverlayBezel: SETTINGS.CANVAS.GLASS_OVERLAY_BEZEL,
        glassOverlayIOR: SETTINGS.CANVAS.GLASS_OVERLAY_IOR,
        glassOverlayBlur: SETTINGS.CANVAS.GLASS_OVERLAY_BLUR,
        glassOverlaySpecular: SETTINGS.CANVAS.GLASS_OVERLAY_SPECULAR,
        glassOverlayTint: SETTINGS.CANVAS.GLASS_OVERLAY_TINT,
        glassOverlayShadow: SETTINGS.CANVAS.GLASS_OVERLAY_SHADOW,
        glassOverlayBrickSize: SETTINGS.CANVAS.GLASS_OVERLAY_BRICK_SIZE,
        glassOverlayBrickOffsetX: SETTINGS.CANVAS.GLASS_OVERLAY_BRICK_OFFSET_X,
        glassOverlayBrickOffsetY: SETTINGS.CANVAS.GLASS_OVERLAY_BRICK_OFFSET_Y,
        glassOverlayBrickGap: SETTINGS.CANVAS.GLASS_OVERLAY_BRICK_GAP,
        shaderOverlayRainDistortion:
          SETTINGS.CANVAS.SHADER_OVERLAY_RAIN_DISTORTION,
        shaderOverlayRainScale: SETTINGS.CANVAS.SHADER_OVERLAY_RAIN_SCALE,
        shaderOverlayRainTimeScale:
          SETTINGS.CANVAS.SHADER_OVERLAY_RAIN_TIME_SCALE,
        shaderOverlayRainPatternDrift:
          SETTINGS.CANVAS.SHADER_OVERLAY_RAIN_PATTERN_DRIFT,
        shaderOverlayRainSharpness:
          SETTINGS.CANVAS.SHADER_OVERLAY_RAIN_SHARPNESS,
        // Mixer effect-chain z-order (DOM layer stack)
        effectLayerOrder: this.glowVisualizer.effectLayerManager
          ? this.glowVisualizer.effectLayerManager.getOrder()
          : [...DEFAULT_EFFECT_LAYER_ORDER],
      },
      colors: {
        sotoPalette: [...SETTINGS.COLORS.SOTO_PALETTE],
        pitchPalette: [...(SETTINGS.COLORS.PITCH_PALETTE || [])],
        pitchColorFactor: UTILS.pitchColorFactor,
        pitchPaletteSize: UTILS.pitchPaletteSize,
      },
      modules: this.collectModuleSettings(),
      tracks: this.collectTrackSettings(),
      trajectories: this.collectTrajectorySettings(),
      lineModulations: this.collectLineModulationSettings(),
      pitchPalettes: this.collectPitchPaletteSettings(),
      modulation: this.collectModulationSettings(),
      tablet: this.collectTabletSettings(),
      midi: this.collectMidiSettings(),
    };

    return state;
  }

  collectModuleSettings() {
    const modules = {};
    const tracks = this.glowVisualizer.trackManager.getTracks();

    tracks.forEach((track) => {
      if (track.luminode) {
        const moduleKey = getLuminodeSettingsKey(track.luminode);
        if (SETTINGS.MODULES[moduleKey]) {
          modules[moduleKey] = { ...SETTINGS.MODULES[moduleKey] };
        }
      }
    });

    return modules;
  }

  collectTrackSettings() {
    const tracks = this.glowVisualizer.trackManager.getTracks();
    const availableDevices =
      this.glowVisualizer.trackManager.getAvailableMidiDevices();

    return {
      tracks: tracks.map((track) => {
        const trackData = {
          id: track.id,
          name: track.name,
          muted: track.muted,
          solo: track.solo,
          midiDevice: track.midiDevice,
          luminode: track.luminode,
          layout: { ...track.layout },
          opacity: typeof track.opacity === 'number' ? track.opacity : 1,
          blendMode: track.blendMode || 'source-over',
          layerOrder:
            typeof track.layerOrder === 'number'
              ? track.layerOrder
              : track.id - 1,
        };

        if (track.midiDevice) {
          const device = availableDevices.find(
            (d) => d.id === track.midiDevice,
          );
          if (device) {
            trackData.midiDeviceInfo = {
              id: device.id,
              name: device.name,
              manufacturer: device.manufacturer,
            };
          }
        }

        return trackData;
      }),
    };
  }

  collectTrajectorySettings() {
    const tracks = this.glowVisualizer.trackManager.getTracks();
    const trajectories = {};

    tracks.forEach((track) => {
      const config = this.glowVisualizer.trackManager.getTrajectoryConfig(
        track.id,
      );
      if (config) {
        trajectories[track.id] = { ...config };
      }
    });

    return trajectories;
  }

  collectLineModulationSettings() {
    const tracks = this.glowVisualizer.trackManager.getTracks();
    const lineModulations = {};
    const system =
      this.glowVisualizer.trackManager.getLineModulationSystem();

    tracks.forEach((track) => {
      const config =
        this.glowVisualizer.trackManager.getLineModulationConfig(track.id);
      if (config) {
        lineModulations[track.id] = system.cloneConfig(config);
      }
    });

    return lineModulations;
  }

  collectPitchPaletteSettings() {
    const pitchPalettes = {};
    const tracks = this.glowVisualizer.trackManager.getTracks();
    const system =
      this.glowVisualizer.trackManager.getPitchPaletteSystem();

    tracks.forEach((track) => {
      const config = system.getTrackConfig(track.id)
      pitchPalettes[track.id] = system.cloneConfig(config)
    })

    return pitchPalettes;
  }

  collectModulationSettings() {
    const modulationSystem =
      this.glowVisualizer.trackManager.getModulationSystem();
    const modulators = modulationSystem.getModulators();
    const audioTracks = modulationSystem.getAudioTracks();

    return {
      audioTracks: audioTracks.map((track) => ({
        id: track.id,
        name: track.name,
        dataUrl: track.dataUrl,
        enabled: track.enabled !== false,
        loop: track.loop !== false,
      })),
      modulators: modulators.map((modulator) => ({
        id: modulator.id,
        type: modulator.type,
        shape: modulator.shape,
        rate: modulator.rate,
        depth: modulator.depth,
        offset: modulator.offset,
        cubicBezier: modulator.cubicBezier,
        multiplier: modulator.multiplier,
        easing: modulator.easing,
        threshold: modulator.threshold,
        enabled: modulator.enabled,
        targetDestination: modulator.targetDestination,
        targetTrack: modulator.targetTrack,
        targetConfigKey: modulator.targetConfigKey,
        targetLuminode: modulator.targetLuminode,
        targetCanvasFilter: modulator.targetCanvasFilter,
        targetShaderOverlay: modulator.targetShaderOverlay,
        audioDeviceId: modulator.audioDeviceId,
        audioDeviceLabel: modulator.audioDeviceLabel,
        audioChannel: modulator.audioChannel,
        audioChannelMode: modulator.audioChannelMode || 'mono',
        audioFeature: modulator.audioFeature,
        audioFreqMin: modulator.audioFreqMin,
        audioFreqMax: modulator.audioFreqMax,
        audioSmoothing: modulator.audioSmoothing,
        audioSourceType: modulator.audioSourceType || 'input',
        audioTrackId: modulator.audioTrackId || null,
      })),
    };
  }

  collectTabletSettings() {
    const tabletManager = this.glowVisualizer.tabletManager;

    return {
      lineWidth: tabletManager.baseLineWidth || 4,
      geometricMode: tabletManager.geometricMode || false,
      shapeDetectionThreshold: tabletManager.shapeDetectionThreshold || 0.8,
      geometricPencilMode: tabletManager.geometricPencilMode || false,
      polygonSides: tabletManager.polygonSides || 3,
      polygonSize: tabletManager.polygonSize || 50,
      fadeDuration: tabletManager.fadeDuration || 3000,
      connectionMode: tabletManager.websocketMode ? "websocket" : "webhid",
      websocketHost: tabletManager.websocketHost || "localhost",
      websocketPort: tabletManager.websocketPort || 5678,
    };
  }

  collectMidiSettings() {
    const midiManager = this.glowVisualizer.midiManager;
    const midiGenerator = this.glowVisualizer.midiGenerator;
    const generatorState = midiGenerator?.getSerializableState?.() || {
      generators: [],
      midiOutEnabled: false,
    };

    return {
      outputEnabled: midiManager.outputEnabled || false,
      outputDevice: midiManager.outputDevice || null,
      octaveRange: midiManager.octaveRange || 3,
      generators: generatorState.generators,
      generateOutputEnabled: generatorState.midiOutEnabled,
    };
  }

  generateProjectFile(projectName) {
    const state = this.collectProjectState();
    state.name = projectName;
    return JSON.stringify(state, null, 2);
  }

  getCurrentState() {
    return this.collectProjectState();
  }

  checkForUnsavedChanges() {
    if (this.currentFileType === FILE_TYPE.SET && this.setManager.isActive()) {
      return this.setManager.checkForUnsavedChanges();
    }

    if (!this.savedState) {
      return this.currentFileHandle !== null;
    }

    const currentState = this.getCurrentState();
    const savedStateCopy = { ...this.savedState };
    const currentStateCopy = { ...currentState };

    delete savedStateCopy.timestamp;
    delete currentStateCopy.timestamp;

    const currentStateStr = JSON.stringify(currentStateCopy);
    const savedStateStr = JSON.stringify(savedStateCopy);

    return currentStateStr !== savedStateStr;
  }

  isSetMode() {
    return (
      this.currentFileType === FILE_TYPE.SET && this.setManager.isActive()
    );
  }

  updateUnsavedChangesFlag() {
    this.hasUnsavedChanges = this.checkForUnsavedChanges();
    return this.hasUnsavedChanges;
  }

  async saveNewProject(projectName) {
    try {
      if (!("showSaveFilePicker" in window)) {
        throw new Error(
          "File System Access API is not supported in this browser",
        );
      }

      const content = this.generateProjectFile(projectName);
      const blob = new Blob([content], { type: "application/json" });

      document.body.classList.add("loading");
      let fileHandle;
      try {
        fileHandle = await window.showSaveFilePicker({
          suggestedName: `${projectName}.glow`,
          types: [
            {
              description: "Glow Project Files",
              accept: {
                "application/json": [".glow"],
              },
            },
          ],
        });
      } finally {
        document.body.classList.remove("loading");
      }

      const writable = await fileHandle.createWritable();
      await writable.write(blob);
      await writable.close();

      this.currentFileHandle = fileHandle;
      this.currentProjectName = projectName;
      this.savedState = this.getCurrentState();
      this.hasUnsavedChanges = false;

      this.addToRecentProjects(fileHandle, projectName);

      return { success: true, fileHandle, projectName };
    } catch (error) {
      document.body.classList.remove("loading");
      if (error.name === "AbortError") {
        return { success: false, cancelled: true };
      }
      throw error;
    }
  }

  async saveExistingProject() {
    if (this.isSetMode()) {
      return this.saveExistingSet();
    }

    if (!this.currentFileHandle) {
      return this.saveNewProject(this.currentProjectName);
    }

    try {
      const content = this.generateProjectFile(this.currentProjectName);
      const blob = new Blob([content], { type: "application/json" });

      const writable = await this.currentFileHandle.createWritable();
      await writable.write(blob);
      await writable.close();

      this.savedState = this.getCurrentState();
      this.hasUnsavedChanges = false;

      this.addToRecentProjects(this.currentFileHandle, this.currentProjectName);

      return { success: true };
    } catch (error) {
      if (error.name === "PermissionDeniedError") {
        return this.saveNewProject(this.currentProjectName);
      }
      throw error;
    }
  }

  async saveProject(projectName = null) {
    if (this.isSetMode()) {
      return this.saveExistingSet();
    }

    if (projectName && !this.currentFileHandle) {
      return this.saveNewProject(projectName);
    } else if (this.currentFileHandle) {
      return this.saveExistingProject();
    } else {
      throw new Error("No file handle and no project name provided");
    }
  }

  async pickGlowScenesForSet() {
    if (!("showOpenFilePicker" in window)) {
      throw new Error(
        "File System Access API is not supported in this browser",
      );
    }

    document.body.classList.add("loading");
    try {
      const handles = await window.showOpenFilePicker({
        types: [
          {
            description: "Glow Scene Files",
            accept: {
              "application/json": [".glow"],
            },
          },
        ],
        multiple: true,
      });

      const scenes = [];
      for (const handle of handles) {
        const file = await handle.getFile();
        if (file.name.endsWith(".set.glow")) continue;

        const content = await file.text();
        const projectData = JSON.parse(content);
        this.validateProjectFile(projectData);
        scenes.push(
          this.setManager.buildSceneEntry(file.name, projectData),
        );
      }

      return scenes;
    } finally {
      document.body.classList.remove("loading");
    }
  }

  async openProject(fileHandle = null) {
    try {
      if (!("showOpenFilePicker" in window)) {
        throw new Error(
          "File System Access API is not supported in this browser",
        );
      }

      let handle = fileHandle;

      if (!handle) {
        document.body.classList.add("loading");
        try {
          const [selectedHandle] = await window.showOpenFilePicker({
            types: [
              {
                description: "Glow Project Files",
                accept: GLOW_FILE_ACCEPT,
              },
            ],
            multiple: false,
          });
          handle = selectedHandle;
        } finally {
          document.body.classList.remove("loading");
        }
      }

      const file = await handle.getFile();
      const content = await file.text();
      const projectData = JSON.parse(content);

      return await this.openGlowFileWithData(handle, projectData, file);
    } catch (error) {
      document.body.classList.remove("loading");
      if (error.name === "AbortError") {
        return { cancelled: true };
      }
      throw error;
    }
  }

  async openGlowFileWithData(fileHandle, fileData, file) {
    const fileType = detectGlowFileType(file.name, fileData);

    if (fileType === FILE_TYPE.SET) {
      return this.openSetWithData(fileHandle, fileData, file);
    }

    return this.openProjectWithData(fileHandle, fileData, file);
  }

  async openProjectWithData(fileHandle, projectData, file) {
    try {
      this.setManager.clear();
      this.currentFileType = FILE_TYPE.SCENE;
      this.validateProjectFile(projectData);

      this.currentFileHandle = fileHandle;
      this.currentProjectName =
        projectData.name || stripGlowExtension(file.name);

      const loadSuccess = await this.loadProjectState(projectData);

      if (!loadSuccess) {
        this.currentFileHandle = null;
        this.currentProjectName = "Untitled Project";
        this.currentFileType = null;
        throw new Error("Failed to load project state");
      }

      this.savedState = this.getCurrentState();
      this.hasUnsavedChanges = false;

      this.addToRecentProjects(fileHandle, this.currentProjectName, FILE_TYPE.SCENE);

      return {
        success: true,
        file,
        projectData,
        fileHandle,
        fileType: FILE_TYPE.SCENE,
      };
    } catch (error) {
      this.currentFileHandle = null;
      this.currentProjectName = "Untitled Project";
      this.currentFileType = null;
      throw error;
    }
  }

  async openSetWithData(fileHandle, setData, file) {
    try {
      this.setManager.validateSetFile(setData);
      this.setManager.loadSet(fileHandle, setData);

      this.currentFileHandle = fileHandle;
      this.currentFileType = FILE_TYPE.SET;
      this.currentProjectName = setData.name || stripGlowExtension(file.name);

      const loadSuccess = await this.setManager.switchToScene(0);

      if (!loadSuccess) {
        this.setManager.clear();
        this.currentFileHandle = null;
        this.currentProjectName = "Untitled Project";
        this.currentFileType = null;
        throw new Error("Failed to load set");
      }

      this.savedState = this.getCurrentState();
      this.hasUnsavedChanges = false;

      this.addToRecentProjects(fileHandle, this.currentProjectName, FILE_TYPE.SET);

      return {
        success: true,
        file,
        setData,
        fileHandle,
        fileType: FILE_TYPE.SET,
      };
    } catch (error) {
      this.setManager.clear();
      this.currentFileHandle = null;
      this.currentProjectName = "Untitled Project";
      this.currentFileType = null;
      throw error;
    }
  }

  async switchToSetScene(index) {
    if (!this.isSetMode()) return { success: false };

    const success = await this.setManager.switchToScene(index);
    if (!success) return { success: false };

    return {
      success: true,
      displayName: this.setManager.getDisplayName(),
      sceneIndex: index,
    };
  }

  generateSetFile(setName, scenes) {
    const state = this.setManager.buildSetState(setName, scenes);
    return JSON.stringify(state, null, 2);
  }

  async saveNewSet(setName, scenes) {
    try {
      if (!("showSaveFilePicker" in window)) {
        throw new Error(
          "File System Access API is not supported in this browser",
        );
      }

      const content = this.generateSetFile(setName, scenes);
      const blob = new Blob([content], { type: GLOW_MIME.SET });

      document.body.classList.add("loading");
      let fileHandle;
      try {
        fileHandle = await window.showSaveFilePicker({
          suggestedName: `${setName}.set.glow`,
          excludeAcceptAllOption: true,
          types: [
            {
              description: "Glow Set Files",
              accept: GLOW_SET_FILE_ACCEPT,
            },
          ],
        });
      } finally {
        document.body.classList.remove("loading");
      }

      const writable = await fileHandle.createWritable();
      await writable.write(blob);
      await writable.close();

      this.setManager.loadSet(fileHandle, JSON.parse(content));
      this.currentFileHandle = fileHandle;
      this.currentFileType = FILE_TYPE.SET;
      this.currentProjectName = setName;

      const loadSuccess = await this.setManager.switchToScene(0);
      if (!loadSuccess) {
        this.setManager.clear();
        this.currentFileHandle = null;
        this.currentProjectName = "Untitled Project";
        this.currentFileType = null;
        throw new Error("Failed to load set");
      }

      this.setManager.savedSetState = this.setManager.getSetSnapshot();
      this.savedState = this.getCurrentState();
      this.hasUnsavedChanges = false;

      this.addToRecentProjects(fileHandle, setName, FILE_TYPE.SET);

      return { success: true, fileHandle, setName };
    } catch (error) {
      document.body.classList.remove("loading");
      if (error.name === "AbortError") {
        return { success: false, cancelled: true };
      }
      throw error;
    }
  }

  async saveExistingSet() {
    if (!this.currentFileHandle || !this.isSetMode()) {
      return this.saveNewSet(
        this.setManager.setName || this.currentProjectName,
        this.setManager.scenes,
      );
    }

    try {
      this.setManager.updateActiveSceneData();
      const content = JSON.stringify(this.setManager.getSetSnapshot(), null, 2);
      const blob = new Blob([content], { type: GLOW_MIME.SET });

      const writable = await this.currentFileHandle.createWritable();
      await writable.write(blob);
      await writable.close();

      this.setManager.savedSetState = this.setManager.getSetSnapshot();
      this.savedState = this.getCurrentState();
      this.hasUnsavedChanges = false;

      this.addToRecentProjects(
        this.currentFileHandle,
        this.currentProjectName,
        FILE_TYPE.SET,
      );

      return { success: true };
    } catch (error) {
      if (error.name === "PermissionDeniedError") {
        return this.saveNewSet(
          this.setManager.setName || this.currentProjectName,
          this.setManager.scenes,
        );
      }
      throw error;
    }
  }

  getRecentProjects() {
    try {
      const recent = localStorage.getItem("glow_recent_projects");
      if (!recent) return [];
      return JSON.parse(recent);
    } catch (error) {
      console.error("Error reading recent projects:", error);
      return [];
    }
  }

  async addToRecentProjects(fileHandle, projectName, fileType = FILE_TYPE.SCENE) {
    if (!fileHandle) return;

    try {
      const file = await fileHandle.getFile();
      const fileName = file.name;

      const recentProjects = this.getRecentProjects();

      const existingIndex = recentProjects.findIndex(
        (p) => p.fileName === fileName,
      );
      if (existingIndex !== -1) {
        recentProjects.splice(existingIndex, 1);
      }

      const projectInfo = {
        fileName,
        projectName,
        fileType,
        lastOpened: Date.now(),
      };

      recentProjects.unshift(projectInfo);

      const maxRecent = 5;
      if (recentProjects.length > maxRecent) {
        recentProjects.splice(maxRecent);
      }

      localStorage.setItem(
        "glow_recent_projects",
        JSON.stringify(recentProjects),
      );
    } catch (error) {
      console.error("Error saving recent projects:", error);
    }
  }

  clearProject() {
    this.currentFileHandle = null;
    this.currentProjectName = "Untitled Project";
    this.savedState = null;
    this.hasUnsavedChanges = false;
    this.currentFileType = null;
    this.setManager.clear();
  }

  getCurrentProjectName() {
    return this.currentProjectName;
  }

  setCurrentProjectName(name) {
    this.currentProjectName = name;
    if (this.currentFileHandle) {
      this.updateUnsavedChangesFlag();
    }
  }

  hasOpenFile() {
    return this.currentFileHandle !== null;
  }

  validateProjectFile(projectData) {
    const requiredFields = [
      "version",
      "canvas",
      "colors",
      "modules",
      "tracks",
      "tablet",
      "midi",
    ];

    for (const field of requiredFields) {
      if (!projectData.hasOwnProperty(field)) {
        throw new Error(
          `Invalid project file: missing required field '${field}'`,
        );
      }
    }

    return true;
  }

  // Load project state from project data
  async loadProjectState(projectData) {
    try {
      this.validateProjectFile(projectData);

      console.log("Loading project:", projectData.name || "Unnamed Project");

      // Load canvas settings
      this.loadCanvasSettings(projectData.canvas);

      // Load color settings
      this.loadColorSettings(projectData.colors);

      // Load module settings
      this.loadModuleSettings(projectData.modules);

      // Load track settings
      await this.loadTrackSettings(projectData.tracks);

      // Load trajectory settings
      this.loadTrajectorySettings(projectData.trajectories || {});

      // Load line modulation settings
      this.loadLineModulationSettings(projectData.lineModulations || {});

      // Load per-track pitch palettes
      this.loadPitchPaletteSettings(projectData.pitchPalettes || {});

      // Load modulation settings
      await this.loadModulationSettings(projectData.modulation || {});

      // Load MIDI settings
      await this.loadMidiSettings(projectData.midi);

      this.glowVisualizer.sidePanel.renderTracks();
      this.glowVisualizer.mixerPanel?.refresh();
      this.glowVisualizer.sidePanel.modulationUIManager.renderModulationControls();
      this.glowVisualizer.syncAudioTransportUI();
      if (this.glowVisualizer.sidePanel.basePanel.activeTab === "external") {
        await this.glowVisualizer.sidePanel.externalSystemsUIManager.renderExternalControls();
      }

      console.log("Project loaded successfully");
      return true;
    } catch (error) {
      console.error("Error loading project:", error);
      return false;
    }
  }

  loadCanvasSettings(canvasData) {
    if (!canvasData) return;

    if (canvasData.clearAlpha !== undefined) {
      SETTINGS.CANVAS.CLEAR_ALPHA = canvasData.clearAlpha;
      this.glowVisualizer.canvasDrawer.setClearAlpha(canvasData.clearAlpha);
    }

    if (canvasData.backgroundColor !== undefined) {
      SETTINGS.CANVAS.BACKGROUND_COLOR = canvasData.backgroundColor;
      this.glowVisualizer.canvasDrawer.setBackgroundColor(
        canvasData.backgroundColor,
      );
    }

    if (canvasData.crtMode !== undefined) {
      SETTINGS.CANVAS.CRT_MODE = canvasData.crtMode;
      this.glowVisualizer.toggleCRTMode(canvasData.crtMode);
    }

    if (canvasData.crtIntensity !== undefined) {
      SETTINGS.CANVAS.CRT_INTENSITY = canvasData.crtIntensity;
      this.glowVisualizer.setCRTIntensity(canvasData.crtIntensity);
    }

    if (canvasData.lumiaEffect !== undefined) {
      SETTINGS.CANVAS.LUMIA_EFFECT = canvasData.lumiaEffect;
      this.glowVisualizer.updateLumiaEffect(canvasData.lumiaEffect);
    }

    if (canvasData.gridEnabled !== undefined) {
      SETTINGS.CANVAS.GRID_ENABLED = canvasData.gridEnabled;
    }

    if (canvasData.gridXLines !== undefined) {
      SETTINGS.CANVAS.GRID_X_LINES = canvasData.gridXLines;
    }

    if (canvasData.gridYLines !== undefined) {
      SETTINGS.CANVAS.GRID_Y_LINES = canvasData.gridYLines;
    }

    if (canvasData.gridColor !== undefined) {
      SETTINGS.CANVAS.GRID_COLOR = canvasData.gridColor;
    }

    if (canvasData.noiseOverlay !== undefined) {
      SETTINGS.CANVAS.NOISE_OVERLAY = canvasData.noiseOverlay;
      this.glowVisualizer.toggleNoiseOverlay(canvasData.noiseOverlay);
    }

    if (canvasData.noiseAnimate !== undefined) {
      SETTINGS.CANVAS.NOISE_ANIMATE = canvasData.noiseAnimate;
      this.glowVisualizer.updateNoiseOptions({
        animate: canvasData.noiseAnimate,
      });
    }

    if (canvasData.noisePatternWidth !== undefined) {
      SETTINGS.CANVAS.NOISE_PATTERN_WIDTH = canvasData.noisePatternWidth;
      this.glowVisualizer.updateNoiseOptions({
        patternWidth: canvasData.noisePatternWidth,
      });
    }

    if (canvasData.noisePatternHeight !== undefined) {
      SETTINGS.CANVAS.NOISE_PATTERN_HEIGHT = canvasData.noisePatternHeight;
      this.glowVisualizer.updateNoiseOptions({
        patternHeight: canvasData.noisePatternHeight,
      });
    }

    if (canvasData.noiseOpacity !== undefined) {
      SETTINGS.CANVAS.NOISE_OPACITY = canvasData.noiseOpacity;
      this.glowVisualizer.updateNoiseOptions({
        grainOpacity: canvasData.noiseOpacity,
      });
    }

    if (canvasData.noiseDensity !== undefined) {
      SETTINGS.CANVAS.NOISE_DENSITY = canvasData.noiseDensity;
      this.glowVisualizer.updateNoiseOptions({
        grainDensity: canvasData.noiseDensity,
      });
    }

    if (canvasData.noiseWidth !== undefined) {
      SETTINGS.CANVAS.NOISE_WIDTH = canvasData.noiseWidth;
      this.glowVisualizer.updateNoiseOptions({
        grainWidth: canvasData.noiseWidth,
      });
    }

    if (canvasData.noiseHeight !== undefined) {
      SETTINGS.CANVAS.NOISE_HEIGHT = canvasData.noiseHeight;
      this.glowVisualizer.updateNoiseOptions({
        grainHeight: canvasData.noiseHeight,
      });
    }

    if (canvasData.ditherOverlay !== undefined) {
      SETTINGS.CANVAS.DITHER_OVERLAY = canvasData.ditherOverlay;
      this.glowVisualizer.toggleDitherOverlay(canvasData.ditherOverlay);
    }

    if (canvasData.ditherSaturate !== undefined) {
      SETTINGS.CANVAS.DITHER_SATURATE = canvasData.ditherSaturate;
      this.glowVisualizer.updateDitherSaturate(canvasData.ditherSaturate);
    }

    if (canvasData.ditherTableValuesR !== undefined) {
      SETTINGS.CANVAS.DITHER_TABLE_VALUES_R = canvasData.ditherTableValuesR;
      this.glowVisualizer.updateDitherTableValues(
        "R",
        canvasData.ditherTableValuesR,
      );
    }

    if (canvasData.ditherTableValuesG !== undefined) {
      SETTINGS.CANVAS.DITHER_TABLE_VALUES_G = canvasData.ditherTableValuesG;
      this.glowVisualizer.updateDitherTableValues(
        "G",
        canvasData.ditherTableValuesG,
      );
    }

    if (canvasData.ditherTableValuesB !== undefined) {
      SETTINGS.CANVAS.DITHER_TABLE_VALUES_B = canvasData.ditherTableValuesB;
      this.glowVisualizer.updateDitherTableValues(
        "B",
        canvasData.ditherTableValuesB,
      );
    }

    if (canvasData.chromaticAberrationEnabled !== undefined) {
      SETTINGS.CANVAS.CHROMATIC_ABERRATION_ENABLED =
        canvasData.chromaticAberrationEnabled;
      this.glowVisualizer.toggleChromaticAberrationOverlay(
        canvasData.chromaticAberrationEnabled,
      );
    }

    if (canvasData.chromaticAberrationContrast !== undefined) {
      SETTINGS.CANVAS.CHROMATIC_ABERRATION_CONTRAST =
        canvasData.chromaticAberrationContrast;
      this.glowVisualizer.updateChromaticAberrationContrast(
        canvasData.chromaticAberrationContrast,
      );
    }

    if (canvasData.invertFilter !== undefined) {
      SETTINGS.CANVAS.INVERT_FILTER = canvasData.invertFilter;
      this.glowVisualizer.updateInvertFilter(canvasData.invertFilter);
    }

    if (canvasData.grayscaleFilter !== undefined) {
      SETTINGS.CANVAS.GRAYSCALE_FILTER = canvasData.grayscaleFilter;
      this.glowVisualizer.updateGrayscaleFilter(canvasData.grayscaleFilter);
    }

    if (canvasData.hueRotateFilter !== undefined) {
      SETTINGS.CANVAS.HUE_ROTATE_FILTER = canvasData.hueRotateFilter;
      this.glowVisualizer.updateHueRotateFilter(canvasData.hueRotateFilter);
    }

    if (canvasData.brightnessFilter !== undefined) {
      SETTINGS.CANVAS.BRIGHTNESS_FILTER = canvasData.brightnessFilter;
      this.glowVisualizer.updateBrightnessFilter(canvasData.brightnessFilter);
    }

    if (canvasData.contrastFilter !== undefined) {
      SETTINGS.CANVAS.CONTRAST_FILTER = canvasData.contrastFilter;
      this.glowVisualizer.updateContrastFilter(canvasData.contrastFilter);
    }

    if (canvasData.saturationFilter !== undefined) {
      SETTINGS.CANVAS.SATURATION_FILTER = canvasData.saturationFilter;
      this.glowVisualizer.updateSaturationFilter(canvasData.saturationFilter);
    }

    if (canvasData.shaderBackgroundEnabled !== undefined) {
      SETTINGS.CANVAS.SHADER_BACKGROUND_ENABLED =
        canvasData.shaderBackgroundEnabled;
      this.glowVisualizer.updateFluidBackgroundEnabled(
        canvasData.shaderBackgroundEnabled,
      );
    }

    if (canvasData.shaderBackgroundMode !== undefined) {
      SETTINGS.CANVAS.SHADER_BACKGROUND_MODE = canvasData.shaderBackgroundMode;
      this.glowVisualizer.updateFluidBackgroundMode(
        canvasData.shaderBackgroundMode,
      );
    }

    if (canvasData.shaderBackgroundTrailLength !== undefined) {
      SETTINGS.CANVAS.SHADER_BACKGROUND_TRAIL_LENGTH =
        canvasData.shaderBackgroundTrailLength;
      this.glowVisualizer.updateFluidBackgroundTrailLength(
        canvasData.shaderBackgroundTrailLength,
      );
    }

    if (canvasData.shaderBackgroundColorFluidBackground !== undefined) {
      SETTINGS.CANVAS.SHADER_BACKGROUND_COLOR_FLUID_BACKGROUND =
        canvasData.shaderBackgroundColorFluidBackground;
      this.glowVisualizer.updateFluidBackgroundColorFluidBackground(
        canvasData.shaderBackgroundColorFluidBackground,
      );
    }

    if (canvasData.shaderBackgroundColorFluidTrail !== undefined) {
      SETTINGS.CANVAS.SHADER_BACKGROUND_COLOR_FLUID_TRAIL =
        canvasData.shaderBackgroundColorFluidTrail;
      this.glowVisualizer.updateFluidBackgroundColorFluidTrail(
        canvasData.shaderBackgroundColorFluidTrail,
      );
    }

    if (canvasData.shaderBackgroundColorPressure !== undefined) {
      SETTINGS.CANVAS.SHADER_BACKGROUND_COLOR_PRESSURE =
        canvasData.shaderBackgroundColorPressure;
      this.glowVisualizer.updateFluidBackgroundColorPressure(
        canvasData.shaderBackgroundColorPressure,
      );
    }

    if (canvasData.shaderBackgroundColorVelocity !== undefined) {
      SETTINGS.CANVAS.SHADER_BACKGROUND_COLOR_VELOCITY =
        canvasData.shaderBackgroundColorVelocity;
      this.glowVisualizer.updateFluidBackgroundColorVelocity(
        canvasData.shaderBackgroundColorVelocity,
      );
    }

    if (canvasData.shaderBackgroundCursorMode !== undefined) {
      SETTINGS.CANVAS.SHADER_BACKGROUND_CURSOR_MODE =
        canvasData.shaderBackgroundCursorMode;
      this.glowVisualizer.updateFluidBackgroundCursorMode(
        canvasData.shaderBackgroundCursorMode,
      );
    }

    const procKeys = [
      [
        "shaderBackgroundPortalTimeOffset",
        "SHADER_BACKGROUND_PORTAL_TIME_OFFSET",
      ],
      [
        "shaderBackgroundPortalTimeDivisor",
        "SHADER_BACKGROUND_PORTAL_TIME_DIVISOR",
      ],
      [
        "shaderBackgroundPortalBrightness",
        "SHADER_BACKGROUND_PORTAL_BRIGHTNESS",
      ],
      [
        "shaderBackgroundDiscoPaletteVariant",
        "SHADER_BACKGROUND_DISCO_PALETTE_VARIANT",
      ],
      [
        "shaderBackgroundDiscoPaletteBase",
        "SHADER_BACKGROUND_DISCO_PALETTE_BASE",
      ],
      [
        "shaderBackgroundDiscoPaletteWave",
        "SHADER_BACKGROUND_DISCO_PALETTE_WAVE",
      ],
      ["shaderBackgroundDiscoShimmer", "SHADER_BACKGROUND_DISCO_SHIMMER"],
      [
        "shaderBackgroundBalatroSpinRotation",
        "SHADER_BACKGROUND_BALATRO_SPIN_ROTATION",
      ],
      [
        "shaderBackgroundBalatroSpinSpeed",
        "SHADER_BACKGROUND_BALATRO_SPIN_SPEED",
      ],
      ["shaderBackgroundBalatroOffsetX", "SHADER_BACKGROUND_BALATRO_OFFSET_X"],
      ["shaderBackgroundBalatroOffsetY", "SHADER_BACKGROUND_BALATRO_OFFSET_Y"],
      ["shaderBackgroundBalatroColor1", "SHADER_BACKGROUND_BALATRO_COLOR_1"],
      ["shaderBackgroundBalatroColor2", "SHADER_BACKGROUND_BALATRO_COLOR_2"],
      ["shaderBackgroundBalatroColor3", "SHADER_BACKGROUND_BALATRO_COLOR_3"],
      ["shaderBackgroundBalatroContrast", "SHADER_BACKGROUND_BALATRO_CONTRAST"],
      ["shaderBackgroundBalatroLighting", "SHADER_BACKGROUND_BALATRO_LIGHTING"],
      [
        "shaderBackgroundBalatroSpinAmount",
        "SHADER_BACKGROUND_BALATRO_SPIN_AMOUNT",
      ],
      [
        "shaderBackgroundBalatroPixelFilter",
        "SHADER_BACKGROUND_BALATRO_PIXEL_FILTER",
      ],
      [
        "shaderBackgroundBalatroSpinEase",
        "SHADER_BACKGROUND_BALATRO_SPIN_EASE",
      ],
      [
        "shaderBackgroundBalatroIsRotate",
        "SHADER_BACKGROUND_BALATRO_IS_ROTATE",
      ],
      [
        "shaderBackgroundChromaNoiseTimeScale",
        "SHADER_BACKGROUND_CHROMA_NOISE_TIME_SCALE",
      ],
      [
        "shaderBackgroundChromaNoiseUvScale",
        "SHADER_BACKGROUND_CHROMA_NOISE_UV_SCALE",
      ],
      [
        "shaderBackgroundChromaFineNoiseScale",
        "SHADER_BACKGROUND_CHROMA_FINE_NOISE_SCALE",
      ],
      ["shaderBackgroundChromaGrainMix", "SHADER_BACKGROUND_CHROMA_GRAIN_MIX"],
      ["shaderBackgroundChromaColorA", "SHADER_BACKGROUND_CHROMA_COLOR_A"],
      ["shaderBackgroundChromaColorB", "SHADER_BACKGROUND_CHROMA_COLOR_B"],
      [
        "shaderBackgroundChromaColorAMul",
        "SHADER_BACKGROUND_CHROMA_COLOR_A_MUL",
      ],
      [
        "shaderBackgroundChromaColorBMul",
        "SHADER_BACKGROUND_CHROMA_COLOR_B_MUL",
      ],
      [
        "shaderBackgroundChromaMixClampMin",
        "SHADER_BACKGROUND_CHROMA_MIX_CLAMP_MIN",
      ],
      [
        "shaderBackgroundChromaMixClampMax",
        "SHADER_BACKGROUND_CHROMA_MIX_CLAMP_MAX",
      ],
      ["shaderBackgroundChromaLayer1S", "SHADER_BACKGROUND_CHROMA_LAYER1_S"],
      ["shaderBackgroundChromaLayer2S", "SHADER_BACKGROUND_CHROMA_LAYER2_S"],
      ["shaderBackgroundChromaLayer1Z", "SHADER_BACKGROUND_CHROMA_LAYER1_Z"],
      ["shaderBackgroundChromaLayer2Z", "SHADER_BACKGROUND_CHROMA_LAYER2_Z"],
      ["glassOverlayEnabled", "GLASS_OVERLAY_ENABLED"],
      ["glassOverlayMode", "GLASS_OVERLAY_MODE"],
      ["glassOverlayWidth", "GLASS_OVERLAY_WIDTH"],
      ["glassOverlayHeight", "GLASS_OVERLAY_HEIGHT"],
      ["glassOverlayRadius", "GLASS_OVERLAY_RADIUS"],
      ["glassOverlayThickness", "GLASS_OVERLAY_THICKNESS"],
      ["glassOverlayBezel", "GLASS_OVERLAY_BEZEL"],
      ["glassOverlayIOR", "GLASS_OVERLAY_IOR"],
      ["glassOverlayBlur", "GLASS_OVERLAY_BLUR"],
      ["glassOverlaySpecular", "GLASS_OVERLAY_SPECULAR"],
      ["glassOverlayTint", "GLASS_OVERLAY_TINT"],
      ["glassOverlayShadow", "GLASS_OVERLAY_SHADOW"],
      ["glassOverlayBrickSize", "GLASS_OVERLAY_BRICK_SIZE"],
      ["glassOverlayBrickOffsetX", "GLASS_OVERLAY_BRICK_OFFSET_X"],
      ["glassOverlayBrickOffsetY", "GLASS_OVERLAY_BRICK_OFFSET_Y"],
      ["glassOverlayBrickGap", "GLASS_OVERLAY_BRICK_GAP"],
      [
        "shaderOverlayRainDistortion",
        "SHADER_OVERLAY_RAIN_DISTORTION",
      ],
      ["shaderOverlayRainScale", "SHADER_OVERLAY_RAIN_SCALE"],
      [
        "shaderOverlayRainTimeScale",
        "SHADER_OVERLAY_RAIN_TIME_SCALE",
      ],
      [
        "shaderOverlayRainPatternDrift",
        "SHADER_OVERLAY_RAIN_PATTERN_DRIFT",
      ],
      [
        "shaderOverlayRainSharpness",
        "SHADER_OVERLAY_RAIN_SHARPNESS",
      ],
    ];
    for (const [dataKey, settingsKey] of procKeys) {
      if (canvasData[dataKey] !== undefined) {
        SETTINGS.CANVAS[settingsKey] = canvasData[dataKey];
      }
    }
    if (procKeys.some(([k]) => canvasData[k] !== undefined)) {
      this.glowVisualizer.syncShaderBackgroundEngines();
    }

    if (this.glowVisualizer.effectLayerManager) {
      this.glowVisualizer.effectLayerManager.setOrder(
        canvasData.effectLayerOrder || [...DEFAULT_EFFECT_LAYER_ORDER],
        { silent: true },
      );
    }
  }

  loadColorSettings(colorData) {
    if (!colorData) return;

    if (colorData.sotoPalette) {
      SETTINGS.COLORS.SOTO_PALETTE = [...colorData.sotoPalette];
    }

    if (colorData.pitchColorFactor !== undefined) {
      UTILS.pitchColorFactor = colorData.pitchColorFactor;
    }

    if (colorData.pitchPalette && colorData.pitchPalette.length > 0) {
      UTILS.pitchPaletteSize = UTILS.clampPitchPaletteSize(
        colorData.pitchPaletteSize ?? colorData.pitchPalette.length,
      );
      SETTINGS.COLORS.PITCH_PALETTE = colorData.pitchPalette.slice(
        0,
        UTILS.pitchPaletteSize,
      );
      UTILS.pitchPaletteSize = SETTINGS.COLORS.PITCH_PALETTE.length;
    } else {
      UTILS.pitchPaletteSize = UTILS.clampPitchPaletteSize(
        colorData.pitchPaletteSize ?? UTILS.pitchPaletteSize,
      );
      SETTINGS.COLORS.PITCH_PALETTE = UTILS.generatePitchPalette(
        UTILS.pitchColorFactor || 30,
        UTILS.pitchPaletteSize,
      );
    }
  }

  loadModuleSettings(moduleData) {
    if (!moduleData) return;

    Object.keys(moduleData).forEach((moduleKey) => {
      if (SETTINGS.MODULES[moduleKey]) {
        Object.assign(
          SETTINGS.MODULES[moduleKey],
          JSON.parse(JSON.stringify(moduleData[moduleKey])),
        );
        // Migrate legacy per-luminode deformation to the transversal system.
        delete SETTINGS.MODULES[moduleKey].DEFORMATION_STRENGTH;
        delete SETTINGS.MODULES[moduleKey].DEFORM_STRENGTH;
      }
    });
  }

  async loadTrackSettings(trackData) {
    if (!trackData || !trackData.tracks) return;

    const tracks = this.glowVisualizer.trackManager.getTracks();
    const availableDevices =
      this.glowVisualizer.trackManager.getAvailableMidiDevices();

    this.glowVisualizer.trackLuminodes.clear();

    const configsById = new Map();
    trackData.tracks.forEach((cfg) => {
      if (cfg && cfg.id != null) configsById.set(Number(cfg.id), cfg);
    });

    tracks.forEach((track, index) => {
      const trackConfig =
        configsById.get(track.id) || trackData.tracks[index] || null;
      if (!trackConfig) {
        track.name = `Track ${track.id}`;
        track.muted = false;
        track.solo = false;
        track.midiDevice = null;
        track.luminode = null;
        track.layout = { x: 0, y: 0, rotation: 0 };
        track.opacity = 1;
        track.blendMode = "source-over";
        track.layerOrder = track.id - 1;
        this.glowVisualizer.trackManager.triggerCallback("trackUpdated", {
          trackId: track.id,
          track,
        });
        return;
      }

      track.name = trackConfig.name || track.name;
      track.muted = trackConfig.muted || false;
      track.solo = trackConfig.solo || false;
      track.layout = { ...track.layout, ...(trackConfig.layout || {}) };
      track.opacity =
        typeof trackConfig.opacity === "number" ? trackConfig.opacity : 1;
      track.blendMode = trackConfig.blendMode || "source-over";
      track.layerOrder =
        typeof trackConfig.layerOrder === "number"
          ? trackConfig.layerOrder
          : track.id - 1;

      const luminodeKey = trackConfig.luminode || null;
      track.luminode =
        luminodeKey && LUMINODE_REGISTRY[luminodeKey] ? luminodeKey : null;
      if (track.luminode) {
        this.glowVisualizer.createLuminodeForTrack(track.id, track.luminode);
      } else if (luminodeKey) {
        console.warn(
          `Unknown luminode "${luminodeKey}" cleared from track ${track.id}`,
        );
      }

      if (trackConfig.midiDevice && trackConfig.midiDeviceInfo) {
        const deviceExists = availableDevices.find(
          (d) => d.id === trackConfig.midiDevice,
        );
        if (deviceExists) {
          track.midiDevice = trackConfig.midiDevice;
        } else {
          track.midiDevice = null;
          console.warn(
            `MIDI device "${trackConfig.midiDeviceInfo.name}" not available`,
          );
        }
      } else {
        track.midiDevice = null;
      }

      this.glowVisualizer.trackManager.triggerCallback("trackUpdated", {
        trackId: track.id,
        track,
      });
    });
  }

  loadTrajectorySettings(trajectoryData) {
    if (!trajectoryData) return;

    Object.keys(trajectoryData).forEach((trackId) => {
      const config = trajectoryData[trackId];
      if (config) {
        this.glowVisualizer.trackManager.updateTrajectoryConfig(
          parseInt(trackId),
          config,
        );
      }
    });
  }

  loadLineModulationSettings(lineModulationData) {
    if (!lineModulationData) return;

    Object.keys(lineModulationData).forEach((trackId) => {
      const config = lineModulationData[trackId];
      if (config) {
        this.glowVisualizer.trackManager.updateLineModulationConfig(
          parseInt(trackId),
          config,
        );
      }
    });
  }

  loadPitchPaletteSettings(pitchPaletteData) {
    if (!pitchPaletteData || Object.keys(pitchPaletteData).length === 0) {
      const tracks = this.glowVisualizer.trackManager.getTracks();
      this.glowVisualizer.trackManager
        .getPitchPaletteSystem()
        .seedAllTracksFromGlobal(tracks.map((t) => t.id));
      return;
    }

    Object.keys(pitchPaletteData).forEach((trackId) => {
      const config = pitchPaletteData[trackId];
      if (config) {
        this.glowVisualizer.trackManager.loadPitchPaletteConfig(
          parseInt(trackId),
          config,
        );
      }
    });
  }

  async loadModulationSettings(modulationData) {
    if (!modulationData) return;
    if (!modulationData.modulators && !modulationData.audioTracks) return;

    const modulationSystem =
      this.glowVisualizer.trackManager.getModulationSystem();
    const audioEngine = modulationSystem.getAudioEngine();

    modulationSystem.reset();

    // Shared audio tracks (new) + migrate per-modulator files from older projects
    const trackDefs = Array.isArray(modulationData.audioTracks)
      ? [...modulationData.audioTracks]
      : [];
    const legacyTrackIdByModulator = new Map();
    const modulators = Array.isArray(modulationData.modulators)
      ? modulationData.modulators
      : [];

    for (const modulatorData of modulators) {
      if ((modulatorData.audioSourceType || "input") !== "file") continue;
      if (modulatorData.audioTrackId) continue;
      if (!modulatorData.audioFileDataUrl) continue;

      const legacyId = `legacy-${modulatorData.id || trackDefs.length}`;
      legacyTrackIdByModulator.set(modulatorData.id, legacyId);
      trackDefs.push({
        id: legacyId,
        name: modulatorData.audioFileName || "Audio track",
        dataUrl: modulatorData.audioFileDataUrl,
        enabled: true,
        loop: modulatorData.audioLoop !== false,
      });
    }

    await audioEngine.restoreTracks(trackDefs);

    modulators.forEach((modulatorData) => {
      const modulatorType = modulatorData.type || "lfo";
      const modulatorId = modulationSystem.addModulator(modulatorType);
      if (modulatorId) {
        const updates = {
          id: modulatorData.id || modulatorId,
          type: modulatorType,
          enabled:
            modulatorData.enabled !== undefined ? modulatorData.enabled : true,
          targetDestination: modulatorData.targetDestination || "track",
          targetTrack:
            modulatorData.targetTrack !== undefined
              ? modulatorData.targetTrack
              : 1,
          targetConfigKey: modulatorData.targetConfigKey || null,
          targetLuminode: modulatorData.targetLuminode || null,
          targetCanvasFilter: modulatorData.targetCanvasFilter || null,
          targetShaderOverlay: modulatorData.targetShaderOverlay || null,
        };

        if (modulatorType === "lfo") {
          updates.shape = modulatorData.shape || "sine";
          updates.rate =
            modulatorData.rate !== undefined ? modulatorData.rate : 0.5;
          updates.depth =
            modulatorData.depth !== undefined ? modulatorData.depth : 0.5;
          updates.offset =
            modulatorData.offset !== undefined ? modulatorData.offset : 0;
          if (modulatorData.cubicBezier) {
            updates.cubicBezier = modulatorData.cubicBezier;
          }
        }

        if (
          modulatorType === "randomStepped" ||
          modulatorType === "randomSmooth"
        ) {
          updates.rate =
            modulatorData.rate !== undefined ? modulatorData.rate : 0.5;
          updates.depth =
            modulatorData.depth !== undefined ? modulatorData.depth : 0.5;
          updates.offset =
            modulatorData.offset !== undefined ? modulatorData.offset : 0;
          if (modulatorType === "randomSmooth") {
            updates.easing = modulatorData.easing || "smoothstep";
          }
          updates.threshold =
            modulatorData.threshold !== undefined
              ? modulatorData.threshold
              : 0.5;
        }

        if (modulatorType === "numberOfNotes" || modulatorType === "velocity") {
          updates.multiplier =
            modulatorData.multiplier !== undefined
              ? modulatorData.multiplier
              : 1.0;
          updates.easing = modulatorData.easing || "linear";
          updates.threshold =
            modulatorData.threshold !== undefined
              ? modulatorData.threshold
              : 0.5;
        }

        if (modulatorType === "audio") {
          updates.audioSourceType = modulatorData.audioSourceType || "input";
          updates.audioDeviceId = modulatorData.audioDeviceId || null;
          updates.audioDeviceLabel = modulatorData.audioDeviceLabel || null;
          updates.audioChannel =
            modulatorData.audioChannel !== undefined
              ? modulatorData.audioChannel
              : 0;
          updates.audioChannelMode =
            modulatorData.audioChannelMode === "stereo" ? "stereo" : "mono";
          updates.audioFeature = modulatorData.audioFeature || "rms";
          updates.audioFreqMin =
            modulatorData.audioFreqMin !== undefined
              ? modulatorData.audioFreqMin
              : 20;
          updates.audioFreqMax =
            modulatorData.audioFreqMax !== undefined
              ? modulatorData.audioFreqMax
              : 20000;
          updates.audioSmoothing =
            modulatorData.audioSmoothing !== undefined
              ? modulatorData.audioSmoothing
              : 0.7;
          updates.audioTrackId =
            modulatorData.audioTrackId ||
            legacyTrackIdByModulator.get(modulatorData.id) ||
            null;
          updates.depth =
            modulatorData.depth !== undefined ? modulatorData.depth : 0.5;
          updates.offset =
            modulatorData.offset !== undefined ? modulatorData.offset : 0;
          updates.multiplier =
            modulatorData.multiplier !== undefined
              ? modulatorData.multiplier
              : 1.0;
          updates.easing = modulatorData.easing || "linear";
          updates.threshold =
            modulatorData.threshold !== undefined
              ? modulatorData.threshold
              : 0.5;
        }

        const modulator = modulationSystem.getModulator(modulatorId);
        if (modulator) {
          Object.assign(modulator, updates);
        }
      }
    });

    return this.restoreAudioModulationInputs(modulationSystem);
  }

  async restoreAudioModulationInputs(modulationSystem) {
    const audioMods = modulationSystem
      .getModulators()
      .filter((m) => m.type === "audio" && m.enabled);
    if (audioMods.length === 0) return;

    const audioEngine = modulationSystem.getAudioEngine();
    const hasLiveInput = audioMods.some(
      (m) => (m.audioSourceType || "input") === "input",
    );

    if (hasLiveInput) {
      try {
        await audioEngine.refreshDevices();
        for (const modulator of audioMods) {
          if ((modulator.audioSourceType || "input") !== "input") continue;
          const match = audioEngine.findDevice(
            modulator.audioDeviceId,
            modulator.audioDeviceLabel,
          );
          if (match && match.deviceId !== modulator.audioDeviceId) {
            const mod = modulationSystem.getModulator(modulator.id);
            if (mod) {
              mod.audioDeviceId = match.deviceId;
              mod.audioDeviceLabel = match.label;
            }
          } else if (!match && modulator.audioDeviceLabel) {
            console.warn(
              `Audio input not found for modulator: ${modulator.audioDeviceLabel}`,
            );
          }
        }
      } catch (error) {
        console.warn("Could not restore live audio modulation inputs:", error);
      }
    }

    await modulationSystem.syncAudioInputs();
  }

  async loadMidiSettings(midiData) {
    if (!midiData) return;

    const midiManager = this.glowVisualizer.midiManager;
    const midiGenerator = this.glowVisualizer.midiGenerator;

    if (midiData.outputDevice) {
      const availableDevices = await midiManager.getAvailableOutputDevices();
      const deviceExists = availableDevices.find(
        (d) => d.id === midiData.outputDevice,
      );

      if (deviceExists) {
        midiManager.setOutputDevice(midiData.outputDevice);
        midiManager.initializeOutput();
      } else {
        console.warn(
          `MIDI output device not available: ${midiData.outputDevice}`,
        );
        midiManager.setOutputDevice(null);
      }
    }

    if (midiData.outputEnabled !== undefined) {
      midiManager.setOutputEnabled(!!midiData.outputEnabled);
    }

    if (midiData.octaveRange !== undefined) {
      midiManager.setOctaveRange(midiData.octaveRange);
    }

    if (midiGenerator) {
      midiGenerator.loadState({
        generators: midiData.generators || [],
        midiOutEnabled: !!midiData.generateOutputEnabled,
      });
    }
  }
}
