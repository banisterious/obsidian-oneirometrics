import { sanitizeHTMLToDom } from 'obsidian';

/**
 * Safe DOM Manipulation Utilities
 * 
 * This module provides secure alternatives to innerHTML/outerHTML usage
 * for Obsidian Community Plugin compliance.
 * 
 * Created as part of Issue 1: innerHTML/outerHTML Security Risk remediation
 */

export class SafeDOMUtils {
    
    /**
     * Safely empty a container without using innerHTML = ''
     * Uses Obsidian's built-in empty() method
     * 
     * @param container - The container element to empty
     */
    static safelyEmptyContainer(container: HTMLElement): void {
        container.empty();
    }
    
    /**
     * Safely check if a container is empty
     * 
     * @param container - The container element to check
     * @returns true if the container has no child elements
     */
    static isContainerEmpty(container: HTMLElement): boolean {
        return container.children.length === 0;
    }
    
    /**
     * Safely check if a container has content
     * 
     * @param container - The container element to check
     * @returns true if the container has child nodes
     */
    static hasContent(container: HTMLElement): boolean {
        return container.hasChildNodes();
    }
    
    /**
     * Safely set text content with optional HTML escaping
     * 
     * @param element - The element to set content on
     * @param text - The text content to set
     * @param escapeHtml - Whether to escape HTML entities (default: true)
     */
    static safelySetText(element: HTMLElement, text: string, escapeHtml: boolean = true): void {
        const content = escapeHtml ? this.escapeHtml(text) : text;
        element.textContent = content;
    }
    
    /**
     * Escape HTML entities to prevent XSS
     * 
     * @param text - The text to escape
     * @returns Escaped text safe for display
     */
    static escapeHtml(text: string): string {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    /**
     * Create a simple labeled element structure
     * 
     * @param parent - Parent element to append to
     * @param tagName - HTML tag name for the container
     * @param labelText - Text for the label
     * @param contentText - Text for the content
     * @param options - Additional options
     * @returns The created container element
     */
    static createLabeledElement(
        parent: HTMLElement, 
        tagName: keyof HTMLElementTagNameMap, 
        labelText: string, 
        contentText?: string,
        options: {
            containerClass?: string;
            labelClass?: string;
            contentClass?: string;
            labelTag?: keyof HTMLElementTagNameMap;
        } = {}
    ): HTMLElement {
        const container = parent.createEl(tagName, {
            cls: options.containerClass
        });
        
        const label = container.createEl(options.labelTag || 'strong', {
            cls: options.labelClass,
            text: labelText
        });
        
        if (contentText) {
            if (options.labelTag) {
                container.appendText(' ' + contentText);
            } else {
                const content = container.createEl('span', {
                    cls: options.contentClass,
                    text: contentText
                });
            }
        }
        
        return container;
    }
    
    /**
     * Create a list structure safely
     * 
     * @param parent - Parent element to append to
     * @param title - Optional title for the list
     * @param items - Array of items to add to the list
     * @param options - Additional options
     * @returns The created list element
     */
    static createSafeList(
        parent: HTMLElement,
        title?: string,
        items: string[] = [],
        options: {
            listType?: 'ul' | 'ol';
            titleTag?: keyof HTMLElementTagNameMap;
            titleClass?: string;
            listClass?: string;
            itemClass?: string;
        } = {}
    ): HTMLElement {
        const container = parent.createDiv();
        
        if (title) {
            container.createEl(options.titleTag || 'h3', {
                cls: options.titleClass,
                text: title
            });
        }
        
        const list = container.createEl(options.listType || 'ul', {
            cls: options.listClass
        });
        
        items.forEach(itemText => {
            list.createEl('li', {
                cls: options.itemClass,
                text: itemText
            });
        });
        
        return list;
    }
    
    /**
     * Create nested list structure (for complex HTML templates)
     * 
     * @param parent - Parent element to append to
     * @param structure - Nested structure definition
     * @returns The created container element
     */
    static createNestedList(
        parent: HTMLElement,
        structure: {
            title?: string;
            items: Array<{
                text: string;
                subitems?: string[];
                code?: boolean;
            }>;
        }
    ): HTMLElement {
        const container = parent.createDiv();
        
        if (structure.title) {
            const titleEl = container.createEl('p');
            titleEl.createEl('strong', { text: structure.title });
        }
        
        const mainList = container.createEl('ul');
        
        structure.items.forEach(item => {
            const listItem = mainList.createEl('li');
            
            if (item.code) {
                listItem.createEl('code', { text: item.text });
            } else {
                listItem.appendText(item.text);
            }
            
            if (item.subitems && item.subitems.length > 0) {
                const subList = listItem.createEl('ul');
                item.subitems.forEach(subitem => {
                    subList.createEl('li', { text: subitem });
                });
            }
        });
        
        return container;
    }
    
    /**
     * Create icon and text combination safely
     * 
     * @param parent - Parent element to append to
     * @param iconText - Text for the icon (emoji or symbol)
     * @param text - Text content
     * @param options - Additional options
     * @returns The created container element
     */
    static createIconText(
        parent: HTMLElement,
        iconText: string,
        text: string,
        options: {
            containerClass?: string;
            iconClass?: string;
            textClass?: string;
        } = {}
    ): HTMLElement {
        const container = parent.createEl('span', {
            cls: options.containerClass
        });
        
        container.createEl('span', {
            cls: options.iconClass,
            text: iconText
        });
        
        container.createEl('span', {
            cls: options.textClass,
            text: text
        });
        
        return container;
    }
    
    /**
     * Replace container content safely without innerHTML
     * 
     * @param container - Container to replace content in
     * @param newContent - New content to add (HTMLElement or array of HTMLElements)
     */
    static safelyReplaceContent(
        container: HTMLElement, 
        newContent: HTMLElement | HTMLElement[]
    ): void {
        this.safelyEmptyContainer(container);
        
        if (Array.isArray(newContent)) {
            newContent.forEach(element => container.appendChild(element));
        } else {
            container.appendChild(newContent);
        }
    }
    
    /**
     * Create and return DOM element structure without innerHTML
     * 
     * @param tagName - HTML tag name
     * @param options - Element options
     * @returns Created element
     */
    static createElement(
        tagName: keyof HTMLElementTagNameMap,
        options: {
            className?: string;
            text?: string;
            attributes?: Record<string, string>;
            children?: HTMLElement[];
        } = {}
    ): HTMLElement {
        const element = document.createElement(tagName);
        
        if (options.className) {
            element.className = options.className;
        }
        
        if (options.text) {
            element.textContent = options.text;
        }
        
        if (options.attributes) {
            Object.entries(options.attributes).forEach(([key, value]) => {
                element.setAttribute(key, value);
            });
        }
        
        if (options.children) {
            options.children.forEach(child => element.appendChild(child));
        }
        
        return element;
    }
    
    /**
     * Safe alternative to element.outerHTML for debugging
     * 
     * @param element - Element to serialize
     * @param maxLength - Maximum length for output (default: 300)
     * @returns Serialized element string
     */
    static safeSerializeElement(element: HTMLElement, maxLength: number = 300): string {
        try {
            const serializer = new XMLSerializer();
            const serialized = serializer.serializeToString(element);
            return serialized.length > maxLength 
                ? serialized.substring(0, maxLength) + '...'
                : serialized;
        } catch (error) {
            return `[Element serialization failed: ${element.tagName}]`;
        }
    }
    
    /**
     * Debug helper - get element info without innerHTML access
     * 
     * @param element - Element to inspect
     * @returns Debug information object
     */
    static getElementDebugInfo(element: HTMLElement): {
        tagName: string;
        className: string;
        childCount: number;
        textContent: string;
        hasContent: boolean;
    } {
        return {
            tagName: element.tagName,
            className: element.className,
            childCount: element.children.length,
            textContent: element.textContent?.substring(0, 100) || '',
            hasContent: element.hasChildNodes()
        };
    }
}

/**
 * Legacy helper function for backward compatibility
 * Will be removed after innerHTML fixes are complete
 */
export function safelyEmptyContainer(container: HTMLElement): void {
    SafeDOMUtils.safelyEmptyContainer(container);
}

/**
 * Export individual functions for convenience
 */
export const {
    safelyEmptyContainer: emptySafely,
    isContainerEmpty,
    hasContent,
    safelySetText,
    escapeHtml,
    createLabeledElement,
    createSafeList,
    createNestedList,
    createIconText,
    safelyReplaceContent,
    createElement,
    safeSerializeElement,
    getElementDebugInfo
} = SafeDOMUtils;