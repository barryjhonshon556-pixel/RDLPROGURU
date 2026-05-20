'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Upload, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { adminFetch } from '@/lib/admin-fetch';
import {
  TIME_SLOTS,
  getCurrentTimeSlot,
  type TimeSlotIndex,
} from '@/hooks/useResults';

export default function PostResult() {
  const [currentSlot, setCurrentSlot] = useState<TimeSlotIndex>(1);
  const [currentLabel, setCurrentLabel] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [resultNumber, setResultNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [quickLoading, setQuickLoading] = useState(false);

  useEffect(() => {
    const { index, label } = getCurrentTimeSlot();
    setCurrentSlot(index);
    setCurrentLabel(label);
    setSelectedSlot(String(index));
  }, []);

  const validateNumber = (value: string): number | null => {
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 0 || num > 99) return null;
    return num;
  };

  const handlePost = async () => {
    const result = validateNumber(resultNumber);

    if (result === null) {
      toast.error('Please enter a valid number (0-99)');
      return;
    }

    const slot = (selectedSlot ? parseInt(selectedSlot, 10) : currentSlot) as TimeSlotIndex;

    setLoading(true);
    try {
      const res = await adminFetch('/api/results/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timeSlot: slot, result }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to post result');

      toast.success(`Result posted for slot ${slot}`);
      setResultNumber('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to post result');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPost = async () => {
    setQuickLoading(true);
    try {
      const res = await adminFetch('/api/results/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timeSlot: currentSlot, result: 0 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to quick post');

      toast.success(`Quick post for slot ${currentSlot} - edit to update number`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to quick post');
    } finally {
      setQuickLoading(false);
    }
  };

  const activeSlotLabel = selectedSlot
    ? TIME_SLOTS[parseInt(selectedSlot, 10) - 1]?.label
    : currentLabel;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-gray-800">
          Post Result for: RDL Pro {activeSlotLabel || currentLabel}
        </h2>
        <Button
          onClick={handleQuickPost}
          disabled={quickLoading}
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {quickLoading ? (
            <span className="size-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Zap className="size-3.5" />
          )}
          Post the result for the current time slot
        </Button>
      </div>

      <Card className="border border-gray-200 shadow-sm">
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="resultNumber" className="text-gray-700">
              Result Number (0-99)
            </Label>
            <Input
              id="resultNumber"
              type="number"
              min={0}
              max={99}
              placeholder="e.g., 45"
              value={resultNumber}
              onChange={(e) => setResultNumber(e.target.value)}
              disabled={loading}
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-gray-700">Select Time Slot (if different)</Label>
            <Select value={selectedSlot || String(currentSlot)} onValueChange={setSelectedSlot}>
              <SelectTrigger className="w-full sm:w-64 h-11">
                <SelectValue placeholder="Select time slot" />
              </SelectTrigger>
              <SelectContent>
                {TIME_SLOTS.map((slot) => (
                  <SelectItem key={slot.index} value={String(slot.index)}>
                    {slot.label} (Slot {slot.index})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handlePost}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white h-11"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Posting...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Upload className="size-4" />
                Post Result
              </span>
            )}
          </Button>

          <p className="text-xs text-gray-500">
            Enter the result number for the selected time slot
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
