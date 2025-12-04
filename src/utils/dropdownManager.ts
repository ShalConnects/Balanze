// Global dropdown manager to ensure only one dropdown is open at a time

type DropdownId = string;

class DropdownManager {
  private openDropdownId: DropdownId | null = null;
  private listeners: Map<DropdownId, () => void> = new Map();

  /**
   * Register a dropdown and request to open it
   * If another dropdown is open, it will be closed first
   */
  requestOpen(dropdownId: DropdownId, onClose: () => void): void {
    // Close any currently open dropdown
    if (this.openDropdownId && this.openDropdownId !== dropdownId) {
      const closeHandler = this.listeners.get(this.openDropdownId);
      if (closeHandler) {
        closeHandler();
      }
    }

    // Register this dropdown as open
    this.openDropdownId = dropdownId;
    this.listeners.set(dropdownId, onClose);
  }

  /**
   * Unregister a dropdown when it closes
   */
  unregister(dropdownId: DropdownId): void {
    if (this.openDropdownId === dropdownId) {
      this.openDropdownId = null;
    }
    this.listeners.delete(dropdownId);
  }

  /**
   * Check if a specific dropdown is currently open
   */
  isOpen(dropdownId: DropdownId): boolean {
    return this.openDropdownId === dropdownId;
  }

  /**
   * Check if any dropdown is currently open
   */
  hasOpenDropdown(): boolean {
    return this.openDropdownId !== null;
  }
}

// Export singleton instance
export const dropdownManager = new DropdownManager();

