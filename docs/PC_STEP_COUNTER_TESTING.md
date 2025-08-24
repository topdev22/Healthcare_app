# PC Step Counter Testing Guide

## 🖥️ Testing Step Counter Functionality on PC

Since PCs don't have built-in accelerometers like mobile devices, we've created a comprehensive simulation environment for testing the step counting functionality during development.

## 🚀 Quick Start

### 1. **Automatic Detection**
The app automatically detects when running on PC and switches to simulator mode:
- ✅ **PC/Desktop Browser**: Uses step counter simulator
- ✅ **Mobile Device**: Uses real accelerometer sensors
- ✅ **Web Mobile**: Uses DeviceMotionEvent API

### 2. **Access Testing Interface**
- Open your health app in a desktop browser
- Look for the "PC開発環境" panel in the health dashboard
- Click "テスト画面を開く" to open the testing interface
- Or navigate directly to `/pc-testing`

## 🎮 Testing Methods

### **Method 1: Keyboard Controls (Recommended)**

| Key | Action | Description |
|-----|--------|-------------|
| `SPACEBAR` | +1 step | Add single step (natural walking) |
| `ENTER` | +10 steps | Add 10 steps (jogging pace) |
| `D` | +100 steps | Debug mode - bulk steps |
| `A` | Toggle auto-walk | Enable/disable automatic step generation |
| `↑` `↓` | Speed control | Adjust walking speed (slow/normal/fast/running) |
| `R` | Reset | Reset step count to 0 |
| `S` | Start/Stop | Toggle step counting |

### **Method 2: UI Controls**

The testing interface provides:
- **Manual step addition** with custom amounts
- **Auto-walk simulation** with speed control
- **Preset walking scenarios** (10min walk, 30min lunch walk, 45min jog)
- **Real-time speed adjustment** via sliders

### **Method 3: Console Commands**

Access the simulator directly via browser console:

```javascript
// Start counting
window.stepCounterSimulator.startCounting()

// Add steps manually  
window.stepCounterSimulator.addSteps(50)

// Simulate 15-minute normal walk
window.stepCounterSimulator.simulateWalkingSession(15, 'normal')

// Reset everything
window.stepCounterSimulator.resetStepCount()
```

## 📊 Testing Scenarios

### **Basic Functionality Tests**

1. **Step Detection**
   ```
   1. Click "開始" to start counting
   2. Press SPACEBAR 10 times
   3. Verify: Steps = 10, Calories ≈ 0.45, Distance ≈ 7.5m
   ```

2. **Auto-walk Simulation**
   ```
   1. Start counting
   2. Click "自動歩行" or press 'A'
   3. Verify: Steps increase automatically
   4. Test different speeds (slow/normal/fast/running)
   ```

3. **Persistence Test**
   ```
   1. Add some steps
   2. Refresh the page
   3. Verify: Step count is preserved (same day)
   ```

### **Advanced Scenario Tests**

1. **Morning Walk (10 minutes)**
   - Expected: ~750 steps, ~34 calories, ~0.56km

2. **Lunch Walk (30 minutes, fast pace)**
   - Expected: ~3000 steps, ~135 calories, ~2.25km

3. **Evening Jog (45 minutes)**
   - Expected: ~6750 steps, ~304 calories, ~5.06km

## 🔧 Development Features

### **Real-time Monitoring**
- Live step count updates
- Calories calculation (0.045 cal/step)
- Distance estimation (0.75m/step)
- Activity level classification
- Session time tracking

### **Debug Information**
Open browser console (F12) to see:
- Step detection events
- Speed changes
- Auto-walk status
- Simulation progress
- Error messages

### **Data Persistence**
- Steps stored in browser local storage
- Automatic daily reset
- Session data preserved across page reloads

## 📱 Integration Testing

### **Testing with Real Components**

The simulator integrates seamlessly with:
- `StepsDisplay` component
- `useStepCounter` hook
- `useStepCounterWithGoals` hook
- Dashboard statistics
- Health data logging

### **Cross-platform Testing**

1. **Desktop Development**
   ```bash
   npm run dev
   # Opens in browser - uses simulator
   ```

2. **Mobile Testing**
   ```bash
   npm run android:dev
   # or
   npm run ios:dev
   # Uses real device sensors
   ```

## 🎯 Test Cases Checklist

### ✅ **Basic Functionality**
- [ ] Step counting starts/stops correctly
- [ ] Manual step addition works
- [ ] Keyboard shortcuts respond
- [ ] Auto-walk functions properly
- [ ] Reset clears all data

### ✅ **UI Integration**
- [ ] StepsDisplay shows correct data
- [ ] Progress bar updates
- [ ] Calories calculation accurate
- [ ] Distance estimation reasonable
- [ ] Activity level classification

### ✅ **Data Persistence**
- [ ] Steps saved across sessions
- [ ] Daily reset works correctly
- [ ] No data loss on refresh

### ✅ **Performance**
- [ ] No memory leaks during long sessions
- [ ] Smooth animation/updates
- [ ] Keyboard events cleanup properly
- [ ] No console errors

## 🐛 Troubleshooting

### **Common Issues**

1. **Keyboard shortcuts not working**
   - Ensure the page has focus
   - Click somewhere on the page first
   - Check browser console for errors

2. **Steps not updating**
   - Verify step counting is started
   - Check if auto-walk is accidentally enabled
   - Refresh page and try again

3. **Data not persisting**
   - Check browser storage permissions
   - Verify local storage is not disabled
   - Clear browser cache and retry

### **Reset Everything**
```javascript
// Complete reset via console
localStorage.removeItem('simulatedStepData')
window.location.reload()
```

## 🔄 Integration with Main App

The simulator automatically integrates with your existing step counter code:

```typescript
// This code works on both PC (simulator) and mobile (real sensors)
import { useStepCounterWithGoals } from '@/hooks/useStepCounter';

function MyComponent() {
  const { stepData, stats, startCounting } = useStepCounterWithGoals({
    dailyGoal: 10000,
    enableNotifications: true,
    autoStart: true
  });

  // stepData.steps will be:
  // - Real steps on mobile devices
  // - Simulated steps on PC
}
```

## 🌟 Best Practices

1. **Test on PC First**: Develop and debug using the simulator
2. **Verify on Mobile**: Always test final functionality on real devices
3. **Use Realistic Data**: Don't add thousands of steps instantly
4. **Test Edge Cases**: Try rapid clicking, long sessions, page refreshes
5. **Monitor Performance**: Watch for memory usage during extended testing

---

Happy testing! 🚶‍♂️💻✨
