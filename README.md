# W&B AI UI [🧪 experimental]

Generate UIs to interact with W&B data, using AI.

# Usage

Run claude code

```
claude
```

Give it a prompt like the one below.

After the initial app is generated, there will probably be some errors. Ask Claude to fix them until there aren't anymore.

# Example prompt

(Currently takes about $6 to generate with claude opus4, and then another $20 or so to fix the errors)

Hi, we're going to create a web app for doing different types of analyses on top of data stored in Weights & Biases Weave.

There is a library for querying weave data in wandbaiuilib. Make sure to read its README.md.

App framing:

- top bar
  - secure api key entry for configuring the weave api
  - project picker, a text field a user can type the weave project name into
  - top bar content should be remembered across reloads
- tab sidebar for different tools

Studio tool

- a sticky left side bar
  - choose a dataset version from a searchable dropdown
  - choose one or more evaluations that ran with that dataset from a searchable dropdown
  - a selection state for which dataset row (can be null) is currently selected in the content area
- data:
  - predict*and_score calls from the selected evals. inputs/output/summary can be nested objects and should be flattened (join with “*”)
- urls:
  - studio tool state should all be stored in the URL so we can refresh and get back to the same page, and share links
- content area with two tabs
  - tab "table” with a table
    - one row per example in the dataset
    - columns:
      - dataset columns
      - then all the columns from the eval predict_and_score tables, interleaved (column name <eval_name>-<flattened_key>)
    - should have a nice column chooser, multi-sort, and filtering
    - clicking a row in the table should set the selection state to that row, and open the example view drawer
  - tab “plots” with automatic plots
    - top area where user can select
      - x-axis, a key to a numeric value
      - y-axis, one of Value, Running Sum, Running Avg
      - show dots, a toggle
      - chart searchbox, filter down charts by regex search over chart title
    - sticky legend area on left side
      - colored toggles that user can use to toggle on or off evals on the plot
    - auto plots (no title)
      - generated line plots for every plottable (numeric) y-axis value, against the set x-axis
      - each plot has one colored line per eval
      - plots should have a vertical cross hair
      - clicking an x-position should select the nearest points dataset row in the selection state
  - example view drawer, should have a toggle in the right side of the area where the table and charts tabs are
    - has a picker for which eval to show predict_and_score call from,
    - shows a single predict_and_score call (from current selection and eval picker state) with a nice nested json data viewer.
    - has a link to the weave ui like `https://wandb.ai/shawn/<project>/weave/calls/${callId}`

Framework: Material UI Premium

Look and feel:

- dense, modern, sleek, dark
