# SF Portal Design

A dynamic design loader for Superfiliate portal campaigns that automatically adjusts tier displays based on campaign data.

## Overview

This repository contains a JavaScript module that dynamically loads and displays appropriate tier information for Superfiliate portal campaigns. The script automatically detects campaign tiers (Rise, Radiate, Empower) based on campaign names and revenue data, then updates the UI accordingly.

## Features

- **Automatic Tier Detection**: Analyzes campaign names and revenue to determine the appropriate tier
- **Dynamic Progress Bars**: Updates progress bars based on revenue targets
- **Real-time Updates**: Responds to DOM changes and updates the display accordingly
- **Performance Optimized**: Uses debounced mutation observers for efficient updates

## File Structure

```
SF_Portal_Design/
├── Script/
│   └── Superfiliate_Dynamic_Design_loader_v6.js
├── README.md
└── .gitignore
```

## Usage

The script is designed to be loaded on Superfiliate portal pages. It automatically:

1. Waits for the React wrapper to render
2. Reads campaign data from DOM elements
3. Determines the appropriate tier based on:
   - Campaign name (containing tier keywords)
   - Revenue amount
4. Updates the UI to show the correct tier section
5. Updates progress bars with current revenue vs targets

### Tier Logic

- **Empower (T3)**: Revenue ≥ £2,500 or campaign name contains "empower"/"t3"
- **Radiate (T2)**: Revenue ≥ £500 or campaign name contains "radiate"/"t2"  
- **Rise (T1)**: Default tier for all other cases

## Configuration

The script includes configurable parameters at the top:

```javascript
const INIT_DELAY     = 600;   // ms after first paint
const MUTATION_DELAY = 150;   // ms debounce on DOM changes
```

## Requirements

- Modern web browser with ES6+ support
- Superfiliate portal environment
- DOM elements with specific IDs (see code comments for details)

## Development

This is a self-contained JavaScript module that doesn't require any build process or dependencies. Simply include the script in your HTML or load it dynamically.

## Version History

- **v6**: Current version with improved performance and reliability

## License

[Add your license information here]

## Contributing

[Add contribution guidelines here] 