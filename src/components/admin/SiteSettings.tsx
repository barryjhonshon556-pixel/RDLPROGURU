'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Settings, Phone, MessageCircle, Send, User, Megaphone, Tv, AlertTriangle, Save, Loader2, Shield, KeyRound, Download, FileJson, Database } from 'lucide-react';
import { toast } from 'sonner';
import { adminFetch } from '@/lib/admin-fetch';

interface SettingsState {
  contact_number: string;
  whatsapp_link: string;
  telegram_link: string;
  contact_name: string;
  marquee_text: string;
  banner_text: string;
  notice_text: string;
}

const defaultSettings: SettingsState = {
  contact_number: '',
  whatsapp_link: '',
  telegram_link: '',
  contact_name: '',
  marquee_text: '',
  banner_text: '',
  notice_text: '',
};

export default function SiteSettings() {
  const [settings, setSettings] = useState<SettingsState>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // Export state
  const [exporting, setExporting] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await adminFetch('/api/settings');
      if (!res.ok) throw new Error('Failed to fetch settings');
      const data = await res.json();
      setSettings({
        contact_number: data.contact_number || '',
        whatsapp_link: data.whatsapp_link || '',
        telegram_link: data.telegram_link || '',
        contact_name: data.contact_name || '',
        marquee_text: data.marquee_text || '',
        banner_text: data.banner_text || '',
        notice_text: data.notice_text || '',
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const entries = Object.entries(settings).map(([key, value]) => ({
        key,
        value,
      }));

      const res = await adminFetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: entries }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save settings');

      toast.success('Settings saved successfully!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('All password fields are required');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New password and confirm password do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }

    setChangingPassword(true);
    try {
      const res = await adminFetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to change password');

      toast.success('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const updateField = (key: keyof SettingsState, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleExport = async (type: string, url: string) => {
    setExporting(type);
    try {
      const res = await adminFetch(url);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Export failed');
      }

      // Get filename from Content-Disposition header
      const disposition = res.headers.get('Content-Disposition');
      let filename = `rdl-export-${type}.json`;
      if (disposition) {
        const match = disposition.match(/filename="?([^";]+)"?/);
        if (match) filename = match[1];
      }

      // Create blob and trigger download
      const blob = await res.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);

      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} exported successfully!`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Settings className="size-5 text-purple-600" />
          <h2 className="text-lg font-semibold text-gray-800">Site Settings</h2>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-purple-500" />
          <span className="ml-2 text-gray-500">Loading settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Settings className="size-5 text-purple-600" />
        <h2 className="text-lg font-semibold text-gray-800">Site Settings</h2>
      </div>

      {/* Contact Information */}
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-gray-800">
            <Phone className="size-4 text-purple-500" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact_number" className="text-gray-700 flex items-center gap-1.5">
                <Phone className="size-3.5 text-gray-400" />
                Contact Number (Call/WhatsApp)
              </Label>
              <Input
                id="contact_number"
                type="text"
                placeholder="e.g., +91 98765 43210"
                value={settings.contact_number}
                onChange={(e) => updateField('contact_number', e.target.value)}
                disabled={saving}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_name" className="text-gray-700 flex items-center gap-1.5">
                <User className="size-3.5 text-gray-400" />
                Contact Person Name
              </Label>
              <Input
                id="contact_name"
                type="text"
                placeholder="e.g., RDL Pro Admin"
                value={settings.contact_name}
                onChange={(e) => updateField('contact_name', e.target.value)}
                disabled={saving}
                className="h-11"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="whatsapp_link" className="text-gray-700 flex items-center gap-1.5">
                <MessageCircle className="size-3.5 text-gray-400" />
                WhatsApp Link
              </Label>
              <Input
                id="whatsapp_link"
                type="url"
                placeholder="e.g., https://wa.me/919876543210"
                value={settings.whatsapp_link}
                onChange={(e) => updateField('whatsapp_link', e.target.value)}
                disabled={saving}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telegram_link" className="text-gray-700 flex items-center gap-1.5">
                <Send className="size-3.5 text-gray-400" />
                Telegram Group Link
              </Label>
              <Input
                id="telegram_link"
                type="url"
                placeholder="e.g., https://t.me/rdlpro"
                value={settings.telegram_link}
                onChange={(e) => updateField('telegram_link', e.target.value)}
                disabled={saving}
                className="h-11"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Announcements */}
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-gray-800">
            <Megaphone className="size-4 text-purple-500" />
            Announcements
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="marquee_text" className="text-gray-700 flex items-center gap-1.5">
              <Megaphone className="size-3.5 text-gray-400" />
              Marquee Text / Announcement
            </Label>
            <Input
              id="marquee_text"
              type="text"
              placeholder="e.g., Welcome to RDL Pro Matka - Fastest Results Here!"
              value={settings.marquee_text}
              onChange={(e) => updateField('marquee_text', e.target.value)}
              disabled={saving}
              className="h-11"
            />
            <p className="text-xs text-gray-500">
              Separate multiple items with | (pipe) for different colored announcements in the scrolling ticker
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="banner_text" className="text-gray-700 flex items-center gap-1.5">
              <Tv className="size-3.5 text-gray-400" />
              Live Result Banner Text
            </Label>
            <Input
              id="banner_text"
              type="text"
              placeholder="e.g., RDL PRO LIVE RESULT TODAY"
              value={settings.banner_text}
              onChange={(e) => updateField('banner_text', e.target.value)}
              disabled={saving}
              className="h-11"
            />
            <p className="text-xs text-gray-500">
              This text appears as the header for the live result section
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Notice */}
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-gray-800">
            <AlertTriangle className="size-4 text-red-500" />
            Important Notice
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="notice_text" className="text-gray-700">
              Notice Text (displayed in red warning section)
            </Label>
            <Textarea
              id="notice_text"
              placeholder="e.g., ⚠️ Warning: This is for informational purposes only..."
              value={settings.notice_text}
              onChange={(e) => updateField('notice_text', e.target.value)}
              disabled={saving}
              rows={4}
              className="resize-y"
            />
            <p className="text-xs text-gray-500">
              This text appears in the red warning/notice section on the public page
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-purple-600 hover:bg-purple-700 text-white h-11 px-6"
        >
          {saving ? (
            <span className="flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" />
              Saving...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Save className="size-4" />
              Save Settings
            </span>
          )}
        </Button>
      </div>

      {/* Data Export */}
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-gray-800">
            <Database className="size-4 text-purple-500" />
            Data Export
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
          <p className="text-sm text-gray-500">
            Download your data as JSON files for backup purposes.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Button
              onClick={() => handleExport('charts', '/api/export/charts')}
              disabled={exporting !== null}
              variant="outline"
              className="h-auto py-3 px-4 flex flex-col items-center gap-2 border-gray-200 hover:border-purple-300 hover:bg-purple-50"
            >
              {exporting === 'charts' ? (
                <Loader2 className="size-5 animate-spin text-purple-500" />
              ) : (
                <FileJson className="size-5 text-purple-500" />
              )}
              <span className="text-sm font-medium">Export All Charts</span>
              <span className="text-[10px] text-gray-400">All months & days</span>
            </Button>

            <Button
              onClick={() => handleExport('today', '/api/export/today')}
              disabled={exporting !== null}
              variant="outline"
              className="h-auto py-3 px-4 flex flex-col items-center gap-2 border-gray-200 hover:border-green-300 hover:bg-green-50"
            >
              {exporting === 'today' ? (
                <Loader2 className="size-5 animate-spin text-green-500" />
              ) : (
                <Download className="size-5 text-green-500" />
              )}
              <span className="text-sm font-medium">Today&apos;s Results</span>
              <span className="text-[10px] text-gray-400">Current day only</span>
            </Button>

            <Button
              onClick={() => handleExport('settings', '/api/export/settings')}
              disabled={exporting !== null}
              variant="outline"
              className="h-auto py-3 px-4 flex flex-col items-center gap-2 border-gray-200 hover:border-orange-300 hover:bg-orange-50"
            >
              {exporting === 'settings' ? (
                <Loader2 className="size-5 animate-spin text-orange-500" />
              ) : (
                <Settings className="size-5 text-orange-500" />
              )}
              <span className="text-sm font-medium">Export Settings</span>
              <span className="text-[10px] text-gray-400">Site configuration</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Security - Password Change */}
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-gray-800">
            <Shield className="size-4 text-purple-500" />
            Security
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="current_password" className="text-gray-700 flex items-center gap-1.5">
                <KeyRound className="size-3.5 text-gray-400" />
                Current Password
              </Label>
              <Input
                id="current_password"
                type="password"
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={changingPassword}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new_password" className="text-gray-700 flex items-center gap-1.5">
                <KeyRound className="size-3.5 text-gray-400" />
                New Password
              </Label>
              <Input
                id="new_password"
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={changingPassword}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm_password" className="text-gray-700 flex items-center gap-1.5">
                <KeyRound className="size-3.5 text-gray-400" />
                Confirm New Password
              </Label>
              <Input
                id="confirm_password"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={changingPassword}
                className="h-11"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              onClick={handleChangePassword}
              disabled={changingPassword}
              className="bg-purple-600 hover:bg-purple-700 text-white h-11 px-6"
            >
              {changingPassword ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  Changing...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <KeyRound className="size-4" />
                  Change Password
                </span>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
