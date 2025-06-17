# Weave UI Library

A React library for accessing W&B Weave data with caching and hooks.

## Setup

Before using any Weave functions or hooks, you must configure the API client with your API key:

```typescript
import { configureWeaveApi } from "./weaveuilib/apiUtils";

// Configure the API client at the start of your application
configureWeaveApi({
  apiKey: "your-wandb-api-key-here", // Get this from your W&B settings
  baseUrl: "https://trace.wandb.ai", // Optional, defaults to this
});
```

### Safe API Key Handling for Web Apps

For web applications, **never hard-code API keys**. Here are recommended approaches:

#### Option 1: Environment Variables (Build-time)

```typescript
// For build-time configuration (most common)
configureWeaveApi({
  apiKey: process.env.REACT_APP_WANDB_API_KEY!,
});
```

#### Option 2: Runtime Configuration

```typescript
// For runtime configuration (user provides key)
function ApiKeySetup() {
  const [apiKey, setApiKey] = useState("");

  const handleSetup = () => {
    configureWeaveApi({ apiKey });
  };

  return (
    <div>
      <input
        type="password"
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
        placeholder="Enter your W&B API key"
      />
      <button onClick={handleSetup}>Configure API</button>
    </div>
  );
}
```

#### Option 3: Server Proxy (Most Secure)

For production web applications, consider using a server proxy that handles the API key server-side:

```typescript
// Your API calls go through your server instead of directly to W&B
configureWeaveApi({
  apiKey: "not-needed-when-using-proxy",
  baseUrl: "https://your-server.com/api/weave-proxy",
});
```

## Usage

### Basic Hook Usage

```typescript
import { useWeaveCalls } from "./weaveuilib/weaveData";

function MyComponent() {
  const { loading, result } = useWeaveCalls({
    projectId: "your-project-id",
    filter: {
      op_names: ["your-operation-name"],
    },
  });

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {result.map((call) => (
        <div key={call.id}>{call.op_name}</div>
      ))}
    </div>
  );
}
```


### Multiple Queries

```typescript
import { useWeaveCallsMultiple } from "./weaveuilib/weaveData";

function MultipleQueriesComponent() {
  const { loading, results } = useWeaveCallsMultiple([
    { projectId: "project1", filter: { op_names: ["op1"] } },
    { projectId: "project2", filter: { op_names: ["op2"] } },
  ]);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {results.map((result, index) => (
        <div key={index}>
          Query {index + 1}: {result.length} calls
        </div>
      ))}
    </div>
  );
}
```

### Cache Management

```typescript
import { useClearWeaveCache } from "./weaveuilib/weaveData";

function CacheManagement() {
  const clearCache = useClearWeaveCache();

  return <button onClick={clearCache}>Clear Cache</button>;
}
```

## Features

- **Automatic Caching**: All API calls are cached in IndexedDB for better performance
- **React Hooks**: Easy-to-use hooks for data fetching
- **TypeScript Support**: Full type safety
- **Parallel Queries**: Support for multiple concurrent queries
- **Deep Memoization**: Efficient re-rendering only when data actually changes

## Build System Requirements

This library requires specific build system configurations to work properly:

### Required Dependencies

Install the required peer dependencies:

```bash
npm install react @types/react
```

### TypeScript Configuration

Your `tsconfig.json` must include these minimum compiler options:

```json
{
  "compilerOptions": {
    "target": "es2018",
    "lib": ["es2018", "dom"],
    "module": "esnext",
    "moduleResolution": "node",
    "jsx": "react-jsx",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "skipLibCheck": true
  }
}
```

### Build Tools Compatibility

The library works with these build tools:

- **Vite**: Fully supported (recommended)
- **Create React App**: Fully supported  
- **Next.js**: Supported (requires DOM APIs, so use client-side only)
- **Webpack**: Supported with appropriate loaders
- **Custom builds**: Must support ES2018+ features and DOM APIs

### Browser Requirements

This library uses modern web APIs and requires:

- **IndexedDB**: For caching functionality
- **Fetch API**: For HTTP requests  
- **Promises**: ES2018+ async/await support
- **Modern browsers**: Chrome 63+, Firefox 58+, Safari 12+, Edge 79+

For older browser support, you'll need polyfills for these features.

## Important Notes

### CORS Configuration

**Web applications using this library must run on `localhost:3000`** due to CORS policies configured on the Weave API server. If you're using Vite, configure your development server to use port 3000:

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
})
```

For other development servers, ensure they're configured to run on port 3000 to avoid CORS issues.

## Weave Data Model for Analysis Applications

This section describes key patterns for building analysis applications that work with datasets and evaluations.

### Core Data Types

**Calls**: Function execution records accessed via `useWeaveCalls`. Each call has:
- `id`: Unique call identifier
- `project_id`: The W&B project ID (e.g., `entity/project`)
- `op_name`: Weave reference to the operation (e.g., `weave:///entity/project/op/function_name:v1`)
- `display_name`: Human-readable name for the call (especially useful for evaluations)
- `trace_id`: ID linking related calls in the same trace
- `parent_id`: Parent call ID for nested operations
- `started_at`: ISO timestamp string when the call started
- `ended_at`: Optional ISO timestamp string when the call completed
- `inputs`: JSON object with key-value pairs `{[key: string]: any}` containing input parameters
- `output`: JSON value (any valid JSON type) containing results returned by the function
- `summary`: JSON object with key-value pairs `{[key: string]: any}` containing aggregated metrics
- `attributes`: JSON object with key-value pairs `{[key: string]: any}` containing metadata
- `wb_user_id`: The W&B user who initiated the call

**Datasets**: Objects with `base_object_classes: ["Dataset"]`. Each dataset has:
- `digest`: Unique identifier for the dataset version
- `val.rows`: Reference to a Weave table containing the actual data rows
- `object_id`: The dataset name/identifier
- `version_index`: Version number of the dataset (display as `v${version_index}`, e.g., v0, v1, v2)

**Evaluations**: Represented as calls with `op_names: ["Evaluation.evaluate"]`. Each evaluation has:
- `id`: Unique call identifier  
- `display_name`: Human-readable name for the evaluation run
- `inputs.self`: Reference to the evaluation object (contains `_type`, `_class_name`, `dataset` reference, etc.)
- `inputs.model`: Reference to the model being evaluated (contains `_type`, `_class_name`, model configuration)
- `inputs.nTrials`: Number of trials to run per example
- `inputs.maxConcurrency`: Maximum concurrent operations
- Child calls that contain the actual prediction and scoring results

**Tables**: Accessed via `useWeaveTable(digest, {projectId})`. Tables contain:
- `digest`: Row identifier for matching with evaluation results
- `val`: The actual data content for that row

### Dataset and Evaluation Workflow

1. **Fetch Datasets**: Use `useWeaveObjects` with `base_object_classes: ["Dataset"]`
   ```typescript
   // Get all versions of all datasets
   const { result: allDatasetVersions } = useWeaveObjects({
     projectId: "entity/project",
     filter: {
       base_object_classes: ["Dataset"],
       latest_only: false  // Set to false to get all versions
     }
   });
   
   // Get only latest versions
   const { result: latestDatasets } = useWeaveObjects({
     projectId: "entity/project",
     filter: {
       base_object_classes: ["Dataset"],
       latest_only: true  // Default behavior
     }
   });
   ```
   
2. **Fetch Evaluations**: Use `useWeaveCalls` with `op_names: ["Evaluation.evaluate"]` and `expandColumns: ["inputs.self", "inputs.model"]`
3. **Load Dataset Rows**: Extract table digest from `dataset.val.rows` using `parseWeaveRef`, then use `useWeaveTable`
4. **Fetch Predict/Score Results**: Use `useWeaveCallsMultiple` with `filter: { parent_ids: [evalCall.id] }` and `expandColumns: ["inputs.example"]`

### Joining Dataset Examples with Evaluation Results

Evaluation results are linked to dataset examples through:
- Each predict/score call has `inputs.example._ref` pointing to a specific table row
- Extract the row digest from the reference using `parseWeaveRef(exampleRef).artifactRefExtra`
- Match this digest with the `digest` field from table rows

### Data Structure Patterns

**Call Output Structure**: Evaluation calls contain flattened results in:
- `call.output`: JSON value containing prediction results, scores, and other evaluation outputs
- `call.summary`: JSON object `{[key: string]: any}` containing aggregated metrics and summary information
- `call.inputs`: JSON object `{[key: string]: any}` containing input parameters (e.g., `inputs.self`, `inputs.model`, `inputs.example`)
- `call.attributes`: JSON object `{[key: string]: any}` containing call metadata

**Multi-trial Evaluations**: Some evaluations run multiple trials per example:
- Group calls by dataset example digest
- Create separate rows for each trial index
- Flatten call output/summary data with eval-specific prefixes

### Working with Weave References

Many fields contain full Weave references (e.g., `weave:///entity/project/op/function_name:v1`) rather than simple names. Use `parseWeaveRef` to extract components and `objRef` to create references:

```typescript
import { parseWeaveRef } from "./weaveuilib/parseRef";
import { objRef } from "./weaveuilib/apiUtils";

// Extract operation name from call.op_name
const parsed = parseWeaveRef(call.op_name);
const operationName = parsed.artifactName; // "function_name"

// Extract table digest from dataset.val.rows  
const tableDigest = parseWeaveRef(dataset.val.rows).artifactVersion;

// Extract row digest from evaluation result reference
// Note: inputs is a JSON object, so you'll need to cast or use type assertions
const rowDigest = parseWeaveRef((call.inputs as any).example._ref).artifactRefExtra?.split("/").pop();

// Create object reference from dataset object
const datasetRef = objRef(selectedDataset);

// Filter evaluations that ran on a specific dataset
// Note: Currently there's no server-side filtering for evaluations by dataset,
// so you need to fetch all evaluations first and filter client-side
const datasetEvaluations = evaluations.filter((call) => {
  // The dataset field contains a Weave reference string like:
  // "weave:///entity/project/object/dataset_name:v1"
  return (call.inputs as any)?.self?.dataset === objRef(selectedDataset);
});

// The dataset reference might be missing if:
// - The evaluation was created without a dataset
// - The evaluation uses a different input structure
// - The dataset was deleted after the evaluation ran
const evaluationsWithoutDataset = evaluations.filter((call) => {
  return !(call.inputs as any)?.self?.dataset;
});
```

### Practical Examples: Accessing Evaluation Data

When working with evaluation calls, here's how to access common properties:

```typescript
// Fetch evaluations
const { result: evaluations } = useWeaveCalls({
  projectId: "entity/project",
  filter: { op_names: ["Evaluation.evaluate"] },
  expandColumns: ["inputs.self", "inputs.model"]
});

// Access evaluation properties
evaluations.forEach(evaluation => {
  // Basic properties
  const evalName = evaluation.display_name; // Human-readable name
  const evalId = evaluation.id;
  const projectId = evaluation.project_id;
  
  // Model information
  const modelClass = (evaluation.inputs as any).model._class_name; // e.g., "SWEBenchTaskPerformer"
  const modelType = (evaluation.inputs as any).model._type;
  
  // Evaluation configuration
  const nTrials = (evaluation.inputs as any).nTrials;
  const maxConcurrency = (evaluation.inputs as any).maxConcurrency;
  
  // Dataset reference
  const datasetRef = (evaluation.inputs as any).self.dataset;
});
```

### Performance Considerations

- Use `latest_only: false` when you need all dataset versions
- Use `expandColumns` to avoid additional API calls for referenced objects
- Leverage the caching system for repeated queries
- Use `useWeaveCallsMultiple` for parallel fetching of related data

## Working with JSON Object Types

**Important Note**: Due to the dynamic nature of Weave data, the TypeScript interfaces use generic `object` types for `inputs`, `output`, `summary`, and `attributes`. These fields contain JSON data with the following structures:

- **`inputs`**: `{[key: string]: any}` - Key-value pairs of input parameters
- **`output`**: Any valid JSON value (string, number, boolean, object, array, null)
- **`summary`**: `{[key: string]: any}` - Key-value pairs of aggregated metrics  
- **`attributes`**: `{[key: string]: any}` - Key-value pairs of metadata

When accessing nested properties, you'll need to use type assertions like `(call.inputs as any).self.object_id` since TypeScript cannot statically validate the structure of dynamic JSON data.
