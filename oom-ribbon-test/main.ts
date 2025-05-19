import { Plugin, PluginSettingTab, Setting, Notice, App } from "obsidian";

interface RibbonTestSettings {
  showButton: boolean;
  showButton2: boolean;
}

const DEFAULT_SETTINGS: RibbonTestSettings = {
  showButton: true,
  showButton2: true,
};

export default class RibbonTestPlugin extends Plugin {
  settings!: RibbonTestSettings;

  async onload() {
    await this.loadSettings();
    this.addSettingTab(new RibbonTestSettingTab(this.app, this));
    this.updateRibbon();
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
    this.updateRibbon();
  }

  updateRibbon() {
    // Remove all test buttons
    document.querySelectorAll('.oom-ribbon-test-btn').forEach(btn => btn.remove());
    document.querySelectorAll('.oom-ribbon-test-btn2').forEach(btn => btn.remove());
    if (this.settings.showButton) {
      const btn = this.addRibbonIcon('wand', 'Test Ribbon Button', () => {
        new Notice('Test button clicked!');
      });
      btn.addClass('oom-ribbon-test-btn');
    }
    if (this.settings.showButton2) {
      const btn2 = this.addRibbonIcon('shell', 'Test Ribbon Button 2', () => {
        new Notice('Test button 2 clicked!');
      });
      btn2.addClass('oom-ribbon-test-btn2');
    }
  }
}

class RibbonTestSettingTab extends PluginSettingTab {
  plugin: RibbonTestPlugin;
  constructor(app: App, plugin: RibbonTestPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    new Setting(containerEl)
      .setName("Show Ribbon Button")
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.showButton)
        .onChange(async (value) => {
          this.plugin.settings.showButton = value;
          await this.plugin.saveSettings();
        }));
    new Setting(containerEl)
      .setName("Show Ribbon Button 2")
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.showButton2)
        .onChange(async (value) => {
          this.plugin.settings.showButton2 = value;
          await this.plugin.saveSettings();
        }));
  }
} 