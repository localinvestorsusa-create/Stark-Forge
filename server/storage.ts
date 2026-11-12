import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { CloudProjectRecord, ProjectCheckpoint, ProjectFileAttachment } from '../src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '..', 'data');
const DB_FILE = path.resolve(DATA_DIR, 'stark_projects_db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (err) {
    console.error('Failed to create data directory:', err);
  }
}

// In-memory cache + persistent disk synchronization
let projectsCache: Map<string, CloudProjectRecord> = new Map();

function loadFromDisk() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const data = JSON.parse(raw);
      projectsCache = new Map(Object.entries(data));
      console.log(`[ZERO DATA LOSS] Loaded ${projectsCache.size} persistent project(s) from ${DB_FILE}`);
    } else {
      // Initialize with default Project #1
      const initialProject: CloudProjectRecord = {
        id: 'proj_esc_apex40',
        name: 'Apex ESC 40A Motor Controller',
        subtitle: '6S LiPo · 32-Bit ARM Cortex-M4 · BLHeli_32 Architecture',
        category: 'Power Electronics & Drone Avionics',
        voltageRating: '11.1V - 25.2V (3S-6S LiPo)',
        currentRating: '40A Continuous / 55A Burst (10s)',
        dimensions: '38.0mm × 22.5mm × 6.8mm',
        summary:
          'Compact high-density 3-phase BLDC motor speed controller for racing and industrial quadcopters with integrated current sensing and active freewheeling.',
        productId: 'esc_controller',
        hiddenPartIds: [],
        xrayMode: false,
        explodedProgress: 0,
        tasks: [],
        chatHistory: [],
        attachments: [],
        checkpoints: [
          {
            id: 'chk_init',
            timestamp: Date.now() - 3600000,
            label: 'Initial Architecture Baseline',
            details: 'Provisioned 4-layer FR4 substrate with 6061-T6 aluminum heatsink and BSC010N04LS6 MOSFETs.',
          },
        ],
        version: 1,
        lastSavedAt: Date.now(),
      };
      projectsCache.set(initialProject.id, initialProject);
      saveToDisk();
    }
  } catch (err) {
    console.warn('[ZERO DATA LOSS] Error reading database file, initializing empty cache:', err);
  }
}

function saveToDisk() {
  try {
    const obj = Object.fromEntries(projectsCache.entries());
    fs.writeFileSync(DB_FILE, JSON.stringify(obj, null, 2), 'utf-8');
  } catch (err) {
    console.error('[ZERO DATA LOSS] Failed to persist projects to disk:', err);
  }
}

// Initial load
loadFromDisk();

export const ProjectStore = {
  getAll(): CloudProjectRecord[] {
    return Array.from(projectsCache.values()).sort((a, b) => b.lastSavedAt - a.lastSavedAt);
  },

  getById(id: string): CloudProjectRecord | null {
    return projectsCache.get(id) || null;
  },

  save(project: CloudProjectRecord): CloudProjectRecord {
    const existing = projectsCache.get(project.id) || ({} as Partial<CloudProjectRecord>);
    const updated: CloudProjectRecord = {
      ...existing,
      ...project,
      // Merge checkpoints and attachments safely so partial auto-saves don't erase history
      checkpoints:
        project.checkpoints && project.checkpoints.length > 0
          ? project.checkpoints
          : existing.checkpoints && existing.checkpoints.length > 0
          ? existing.checkpoints
          : [
              {
                id: `chk_${Date.now()}`,
                timestamp: Date.now(),
                label: 'Project Milestone',
                details: 'Auto-saved project state',
              },
            ],
      attachments:
        project.attachments && project.attachments.length > 0
          ? project.attachments
          : existing.attachments || [],
      version: (existing.version || 0) + 1,
      lastSavedAt: Date.now(),
    };

    projectsCache.set(project.id, updated);
    saveToDisk();
    return updated;
  },

  addCheckpoint(projectId: string, label: string, details: string): ProjectCheckpoint | null {
    const proj = projectsCache.get(projectId);
    if (!proj) return null;

    const checkpoint: ProjectCheckpoint = {
      id: `chk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      label: label.trim(),
      details: details.trim(),
    };

    proj.checkpoints.unshift(checkpoint);
    proj.lastSavedAt = Date.now();
    saveToDisk();
    return checkpoint;
  },

  addAttachment(projectId: string, attachment: ProjectFileAttachment): boolean {
    const proj = projectsCache.get(projectId);
    if (!proj) return false;

    proj.attachments.unshift(attachment);
    proj.lastSavedAt = Date.now();
    saveToDisk();
    return true;
  },

  create(newProjectData: Partial<CloudProjectRecord>): CloudProjectRecord {
    const id = `proj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newProj: CloudProjectRecord = {
      id,
      name: newProjectData.name || 'Untitled Custom Hardware Build',
      subtitle: newProjectData.subtitle || 'Custom Architecture Prototyping',
      category: newProjectData.category || 'Power Electronics & Robotics',
      voltageRating: newProjectData.voltageRating || 'Configurable (0V - 100V)',
      currentRating: newProjectData.currentRating || 'Configurable (0A - 200A)',
      dimensions: newProjectData.dimensions || '50.0mm × 35.0mm × 12.0mm',
      summary: newProjectData.summary || 'Prototyping architecture initialized on Stark Forge optical breadboard.',
      productId: newProjectData.productId || 'clean_slate',
      hiddenPartIds: newProjectData.hiddenPartIds || [],
      xrayMode: newProjectData.xrayMode || false,
      explodedProgress: 0,
      tasks: [],
      chatHistory: [],
      attachments: [],
      checkpoints: [
        {
          id: `chk_${Date.now()}`,
          timestamp: Date.now(),
          label: 'Project Created',
          details: `Initialized with ${newProjectData.name}`,
        },
      ],
      version: 1,
      lastSavedAt: Date.now(),
    };

    projectsCache.set(id, newProj);
    saveToDisk();
    return newProj;
  },

  delete(id: string): boolean {
    const deleted = projectsCache.delete(id);
    if (deleted) saveToDisk();
    return deleted;
  },
};
