/**
 * Example usage of the enhanced AvatarUpload component
 * This file demonstrates various ways to use the component
 * and showcases the mobile-optimized features.
 */

'use client';

import React, { useState } from 'react';
import AvatarUpload from './AvatarUpload';

export default function AvatarUploadExample() {
  const [avatarUrl, setAvatarUrl] = useState<string>('');

  const handleAvatarUpload = (url: string) => {
    setAvatarUrl(url);
    console.log('Avatar uploaded:', url);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-calm-900 mb-2">
          Enhanced AvatarUpload Component
        </h1>
        <p className="text-calm-600">
          Mobile-optimized avatar upload with drag-and-drop, camera capture, and accessibility features
        </p>
      </div>

      {/* Standard Usage */}
      <div className="bg-white border border-calm-200 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-calm-900 mb-4">Standard Usage</h2>
        <AvatarUpload
          currentAvatar={avatarUrl}
          onUpload={handleAvatarUpload}
        />
      </div>

      {/* With Custom Styling */}
      <div className="bg-calm-50 border border-calm-200 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-calm-900 mb-4">With Custom Styling</h2>
        <AvatarUpload
          currentAvatar={avatarUrl}
          onUpload={handleAvatarUpload}
          className="bg-white rounded-2xl p-4 shadow-soft"
        />
      </div>

      {/* Features Overview */}
      <div className="bg-white border border-calm-200 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-calm-900 mb-4">Key Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <h3 className="font-medium text-calm-800">📱 Mobile Optimized</h3>
            <ul className="text-calm-600 space-y-1">
              <li>• Touch-friendly 44px+ targets</li>
              <li>• Responsive sizing</li>
              <li>• Camera capture on mobile</li>
              <li>• Image orientation fixing</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-medium text-calm-800">🎯 Enhanced UX</h3>
            <ul className="text-calm-600 space-y-1">
              <li>• Drag and drop support</li>
              <li>• Visual feedback states</li>
              <li>• Progress indicators</li>
              <li>• Success/error messages</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-medium text-calm-800">♿ Accessibility</h3>
            <ul className="text-calm-600 space-y-1">
              <li>• ARIA labels and roles</li>
              <li>• Keyboard navigation</li>
              <li>• Screen reader support</li>
              <li>• Focus management</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-medium text-calm-800">🛠️ Technical</h3>
            <ul className="text-calm-600 space-y-1">
              <li>• Image compression</li>
              <li>• File validation</li>
              <li>• API integration</li>
              <li>• TypeScript support</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Usage Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-blue-900 mb-4">Usage Instructions</h2>
        <div className="space-y-3 text-sm text-blue-800">
          <p>
            <strong>Desktop:</strong> Click to select files or drag and drop images onto the upload area.
          </p>
          <p>
            <strong>Mobile:</strong> Tap the upload button to select from gallery, or use the camera button to take a photo.
          </p>
          <p>
            <strong>Keyboard:</strong> Use Tab to navigate and Enter/Space to activate upload buttons.
          </p>
          <p>
            <strong>Supported formats:</strong> JPEG, PNG, WebP up to 5MB. Images are automatically compressed and optimized.
          </p>
        </div>
      </div>
    </div>
  );
}