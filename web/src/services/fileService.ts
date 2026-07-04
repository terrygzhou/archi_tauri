import { ARCHI_FILE_EXTENSION, STORAGE_KEYS } from '../utils/constants';
import { open, save } from '@tauri-apps/plugin-dialog';
import { readTextFile, writeTextFile, stat } from '@tauri-apps/plugin-fs';

// ============================================================================
// File service — Tauri IPC bridge for file operations
// ============================================================================

export interface OpenFileResult {
  path: string;
  content: string;
  size: number;
  lastModified: string;
}

export interface SaveFileResult {
  path: string;
  size: number;
}

export interface DialogOptions {
  title?: string;
  filters?: FilterOption[];
  defaultPath?: string;
  directory?: boolean;
}

export interface FilterOption {
  name: string;
  extensions: string[];
}

export class FileService {
  /**
   * Open file dialog
   */
  async openFile(options?: DialogOptions): Promise<OpenFileResult | null> {
    try {
      const filePath = await open({
        filters: options?.filters ?? [
          {
            name: 'ArchiMate Models',
            extensions: ['archi'],
          },
        ],
        multiple: false,
        title: options?.title ?? 'Open ArchiMate Model',
        directory: options?.directory ?? false,
      });

      if (!filePath) return null;

      const content = await readTextFile(filePath as string);
      const statResult = await stat(filePath as string);

      return {
        path: filePath as string,
        content,
        size: (statResult as { size: number }).size,
        lastModified: new Date().toISOString(),
      };
    } catch (error) {
      console.error('[FileService] Failed to open file:', error);
      return null;
    }
  }

  /**
   * Save file dialog
   */
  async saveFile(content: string, options?: DialogOptions): Promise<SaveFileResult | null> {
    try {
      const filePath = await save({
        filters: options?.filters ?? [
          {
            name: 'ArchiMate Models',
            extensions: ['archi'],
          },
        ],
        title: options?.title ?? 'Save Model',
        defaultPath: options?.defaultPath ?? 'model.archi',
      });

      if (!filePath) return null;

      await writeTextFile(filePath as string, content);

      return {
        path: filePath as string,
        size: content.length,
      };
    } catch (error) {
      console.error('[FileService] Failed to save file:', error);
      return null;
    }
  }

  /**
   * Save to existing path (no dialog)
   */
  async saveToPath(path: string, content: string): Promise<void> {
    await writeTextFile(path, content);
  }

  /**
   * Read file contents
   */
  async readFile(path: string): Promise<string> {
    return await readTextFile(path);
  }

  /**
   * Check if file exists
   */
  async exists(path: string): Promise<boolean> {
    try {
      await stat(path);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get file path suffix
   */
  static getExtension(path: string): string {
    return path.split('.').pop()?.toLowerCase() ?? '';
  }

  /**
   * Check if path is a .archi file
   */
  static isArchiFile(path: string): boolean {
    return this.getExtension(path) === 'archi';
  }

  /**
   * Ensure .archi extension
   */
  static ensureArchiExtension(name: string): string {
    if (name.toLowerCase().endsWith(ARCHI_FILE_EXTENSION)) {
      return name;
    }
    return name + ARCHI_FILE_EXTENSION;
  }
}

// ============================================================================
// Singleton instance
// ============================================================================
export const fileService = new FileService();
