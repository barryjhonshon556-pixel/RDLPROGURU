'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { adminFetch } from '@/lib/admin-fetch';
import { TIME_SLOTS, type TimeSlotIndex } from '@/hooks/useResults';

interface SlotEdit {
  result: string;
}

export default function EditAllSlots() {
  const [slots, setSlots] = useState<SlotEdit[]>(
    TIME_SLOTS.map(() => ({ result: '' }))
  );
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch today's results
  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await adminFetch('/api/results/today');
        if (!res.ok) throw new Error('Failed to fetch results');
        const json = await res.json();

        if (json.slots) {
          const newSlots = TIME_SLOTS.map((_ts, idx) => {
            const found = json.slots.find(
              (s: { slotIndex?: number }) => s.slotIndex === idx + 1
            );
            return {
              result: found?.result !== null && found?.result !== undefined ? String(found.result) : '',
            };
          });
          setSlots(newSlots);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, []);

  const updateSlot = useCallback((index: number, value: string) => {
    const sanitized = value.replace(/[^0-9]/g, '');
    const clamped = sanitized === '' ? '' : String(Math.min(99, parseInt(sanitized, 10)));

    setSlots((prev) => {
      const next = [...prev];
      next[index] = { result: clamped };
      return next;
    });
  }, []);

  const handleSave = async () => {
    // Build slots data for the bulk API
    const slotsArray: { slotIndex: number; result: number | null }[] = [];
    for (let i = 0; i < slots.length; i++) {
      const val = slots[i].result === '' ? null : parseInt(slots[i].result, 10);

      if (val !== null && (val < 0 || val > 99)) {
        toast.error(`Slot ${i + 1}: Number must be 0-99`);
        return;
      }

      slotsArray.push({ slotIndex: i + 1, result: val });
    }

    setSaving(true);
    try {
      const res = await adminFetch('/api/results/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slots: slotsArray }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save results');
      toast.success('All slots saved successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save results');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Edit All Time Slots</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {TIME_SLOTS.map((slot) => (
            <Card key={slot.index} className="border border-gray-200">
              <CardContent className="p-3 space-y-3">
                <div className="h-5 w-20 bg-gray-100 rounded animate-pulse" />
                <div className="h-9 bg-gray-100 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Edit All Time Slots</h2>
        <Card className="border border-red-200 bg-red-50">
          <CardContent className="p-4 text-red-600 text-sm">
            Error loading results: {error}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-semibold text-gray-800">Edit All Time Slots</h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {TIME_SLOTS.map((slot, idx) => (
          <Card key={slot.index} className="border border-gray-200 shadow-sm">
            <CardContent className="p-3 space-y-2.5">
              <p className="text-sm font-semibold text-blue-600 text-center">
                {slot.label}
              </p>
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500">Result</Label>
                <Input
                  type="number"
                  min={0}
                  max={99}
                  placeholder="-"
                  value={slots[idx].result}
                  onChange={(e) => updateSlot(idx, e.target.value)}
                  disabled={saving}
                  className="h-9 text-center text-sm"
                  aria-label={`${slot.label} Result Number`}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 text-white h-11"
        >
          {saving ? (
            <span className="flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" />
              Saving...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Save className="size-4" />
              Save All Results
            </span>
          )}
        </Button>
        <p className="text-xs text-gray-500">
          Edit multiple time slots and save them together
        </p>
      </div>
    </div>
  );
}
