# OneiroMetrics Narrative Weaving - Implementation Plan

## Table of Contents

- [Executive Summary](#executive-summary)
- [Implementation Phases & Timeline](#implementation-phases--timeline)
  - [Phase 1: Foundation & Core Integration (Weeks 1-4)](#phase-1-foundation--core-integration-weeks-1-4)
  - [Phase 2: Advanced Features & Parameters (Weeks 5-8)](#phase-2-advanced-features--parameters-weeks-5-8)
  - [Phase 3: Templates & Optimization (Weeks 9-12)](#phase-3-templates--optimization-weeks-9-12)
- [Technical Architecture](#technical-architecture)
  - [Service Integration Pattern](#service-integration-pattern)
  - [Data Flow Architecture](#data-flow-architecture)
  - [UI Component Architecture](#ui-component-architecture)
- [Dependencies & Prerequisites](#dependencies--prerequisites)
  - [Core Dependencies](#core-dependencies)
  - [Data Requirements](#data-requirements)
  - [User Environment](#user-environment)
- [Risk Assessment & Mitigation](#risk-assessment--mitigation)
  - [Technical Risks](#technical-risks)
  - [User Experience Risks](#user-experience-risks)
  - [Data Security Considerations](#data-security-considerations)
- [Testing Strategy](#testing-strategy)
  - [Unit Testing](#unit-testing)
  - [Integration Testing](#integration-testing)
  - [User Acceptance Testing](#user-acceptance-testing)
  - [Performance Testing](#performance-testing)
- [Success Metrics](#success-metrics)
  - [Technical Metrics](#technical-metrics)
  - [User Experience Metrics](#user-experience-metrics)
  - [Privacy & Performance Metrics](#privacy--performance-metrics)
- [Resource Requirements](#resource-requirements)
  - [Development Resources](#development-resources)
  - [Infrastructure Needs](#infrastructure-needs)
  - [Documentation Requirements](#documentation-requirements)
- [Future Enhancement Roadmap](#future-enhancement-roadmap)
  - [Phase 4: Advanced AI Features (Future)](#phase-4-advanced-ai-features-future)
  - [Phase 5: Community Features (Future)](#phase-5-community-features-future)
  - [Phase 6: Advanced Integrations (Future)](#phase-6-advanced-integrations-future)
- [Conclusion](#conclusion)

## Executive Summary

The Narrative Weaving feature transforms raw dream data into cohesive narratives using Large Language Models (LLMs). This implementation plan breaks down the feature into manageable phases, leverages existing OneiroMetrics architecture patterns, and prioritizes user privacy through local-first LLM support.

**Key Objectives:**
- Enable users to generate meaningful narratives from dream collections
- Maintain data privacy through local LLM preference
- Integrate seamlessly with existing metrics and UI patterns
- Provide flexible narrative customization options

## Implementation Phases & Timeline

### Phase 1: Foundation & Core Integration (Weeks 1-4)
**Goal:** Establish basic LLM integration and simple narrative generation

#### Week 1-2: LLM Service Architecture
- **LLMService**: Create service following existing service patterns from architecture
- **Local LLM Detection**: Implement Ollama/local server detection
- **API Key Management**: Secure storage in plugin settings
- **Basic Prompt Engine**: Simple template-based prompt generation

#### Week 3-4: Basic UI Implementation
- **Narrative Weaving Modal**: Follow HubModal patterns for consistency
- **Dream Selection Interface**: Leverage existing autocomplete patterns
- **Simple Output Generation**: Stream to new Obsidian note
- **Basic Error Handling**: Integration with existing LoggingService

**Deliverable:** Basic "Weave All Dreams" functionality with local LLM support

### Phase 2: Advanced Features & Parameters (Weeks 5-8)
**Goal:** Add narrative flow options and customization parameters

#### Week 5-6: Narrative Flow Implementation
- **Flow Algorithms**: Implement Thematic, Character Arc, Setting-Based, Emotional Arc
- **Dream Data Integration**: Leverage existing DreamMetricData structure
- **Content Processing**: Build on existing parsing infrastructure

#### Week 7-8: Parameter Controls & UI Enhancement
- **Parameter Interface**: Collapsible settings panel
- **Contradiction Handling**: Logic for managing conflicting data
- **Tone & Style Controls**: Text input with validation
- **Preview System**: Real-time parameter preview

**Deliverable:** Full parameter control with multiple narrative flow options

### Phase 3: Templates & Optimization (Weeks 9-12)
**Goal:** Add template system and performance optimizations

#### Week 9-10: Recipe/Template System
- **Template Storage**: Integration with existing state management
- **Recipe CRUD**: Save, load, delete custom parameters
- **Template Sharing**: Export/import recipe functionality

#### Week 11-12: Performance & Polish
- **Token Optimization**: Efficient dream data preprocessing
- **Streaming Improvements**: Enhanced real-time output
- **Error Recovery**: Robust error handling and retry logic
- **Documentation**: User guides and developer docs

**Deliverable:** Production-ready feature with template system

## Technical Architecture

### Service Integration Pattern
```typescript
// Follows existing OneiroMetrics service architecture
interface LLMService extends IService {
  generateNarrative(dreams: DreamMetricData[], params: NarrativeParams): Promise<string>;
  detectLocalLLM(): Promise<boolean>;
  validateAPIKey(key: string): Promise<boolean>;
}

// Integration with existing StateManager
interface NarrativeSettings {
  preferLocalLLM: boolean;
  apiKey?: string;
  defaultFlow: NarrativeFlow;
  savedRecipes: NarrativeRecipe[];
}
```

### Data Flow Architecture
```
DreamMetricData[] (existing)
          ↓
   NarrativeProcessor
          ↓
    LLM Prompt Engine
          ↓
     LLM Service
    (Local/API)
          ↓
  Streaming Response
          ↓
   Obsidian Note
```

### UI Component Architecture
- **NarrativeWeavingModal**: Extends existing modal patterns
- **DreamSelectionPanel**: Reuses autocomplete components
- **ParameterControlsPanel**: Follows existing settings patterns
- **OutputStreamingPanel**: New component for real-time display

## Dependencies & Prerequisites

### Core Dependencies
- **Existing Systems**: DreamMetricData structure, modal system, state management
- **New Dependencies**: LLM client libraries (Ollama client, OpenAI/Claude SDKs)
- **Platform Requirements**: Node.js streams for output streaming

### Data Requirements
- **Minimum Dream Data**: At least 2-3 dream entries for meaningful narrative
- **Metric Dependencies**: Leverages existing metrics, especially character/theme data
- **Content Quality**: Works with existing dream content parsing

### User Environment
- **Local LLM**: Optional Ollama or similar local server
- **API Access**: Optional OpenAI/Claude API keys
- **Storage**: Additional settings and template storage needs

## Risk Assessment & Mitigation

### Technical Risks
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| LLM Response Quality | Medium | High | Multiple prompt templates, user re-roll option |
| API Cost Concerns | High | Medium | Clear cost warnings, local LLM preference |
| Performance Issues | Medium | Medium | Token optimization, streaming responses |
| Integration Complexity | Low | High | Leverage existing architecture patterns |

### User Experience Risks
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Privacy Concerns | High | High | Local-first approach, clear data warnings |
| Overwhelming Options | Medium | Medium | Progressive disclosure, sensible defaults |
| Poor Narrative Quality | Medium | High | Multiple flow options, user customization |
| Technical Barriers | Medium | Medium | Simple setup, clear error messages |

### Data Security Considerations
- **API Key Storage**: Use Obsidian's secure storage mechanisms
- **Data Transmission**: Clear warnings about cloud API usage
- **Local Processing**: Prioritize local LLM detection and usage
- **Content Privacy**: Option to anonymize personal details in prompts

## Testing Strategy

### Unit Testing
- **LLM Service**: Mock LLM responses for consistent testing
- **Prompt Generation**: Validate prompt templates with sample data
- **Data Processing**: Test dream data preprocessing and optimization

### Integration Testing  
- **Modal Integration**: Test within existing OneiroMetrics UI framework
- **State Management**: Verify settings persistence and retrieval
- **Error Handling**: Test API failures and recovery scenarios

### User Acceptance Testing
- **Narrative Quality**: Evaluate generated narrative coherence
- **Parameter Effectiveness**: Test different flow types and settings
- **Privacy Compliance**: Verify local LLM preference behavior

### Performance Testing
- **Large Datasets**: Test with 100+ dream entries
- **Token Efficiency**: Measure prompt token usage optimization
- **Streaming Performance**: Validate real-time output responsiveness

## Success Metrics

### Technical Metrics
- **Response Time**: < 30 seconds for typical narrative generation
- **Token Efficiency**: < 50% of raw dream content token count
- **Error Rate**: < 5% for valid dream data inputs
- **Local LLM Adoption**: > 60% of users prefer local processing

### User Experience Metrics
- **Feature Adoption**: > 40% of users try narrative weaving within 30 days
- **Narrative Quality**: > 4.0/5.0 average user satisfaction
- **Template Usage**: > 20% of users create custom recipes
- **Re-generation Rate**: < 30% of users need multiple attempts

### Privacy & Performance Metrics
- **Local Processing**: > 80% of narratives generated locally
- **API Cost**: < $0.10 average per narrative (for API users)
- **Privacy Compliance**: 100% compliance with data handling warnings

## Resource Requirements

### Development Resources
- **Senior TypeScript Developer**: 8-12 weeks full-time
- **UI/UX Specialist**: 2-4 weeks for design and testing
- **Testing Resources**: 1-2 weeks for comprehensive testing

### Infrastructure Needs
- **LLM Testing**: Access to various LLM APIs for testing
- **Local LLM Setup**: Development environment with Ollama
- **Performance Testing**: Test data sets of varying sizes

### Documentation Requirements
- **User Guides**: Setup instructions, parameter explanations
- **Developer Docs**: Architecture decisions, extension patterns
- **Privacy Documentation**: Data handling and security practices

## Future Enhancement Roadmap

### Phase 4: Advanced AI Features (Future)
- **Multi-Model Support**: Support for additional LLM providers
- **Narrative Analysis**: Quality scoring and improvement suggestions
- **Interactive Editing**: In-line narrative editing with AI assistance
- **Dream Insight Generation**: AI-powered pattern recognition

### Phase 5: Community Features (Future)
- **Template Marketplace**: Share and discover narrative recipes
- **Collaborative Narratives**: Multi-user dream narrative projects
- **Export Enhancements**: Rich format exports with illustrations

### Phase 6: Advanced Integrations (Future)
- **Voice Narration**: Text-to-speech integration
- **Visual Narratives**: Image generation integration
- **Cross-Platform Sync**: Narrative templates across devices

## Conclusion

This implementation plan provides a structured approach to delivering the Narrative Weaving feature while maintaining OneiroMetrics' architectural principles and user privacy focus. The phased approach allows for iterative delivery and user feedback incorporation, ensuring the final feature meets user needs effectively.

The emphasis on local-first LLM processing addresses privacy concerns while the flexible architecture supports future enhancements and integrations. By leveraging existing OneiroMetrics patterns and infrastructure, development risk is minimized while maintaining UI consistency.