# Performance Testing: Dummy Data Generation

## Overview
Create a system to generate realistic dummy dream journal data for performance testing and scalability validation.

## Current Status
- **Real Data Baseline**: 147 actual dream entries (100% parsing accuracy)
- **Need**: Ability to test with larger datasets (500, 1000, 5000+ entries)

## Implementation Options

### Option 1: Multiplication Script
- Take existing 147 entries and create variations
- Randomize dates across different time periods
- Vary titles with numbered suffixes
- Slightly randomize metrics (±1-2 points)
- Maintain realistic content patterns

### Option 2: Template-Based Generator
- Create dream entry templates with placeholders
- Random title generation from word lists
- Procedural dream content generation
- Realistic metrics distribution
- Proper callout structure maintenance

### Option 3: In-Memory Scaling (Debug Mode)
- Process real entries multiple times in memory
- Generate synthetic variations during testing
- No file system impact
- Quick performance validation

## Use Cases
- **Performance Benchmarking**: Test processing speed with large datasets
- **Cache Efficiency**: Validate caching systems under load
- **Worker Pool Stress Testing**: Test parallel processing limits
- **Memory Usage Validation**: Ensure system handles large datasets
- **Scalability Planning**: Identify bottlenecks before they occur

## Target Test Sizes
- 500 entries (3x real data)
- 1,000 entries (7x real data) 
- 5,000 entries (34x real data)
- 10,000+ entries (68x+ real data)

## Requirements
- Maintain realistic dream journal patterns
- Preserve callout structure integrity
- Generate valid dates and metrics
- Configurable dataset sizes
- Easy cleanup/removal of test data

## Priority
- **Medium** - Important for scalability validation
- **Post-0.11.0** - Release blocker resolved, focus on core features first

## Notes
- Real baseline of 147 entries provides solid foundation
- System currently performs perfectly at real-world scale
- Dummy data generation enables confident scaling decisions 