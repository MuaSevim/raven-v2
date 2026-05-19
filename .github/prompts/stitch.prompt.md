# STITCH GENERATION PROTOCOL

## CONTEXT INGESTION
You must strictly adhere to the visual rules defined in our design system. 
Parse the following context before generating UI:
- Primary Rules: [Read `docs/DESIGN_SYSTEM.md`]
- Component Specs: [Read `docs/COMPONENTS.md`]

## TASK
Generate the React Native (Expo) code for the attached component/screen. 

## CONSTRAINTS
1. Ensure all hex codes match the monochromatic palette exactly. Do not use default blue or green status colors.
2. Use absolute precision regarding the 8px spacing scale.
3. Output only the targeted component requested. Do not hallucinate surrounding navigation wrappers.