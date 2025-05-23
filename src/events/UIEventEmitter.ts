import { Modal } from 'obsidian';
import { EventEmitter } from './EventEmitter';
import { UIEvents } from './EventTypes';

/**
 * Event emitter for UI-related events.
 * Provides typed methods for emitting standard UI events.
 */
export class UIEventEmitter extends EventEmitter<UIEvents> {
  private static instance: UIEventEmitter;
  
  /**
   * Private constructor to enforce singleton pattern.
   */
  private constructor() {
    super();
  }
  
  /**
   * Get the singleton instance of the UI event emitter.
   * @returns The UIEventEmitter instance
   */
  public static getInstance(): UIEventEmitter {
    if (!UIEventEmitter.instance) {
      UIEventEmitter.instance = new UIEventEmitter();
    }
    return UIEventEmitter.instance;
  }
  
  /**
   * Emit event when a modal is opened.
   * @param modalType The type of modal being opened
   * @param modal The modal instance
   */
  notifyModalOpened(modalType: string, modal: Modal): void {
    this.emit('ui:modalOpened', { modalType, modal });
  }
  
  /**
   * Emit event when a modal is closed.
   * @param modalType The type of modal that was closed
   */
  notifyModalClosed(modalType: string): void {
    this.emit('ui:modalClosed', { modalType });
  }
  
  /**
   * Emit event when the current view changes.
   * @param view The new view
   * @param previousView The previous view
   */
  notifyViewChanged(view: string, previousView: string): void {
    this.emit('ui:viewChanged', { view, previousView });
  }
  
  /**
   * Emit event when content visibility is toggled.
   * @param contentId The ID of the content
   * @param isExpanded Whether the content is expanded or collapsed
   */
  notifyContentToggled(contentId: string, isExpanded: boolean): void {
    this.emit('ui:contentToggled', { contentId, isExpanded });
  }
} 