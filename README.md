# Kaleidoscope

This single-page application allows users to design customized patterns on a hexagonal grid. Users can create patterns that tessellate or entirely freeform designs. This project is implemented using [ReactJS](https://reactjs.org/) and bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

Latest build hosted at: [https://hexplanet.com/kaleidoscope](https://hexplanet.com/kaleidoscope)

## Features

This application has multiple modes of operation. In all modes, scrolling the page will allow the user to zoom in or out.

### Tessellation Mode

Users can select a collection of hexagons from the grid to form a tile. The application will automatically determine valid tessellations (repeating patterns that will cover the whole grid). The user can then view these tessellations.

### Freestyle Mode

Users can choose a color for each hexagon in the grid using a suite of editing tools. Users may modify, remove, and delete colors. Clicking and dragging will allow users to edit multiple hexagons successively. Keyboard controls are as follows:

- `Ctrl (Cmd) + z`: Undo previous action
- `Ctrl (Cmd) + y`: Redo previous action
- `Shift + click and drag`: Pan around the grid
