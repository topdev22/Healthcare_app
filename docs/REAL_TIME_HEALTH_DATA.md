# Real-Time Health Data Implementation

## Overview

This implementation provides real-time health data updates using WebSocket connections and polling fallbacks. The system automatically updates health statistics when new data is added or existing data is modified.

## Features

- **Real-time Updates**: Health data updates automatically via WebSocket connections
- **Polling Fallback**: Automatic polling when WebSocket is not available
- **Live Indicators**: Visual indicators show when data is being updated in real-time
- **Manual Refresh**: Users can manually refresh data
- **Error Handling**: Graceful fallback to sample data when API is unavailable
- **Test Mode**: Simulation button for testing real-time updates

## Components

### 1. useRealTimeHealthData Hook

Located in `hooks/useRealTimeHealthData.ts`, this hook provides:

- Real-time health data fetching
- WebSocket event handling
- Automatic polling fallback
- Data transformation and statistics calculation
- Error handling with fallback data

#### Usage

```typescript
import { useRealTimeHealthData } from '@/hooks/useRealTimeHealthData';

function MyComponent() {
  const { 
    realTimeStats, 
    todayData, 
    recentData, 
    loading, 
    error, 
    lastUpdate, 
    refreshData,
    simulateUpdate 
  } = useRealTimeHealthData(currentUser);

  // Use the data in your component
}
```

### 2. HealthStats Component

Updated `components/HealthStats.tsx` to use real-time data:

- Real-time data display
- Live update indicators
- Manual refresh button
- Test simulation button
- Error state handling

### 3. WebSocket API Integration

Enhanced `lib/api.ts` with health-specific WebSocket methods:

- `subscribeToHealthUpdates()`: Subscribe to health data updates
- `unsubscribeFromHealthUpdates()`: Unsubscribe from updates
- `onHealthDataUpdate()`: Listen for data updates
- `onNewHealthLog()`: Listen for new health logs
- `onHealthLogUpdated()`: Listen for log updates

## WebSocket Events

The system listens for these WebSocket events:

- `health_data_updated`: General health data updates
- `new_health_log`: New health log entries
- `health_log_updated`: Updated health log entries

## Data Flow

1. **Initial Load**: Component loads health data from API
2. **WebSocket Connection**: Establishes WebSocket connection for real-time updates
3. **Event Listening**: Listens for health-related events
4. **Data Updates**: Automatically updates UI when events are received
5. **Polling Fallback**: Polls API every 30 seconds if WebSocket is unavailable
6. **Manual Refresh**: Users can manually refresh data

## Real-Time Features

### Live Indicators
- Green pulsing dot shows real-time connection status
- Timestamp shows last update time
- Loading spinner during data refresh

### Automatic Updates
- Weight changes
- Mood updates
- Calorie tracking
- Water intake
- Health log counts
- Streak calculations

### Error Handling
- Graceful fallback to sample data
- Error messages for failed requests
- Retry mechanisms

## Testing

### Test Button
The "🧪 テスト更新" button simulates real-time updates by:
- Generating random weight values (69-71 kg)
- Random mood selection
- Random calorie values (1500-2000 cal)
- Immediate UI updates

### Manual Testing
1. Click the test button to see real-time updates
2. Check the live indicator shows recent update time
3. Verify data changes immediately in the UI
4. Test manual refresh button
5. Check error handling by disconnecting network

## Configuration

### Environment Variables
```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000
```

### Polling Interval
Default polling interval is 30 seconds. Can be modified in `useRealTimeHealthData.ts`:

```typescript
const pollInterval = setInterval(() => {
  // Polling logic
}, 30000); // 30 seconds
```

## Backend Requirements

The backend should emit these WebSocket events:

```javascript
// When health data is updated
socket.emit('health_data_updated', updatedData);

// When new health log is created
socket.emit('new_health_log', newLogData);

// When health log is updated
socket.emit('health_log_updated', updatedLogData);
```

## Performance Considerations

- WebSocket connections are automatically managed
- Polling only occurs when WebSocket is unavailable
- Data is cached locally to reduce API calls
- Event listeners are properly cleaned up on component unmount

## Future Enhancements

- Real-time notifications for health goals
- Live charts and graphs
- Collaborative health tracking
- Push notifications for health reminders
- Offline data synchronization
