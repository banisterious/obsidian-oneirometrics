import { Command, Hotkey, Modifier, Plugin } from 'obsidian';
import { IPluginAPI } from './IPluginAPI';

/**
 * Interface defining a plugin command
 */
export interface PluginCommand {
    /**
     * Unique command ID
     */
    id: string;
    
    /**
     * Human-readable name
     */
    name: string;
    
    /**
     * Optional hotkeys (default is none)
     */
    hotkeys?: Hotkey[];
    
    /**
     * Optional icon (default is none)
     */
    icon?: string;
    
    /**
     * Optional checkCallback for checking when the command should be enabled
     */
    checkCallback?: (checking: boolean) => boolean | void;
    
    /**
     * Command callback
     */
    callback?: () => void;
    
    /**
     * Editor callback for commands that work with the editor
     */
    editorCallback?: (editor: any, view: any) => void;
}

/**
 * Command registry for centralized management of plugin commands
 */
export class CommandRegistry {
    /**
     * Internal map of command IDs to command definitions
     */
    private commands: Map<string, PluginCommand> = new Map();
    
    /**
     * Creates a new command registry
     * @param plugin The Obsidian plugin instance to register commands with
     * @param api The plugin API for accessing plugin functionality
     */
    constructor(
        private plugin: Plugin,
        private api: IPluginAPI
    ) {}
    
    /**
     * Register a command
     * @param command The command definition to register
     */
    register(command: PluginCommand): void {
        // Store the command in our registry
        this.commands.set(command.id, command);
        
        // Register the command with Obsidian
        this.plugin.addCommand({
            id: command.id,
            name: command.name,
            hotkeys: command.hotkeys || [],
            icon: command.icon,
            checkCallback: command.checkCallback,
            callback: command.callback,
            editorCallback: command.editorCallback
        });
        
        // Log command registration
        this.api.getLogger().debug('CommandRegistry', `Registered command: ${command.id}`);
    }
    
    /**
     * Register multiple commands at once
     * @param commands Array of command definitions to register
     */
    registerAll(commands: PluginCommand[]): void {
        for (const command of commands) {
            this.register(command);
        }
    }
    
    /**
     * Get a command by ID
     * @param id The command ID
     * @returns The command definition or undefined if not found
     */
    getCommand(id: string): PluginCommand | undefined {
        return this.commands.get(id);
    }
    
    /**
     * Get all registered commands
     * @returns Array of all registered command definitions
     */
    getAllCommands(): PluginCommand[] {
        return Array.from(this.commands.values());
    }
    
    /**
     * Execute a command by ID
     * @param id The command ID
     * @returns True if the command was executed, false otherwise
     */
    executeCommand(id: string): boolean {
        const command = this.commands.get(id);
        if (command && command.callback) {
            command.callback();
            return true;
        }
        return false;
    }
    
    /**
     * Helper method to create a hotkey from a string like "Mod+Shift+P"
     * @param hotkeyString String representation of hotkey (e.g., "Mod+Shift+P")
     * @returns Hotkey object for Obsidian API
     */
    static createHotkey(hotkeyString: string): Hotkey {
        const parts = hotkeyString.split('+');
        const key = parts.pop() || '';
        const modifiers = parts.filter(mod => 
            ['Mod', 'Ctrl', 'Meta', 'Shift', 'Alt'].includes(mod)
        ) as Modifier[];
        
        return {
            modifiers,
            key
        };
    }
} 