export type ProductId = 'esc_controller' | 'micro_gimbal' | 'arc_regulator' | 'clean_slate';

export interface MechanicalPart {
  id: string;
  name: string;
  category: 'mechanical' | 'electronic' | 'fastener' | 'substrate';
  materialName: string;
  roughness: number;
  metalness: number;
  color: string;
  wireframeColor?: string;
  explodeDirection: [number, number, number]; // [x, y, z] normalized
  explodeDistance: number;
  description: string;
  dimensionsMm: string;
  manufacturingProcess: string;
  toleranceGrade: string;
  estimatedLeadDays: number;
  unitCostUsd: number;
  flawNotice?: string;
}

export interface PCBTraceLayer {
  id: string;
  name: string;
  type: 'silkscreen' | 'copper_top' | 'fr4' | 'copper_bottom' | 'components';
  color: string;
  offsetY: number;
  description: string;
}

export interface CADProduct {
  id: ProductId;
  name: string;
  subtitle: string;
  category: string;
  voltageRating: string;
  currentRating: string;
  dimensions: string;
  weightGrams: number;
  summary: string;
  parts: MechanicalPart[];
  layers: PCBTraceLayer[];
  specs: Record<string, string>;
  bom: Array<{
    designator: string;
    description: string;
    mpn: string;
    package: string;
    supplier: string;
    leadTimeDays: number;
    unitPrice: number;
    secondSource: string;
  }>;
  knownFlaws: Array<{
    id: string;
    severity: 'critical' | 'warning' | 'advisory';
    component: string;
    rule: string;
    description: string;
    remediation: string;
    position: [number, number, number];
  }>;
}

export interface ClarifyingChoice {
  label: string;
  query: string;
}

export interface ScenarioAnnotation {
  label: string;
  xPct: number;
  yPct: number;
  note: string;
}

export interface ScenarioCardData {
  title: string;
  environmentName: string;
  description: string;
  operatingTemp: string;
  vibrationRating: string;
  ipRating: string;
  imagePrompt: string;
  visualType: 'drone_arm' | 'robotic_joint' | 'power_rack' | 'custom';
  assemblyTips: string[];
  scenarioSubtype?: 'field_installation' | 'underneath_chassis' | 'aerodynamic_wind_shear' | 'thermal_gradient';
  visualAnnotations?: ScenarioAnnotation[];
  physicsVectors?: {
    windSpeedKnots?: number;
    windDirection?: string;
    gravityVector?: string;
    thrustVector?: string;
    torqueBalance?: string;
    liftCoefficient?: string;
    dragForceN?: string;
  };
  clarifyingPrompt?: string;
}

export interface CadOperation {
  type: 'hide_part' | 'isolate_part' | 'restore_all' | 'set_xray' | 'explode_materials';
  targetPartId?: string;
  partId?: string;
  targetPartName?: string;
  explodeAmount?: number;
  progress?: number;
  xrayEnabled?: boolean;
  enabled?: boolean;
}

export interface TradeoffRisk {
  proposedAction: string;
  riskSummary: string;
  description?: string;
  consequenceExplanation?: string;
  alternativePath: string;
  alternativeRecommendation?: string;
  requiresConfirmation: boolean;
  confirmationId: string;
  partId?: string;
}

export interface VoiceCommandResult {
  action:
    | 'switch_view'
    | 'switch_product'
    | 'camera_control'
    | 'open_schematic'
    | 'show_scenario'
    | 'drc_check'
    | 'task_control'
    | 'clear_workspace'
    | 'generate_image'
    | 'cad_manipulation'
    | 'confirm_action'
    | 'general_advice';
  targetView?: 'cad' | 'schematic' | 'visualizer' | 'vision' | 'work' | 'bom' | 'drc';
  targetProductId?: ProductId;
  taskAction?: 'stop' | 'resume' | 'modify';
  cameraPreset?: 'iso' | 'top' | 'front' | 'cross' | 'underneath' | 'macro';
  rotateCamera?: boolean;
  scenarioData?: ScenarioCardData;
  imagePrompt?: string;
  cadOperation?: CadOperation;
  tradeoffRisk?: TradeoffRisk;
  spokenResponse: string;
  clarifyingChoices?: ClarifyingChoice[];
}

export interface SourcingCandidate {
  name: string;
  mpn: string;
  manufacturer: string;
  keyMetricLabel: string;
  keyMetricValue: string;
  thermalRating: string;
  unitPrice1k: number;
  leadTimeDays: number;
  supplier: string;
  status: 'recommended' | 'alternative' | 'budget';
  pros: string;
  cons: string;
}

export interface SourcingMatrixData {
  categoryTitle: string;
  engineeringStandard: string;
  tradeOffSummary: string;
  candidates: SourcingCandidate[];
}

export interface ResearchCitation {
  title: string;
  sourceOrg?: string;
  institution?: string;
  standardOrPaper?: string;
  referenceId?: string;
  urlOrDoi?: string;
  keyLawOrFormula?: string;
  keyFormula?: string;
  takeaway?: string;
  engineeringTakeaway?: string;
}

export interface ProjectFileAttachment {
  id: string;
  name: string;
  type: 'audio' | 'video' | 'document' | 'image' | 'cad' | 'link';
  sizeBytes: number;
  previewUrl?: string;
  extractedSummary?: string;
  uploadedAt: string;
}

export interface ProjectCheckpoint {
  id: string;
  timestamp: number;
  label: string;
  details: string;
  snapshot?: any;
}

export interface CloudProjectRecord {
  id: string;
  name: string;
  subtitle: string;
  category: string;
  voltageRating: string;
  currentRating: string;
  dimensions: string;
  summary: string;
  productId: ProductId;
  hiddenPartIds: string[];
  xrayMode: boolean;
  explodedProgress: number;
  tasks: BackgroundTask[];
  chatHistory: ChatMessage[];
  attachments: ProjectFileAttachment[];
  checkpoints: ProjectCheckpoint[];
  version: number;
  lastSavedAt: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  audioBase64?: string;
  timestamp: string;
  modelUsed?: string;
  clarifyingChoices?: ClarifyingChoice[];
  scenarioData?: ScenarioCardData;
  sourcingMatrix?: SourcingMatrixData;
  tradeoffRisk?: TradeoffRisk;
  researchCitations?: ResearchCitation[];
  attachedFiles?: ProjectFileAttachment[];
  attachments?: ProjectFileAttachment[];
}

export interface BackgroundTask {
  id: string;
  title: string;
  targetProduct: string;
  status: 'running' | 'paused' | 'completed' | 'cancelled';
  progress: number; // 0 to 100
  phase: string;
  telemetryLogs: string[];
  parameters: {
    ambientTempC?: number;
    continuousCurrentA?: number;
    copperOunces?: number;
    airflowVelocityMs?: number;
    thermalViaCount?: number;
    [key: string]: any;
  };
  startedAt: number;
}

export interface VisionStepGuide {
  detectedSubject: string;
  currentMachineState: string;
  isStepCompleted: boolean;
  verificationDetail: string;
  nextStepAction: string;
  targetLocationLabel: string;
  spokenAdvice: string;
  safetyNote?: string;
  audioBase64?: string;
}
