// Shared TypeScript interfaces for health data
// This file defines the data structures used between frontend and backend
// Helper type guards
export function isWeightLog(data) {
    return 'weight' in data;
}
export function isMoodLog(data) {
    return 'mood' in data;
}
export function isSleepLog(data) {
    return 'hours' in data;
}
export function isWaterLog(data) {
    return 'amount' in data && 'unit' in data;
}
export function isFoodLog(data) {
    return 'name' in data && 'calories' in data && 'meal' in data;
}
export function isExerciseLog(data) {
    return 'exerciseType' in data && 'duration' in data;
}
export function isMedicationLog(data) {
    return 'medicationName' in data && 'dosage' in data;
}
//# sourceMappingURL=health.js.map