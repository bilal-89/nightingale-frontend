# Core Infrastructure

This directory contains fundamental application infrastructure that supports all features of our web-based DAW.

## Directory Structure

- `config/`: Application-wide configuration and constants
- `types/`: Shared type definitions used across features
- `utils/`: Common utility functions for time, audio, and other shared concerns

## Usage Guidelines

1. Core Infrastructure Principles:
   - Only place truly shared code here
   - Maintain backward compatibility
   - Document all changes
   - Keep dependencies minimal

2. When to Add Code Here:
   - The functionality is used by multiple features
   - The code defines fundamental application behavior
   - The types or utilities are part of the core domain

3. Code Standards:
   - Write comprehensive documentation
   - Include type definitions
   - Add unit tests for utilities
   - Maintain pure functions when possible
