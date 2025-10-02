"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MediumEditor } from './medium-editor';
import { 
  Save, 
  Eye, 
  EyeOff, 
  Upload,
  Tag,
  User,
  Calendar,
  Globe,
  Lock,
  Settings,
  Send
} from 'lucide-react';
import { useTranslations } from '@/hooks/useTranslations';

interface MediumBlogCreatorProps {
  initialData?: {
    title: string;
    content: string;
    excerpt: string;
    featuredImage: string;
    category: string;
    tags: string[];
    author: string;
    authorEmail: string;
    published: boolean;
    featured: boolean;
  };
  onSave: (data: any) => Promise<void>;
  onPublish?: (data: any) => Promise<void>;
  loading?: boolean;
}

export function MediumBlogCreator({ 
  initialData, 
  onSave, 
  onPublish, 
  loading = false 
}: MediumBlogCreatorProps) {
  const { t } = useTranslations();
  const [showPreview, setShowPreview] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    content: initialData?.content || '',
    excerpt: initialData?.excerpt || '',
    featuredImage: initialData?.featuredImage || '',
    category: initialData?.category || 'COMMUNITY',
    tags: initialData?.tags || [],
    author: initialData?.author || '',
    authorEmail: initialData?.authorEmail || '',
    published: initialData?.published || false,
    featured: initialData?.featured || false,
  });

  const [newTag, setNewTag] = useState('');

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const handleSave = async () => {
    await onSave(formData);
  };

  const handlePublish = async () => {
    if (onPublish) {
      await onPublish({ ...formData, published: true });
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900">
              {initialData ? t('admin.blog.medium.editStory') : t('admin.blog.medium.writeStory')}
            </h1>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center space-x-2"
              >
                {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                <span>{showPreview ? t('admin.blog.medium.hidePreview') : t('admin.blog.medium.preview')}</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
                className="flex items-center space-x-2"
              >
                <Settings className="w-4 h-4" />
                <span>{t('admin.blog.medium.settings')}</span>
              </Button>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              onClick={handleSave}
              disabled={loading}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Save Draft</span>
            </Button>
            {onPublish && (
              <Button
                onClick={handlePublish}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 text-white flex items-center space-x-2"
              >
                <Send className="w-4 h-4" />
                <span>Publish</span>
              </Button>
            )}
          </div>
        </div>

        {/* Title Input */}
        <div className="mb-6">
          <Input
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            placeholder="Title your story..."
            className="text-3xl font-bold border-none shadow-none p-0 focus:ring-0 placeholder:text-gray-400"
          />
        </div>

        {/* Excerpt Input */}
        <div className="mb-6">
          <Input
            value={formData.excerpt}
            onChange={(e) => handleInputChange('excerpt', e.target.value)}
            placeholder="What's this story about?"
            className="text-lg text-gray-600 border-none shadow-none p-0 focus:ring-0 placeholder:text-gray-400"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Editor */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-0">
              <MediumEditor
                content={formData.content}
                onChange={(content) => handleInputChange('content', content)}
                placeholder="Tell your story..."
                className="min-h-[500px]"
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Settings Panel */}
          {showSettings && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Story Settings</CardTitle>
                <CardDescription>Configure your story details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Featured Image */}
                <div>
                  <Label className="text-sm font-medium">Featured Image</Label>
                  <Input
                    value={formData.featuredImage}
                    onChange={(e) => handleInputChange('featuredImage', e.target.value)}
                    placeholder="Image URL"
                    className="mt-1"
                  />
                </div>

                {/* Category */}
                <div>
                  <Label className="text-sm font-medium">Category</Label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="COMMUNITY">Community</option>
                    <option value="ANNOUNCEMENTS">Announcements</option>
                    <option value="TECH">Tech</option>
                  </select>
                </div>

                {/* Tags */}
                <div>
                  <Label className="text-sm font-medium">Tags</Label>
                  <div className="flex space-x-2 mt-1">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Add tag"
                      className="flex-1"
                    />
                    <Button onClick={addTag} size="sm" variant="outline">
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center space-x-1">
                        <span>{tag}</span>
                        <button
                          onClick={() => removeTag(tag)}
                          className="ml-1 hover:text-red-500"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Author Info */}
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium">Author</Label>
                    <Input
                      value={formData.author}
                      onChange={(e) => handleInputChange('author', e.target.value)}
                      placeholder="Author name"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Author Email</Label>
                    <Input
                      value={formData.authorEmail}
                      onChange={(e) => handleInputChange('authorEmail', e.target.value)}
                      placeholder="author@example.com"
                      type="email"
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Options */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="featured"
                      checked={formData.featured}
                      onChange={(e) => handleInputChange('featured', e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <Label htmlFor="featured" className="text-sm">Featured Story</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Preview Panel */}
          {showPreview && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Preview</CardTitle>
                <CardDescription>How your story will appear</CardDescription>
              </CardHeader>
              <CardContent>
                {formData.title && (
                  <div className="space-y-4">
                    {formData.featuredImage && (
                      <div className="w-full h-48 bg-gray-200 rounded-lg overflow-hidden">
                        <img
                          src={formData.featuredImage}
                          alt="Preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    
                    <div>
                      <h2 className="text-xl font-bold mb-2">{formData.title}</h2>
                      <p className="text-gray-600 mb-4">{formData.excerpt}</p>
                      <div className="text-sm text-gray-500 space-y-1">
                        <p>Author: {formData.author}</p>
                        <p>Category: {formData.category}</p>
                        {formData.tags.length > 0 && (
                          <p>Tags: {formData.tags.join(', ')}</p>
                        )}
                        <div className="flex gap-2">
                          {formData.published && <Badge>Published</Badge>}
                          {formData.featured && <Badge variant="destructive">Featured</Badge>}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Publishing Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <Globe className="w-5 h-5" />
                <span>Publishing</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Status</span>
                  <Badge variant={formData.published ? "default" : "secondary"}>
                    {formData.published ? "Published" : "Draft"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Visibility</span>
                  <div className="flex items-center space-x-1">
                    <Globe className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-green-600">Public</span>
                  </div>
                </div>
                {formData.featured && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Featured</span>
                    <Badge variant="destructive">Yes</Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

