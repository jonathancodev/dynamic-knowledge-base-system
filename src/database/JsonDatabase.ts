import * as fs from 'fs/promises';
import * as path from 'path';
import { IDatabase, IDatabaseConfig } from './interfaces/IDatabase';

/**
 * File-based JSON database implementation
 * Provides persistence using JSON files
 */
export class JsonDatabase<T extends { id: string }> implements IDatabase<T> {
  private data: Map<string, T> = new Map();
  private filePath: string;
  private config: IDatabaseConfig;
  private saveTimeout: NodeJS.Timeout | null = null;
  private isLoaded = false;

  constructor(
    tableName: string,
    config: IDatabaseConfig = {
      dataDirectory: './data',
      autoSave: true,
      saveInterval: 5000
    }
  ) {
    this.config = config;
    this.filePath = path.join(config.dataDirectory, `${tableName}.json`);
    this.ensureDataDirectory();
  }

  private async ensureDataDirectory(): Promise<void> {
    try {
      await fs.access(this.config.dataDirectory);
    } catch {
      await fs.mkdir(this.config.dataDirectory, { recursive: true });
    }
  }

  private async loadData(): Promise<void> {
    if (this.isLoaded) return;

    try {
      const fileContent = await fs.readFile(this.filePath, 'utf-8');
      const jsonData = JSON.parse(fileContent) as T[];
      this.data.clear();
      
      for (const item of jsonData) {
        this.data.set(item.id, item);
      }
    } catch (error) {
      // File doesn't exist or is invalid, start with empty data
      this.data.clear();
    }

    this.isLoaded = true;
  }

  private async saveData(): Promise<void> {
    const dataArray = Array.from(this.data.values());
    const jsonData = JSON.stringify(dataArray, null, 2);
    await fs.writeFile(this.filePath, jsonData, 'utf-8');
  }

  private scheduleSave(): void {
    if (!this.config.autoSave) return;

    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    this.saveTimeout = setTimeout(() => {
      void this.saveData();
    }, this.config.saveInterval || 5000);
  }

  public async create(data: T): Promise<T> {
    await this.loadData();
    
    if (this.data.has(data.id)) {
      throw new Error(`Record with ID ${data.id} already exists`);
    }

    this.data.set(data.id, data);
    this.scheduleSave();
    return data;
  }

  public async findById(id: string): Promise<T | null> {
    await this.loadData();
    return this.data.get(id) || null;
  }

  public async find(criteria?: Partial<T>): Promise<T[]> {
    await this.loadData();
    
    if (!criteria) {
      return Array.from(this.data.values());
    }

    return Array.from(this.data.values()).filter(item => {
      return Object.entries(criteria).every(([key, value]) => {
        const itemValue = (item as Record<string, unknown>)[key];
        return itemValue === value;
      });
    });
  }

  public async update(id: string, updateData: Partial<T>): Promise<T | null> {
    await this.loadData();
    
    const existing = this.data.get(id);
    if (!existing) {
      return null;
    }

    const updated = { ...existing, ...updateData, id } as T;
    this.data.set(id, updated);
    this.scheduleSave();
    return updated;
  }

  public async delete(id: string): Promise<boolean> {
    await this.loadData();
    
    const existed = this.data.has(id);
    this.data.delete(id);
    
    if (existed) {
      this.scheduleSave();
    }
    
    return existed;
  }

  public async exists(id: string): Promise<boolean> {
    await this.loadData();
    return this.data.has(id);
  }

  public async count(criteria?: Partial<T>): Promise<number> {
    const results = await this.find(criteria);
    return results.length;
  }

  public async clear(): Promise<void> {
    this.data.clear();
    await this.saveData();
  }

  // Additional utility methods
  public async findMany(ids: string[]): Promise<T[]> {
    await this.loadData();
    return ids.map(id => this.data.get(id)).filter(Boolean) as T[];
  }

  public async findByField<K extends keyof T>(
    field: K,
    value: T[K]
  ): Promise<T[]> {
    await this.loadData();
    return Array.from(this.data.values()).filter(item => item[field] === value);
  }

  public async upsert(data: T): Promise<T> {
    await this.loadData();
    this.data.set(data.id, data);
    this.scheduleSave();
    return data;
  }

  public async bulkCreate(items: T[]): Promise<T[]> {
    await this.loadData();
    
    for (const item of items) {
      if (this.data.has(item.id)) {
        throw new Error(`Record with ID ${item.id} already exists`);
      }
      this.data.set(item.id, item);
    }
    
    this.scheduleSave();
    return items;
  }

  public async bulkUpdate(updates: Array<{ id: string; data: Partial<T> }>): Promise<T[]> {
    await this.loadData();
    const results: T[] = [];
    
    for (const { id, data: updateData } of updates) {
      const existing = this.data.get(id);
      if (existing) {
        const updated = { ...existing, ...updateData, id } as T;
        this.data.set(id, updated);
        results.push(updated);
      }
    }
    
    this.scheduleSave();
    return results;
  }

  public async backup(): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `${this.filePath}.backup.${timestamp}`;
    
    try {
      await fs.copyFile(this.filePath, backupPath);
      return backupPath;
    } catch (error) {
      throw new Error(`Failed to create backup: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public async restore(backupPath: string): Promise<void> {
    try {
      await fs.copyFile(backupPath, this.filePath);
      this.isLoaded = false; // Force reload on next operation
    } catch (error) {
      throw new Error(`Failed to restore from backup: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Force immediate save
  public async forceSave(): Promise<void> {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }
    await this.saveData();
  }

  // Cleanup method
  public async close(): Promise<void> {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }
    await this.saveData();
  }
}
