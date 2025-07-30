import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Scale, Smile, Utensils, Save } from 'lucide-react';

interface HealthLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: HealthLogData) => void;
}

interface HealthLogData {
  weight?: number;
  mood: string;
  energy: number;
  sleep: number;
  water: number;
  notes?: string;
  foodItems?: string[];
}

export default function HealthLogModal({ isOpen, onClose, onSave }: HealthLogModalProps) {
  const [logData, setLogData] = useState<HealthLogData>({
    mood: 'neutral',
    energy: 5,
    sleep: 8,
    water: 8,
    foodItems: []
  });

  const [foodInput, setFoodInput] = useState('');

  const moodOptions = [
    { value: 'excited', label: 'Excited', emoji: '🤩' },
    { value: 'happy', label: 'Happy', emoji: '😊' },
    { value: 'neutral', label: 'Neutral', emoji: '😐' },
    { value: 'sad', label: 'Sad', emoji: '😢' },
    { value: 'anxious', label: 'Anxious', emoji: '😰' },
  ];

  const handleSave = () => {
    onSave(logData);
    onClose();
    // Reset form
    setLogData({
      mood: 'neutral',
      energy: 5,
      sleep: 8,
      water: 8,
      foodItems: []
    });
    setFoodInput('');
  };

  const addFoodItem = () => {
    if (foodInput.trim()) {
      setLogData(prev => ({
        ...prev,
        foodItems: [...(prev.foodItems || []), foodInput.trim()]
      }));
      setFoodInput('');
    }
  };

  const removeFoodItem = (index: number) => {
    setLogData(prev => ({
      ...prev,
      foodItems: prev.foodItems?.filter((_, i) => i !== index) || []
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-health-green" />
            Log Your Health Data
          </DialogTitle>
          <DialogDescription>
            Track your daily wellness metrics to help your character grow!
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Stats</TabsTrigger>
            <TabsTrigger value="mood">Mood & Energy</TabsTrigger>
            <TabsTrigger value="food">Food & Notes</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  placeholder="70.0"
                  value={logData.weight || ''}
                  onChange={(e) => setLogData(prev => ({ ...prev, weight: parseFloat(e.target.value) || undefined }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sleep">Sleep Hours</Label>
                <Input
                  id="sleep"
                  type="number"
                  min="0"
                  max="24"
                  value={logData.sleep}
                  onChange={(e) => setLogData(prev => ({ ...prev, sleep: parseInt(e.target.value) || 0 }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="water">Water Glasses</Label>
                <Input
                  id="water"
                  type="number"
                  min="0"
                  max="20"
                  value={logData.water}
                  onChange={(e) => setLogData(prev => ({ ...prev, water: parseInt(e.target.value) || 0 }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Energy Level (1-10)</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm">1</span>
                  <Input
                    type="range"
                    min="1"
                    max="10"
                    value={logData.energy}
                    onChange={(e) => setLogData(prev => ({ ...prev, energy: parseInt(e.target.value) }))}
                    className="flex-1"
                  />
                  <span className="text-sm">10</span>
                </div>
                <p className="text-center text-sm font-medium">{logData.energy}/10</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="mood" className="space-y-4">
            <div className="space-y-4">
              <Label className="text-base font-medium flex items-center gap-2">
                <Smile className="w-4 h-4" />
                How are you feeling today?
              </Label>
              
              <RadioGroup
                value={logData.mood}
                onValueChange={(value) => setLogData(prev => ({ ...prev, mood: value }))}
                className="grid grid-cols-1 gap-3"
              >
                {moodOptions.map((option) => (
                  <div key={option.value} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-accent">
                    <RadioGroupItem value={option.value} id={option.value} />
                    <Label htmlFor={option.value} className="flex items-center gap-3 cursor-pointer flex-1">
                      <span className="text-2xl">{option.emoji}</span>
                      <span className="font-medium">{option.label}</span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </TabsContent>

          <TabsContent value="food" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium flex items-center gap-2 mb-3">
                  <Utensils className="w-4 h-4" />
                  What did you eat today?
                </Label>
                
                <div className="flex gap-2 mb-3">
                  <Input
                    placeholder="e.g., Grilled chicken salad"
                    value={foodInput}
                    onChange={(e) => setFoodInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addFoodItem()}
                  />
                  <Button type="button" onClick={addFoodItem} variant="outline">
                    Add
                  </Button>
                </div>
                
                {logData.foodItems && logData.foodItems.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Food Items:</Label>
                    <div className="space-y-1">
                      {logData.foodItems.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                          <span className="text-sm">{item}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFoodItem(index)}
                            className="h-auto p-1 text-destructive hover:text-destructive"
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="How did you feel today? Any symptoms or observations?"
                  value={logData.notes || ''}
                  onChange={(e) => setLogData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSave} className="flex-1 flex items-center gap-2">
            <Save className="w-4 h-4" />
            Save Health Log
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
